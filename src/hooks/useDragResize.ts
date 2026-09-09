import { useState, useRef, useCallback, useEffect } from 'react';

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

  // Ref synced via effect (not during render) to provide current value
  // to event handlers without stale closures.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const [dragging, setDragging] = useState(false);
  const startPos = useRef(0);
  const startVal = useRef(0);
  // Value at drag start (after clamp-sync). Persist on mouseup only if the
  // drag actually moved it, so a press-without-move in a narrowed window
  // never overwrites the wide-window preference in storage.
  const dragStartVal = useRef(0);

  // Synchronously-updated ref for the current drag value.
  // Used to persist the final value on mouseup without writing on every pixel.
  const currentValueRef = useRef(value);

  // Effect manages document-level listeners while dragging.
  // React's effect cleanup removes listeners on unmount, preventing leaks.
  useEffect(() => {
    if (!dragging) return;

    const cursor = axis === 'x' ? 'col-resize' : 'row-resize';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      const currentPos = axis === 'x' ? ev.clientX : ev.clientY;
      const newValue = Math.min(max, Math.max(min, startVal.current + startPos.current - currentPos));
      setValue(newValue);
      currentValueRef.current = newValue;
      onChange?.(newValue);
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (storageKey && currentValueRef.current !== dragStartVal.current) {
        try {
          localStorage.setItem(storageKey, String(currentValueRef.current));
        } catch {
          /* ignore */
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Cleanup on unmount or when dragging becomes false
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, axis, min, max, storageKey, onChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startPos.current = axis === 'x' ? e.clientX : e.clientY;
      // Sync to the rendered (clamped) width first: after the window narrows,
      // stored state can exceed max, and dragging from it would walk through
      // invisible slack before anything moves on screen.
      const synced = Math.min(max, Math.max(min, valueRef.current));
      if (synced !== valueRef.current) {
        setValue(synced);
        currentValueRef.current = synced;
      }
      startVal.current = synced;
      dragStartVal.current = synced;
      setDragging(true);
    },
    [axis, min, max],
  );

  return [value, handleMouseDown];
}
