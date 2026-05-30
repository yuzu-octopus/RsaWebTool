import { useEffect } from 'react';
import { useAppContext } from './useAppContext';
import { useCommandPalette } from './useCommandPalette';
import { attacks } from '../attacks';

export function useKeyboardShortcuts() {
  const { selectedAttack, setSelectedAttack, setViewMode } = useAppContext();
  const { toggle } = useCommandPalette();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Tab/Shift+Tab to switch attacks — only when not in a text input
      if (e.key === 'Tab') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        const currentIdx = selectedAttack
          ? attacks.findIndex(a => a.id === selectedAttack.id)
          : -1;
        let nextIdx: number;
        if (e.shiftKey) {
          nextIdx = currentIdx <= 0 ? attacks.length - 1 : currentIdx - 1;
        } else {
          nextIdx = currentIdx >= attacks.length - 1 ? 0 : currentIdx + 1;
        }
        setSelectedAttack(attacks[nextIdx]);
        setViewMode('attack');
        return;
      }

      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          toggle();
          break;
        case '1':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('rsa-switch-tab', { detail: 0 }));
          break;
        case '2':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('rsa-switch-tab', { detail: 1 }));
          break;
        case '3':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('rsa-switch-tab', { detail: 2 }));
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
  }, [setViewMode, toggle, selectedAttack, setSelectedAttack]);
}
