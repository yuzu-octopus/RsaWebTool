import { describe, expect, test } from 'bun:test';
import { attack as bonehDurfee } from '../boneh-durfee';
import { attack as hastadLinearPad } from '../hastad-linear-pad';
import { attack as partialPqBits, generateTestcase as pqBitsTestcase } from '../partial-pq-bits';
import { attack as shortPad, generateTestcase as shortPadTestcase } from '../coppersmith-short-pad';
import { attack as partialD } from '../partial-d';
import { attack as dpdqLeak, generateTestcase as dpdqTestcase } from '../dp-dq-leak';
import { attack as phiLeak } from '../phi-leak';
import { attack as bleichSig } from '../bleichenbacher-sig';
import { attack as commonModulus } from '../common-modulus';
import { attack as relatedMessage } from '../related-message';
import { coppersmithLatticePython } from '../_rsaHelpers';

describe('crypto-math audit fixes', () => {
  test('boneh-durfee states the n^0.292 bound and heuristic scope', () => {
    expect(bonehDurfee.description).toContain('0.292');
    expect(bonehDurfee.proof).toContain('0.292');
    expect(bonehDurfee.proof).toContain('heuristic');
    expect(bonehDurfee.proof).toContain('escalation');
  });

  test('hastad-linear-pad bounds |m| by the combined modulus N', () => {
    expect(hastadLinearPad.proof).not.toContain('min_i');
    expect(hastadLinearPad.proof).toContain('|m| < N^{1/e}');
  });

  test('partial-pq-bits MSB uses shifted (p_msb-style) knownBits', () => {
    let msbCount = 0;
    for (let i = 0; i < 30; i++) {
      const tc = pqBitsTestcase();
      if (tc.bitPosition !== 'msb') continue;
      msbCount++;
      const kb = BigInt(tc.knownBits);
      // Shifted convention: low bits are zeroed (unknown positions)
      let tz = 0;
      let v = kb;
      while ((v & 1n) === 0n && tz < 64) {
        v >>= 1n;
        tz++;
      }
      expect(tz).toBeGreaterThanOrEqual(8);
    }
    expect(msbCount).toBeGreaterThan(0);
  });

  test('partial-pq-bits LSB template uses the monic polynomial', () => {
    const tpl = partialPqBits.sageTemplate({ n: '3233', knownBits: '42', bitPosition: 'lsb' });
    expect(tpl).toContain('inverse_mod');
    expect(partialPqBits.usageGuide).toContain('shift');
  });

  test('coppersmith-short-pad proof is scoped to the degenerate case', () => {
    expect(shortPad.proof).toContain('4096');
    expect(shortPad.proof).toContain('degenerate');
  });

  test('coppersmith-short-pad still recovers its testcase', async () => {
    const tc = shortPadTestcase();
    const r = await shortPad.frontendCheck(tc);
    expect(r).toContain('COPPERSMITH_SHORT_PAD=SUCCESS');
  });

  test('partial-d exposes explicit known-bit count m', async () => {
    expect(partialD.inputs.find((i) => i.name === 'm')?.required).toBe(false);
    const tpl = partialD.sageTemplate({ n: '10807', e: '57077', dLow: '13', m: '8' });
    expect(tpl).toContain('m_str');
    expect(partialD.proof).toContain('LSB-only');
    expect(partialD.usageGuide).toContain('lattice');
    // n=101*103, phi=10200, e=57077, d=13, k=70: dLow bit-length alone
    // caps kBound at 64, so explicit m=8 (kBound 1024) is required.
    const pre = await partialD.frontendCheck({ n: '10807', e: '57077', dLow: '13' });
    expect(pre).toBeNull();
    const post = await partialD.frontendCheck({ n: '10807', e: '57077', dLow: '13', m: '8' });
    expect(post).toContain('PARTIAL_D=SUCCESS');
    expect(post).toContain('p = 101');
  });

  test('dp-dq-leak tries multiple bases and handles g == n', async () => {
    const tpl = dpdqLeak.sageTemplate({ n: '15', e: '3', dp: '3', dq: '' });
    expect(tpl).toContain('[2, 3, 5]');
    // n=15, e=3, dp=3: base 2 gives gcd 15 == n, base 3 splits 5 * 3.
    const r = await dpdqLeak.frontendCheck({ n: '15', e: '3', dp: '3' });
    expect(r).toContain('DP_DQ_LEAK=SUCCESS');
    expect(r).toContain('p = 5');
    const reg = await dpdqLeak.frontendCheck(dpdqTestcase());
    expect(reg).toContain('DP_DQ_LEAK=SUCCESS');
  });

  test('phi-leak returns p = q on square discriminant', async () => {
    // n=13^2=169 with square-consistent phi=(13-1)^2=144: disc == 0.
    const r = await phiLeak.frontendCheck({ n: '169', phi: '144' });
    expect(r).toContain('PHI_LEAK=SUCCESS');
    expect(r).toContain('p = 13');
    const tpl = phiLeak.sageTemplate({ n: '169', phi: '144' });
    expect(tpl).not.toContain('not valid RSA');
  });

  test('phi-leak documents non-square discriminant instead of silent null', async () => {
    // n=15, phi=6: disc=40, not a square.
    const r = await phiLeak.frontendCheck({ n: '15', phi: '6' });
    expect(r).toContain('PHI_LEAK=FAILED');
    expect(phiLeak.proof).toContain('Miller-Rabin');
  });

  test('bleichenbacher-sig enforces cube < n and hash-at-offset', () => {
    const tpl = bleichSig.sageTemplate({ n: '3233', e: '3', hash_hex: 'ab' });
    expect(tpl).toContain('cube >= n');
    expect(tpl).toContain('hash_got');
  });

  test('common-modulus factors via ciphertext gcd fast-path', async () => {
    // m=61 shares a factor with n=61*53; Bezout needs inverses that do not exist.
    const r = await commonModulus.frontendCheck({
      n: '3233',
      e1: '17',
      e2: '19',
      c1: '610',
      c2: '244',
    });
    expect(r).toContain('COMMON_MODULUS=SUCCESS');
    expect(r).toContain('p = 61');
    const tpl = commonModulus.sageTemplate({ n: '3233', e1: '17', e2: '19', c1: '610', c2: '244' });
    expect(tpl).toContain('gcd(ci, n)');
    expect(commonModulus.proof).toContain('e1 = 1');
  });

  test('related-message flags proportional inputs like Sage', async () => {
    // b1=b2=0: a2^e*c1 == a1^e*c2, every m satisfies both equations.
    const r = await relatedMessage.frontendCheck({
      n: '3233',
      e: '3',
      c1: '125',
      c2: '1000',
      a1: '1',
      b1: '0',
      a2: '2',
      b2: '0',
    });
    expect(r).not.toBeNull();
    expect(r).toContain('FAILED');
  });

  test('related-message surfaces factors on denominator gcd', async () => {
    // denom=2440 shares factor 61 with n=3233; the CRT division is undefined mod 61.
    const r = await relatedMessage.frontendCheck({
      n: '3233',
      e: '3',
      c1: '2962',
      c2: '1156',
      a1: '1',
      b1: '0',
      a2: '3',
      b2: '5',
    });
    expect(r).not.toBeNull();
    expect(r).toContain('61');
    expect(r).toContain('FAILED');
  });

  test('coppersmith lattice helper documents the n^1/4 scope and inclusive bound', () => {
    const code = coppersmithLatticePython('p_msb + x');
    expect(code).toContain('abs(r) <= X');
    expect(code).toContain('1/4');
  });
});
