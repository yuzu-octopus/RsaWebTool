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
  // For e=3 to be valid RSA, gcd(3, phi) must be 1, i.e. 3 ∤ (p-1)(q-1).
  // Reject primes p where p ≡ 1 (mod 3) so that 3 ∤ (p-1). Combined with the
  // same for q, we get gcd(3, phi) = 1 and the generator returns e=3 (not 5, 7, ...).
  let p: bigint, q: bigint;
  do {
    p = randomPrime(TESTCASE_BITS.p);
    q = randomPrime(TESTCASE_BITS.q);
  } while (p === q || p % 3n === 1n || q % 3n === 1n);
  if (p > q) [p, q] = [q, p];
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const e = 3n;
  const d = modInverse(e, phi);
  if (d === null) throw new Error('modInverse failed for e=3');
  const m = 12345n;
  const c = modPow(m, e, n);
  return { p, q, n, e, d, phi, m, c };
}

/**
 * Generate a Hastad Broadcast testcase: 3 separate moduli (same m, e=3),
 * 3 separate ciphertexts. The attack uses CRT to recover m^3, then takes the
 * cube root. Each modulus is a separate keypair so the CRT is well-defined.
 */
export function generateHastadBroadcastTestcase(): { n1: bigint; n2: bigint; n3: bigint; e: bigint; c1: bigint; c2: bigint; c3: bigint } {
  // Hastad's broadcast attack: same m encrypted to k=3 recipients with the same e=3.
  // The attack uses CRT on the 3 ciphertexts to recover m^3, then takes the cube root.
  const m = 12345n;
  const e = 3n;
  const kp1 = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e);
  const kp2 = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e);
  const kp3 = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e);
  const c1 = modPow(m, e, kp1.n);
  const c2 = modPow(m, e, kp2.n);
  const c3 = modPow(m, e, kp3.n);
  return { n1: kp1.n, n2: kp2.n, n3: kp3.n, e, c1, c2, c3 };
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


/**
 * Generate a small-d testcase: d < bound (default 10100).
 * This is NOT Wiener-vulnerable (Wiener requires d < n^0.25 which is much larger).
 * It's specifically for attacks that need a very small d so k = (ed-1)/phi
 * is reachable within a small kBound (e.g. partial-d key exposure).
 */
export function generateSmallDTestcase(bound: bigint = 10100n): RSAKeyPair {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const phi = (p - 1n) * (q - 1n);
  // Pick small d in [100, bound] and derive e from it
  let d = 100n + BigInt(Math.floor(Math.random() * Number(bound - 100n)));
  while (modInverse(d, phi) === null) {
    d += 1n;
  }
  const e = modInverse(d, phi)!;
  const n = p * q;
  return { p, q, n, e, d, phi };
}

/**
 * Generate a Pollard-vulnerable testcase: p is a B-smooth prime (p-1 has only
 * small factors) so Pollard's p-1 algorithm can find it in O(B) steps.
 * Returns {n, p, q} — attacks use the public n and recover p, q.
 */
export function generatePollardTestcase(): { n: bigint; p: bigint; q: bigint } {
  // S = product of first 11 primes ≈ 2^37. p-1 must be a multiple of S
  // (i.e. p ≡ 1 mod S) for Pollard p-1 to find p in O(B) steps.
  const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n];
  let S = 1n;
  for (const pr of smallPrimes) S *= pr;
  // Search p = S*t + 1 at TESTCASE_BITS size, checking primality
  let p: bigint;
  let attempts = 0;
  while (true) {
    if (attempts++ > 10000) throw new Error('Failed to find B-smooth prime');
    // p-1 must be B-smooth (all prime factors ≤ B=10000) for Pollard's p-1 to work.
    // S = product of primes ≤ 31 ≈ 2^37. Multiply by random small primes (≤ 10000)
    // to grow p-1 while keeping it smooth, then p = p-1 + 1.
    const smoothPool = [37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n, 73n, 79n, 83n, 89n, 97n, 101n];
    let pMinus1 = S;
    const extraCount = Math.floor(Math.random() * 3) + 5; // 5-7 extra primes, giving ~70 bits total
    for (let i = 0; i < extraCount; i++) {
      pMinus1 *= smoothPool[Math.floor(Math.random() * smoothPool.length)];
    }
    p = pMinus1 + 1n;
    if (isPrimeMR(p)) break;
  }
  const q = randomPrime(TESTCASE_BITS.q);
  return { n: p * q, p, q };
}

/**
 * Generate a generic semiprime testcase: n = p * q with both primes
 * of TESTCASE_BITS size. Used by factoring attacks that don't need a
 * specific edge case (Euler, SQUFOF, quadratic sieve, ECM, etc.).
 * Returns full RSAKeyPair so attacks that also encrypt a message can do so.
 */
export function generateSemiprimeTestcase(): RSAKeyPair {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const e = 65537n;
  const d = modInverse(e, phi);
  if (d === null) throw new Error('modInverse failed for semiprime');
  return { p, q, n, e, d, phi };
}
