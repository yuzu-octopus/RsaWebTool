import { describe, it, expect } from 'bun:test';
import { attacks, testcaseGenerators } from '../../attacks';

describe('Testcase validity', () => {
  for (const attack of attacks) {
    it(`${attack.id}: generateTestcase returns valid input`, () => {
      const gen = testcaseGenerators[attack.id];
      if (!gen) return;

      const vals = gen();
      expect(typeof vals).toBe('object');
      expect(Object.keys(vals).length).toBeGreaterThan(0);

      // All values should be strings
      for (const val of Object.values(vals)) {
        expect(typeof val).toBe('string');
      }

      // applicableCheck should pass with the testcase
      expect(attack.applicableCheck(vals)).toBe(true);
    }, 15_000); // dependent-prime generates slowly (~8s)
  }
});
