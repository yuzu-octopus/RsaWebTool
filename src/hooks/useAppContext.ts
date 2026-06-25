import { use } from 'react';
import { AppContext } from '../context/AppContext';

export function useAppContext() {
  const ctx = use(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
