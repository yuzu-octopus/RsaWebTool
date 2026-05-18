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

  const bits = x.toString(2).length;
  let n = 1n << BigInt(Math.floor(bits / 2));

  while (true) {
    const n1 = (n + x / n) >> 1n;
    if (n1 >= n) break;
    n = n1;
  }

  while ((n + 1n) * (n + 1n) <= x) n++;
  while (n * n > x) n--;

  return n;
}

/**
 * Extended Euclidean Algorithm.
 * Returns { gcd, x, y } such that a*x + b*y = gcd.
 */
export function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
  if (a === 0n) return { gcd: b, x: 0n, y: 1n };
  const { gcd, x: x1, y: y1 } = extendedGcd(b % a, a);
  return { gcd, x: y1 - (b / a) * x1, y: x1 };
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
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
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
