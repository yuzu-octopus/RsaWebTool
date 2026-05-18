export interface SageResult {
  success: boolean;
  stdout: string;
  error?: string;
}

declare global {
  interface Window {
    sagecell: {
      makeSagecell: (config: {
        inputLocation: string;
        template?: any;
        evalButtonText?: string;
        autoeval?: boolean;
        callback?: () => void;
      }) => void;
      templates: {
        minimal: any;
      };
    };
  }
}

export function useSageMath() {
  const execute = async (code: string, timeoutMs = 35000): Promise<SageResult> => {
    if (!window.sagecell) {
      return { success: false, stdout: '', error: 'SageCell not loaded. Check network connection.' };
    }

    const containerId = `sagecell-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';
    document.body.appendChild(container);

    const script = document.createElement('script');
    script.type = 'text/x-sage';
    script.textContent = code;
    container.appendChild(script);

    return new Promise<SageResult>((resolve) => {
      let resolved = false;

      const cleanup = () => {
        document.body.removeChild(container);
      };

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ success: false, stdout: '', error: 'Execution timed out after 35s' });
        }
      }, timeoutMs);

      const pollInterval = setInterval(() => {
        const outputDiv = container.querySelector('.sage .sage-output');
        if (outputDiv) {
          const text = outputDiv.textContent || '';
          const errorDiv = container.querySelector('.sage .sage-error');
          const errorText = errorDiv?.textContent || '';

          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            clearInterval(pollInterval);
            cleanup();

            if (errorText) {
              resolve({ success: false, stdout: text, error: errorText });
            } else {
              resolve({ success: true, stdout: text.trim() });
            }
          }
        }
      }, 500);

      try {
        window.sagecell.makeSagecell({
          inputLocation: `#${containerId}`,
          template: window.sagecell.templates.minimal,
          evalButtonText: 'Evaluate',
          autoeval: true,
          callback: () => {
            // Callback fires when evaluation is queued, output still needs polling
          },
        });
      } catch (err: any) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          clearInterval(pollInterval);
          cleanup();
          resolve({ success: false, stdout: '', error: err.message || 'Failed to execute Sage code' });
        }
      }
    });
  };

  return { execute };
}

export function useSageMathParallel() {
  const executeAll = async (
    codes: string[],
    concurrency = 3,
    timeoutMs = 35000
  ): Promise<(SageResult & { index: number })[]> => {
    const results: (SageResult & { index: number })[] = [];
    const queue = codes.map((code, index) => ({ code, index }));
    const inProgress = new Set<number>();

    return new Promise((resolve) => {
      const { execute } = useSageMath();

      const processNext = async () => {
        if (queue.length === 0 && inProgress.size === 0) {
          resolve(results.sort((a, b) => a.index - b.index));
          return;
        }

        while (inProgress.size < concurrency && queue.length > 0) {
          const item = queue.shift()!;
          inProgress.add(item.index);

          execute(item.code, timeoutMs)
            .then((result) => {
              results.push({ ...result, index: item.index });
            })
            .catch((err) => {
              results.push({ success: false, stdout: '', error: err.message, index: item.index });
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
