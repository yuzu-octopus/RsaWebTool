import { use } from 'react';
import { AppContext } from '../context/ctx';

export function useAppContext() {
  const ctx = use(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
