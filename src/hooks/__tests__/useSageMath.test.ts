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

  test('removes fallback listeners when cleanup runs without an abort', () => {
    const original = AbortSignal.any;
    Object.defineProperty(AbortSignal, 'any', { configurable: true, value: undefined });

    try {
      const first = new AbortController();
      const second = new AbortController();
      let removed = 0;
      for (const signal of [first.signal, second.signal]) {
        const remove = signal.removeEventListener.bind(signal);
        signal.removeEventListener = ((...args: Parameters<AbortSignal['removeEventListener']>) => {
          if (args[0] === 'abort') removed++;
          remove(...args);
        }) as typeof signal.removeEventListener;
      }

      const merged = mergeAbortSignals([first.signal, second.signal]);
      expect(merged).toBeDefined();
      merged!.cleanup!();

      expect(removed).toBe(2);
      expect(merged?.aborted).toBe(false);
    } finally {
      Object.defineProperty(AbortSignal, 'any', { configurable: true, value: original });
    }
  });

  test('removes every fallback listener for duplicate signals', () => {
    const original = AbortSignal.any;
    Object.defineProperty(AbortSignal, 'any', { configurable: true, value: undefined });

    try {
      const controller = new AbortController();
      let removed = 0;
      const remove = controller.signal.removeEventListener.bind(controller.signal);
      controller.signal.removeEventListener = ((...args: Parameters<AbortSignal['removeEventListener']>) => {
        if (args[0] === 'abort') removed++;
        remove(...args);
      }) as typeof controller.signal.removeEventListener;

      const merged = mergeAbortSignals([controller.signal, controller.signal]);
      merged!.cleanup!();

      expect(removed).toBe(2);
    } finally {
      Object.defineProperty(AbortSignal, 'any', { configurable: true, value: original });
    }
  });
});

