import { useMemo } from 'react';

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

function injectSageScript(container: HTMLElement, code: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.type = 'text/x-sage';
  script.textContent = code;
  container.appendChild(script);
  return script;
}

function waitForSageCell(timeoutMs = 10000): Promise<void> {
  if (window.sagecell) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SageCell script failed to load')), timeoutMs);
    const check = setInterval(() => {
      if (window.sagecell) {
        clearInterval(check);
        clearTimeout(timer);
        resolve();
      }
    }, 50);
  });
}

export function createSageMathExecutor() {
  const execute = async (code: string, timeoutMs = 35000, signal?: AbortSignal): Promise<SageResult> => {
    if (signal?.aborted) {
      return { success: false, stdout: '', error: 'Cancelled' };
    }

    try {
      await waitForSageCell();
    } catch {
      return { success: false, stdout: '', error: 'SageCell not loaded. Check network connection.' };
    }

    const container = createOffscreenContainer();
    injectSageScript(container, code);

    return new Promise<SageResult>((resolve) => {
      let resolved = false;

      const cleanup = () => {
        signal?.removeEventListener('abort', onAbort);
        try { document.body.removeChild(container); } catch { /* already removed */ }
      };

      const onAbort = () => {
        resolved = true;
        clearTimeout(timeout);
        observer.disconnect();
        cleanup();
        resolve({ success: false, stdout: '', error: 'Cancelled' });
      };

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ success: false, stdout: '', error: `Execution timed out after ${timeoutMs / 1000}s` });
        }
      }, timeoutMs);

      const observer = new MutationObserver(() => {
        if (resolved) return;
        const stdoutDiv = container.querySelector('.sagecell_stdout');
        if (!stdoutDiv) return;

        setTimeout(() => {
          if (resolved) return;
          const text = stdoutDiv.textContent || '';
          if (!text.trim()) return;

          resolved = true;
          clearTimeout(timeout);
          observer.disconnect();
          cleanup();
          resolve({ success: true, stdout: text.trim() });
        }, 500);
      });

      observer.observe(container, { childList: true, subtree: true });

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
          resolved = true;
          clearTimeout(timeout);
          observer.disconnect();
          cleanup();
          const message = err instanceof Error ? err.message : 'Failed to execute Sage code';
          resolve({ success: false, stdout: '', error: message });
        }
      }
    });
  };

  return { execute };
}

export function useSageMath() {
  return useMemo(() => createSageMathExecutor(), []);
}

export function useSageMathParallel() {
  const executeAll = async (
    codes: string[],
    concurrency = 3,
    timeoutMs = 35000,
    onResult?: (index: number, result: SageResult) => boolean
  ): Promise<(SageResult & { index: number })[]> => {
    const results: (SageResult & { index: number })[] = [];
    const queue = codes.map((code, index) => ({ code, index }));
    const inProgress = new Set<number>();
    const controller = new AbortController();

    return new Promise((resolve) => {
      const { execute } = createSageMathExecutor();

      const processNext = async () => {
        if (queue.length === 0 && inProgress.size === 0) {
          resolve(results.sort((a, b) => a.index - b.index));
          return;
        }

        while (inProgress.size < concurrency && queue.length > 0) {
          const item = queue.shift()!;
          inProgress.add(item.index);

          execute(item.code, timeoutMs, controller.signal)
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
  };

  return { executeAll };
}
