import { useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import type { AppContextType, HistoryEntry, NotificationState } from '../types';
import { AppContext } from './ctx';

export function AppProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState({
    selectedAttack: null as AppContextType['selectedAttack'],
    viewMode: 'attack' as AppContextType['viewMode'],
    calculatorMode: 'rsa' as AppContextType['calculatorMode'],
    outputResult: null as string | null,
    outputError: null as string | null,
    outputSource: null as AppContextType['outputSource'],
  });
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem('rsa-history:v1') ?? localStorage.getItem('rsa-history');
      if (!stored) return [];
      const entries = JSON.parse(stored) as HistoryEntry[];
      const cutoff = Date.now() - 86_400_000; // 24 hours
      return entries.reduce<HistoryEntry[]>((acc, e) => {
        const t = new Date(e.timestamp);
        if (t.getTime() > cutoff) acc.push({ ...e, timestamp: t });
        return acc;
      }, []);
    } catch {
      return [];
    }
  });
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const keyCounter = useRef(0);

  const addToHistory = useCallback((attackId: string, attackName: string, result: string, success: boolean) => {
    setHistory(prev => {
      const entry: HistoryEntry = { attackId, attackName, timestamp: new Date(), result, success };
      const updated = [entry, ...prev].slice(0, 50);
      // Persist to localStorage (truncate result to 200 chars to stay under quota)
      try {
        const stored = updated.map(e => ({ ...e, result: e.result.length > 200 ? e.result.slice(0, 200) + '...' : e.result }));
        localStorage.setItem('rsa-history:v1', JSON.stringify(stored));
      } catch { /* localStorage full or unavailable — silently ignore */ }
      return updated;
    });
  }, []);

  const showNotification = useCallback((message: string, severity?: 'success' | 'error' | 'info') => {
    if (!message) {
      setNotification(null);
      return;
    }
    const key = ++keyCounter.current;
    setNotification({ message, key, severity });
  }, []);

  const value = useMemo(() => ({
    selectedAttack: app.selectedAttack,
    setSelectedAttack: (v: AppContextType['selectedAttack']) => setApp(prev => ({ ...prev, selectedAttack: v })),
    viewMode: app.viewMode,
    setViewMode: (v: AppContextType['viewMode']) => setApp(prev => ({ ...prev, viewMode: v })),
    calculatorMode: app.calculatorMode,
    setCalculatorMode: (v: AppContextType['calculatorMode']) => setApp(prev => ({ ...prev, calculatorMode: v })),
    outputResult: app.outputResult,
    setOutputResult: (v: string | null) => setApp(prev => ({ ...prev, outputResult: v })),
    outputError: app.outputError,
    setOutputError: (v: string | null) => setApp(prev => ({ ...prev, outputError: v })),
    outputSource: app.outputSource,
    setOutputSource: (v: AppContextType['outputSource']) => setApp(prev => ({ ...prev, outputSource: v })),
    history, addToHistory, notification, showNotification,
    commandPaletteOpen, setCommandPaletteOpen,
  }), [
    app.selectedAttack, app.viewMode, app.calculatorMode, app.outputResult, app.outputError, app.outputSource,
    history, addToHistory, notification, showNotification,
    commandPaletteOpen, setCommandPaletteOpen,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

