import { CATEGORIES, attacksByCategory } from '../attacks';
import { AES_ATTACKS } from '../data/attackExplanations/aes';
import { ECC_ATTACKS } from '../data/attackExplanations/ecc';
import { DH_ATTACKS } from '../data/attackExplanations/dh';

export interface SidebarCipherItem {
  type: 'cipher';
  id: 'rsa' | 'aes' | 'ecc' | 'hash' | 'dh';
  label: string;
}

export interface SidebarAttackItem {
  type: 'attack';
  id: string;
}

export interface SidebarCipherAttackItem {
  type: 'cipher-attack';
  cipher: 'aes' | 'ecc' | 'dh' | 'hash';
  id: string;
}

export interface SidebarModuleItem {
  type: 'module';
  id: 'magic';
  label: string;
}

export type SidebarItem = SidebarCipherItem | SidebarAttackItem | SidebarCipherAttackItem | SidebarModuleItem;

export const CIPHER_IDS = ['rsa', 'aes', 'ecc', 'hash', 'dh'] as const;

export const CIPHER_ITEMS: SidebarCipherItem[] = [
  { type: 'cipher', id: 'rsa', label: 'RSA' },
  { type: 'cipher', id: 'aes', label: 'AES' },
  { type: 'cipher', id: 'ecc', label: 'ECC' },
  { type: 'cipher', id: 'hash', label: 'Hash' },
  { type: 'cipher', id: 'dh', label: 'DH' },
];

export const MAGIC_ITEM: SidebarModuleItem = { type: 'module', id: 'magic', label: 'Magic Panel' };

export interface CipherAttackGroup {
  cipher: 'aes' | 'ecc' | 'dh' | 'hash';
  label: string;
  attacks: { id: string; label: string }[];
}

export const CIPHER_ATTACK_GROUPS: CipherAttackGroup[] = [
  { cipher: 'aes', label: 'AES Attacks', attacks: AES_ATTACKS.map(a => ({ id: a.value, label: a.label })) },
  { cipher: 'ecc', label: 'ECC Attacks', attacks: ECC_ATTACKS.map(a => ({ id: a.value, label: a.label })) },
  { cipher: 'dh', label: 'DH Attacks', attacks: DH_ATTACKS.map(a => ({ id: a.value, label: a.label })) },
  {
    cipher: 'hash',
    label: 'Hash Attacks',
    attacks: [
      { id: 'length-ext', label: 'Length Extension' },
      { id: 'hmac', label: 'HMAC' },
      { id: 'pow', label: 'Proof of Work' },
    ],
  },
];

export const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  ...CIPHER_ITEMS,
  ...(CATEGORIES.flatMap(cat =>
    (attacksByCategory.get(cat) ?? []).map(a => ({ type: 'attack' as const, id: a.id })),
  )),
  ...CIPHER_ATTACK_GROUPS.flatMap(g =>
    g.attacks.map(a => ({ type: 'cipher-attack' as const, cipher: g.cipher, id: a.id })),
  ),
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
