import { describe, it, expect } from 'bun:test';
import { attacks, testcaseGenerators } from '../../attacks';
import { generateWienerTestcase, generateKeyPair, randomPrime } from '../../utils/testcases/core';
import { modInverse, modPow, wienerAttack } from '../../utils/bigint';
import { bitLength, trivialFactor, integerRootScan, gcdSetScan } from '../_rsaHelpers';

const byId = (id: string) => attacks.find((a) => a.id === id)!;
const str = async (
  fn: NonNullable<(typeof attacks)[number]['frontendCheck']>,
  vals: Record<string, string>,
): Promise<string | null> => {
  const r = await fn(vals, () => {});
  return r;
};

// #1 boneh-durfee frontendCheck: Wiener-range input succeeds in browser
describe('boneh-durfee frontendCheck', () => {
  it('recovers Wiener-range d without Sage', async () => {
    const kp = generateWienerTestcase();
    const atk = byId('boneh-durfee');
    expect(atk.frontendCheck).toBeDefined();
    const r = await str(atk.frontendCheck!, { n: kp.n.toString(), e: kp.e.toString() });
    expect(r).not.toBeNull();
    expect(r!).toContain('BONEH_DURFEE=SUCCESS');
    expect(r!).toContain(`p = ${kp.p < kp.q ? kp.p : kp.q}`);
  }, 30_000);
});

// #14 just-above-n^0.25 d falls through to Sage (null), exercising the band
// between the Wiener frontend range and the n^0.26 lattice escalation.
describe('boneh-durfee above-Wiener fall-through', () => {
  it('returns null for d just above n^0.25', async () => {
    const p = randomPrime(128);
    const q = randomPrime(128);
    const phi = (p - 1n) * (q - 1n);
    const n = p * q;
    const nBits = n.toString(2).length;
    let d = (1n << BigInt(Math.floor(nBits * 0.27))) + 12345n;
    if (d % 2n === 0n) d += 1n;
    let e: bigint | null = null;
    // Resample until Wiener genuinely misses (its proven bound is sufficient,
    // not necessary, so a fixed d just above n^0.25 may still succeed).
    for (let attempt = 0; attempt < 200 && e === null; attempt++) {
      const cand = d + BigInt(attempt * 2);
      const ei = modInverse(cand, phi);
      if (ei !== null && wienerAttack(n, ei) === null) {
        d = cand;
        e = ei;
      }
    }
    expect(e).not.toBeNull();
    const atk = byId('boneh-durfee');
    const r = await str(atk.frontendCheck!, { n: n.toString(), e: e!.toString() });
    expect(r).toBeNull();
  }, 30_000);
});

// #2 stereotyped-message attack registered with testcase + Sage small_roots
describe('stereotyped-message', () => {
  it('is registered with a green testcase and small_roots Sage template', () => {
    const atk = byId('stereotyped-message');
    expect(atk).toBeDefined();
    const gen = testcaseGenerators['stereotyped-message'];
    expect(gen).toBeDefined();
    const vals = gen();
    expect(atk.applicableCheck(vals)).toBe(true);
    const sage = atk.sageTemplate!(vals);
    expect(sage).toContain('small_roots');
    // testcase math: c = (prefix<<k + x)^e mod n for small x
    const n = BigInt(vals.n);
    const e = BigInt(vals.e);
    const c = BigInt(vals.c);
    const prefix = BigInt(vals.prefix);
    const k = BigInt(vals.k_bits);
    let ok = false;
    for (let x = 0n; x < 1n << (k > 20n ? 20n : k); x++) {
      if (modPow((prefix << k) + x, e, n) === c) {
        ok = true;
        break;
      }
    }
    expect(ok).toBe(true);
  }, 30_000);
});

// #3 phi-leak accepts d via randomized MR splitting
describe('phi-leak d input', () => {
  it('factors from (n, e, d) without phi', async () => {
    const { n, e, d, p, q } = generateKeyPair(128, 128);
    const atk = byId('phi-leak');
    const r = await str(atk.frontendCheck!, { n: n.toString(), e: e.toString(), d: d.toString() });
    expect(r).not.toBeNull();
    expect(r!).toContain('PHI_LEAK=SUCCESS');
    const lo = p < q ? p : q;
    expect(r!).toContain(`p = ${lo}`);
  }, 30_000);
});

// #6 pisano renamed + ord-split
describe('pisano-period as Multiplicative Order', () => {
  it('is renamed and splits n=35 via gcd(2^{ord/2}-1, n)', async () => {
    const atk = byId('pisano-period');
    expect(atk.name).toBe('Multiplicative Order');
    const r = await str(atk.frontendCheck!, { n: '35' });
    expect(r).not.toBeNull();
    expect(r!).toContain('PISANO_PERIOD=SUCCESS');
    expect(r!).toContain('p = 5');
  }, 30_000);
});

// #7 partial-d kBound capped at e
describe('partial-d kBound cap', () => {
  it('caps kBound at e in Sage template and still succeeds', async () => {
    const atk = byId('partial-d');
    const vals = testcaseGenerators['partial-d']();
    const sage = atk.sageTemplate!(vals);
    expect(sage).toMatch(/min\(.*e/);
    const r = await str(atk.frontendCheck!, vals);
    expect(r).not.toBeNull();
    expect(r!).toContain('PARTIAL_D=SUCCESS');
  }, 60_000);
});

// #8 dp-dq-leak qinv input
describe('dp-dq-leak qinv', () => {
  it('declares an optional qinv input', () => {
    const atk = byId('dp-dq-leak');
    expect(atk.inputs.some((i) => i.name === 'qinv')).toBe(true);
  });
});

// #9 hastad-linear-pad frontend e=3 fallback
describe('hastad-linear-pad frontend', () => {
  it('recovers m in browser for e=3 testcase', async () => {
    const atk = byId('hastad-linear-pad');
    expect(atk.frontendCheck).toBeDefined();
    const vals = testcaseGenerators['hastad-linear-pad']();
    const r = await str(atk.frontendCheck!, vals);
    expect(r).not.toBeNull();
    expect(r!).toContain('HASTAD_LINEAR_PAD=SUCCESS');
  }, 60_000);
});

// #10 related-message defaults + testcase b1 != b2
describe('related-message defaults', () => {
  it('succeeds with a2/b2 omitted and testcase always has b1 != b2', async () => {
    const atk = byId('related-message');
    for (let i = 0; i < 3; i++) {
      const vals = testcaseGenerators['related-message']();
      expect(vals.b1).not.toBe(vals.b2);
    }
    // Explicit (a1,b1) = (2,3) with a2/b2 omitted (= 1,1 defaults): c2 = (m+1)^3.
    const { n } = generateKeyPair(64, 64);
    const e = 3n;
    const m = 500n;
    const c1 = modPow(2n * m + 3n, e, n);
    const v: Record<string, string> = { n: n.toString(), e: '3', c1: c1.toString(), c2: modPow(m + 1n, e, n).toString(), a1: '2', b1: '3' };
    const r = await str(atk.frontendCheck!, v);
    expect(r).not.toBeNull();
    expect(r!).toContain('FRANKLIN_REITER_RELATED_MESSAGE=SUCCESS');
    expect(r!).toContain('m = 500');
  }, 60_000);
});

// #18 homomorphic Sage 30-pair cap + blinding bypass attack
describe('homomorphic 30-pair cap', () => {
  it('Sage template mirrors the 30-pair cap with FAILED message', () => {
    const atk = byId('homomorphic-forgery');
    const vals = testcaseGenerators['homomorphic-forgery']();
    const many = Array.from({ length: 31 }, (_, i) => `${i + 2},${i + 100}`).join(';');
    const sage = atk.sageTemplate!({ ...vals, oracle_pairs: many });
    expect(sage).toMatch(/30/);
    expect(sage).toContain('HOMOMORPHIC_FORGERY=FAILED');
  });
});

describe('blinding-decryption-bypass', () => {
  it('unblinds an oracle decryption in browser', async () => {
    const atk = byId('blinding-decryption-bypass');
    expect(atk).toBeDefined();
    const vals = testcaseGenerators['blinding-decryption-bypass']();
    expect(atk.applicableCheck(vals)).toBe(true);
    const r = await str(atk.frontendCheck!, vals);
    expect(r).not.toBeNull();
    expect(r!).toContain('BLINDING_BYPASS=SUCCESS');
  }, 30_000);
});

// #19 e=1 forgery
describe('e=1 signature-parameter forgery', () => {
  it('forges via sig = m under e=1', async () => {
    const atk = byId('sig-param-forgery');
    expect(atk).toBeDefined();
    const vals = testcaseGenerators['sig-param-forgery']();
    expect(atk.applicableCheck(vals)).toBe(true);
    const r = await str(atk.frontendCheck!, vals);
    expect(r).not.toBeNull();
    expect(r!).toContain('SIG_PARAM_FORGERY=SUCCESS');
  }, 30_000);
});

// #21 rsa-crt-fault pair-only branch
describe('rsa-crt-fault pair-only', () => {
  it('factors from (n, e, sig_valid, sig_faulty) without m', async () => {
    const atk = byId('rsa-crt-fault');
    const vals = testcaseGenerators['rsa-crt-fault']();
    const noM: Record<string, string> = { ...vals };
    delete noM.m;
    const r = await str(atk.frontendCheck!, noM);
    expect(r).not.toBeNull();
    expect(r!).toContain('RSA_CRT_FAULT=SUCCESS');
  }, 30_000);
});

// #35 clamp/validate
describe('bound guards', () => {
  it('small-prime-crt clamps a huge factorBound instead of hanging', async () => {
    const atk = byId('small-prime-crt');
    const vals = testcaseGenerators['small-prime-crt']();
    const r = await str(atk.frontendCheck!, { ...vals, factorBound: '99999999999999999999' });
    expect(r).not.toBeNull();
  }, 60_000);
  it('pollard-p1 rejects B2 > 5M with a clear error', async () => {
    const atk = byId('pollard-p1');
    const vals = testcaseGenerators['pollard-p1']();
    const r = await str(atk.frontendCheck!, { ...vals, B2: '99999999' });
    expect(r).not.toBeNull();
    expect(r!).toMatch(/B2|5.?000.?000|exceed/i);
  }, 30_000);
});

// #36 small-fraction bound inputs + divs_tried report
describe('small-fraction bounds', () => {
  it('declares bound inputs and reports divs_tried in Sage', async () => {
    const atk = byId('small-fraction');
    expect(atk.inputs.some((i) => i.name === 'b_max')).toBe(true);
    const vals = testcaseGenerators['small-fraction']();
    expect(atk.sageTemplate!(vals)).toContain('divs_tried');
    const r = await str(atk.frontendCheck!, vals);
    expect(r).not.toBeNull();
    expect(r!).toContain('SMALL_FRACTION=SUCCESS');
  }, 120_000);
});

// #37 euler bound input + precondition
describe('euler bound', () => {
  it('declares a bound input and documents p,q = 1 mod 4', () => {
    const atk = byId('euler');
    expect(atk.inputs.some((i) => i.name === 'bound')).toBe(true);
    expect(atk.description).toMatch(/1.*mod 4/);
  });
});

// #45 shared helpers
describe('rsa helpers', () => {
  it('bitLength is exact, trivialFactor splits even n, scans work', () => {
    expect(bitLength(0n)).toBe(0);
    expect(bitLength(255n)).toBe(8);
    expect(bitLength(1n << 100n)).toBe(101);
    expect(trivialFactor(35n)).toBeNull();
    expect(trivialFactor(36n)).toBe(2n);
    // integerRootScan: c = m^3 exactly
    expect(integerRootScan(125n, 8n, 3n, 1000n)?.m).toBe(5n);
    expect(integerRootScan(126n, 8n, 3n, 1000n)).toBeNull();
    // gcdSetScan finds shared prime
    const hit = gcdSetScan(101n * 103n, [707n, 1n]);
    expect(hit).toEqual({ factor: 101n, index: 0 });
    expect(gcdSetScan(101n * 103n, [1n, 5n])).toBeNull();
  });
});

// #47 slow-generator sizes documented and small
describe('slow generator sizes', () => {
  it('dependent-prime / small-crt-exp testcases stay small', () => {
    for (const id of ['dependent-prime', 'small-crt-exp']) {
      const vals = testcaseGenerators[id]();
      const bits = BigInt(vals.n).toString(2).length;
      expect(bits).toBeLessThanOrEqual(256);
    }
  }, 60_000);
});

// #48 novelty center input
describe('novelty-primes center', () => {
  it('declares an optional center input', () => {
    expect(byId('novelty-primes').inputs.some((i) => i.name === 'center')).toBe(true);
  });
});

// #12 small-public-exp precondition + shared iroot path
describe('small-public-exp', () => {
  it('documents the m < (n*(k+1))^{1/e} precondition and succeeds', async () => {
    const atk = byId('small-public-exp');
    expect(atk.description + atk.proof).toMatch(/k_bound|k \+ 1/);
    const vals = testcaseGenerators['small-public-exp']();
    const r = await str(atk.frontendCheck!, vals);
    expect(r).not.toBeNull();
    expect(r!).toContain('SMALL_PUBLIC_EXP=SUCCESS');
  }, 60_000);
});
