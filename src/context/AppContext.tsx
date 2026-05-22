import { useState, useCallback, useRef, type ReactNode } from 'react';
import type { AppContextType, HistoryEntry, NotificationState } from '../types';
import { AppContext } from './ctx';

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedAttack, setSelectedAttack] = useState<AppContextType['selectedAttack']>(null);
  const [viewMode, setViewMode] = useState<AppContextType['viewMode']>('attack');
  const [outputResult, setOutputResult] = useState<string | null>(null);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const keyCounter = useRef(0);

  const addToHistory = useCallback((attackId: string, attackName: string, result: string, success: boolean) => {
    setHistory(prev => [{ attackId, attackName, timestamp: new Date(), result, success }, ...prev].slice(0, 50));
  }, []);

  const showNotification = useCallback((message: string) => {
    if (!message) {
      setNotification(null);
      return;
    }
    const key = ++keyCounter.current;
    setNotification({ message, key });
  }, []);

  return (
    <AppContext.Provider value={{ selectedAttack, setSelectedAttack, viewMode, setViewMode, outputResult, setOutputResult, outputError, setOutputError, history, addToHistory, notification, showNotification }}>
      {children}
    </AppContext.Provider>
  );
}

