import gcdFn from 'bigint-gcd';

/**
 * Parse a hex string into a bigint, with or without the `0x` prefix,
 * ignoring whitespace. Empty or whitespace-only input returns 0n.
 *
 * Consolidates the 5+ inlined copies of this pattern that previously
 * lived in ECC and DH calculator attack tabs.
 */
export function parseHex(s: string): bigint {
  const clean = s.trim().replace(/\s/g, '');
  if (!clean || clean === '0x' || clean === '0X') return 0n;
  return BigInt(clean.toLowerCase().startsWith('0x') ? clean : '0x' + clean);
}

/**
 * Greatest common divisor (Lehmer's algorithm, ~3x faster than Euclidean on 512-bit).
 * gcd(0, 0) = 0 by convention.
 */
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  return gcdFn(a, b);
}

/**
 * Integer square root (floor) via Newton's method with Horwat initial guess.
 * Returns the largest n such that n^2 <= x.
 */
export function isqrt(x: bigint): bigint {
  if (x < 0n) throw new RangeError('isqrt: negative input');
  if (x < 2n) return x;

  // Horwat initial guess: 1 << (bitLength >> 1)
  // Approximate bit length via hex characters (faster than toString(2))
  const bitLen = BigInt(x.toString(16).length) * 4n;
  let n = 1n << (bitLen >> 1n);
  let n1 = (n + x / n) >> 1n;
  while (n1 < n) {
    n = n1;
    n1 = (n + x / n) >> 1n;
  }
  return n;
}

/**
 * Extended Euclidean Algorithm using Lehmer's method.
 * Returns { gcd, x, y } such that a*x + b*y = gcd.
 * Inputs are normalized to non-negative values internally.
 */
export function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
  const aNeg = a < 0n;
  const bNeg = b < 0n;
  a = aNeg ? -a : a;
  b = bNeg ? -b : b;
  const [x, y, g] = gcdFn.gcdext(a, b);
  return { gcd: g, x: aNeg ? -x : x, y: bNeg ? -y : y };
}

/**
 * Modular inverse of a mod m, or null if no inverse exists.
 * m must be non-zero; a negative m is normalized via |m|.
 */
export function modInverse(a: bigint, m: bigint): bigint | null {
  if (m === 0n) throw new RangeError('modInverse: modulus must be non-zero');
  const M = m < 0n ? -m : m;
  const { gcd, x } = extendedGcd(((a % M) + M) % M, M);
  if (gcd !== 1n) return null;
  return ((x % M) + M) % M;
}

/**
 * Modular exponentiation with possibly-negative exponent.
 * Non-negative exponents delegate to modPow; negative exponents use the
 * modular inverse, returning null when the base is non-invertible.
 */
export function modPowNeg(base: bigint, exp: bigint, mod: bigint): bigint | null {
  if (exp >= 0n) return modPow(base, exp, mod);
  const inv = modInverse(base, mod);
  if (inv === null) return null;
  return modPow(inv, -exp, mod);
}

/**
 * Modular exponentiation: base^exp mod mod.
 * exp must be non-negative.
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (exp < 0n) throw new RangeError('modPow: negative exponent not supported');
  if (mod <= 0n) throw new RangeError('modPow: modulus must be positive');
  if (mod === 1n) return 0n;
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

/**
 * Integer k-th root (floor) via Newton's method with binary search
 * correction. Returns the largest integer r such that r^k <= n.
 * Guaranteed to terminate in O(k log n) time (no linear correction loops).
 */
export function iroot(n: bigint, k: bigint): bigint {
  if (n < 0n) throw new RangeError('iroot: negative input');
  if (k < 1n) throw new RangeError('iroot: k must be >= 1');
  if (n < 2n || k === 1n) return n;
  if (k === 2n) return isqrt(n);

  // Approximate bit length (rounded up to nearest 4)
  const bitLen = BigInt(n.toString(16).length) * 4n;
  if (bitLen < k) return 1n;

  // Fast pow helper for small k (avoids binary exponentiation overhead)
  const pow = (v: bigint): bigint => {
    if (k === 3n) return v * v * v;
    if (k === 5n) { const v2 = v * v; return v2 * v2 * v; }
    return v ** k;
  };

  // Newton's method with initial guess ≈ n^(1/k)
  let x = 1n << (bitLen / k);
  if (x < 2n) x = 2n;
  const k1 = k - 1n;
  let x1 = ((x * k1) + (n / (x ** k1))) / k;
  while (x1 < x) {
    x = x1;
    x1 = ((x * k1) + (n / (x ** k1))) / k;
  }
  // After Newton converges (x1 >= x):
  //   x = value at or below the true root
  //   x1 = value at or above the true root
  // Binary search between x and x1 for exact floor root
  let lo = x;
  let hi = x1;
  // Extend hi if it's not an upper bound (x1 may still be ≤ true root)
  while (pow(hi) <= n) {
    lo = hi;
    hi = hi * 2n;
  }
  // Binary search for the largest r with r^k <= n
  while (lo + 1n < hi) {
    const mid = (lo + hi) / 2n;
    if (pow(mid) <= n) lo = mid;
    else hi = mid;
  }
  // Final off-by-one guard (should never trigger, but safe)
  while (pow(lo + 1n) <= n) lo++;
  while (pow(lo) > n) lo--;
  return lo;
}

/**
 * Exact integer e-th root of v, or null when v is not a perfect e-th power.
 * e must be >= 1.
 */
export function exactNthRoot(v: bigint, e: bigint): bigint | null {
  const r = iroot(v, e);
  return r ** e === v ? r : null;
}

/**
 * Simple continued fraction expansion of num/den as BigInt partial quotients.
 * A negative denominator is normalized via sign flip.
 */
export function continuedFraction(num: bigint, den: bigint): bigint[] {
  if (den === 0n) throw new RangeError('continuedFraction: zero denominator');
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const cf: bigint[] = [];
  while (den !== 0n) {
    // BigInt / truncates toward zero; adjust to floor division.
    let q = num / den;
    if (num % den !== 0n && ((num < 0n) !== (den < 0n))) q -= 1n;
    cf.push(q);
    const r = num - q * den;
    num = den;
    den = r;
  }
  return cf;
}

/** A convergent numerator/denominator pair: indexable as [num, den] with .num/.den accessors. */
export type Convergent = [bigint, bigint] & { num: bigint; den: bigint };

function makeConvergent(num: bigint, den: bigint): Convergent {
  const c = [num, den] as Convergent;
  Object.defineProperties(c, {
    num: { value: num, enumerable: false },
    den: { value: den, enumerable: false },
  });
  return c;
}

/**
 * Convergents of a simple continued fraction via the standard recurrence
 * h_{-2},h_{-1} = 0,1 and k_{-2},k_{-1} = 1,0.
 */
export function convergents(cf: bigint[]): Convergent[] {
  if (cf.length === 0) throw new RangeError('convergents: empty continued fraction');
  const out: Convergent[] = [];
  let hPrev = 0n;
  let h = 1n;
  let kPrev = 1n;
  let k = 0n;
  for (const a of cf) {
    const hNext = a * h + hPrev;
    const kNext = a * k + kPrev;
    hPrev = h;
    h = hNext;
    kPrev = k;
    k = kNext;
    out.push(makeConvergent(h, k));
  }
  return out;
}

/**
 * Wiener's attack: recover a small private exponent from (n, e) via the
 * continued fraction convergents of e/n. Each convergent k/d with
 * (e*d - 1) divisible by k yields a phi candidate; the isqrt-verified
 * quadratic p^2 - s*p + n = 0 (s = n - phi + 1) confirms the factors.
 * Returns { p, q, d, phi } with p <= q, or null when d is not small.
 */
export function wienerAttack(n: bigint, e: bigint): { p: bigint; q: bigint; d: bigint; phi: bigint } | null {
  for (const [k, d] of convergents(continuedFraction(e, n))) {
    if (k === 0n) continue;
    if ((e * d - 1n) % k !== 0n) continue;
    const phi = (e * d - 1n) / k;
    const s = n - phi + 1n;
    const disc = s * s - 4n * n;
    if (disc <= 0n) continue;
    const t = isqrt(disc);
    if (t * t !== disc) continue;
    if ((s + t) % 2n !== 0n) continue;
    const p = (s - t) / 2n;
    const q = (s + t) / 2n;
    if (p > 1n && p * q === n) return { p, q, d, phi };
  }
  return null;
}

/**
 * Chinese Remainder Theorem: find x with x ≡ remainders[i] (mod moduli[i]).
 * Moduli must be pairwise coprime and > 1. Returns null on length mismatch,
 * empty input, non-coprime moduli, or a non-invertible intermediate; the
 * result is residue-verified against every input.
 */
export function crtRSA(remainders: bigint[], moduli: bigint[]): bigint | null {
  if (remainders.length !== moduli.length || remainders.length === 0) return null;
  for (const m of moduli) {
    if (m <= 1n) return null;
  }
  for (let i = 0; i < moduli.length; i++) {
    for (let j = i + 1; j < moduli.length; j++) {
      if (gcd(moduli[i], moduli[j]) !== 1n) return null;
    }
  }
  let M = 1n;
  for (const m of moduli) M *= m;
  let x = 0n;
  for (let i = 0; i < remainders.length; i++) {
    const Mi = M / moduli[i];
    const inv = modInverse(Mi % moduli[i], moduli[i]);
    if (inv === null) return null;
    x = (x + remainders[i] * Mi * inv) % M;
  }
  x = ((x % M) + M) % M;
  for (let i = 0; i < remainders.length; i++) {
    const want = ((remainders[i] % moduli[i]) + moduli[i]) % moduli[i];
    if (x % moduli[i] !== want) return null;
  }
  return x;
}
