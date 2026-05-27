import gcdFn from 'bigint-gcd';

/**
 * Greatest common divisor (Lehmer's algorithm, ~3x faster than Euclidean on 512-bit).
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
 */
export function modInverse(a: bigint, m: bigint): bigint | null {
  const { gcd, x } = extendedGcd(((a % m) + m) % m, m);
  if (gcd !== 1n) return null;
  return ((x % m) + m) % m;
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
  if (n < 2n || k <= 1n) return n;
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
