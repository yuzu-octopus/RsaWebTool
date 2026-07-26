import { describe, expect, test } from 'bun:test';
import { mergeAbortSignals } from '../useSageMath';

describe('mergeAbortSignals', () => {
  test('uses a merged signal when AbortSignal.any is unavailable', () => {
    const original = AbortSignal.any;
    Object.defineProperty(AbortSignal, 'any', { configurable: true, value: undefined });

    try {
      const first = new AbortController();
      const second = new AbortController();
      const merged = mergeAbortSignals([first.signal, second.signal]);

      expect(merged?.aborted).toBe(false);
      second.abort();
      expect(merged?.aborted).toBe(true);
    } finally {
      Object.defineProperty(AbortSignal, 'any', { configurable: true, value: original });
    }
  });
});
