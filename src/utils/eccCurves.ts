import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256, p384, p521 } from '@noble/curves/nist.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { hexToBytes } from '@noble/curves/utils.js';
import { modInverse, modPow, crtRSA } from './bigint';
import { factorPowers } from './dhCrypto';

export interface CurveEntry {
  id: string;
  label: string;
  instance?: typeof secp256k1;
  edInstance?: typeof ed25519;
  hasSign: boolean;
  hasEcdh: boolean;
}

export const CURVES: CurveEntry[] = [
  { id: 'secp256k1', label: 'secp256k1', instance: secp256k1, hasSign: true, hasEcdh: true },
  { id: 'p256', label: 'P-256 (secp256r1)', instance: p256, hasSign: true, hasEcdh: true },
  { id: 'p384', label: 'P-384 (secp384r1)', instance: p384, hasSign: true, hasEcdh: true },
  { id: 'p521', label: 'P-521 (secp521r1)', instance: p521, hasSign: true, hasEcdh: true },
  { id: 'curve25519', label: 'Curve25519 (X25519)', hasSign: false, hasEcdh: true },
  { id: 'ed25519', label: 'Ed25519', edInstance: ed25519, hasSign: true, hasEcdh: false },
];

export const KEY_OPS = ['generate', 'pubkey', 'ecdh'] as const;
export type KeyOp = typeof KEY_OPS[number];

export function curveForOp(id: string): typeof secp256k1 | undefined {
  return CURVES.find(c => c.id === id)?.instance;
}

export function edForOp(id: string): typeof ed25519 | undefined {
  return CURVES.find(c => c.id === id)?.edInstance;
}

/**
 * Message encoding for ECDSA demo signing (noble `prehash: true` default,
 * i.e. standard ECDSA-SHA256 over these bytes).
 *
 * AMBIGUITY (documented, not hidden): an even-length hex string — optionally
 * `0x`-prefixed — decodes as raw bytes; anything else is UTF-8 text. So the
 * text "dead" signs as bytes 0xDE 0xAD, not as ASCII. There is no escape
 * hatch: to sign literal ASCII that looks like hex, pad or rephrase it.
 */
export function parseMsg(input: string): Uint8Array {
  const t = input.trim().replace(/\s/g, '');
  const body = t.toLowerCase().startsWith('0x') ? t.slice(2) : t;
  if (body.length > 0 && body.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(body)) return hexToBytes(body);
  return new TextEncoder().encode(input.trim());
}

/* ───────── Hex input normalisation (noble hexToBytes rejects `0x`) ───────── */

/** Strip whitespace + one `0x`/`0X` prefix; throw loudly on empty/non-hex. */
export function cleanHex(s: string, name = 'value'): string {
  const t = s.trim().replace(/\s/g, '');
  const body = t.toLowerCase().startsWith('0x') ? t.slice(2) : t;
  if (!body) throw new Error(`${name} is required (hex)`);
  if (!/^[0-9a-fA-F]+$/.test(body)) {
    throw new Error(`Invalid hex for ${name}: "${s.trim().slice(0, 32)}"`);
  }
  return body;
}

/** `cleanHex` then BigInt. `'ff'` → 255n, `'10'` → 16n (hex, never decimal). */
export function parseHexField(s: string, name = 'value'): bigint {
  return BigInt('0x' + cleanHex(s, name));
}

/** `cleanHex` then noble bytes. Rejects odd lengths with a named error. */
export function hexToBytesStrict(s: string, name = 'value'): Uint8Array {
  const body = cleanHex(s, name);
  if (body.length % 2 !== 0) {
    throw new Error(`Invalid hex length for ${name}: expected an even number of digits`);
  }
  return hexToBytes(body);
}

/**
 * Sanitised `0x…` literal for `Integer(0x…)` Sage interpolation.
 * Never emits `0x0x` on pasted `0x`-prefixed input.
 */
export function sageHex(s: string, name = 'value'): string {
  return '0x' + cleanHex(s, name);
}

/** `sageHex` that additionally rejects zero (anomalous-attack target Q). */
export function sageHexNonZero(s: string, name = 'value'): string {
  const body = cleanHex(s, name);
  if (/^0+$/.test(body)) throw new Error(`${name} must be non-zero (empty Q defaults would fake d=1)`);
  return '0x' + body;
}

/* ───────── ECDSA helpers ───────── */

export type WeierstrassCurve = typeof secp256k1;

/** Group order n of a Weierstrass curve instance. */
export function curveOrder(ci: WeierstrassCurve): bigint {
  return ci.Point.Fn.ORDER;
}

/** Reject r,s outside [1, n-1] with a named error (before Signature construction). */
export function validateSigRange(r: bigint, s: bigint, n: bigint): void {
  if (r < 1n || r >= n) throw new Error(`r out of range [1, n-1] (got 0x${r.toString(16)})`);
  if (s < 1n || s >= n) throw new Error(`s out of range [1, n-1] (got 0x${s.toString(16)})`);
}

/** High-S check: s > n/2. Noble verify defaults `lowS: true` and rejects these. */
export function isHighS(s: bigint, n: bigint): boolean {
  return s * 2n > n;
}

/**
 * Recover the nonce from two signatures sharing k:
 * k = (h1-h2)/(s1-s2) mod n. All inputs pre-reduced mod n by callers.
 */
export function recoverNonce(h1: bigint, h2: bigint, s1: bigint, s2: bigint, n: bigint): bigint {
  const hDiff = (((h1 - h2) % n) + n) % n;
  const sDiff = (((s1 - s2) % n) + n) % n;
  const inv = modInverse(sDiff, n);
  if (inv === null) throw new Error('s1-s2 not invertible mod n (identical s means no signal)');
  return (hDiff * inv) % n;
}

/** Recover d = (s1·k-h1)/r mod n. Inputs pre-reduced mod n by callers. */
export function recoverPrivKey(s1: bigint, k: bigint, h1: bigint, r: bigint, n: bigint): bigint {
  const rInv = modInverse(((r % n) + n) % n, n);
  if (rInv === null) throw new Error('r not invertible mod n');
  return (((((s1 * k) % n - (h1 % n)) % n + n) % n) * rInv) % n;
}

/**
 * Manual ECDSA with an explicit nonce k (h = int(SHA256(msg)) truncated mod n).
 * Exposes h and k so outputs feed the nonce-reuse / HNP attack tabs —
 * noble's `sign` uses a random nonce and cannot reveal it.
 */
export function ecdsaSignWithK(
  ci: WeierstrassCurve,
  h: bigint,
  d: bigint,
  k: bigint,
): { r: bigint; s: bigint } {
  const n = curveOrder(ci);
  if (k < 1n || k >= n) throw new Error('k must be in [1, n-1]');
  if (d < 1n || d >= n) throw new Error('d must be in [1, n-1]');
  const r = ci.Point.BASE.multiply(k).toAffine().x % n;
  if (r === 0n) throw new Error('r == 0: retry with a different k');
  const kInv = modInverse(k, n);
  if (kInv === null) throw new Error('k not invertible mod n');
  const s = ((((((h % n) + n) % n) + d * r) % n) * kInv) % n;
  if (s === 0n) throw new Error('s == 0: retry with a different k');
  return { r, s };
}

/* ───────── Toy-curve EC arithmetic (affine, for the local PH solver) ───────── */

export interface ECAffine {
  x: bigint;
  y: bigint;
}

type ECPoint = ECAffine | null; // null = point at infinity

function mod(a: bigint, p: bigint): bigint {
  return (((a % p) + p) % p);
}

/**
 * Exact order of P (divides `order`) by trial-dividing out prime factors.
 * Used to reduce a user-supplied base point to its true subgroup order.
 */
export function ecPointOrder(P: ECAffine, order: bigint, a: bigint, p: bigint): bigint {
  let o = order;
  for (const { prime } of factorPowers(order, 100_000)) {
    while (o % prime === 0n && ecMul(P, o / prime, a, p) === null) o /= prime;
  }
  return o;
}

export function ecNeg(P: ECPoint, p: bigint): ECPoint {
  if (P === null) return null;
  return { x: P.x, y: mod(-P.y, p) };
}

/** Point addition on y² = x³ + ax + b over F_p. */
export function ecAdd(P: ECPoint, Q: ECPoint, a: bigint, p: bigint): ECPoint {
  if (P === null) return Q;
  if (Q === null) return P;
  let lam: bigint;
  if (P.x === Q.x) {
    if (mod(P.y + Q.y, p) === 0n) return null;
    const inv = modInverse(mod(2n * P.y, p), p);
    if (inv === null) throw new Error('ecAdd: point has no tangent (y=0 doubling)');
    lam = mod((3n * P.x * P.x + a) * inv, p);
  } else {
    const inv = modInverse(mod(Q.x - P.x, p), p);
    if (inv === null) throw new Error('ecAdd: non-invertible denominator');
    lam = mod((Q.y - P.y) * inv, p);
  }
  const x = mod(lam * lam - P.x - Q.x, p);
  return { x, y: mod(lam * (P.x - x) - P.y, p) };
}

/** Scalar multiplication (double-and-add). */
export function ecMul(P: ECPoint, k: bigint, a: bigint, p: bigint): ECPoint {
  let R: ECPoint = null;
  let B = P;
  let n = k;
  while (n > 0n) {
    if (n & 1n) R = ecAdd(R, B, a, p);
    B = ecAdd(B, B, a, p);
    n >>= 1n;
  }
  return R;
}

export function ecOnCurve(P: ECAffine, a: bigint, b: bigint, p: bigint): boolean {
  return mod(P.y * P.y, p) === mod(P.x * P.x * P.x + a * P.x + b, p);
}

/** Upper bound for local enumeration (O(p log p) via Legendre symbols). */
export const EC_ENUM_P_LIMIT = 100_000;

/** Full group order by enumerating quadratic residues. Toy curves only. */
export function ecCurveOrder(a: bigint, b: bigint, p: bigint): bigint {
  if (p < 5n) throw new Error('Field prime p must be >= 5');
  if (p > BigInt(EC_ENUM_P_LIMIT)) {
    throw new Error(`p too large for local enumeration (limit ${EC_ENUM_P_LIMIT}); use SageCell`);
  }
  let n = 1n; // point at infinity
  const half = (p - 1n) / 2n;
  for (let x = 0n; x < p; x++) {
    const f = mod(x * x * x + a * x + b, p);
    if (f === 0n) {
      n += 1n;
    } else if (modPow(f, half, p) === 1n) {
      n += 2n;
    }
  }
  return n;
}

/** Baby-step giant-step for d with d·G = Q in a subgroup of known `order`. */
export function ecBsgs(G: ECAffine, Q: ECPoint, order: bigint, a: bigint, p: bigint): bigint | null {
  const m = 1n << BigInt(Math.ceil(Number(order.toString(2).length) / 2));
  const baby = new Map<string, bigint>();
  let cur: ECPoint = null;
  for (let j = 0n; j < m; j++) {
    if (cur !== null) {
      const key = `${cur.x},${cur.y}`;
      if (!baby.has(key)) baby.set(key, j);
    } else if (!baby.has('O')) {
      baby.set('O', j);
    }
    cur = ecAdd(cur, G, a, p);
  }
  const mG = ecMul(G, m, a, p);
  const step = ecNeg(mG, p);
  let gamma: ECPoint = Q;
  for (let i = 0n; i < m; i++) {
    const key = gamma === null ? 'O' : `${gamma.x},${gamma.y}`;
    const j = baby.get(key);
    if (j !== undefined) {
      const d = (i * m + j) % order;
      const check = ecMul(G, d, a, p);
      const want = Q === null ? 'O' : `${Q.x},${Q.y}`;
      const got = check === null ? 'O' : `${check.x},${check.y}`;
      if (got === want) return d;
    }
    gamma = ecAdd(gamma, step, a, p);
  }
  return null;
}

export interface ECSubgroupLog {
  prime: bigint;
  exp: number;
  mod: bigint;
  log: bigint;
}

/**
 * EC Pohlig-Hellman: DLP per prime-power subgroup + CRT, mirroring the DH
 * small-subgroup structure (BSGS per factor, `crtRSA` combine, verify).
 * `order` must be the exact order of G; Q must lie in <G>.
 */
export function ecPohligHellman(
  G: ECAffine,
  Q: ECPoint,
  order: bigint,
  a: bigint,
  p: bigint,
): { d: bigint; order: bigint; subgroups: ECSubgroupLog[] } {
  if (order < 2n) throw new Error('Group order must be >= 2');
  if (ecMul(Q, order, a, p) !== null) throw new Error('Q is not in the subgroup generated by G');
  const fac = factorPowers(order, 100_000);
  const remainders: bigint[] = [];
  const moduli: bigint[] = [];
  const subgroups: ECSubgroupLog[] = [];
  for (const { prime, exp } of fac) {
    const q = prime ** BigInt(exp);
    const Gi = ecMul(G, order / q, a, p);
    const Qi = ecMul(Q, order / q, a, p);
    if (Gi === null) continue; // G has no component here; contributes nothing
    const log = Qi === null ? 0n : ecBsgs(Gi, Qi, q, a, p);
    if (log === null) throw new Error(`BSGS failed in subgroup of order ${q}`);
    remainders.push(log);
    moduli.push(q);
    subgroups.push({ prime, exp, mod: q, log });
  }
  if (remainders.length === 0) throw new Error('No subgroup components found');
  const d = crtRSA(remainders, moduli);
  if (d === null) throw new Error('CRT reconstruction failed');
  return { d, order, subgroups };
}

/* ───────── X25519 constants + twist membership ───────── */

export const X25519_P = 2n ** 255n - 19n;
export const X25519_A = 486662n;
/** Prime subgroup order L: #E(F_p) = 8·L. */
export const X25519_L = 2n ** 252n + 27742317777372353535851937790883648493n;

/**
 * Known X25519 low-order peer keys (little-endian hex, rejected by noble):
 * all-zero (u=0, the order-2 point (0,0)) and u=1 (order-4 point).
 */
export const X25519_LOW_ORDER_PEERS = [
  '00'.repeat(32),
  '01' + '00'.repeat(31),
];

/**
 * Legendre symbol of f(u) = u³ + Au² + u mod p:
 * 1n = on the curve, -1n = on the quadratic twist, 0n = zero/root.
 */
export function x25519Legendre(u: bigint): bigint {
  const uu = mod(u, X25519_P);
  const f = mod(uu * uu * uu + X25519_A * uu * uu + uu, X25519_P);
  if (f === 0n) return 0n;
  return modPow(f, (X25519_P - 1n) / 2n, X25519_P) === 1n ? 1n : -1n;
}
