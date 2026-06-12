import { modPow, gcd, modInverse } from '../bigint';

export function isPrimeMR(n: bigint): boolean {
  if (n < 2n) return false;
  if (n < 4n) return true;
  if (n % 2n === 0n || n % 3n === 0n) return false;
  const smallPrimes = [5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];
  for (const p of smallPrimes) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while (d % 2n === 0n) { d /= 2n; s++; }
  const bases = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const a of bases) {
    if (a >= n) break;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) { composite = false; break; }
    }
    if (composite) return false;
  }
  return true;
}

export function randomPrime(bits: number, maxRetries = 10000): bigint {
  if (bits < 2) throw new Error('randomPrime: bits must be >= 2');
  let retries = 0;
  while (true) {
    if (retries++ >= maxRetries) throw new Error('randomPrime: failed to find prime after maxRetries attempts');
    const numBytes = Math.ceil(bits / 8);
    const bytes = new Uint8Array(numBytes);
    crypto.getRandomValues(bytes);

    // Build bigint from bytes
    let n = 0n;
    for (let i = 0; i < numBytes; i++) {
      n = (n << 8n) | BigInt(bytes[i]);
    }

    // Set top bit to ensure correct bit length
    n |= (1n << BigInt(bits - 1));
    // Ensure odd
    n |= 1n;
    // Mask to exact bit length
    n &= (1n << BigInt(bits)) - 1n;

    if (isPrimeMR(n)) return n;
  }
}

export interface RSAKeyPair {
  p: bigint;
  q: bigint;
  n: bigint;
  e: bigint;
  d: bigint;
  phi: bigint;
}

export function generateKeyPair(pBits: number, qBits: number, e: bigint = 65537n): RSAKeyPair {
  let p: bigint, q: bigint;
  do {
    p = randomPrime(pBits);
    q = randomPrime(qBits);
  } while (p === q);
  if (p > q) [p, q] = [q, p];
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  let eAdj = e;
  while (gcd(eAdj, phi) !== 1n) eAdj += 2n;
  const d = modInverse(eAdj, phi);
  if (d === null) throw new Error("modInverse failed");
  return { p, q, n, e: eAdj, d, phi };
}

export function encrypt(m: bigint, n: bigint, e: bigint): bigint {
  return modPow(m, e, n);
}

// Testcase generation defaults — change here to affect ALL attacks
export const TESTCASE_BITS = { p: 512, q: 512 }; // n ≈ 1024-bit (crackable in ~hours with GNFS, but realistic for CTF/test)


// ─── Edge-case testcase generators ──────────────────────────────────────
// Each generates a testcase that specifically exercises a particular attack.
// Attacks that need a specific edge case should import the appropriate generator
// instead of the default random keypair.

/** Generate a Fermat-vulnerable testcase: p and q are close together. */
export function generateFermatTestcase(): RSAKeyPair & { m: bigint; c: bigint } {
  // Pick p, then set q = p + small_delta so gcd(a, p-q) is small and Fermat converges fast
  const p = randomPrime(TESTCASE_BITS.p);
  const delta = 2n ** 20n; // 20-bit gap — easily factorable by Fermat in ms
  let q = p + delta;
  while (!isPrimeMR(q)) q += 2n;
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const e = 65537n;
  const d = modInverse(e, phi);
  if (d === null) throw new Error('modInverse failed');
  const m = 42n;
  const c = modPow(m, e, n);
  return { p, q, n, e, d, phi, m, c };
}

/** Generate a Hastad-vulnerable testcase: e=3, m^3 < n. */
export function generateHastadTestcase(): RSAKeyPair & { m: bigint; c: bigint } {
  // With e=3 and small m, m^3 fits in a single integer — cube root recovers m.
  const pair = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, 3n);
  const m = 12345n;
  const c = modPow(m, 3n, pair.n);
  return { ...pair, m, c };
}

/**
 * Generate a Hastad Broadcast testcase: 3 separate moduli (same m, e=3),
 * 3 separate ciphertexts. The attack uses CRT to recover m^3, then takes the
 * cube root. Each modulus is a separate keypair so the CRT is well-defined.
 */
export function generateHastadBroadcastTestcase(): { n_list: string[]; e: bigint } {
  const m = 12345n;
  const e = 3n;
  const pairs = [generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e), generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e), generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e)];
  const ciphertexts = pairs.map(p => modPow(m, e, p.n).toString());
  return { n_list: pairs.map(p => p.n.toString()), e };
}

/** Generate a Wiener-vulnerable testcase: d < n^(1/4)/3. */
export function generateWienerTestcase(): RSAKeyPair {
  // Start with a small d, then solve for e = d^-1 mod phi.
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const phi = (p - 1n) * (q - 1n);
  // d = 256 bits (well under n^1/4 ≈ 256 bits for 1024-bit n)
  const d = randomPrime(200); // Safe margin under n^(1/4)/3 for 1024-bit n
  const e = modInverse(d, phi);
  if (e === null) throw new Error('modInverse failed — d not coprime to phi');
  const n = p * q;
  return { p, q, n, e, d, phi };
}

/** Generate a multi-prime testcase: n = p * q * r. */
export function generateMultiPrimeTestcase(): { p: bigint; q: bigint; r: bigint; n: bigint; e: bigint; d: bigint; phi: bigint } {
  const p = randomPrime(256);
  const q = randomPrime(256);
  const r = randomPrime(256);
  const n = p * q * r;
  const phi = (p - 1n) * (q - 1n) * (r - 1n);
  const e = 65537n;
  const d = modInverse(e, phi);
  if (d === null) throw new Error('modInverse failed');
  return { p, q, r, n, e, d, phi };
}

/** Generate a common-prime testcase: two moduli share a prime. */
export function generateCommonPrimeTestcase(): { n1: bigint; n2: bigint; p: bigint; q1: bigint; q2: bigint } {
  const p = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  return { n1: p * q1, n2: p * q2, p, q1, q2 };
}

/** Generate a phi-leak testcase: n and phi(n) are both known. */
export function generatePhiLeakTestcase(): { n: bigint; phi: bigint; p: bigint; q: bigint; e: bigint; d: bigint } {
  // Generate a keypair where phi(n) is the leaked value. The phi-leak attack
  // takes (n, phi) and solves the quadratic p^2 - (n - phi + 1)*p + n = 0.
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const e = 65537n;
  const d = modInverse(e, phi);
  if (d === null) throw new Error('modInverse failed');
  return { p, q, n, phi, e, d };
}
