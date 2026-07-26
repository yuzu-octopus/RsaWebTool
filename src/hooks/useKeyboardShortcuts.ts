import { useEffect } from 'react';
import { useAppContext } from './useAppContext';

export function useKeyboardShortcuts() {
  const { viewMode, setCommandPaletteOpen } = useAppContext();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === 'Tab') return;

      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          setCommandPaletteOpen(open => !open);
          break;
        case '1':
          e.preventDefault();
          if (viewMode === 'calculator') {
            window.dispatchEvent(new CustomEvent('calculator-switch-tab', { detail: 0 }));
          } else {
            window.dispatchEvent(new CustomEvent('rsa-switch-tab', { detail: 0 }));
          }
          break;
        case '2':
          e.preventDefault();
          if (viewMode === 'calculator') {
            window.dispatchEvent(new CustomEvent('calculator-switch-tab', { detail: 1 }));
          } else {
            window.dispatchEvent(new CustomEvent('rsa-switch-tab', { detail: 1 }));
          }
          break;
        case '3':
          e.preventDefault();
          if (viewMode === 'calculator') {
            window.dispatchEvent(new CustomEvent('calculator-switch-tab', { detail: 2 }));
          } else {
            window.dispatchEvent(new CustomEvent('rsa-switch-tab', { detail: 2 }));
          }
          break;
        case '4':
          e.preventDefault();
          if (viewMode === 'calculator') {
            window.dispatchEvent(new CustomEvent('calculator-switch-tab', { detail: 3 }));
          }
          break;
        case '5':
          e.preventDefault();
          if (viewMode === 'calculator') {
            window.dispatchEvent(new CustomEvent('calculator-switch-tab', { detail: 4 }));
          }
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
  }, [viewMode, setCommandPaletteOpen]);
}
