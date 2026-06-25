import { useMemo, useEffect, useRef, useCallback } from 'react';
import env from '../config/env';

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
export const DEFAULT_SAGE_TIMEOUT = env.sagecellTimeout * 1000;

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

function detectError(container: HTMLElement): string | null {
  // Check .sagecell_error elements
  const errorDiv = container.querySelector('.sagecell_error');
  if (errorDiv && errorDiv.textContent?.trim()) {
    return errorDiv.textContent.trim();
  }

  // Check .sagecell_computation for red-colored error content
  const compDiv = container.querySelector('.sagecell_computation');
  if (compDiv) {
    const redEl = compDiv.querySelector('[style*="color: red"], [style*="color:red"]');
    if (redEl && redEl.textContent?.trim()) {
      return redEl.textContent.trim();
    }
    const errorClassEl = compDiv.querySelector('[class*="error"], [class*="Error"]');
    if (errorClassEl && errorClassEl.textContent?.trim()) {
      return errorClassEl.textContent.trim();
    }
  }

  // Check any element with style.color === 'red' in the container
  const allRed = container.querySelectorAll('[style*="color: red"], [style*="color:red"]');
  for (const el of allRed) {
    if (el.textContent?.trim()) {
      return el.textContent.trim();
    }
  }

  return null;
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

function createSageMathExecutor() {
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
    if (import.meta.env.DEV) console.warn('[SageCell]', 'Script injected, container id:', container.id);

    return new Promise<SageResult>((resolve) => {
      let resolved = false;
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let kernelAliveTimer: ReturnType<typeof setTimeout> | null = null;
      let hasSeenStdout = false;

      const cleanup = () => {
        signal?.removeEventListener('abort', onAbort);
        if (pollTimer) clearInterval(pollTimer);
        if (kernelAliveTimer) clearTimeout(kernelAliveTimer);
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
        if (import.meta.env.DEV) console.warn('[SageCell]', 'Timeout fired after', timeoutMs, 'ms');
        // Before finishing with timeout, check if error DOM elements exist
        const errorText = detectError(container);
        if (errorText) {
          finish({ success: false, stdout: '', error: errorText });
        } else if (hasSeenStdout) {
          finish({ success: false, stdout: '', error: `SageCell execution timed out after ${timeoutMs / 1000}s. The attack may be too computationally expensive for browser execution.` });
        } else {
          finish({ success: false, stdout: '', error: 'SageCell produced no output. The kernel may have crashed. Check that all required inputs are filled.' });
        }
      }, timeoutMs);

      const observer = new MutationObserver(() => {
        if (resolved) return;

        // Check for error indicators first (kernel crash, red error boxes)
        const errorText = detectError(container);
        if (errorText) {
          if (import.meta.env.DEV) console.warn('[SageCell]', 'Error element detected:', errorText);
          finish({ success: false, stdout: '', error: errorText });
          return;
        }

        // Check for stdout
        const stdoutDiv = container.querySelector('.sagecell_stdout');
        if (stdoutDiv) {
          if (!hasSeenStdout) {
            hasSeenStdout = true;
            if (import.meta.env.DEV) console.warn('[SageCell]', 'stdout element detected');
          }

          // Start polling stdout for completion markers (once)
          if (pollTimer) return;
          let lastStdoutText = '';
          let lastChangeTime = Date.now();
          pollTimer = setInterval(() => {
            if (resolved) return;
            const text = stdoutDiv.textContent || '';

            // Detect completion markers — highest priority
            if (text.includes('=SUCCESS') || text.includes('=FAILED')) {
              finish({ success: text.includes('=SUCCESS'), stdout: text.trim() });
              return;
            }

            // Track stdout changes for stall detection
            if (text !== lastStdoutText) {
              lastStdoutText = text;
              lastChangeTime = Date.now();
            }

            // Stall detection: if stdout hasn't changed in 30s, kernel likely died
            // 30s avoids false positives on slow lattice/LLL computations
            if (Date.now() - lastChangeTime > env.stallTimeout * 1000) {
              if (text.trim()) {
                finish({
                  success: false,
                  stdout: text.trim(),
                  error: `SageCell kernel stalled — no output for ${env.stallTimeout}s.\n\nOutput before stall:\n${text.trim()}`,
                });
              } else {
                finish({
                  success: false,
                  stdout: '',
                  error: `SageCell produced no output for ${env.stallTimeout}s. The kernel may have crashed or the computation is too slow for remote execution.`,
                });
              }
              return;
            }
          }, 200);
        }
      });

      observer.observe(container, { childList: true, subtree: true, characterData: true });

      signal?.addEventListener('abort', onAbort, { once: true });

      try {
        if (import.meta.env.DEV) console.warn('[SageCell]', 'Initializing SageCell...');
        window.sagecell.makeSagecell({
          inputLocation: `#${container.id}`,
          template: window.sagecell.templates.minimal,
          evalButtonText: 'Evaluate',
          autoeval: true,
          callback: () => {
            if (import.meta.env.DEV) console.warn('[SageCell]', 'SageCell evaluation queued');
            // Startup detection: if no stdout or error after 10s, kernel likely failed to start
            kernelAliveTimer = setTimeout(() => {
              if (resolved) return;
              const hasAnyOutput = container.querySelector('.sagecell_output, .sagecell_stdout, .sagecell_files, .sagecell_computation');
              if (!hasAnyOutput) {
                const lateError = detectError(container);
                if (lateError) {
                  if (import.meta.env.DEV) console.warn('[SageCell]', 'Kernel error via startup check:', lateError);
                  finish({ success: false, stdout: '', error: lateError });
                } else {
                  if (import.meta.env.DEV) console.warn('[SageCell]', 'No output after 10s, kernel may have crashed');
                  finish({ success: false, stdout: '', error: 'SageCell kernel produced no output after 10s. The kernel may have crashed during startup. Check your network connection and try again.' });
                }
              }
            }, 10000);
          },
        });
        if (import.meta.env.DEV) console.warn('[SageCell]', 'SageCell initialized successfully');
      } catch (err: unknown) {
        if (!resolved) {
          clearTimeout(timeout);
          observer.disconnect();
          if (pollTimer) clearInterval(pollTimer);
          if (kernelAliveTimer) clearTimeout(kernelAliveTimer);
          const message = err instanceof Error ? err.message : 'Failed to execute Sage code';
          if (import.meta.env.DEV) console.warn('[SageCell]', 'makeSagecell threw:', message);
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

    const combinedSignal = AbortSignal.any(signals);

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
    concurrency = env.sagecellSlots,
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
    const combinedSignal = AbortSignal.any(lifecycleSignal ? [controller.signal, lifecycleSignal] : [controller.signal]);

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
