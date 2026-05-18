export interface InputField {
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: 'text' | 'number' | 'textarea' | 'select';
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string;
}

export interface Attack {
  id: string;
  name: string;
  description: string;
  category: string;
  inputs: InputField[];
  sageTemplate: (vals: Record<string, string>) => string;
  proof: string;
  priority: 'high' | 'medium' | 'low';
  applicableCheck: (params: Record<string, string>) => boolean;
  outputFormat?: string;
  sageCode?: string;
}

export interface HistoryEntry {
  attackId: string;
  attackName: string;
  timestamp: Date;
  result: string;
  success: boolean;
}

export interface MagicResult {
  success: boolean;
  stdout: string;
  error?: string;
  format: string;
  duration: number;
}

export interface SageResult {
  success: boolean;
  stdout: string;
  error?: string;
}

export interface AppContextType {
  selectedAttack: Attack | null;
  setSelectedAttack: (attack: Attack | null) => void;
  viewMode: 'attack' | 'magic' | 'proofs';
  setViewMode: (mode: 'attack' | 'magic' | 'proofs') => void;
  outputResult: string | null;
  setOutputResult: (result: string | null) => void;
  outputError: string | null;
  setOutputError: (error: string | null) => void;
  history: HistoryEntry[];
  addToHistory: (attackId: string, attackName: string, result: string, success: boolean) => void;
}

export interface DetectedFormat {
  type: 'hex' | 'decimal' | 'base64' | 'ascii' | 'unknown';
  confidence: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  attacks: Attack[];
}
