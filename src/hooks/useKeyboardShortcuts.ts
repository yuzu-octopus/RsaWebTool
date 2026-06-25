import { useEffect } from 'react';
import { useAppContext } from './useAppContext';
import { attacks } from '../attacks';
import { ALL_SIDEBAR_ITEMS } from '../config/sidebarItems';

export function useKeyboardShortcuts() {
  const { selectedAttack, setSelectedAttack, setViewMode, setCalculatorMode, viewMode, calculatorMode } = useAppContext();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppContext();
  const toggle = () => setCommandPaletteOpen(!commandPaletteOpen);

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
        } else if (viewMode === 'calculator') {
          currentIdx = ALL_SIDEBAR_ITEMS.findIndex(
            item => item.type === 'calculator-tab' && item.calculatorMode === calculatorMode,
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
        } else if (nextItem.type === 'calculator-tab') {
          setViewMode('calculator');
          setCalculatorMode(nextItem.calculatorMode);
        } else {
          setViewMode(nextItem.mode as 'attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter' | 'instructions' | 'pem');
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
  }, [setViewMode, setCalculatorMode, selectedAttack, setSelectedAttack, viewMode, calculatorMode]);
}
