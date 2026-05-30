export interface InputField {
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: 'text' | 'number' | 'textarea' | 'select';
  required?: boolean;
  tooltip?: string;
  options?: { label: string; value: string }[];
}

export type AttackCategory = 'Factorization' | 'Partial Key / Lattice' | 'Message / Protocol' | 'Oracle' | 'Advanced';

export interface Attack {
  id: string;
  name: string;
  description: string;
  category: AttackCategory;
  inputs: InputField[];
  sageTemplate?: (vals: Record<string, string>) => string;
  proof: string;
  usageGuide?: string;
  priority: 'high' | 'medium' | 'low';
  applicableCheck: (params: Record<string, string>) => boolean;
  frontendCheck?: (vals: Record<string, string>, onProgress?: (pct: number, detail?: string) => void) => Promise<string | null>;
}

export interface HistoryEntry {
  attackId: string;
  attackName: string;
  timestamp: Date;
  result: string;
  success: boolean;
}

export interface NotificationState {
  message: string;
  key: number;
  severity?: 'success' | 'error' | 'info';
}

export interface AppContextType {
  selectedAttack: Attack | null;
  setSelectedAttack: (attack: Attack | null) => void;
  viewMode: 'attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter';
  setViewMode: (mode: 'attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter') => void;
  outputResult: string | null;
  setOutputResult: (result: string | null) => void;
  outputError: string | null;
  setOutputError: (error: string | null) => void;
  outputSource: 'input' | 'magic' | null;
  setOutputSource: (source: 'input' | 'magic' | null) => void;
  history: HistoryEntry[];
  addToHistory: (attackId: string, attackName: string, result: string, success: boolean) => void;
  notification: NotificationState | null;
  showNotification: (message: string, severity?: 'success' | 'error' | 'info') => void;
}
