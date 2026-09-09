import { ecb } from '@noble/ciphers/aes.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/ciphers/utils.js';

/* ─── AES-128 S-box and round constants ─── */

const SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
] as const;

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36] as const;

const sw = (w: number): number =>
  (SBOX[(w >> 24) & 0xff] << 24) |
  (SBOX[(w >> 16) & 0xff] << 16) |
  (SBOX[(w >> 8) & 0xff] << 8) |
  SBOX[w & 0xff];

const rw = (w: number): number => (w << 8) | (w >>> 24);

/* ─── Input encoding helpers ─── */

/** Decode input text/hex/base64 into raw bytes. */
export function decodeInput(text: string, encoding: string): Uint8Array {
  const cleaned = encoding === 'text' ? text : text.replace(/\s/g, '');
  if (encoding === 'hex') return hexToBytes(cleaned);
  if (encoding === 'base64') {
    const b = atob(cleaned);
    const u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  return new TextEncoder().encode(text);
}

/** Decode hex, ignoring whitespace/newlines users paste from terminals. */
export function hex(s: string): Uint8Array {
  return hexToBytes(s.replace(/\s/g, ''));
}

/** XOR two byte arrays up to the length of the shorter one. */
export function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const len = Math.min(a.length, b.length);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = a[i] ^ b[i];
  return out;
}

/**
 * OFB-mode encryption using AES-ECB as the underlying block function.
 * The 16-byte IV is repeatedly encrypted; the keystream is XORed with plaintext.
 * Useful for modes not directly provided by @noble/ciphers.
 *
 * Construction follows NIST SP 800-38A Appendix F.4 (OFB-AES128):
 * O_1 = E(K, IV), O_j = E(K, O_{j-1}), C_j = P_j XOR O_j.
 */
export function ofbEncrypt(key: Uint8Array, iv: Uint8Array, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  let fb = new Uint8Array(iv);
  for (let i = 0; i < data.length; i += 16) {
    // Fresh ECB instance per block: noble v2 cipher objects are single-use.
    fb = ecb(key, { disablePadding: true }).encrypt(fb);
    for (let j = 0; j < 16 && i + j < data.length; j++) {
      out[i + j] = data[i + j] ^ fb[j];
    }
  }
  return out;
}

/* ─── AES key schedule (for the key-schedule-inversion attack) ─── */

/**
 * Expand a 16/24/32-byte AES key into the full key schedule as an array of
 * 32-bit words. Supports AES-128 (10 rounds), AES-192 (12 rounds), AES-256 (14 rounds).
 */
export function expandKey(key: Uint8Array): number[] {
  const nk = key.length / 4;
  const nb = 4;
  const nr = nk + 6;
  const w: number[] = [];
  for (let i = 0; i < nk; i++) {
    w.push(
      ((key[4 * i] << 24) |
        (key[4 * i + 1] << 16) |
        (key[4 * i + 2] << 8) |
        key[4 * i + 3]) >>> 0,
    );
  }
  for (let i = nk; i < nb * (nr + 1); i++) {
    let t = w[i - 1];
    if (i % nk === 0) t = sw(rw(t)) ^ (RCON[Math.floor(i / nk) - 1] << 24);
    else if (nk > 6 && i % nk === 4) t = sw(t);
    w.push((w[i - nk] ^ t) >>> 0);
  }
  return w;
}

/* ─── Keystream / nonce-reuse helpers (CTR, GCM, CFB, OFB) ─── */

/**
 * Recover the keystream from a known plaintext/ciphertext pair: KS = PT XOR CT.
 * Operates on the shorter input — partial known plaintext still yields a
 * usable keystream prefix for decrypting the same-offset bytes of CT2.
 */
export function recoverKeystream(knownPt: Uint8Array, ct: Uint8Array): Uint8Array {
  return xorBytes(knownPt, ct);
}

/**
 * Invert the AES-128 key schedule: last round key (16 bytes) → master key.
 * Per round i = 10..1, with round words n0..n3: p3 = n3^n2, p2 = n2^n1,
 * p1 = n1^n0, then p0 = n0 ^ SubWord(RotWord(p3)) ^ RCon[i].
 * AES-192/256 need different inverses (rotated SubWord positions), so they
 * are gated with an explicit error instead of a wrong answer.
 */
export function invertKeySchedule(lastRoundKey: Uint8Array): Uint8Array {
  if (lastRoundKey.length !== 16) {
    throw new Error(
      `invertKeySchedule supports AES-128 only: need a 16-byte last round key, got ${lastRoundKey.length} bytes. ` +
        'AES-192/256 use different inverse schedules (SubWord applies at other word positions).',
    );
  }
  const wordAt = (b: Uint8Array, i: number): number =>
    ((b[4 * i] << 24) | (b[4 * i + 1] << 16) | (b[4 * i + 2] << 8) | b[4 * i + 3]) >>> 0;
  let n = [wordAt(lastRoundKey, 0), wordAt(lastRoundKey, 1), wordAt(lastRoundKey, 2), wordAt(lastRoundKey, 3)];
  for (let i = 10; i >= 1; i--) {
    const p3 = (n[3] ^ n[2]) >>> 0;
    const p2 = (n[2] ^ n[1]) >>> 0;
    const p1 = (n[1] ^ n[0]) >>> 0;
    const p0 = (n[0] ^ sw(rw(p3)) ^ (RCON[i - 1] << 24)) >>> 0;
    n = [p0, p1, p2, p3];
  }
  const master = new Uint8Array(16);
  for (let j = 0; j < 4; j++) {
    master[4 * j] = (n[j] >>> 24) & 0xff;
    master[4 * j + 1] = (n[j] >>> 16) & 0xff;
    master[4 * j + 2] = (n[j] >>> 8) & 0xff;
    master[4 * j + 3] = n[j] & 0xff;
  }
  return master;
}

/* ─── Crib dragging (no-known-plaintext nonce-reuse analysis) ─── */

/** Heuristic English-likeness score: spaces and lowercase win, control bytes lose hard. */
export function scoreEnglish(data: Uint8Array): number {
  let score = 0;
  for (const b of data) {
    if (b === 32) score += 4;
    else if (b >= 97 && b <= 122) score += 3;
    else if (b >= 65 && b <= 90) score += 2;
    else if (b >= 48 && b <= 57) score += 1;
    else if (b === 46 || b === 44 || b === 39 || b === 33 || b === 63) score += 1;
    else if (b === 10 || b === 13 || b === 9) score += 1;
    else if (b < 32 || b > 126) score -= 8;
    else score -= 1;
  }
  return score;
}

export interface CribHit {
  offset: number;
  crib: string;
  preview: string;
  score: number;
}

/** Common fragments worth dragging through a PT1-XOR-PT2 stream. */
export const DEFAULT_CRIBS = [
  ' the ',
  ' and ',
  'he ',
  'ing ',
  'ion ',
  'tions ',
  '0000',
  'password',
  'admin',
  'cookie',
  'session',
] as const;

/**
 * Slide each crib over ptXor (= PT1 XOR PT2 from two same-keystream ciphertexts).
 * At each offset the crib is treated as a guess for PT1, so the implied PT2
 * fragment (ptXor[offset..] XOR crib) is scored for English. Hits come back
 * best-first; a correct guess exposes readable text in `preview`.
 */
export function cribDrag(ptXor: Uint8Array, cribs: readonly string[] | string[], top = 10): CribHit[] {
  const hits: CribHit[] = [];
  const dec = new TextDecoder('utf-8', { fatal: false });
  for (const crib of cribs) {
    const cb = new TextEncoder().encode(crib);
    if (!cb.length || cb.length > ptXor.length) continue;
    for (let off = 0; off + cb.length <= ptXor.length; off++) {
      const cand = new Uint8Array(cb.length);
      for (let i = 0; i < cb.length; i++) cand[i] = ptXor[off + i] ^ cb[i];
      hits.push({ offset: off, crib, preview: dec.decode(cand), score: scoreEnglish(cand) });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, Math.max(1, top));
}

/* ─── ECB block helpers ─── */

/** Reassemble 16-byte blocks of `ct` in `order` (repeats allowed for forgeries). */
export function reorderBlocks(ct: Uint8Array, order: number[]): Uint8Array {
  if (ct.length % 16 !== 0 || !ct.length) throw new Error('ciphertext must be a non-empty multiple of 16 bytes');
  const n = ct.length / 16;
  for (const i of order) {
    if (!Number.isInteger(i) || i < 0 || i >= n) throw new Error(`block index ${i} out of range (0..${n - 1})`);
  }
  const out = new Uint8Array(order.length * 16);
  order.forEach((blk, k) => out.set(ct.subarray(blk * 16, blk * 16 + 16), k * 16));
  return out;
}

/** Parse "2,1,0,3" into indices, validating each against the block count. */
export function parseBlockOrder(text: string, blockCount: number): number[] {
  const parts = text.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  if (!parts.length) throw new Error('block order is empty — enter comma-separated indices, e.g. "2,1,0,3"');
  const order = parts.map((p) => {
    const v = Number(p);
    if (!Number.isInteger(v)) throw new Error(`invalid block index "${p}" — use comma-separated integers`);
    if (v < 0 || v >= blockCount) throw new Error(`block index ${v} out of range (0..${blockCount - 1})`);
    return v;
  });
  return order;
}

/* ─── GF(2^128) + GHASH (GCM nonce-reuse forgery) ─── */

/** GCM field multiply (NIST SP 800-38D §6.3): big-endian bits, R = 0xe1 || 0^120. */
export function gfMul(x: Uint8Array, y: Uint8Array): Uint8Array {
  const z = new Uint8Array(16);
  const v = new Uint8Array(x);
  for (let i = 0; i < 16; i++) {
    for (let b = 7; b >= 0; b--) {
      if ((y[i] >> b) & 1) for (let k = 0; k < 16; k++) z[k] ^= v[k];
      const lsb = v[15] & 1;
      for (let k = 15; k > 0; k--) v[k] = (v[k] >>> 1) | ((v[k - 1] & 1) << 7);
      v[0] >>>= 1;
      if (lsb) v[0] ^= 0xe1;
    }
  }
  return z;
}

/** Multiplicative identity of the GCM field: bit 0 set (MSB-first layout). */
const GF_ONE: Uint8Array = (() => {
  const o = new Uint8Array(16);
  o[0] = 0x80;
  return o;
})();

function gfPow(a: Uint8Array, e: bigint): Uint8Array {
  let result: Uint8Array = new Uint8Array(GF_ONE);
  let base: Uint8Array = new Uint8Array(a);
  let exp = e;
  while (exp > 0n) {
    if (exp & 1n) result = gfMul(result, base);
    base = gfMul(base, base);
    exp >>= 1n;
  }
  return result;
}

/** Square root in characteristic 2: sqrt(a) = a^(2^127). */
export function gfSqrt(a: Uint8Array): Uint8Array {
  return gfPow(a, 1n << 127n);
}

/** GHASH(H, AAD, CT) per NIST SP 800-38D §6.4, including the length block. */
export function ghash(h: Uint8Array, aad: Uint8Array, ct: Uint8Array): Uint8Array {
  const padded = (d: Uint8Array): Uint8Array => {
    const out = new Uint8Array(Math.ceil(d.length / 16) * 16);
    out.set(d);
    return out;
  };
  const a = padded(aad);
  const c = padded(ct);
  const lenBlock = new Uint8Array(16);
  const view = new DataView(lenBlock.buffer);
  view.setBigUint64(0, BigInt(aad.length) * 8n);
  view.setBigUint64(8, BigInt(ct.length) * 8n);
  const full = new Uint8Array(a.length + c.length + 16);
  full.set(a, 0);
  full.set(c, a.length);
  full.set(lenBlock, a.length + c.length);
  let x: Uint8Array = new Uint8Array(16);
  for (let i = 0; i < full.length; i += 16) {
    const blk = new Uint8Array(16);
    for (let k = 0; k < 16; k++) blk[k] = x[k] ^ full[i + k];
    x = gfMul(blk, h);
  }
  return x;
}

/** Field inverse: a^(2^128 − 2). Throws on the zero block (no inverse exists). */
export function gfInv(a: Uint8Array): Uint8Array {
  if (a.length !== 16 || a.every((b) => b === 0)) throw new Error('gfInv: zero block has no inverse');
  return gfPow(a, (1n << 128n) - 2n);
}

/**
 * Recover the GHASH key H from two single-block ciphertexts encrypted under
 * the same (key, nonce). With identical AAD the GHASH difference collapses to
 * ΔT = ΔC · H², so H = sqrt(ΔT / ΔC). Multi-block pairs leave an unsolved
 * high-degree equation — callers must say so instead of forging.
 */
export function recoverGcmHSingleBlock(c1: Uint8Array, t1: Uint8Array, c2: Uint8Array, t2: Uint8Array): Uint8Array {
  for (const [name, b] of [['CT1', c1], ['CT2', c2], ['TAG1', t1], ['TAG2', t2]] as const) {
    if (b.length !== 16) throw new Error(`${name} must be exactly one 16-byte block for H recovery (got ${b.length} bytes)`);
  }
  const dC = xorBytes(c1, c2);
  if (dC.every((b) => b === 0)) throw new Error('CT1 and CT2 are identical — their difference carries no H information');
  const dT = xorBytes(t1, t2);
  // ΔC is non-zero so its inverse exists.
  return gfSqrt(gfMul(dT, gfInv(dC)));
}

/** Forge a GCM tag once H and E_K(J0) are known: T = E(J0) XOR GHASH(H, AAD, CT). */
export function forgeGcmTag(h: Uint8Array, eJ0: Uint8Array, aad: Uint8Array, ct: Uint8Array): Uint8Array {
  if (eJ0.length !== 16) throw new Error(`E(J0) must be 16 bytes (got ${eJ0.length})`);
  return xorBytes(eJ0, ghash(h, aad, ct));
}

/* ─── Offline oracle simulators (no live endpoint needed) ─── */

export interface OracleResult {
  recovered?: Uint8Array;
  plaintext?: Uint8Array;
  queries: number;
  trace: string[];
}

/**
 * Offline ECB byte-at-a-time demo: the oracle appends `secret` to attacker
 * input and encrypts with AES-ECB under a fresh random key. Recovers the
 * secret byte-by-byte (~256 guesses per byte), returning the query count and
 * a per-byte walkthrough. Mirrors the live-oracle template in the docs.
 */
export function ecbByteAtATimeRecover(
  secret: Uint8Array,
  opts?: { key?: Uint8Array; blockSize?: number },
): { recovered: Uint8Array; queries: number; trace: string[] } {
  const bs = opts?.blockSize ?? 16;
  const key = opts?.key ?? randomBytes(16);
  let queries = 0;
  const oracle = (prefix: Uint8Array): Uint8Array => {
    queries++;
    const full = new Uint8Array(prefix.length + secret.length);
    full.set(prefix, 0);
    full.set(secret, prefix.length);
    return ecb(key).encrypt(full);
  };
  const recovered = new Uint8Array(secret.length);
  const trace: string[] = [];
  for (let i = 0; i < secret.length; i++) {
    const padLen = bs - 1 - (i % bs);
    const prefix = new Uint8Array(padLen).fill(65); // 'A'
    const blockStart = Math.floor(i / bs) * bs;
    const target = oracle(prefix).subarray(blockStart, blockStart + bs);
    let found = -1;
    let tries = 0;
    // Prefix the whole recovered prefix: the guess lands at blockStart + bs − 1
    // and we compare that same block of the probe output.
    for (let g = 0; g < 256; g++) {
      tries++;
      const probe = new Uint8Array(padLen + i + 1);
      probe.fill(65, 0, padLen);
      probe.set(recovered.subarray(0, i), padLen);
      probe[padLen + i] = g;
      const got = oracle(probe).subarray(blockStart, blockStart + bs);
      let match = true;
      for (let k = 0; k < bs; k++) {
        if (got[k] !== target[k]) {
          match = false;
          break;
        }
      }
      if (match) {
        found = g;
        break;
      }
    }
    if (found < 0) throw new Error(`byte ${i}: no guess matched — oracle diverged from ECB(prefix || secret)`);
    recovered[i] = found;
    trace.push(`byte ${i}: 0x${found.toString(16).padStart(2, '0')} ('${found >= 32 && found < 127 ? String.fromCharCode(found) : '?'}') after ${tries} queries`);
  }
  return { recovered, queries, trace };
}

/**
 * Offline CBC padding-oracle decryptor. `oracle(iv, ct)` answers only whether
 * the decrypted plaintext ends in valid PKCS#7 padding; each byte costs ~256
 * requests and only the (IV, target-block) pair is ever mutated, so earlier
 * plaintext never shifts under the attack.
 */
export function paddingOracleDecrypt(
  iv: Uint8Array,
  ct: Uint8Array,
  oracle: (iv: Uint8Array, ct: Uint8Array) => boolean,
): { plaintext: Uint8Array; queries: number; trace: string[] } {
  if (iv.length !== 16) throw new Error(`IV must be 16 bytes (got ${iv.length})`);
  if (ct.length % 16 !== 0 || !ct.length) throw new Error('ciphertext must be a non-empty multiple of 16 bytes');
  const n = ct.length / 16;
  const blocks: Uint8Array[] = [iv];
  for (let i = 0; i < n; i++) blocks.push(ct.subarray(i * 16, i * 16 + 16));
  const pt = new Uint8Array(ct.length);
  let queries = 0;
  const trace: string[] = [];
  const ask = (ivQ: Uint8Array, ctQ: Uint8Array): boolean => {
    queries++;
    return oracle(ivQ, ctQ);
  };
  for (let blk = n; blk >= 1; blk--) {
    const prev = blocks[blk - 1];
    const curr = blocks[blk];
    const inter = new Uint8Array(16);
    for (let pad = 1; pad <= 16; pad++) {
      const idx = 16 - pad;
      let found = -1;
      for (let g = 0; g < 256; g++) {
        const probe = new Uint8Array(prev);
        for (let j = 15; j > idx; j--) probe[j] = inter[j] ^ pad;
        probe[idx] = g;
        // Break an accidental originally-valid padding so pad=1 can't false-positive.
        if (pad === 1) probe[14] ^= 0x01;
        if (ask(probe, curr)) {
          // A 02-02 ending (via the flipped byte) can mimic a 01: confirm pad=1
          // hits under a second flip, which only a true 01 survives.
          if (pad === 1) {
            const confirm = new Uint8Array(probe);
            confirm[14] ^= 0x03; // different flip: true 01 stays valid, 02-02 dies
            if (!ask(confirm, curr)) continue;
          }
          found = g;
          break;
        }
      }
      if (found < 0) throw new Error(`block ${blk}, pad byte ${pad}: oracle never said valid — is it a real padding oracle?`);
      inter[idx] = found ^ pad;
      pt[(blk - 1) * 16 + idx] = inter[idx] ^ prev[idx];
    }
    trace.push(`block ${blk}: ${bytesToHex(pt.subarray((blk - 1) * 16, blk * 16))} (${queries} queries so far)`);
  }
  // The attack recovers raw CBC output — strip the PKCS#7 padding it ends with.
  const padLen = pt[pt.length - 1];
  if (padLen < 1 || padLen > 16) throw new Error('recovered plaintext ends in invalid PKCS#7 padding');
  for (let k = 1; k <= padLen; k++) {
    if (pt[pt.length - k] !== padLen) throw new Error('recovered plaintext ends in invalid PKCS#7 padding');
  }
  return { plaintext: pt.subarray(0, pt.length - padLen), queries, trace };
}

/** Format the key schedule as `Round N: <hex>` lines for display. */
export function fmtRounds(w: number[], nr: number): string[] {
  const rks: string[] = [];
  for (let r = 0; r <= nr; r++) {
    const bytes = new Uint8Array(16);
    for (let j = 0; j < 4; j++) {
      const v = w[r * 4 + j];
      bytes[4 * j] = (v >> 24) & 0xff;
      bytes[4 * j + 1] = (v >> 16) & 0xff;
      bytes[4 * j + 2] = (v >> 8) & 0xff;
      bytes[4 * j + 3] = v & 0xff;
    }
    rks.push(`Round ${r}: ${bytesToHex(bytes)}`);
  }
  return rks;
}
