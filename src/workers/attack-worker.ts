/**
 * Web Worker for running attack frontendCheck computations off the main thread.
 * Also handles Proof-of-Work computation via the built-in PoW solver.
 * Imports all attacks via the barrel and runs frontendCheck for a given attackId.
 * Workers have no DOM access, but all attack frontendCheck functions are pure
 * BigInt math (no DOM dependencies), so this is safe.
 *
 * Message protocol:
 *   Main → Worker: { id: number, attackId: string, params: Record<string, string> }
 *   Main → Worker: { type: 'cancel', ids: number[] }
 *   Worker → Main: { id: number, result: string | null, error?: string }
 *   Worker → Main: { type: 'progress', id: number, pct: number, detail?: string }
 *
 * Special attackId '__pow__' runs the PoW solver with leading-zero difficulty.
 * Returns JSON-stringified PoWResult on success.
 */

import { attacksById } from '../attacks';
import env from '../config/env';
import { setFactorDBProxy } from '../utils/factordb';
import { solvePoW } from './pow-worker';
export type { PoWInput, PoWResult } from './pow-worker';
export { solvePoW };

// Initialize services that rely on singleton config (same as App.tsx does on main thread)
setFactorDBProxy(env.factordbProxyUrl);

interface CancelMessage {
  type: 'cancel';
  ids: number[];
}

interface WorkerRequest {
  id: number;
  attackId: string;
  params: Record<string, string>;
}

interface WorkerResponse {
  id: number;
  result: string | null;
  error?: string;
}

interface WorkerProgress {
  type: 'progress';
  id: number;
  pct: number;
  detail?: string;
}

// Track cancelled task IDs — when a cancel message arrives ahead of a task's completion,
// the worker discards the result instead of posting it back.
const cancelledIds = new Set<number>();

// AbortControllers for PoW tasks keyed by task ID — enables proper AbortSignal propagation
const HASH_BITS: Record<string, number> = {
  'SHA-256': 256,
  'SHA-384': 384,
  'SHA-512': 512,
  'SHA-1': 160,
  MD5: 128,
};

const powControllers = new Map<number, AbortController>();

self.onmessage = (e: MessageEvent<CancelMessage | WorkerRequest>) => {
  const data = e.data;

  // Handle cancel messages
  if ('type' in data && data.type === 'cancel') {
    for (const id of data.ids) {
      cancelledIds.add(id);
      const ctrl = powControllers.get(id);
      if (ctrl) {
        ctrl.abort();
        powControllers.delete(id);
      }
    }
    return;
  }

  const { id, attackId, params } = data as WorkerRequest;

  // Check if this task was already cancelled before starting
  if (cancelledIds.has(id)) {
    cancelledIds.delete(id);
    return;
  }

  // Special handler: Proof-of-Work computation (attackId === '__pow__')
  if (attackId === '__pow__') {
    const challenge = params.challenge;
    const difficulty = Number(params.difficulty);
    if (!challenge || !/^(?:[1-9]\d*)$/.test(params.difficulty) || !Number.isSafeInteger(difficulty) || difficulty < 1 || difficulty > (HASH_BITS[params.hashAlgorithm] ?? 0)) {
      if (!cancelledIds.has(id)) {
        self.postMessage({ id, result: null, error: 'Invalid PoW params: challenge and difficulty must fit the selected hash' } satisfies WorkerResponse);
      }
      return;
    }

    const abortController = new AbortController();
    powControllers.set(id, abortController);
    void (async () => {
      try {
        const onProgress = (pct: number, detail?: string) => {
          if (!cancelledIds.has(id)) {
            self.postMessage({ type: 'progress', id, pct, detail } satisfies WorkerProgress);
          }
        };
        const result = await solvePoW({ challenge, difficulty, hashAlgorithm: params.hashAlgorithm }, abortController.signal, onProgress);
        if (!cancelledIds.has(id)) {
          self.postMessage({ id, result: result ? JSON.stringify(result) : null } satisfies WorkerResponse);
        }
      } catch (err) {
        if (!cancelledIds.has(id)) {
          self.postMessage({ id, result: null, error: String(err) } satisfies WorkerResponse);
        }
      } finally {
        powControllers.delete(id);
      }
    })();
    return;
  }

  // Standard attack handler
  const attack = attacksById.get(attackId);
  if (!attack?.frontendCheck) {
    if (!cancelledIds.has(id)) {
      self.postMessage({ id, result: null } satisfies WorkerResponse);
    }
    return;
  }

  void (async () => {
    try {
      const onProgress = (pct: number, detail?: string) => {
        if (!cancelledIds.has(id)) {
          self.postMessage({ type: 'progress', id, pct, detail } satisfies WorkerProgress);
        }
      };
      const result = await attack.frontendCheck!(params, onProgress);
      if (!cancelledIds.has(id)) {
        self.postMessage({ id, result } satisfies WorkerResponse);
      }
    } catch (err) {
      if (!cancelledIds.has(id)) {
        self.postMessage({ id, result: null, error: String(err) } satisfies WorkerResponse);
      }
    }
  })();
};
