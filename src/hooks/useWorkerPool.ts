import { useRef, useCallback, useEffect } from 'react';
import { WORKER_POOL_SIZE } from '../config';

interface PendingTask {
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
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

  const processQueue = () => {
    while (queueRef.current.length > 0) {
      const freeIndex = busyRef.current.indexOf(false);
      if (freeIndex === -1) break;
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
        worker.onmessage = (e: MessageEvent<{ id: number; result: string | null; error?: string }>) => {
          const { id, result, error } = e.data;
          const pending = pendingRef.current.get(id);
          if (pending) {
            pendingRef.current.delete(id);
            if (error) pending.reject(new Error(error));
            else pending.resolve(result);
          }
          busyRef.current[i] = false;
          processQueue();
        };
        worker.onerror = () => {
          busyRef.current[i] = false;
          processQueue();
        };
        workersRef.current.push(worker);
        busyRef.current.push(false);
      }
    } catch (e) {
      console.warn('useWorkerPool: failed to create Workers, falling back to main thread:', e);
      fallbackRef.current = true;
    }

    return () => {
      for (const w of workersRef.current) {
        w.terminate();
      }
      workersRef.current = [];
      busyRef.current = [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pendingRef.current.clear();
      queueRef.current = [];
    };
  }, [poolSize]);

  const runAttack = useCallback((
    attackId: string,
    vals: Record<string, string>,
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
          attack.frontendCheck(vals).then(resolve).catch(reject);
        }).catch(reject);
        return;
      }

      const id = ++idCounterRef.current;
      pendingRef.current.set(id, { resolve, reject });

      const freeIndex = busyRef.current.indexOf(false);
      if (freeIndex !== -1) {
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

  return { runAttack };
}
