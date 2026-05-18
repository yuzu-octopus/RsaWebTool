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
