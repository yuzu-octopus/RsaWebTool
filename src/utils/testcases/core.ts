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

// Testcase generation defaults — change here to affect ALL attacks.
// 1024-bit n is representative of real RSA sizing (not of real RSA security
// practice); per-attack generators below use smaller sizes where the browser
// or SageCell needs tractability, documented at each site.
export const TESTCASE_BITS = { p: 512, q: 512 };


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
  // Each modulus comes from generateHastadTestcase, which rejects p/q = 1 mod 3 so
  // that gcd(3, phi) = 1 and e=3 is genuine key material (generateKeyPair would
  // otherwise silently bump e to 5, 7, ... while we still encrypt with 3).
  // Moduli must also be pairwise distinct, otherwise the CRT is degenerate.
  const m = 12345n;
  const e = 3n;
  const ns: bigint[] = [];
  for (let i = 0; i < 3; i++) {
    let kp = generateHastadTestcase();
    let guard = 0;
    while (ns.includes(kp.n)) {
      if (++guard > 10) throw new Error('generateHastadBroadcastTestcase: duplicate modulus');
      kp = generateHastadTestcase();
    }
    ns.push(kp.n);
  }
  const n1 = ns[0], n2 = ns[1], n3 = ns[2];
  const c1 = modPow(m, e, n1);
  const c2 = modPow(m, e, n2);
  const c3 = modPow(m, e, n3);
  return { n1, n2, n3, e, c1, c2, c3 };
}

/** Generate a Wiener-vulnerable testcase: d < n^(1/4)/3. */
export function generateWienerTestcase(maxRetries = 10): RSAKeyPair {
  // Start with a small d, then solve for e = d^-1 mod phi.
  // d is a fresh random prime, so gcd(d, phi) !== 1 (d divides p-1 or q-1)
  // is possible in principle -- resample d instead of throwing (flaky throw).
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const phi = (p - 1n) * (q - 1n);
  const n = p * q;
  const nBits = n.toString(2).length;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // d = 200 bits (well under n^1/4, about 256 bits for 1024-bit n)
    const d = randomPrime(200); // Safe margin under n^(1/4)/3 for 1024-bit n
    const e = modInverse(d, phi);
    if (e === null) continue;
    // Small d inverts to a full-size e (close to phi). A degenerate tiny e
    // would not exercise the Wiener path (continued fractions on e/n).
    if (e.toString(2).length < nBits - 8) continue;
    return { p, q, n, e, d, phi };
  }
  throw new Error('generateWienerTestcase: no suitable d after maxRetries attempts');
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
export function generateSmallDTestcase(bound: bigint = 10100n, maxRetries = 100): RSAKeyPair {
  if (bound <= 101n) throw new Error('generateSmallDTestcase: bound must exceed 101');
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const phi = (p - 1n) * (q - 1n);
  const n = p * q;
  // Rejection-sample d uniformly from [100, bound) with crypto randomness.
  // Range-sized masking keeps this BigInt-safe for huge bounds (no Number()
  // precision loss); the retry cap bounds rejection for unlucky phi.
  const range = bound - 100n;
  const rangeBits = range.toString(2).length;
  const numBytes = Math.ceil(rangeBits / 8);
  const mask = (1n << BigInt(rangeBits)) - 1n;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const bytes = new Uint8Array(numBytes);
    crypto.getRandomValues(bytes);
    let r = 0n;
    for (let i = 0; i < numBytes; i++) r = (r << 8n) | BigInt(bytes[i]);
    r &= mask;
    if (r >= range) continue;
    const d = 100n + r;
    const e = modInverse(d, phi);
    if (e === null) continue;
    return { p, q, n, e, d, phi };
  }
  throw new Error('generateSmallDTestcase: no coprime d after maxRetries attempts');
}

/**
 * Generate a Pollard-vulnerable testcase: p is a B-smooth prime (p-1 has only
 * small factors) so Pollard's p-1 algorithm can find it in O(B) steps.
 * Returns {n, p, q} — attacks use the public n and recover p, q.
 */
export function generatePollardTestcase(maxRetries = 10000): { n: bigint; p: bigint; q: bigint } {
  // p - 1 must be B-powersmooth for B = 10000 (the harness bound): every
  // *prime power* dividing p - 1 is <= B, so p - 1 divides lcm(1..B) and
  // stage 1 of Pollard's p-1 with bound B is guaranteed to find p.
  // (Plain B-smoothness is NOT enough: a factor like 2^30 slips past the
  // stage-1 prime-power cap and the browser check returns null.)
  // A uniform random 512-bit prime is smooth with negligible probability,
  // so p is built as p = t + 1 where t accumulates prime powers q^e <= B
  // until t reaches TESTCASE_BITS size. n is ~1024-bit like every other
  // testcase. (pollard-rho keeps its own custom 34-bit construction --
  // Brent rho needs a genuinely small factor to converge in the browser.)
  const B = 10000;
  const primePowers: Array<{ q: bigint; maxE: number }> = [];
  const isComposite = new Uint8Array(B + 1);
  for (let i = 2; i <= B; i++) {
    if (isComposite[i] === 1) continue;
    for (let j = i * i; j <= B; j += i) isComposite[j] = 1;
    let maxE = 1;
    let pw = BigInt(i);
    while (pw * BigInt(i) <= BigInt(B)) {
      pw *= BigInt(i);
      maxE++;
    }
    primePowers.push({ q: BigInt(i), maxE });
  }
  const targetBits = TESTCASE_BITS.p;
  let attempts = 0;
  while (true) {
    if (attempts++ > maxRetries) throw new Error('Failed to find B-smooth prime');
    // Seed with 2 so t stays even (p odd); each prime's total exponent stays
    // within its q^E <= B budget, keeping every prime power factor of p - 1
    // under the stage-1 cap.
    let t = 2n;
    // The seed contributes one factor of 2 -- record it so later q=2 draws
    // stay within the 2^E <= B budget (2^13 = 8192 <= B < 2^14 = 16384).
    const used = new Map<bigint, number>([[2n, 1]]);
    while (t.toString(2).length < targetBits - 1) {
      const pick = primePowers[Math.floor(Math.random() * primePowers.length)];
      const u = used.get(pick.q) ?? 0;
      if (u >= pick.maxE) continue;
      const e = 1 + Math.floor(Math.random() * (pick.maxE - u));
      let factor = 1n;
      for (let k = 0; k < e; k++) factor *= pick.q;
      t *= factor;
      used.set(pick.q, u + e);
    }
    if (t.toString(2).length > targetBits + 8) continue; // overshoot -- resample
    const p = t + 1n;
    if (!isPrimeMR(p)) continue;
    const q = randomPrime(TESTCASE_BITS.q);
    if (q === p) continue;
    return { n: p * q, p, q };
  }
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
