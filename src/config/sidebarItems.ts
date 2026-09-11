import { CATEGORIES, attacksByCategory } from '../attacks';

export interface SidebarCipherItem {
  type: 'cipher';
  id: 'rsa' | 'aes' | 'ecc' | 'hash' | 'dh';
  label: string;
}

export interface SidebarAttackItem {
  type: 'attack';
  id: string;
}

export interface SidebarModuleItem {
  type: 'module';
  id: 'magic';
  label: string;
}

export type SidebarItem = SidebarCipherItem | SidebarAttackItem | SidebarModuleItem;

export const CIPHER_IDS = ['rsa', 'aes', 'ecc', 'hash', 'dh'] as const;

export const CIPHER_ITEMS: SidebarCipherItem[] = [
  { type: 'cipher', id: 'rsa', label: 'RSA' },
  { type: 'cipher', id: 'aes', label: 'AES' },
  { type: 'cipher', id: 'ecc', label: 'ECC' },
  { type: 'cipher', id: 'hash', label: 'Hash' },
  { type: 'cipher', id: 'dh', label: 'DH' },
];

export const MAGIC_ITEM: SidebarModuleItem = { type: 'module', id: 'magic', label: 'Magic Panel' };

export const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  ...CIPHER_ITEMS,
  ...(CATEGORIES.flatMap(cat =>
    (attacksByCategory.get(cat) ?? []).map(a => ({ type: 'attack' as const, id: a.id })),
  )),
  MAGIC_ITEM,
];

/** Tinted count badges per attack category (brand: tinted tags, never solid status). */
export const CATEGORY_BADGE_VARIANTS: Record<string, 'green' | 'purple' | 'cyan' | 'orange' | 'yellow' | 'pink'> = {
  Factorization: 'green',
  'Partial Key / Lattice': 'purple',
  'Message / Protocol': 'cyan',
  Oracle: 'orange',
  Advanced: 'yellow',
  Symmetric: 'pink',
  Hash: 'cyan',
  ECC: 'purple',
};
