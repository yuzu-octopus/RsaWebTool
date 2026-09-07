import { describe, test, expect } from 'bun:test';
import { gcd, modPow, modInverse, isqrt, iroot, extendedGcd, parseHex, modPowNeg, continuedFraction, convergents, wienerAttack, crtRSA, exactNthRoot } from '../bigint';

describe('parseHex', () => {
  test('parses hex without 0x prefix', () => {
    expect(parseHex('ff')).toBe(255n);
    expect(parseHex('deadbeef')).toBe(3735928559n);
  });
  test('parses hex with 0x prefix', () => {
    expect(parseHex('0xff')).toBe(255n);
    expect(parseHex('0XDEADBEEF')).toBe(3735928559n);
  });
  test('strips whitespace', () => {
    expect(parseHex('  ff  ')).toBe(255n);
    expect(parseHex('de ad be ef')).toBe(3735928559n);
  });
  test('empty or 0x returns 0n', () => {
    expect(parseHex('')).toBe(0n);
    expect(parseHex('   ')).toBe(0n);
    expect(parseHex('0x')).toBe(0n);
    expect(parseHex('0X')).toBe(0n);
  });
});

describe('gcd', () => {
  test('basic cases', () => {
    expect(gcd(12n, 8n)).toBe(4n);
    expect(gcd(8n, 12n)).toBe(4n);
    expect(gcd(54n, 24n)).toBe(6n);
  });
  test('coprime inputs return 1', () => {
    expect(gcd(7n, 13n)).toBe(1n);
    expect(gcd(17n, 19n)).toBe(1n);
  });
  test('equal inputs return the value', () => {
    expect(gcd(42n, 42n)).toBe(42n);
  });
  test('one input is 0', () => {
    expect(gcd(0n, 5n)).toBe(5n);
    expect(gcd(5n, 0n)).toBe(5n);
  });
  test('handles negative inputs (absolute value)', () => {
    expect(gcd(-12n, 8n)).toBe(4n);
    expect(gcd(12n, -8n)).toBe(4n);
    expect(gcd(-12n, -8n)).toBe(4n);
  });
  test('gcd(0, 0) = 0', () => {
    expect(gcd(0n, 0n)).toBe(0n);
  });
});

describe('modPow', () => {
  test('basic exponentiation', () => {
    expect(modPow(2n, 10n, 1000n)).toBe(1024n % 1000n);
    expect(modPow(3n, 2n, 7n)).toBe(9n % 7n);
  });
  test('exp = 0 returns 1', () => {
    expect(modPow(123n, 0n, 1000n)).toBe(1n);
  });
  test('mod = 1 returns 0', () => {
    expect(modPow(123n, 5n, 1n)).toBe(0n);
  });
  test('negative base is normalized', () => {
    // (-2)^3 mod 7 = -8 mod 7 = 6
    expect(modPow(-2n, 3n, 7n)).toBe(6n);
  });
  test('large exponent (512-bit)', () => {
    const base = 65537n;
    const exp = (1n << 512n) - 1n;
    const mod = (1n << 1024n) - 1n;
    const result = modPow(base, exp, mod);
    expect(result >= 0n && result < mod).toBe(true);
  });
  test('throws on negative exponent', () => {
    expect(() => modPow(2n, -1n, 5n)).toThrow(RangeError);
  });
  test('throws on non-positive modulus', () => {
    expect(() => modPow(2n, 1n, 0n)).toThrow(RangeError);
  });
});

describe('modInverse', () => {
  test('basic inverse', () => {
    // 3 * 5 = 15 ≡ 1 (mod 7), so modInverse(3, 7) = 5
    expect(modInverse(3n, 7n)).toBe(5n);
    expect(modInverse(5n, 7n)).toBe(3n);
  });
  test('returns null when no inverse exists', () => {
    // gcd(4, 6) = 2, no inverse
    expect(modInverse(4n, 6n)).toBeNull();
  });
  test('inverse works for negative base', () => {
    // modInverse normalizes -3 to 4 mod 7, then finds 4^-1 mod 7 = 2
    const inv = modInverse(-3n, 7n);
    expect(inv).toBe(2n);
    // Verify: (4 * 2) mod 7 = 1 (using the normalized base, not the original -3)
    expect((4n * inv!) % 7n).toBe(1n);
  });
  test('inverse for 65537 mod phi (typical RSA setup)', () => {
    const phi = (61n - 1n) * (53n - 1n); // = 60 * 52 = 3120
    const d = modInverse(65537n, phi);
    expect(d).not.toBeNull();
    expect((65537n * d!) % phi).toBe(1n);
  });
  test('throws RangeError on m == 0', () => {
    expect(() => modInverse(3n, 0n)).toThrow(RangeError);
  });
  test('negative modulus normalizes via |m|', () => {
    expect(modInverse(3n, -7n)).toBe(5n);
    const inv = modInverse(5n, -7n)!;
    expect(inv).toBe(3n);
    expect(inv >= 0n && inv < 7n).toBe(true);
  });
});

describe('isqrt', () => {
  test('perfect squares', () => {
    expect(isqrt(0n)).toBe(0n);
    expect(isqrt(1n)).toBe(1n);
    expect(isqrt(4n)).toBe(2n);
    expect(isqrt(100n)).toBe(10n);
    expect(isqrt(10000n)).toBe(100n);
  });
  test('floor for non-squares', () => {
    expect(isqrt(2n)).toBe(1n);
    expect(isqrt(3n)).toBe(1n);
    expect(isqrt(99n)).toBe(9n);
    expect(isqrt(101n)).toBe(10n);
  });
  test('large perfect square', () => {
    const x = 12345678901234567890n;
    const r = isqrt(x * x);
    expect(r).toBe(x);
  });
  test('throws on negative input', () => {
    expect(() => isqrt(-1n)).toThrow(RangeError);
  });
});

describe('iroot', () => {
  test('cube root', () => {
    expect(iroot(27n, 3n)).toBe(3n);
    expect(iroot(64n, 3n)).toBe(4n);
    expect(iroot(125n, 3n)).toBe(5n);
    // Non-perfect cube: floor(iroot(30, 3)) = 3 since 3^3=27, 4^3=64
    expect(iroot(30n, 3n)).toBe(3n);
  });
  test('5th root', () => {
    expect(iroot(32n, 5n)).toBe(2n);
    expect(iroot(243n, 5n)).toBe(3n);
  });
  test('k=2 matches isqrt', () => {
    expect(iroot(100n, 2n)).toBe(10n);
    expect(iroot(99n, 2n)).toBe(9n);
  });
  test('k=1 returns n', () => {
    expect(iroot(42n, 1n)).toBe(42n);
  });
  test('n=0 and n=1', () => {
    expect(iroot(0n, 3n)).toBe(0n);
    expect(iroot(1n, 3n)).toBe(1n);
  });
  test('throws on negative input', () => {
    expect(() => iroot(-1n, 2n)).toThrow(RangeError);
  });
  test('throws RangeError for k < 1', () => {
    expect(() => iroot(27n, 0n)).toThrow(RangeError);
    expect(() => iroot(27n, -1n)).toThrow(RangeError);
  });
});

describe('extendedGcd', () => {
  test('basic case', () => {
    const r = extendedGcd(12n, 8n);
    expect(r.gcd).toBe(4n);
    expect(12n * r.x + 8n * r.y).toBe(4n);
  });
  test('coprime inputs', () => {
    const r = extendedGcd(7n, 13n);
    expect(r.gcd).toBe(1n);
    expect(7n * r.x + 13n * r.y).toBe(1n);
  });
  test('negative inputs (Bezout identity holds)', () => {
    const r = extendedGcd(-12n, 8n);
    expect(r.gcd).toBe(4n);
    expect(-12n * r.x + 8n * r.y).toBe(4n);
  });
});

describe('modPowNeg', () => {
  test('non-negative exponent delegates to modPow', () => {
    expect(modPowNeg(2n, 10n, 1000n)).toBe(24n);
    expect(modPowNeg(123n, 0n, 1000n)).toBe(1n);
  });
  test('negative exponent uses modular inverse', () => {
    // 3^-1 mod 7 = 5
    expect(modPowNeg(3n, -1n, 7n)).toBe(5n);
    // 3^-2 mod 7 = 5^2 mod 7 = 4
    expect(modPowNeg(3n, -2n, 7n)).toBe(4n);
  });
  test('returns null when base is non-invertible', () => {
    expect(modPowNeg(4n, -1n, 6n)).toBeNull();
  });
});

describe('continuedFraction', () => {
  test('expands 415/93 to [4, 2, 6, 7]', () => {
    expect(continuedFraction(415n, 93n)).toEqual([4n, 2n, 6n, 7n]);
  });
  test('zero numerator gives [0]', () => {
    expect(continuedFraction(0n, 5n)).toEqual([0n]);
  });
  test('negative denominator normalizes via sign flip', () => {
    expect(continuedFraction(3n, -2n)).toEqual(continuedFraction(-3n, 2n));
  });
  test('throws RangeError on zero denominator', () => {
    expect(() => continuedFraction(1n, 0n)).toThrow(RangeError);
  });
});

describe('convergents', () => {
  test('convergents of [4, 2, 6, 7]', () => {
    const convs = convergents([4n, 2n, 6n, 7n]);
    expect(convs.map(([n, d]) => [n, d])).toEqual([[4n, 1n], [9n, 2n], [58n, 13n], [415n, 93n]]);
    expect(convs[3].num).toBe(415n);
    expect(convs[3].den).toBe(93n);
  });
  test('throws RangeError on empty input', () => {
    expect(() => convergents([])).toThrow(RangeError);
  });
});

describe('wienerAttack', () => {
  test('recovers small d with phi-recovery + isqrt verify', () => {
    const p = 1000000007n;
    const q = 1000000009n;
    const n = p * q;
    const e = 267326736415841597n; // = 101^-1 mod phi
    const out = wienerAttack(n, e);
    expect(out).not.toBeNull();
    expect(out!.d).toBe(101n);
    expect(out!.p * out!.q).toBe(n);
    expect(out!.phi).toBe((p - 1n) * (q - 1n));
  });
  test('returns null when d is not small', () => {
    const p = 1000000007n;
    const q = 1000000009n;
    const n = p * q;
    expect(wienerAttack(n, 65537n)).toBeNull();
  });
});

describe('crtRSA', () => {
  test('classic case: x = 23 mod 105', () => {
    expect(crtRSA([2n, 3n, 2n], [3n, 5n, 7n])).toBe(23n);
  });
  test('negative remainders are normalized', () => {
    // -1 ≡ 2 (mod 3), so x ≡ 2 (mod 3), x ≡ 2 (mod 5) → x = 2
    expect(crtRSA([-1n, 2n], [3n, 5n])).toBe(2n);
  });
  test('returns null on non-coprime moduli', () => {
    expect(crtRSA([1n, 2n], [4n, 6n])).toBeNull();
  });
  test('returns null on length mismatch, empty, or modulus <= 1', () => {
    expect(crtRSA([1n], [2n, 3n])).toBeNull();
    expect(crtRSA([], [])).toBeNull();
    expect(crtRSA([0n], [1n])).toBeNull();
  });
  test('result satisfies every residue', () => {
    const remainders = [2n, 3n, 2n];
    const moduli = [3n, 5n, 7n];
    const x = crtRSA(remainders, moduli)!;
    for (let i = 0; i < moduli.length; i++) {
      expect(x % moduli[i]).toBe(remainders[i]);
    }
  });
});

describe('exactNthRoot', () => {
  test('exact root', () => {
    expect(exactNthRoot(27n, 3n)).toBe(3n);
    expect(exactNthRoot(32n, 5n)).toBe(2n);
  });
  test('returns null when not a perfect power', () => {
    expect(exactNthRoot(30n, 3n)).toBeNull();
  });
  test('e = 1 returns v', () => {
    expect(exactNthRoot(42n, 1n)).toBe(42n);
  });
  test('throws RangeError for e < 1', () => {
    expect(() => exactNthRoot(27n, 0n)).toThrow(RangeError);
  });
});
