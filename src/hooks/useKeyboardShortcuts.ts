import { useEffect } from 'react';
import { useAppContext } from './useAppContext';

import { CIPHER_IDS } from '../config/sidebarItems';

export function useKeyboardShortcuts() {
  const { viewMode, setViewMode, commandPaletteOpen, setCommandPaletteOpen } = useAppContext();
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
        case '2':
        case '3':
        case '4':
        case '5': {
          e.preventDefault();
          const idx = Number(e.key) - 1;
          setViewMode(CIPHER_IDS[idx]);
          break;
        }
        case 'enter':
          if (viewMode === 'rsa') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('rsa-run-attack'));
          }
          break;
        case 'c':
          if (e.shiftKey && viewMode === 'rsa') {
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
  }, [viewMode, setViewMode, commandPaletteOpen, setCommandPaletteOpen]);
}
