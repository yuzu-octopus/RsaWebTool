import type { SageResult } from '../hooks/useSageMath';

export interface SageDispatchSetters {
  setResult: (s: string | null) => void;
  setError: (s: string | null) => void;
  setCtxOutput: (s: string | null) => void;
  setCtxError: (s: string | null) => void;
  setOutputSource: (s: 'input' | 'magic' | 'calculator' | null) => void;
  addToHistory: (id: string, name: string, result: string, success: boolean) => void;
}

/**
 * Standardize how SageCell results are dispatched into the calculator UI.
 * Replaces the 6 copy-pasted `if (sageResult.success) { ... } else { ... }`
 * blocks that previously lived in ECC and DH calculator tabs.
 *
 * On success: appends the `METHOD=SAGEMATHCELL` marker that consumers can
 * grep for (existing convention), updates the in-tab result, mirrors to
 * the global output panel, and adds the entry to history.
 *
 * On failure: surfaces the SageCell error to both the in-tab error display
 * and the global output error slot.
 */
export function handleSageResult(
  result: SageResult,
  category: string,
  label: string,
  setters: SageDispatchSetters,
): void {
  if (result.success) {
    const display = result.stdout + '\nMETHOD=SAGEMATHCELL';
    setters.setResult(display);
    setters.setError(null);
    setters.setCtxOutput(display);
    setters.setCtxError(null);
    setters.setOutputSource('calculator');
    setters.addToHistory(category, label, display, true);
  } else {
    const errMsg = result.error || 'SageCell execution failed';
    setters.setError(errMsg);
    setters.setResult(null);
    setters.setCtxOutput(null);
    setters.setCtxError(errMsg);
    setters.setOutputSource('calculator');
  }
}
