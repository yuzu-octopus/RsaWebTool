import { describe, it, expect } from 'bun:test';
import { gcd } from '../bigint';
import {
  TESTCASE_BITS,
  generateWienerTestcase,
  generateHastadBroadcastTestcase,
  generateSmallDTestcase,
  generatePollardTestcase,
} from '../testcases/core';

describe('generateWienerTestcase', () => {
  it('never throws on inverse failure and yields a large e', () => {
    for (let i = 0; i < 3; i++) {
      const kp = generateWienerTestcase();
      // e = d^-1 mod phi is ~n-sized when d is small
      expect(kp.e.toString(2).length).toBeGreaterThanOrEqual(kp.n.toString(2).length - 8);
      // Wiener bound: d < n^(1/4)/3  <=>  81*d^4 < n
      expect(81n * kp.d ** 4n < kp.n).toBe(true);
      expect((kp.e * kp.d) % kp.phi).toBe(1n);
    }
  }, 60_000);
});

describe('generateHastadBroadcastTestcase', () => {
  it('uses e=3 key material with pairwise-distinct moduli', () => {
    for (let i = 0; i < 3; i++) {
      const t = generateHastadBroadcastTestcase();
      expect(t.e).toBe(3n);
      expect(new Set([t.n1, t.n2, t.n3]).size).toBe(3);
      for (const [c, n] of [[t.c1, t.n1], [t.c2, t.n2], [t.c3, t.n3]] as const) {
        expect(c < n).toBe(true);
      }
      // Same m with m^3 < n_i: no modular wrap, so all ciphertexts agree as integers
      expect(t.c1).toBe(t.c2);
      expect(t.c2).toBe(t.c3);
    }
  }, 60_000);
});

describe('generateSmallDTestcase', () => {
  it('samples d in [100, bound) with a valid inverse', () => {
    for (let i = 0; i < 3; i++) {
      const kp = generateSmallDTestcase();
      expect(kp.d >= 100n && kp.d < 10100n).toBe(true);
      expect((kp.e * kp.d) % kp.phi).toBe(1n);
    }
  }, 60_000);

  it('stays BigInt-safe for huge bounds (no Number() precision loss)', () => {
    const bound = 2n ** 1024n;
    const kp = generateSmallDTestcase(bound);
    expect(kp.d >= 100n && kp.d < bound).toBe(true);
    expect((kp.e * kp.d) % kp.phi).toBe(1n);
    expect(gcd(kp.e, kp.phi)).toBe(1n);
  }, 60_000);
});

describe('generatePollardTestcase', () => {
  it('builds a near-full-size B-smooth p (p-1 factors <= 10000)', () => {
    const { n, p, q } = generatePollardTestcase();
    expect(n).toBe(p * q);
    // Scaled toward TESTCASE_BITS, not a lopsided ~70-bit factor
    expect(p.toString(2).length).toBeGreaterThanOrEqual(TESTCASE_BITS.p - 8);
    // p-1 must be B-powersmooth for B=10000 so stage-1 Pollard p-1 converges:
    // every prime power dividing p-1 is <= B (plain smoothness is not enough,
    // a factor like 2^30 slips past the stage-1 prime-power cap).
    let rest = p - 1n;
    for (let f = 2n; f <= 10000n; f++) {
      if (rest % f !== 0n) continue;
      let pw = 1n;
      while (rest % f === 0n) {
        rest /= f;
        pw *= f;
      }
      expect(pw <= 10000n).toBe(true);
    }
    expect(rest).toBe(1n);
  }, 120_000);

  it('counts the seeded factor of 2 against the q=2 budget (2-adic bound)', () => {
    // Regression: t was seeded at 2n with `used` starting empty, so a later
    // q=2 draw could add up to 2^13 more, reaching 2^14 = 16384 > B and
    // breaking t | lcm(1..B). Force that draw (pick q=2, take max e), then
    // replay the remainder on a seeded RNG so the case is deterministic.
    const origRandom = Math.random;
    try {
      let calls = 0;
      let a = 115 >>> 0;
      const rng = () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      Math.random = () => {
        if (calls === 0) {
          calls++;
          return 0; // pick primePowers[0] (q=2)
        }
        if (calls === 1) {
          calls++;
          return 0.999999; // take the max remaining exponent
        }
        return rng();
      };
      const { p } = generatePollardTestcase();
      let rest = p - 1n;
      let e = 0;
      while (rest % 2n === 0n) {
        rest /= 2n;
        e++;
      }
      // 2^13 = 8192 <= B < 16384 = 2^14: at most 13 factors of 2 fit.
      expect(e).toBeLessThanOrEqual(13);
    } finally {
      Math.random = origRandom;
    }
  }, 120_000);
});
