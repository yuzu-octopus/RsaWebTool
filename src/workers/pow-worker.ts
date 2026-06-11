/**
 * Hashcash-style Proof of Work solver.
 * Finds a nonce such that SHA256(challenge + nonce) satisfies a user-defined
 * check function (or a leading-zero-bits criteria by default).
 *
 * Designed to run in a Web Worker (pure computation, no DOM).
 * Can also be imported and run on the main thread.
 */

export interface PoWInput {
  challenge: string;
  difficulty: number; // number of leading zero bits required (fallback when no checkCode)
  checkCode?: string; // optional JavaScript code for the check function: (hash: string) => boolean
  hashAlgorithm?: string; // hash algorithm name (default: SHA-256)
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
 * @param input - The challenge string, fallback difficulty, and optional user check code.
 * @param signal - Optional AbortSignal to cancel the search.
 * @param onProgress - Optional callback for progress updates (0-99).
 * @returns The nonce and hash on success, or null if aborted or max attempts reached.
 */
export async function solvePoW(
  input: PoWInput,
  signal?: AbortSignal,
  onProgress?: (pct: number, detail?: string) => void,
): Promise<PoWResult | null> {
  const { challenge, difficulty, checkCode, hashAlgorithm = 'SHA-256' } = input;
  const encoder = new TextEncoder();
  let nonce = 0;
  const maxAttempts = 1 << 24; // ~16.7M attempts cap
  const reportInterval = Math.max(1, Math.floor(maxAttempts / 100));

  // Build check function from user code, or fallback to leading-zero-bits
  let check: (hashHex: string) => boolean;
  if (checkCode) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      check = new Function('hash', checkCode) as (hashHex: string) => boolean;
    } catch (e) {
      throw new Error(`Invalid check function: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
    }
  } else {
    check = (hashHex: string) => {
      // Convert hex back to bytes for the bit-level check
      const bytes = new Uint8Array(
        hashHex.match(/.{2}/g)!.map(b => parseInt(b, 16)),
      );
      return checkLeadingZeros(bytes, difficulty);
    };
  }

  while (nonce < maxAttempts) {
    if (signal?.aborted) return null;

    const data = encoder.encode(challenge + nonce.toString());
    const hashBuffer = await crypto.subtle.digest(hashAlgorithm, data);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    try {
      if (check(hashHex)) {
        return { nonce: nonce.toString(), hash: hashHex, attempts: nonce + 1 };
      }
    } catch (e) {
      throw new Error(`Check function threw: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
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
