/**
 * Web Worker for running attack frontendCheck computations off the main thread.
 * Imports all attacks via the barrel and runs frontendCheck for a given attackId.
 * Workers have no DOM access, but all attack frontendCheck functions are pure
 * BigInt math (no DOM dependencies), so this is safe.
 *
 * Message protocol:
 *   Main → Worker: { id: number, attackId: string, params: Record<string, string> }
 *   Main → Worker: { type: 'cancel', ids: number[] }
 *   Worker → Main: { id: number, result: string | null, error?: string }
 *   Worker → Main: { type: 'progress', id: number, pct: number, detail?: string }
 */

import { attacks } from '../attacks';
import env from '../config/env';
import { setFactorDBProxy } from '../utils/factordb';

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

self.onmessage = (e: MessageEvent<CancelMessage | WorkerRequest>) => {
  const data = e.data;

  // Handle cancel messages
  if ('type' in data && data.type === 'cancel') {
    for (const id of data.ids) {
      cancelledIds.add(id);
    }
    return;
  }

  const { id, attackId, params } = data as WorkerRequest;

  // Check if this task was already cancelled before starting
  if (cancelledIds.has(id)) {
    cancelledIds.delete(id);
    return;
  }

  const attack = attacks.find(a => a.id === attackId);
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
