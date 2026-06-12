import { useState, useCallback, useMemo } from 'react';
import { useAppContext } from './useAppContext';

export interface UseCalculatorOutputOptions {
  /** History category (e.g., 'calculator-rsa', 'calculator-aes'). */
  category: string;
  /** When true (default), dispatch also sets outputSource to 'calculator'. */
  setSource?: boolean;
}

export interface CalculatorOutputApi {
  /** Local result text — for in-component display alongside the global output panel. */
  result: string | null;
  /** Local error text. */
  error: string | null;
  /** Dispatch a successful result: updates local state, global output, and history. */
  dispatch: (text: string, label: string) => void;
  /** Dispatch an error: updates local state and global error. */
  dispatchError: (msg: string) => void;
  /** Clear both local and global result/error. */
  clear: () => void;
}

/**
 * Encapsulates the "set local result, set global output, set source, add to history"
 * sequence that was repeated 30+ times across calculator tabs.
 *
 * @example
 *   const out = useCalculatorOutput({ category: 'calculator-rsa' });
 *   out.dispatch('n = ...\nd = ...', 'RSA Key Gen');
 *   // in JSX:
 *   {out.result && <Box>{out.result}</Box>}
 *   {out.error && <Typography color="error">{out.error}</Typography>}
 */
export function useCalculatorOutput({
  category,
  setSource = true,
}: UseCalculatorOutputOptions): CalculatorOutputApi {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult, setOutputError, setOutputSource, addToHistory } = useAppContext();

  const dispatch = useCallback(
    (text: string, label: string) => {
      setResult(text);
      setError(null);
      setOutputResult(text);
      setOutputError(null);
      if (setSource) setOutputSource('calculator');
      addToHistory(category, label, text, true);
    },
    [category, setSource, setOutputResult, setOutputError, setOutputSource, addToHistory],
  );

  const dispatchError = useCallback(
    (msg: string) => {
      setError(msg);
      setResult(null);
      setOutputResult(null);
      setOutputError(msg);
      if (setSource) setOutputSource('calculator');
    },
    [setSource, setOutputResult, setOutputError, setOutputSource],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setOutputResult(null);
    setOutputError(null);
  }, [setOutputResult, setOutputError]);

  return useMemo(
    () => ({ result, error, dispatch, dispatchError, clear }),
    [result, error, dispatch, dispatchError, clear],
  );
}
