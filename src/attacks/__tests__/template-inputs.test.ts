import { describe, expect, test } from 'bun:test';
import { attack as batchGcd } from '../batch-gcd';
import { attack as biasedLsb } from '../biased-lsb';
import { attack as knownPlaintext } from '../known-plaintext';
import { attack as lsbOracle } from '../lsb-oracle';
import { attack as relatedMessage } from '../related-message';
import { attack as smallPublicExp } from '../small-public-exp';

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
