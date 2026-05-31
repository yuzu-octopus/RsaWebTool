import { useEffect } from 'react';
import { useAppContext } from './useAppContext';
import { useCommandPalette } from './useCommandPalette';
import { attacks, CATEGORIES, attacksByCategory } from '../attacks';

// Match sidebar rendering order: attacks grouped by category, then modules
const ALL_SIDEBAR_ITEMS = [
  ...CATEGORIES.flatMap(cat =>
    (attacksByCategory.get(cat) ?? []).map(a => ({ type: 'attack' as const, id: a.id })),
  ),
  { type: 'module' as const, id: 'instructions', mode: 'instructions' as const },
  { type: 'module' as const, id: 'magic', mode: 'magic' as const },
  { type: 'module' as const, id: 'proofs', mode: 'proofs' as const },
  { type: 'module' as const, id: 'calculator', mode: 'calculator' as const },
  { type: 'module' as const, id: 'format-converter', mode: 'format-converter' as const },
  { type: 'module' as const, id: 'pem', mode: 'pem' as const },
];

export function useKeyboardShortcuts() {
  const { selectedAttack, setSelectedAttack, setViewMode, viewMode } = useAppContext();
  const { toggle } = useCommandPalette();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Tab/Shift+Tab to cycle through all sidebar items (attacks + modules)
      if (e.key === 'Tab') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();

        // Find current position in the combined list
        let currentIdx: number;
        if (selectedAttack && viewMode === 'attack') {
          currentIdx = ALL_SIDEBAR_ITEMS.findIndex(
            item => item.type === 'attack' && item.id === selectedAttack.id,
          );
        } else {
          currentIdx = ALL_SIDEBAR_ITEMS.findIndex(
            item => item.type === 'module' && item.mode === viewMode,
          );
        }

        // If not found (e.g., unknown viewMode), wrap from start
        if (currentIdx === -1) {
          currentIdx = e.shiftKey ? ALL_SIDEBAR_ITEMS.length : -1;
        }

        // Calculate next index
        const nextIdx = e.shiftKey
          ? (currentIdx <= 0 ? ALL_SIDEBAR_ITEMS.length - 1 : currentIdx - 1)
          : (currentIdx >= ALL_SIDEBAR_ITEMS.length - 1 ? 0 : currentIdx + 1);

        // Navigate to the item
        const nextItem = ALL_SIDEBAR_ITEMS[nextIdx];
        if (nextItem.type === 'attack') {
          const attack = attacks.find(a => a.id === nextItem.id);
          if (attack) {
            setSelectedAttack(attack);
            setViewMode('attack');
          }
        } else {
          setViewMode(nextItem.mode);
        }
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
  }, [setViewMode, toggle, selectedAttack, setSelectedAttack, viewMode]);
}
