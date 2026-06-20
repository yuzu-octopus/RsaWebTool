import { useRef, useCallback, useEffect } from 'react';
import env from '../config/env';

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
 * Worker pool size is configurable via env.workerPoolSize (console: env.workers = N).
 * Tasks are distributed round-robin to the first available worker.
 * If all workers are busy, the task is queued and processed as workers free up.
 */
export function useWorkerPool(poolSize: number = env.workerPoolSize) {
  const workersRef = useRef<Worker[]>([]);
  const busyRef = useRef<boolean[]>([]);
  const pendingRef = useRef<Map<number, PendingTask> | null>(null);
  if (pendingRef.current === null) pendingRef.current = new Map();
  const pending = pendingRef.current;
  const queueRef = useRef<QueuedTask[]>([]);
  const idCounterRef = useRef(0);
  const fallbackRef = useRef(false);
  const freeRef = useRef<number[]>([]);
  const currentTaskIdRef = useRef<(number | null)[]>([]);

  const processQueue = () => {
    while (queueRef.current.length > 0) {
      if (freeRef.current.length === 0) break;
      const freeIndex = freeRef.current.shift()!;
      const task = queueRef.current.shift()!;
      busyRef.current[freeIndex] = true;
      currentTaskIdRef.current[freeIndex] = task.id;
      workersRef.current[freeIndex].postMessage({
        id: task.id,
        attackId: task.attackId,
        params: task.vals,
      });
    }
  };

  // Factory: creates a single worker with the proper onmessage/onerror handlers
  const createWorker = (i: number): Worker => {
    const worker = new Worker(
      new URL('../workers/attack-worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data as { type: 'progress'; id: number; pct: number; detail?: string } | { id: number; result: string | null; error?: string };
      if ('type' in data) {
        const { id, pct, detail } = data;
        const pt = pending.get(id);
        if (pt?.onProgress) {
          pt.onProgress(pct, detail);
        }
        return;
      }
      const { id, result, error } = data;
      const pt = pending.get(id);
      if (pt) {
        pending.delete(id);
        if (error) pt.reject(new Error(error));
        else pt.resolve(result);
      }
      freeRef.current.push(i);
      busyRef.current[i] = false;
      processQueue();
    };
    worker.onerror = () => {
      const taskId = currentTaskIdRef.current[i];
      if (taskId !== undefined && taskId !== null) {
        const pt = pending.get(taskId);
        if (pt) {
          pending.delete(taskId);
          pt.reject(new Error('Web Worker crashed'));
        }
      }
      currentTaskIdRef.current[i] = null;
      freeRef.current.push(i);
      busyRef.current[i] = false;
      processQueue();
    };
    return worker;
  };

  // Init: creates the full worker pool — called from useEffect and after termination
  const initWorkers = () => {
    if (typeof Worker === 'undefined') {
      fallbackRef.current = true;
      return;
    }
    try {
      for (let i = 0; i < poolSize; i++) {
        workersRef.current.push(createWorker(i));
        busyRef.current.push(false);
        currentTaskIdRef.current.push(null);
      }
      freeRef.current = Array.from({ length: poolSize }, (_, i) => i);
    } catch (e) {
      console.warn('useWorkerPool: failed to create Workers, falling back to main thread:', e);
      fallbackRef.current = true;
    }
  };

  useEffect(() => {
    initWorkers();

    const queue = queueRef.current;
    return () => {
      for (const w of workersRef.current) {
        w.terminate();
      }
      workersRef.current = [];
      busyRef.current = [];
      freeRef.current = [];
      currentTaskIdRef.current = [];
      pending.clear();
      queue.length = 0;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolSize]);

  const runAttack = useCallback((
    attackId: string,
    vals: Record<string, string>,
    onProgress?: (pct: number, detail?: string) => void,
  ): Promise<string | null> => {
    return new Promise<string | null>((resolve, reject) => {
      // Lazily re-create workers if they were terminated by cancelCurrentRun
      if (workersRef.current.length === 0 && !fallbackRef.current) {
        initWorkers();
      }

      // Fallback: Workers unavailable → run on main thread via dynamic import
      if (fallbackRef.current || workersRef.current.length === 0) {
        const id = ++idCounterRef.current;
        pending.set(id, { resolve, reject, onProgress });
        import('../attacks/index').then(({ attacks }) => {
          // Check if cancelled while import was loading
          if (!pending.has(id)) return;
          const attack = attacks.find(a => a.id === attackId);
          if (!attack?.frontendCheck) {
            pending.delete(id);
            resolve(null);
            return;
          }
          // frontendCheck may be sync or async (MaybePromise<string | null>);
          // Promise.resolve() normalizes both cases to a Promise.
          Promise.resolve(attack.frontendCheck(vals, onProgress)).then(result => {
            if (pending.has(id)) {
              pending.delete(id);
              resolve(result);
            }
          }).catch(err => {
            if (pending.has(id)) {
              pending.delete(id);
              reject(err instanceof Error ? err : new Error(String(err)));
            }
          });
        }).catch(err => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
        return;
      }

      const id = ++idCounterRef.current;
      pending.set(id, { resolve, reject, onProgress });

      const freeIndex = freeRef.current.shift();
      if (freeIndex !== undefined) {
        busyRef.current[freeIndex] = true;
        currentTaskIdRef.current[freeIndex] = id;
        workersRef.current[freeIndex].postMessage({
          id,
          attackId,
          params: vals,
        });
      } else {
        queueRef.current.push({ id, attackId, vals });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelCurrentRun = useCallback(() => {
    // Resolve all pending with null — caller will discard cancelled results
    for (const [, task] of pending) {
      task.resolve(null);
    }
    pending.clear();

    // Clear the queue so no queued tasks start
    queueRef.current = [];

    // Terminate all workers immediately — kills any hung computation
    // Workers will be lazily re-created on next runAttack call
    for (const worker of workersRef.current) {
      worker.terminate();
    }
    workersRef.current = [];
    busyRef.current = [];
    freeRef.current = [];
    currentTaskIdRef.current = [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { runAttack, cancelCurrentRun };
}
