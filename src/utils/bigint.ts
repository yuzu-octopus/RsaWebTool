/**
 * Greatest common divisor (Euclidean algorithm).
 */
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Integer square root (floor) via Newton's method.
 * Returns the largest n such that n^2 <= x.
 */
export function isqrt(x: bigint): bigint {
  if (x < 0n) throw new RangeError("isqrt: negative input");
  if (x < 2n) return x;

  let n = x;
  let n1 = (n + x / n) >> 1n;
  while (n1 < n) {
    n = n1;
    n1 = (n + x / n) >> 1n;
  }

  return n;
}

/**
 * Extended Euclidean Algorithm.
 * Returns { gcd, x, y } such that a*x + b*y = gcd.
 * Inputs are normalized to non-negative values internally.
 */
export function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
  // Normalize to non-negative inputs
  const aNeg = a < 0n;
  const bNeg = b < 0n;
  a = aNeg ? -a : a;
  b = bNeg ? -b : b;

  let oldR = a, r = b;
  let oldS = 1n, s = 0n;
  let oldT = 0n, t = 1n;
  while (r !== 0n) {
    const quotient = oldR / r;
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
    [oldT, t] = [t, oldT - quotient * t];
  }
  return { gcd: oldR, x: aNeg ? -oldS : oldS, y: bNeg ? -oldT : oldT };
}

/**
 * Modular inverse of a mod m, or null if no inverse exists.
 */
export function modInverse(a: bigint, m: bigint): bigint | null {
  const { gcd, x } = extendedGcd(a < 0n ? a + m : a, m);
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
