import type { Attack } from '../types';
import { extractPQ, reportFactor } from '../utils/factordb';
import env from '../config/env';
import { modInverse, modPow } from '../utils/bigint';
import { bigIntToBytes } from '../utils/converters';

/**
 * Submit p,q to FactorDB if the result contains extractable p,q values.
 * Works for any attack that factors n (Factorization, Lattice, Advanced, etc.)
 * as long as n is provided in the input params.
 */
export function submitToFactorDB(
  _attack: Attack,
  result: string,
  n: string | undefined,
  notify: (msg: string, severity?: 'success' | 'error' | 'info') => void,
) {
  const pq = extractPQ(result);
  if (pq && n) {
    if (env.reportFactors) reportFactor(n, [pq.p, pq.q]).then(
      resp => notify(resp === 'Already fully factored' ? 'Already known to FactorDB' : 'Submitted to FactorDB', 'info'),
      () => notify('Failed to submit to FactorDB', 'error'),
    );
  }
}

/**
 * If a factorization attack found p,q and the user provided e and c,
 * compute the decrypted message and return a human-readable string.
 * Returns null if decryption isn't possible.
 */
export function autoDecrypt(
  attack: Attack,
  params: Record<string, string>,
  resultStdout: string,
): string | null {
  if (attack.category !== 'Factorization') return null;
  const pq = extractPQ(resultStdout);
  if (!pq || !params.e || !params.c || !params.n) return null;
  try {
    const e = BigInt(params.e);
    const c = BigInt(params.c);
    const n = BigInt(params.n);
    const p = BigInt(pq.p);
    const q = BigInt(pq.q);
    const phi = (p - 1n) * (q - 1n);
    const d = modInverse(e, phi);
    if (!d) return null;
    const m = modPow(c, d, n);
    const bytes = bigIntToBytes(m);
    try {
      const text = new TextDecoder().decode(bytes);
      return text;
    } catch {
      // Not valid UTF-8 — return hex
      return m.toString(16);
    }
  } catch {
    return null;
  }
}
