import { useCallback } from 'react';
import { useAppContext } from './useAppContext';

export function useCommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppContext();

  const toggle = useCallback(() => {
    setCommandPaletteOpen(!commandPaletteOpen);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const open = useCallback(() => setCommandPaletteOpen(true), [setCommandPaletteOpen]);
  const close = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen]);

  return { commandPaletteOpen, toggle, open, close };
}
