import { CATEGORIES, attacksByCategory } from '../attacks';

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

export type SidebarItem = SidebarAttackItem | SidebarModuleItem;

export const SIDEBAR_MODULES: SidebarModuleItem[] = [
  { type: 'module', id: 'instructions', mode: 'instructions', label: 'Instructions' },
  { type: 'module', id: 'magic', mode: 'magic', label: 'Magic Panel' },
  { type: 'module', id: 'proofs', mode: 'proofs', label: 'Attack Index' },
  { type: 'module', id: 'calculator', mode: 'calculator', label: 'RSA Calculator' },
  { type: 'module', id: 'format-converter', mode: 'format-converter', label: 'Format Converter' },
  { type: 'module', id: 'pem', mode: 'pem', label: 'PEM Decryptor' },
];

// Full sidebar order: attacks grouped by category, then modules
export const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  ...CATEGORIES.flatMap(cat =>
    (attacksByCategory.get(cat) ?? []).map(a => ({ type: 'attack' as const, id: a.id })),
  ),
  ...SIDEBAR_MODULES,
];
