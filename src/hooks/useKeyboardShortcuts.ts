import { useEffect } from 'react';
import { useAppContext } from './useAppContext';

export function useKeyboardShortcuts() {
  const { viewMode, commandPaletteOpen, setCommandPaletteOpen } = useAppContext();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.isComposing) return;

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(open => !open);
        return;
      }

      const target = e.target;
      const isEditable = target instanceof Element && (
        target.matches('input, textarea, select, [contenteditable]') ||
        Boolean(target.closest('[contenteditable]'))
      );
      if (commandPaletteOpen || isEditable) return;

      switch (e.key.toLowerCase()) {
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
          if (viewMode === 'attack') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('rsa-run-attack'));
          }
          break;
        case 'c':
          if (e.shiftKey && viewMode === 'attack') {
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
  }, [viewMode, commandPaletteOpen, setCommandPaletteOpen]);
}
