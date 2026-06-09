import { useState, useRef, useEffect, useCallback } from 'react';
import { useDragResize } from './useDragResize';

const NOTEPAD_EXPIRY_MS = 3600000; // 1 hour

export function useNotepad() {
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [notepadText, setNotepadText] = useState(() => {
    try {
      const stored = localStorage.getItem('notepad:v1') ?? localStorage.getItem('notepad');
      if (stored) {
        const { text, timestamp } = JSON.parse(stored) as { text: string; timestamp: number };
        if (Date.now() - timestamp < NOTEPAD_EXPIRY_MS) return text;
      }
    } catch { /* ignore */ }
    return '';
  });
  const notepadTextRef = useRef(notepadText);

  const [notepadHeight, handleNotepadResizeMouseDown] = useDragResize({
    axis: 'y',
    min: 80,
    max: 200,
    defaultValue: 80,
    storageKey: 'notepadHeight',
  });

  // Debounced localStorage save (500ms)
  useEffect(() => {
    if (!notepadOpen) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('notepad:v1', JSON.stringify({ text: notepadText, timestamp: Date.now() }));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [notepadText, notepadOpen]);

  // Sync ref
  useEffect(() => {
    notepadTextRef.current = notepadText;
  }, [notepadText]);

  // Beforeunload flush
  useEffect(() => {
    if (!notepadOpen) return;
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem('notepad:v1', JSON.stringify({ text: notepadTextRef.current, timestamp: Date.now() }));
      } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notepadOpen]);

  const handleNotepadChange = useCallback((text: string) => {
    setNotepadText(text);
  }, []);

  return {
    notepadOpen,
    setNotepadOpen,
    notepadText,
    handleNotepadChange,
    notepadHeight,
    handleNotepadResizeMouseDown,
  };
}
