import { createContext, useState, useCallback, useRef, useMemo, useEffect, type ReactNode } from 'react';
import type { AppContextType, HistoryEntry, NotificationState } from '../types';

export const AppContext = createContext<AppContextType | null>(null);
const HISTORY_PREVIEW_LENGTH = 200;

function toHistoryPreview(result: string): string {
  const normalized = result.endsWith('...') ? `${result.slice(0, -3)}…` : result;
  return normalized.length > HISTORY_PREVIEW_LENGTH
    ? `${normalized.slice(0, HISTORY_PREVIEW_LENGTH)}…`
    : normalized;
}

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
        const timestamp = new Date(e.timestamp);
        if (timestamp.getTime() > cutoff) acc.push({ ...e, timestamp, result: toHistoryPreview(e.result) });
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
    const entry: HistoryEntry = { id: crypto.randomUUID(), attackId, attackName, timestamp: new Date(), result: toHistoryPreview(result), success };
    setHistory(prev => [entry, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    try {
      if (history.length === 0) {
        localStorage.removeItem('rsa-history:v1');
        localStorage.removeItem('rsa-history');
        return;
      }
      const stored = history.map(e => ({ ...e, result: toHistoryPreview(e.result) }));
      localStorage.setItem('rsa-history:v1', JSON.stringify(stored));
    } catch { /* localStorage full or unavailable — silently ignore */ }
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
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
    history, addToHistory, clearHistory, notification, showNotification,
    commandPaletteOpen, setCommandPaletteOpen,
  }), [
    app.selectedAttack, app.viewMode, app.calculatorMode, app.outputResult, app.outputError, app.outputSource,
    history, addToHistory, clearHistory, notification, showNotification,
    commandPaletteOpen, setCommandPaletteOpen,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

