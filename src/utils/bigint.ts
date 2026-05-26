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
 * Integer k-th root (floor) via Newton's method.
 * Returns the largest integer r such that r^k <= n.
 * Convergence: O(log log n) iterations for small k.
 */
export function iroot(n: bigint, k: bigint): bigint {
  if (n < 0n) throw new RangeError('iroot: negative input');
  if (n < 2n || k <= 1n) return n;
  if (k === 2n) return isqrt(n);

  // Approximate bit length (rounded up to nearest 4)
  const bitLen = BigInt(n.toString(16).length) * 4n;
  // If root < 2, answer is trivially 1 (since n >= 2n was handled above)
  if (bitLen < k) return 1n;

  // Newton's method with initial guess ≈ n^(1/k)
  let x = 1n << (bitLen / k);
  if (x < 2n) x = 2n;
  const k1 = k - 1n;
  let x1 = ((x * k1) + (n / (x ** k1))) / k;
  while (x1 < x) {
    x = x1;
    x1 = ((x * k1) + (n / (x ** k1))) / k;
  }
  // Correct possible off-by-one (rare with good initial guess)
  while ((x + 1n) ** k <= n) x++;
  while (x ** k > n) x--;
  return x;
}
