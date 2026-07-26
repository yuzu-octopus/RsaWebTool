import { describe, expect, test } from 'bun:test';
import { shouldContinueRun } from '../useAttackExecution';

describe('useAttackExecution ownership', () => {
  test('rejects stale and cancelled runs before they can publish output', () => {
    const controller = new AbortController();

    expect(shouldContinueRun(2, 2, controller.signal)).toBe(true);
    expect(shouldContinueRun(1, 2, controller.signal)).toBe(false);
    controller.abort();
    expect(shouldContinueRun(2, 2, controller.signal)).toBe(false);
  });
});
