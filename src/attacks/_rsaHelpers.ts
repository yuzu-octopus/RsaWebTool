import type { Attack } from '../types';

/**
 * Common applicableCheck patterns for RSA attacks.
 * Centralized to avoid 20+ duplicate inline checks across attack files.
 */
export const rsaNeeds = {
  n: (p: Record<string, string>) => !!p.n,
  nE: (p: Record<string, string>) => !!p.n && !!p.e,
  nC: (p: Record<string, string>) => !!p.n && !!p.c,
  nEC: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c,
  nP: (p: Record<string, string>) => !!p.n && !!p.p,
  nQ: (p: Record<string, string>) => !!p.n && !!p.q,
  nPQ: (p: Record<string, string>) => !!p.n && !!p.p && !!p.q,
  nPhi: (p: Record<string, string>) => !!p.n && !!p.phi,
  nDP: (p: Record<string, string>) => !!p.n && !!p.dp,
  nDQ: (p: Record<string, string>) => !!p.n && !!p.dq,
  n1N2: (p: Record<string, string>) => !!p.n1 && !!p.n2,
  nALeak: (p: Record<string, string>) => !!p.n && !!p.a && !!p.leak,
  moduliList: (p: Record<string, string>) => {
    const vals = (p.moduli_list || '').trim();
    if (!vals) return false;
    return vals.split('\n').filter(x => x.trim()).length >= 2;
  },
  pairsMultiline: (p: Record<string, string>) => {
    const vals = (p.pairs || '').trim();
    if (!vals) return false;
    return vals.split('\n').filter(x => x.trim()).length >= 2;
  },
} as const;

/**
 * No-op sageTemplate for pure-TypeScript attacks (frontendCheck only).
 * Returns a clear message if ever triggered, explaining the attack is browser-only.
 */
export const noopSageTemplate = (): string =>
  'This attack runs entirely in the browser via frontendCheck. No SageMath execution is needed.\n\nSee the proof panel for the algorithm and the result panel for the computed output.\n\nTOKEN=NOT_APPLICABLE';

/**
 * Helper to add the no-op sageTemplate to an attack object.
 * Use: { ...attack, sageTemplate: noopSageTemplate }
 */
export const withNoopSage = <T extends Pick<Attack, 'sageTemplate'>>(attack: T): T => ({
  ...attack,
  sageTemplate: noopSageTemplate,
});
