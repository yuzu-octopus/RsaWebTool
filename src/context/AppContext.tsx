import { useState, useCallback, type ReactNode } from 'react';
import type { AppContextType, HistoryEntry } from '../types';
import { AppContext } from './ctx';

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedAttack, setSelectedAttack] = useState<AppContextType['selectedAttack']>(null);
  const [viewMode, setViewMode] = useState<AppContextType['viewMode']>('attack');
  const [outputResult, setOutputResult] = useState<string | null>(null);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const addToHistory = useCallback((attackId: string, attackName: string, result: string, success: boolean) => {
    setHistory(prev => [{ attackId, attackName, timestamp: new Date(), result, success }, ...prev].slice(0, 50));
  }, []);

  return (
    <AppContext.Provider value={{ selectedAttack, setSelectedAttack, viewMode, setViewMode, outputResult, setOutputResult, outputError, setOutputError, history, addToHistory }}>
      {children}
    </AppContext.Provider>
  );
}

