# Plan 008: Add frontendCheck unit tests for all attacks

## Status
- Priority: P1
- Effort: L
- Risk: LOW
- Depends on: none
- Category: tests
- Planned at: 08e26cc, 2026-07-03

## Why this matters

Zero test files exist for any of the 47 attack implementations. The 31 attacks with frontendCheck run purely in browser BigInt with no automated verification. A regression in any frontendCheck (like the BigInt whitespace handling bug fixed earlier) would ship undetected. The test-attacks.ts script exists but is a manual E2E runner, not part of CI.

## Current state

- `src/utils/__tests__/`: 8 test files covering bigint, converters, factordb, pemParser, progressEstimator, rsaCalc, sageOutput, asn1 — none test attacks
- 31 attacks have frontendCheck functions
- Each attack exports `{ attack: Attack, generateTestcase }`
- `generateTestcase()` returns Record<string, string> with valid inputs
- `frontendCheck(vals)` returns `Promise<string | null>` — null means "not applicable", string with =SUCCESS means success

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |
| Tests     | `bun run test:unit`| all pass |

## Steps

### Step 1: Create test helper

Create `src/utils/__tests__/attack-test-helpers.ts`:

```typescript
import { attacks } from '../../attacks';

/**
 * Generate a testcase for an attack and verify frontendCheck produces a result.
 */
export async function testAttackFrontendCheck(attackId: string): Promise<{ success: boolean; result: string | null }> {
  const attack = attacks.find(a => a.id === attackId);
  if (!attack) throw new Error(`Attack ${attackId} not found`);
  if (!attack.frontendCheck) return { success: true, result: null }; // no frontendCheck = skip
  
  // Generate testcase
  const gen = (await import(`../../attacks/${attackId}`)).generateTestcase;
  if (!gen) return { success: true, result: null };
  
  const vals = gen();
  const result = await attack.frontendCheck(vals);
  return { success: result !== null, result };
}
```

### Step 2: Create attack frontendCheck tests

Create `src/utils/__tests__/attack-frontendcheck.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import { attacks } from '../../attacks';

// Test each attack that has frontendCheck
const attacksWithFrontendCheck = attacks.filter(a => a.frontendCheck);

describe('Attack frontendCheck', () => {
  for (const attack of attacksWithFrontendCheck) {
    it(`${attack.id}: frontendCheck produces a result with generated testcase`, async () => {
      const gen = (await import(`../../attacks/${attack.id}`)).generateTestcase;
      if (!gen) return; // no testcase generator
      
      const vals = gen();
      const result = await attack.frontendCheck!(vals, () => {});
      
      // Result should be either null (not applicable) or a string containing a token
      if (result !== null) {
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        // Should contain a success/failure token
        expect(result).toMatch(/=(SUCCESS|FAILED|RESULT)/);
      }
    });
  }
});
```

### Step 3: Add testcase validity tests

Create `src/utils/__tests__/attack-testcase-validity.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import { attacks } from '../../attacks';

describe('Testcase validity', () => {
  for (const attack of attacks) {
    it(`${attack.id}: generateTestcase returns valid input`, async () => {
      const gen = (await import(`../../attacks/${attack.id}`)).generateTestcase;
      if (!gen) return;
      
      const vals = gen();
      expect(typeof vals).toBe('object');
      expect(Object.keys(vals).length).toBeGreaterThan(0);
      
      // All values should be strings
      for (const [key, val] of Object.entries(vals)) {
        expect(typeof val).toBe('string');
      }
      
      // applicableCheck should pass with the testcase
      expect(attack.applicableCheck(vals)).toBe(true);
    });
  }
});
```

### Step 4: Verify

- `bun run test:unit` passes
- All 31 attacks with frontendCheck are tested
- No attack test takes longer than 5 seconds

## Done criteria

- [ ] bun run test:unit passes
- [ ] 31+ new test cases for frontendCheck functions
- [ ] 47 new test cases for testcase validity
- [ ] No test takes > 5 seconds
- [ ] All tests are in src/utils/__tests__/

## STOP conditions

- A frontendCheck fails with a generated testcase (the testcase is invalid)
- Tests take too long (> 10 seconds total)
- A frontendCheck relies on DOM or network access (can't be unit-tested)
