import { CATEGORIES, attacksByCategory } from '../attacks';
import type { CalculatorMode } from '../types';

export interface SidebarAttackItem {
  type: 'attack';
  id: string;
}

export interface SidebarModuleItem {
  type: 'module';
  id: string;
  mode: string;
  label: string;
}

export interface SidebarCalculatorTabItem {
  type: 'calculator-tab';
  id: string;
  label: string;
  calculatorMode: CalculatorMode;
}

export type SidebarItem = SidebarAttackItem | SidebarModuleItem | SidebarCalculatorTabItem;

export const SIDEBAR_MODULES: SidebarModuleItem[] = [
  { type: 'module', id: 'instructions', mode: 'instructions', label: 'Instructions' },
  { type: 'module', id: 'magic', mode: 'magic', label: 'Magic Panel' },
  { type: 'module', id: 'proofs', mode: 'proofs', label: 'Attack Index' },
  { type: 'module', id: 'format-converter', mode: 'format-converter', label: 'Format Converter' },
  { type: 'module', id: 'pem', mode: 'pem', label: 'PEM Decryptor' },
];

export const CALCULATOR_ITEMS: SidebarCalculatorTabItem[] = [
  { type: 'calculator-tab', id: 'rsa', label: 'RSA', calculatorMode: 'rsa' },
  { type: 'calculator-tab', id: 'aes', label: 'AES', calculatorMode: 'aes' },
  { type: 'calculator-tab', id: 'ecc', label: 'ECC', calculatorMode: 'ecc' },
  { type: 'calculator-tab', id: 'hash', label: 'Hash', calculatorMode: 'hash' },
  { type: 'calculator-tab', id: 'dh', label: 'DH', calculatorMode: 'dh' },
];

// Full sidebar order: attacks grouped by category, then calculator tabs, then modules
export const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  ...CATEGORIES.flatMap(cat =>
    (attacksByCategory.get(cat) ?? []).map(a => ({ type: 'attack' as const, id: a.id })),
  ),
  ...CALCULATOR_ITEMS,
  ...SIDEBAR_MODULES,
];
