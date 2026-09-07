import { describe, expect, test } from 'bun:test';
import { attack as batchGcd } from '../batch-gcd';
import { attack as biasedLsb } from '../biased-lsb';
import { attack as bleichenbacher } from '../bleichenbacher';
import { attack as knownPlaintext } from '../known-plaintext';
import { attack as lsbOracle } from '../lsb-oracle';
import { attack as relatedMessage } from '../related-message';
import { attack as smallPublicExp } from '../small-public-exp';
import { attack as commonModulus } from '../common-modulus';
import { attack as hastadBroadcast } from '../hastad-broadcast';
import { attack as multiPrimeGcd } from '../multi-prime-gcd';
import { attack as manger } from '../manger';
import { validateNumeric } from '../guard';
import { attack as nitros } from '../nitros';
import { attack as phiLeak } from '../phi-leak';
import { attack as coppersmithShortPad } from '../coppersmith-short-pad';
import { attack as dpdqLeak } from '../dp-dq-leak';
import { rsaNeeds } from '../_rsaHelpers';
import { extractParams } from '../../components/MagicPanel';

const requiredBlankCases = [
  [biasedLsb, { n: '', e: '', c: '', oracle_runs: '' }, 'BIASED_LSB'],
  [lsbOracle, { n: '', e: '', c: '', oracle_responses: '' }, 'LSB_ORACLE'],
  [knownPlaintext, { n: '', e: '', c: '' }, 'KNOWN_PLAINTEXT'],
  [relatedMessage, { n: '', e: '', c1: '', c2: '' }, 'FRANKLIN_REITER_RELATED_MESSAGE'],
  [smallPublicExp, { n: '', e: '', c: '', k_bound: '' }, 'SMALL_PUBLIC_EXP'],
] as const;

function sageTemplateFor(attack: { id: string; sageTemplate?: (vals: Record<string, string>) => string }, vals: Record<string, string>): string {
  if (!attack.sageTemplate) throw new Error(`${attack.id} is missing a Sage template`);
  return attack.sageTemplate(vals);
}

describe('attack template numeric input handling', () => {
  test.each(requiredBlankCases)('%s emits a valid failure template for blank required inputs', (attack, vals, token) => {
    const template = sageTemplateFor(attack, vals);

    expect(template).not.toContain('if not :');
    expect(template).not.toMatch(/=\s*\n/);
    expect(template).toContain(`${token}=FAILED`);
  });

  test.each([
    [bleichenbacher, { n: '', e: '', c: '', oracle_responses: '' }, 'BLEICHENBACHER'],
    [nitros, { n: '', base: '' }, 'NITROS'],
    [phiLeak, { n: '', phi: '' }, 'PHI_LEAK'],
    [coppersmithShortPad, { n: '', e: '', c1: '', c2: '' }, 'COPPERSMITH_SHORT_PAD'],
    [manger, { n: '', e: '', c: '', oracle_responses: '' }, 'MANGER'],
  ])('%s emits a valid failure template for blank required inputs', (attack, vals, token) => {
    const template = sageTemplateFor(attack, vals);

    expect(template).not.toContain('if not :');
    expect(template).not.toMatch(/=\s*\n/);
    expect(template).toContain(`${token}=FAILED`);
  });

  test('nitros rejects non-numeric n/base instead of interpolating', () => {
    expect(() => sageTemplateFor(nitros, { n: '3233', base: '1"))\nprint(1)\n#' })).toThrow();
    expect(() => sageTemplateFor(nitros, { n: '12abc', base: '' })).toThrow();
  });

  test('known-plaintext rejects non-numeric or unbounded unknown_bits', () => {
    expect(() =>
      sageTemplateFor(knownPlaintext, { n: '3233', e: '3', c: '42', known_prefix: '', unknown_bits: '24"))\nprint(1)\n#' }),
    ).toThrow();
    expect(() =>
      sageTemplateFor(knownPlaintext, { n: '3233', e: '3', c: '42', known_prefix: '', unknown_bits: '-5' }),
    ).toThrow();
  });

  test('phi-leak requires a leaked phi value', () => {
    expect(phiLeak.applicableCheck({ n: '3233' })).toBe(false);
    expect(phiLeak.applicableCheck({ n: '3233', phi: '3120' })).toBe(true);
  });

  test('logic-defaulted fields are optional', () => {
    const requiredOf = (attack: { inputs: { name: string; required?: boolean }[] }) =>
      Object.fromEntries(attack.inputs.map((i) => [i.name, i.required]));
    expect(requiredOf(relatedMessage)).toMatchObject({ e: false, a1: false, b1: false, a2: false, b2: false });
    expect(requiredOf(knownPlaintext)).toMatchObject({ e: false, known_prefix: false, unknown_bits: false });
    expect(requiredOf(smallPublicExp).e).toBe(false);
    expect(requiredOf(lsbOracle).e).toBe(false);
  });

  test('magic paste matches n1/n2/k and comma-separated values', () => {
    expect(extractParams('n1=15\nn2=21')).toMatchObject({ n1: '15', n2: '21' });
    expect(extractParams('k=3')).toMatchObject({ k: '3' });
    expect(extractParams('oracle_responses=1,0,1')).toMatchObject({ oracle_responses: '1,0,1' });
  });

  test('moduliList accepts comma- and newline-separated moduli', () => {
    expect(rsaNeeds.moduliList({ n_values: '15,21' })).toBe(true);
    expect(rsaNeeds.moduliList({ n_values: '15\n21' })).toBe(true);
    expect(rsaNeeds.nValuesMulti({ n_values: '15,21' })).toBe(true);
  });

  test('dp-dq-leak emits a single FAILED marker on the miss path', () => {
    const template = sageTemplateFor(dpdqLeak, { n: '15', e: '3', dp: '3', dq: '' });

    expect(template).not.toContain('no valid factor found');
    expect(template).toContain('DP_DQ_LEAK=FAILED');
  });

  test('multi-prime-gcd accepts comma-separated moduli', () => {
    const result = multiPrimeGcd.frontendCheck?.({ n_values: '15,35' });

    expect(result).toContain('p = 5');
    expect(result).toContain('MULTI_PRIME_GCD=SUCCESS');
  });

  test('magic paste keeps newline-separated keys apart', () => {
    expect(extractParams('n=15\ne=3')).toMatchObject({ n: '15', e: '3' });
    expect(extractParams('n_values=15\n21')).toMatchObject({ n_values: '15\n21' });
    expect(extractParams('n=ab\ncd')).toMatchObject({ n: 'ab\ncd' });
  });

  test('numeric guard tolerates wrapped multiline pastes', () => {
    expect(validateNumeric('15\n21', 'n')).toBe('1521');
    expect(validateNumeric('  42  ', 'e')).toBe('42');
  });

  test('defaulted-e attacks are discoverable without e', () => {
    expect(knownPlaintext.applicableCheck({ n: '3233', c: '42' })).toBe(true);
    expect(smallPublicExp.applicableCheck({ n: '3233', c: '42' })).toBe(true);
    expect(lsbOracle.applicableCheck({ n: '3233', c: '42', oracle_responses: '1,0' })).toBe(true);
  });

  test('phi input is required', () => {
    expect(phiLeak.inputs.find((i) => i.name === 'phi')?.required).toBe(true);
  });

  test('coppersmith-short-pad template defines n once', () => {
    const template = sageTemplateFor(coppersmithShortPad, { n: '15', e: '3', c1: '8', c2: '27' });

    expect(template.match(/n = Integer/g)?.length).toBe(1);
    expect(template).toContain('COPPERSMITH_SHORT_PAD=SUCCESS');
  });

  test('optional blank exponents use documented defaults through quoted text', () => {
    const lsbTemplate = sageTemplateFor(lsbOracle, { n: '3233', e: '', c: '42', oracle_responses: '0,1' });
    const knownTemplate = sageTemplateFor(knownPlaintext, { n: '3233', e: '', c: '42' });
    const relatedTemplate = sageTemplateFor(relatedMessage, { n: '3233', e: '', c1: '1', c2: '8' });
    const publicExpTemplate = sageTemplateFor(smallPublicExp, { n: '3233', e: '', c: '42', k_bound: '' });

    for (const template of [lsbTemplate, knownTemplate, relatedTemplate, publicExpTemplate]) {
      expect(template).toMatch(/e_val = ""\.strip\(\)/);
    }
    expect(lsbTemplate).toContain('else Integer(65537)');
    expect(knownTemplate).toContain('else Integer(65537)');
    expect(relatedTemplate).toContain('else Integer(65537)');
    expect(publicExpTemplate).toContain('else Integer(3)');
  });
});

describe('batch GCD limits', () => {
  test('rejects oversized browser input before multiplying moduli', () => {
    const oversized = Array.from({ length: 129 }, () => '15').join('\n');

    expect(batchGcd.frontendCheck?.({ n_values: oversized })).toContain('safe limit');
  });

  test('rejects oversized input bytes before parsing moduli', () => {
    const oversized = '9'.repeat(256 * 1024 + 1);

    expect(batchGcd.frontendCheck?.({ n_values: oversized })).toContain('safe limit');
  });
});

describe('RSA frontend hardening', () => {
  test('recovers a small common-modulus message when shared-exponent root is exact', async () => {
    const result = await commonModulus.frontendCheck?.({ n: '101', e1: '6', e2: '9', c1: '64', c2: '7' });

    expect(result).toContain('m = 2');
    expect(result).toContain('COMMON_MODULUS=SUCCESS');
  });

  test('does not return a common-modulus candidate when the shared-exponent result wraps modulo n', async () => {
    const result = await commonModulus.frontendCheck?.({ n: '101', e1: '6', e2: '9', c1: '71', c2: '88' });

    expect(result).toContain('Non-recovery:');
    expect(result).toContain('COMMON_MODULUS=FAILED');
    expect(result).not.toContain('\nResults:\nm =');
  });

  test('rejects oversized Hastad input before pairwise GCD work', async () => {
    const ciphertexts = Array.from({ length: 129 }, () => '1, 101').join('\n');

    expect(await hastadBroadcast.frontendCheck?.({ e: '129', ciphertexts })).toContain('safe limit');
  });

  test('rejects oversized multi-prime input before multiplying moduli', () => {
    const oversized = Array.from({ length: 129 }, () => '15').join('\n');

    expect(multiPrimeGcd.frontendCheck?.({ n_values: oversized })).toContain('safe limit');
  });

  test('rejects invalid small public exponent without throwing', () => {
    return expect(smallPublicExp.frontendCheck?.({ n: '101', e: '0', c: '1', k_bound: '0' })).resolves.toBeNull();
  });
});
