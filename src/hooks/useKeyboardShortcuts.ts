import { useEffect } from 'react';
import { useAppContext } from './useAppContext';
import { useCommandPalette } from './useCommandPalette';

export function useKeyboardShortcuts() {
  const { setViewMode } = useAppContext();
  const { toggle } = useCommandPalette();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          toggle();
          break;
        case '1':
          e.preventDefault();
          setViewMode('attack');
          break;
        case '2':
          e.preventDefault();
          setViewMode('magic');
          break;
        case '3':
          e.preventDefault();
          setViewMode('proofs');
          break;
        case 'enter':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('rsa-run-attack'));
          break;
        case 'c':
          if (e.shiftKey) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('rsa-copy-output'));
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setViewMode, toggle]);
}
