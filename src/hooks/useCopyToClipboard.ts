import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseCopyToClipboardResult {
  /** True for `resetMs` after a successful copy — use to show "Copied!" feedback. */
  copied: boolean;
  /** Write text to the clipboard. Failures are silently swallowed (matches existing inline behavior). */
  copy: (text: string) => Promise<void>;
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetMs);
      } catch {
        // Match existing inline behavior: silently swallow clipboard errors
        // (browser may block writeText if not in a secure context or if
        // the user denied permission).
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
