import { useRef, useCallback, useEffect } from 'react';
import { WORKER_POOL_SIZE } from '../config';

interface PendingTask {
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
  onProgress?: (pct: number, detail?: string) => void;
}

interface QueuedTask {
  id: number;
  attackId: string;
  vals: Record<string, string>;
}

/**
 * Hook that manages a pool of Web Workers for running attack frontendCheck
 * computations off the main thread. Falls back to main-thread execution
 * when Workers are unavailable (old browser, extension blocking).
 *
 * Worker pool size is configurable via WORKER_POOL_SIZE in config.ts.
 * Tasks are distributed round-robin to the first available worker.
 * If all workers are busy, the task is queued and processed as workers free up.
 */
export function useWorkerPool(poolSize: number = WORKER_POOL_SIZE) {
  const workersRef = useRef<Worker[]>([]);
  const busyRef = useRef<boolean[]>([]);
  const pendingRef = useRef<Map<number, PendingTask>>(new Map());
  const queueRef = useRef<QueuedTask[]>([]);
  const idCounterRef = useRef(0);
  const fallbackRef = useRef(false);
  const freeRef = useRef<number[]>([]);

  const processQueue = () => {
    while (queueRef.current.length > 0) {
      if (freeRef.current.length === 0) break;
      const freeIndex = freeRef.current.shift()!;
      const task = queueRef.current.shift()!;
      busyRef.current[freeIndex] = true;
      workersRef.current[freeIndex].postMessage({
        id: task.id,
        attackId: task.attackId,
        params: task.vals,
      });
    }
  };

  useEffect(() => {
    const workers = workersRef.current;

    if (typeof Worker === 'undefined') {
      fallbackRef.current = true;
      return;
    }

    try {
      for (let i = 0; i < poolSize; i++) {
        const worker = new Worker(
          new URL('../workers/attack-worker.ts', import.meta.url),
          { type: 'module' },
        );
        worker.onmessage = (e: MessageEvent) => {
          const data = e.data as { type: 'progress'; id: number; pct: number; detail?: string } | { id: number; result: string | null; error?: string };
          if ('type' in data) {
            const { id, pct, detail } = data;
            const pending = pendingRef.current.get(id);
            if (pending?.onProgress) {
              pending.onProgress(pct, detail);
            }
            return;
          }
          const { id, result, error } = data;
          const pending = pendingRef.current.get(id);
          if (pending) {
            pendingRef.current.delete(id);
            if (error) pending.reject(new Error(error));
            else pending.resolve(result);
          }
          freeRef.current.push(i);
          busyRef.current[i] = false;
          processQueue();
        };
        worker.onerror = () => {
          freeRef.current.push(i);
          busyRef.current[i] = false;
          processQueue();
        };
        workers.push(worker);
        busyRef.current.push(false);
      }
      freeRef.current = Array.from({ length: poolSize }, (_, i) => i);
    } catch (e) {
      console.warn('useWorkerPool: failed to create Workers, falling back to main thread:', e);
      fallbackRef.current = true;
    }

    const pending = pendingRef.current;
    const queue = queueRef.current;
    return () => {
      for (const w of workers) {
        w.terminate();
      }
      workersRef.current = [];
      busyRef.current = [];
      freeRef.current = [];
      pending.clear();
      queue.length = 0;
    };
  }, [poolSize]);

  const runAttack = useCallback((
    attackId: string,
    vals: Record<string, string>,
    onProgress?: (pct: number, detail?: string) => void,
  ): Promise<string | null> => {
    return new Promise<string | null>((resolve, reject) => {
      // Fallback: Workers unavailable → run on main thread via dynamic import
      if (fallbackRef.current || workersRef.current.length === 0) {
        import('../attacks/index').then(({ attacks }) => {
          const attack = attacks.find(a => a.id === attackId);
          if (!attack?.frontendCheck) {
            resolve(null);
            return;
          }
          attack.frontendCheck(vals, onProgress).then(resolve).catch(reject);
        }).catch(reject);
        return;
      }

      const id = ++idCounterRef.current;
      pendingRef.current.set(id, { resolve, reject, onProgress });

      const freeIndex = freeRef.current.shift();
      if (freeIndex !== undefined) {
        busyRef.current[freeIndex] = true;
        workersRef.current[freeIndex].postMessage({
          id,
          attackId,
          params: vals,
        });
      } else {
        queueRef.current.push({ id, attackId, vals });
      }
    });
  }, []);

  const cancelCurrentRun = useCallback(() => {
    const cancelledIds = Array.from(pendingRef.current.keys());

    // Resolve all pending with null — caller will discard cancelled results
    for (const [, pending] of pendingRef.current) {
      pending.resolve(null);
    }
    pendingRef.current.clear();

    // Clear the queue so no queued tasks start
    queueRef.current = [];

    // Send cancel signal to all workers
    // Workers that receive this before posting results will discard them
    for (const worker of workersRef.current) {
      worker.postMessage({ type: 'cancel', ids: cancelledIds });
    }
  }, []);

  return { runAttack, cancelCurrentRun };
}
