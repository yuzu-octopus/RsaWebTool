import { useMemo, useEffect, useRef, useCallback } from 'react';

export interface SageResult {
  success: boolean;
  stdout: string;
  error?: string;
}

interface SageCellMakeSagecellConfig {
  inputLocation: string;
  template?: Record<string, unknown>;
  evalButtonText?: string;
  autoeval?: boolean;
  callback?: () => void;
}

interface SageCellAPI {
  makeSagecell: (config: SageCellMakeSagecellConfig) => void;
  templates: Record<string, Record<string, unknown>>;
}

declare global {
  interface Window {
    sagecell: SageCellAPI;
  }
}

// Default timeout: 10s for SageCell script load + 110s for execution
export const DEFAULT_SAGE_TIMEOUT = 120000;

// Feature-detect AbortSignal.any() — available in Chrome 93+, Firefox 97+, Safari 15.4+
const supportsAbortSignalAny = typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function';

function combineSignals(signals: AbortSignal[]): AbortSignal | undefined {
  if (signals.length === 0) return undefined;
  if (signals.length === 1) return signals[0];
  if (supportsAbortSignalAny) return AbortSignal.any(signals);
  // Fallback: create a controller that aborts when any input signal aborts
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

function createOffscreenContainer(): HTMLDivElement {
  const id = `sagecell-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const el = document.createElement('div');
  el.id = id;
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.top = '-9999px';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.overflow = 'hidden';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  return el;
}

function injectSageScript(container: HTMLElement, code: string): void {
  const script = document.createElement('script');
  script.type = 'text/x-sage';
  script.textContent = code;
  container.appendChild(script);
}

function waitForSageCell(timeoutMs = 10000, signal?: AbortSignal): Promise<void> {
  if (window.sagecell) return Promise.resolve();
  if (signal?.aborted) return Promise.reject(new Error('Aborted'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SageCell script failed to load')), timeoutMs);
    const check = setInterval(() => {
      if (window.sagecell) {
        clearInterval(check);
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }
    }, 50);
    const onAbort = () => {
      clearInterval(check);
      clearTimeout(timer);
      reject(new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function createSageMathExecutor() {
  const execute = async (code: string, timeoutMs = DEFAULT_SAGE_TIMEOUT, signal?: AbortSignal): Promise<SageResult> => {
    if (signal?.aborted) {
      return { success: false, stdout: '', error: 'Cancelled' };
    }

    try {
      await waitForSageCell(10000, signal);
    } catch {
      return { success: false, stdout: '', error: 'SageCell not loaded. Check network connection.' };
    }

    const container = createOffscreenContainer();
    injectSageScript(container, code);

    return new Promise<SageResult>((resolve) => {
      let resolved = false;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        signal?.removeEventListener('abort', onAbort);
        if (pollTimer) clearInterval(pollTimer);
        try { document.body.removeChild(container); } catch { /* already removed */ }
      };

      const finish = (result: SageResult) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        observer.disconnect();
        cleanup();
        resolve(result);
      };

      const onAbort = () => {
        finish({ success: false, stdout: '', error: 'Cancelled' });
      };

      const timeout = setTimeout(() => {
        finish({ success: false, stdout: '', error: `Execution timed out after ${timeoutMs / 1000}s` });
      }, timeoutMs);

      const observer = new MutationObserver(() => {
        if (resolved) return;
        const stdoutDiv = container.querySelector('.sagecell_stdout');
        if (!stdoutDiv) return;

        // Start polling stdout for completion markers (once)
        if (pollTimer) return;
        pollTimer = setInterval(() => {
          if (resolved) return;
          const text = stdoutDiv.textContent || '';
          if (!text.trim()) return;

          // Detect completion markers
          if (text.includes('=SUCCESS') || text.includes('=FAILED')) {
            finish({ success: text.includes('=SUCCESS'), stdout: text.trim() });
            return;
          }
        }, 200);
      });

      observer.observe(container, { childList: true, subtree: true, characterData: true });

      signal?.addEventListener('abort', onAbort, { once: true });

      try {
        window.sagecell.makeSagecell({
          inputLocation: `#${container.id}`,
          template: window.sagecell.templates.minimal,
          evalButtonText: 'Evaluate',
          autoeval: true,
          callback: () => {
            // Callback fires when evaluation is queued, output still needs polling
          },
        });
      } catch (err: unknown) {
        if (!resolved) {
          clearTimeout(timeout);
          observer.disconnect();
          if (pollTimer) clearInterval(pollTimer);
          const message = err instanceof Error ? err.message : 'Failed to execute Sage code';
          finish({ success: false, stdout: '', error: message });
        }
      }
    });
  };

  return { execute };
}

export function useSageMath() {
  // AbortController that fires when the consuming component unmounts.
  // This ensures in-flight executions are cancelled and their side effects
  // (timers, observers, DOM elements) are cleaned up.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    return () => {
      controller.abort();
      controllerRef.current = null;
    };
  }, []);

  const executor = useMemo(() => createSageMathExecutor(), []);

  const execute = async (
    code: string,
    timeoutMs = DEFAULT_SAGE_TIMEOUT,
    signal?: AbortSignal,
  ): Promise<SageResult> => {
    const lifecycleSignal = controllerRef.current?.signal;
    if (lifecycleSignal?.aborted) {
      return { success: false, stdout: '', error: 'Component unmounted' };
    }

    // Merge lifecycle signal with any user-provided signal so that
    // both component unmount and manual abort trigger cancellation.
    const signals: AbortSignal[] = [];
    if (lifecycleSignal) signals.push(lifecycleSignal);
    if (signal) signals.push(signal);

    const combinedSignal = combineSignals(signals);

    return executor.execute(code, timeoutMs, combinedSignal);
  };

  return { execute };
}

export function useSageMathParallel() {
  // Lifecycle AbortController — aborts on component unmount
  const lifecycleRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    lifecycleRef.current = controller;
    return () => {
      controller.abort();
      lifecycleRef.current = null;
    };
  }, []);

  const executeAll = useCallback(async (
    codes: string[],
    concurrency = 3,
    timeoutMs = DEFAULT_SAGE_TIMEOUT,
    onResult?: (index: number, result: SageResult) => boolean,
    externalController?: AbortController
  ): Promise<(SageResult & { index: number })[]> => {
    const results: (SageResult & { index: number })[] = [];
    const queue = codes.map((code, index) => ({ code, index }));
    const inProgress = new Set<number>();
    const controller = externalController ?? new AbortController();

    // Merge lifecycle signal with controller signal so that
    // both component unmount and manual/early-stop abort trigger cancellation.
    const lifecycleSignal = lifecycleRef.current?.signal;
    const combinedSignal = combineSignals(
      lifecycleSignal ? [controller.signal, lifecycleSignal] : [controller.signal]
    );

    return new Promise((resolve) => {
      const { execute } = createSageMathExecutor();

      const processNext = () => {
        if (queue.length === 0 && inProgress.size === 0) {
          resolve(results.sort((a, b) => a.index - b.index));
          return;
        }

        while (inProgress.size < concurrency && queue.length > 0) {
          const item = queue.shift()!;
          inProgress.add(item.index);

          execute(item.code, timeoutMs, combinedSignal)
            .then((result) => {
              results.push({ ...result, index: item.index });
              if (onResult && onResult(item.index, result)) {
                controller.abort();
                while (queue.length > 0) {
                  const remaining = queue.shift()!;
                  results.push({ success: false, stdout: '', error: 'Aborted', index: remaining.index });
                }
              }
            })
            .catch((err: unknown) => {
              const message = err instanceof Error ? err.message : 'Unknown error';
              results.push({ success: false, stdout: '', error: message, index: item.index });
            })
            .finally(() => {
              inProgress.delete(item.index);
              processNext();
            });
        }
      };

      processNext();
    });
  }, []);

  return { executeAll, createController: () => new AbortController() };
}
