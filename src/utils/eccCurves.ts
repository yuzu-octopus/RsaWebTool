import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256, p384, p521 } from '@noble/curves/nist.js';
import { hexToBytes } from '@noble/curves/utils.js';

export interface CurveEntry {
  id: string;
  label: string;
  instance?: typeof secp256k1;
  hasSign: boolean;
  hasEcdh: boolean;
}

export const CURVES: CurveEntry[] = [
  { id: 'secp256k1', label: 'secp256k1', instance: secp256k1, hasSign: true, hasEcdh: true },
  { id: 'p256', label: 'P-256 (secp256r1)', instance: p256, hasSign: true, hasEcdh: true },
  { id: 'p384', label: 'P-384 (secp384r1)', instance: p384, hasSign: true, hasEcdh: true },
  { id: 'p521', label: 'P-521 (secp521r1)', instance: p521, hasSign: true, hasEcdh: true },
  { id: 'curve25519', label: 'Curve25519 (X25519)', hasSign: false, hasEcdh: true },
];

export const KEY_OPS = ['generate', 'pubkey', 'ecdh'] as const;
export type KeyOp = typeof KEY_OPS[number];

export function curveForOp(id: string): typeof secp256k1 | undefined {
  return CURVES.find(c => c.id === id)?.instance;
}

export function parseMsg(input: string): Uint8Array {
  const t = input.trim();
  if (/^[0-9a-fA-F]+$/.test(t) && t.length % 2 === 0) return hexToBytes(t);
  return new TextEncoder().encode(t);
}
