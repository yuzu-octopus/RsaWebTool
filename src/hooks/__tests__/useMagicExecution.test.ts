import { describe, expect, test } from 'bun:test';
import { deriveSageRemaining } from '../useMagicExecution';
import type { Attack } from '../../types';

const attack = (id: string) => ({ id }) as Attack;

describe('deriveSageRemaining', () => {
  test('uses completed frontend phase data rather than stale job state', () => {
    const [first, second] = [attack('first'), attack('second')];
    const remaining = deriveSageRemaining(
      [first, second],
      [{ result: '=FAILED', isSuccess: false }, undefined],
    );

    expect(remaining).toEqual([{ attack: second, originalIndex: 1 }]);
  });
});
