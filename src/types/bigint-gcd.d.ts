declare module 'bigint-gcd' {
  interface BigIntGcd {
    (a: bigint, b: bigint): bigint;
    gcdext(a: bigint, b: bigint): [x: bigint, y: bigint, gcd: bigint];
    halfgcd(a: bigint, b: bigint): [a: bigint, b: bigint, c: bigint, d: bigint, u: bigint, v: bigint];
  }

  const gcd: BigIntGcd;
  export default gcd;
}
