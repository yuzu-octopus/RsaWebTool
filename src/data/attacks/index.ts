import type { Attack } from '../../types';
import { factorizationAttacks } from './factorization';
import { factorization2Attacks } from './factorization2';
import { partialKeyAttacks } from './partial-key';
import { messageProtocolAttacks } from './message-protocol';
import { oracleAttacks } from './oracle';
import { advancedAttacks } from './advanced';

export const attacks: Attack[] = [
  ...factorizationAttacks,
  ...factorization2Attacks,
  ...partialKeyAttacks,
  ...messageProtocolAttacks,
  ...oracleAttacks,
  ...advancedAttacks,
];

export const attackById = new Map(attacks.map(a => [a.id, a]));

export const CATEGORIES = [
  'Factorization',
  'Partial Key / Lattice',
  'Message / Protocol',
  'Oracle',
  'Advanced',
] as const;

export const attacksByCategory = new Map<string, Attack[]>();
for (const cat of CATEGORIES) {
  attacksByCategory.set(cat, attacks.filter(a => a.category === cat));
}
