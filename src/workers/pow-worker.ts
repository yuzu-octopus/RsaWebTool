/**
 * Hashcash-style Proof of Work solver.
 * Finds a nonce such that SHA256(challenge + nonce) has the required
 * number of leading zero bits.
 *
 * Designed to run in a Web Worker (pure computation, no DOM).
 * Can also be imported and run on the main thread.
 */

export interface PoWInput {
  challenge: string;
  difficulty: number; // number of leading zero bits required
}

export interface PoWResult {
  nonce: string;
  hash: string;
  attempts: number;
}

/**
 * Check if `hashArray` has at least `difficulty` leading zero bits.
 */
function checkLeadingZeros(hashArray: Uint8Array, difficulty: number): boolean {
  const fullBytes = Math.floor(difficulty / 8);
  const remainingBits = difficulty % 8;

  // Check full zero bytes
  for (let i = 0; i < fullBytes; i++) {
    if (hashArray[i] !== 0) return false;
  }

  // Check partial byte (if any)
  if (remainingBits > 0) {
    const maxVal = 1 << (8 - remainingBits); // max allowed value for the partial byte
    if (hashArray[fullBytes] >= maxVal) return false;
  }

  return true;
}

/**
 * Solve a Hashcash-style PoW challenge.
 *
 * @param input - The challenge string and difficulty (in bits).
 * @param signal - Optional AbortSignal to cancel the search.
 * @param onProgress - Optional callback for progress updates (0-99).
 * @returns The nonce and hash on success, or null if aborted or max attempts reached.
 */
export async function solvePoW(
  input: PoWInput,
  signal?: AbortSignal,
  onProgress?: (pct: number, detail?: string) => void,
): Promise<PoWResult | null> {
  const { challenge, difficulty } = input;
  const encoder = new TextEncoder();
  let nonce = 0;
  const maxAttempts = 1 << 24; // ~16.7M attempts cap
  const reportInterval = Math.max(1, Math.floor(maxAttempts / 100));

  while (nonce < maxAttempts) {
    if (signal?.aborted) return null;

    const data = encoder.encode(challenge + nonce.toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (checkLeadingZeros(hashArray, difficulty)) {
      return { nonce: nonce.toString(), hash: hashHex, attempts: nonce + 1 };
    }

    nonce++;

    if (onProgress && nonce % reportInterval === 0) {
      onProgress(
        Math.min(99, (nonce / maxAttempts) * 100),
        `Attempts: ${nonce.toLocaleString()}`,
      );
    }
  }

  return null; // no solution found within maxAttempts
}
