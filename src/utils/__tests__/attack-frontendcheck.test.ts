import { describe, it, expect } from 'bun:test';
import { attacks, testcaseGenerators } from '../../attacks';

// Exclude attacks that require network access (FactorDB API calls)
const NETWORK_EXCLUDED = new Set(['factordb-lookup']);

// Test each attack that has frontendCheck (excluding network-dependent ones)
const attacksWithFrontendCheck = attacks.filter(
  a => a.frontendCheck && !NETWORK_EXCLUDED.has(a.id),
);

describe('Attack frontendCheck', () => {
  for (const attack of attacksWithFrontendCheck) {
    it(`${attack.id}: frontendCheck produces a result with generated testcase`, () => {
      const gen = testcaseGenerators[attack.id];
      if (!gen) return; // no testcase generator

      const vals = gen();
      const result = attack.frontendCheck!(vals, () => {});

      // Handle both sync and async results
      const check = result instanceof Promise ? result : Promise.resolve(result);
      return check.then(r => {
        // Result should be either null (not applicable) or a string containing a token
        if (r !== null) {
          expect(typeof r).toBe('string');
          expect(r.length).toBeGreaterThan(0);
          // Should contain a success/failure token
          expect(r).toMatch(/=(SUCCESS|FAILED|RESULT|NOT_APPLICABLE)/);
        }
      });
    }, 30_000); // frontend checks must complete within the CI test limit
  }
});
