import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseCopyToClipboardResult {
  /** True for `resetMs` after a successful copy — use to show "Copied!" feedback. */
  copied: boolean;
  /** Write text to clipboard. Returns whether the write succeeded. */
  copy: (text: string) => Promise<boolean>;
}

/**
 * Tiny wrapper around `navigator.clipboard.writeText` that exposes a
 * `copied` flag which auto-resets after a configurable delay.
 *
 * Replaces the ad-hoc `setTimeout(() => setCopiedMsg(null), 2000)`
 * pattern in `OutputPanel` and gives MagicPanel / other copy buttons
 * a consistent "copy succeeded" UX.
 */
export function useCopyToClipboard(resetMs = 2000): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
