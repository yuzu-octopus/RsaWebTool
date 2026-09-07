import { describe, expect, test } from 'bun:test';
import { attack, generateTestcase } from '../small-prime-crt';
import { modPow } from '../../utils/bigint';

describe('small-prime-crt', () => {
  test('generates a valid testcase that frontendCheck recovers', () => {
    const tc = generateTestcase();
    expect(tc.n).toBeTruthy();
    expect(tc.e).toBeTruthy();
    expect(tc.c).toBeTruthy();
    const n = BigInt(tc.n);
    const e = BigInt(tc.e);
    const c = BigInt(tc.c);
    expect(n > 1n && e > 1n && c >= 0n).toBe(true);

    const out = attack.frontendCheck?.(tc);
    expect(out).toContain('SMALL_PRIME_CRT=SUCCESS');
    const mLine = (out as string).split('\n').find((l) => l.startsWith('m = '));
    expect(mLine).toBeTruthy();
    const m = BigInt(mLine!.slice(4).trim());
    expect(modPow(m, e, n)).toBe(c);
  });

  test('recovers a tiny deterministic vector via per-factor decrypt + CRT', () => {
    // n = 3*5*7 = 105, e = 5, m = 42 -> c = 42^5 mod 105
    const n = 105n;
    const e = 5n;
    const m = 42n;
    const c = modPow(m, e, n);
    const out = attack.frontendCheck?.({ n: n.toString(), e: e.toString(), c: c.toString() });
    expect(out).toContain('SMALL_PRIME_CRT=SUCCESS');
    expect(out).toContain('m = 42');
  });

  test('handles prime powers (distinct prime-power moduli stay coprime for CRT)', () => {
    // n = 3^2 * 5 = 45, e = 7 (coprime to phi(9)=6 and phi(5)=4), m = 8
    const n = 45n;
    const e = 7n;
    const m = 8n;
    const c = modPow(m, e, n);
    const out = attack.frontendCheck?.({ n: n.toString(), e: e.toString(), c: c.toString() });
    expect(out).toContain('SMALL_PRIME_CRT=SUCCESS');
    expect(out).toContain('m = 8');
  });

  test('returns null when n has no factor within the trial-division bound', () => {
    // M89 and M127 are Mersenne primes: no factor <= 1e6 exists, remainder composite.
    const m89 = 2n ** 89n - 1n;
    const m127 = 2n ** 127n - 1n;
    const n = m89 * m127;
    const out = attack.frontendCheck?.({ n: n.toString(), e: '65537', c: '2' });
    expect(out).toBeNull();
  });

  test('emits FAILED when e is not invertible modulo a factor phi', () => {
    // n = 3*5, e = 2 shares gcd 2 with phi(3) = 2.
    const out = attack.frontendCheck?.({ n: '15', e: '2', c: '7' });
    expect(out).toContain('SMALL_PRIME_CRT=FAILED');
  });

  test('emits FAILED for missing required inputs', () => {
    expect(attack.frontendCheck?.({ n: '', e: '', c: '' })).toContain('SMALL_PRIME_CRT=FAILED');
  });

  test('applicableCheck requires n, e, and c', () => {
    expect(attack.applicableCheck({})).toBe(false);
    expect(attack.applicableCheck({ n: '15', e: '3' })).toBe(false);
    expect(attack.applicableCheck({ n: '15', e: '3', c: '8' })).toBe(true);
  });
});
