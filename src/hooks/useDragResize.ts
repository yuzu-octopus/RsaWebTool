import { useState, useRef, useCallback } from 'react';

export interface UseDragResizeParams {
  axis: 'x' | 'y';
  min: number;
  max: number;
  defaultValue: number;
  storageKey?: string;
  onChange?: (value: number) => void;
}

export function useDragResize(params: UseDragResizeParams): [number, (e: React.MouseEvent) => void] {
  const { axis, min, max, defaultValue, storageKey, onChange } = params;

  const [value, setValue] = useState(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const n = parseInt(stored, 10);
          if (n >= min && n <= max) return n;
        }
      } catch {
        /* ignore */
      }
    }
    return defaultValue;
  });

  const isDragging = useRef(false);
  const startPos = useRef(0);
  const startVal = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = axis === 'x' ? e.clientX : e.clientY;
      startVal.current = value;

      const cursor = axis === 'x' ? 'col-resize' : 'row-resize';

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const currentPos = axis === 'x' ? ev.clientX : ev.clientY;
        const newValue = Math.min(max, Math.max(min, startVal.current + startPos.current - currentPos));
        setValue(newValue);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, String(newValue));
          } catch {
            /* ignore */
          }
        }
        onChange?.(newValue);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = cursor;
      document.body.style.userSelect = 'none';
    },
    [axis, min, max, value, storageKey, onChange],
  );

  return [value, handleMouseDown];
}
