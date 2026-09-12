import { useCallback, useState } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import {
  hex,
  xorBytes,
  recoverKeystream,
  invertKeySchedule,
  expandKey,
  fmtRounds,
  cribDrag,
  DEFAULT_CRIBS,
  reorderBlocks,
  parseBlockOrder,
  recoverGcmHSingleBlock,
  forgeGcmTag,
  ghash,
  ecbByteAtATimeRecover,
  paddingOracleDecrypt,
} from '../../utils/aesCrypto';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { AttackExplanationPanel } from './AttackExplanationPanel';
import { SharedAttackPanel, type SharedAttackField } from '../attacks/SharedAttackPanel';
import { ResultBox } from './_shared/ResultBox';
import { AES_ATTACKS, AES_ATTACK_EXPLANATIONS } from '../../data/attackExplanations/aes';
import { bytesToHex } from '@noble/ciphers/utils.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { ctr, ecb, cbc, gcm } from '@noble/ciphers/aes.js';

function decodeText(b: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(b);
  } catch {
    return '(non-UTF8 bytes)';
  }
}

/* ─── Phase-0 mock: sample generator for the shared-panel CTR demo ─── */

function generateCtrNonceDemo(): Record<string, string> {
  const key = randomBytes(16);
  const nonce = randomBytes(16);
  const pt1 = new TextEncoder().encode('the quick brown fox jumps over the lazy dog');
  const pt2 = new TextEncoder().encode('pack my box with five dozen liquor jugs!');
  const ct1 = ctr(key, nonce).encrypt(pt1);
  const ct2 = ctr(key, nonce).encrypt(pt2);
  return { ct1: bytesToHex(ct1), ct2: bytesToHex(ct2), knownPt: bytesToHex(pt1) };
}

/* ─── Per-attack sample generators (one-liners for the shared panel) ─── */

function generateCbcBitflipDemo(): Record<string, string> {
  const key = randomBytes(16);
  const iv = randomBytes(16);
  const p0 = new TextEncoder().encode('0123456789abcdef');
  const p1 = new TextEncoder().encode('AAAAAAAAAAAAAAAA');
  const ct = cbc(key, iv).encrypt(new Uint8Array([...p0, ...p1]));
  return {
    ct1: bytesToHex(ct),
    ivHex: bytesToHex(iv),
    blockIdx: '1',
    currentPtHex: bytesToHex(p1),
    targetText: 'admin=true!!!!!!',
  };
}

function generateEcbDetectDemo(): Record<string, string> {
  const key = randomBytes(16);
  const dup = ecb(key).encrypt(new TextEncoder().encode('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'));
  const noc = ctr(randomBytes(16), randomBytes(16)).encrypt(
    new TextEncoder().encode('BBBBBBBBBBBBBBBBCCCCCCCCCCCCCCCC'),
  );
  return { cts: `${bytesToHex(dup)}\n${bytesToHex(noc)}` };
}

function generateEcbCutpasteDemo(): Record<string, string> {
  const key = randomBytes(16);
  const cookie = new TextEncoder().encode(
    'user=guest......role=user........id=000001........pad=xxxxxxxxxxxx',
  );
  return { ct1: bytesToHex(ecb(key).encrypt(cookie)), blockOrder: '' };
}

function generateEcbByteDemo(): Record<string, string> {
  return { ecbSecret: `flag{demo_${bytesToHex(randomBytes(4))}}` };
}

function generateCbcPaddingDemo(): Record<string, string> {
  return { cbcPaddingPt: 'hello padding!!' };
}

function generateGcmNonceDemo(): Record<string, string> {
  const key = randomBytes(16);
  const nonce = randomBytes(12);
  const pt1 = new TextEncoder().encode('GCM-message-one!');
  const pt2 = new TextEncoder().encode('GCM-message-two?');
  const o1 = gcm(key, nonce).encrypt(pt1);
  const o2 = gcm(key, nonce).encrypt(pt2);
  return {
    gcmCt1: bytesToHex(o1.subarray(0, o1.length - 16)),
    gcmPt1: bytesToHex(pt1),
    gcmCt2: bytesToHex(o2.subarray(0, o2.length - 16)),
    gcmTag1: bytesToHex(o1.subarray(o1.length - 16)),
    gcmTag2: bytesToHex(o2.subarray(o2.length - 16)),
    gcmAad: '',
    gcmForgeCt: '',
  };
}

function generateKeyScheduleDemo(): Record<string, string> {
  const w = expandKey(randomBytes(16));
  const last = new Uint8Array(16);
  for (let j = 0; j < 4; j++) {
    const v = w[40 + j];
    last[4 * j] = (v >>> 24) & 0xff;
    last[4 * j + 1] = (v >>> 16) & 0xff;
    last[4 * j + 2] = (v >>> 8) & 0xff;
    last[4 * j + 3] = v & 0xff;
  }
  return { scheduleKey: bytesToHex(last) };
}

function generateCbcIvDemo(): Record<string, string> {
  const key = randomBytes(16);
  const iv = randomBytes(16);
  const p1 = new TextEncoder().encode('shared-first-blk');
  const enc = (tail: string): string =>
    bytesToHex(cbc(key, iv).encrypt(new Uint8Array([...p1, ...new TextEncoder().encode(tail)])));
  return {
    ivHex: bytesToHex(iv),
    cts: `${enc('message-one-0001')}\n${enc('message-two-0002')}\n${enc('other-first-block')}`,
  };
}

function generateStreamBitflipDemo(): Record<string, string> {
  const key = randomBytes(16);
  const nonce = new Uint8Array(16);
  const cookie = new TextEncoder().encode('user=guest;role=user');
  return {
    ct1: bytesToHex(ctr(key, nonce).encrypt(cookie)),
    blockIdx: '5',
    currentPtHex: bytesToHex(new TextEncoder().encode('guest')),
    targetText: 'admin',
  };
}

function generateCbcKeyIvDemo(): Record<string, string> {
  return { currentPtHex: bytesToHex(new TextEncoder().encode('known-plaintext!')) };
}

/* ─── Shared-panel definitions: fields + generate + run-in-place + TS source ─── */

interface AESAttackDef {
  fields: SharedAttackField[];
  generate: () => Record<string, string>;
  run: (vals: Record<string, string>) => string;
  source: string;
}

const AES_DEFS: Record<string, AESAttackDef> = {
  'ctr-nonce': {
    fields: [
      { name: 'ct1', label: 'Ciphertext 1 (hex)', placeholder: 'Hex CT1' },
      { name: 'ct2', label: 'Ciphertext 2 (hex)', placeholder: 'Hex CT2' },
      { name: 'knownPt', label: 'Known PT for CT1 (hex, optional — leave empty for crib-dragging)', placeholder: 'Known plaintext window, ≥1 byte' },
      { name: 'cribInput', label: 'Cribs, comma-separated (optional)', placeholder: 'the , and , password (defaults built in)' },
    ],
    generate: generateCtrNonceDemo,
    run: v => runCtrNonce(v.ct1 ?? '', v.ct2 ?? '', v.knownPt ?? '', v.cribInput ?? ''),
    source: runCtrNonce.toString(),
  },
  'cbc-bitflip': {
    fields: [
      { name: 'ct1', label: 'Ciphertext (hex)', placeholder: 'Hex CT' },
      { name: 'ivHex', label: 'IV (hex)', placeholder: 'Hex IV' },
      { name: 'blockIdx', label: 'Block index', placeholder: '0' },
      { name: 'currentPtHex', label: 'Current plaintext block (hex)', placeholder: 'Current plaintext block in hex' },
      { name: 'targetText', label: 'Target text (≤16 bytes)', placeholder: 'Desired plaintext (≤16 bytes)' },
    ],
    generate: generateCbcBitflipDemo,
    run: v => runCbcBitflip(v.ct1 ?? '', v.ivHex ?? '', v.blockIdx ?? '0', v.targetText ?? '', v.currentPtHex ?? ''),
    source: runCbcBitflip.toString(),
  },
  'ecb-detect': {
    fields: [
      { name: 'cts', label: 'Ciphertexts (one hex per line)', placeholder: 'Hex CT per line', kind: 'textarea' },
    ],
    generate: generateEcbDetectDemo,
    run: v => runEcbDetect(v.cts ?? ''),
    source: runEcbDetect.toString(),
  },
  'ecb-cutpaste': {
    fields: [
      { name: 'ct1', label: 'Ciphertext (hex)', placeholder: 'Multiples of 16 bytes' },
      { name: 'blockOrder', label: 'Block order (optional)', placeholder: 'e.g. 2,1,0,3' },
    ],
    generate: generateEcbCutpasteDemo,
    run: v => runEcbCutpaste(v.ct1 ?? '', v.blockOrder ?? ''),
    source: runEcbCutpaste.toString(),
  },
  'ecb-byte': {
    fields: [
      { name: 'ecbSecret', label: 'Secret (optional — blank runs the embedded demo secret)', placeholder: 'Custom secret to recover' },
    ],
    generate: generateEcbByteDemo,
    run: v => runEcbByteDemo(v.ecbSecret ?? ''),
    source: runEcbByteDemo.toString(),
  },
  'cbc-padding': {
    fields: [
      { name: 'cbcPaddingPt', label: 'Plaintext to encrypt-then-break (optional)', placeholder: 'Defaults to demo message' },
    ],
    generate: generateCbcPaddingDemo,
    run: v => runCbcPaddingDemo(v.cbcPaddingPt ?? ''),
    source: runCbcPaddingDemo.toString(),
  },
  'gcm-nonce': {
    fields: [
      { name: 'gcmCt1', label: 'CT1 (raw hex — split the 16-byte tag off)', placeholder: 'CT1 hex' },
      { name: 'gcmPt1', label: 'PT1 (hex)', placeholder: 'PT1 hex' },
      { name: 'gcmCt2', label: 'CT2 (hex)', placeholder: 'CT2 hex' },
      { name: 'gcmTag1', label: 'TAG1 (hex, optional — enables H recovery)', placeholder: '16-byte tag hex' },
      { name: 'gcmTag2', label: 'TAG2 (hex, optional)', placeholder: '16-byte tag hex' },
      { name: 'gcmAad', label: 'AAD (hex, optional — must be shared)', placeholder: 'Shared additional data' },
      { name: 'gcmForgeCt', label: 'Target CT to forge a tag for (hex, optional)', placeholder: 'Same nonce + AAD' },
    ],
    generate: generateGcmNonceDemo,
    run: v => runGcmNonce(v.gcmCt1 ?? '', v.gcmPt1 ?? '', v.gcmCt2 ?? '', v.gcmTag1 ?? '', v.gcmTag2 ?? '', v.gcmAad ?? '', v.gcmForgeCt ?? ''),
    source: runGcmNonce.toString(),
  },
  'key-schedule': {
    fields: [
      { name: 'scheduleKey', label: 'Last round key (hex)', placeholder: '32 hex chars (AES-128)' },
    ],
    generate: generateKeyScheduleDemo,
    run: v => runKeySchedule(v.scheduleKey ?? ''),
    source: runKeySchedule.toString(),
  },
  'cbc-iv': {
    fields: [
      { name: 'ivHex', label: 'Shared IV (hex)', placeholder: '16-byte IV reused across messages' },
      { name: 'cts', label: 'Ciphertexts (one hex per line)', placeholder: 'Hex CT per line', kind: 'textarea' },
    ],
    generate: generateCbcIvDemo,
    run: v => runCbcIvDup(v.ivHex ?? '', v.cts ?? ''),
    source: runCbcIvDup.toString(),
  },
  'stream-bitflip': {
    fields: [
      { name: 'ct1', label: 'Ciphertext (hex)', placeholder: 'CTR/CFB/OFB ciphertext' },
      { name: 'blockIdx', label: 'Byte offset', placeholder: '0' },
      { name: 'currentPtHex', label: 'Current plaintext window (hex)', placeholder: 'Known bytes at offset' },
      { name: 'targetText', label: 'Target text (same length)', placeholder: 'Desired bytes (same length)' },
    ],
    generate: generateStreamBitflipDemo,
    run: v => runStreamBitflip(v.ct1 ?? '', v.blockIdx ?? '0', v.currentPtHex ?? '', v.targetText ?? ''),
    source: runStreamBitflip.toString(),
  },
  'cbc-keyiv': {
    fields: [
      { name: 'currentPtHex', label: 'Known P1 (hex, 16 bytes)', placeholder: 'Known first plaintext block' },
    ],
    generate: generateCbcKeyIvDemo,
    run: v => runCbcKeyIv(v.currentPtHex ?? ''),
    source: runCbcKeyIv.toString(),
  },
};

/* ─── Per-attack runners (pure: inputs in, result text out) ─── */

function runCtrNonce(ct1Hex: string, ct2Hex: string, knownPtHex: string, cribsHex: string): string {
  const c1 = hex(ct1Hex);
  const c2 = hex(ct2Hex);
  if (!c1.length || !c2.length) throw new Error('Both ciphertexts are required');
  const ml = Math.min(c1.length, c2.length);
  if (knownPtHex.trim()) {
    const kp = hex(knownPtHex);
    if (!kp.length) throw new Error('Known plaintext is empty');
    const n = Math.min(kp.length, ml);
    const ks = recoverKeystream(kp.subarray(0, n), c1.subarray(0, n));
    const pt2 = recoverKeystream(c2.subarray(0, n), ks);
    return `CTR keystream window: recovered ${n} of ${ml} overlapping bytes\nKeystream: ${bytesToHex(ks)}\n\nDecrypted CT2[${n}]: ${bytesToHex(pt2)}\n\nAs text: ${decodeText(pt2)}`;
  }
  // No known plaintext: CT1 XOR CT2 = PT1 XOR PT2 — drag cribs through it.
  const x = xorBytes(c1.subarray(0, ml), c2.subarray(0, ml));
  const cribs = cribsHex.trim()
    ? cribsHex.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [...DEFAULT_CRIBS];
  if (!cribs.length) throw new Error('Crib list is empty');
  const lines = cribDrag(x, cribs, 8).map(h => `+${h.offset} "${h.crib}" → "${h.preview}" (score ${h.score})`);
  return `No known plaintext: CT1 XOR CT2 = PT1 XOR PT2 (${ml} bytes)\n\nTop crib-drag hits (crib guessed as PT1, preview shows implied PT2):\n${lines.join('\n')}\n\nA correct guess exposes readable text — extend it and re-drag.`;
}

function runCbcBitflip(ctHex: string, ivHex: string, idxText: string, target: string, curHex: string): string {
  const ct = hex(ctHex);
  const iv = hex(ivHex);
  const idx = Number(idxText.trim());
  if (!Number.isInteger(idx) || idx < 0) throw new Error(`Block index must be a non-negative integer (got "${idxText}")`);
  if (ct.length < 16 || ct.length % 16 !== 0) throw new Error('Ciphertext must be a non-empty multiple of 16 bytes');
  const nBlocks = ct.length / 16;
  if (idx >= nBlocks) throw new Error(`Block index ${idx} out of range (0..${nBlocks - 1} for ${nBlocks} blocks)`);
  const tgt = new TextEncoder().encode(target);
  if (!tgt.length) throw new Error('Target text is empty');
  if (tgt.length > 16) throw new Error(`Target must fit one block (got ${tgt.length} bytes, max 16)`);
  const curPlain = hex(curHex);
  if (!curPlain.length) throw new Error('Current plaintext block (hex) is required');
  const isIV = idx === 0;
  if (isIV && iv.length !== 16) throw new Error(`Flipping block 0 rewrites the IV — IV must be exactly 16 bytes (got ${iv.length})`);
  const off = isIV ? 0 : (idx - 1) * 16;
  const mod = new Uint8Array(isIV ? iv : ct);
  const n = Math.min(tgt.length, curPlain.length);
  for (let j = 0; j < n; j++) {
    mod[off + j] ^= curPlain[j] ^ tgt[j];
  }
  return `Modified ${isIV ? 'IV' : `CT block ${idx - 1}`}:\n${bytesToHex(mod)}\n\nP[${idx}] becomes "${target}" (${n} bytes); P[${isIV ? 'IV' : idx - 1}] garbles unpredictably — the unavoidable cost of CBC bit-flipping.`;
}

function runEcbDetect(ctsText: string): string {
  return ctsText.trim().split('\n').filter(l => l.trim()).map(line => {
    const ct = hex(line);
    if (ct.length < 32) return `[SKIP] ${line.slice(0, 40)}...`;
    const seen = new Set<string>();
    for (let i = 0; i < ct.length; i += 16) {
      const h = bytesToHex(ct.subarray(i, i + 16));
      if (seen.has(h)) return `[ECB] ${line.slice(0, 40)}...`;
      seen.add(h);
    }
    return `[not ECB] ${line.slice(0, 40)}...`;
  }).join('\n');
}

function runEcbCutpaste(ctHex: string, orderText: string): string {
  const ct = hex(ctHex);
  if (ct.length < 32 || ct.length % 16) throw new Error('CT must be multiple of 16 bytes');
  const n = ct.length / 16;
  const blks: string[] = [];
  for (let i = 0; i < n; i++) blks.push(`[${i}] ${bytesToHex(ct.subarray(i * 16, i * 16 + 16))}`);
  if (!orderText.trim()) {
    return `Blocks:\n${blks.join('\n')}\n\nEnter a block order (e.g. "2,1,0,3") to forge a ciphertext, or reorder blocks to forge new plaintext under the same key.`;
  }
  const order = parseBlockOrder(orderText, n);
  const forged = reorderBlocks(ct, order);
  const mapping = order.map((b, k) => `forged block ${k} = original block ${b} → decrypts to original P[${b}]`);
  return `Blocks:\n${blks.join('\n')}\n\nForged ciphertext (${forged.length} bytes):\n${bytesToHex(forged)}\n\nPredicted plaintext mapping (block-aligned swaps decrypt cleanly):\n${mapping.join('\n')}`;
}

function runEcbByteDemo(secretText: string): string {
  const secret = new TextEncoder().encode(secretText.trim() || 'flag{ecb_oracle_demo_123}');
  const { recovered, queries, trace } = ecbByteAtATimeRecover(secret);
  const shown = trace.length > 6
    ? [...trace.slice(0, 4), `… (${trace.length - 6} bytes elided)`, ...trace.slice(-2)]
    : trace;
  return `Offline ECB byte-at-a-time demo — oracle appends a ${secret.length}-byte secret under a fresh random key.\n\nRecovered: ${decodeText(recovered)}\nOracle queries: ${queries} (~${(queries / secret.length).toFixed(0)} per byte; ~128 average, 256 worst case)\n\nWalkthrough:\n${shown.join('\n')}\n\nFor a live target, use the Python template in the Explanation tab (same loop, requests oracle).`;
}

function runCbcPaddingDemo(ptText: string): string {
  const pt = new TextEncoder().encode(ptText.trim() || 'padding oracle test message!!');
  const key = randomBytes(16);
  const iv = randomBytes(16);
  const ct = cbc(key, iv).encrypt(pt);
  const oracle = (ivQ: Uint8Array, ctQ: Uint8Array): boolean => {
    try {
      cbc(key, ivQ).decrypt(ctQ);
      return true;
    } catch {
      return false;
    }
  };
  const { plaintext, queries, trace } = paddingOracleDecrypt(iv, ct, oracle);
  return `Offline CBC padding-oracle demo — random key/IV, ${ct.length / 16}-block message. The attacker sees only valid/invalid answers (key never used).\n\nRecovered (${plaintext.length} bytes): ${decodeText(plaintext)}\nOracle queries: ${queries} (~${(queries / plaintext.length).toFixed(0)} per byte)\n\nWalkthrough:\n${trace.join('\n')}\n\nFor a live target, configure the Python template (status code + match string) in the Explanation tab.`;
}

function runGcmNonce(c1Hex: string, p1Hex: string, c2Hex: string, t1Hex: string, t2Hex: string, aadHex: string, forgeHex: string): string {
  const c1 = hex(c1Hex);
  const p1 = hex(p1Hex);
  const c2 = hex(c2Hex);
  if (!c1.length || !p1.length || !c2.length) throw new Error('CT1, PT1 and CT2 are required (paste raw CT — split the 16-byte tag off first)');
  const aad = aadHex.trim() ? hex(aadHex) : new Uint8Array(0);
  const ml = Math.min(c1.length, p1.length, c2.length);
  const ks = recoverKeystream(p1.subarray(0, ml), c1.subarray(0, ml));
  const pt2 = recoverKeystream(c2.subarray(0, ml), ks);
  let extra = '';
  if (t1Hex.trim() || t2Hex.trim()) {
    const t1 = hex(t1Hex);
    const t2 = hex(t2Hex);
    if (c1.length === 16 && c2.length === 16 && t1.length === 16 && t2.length === 16) {
      const H = recoverGcmHSingleBlock(c1, t1, c2, t2);
      const eJ0 = xorBytes(t1, ghash(H, aad, c1));
      const ok = bytesToHex(forgeGcmTag(H, eJ0, aad, c2)) === bytesToHex(t2);
      extra = `\n\nGHASH key H = AES_K(0): ${bytesToHex(H)}\nE(J0): ${bytesToHex(eJ0)}\nRecomputed TAG2 ${ok ? 'MATCHES — forgery path confirmed' : 'MISMATCH — inputs are not a same-nonce pair'}`;
      if (ok && forgeHex.trim()) {
        const fc = hex(forgeHex);
        extra += `\nForged tag for ${bytesToHex(fc)}: ${bytesToHex(forgeGcmTag(H, eJ0, aad, fc))} (same nonce + AAD)`;
      }
    } else {
      extra = '\n\nH recovery needs two distinct single-block (16-byte) CTs with 16-byte tags — showing CTR-part keystream recovery only (no forgery possible from these inputs).';
    }
  }
  return `Keystream window: recovered ${ml} of ${Math.min(c1.length, c2.length)} overlapping bytes\nKeystream: ${bytesToHex(ks)}\nPT2: ${bytesToHex(pt2)}\nText: ${decodeText(pt2)}${extra}\n\nGCM nonce reuse: same nonce → same CTR keystream and shared GHASH key H.`;
}

function runKeySchedule(lastRoundHex: string): string {
  const rk = hex(lastRoundHex);
  // AES-192/256 inputs are gated inside invertKeySchedule with an explicit message.
  const master = invertKeySchedule(rk);
  const w = expandKey(master);
  const last = new Uint8Array(16);
  for (let j = 0; j < 4; j++) {
    const v = w[40 + j];
    last[4 * j] = (v >>> 24) & 0xff;
    last[4 * j + 1] = (v >>> 16) & 0xff;
    last[4 * j + 2] = (v >>> 8) & 0xff;
    last[4 * j + 3] = v & 0xff;
  }
  const match = bytesToHex(last).toLowerCase() === bytesToHex(rk).toLowerCase();
  const rks = fmtRounds(w, 10);
  rks.push(`\nMaster key: ${bytesToHex(master)}`);
  rks.push(`Re-expansion check: last round ${bytesToHex(last)} ${match ? 'matches the input ✓' : 'MISMATCHES the input ✗'}`);
  rks.push('\nAES-128: last round key → invert key schedule → original key. Side-channel the last round to recover the key.');
  return rks.join('\n');
}

function runCbcIvDup(ivText: string, ctsText: string): string {
  const iv = hex(ivText);
  if (iv.length !== 16) throw new Error(`IV must be exactly 16 bytes (got ${iv.length}) — duplicate-IV analysis needs the shared IV`);
  const lines = ctsText.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) throw new Error('Paste at least two ciphertexts (one hex per line) sharing this IV');
  const firsts = new Map<string, number[]>();
  lines.forEach((line, i) => {
    const ct = hex(line);
    if (ct.length < 16 || ct.length % 16 !== 0) throw new Error(`Line ${i + 1}: ciphertext must be a multiple of 16 bytes`);
    const h = bytesToHex(ct.subarray(0, 16));
    const hit = firsts.get(h);
    if (hit) hit.push(i + 1);
    else firsts.set(h, [i + 1]);
  });
  const leaks = [...firsts.entries()].filter(([, v]) => v.length > 1);
  const leakLines = leaks.length
    ? leaks.map(([h, v]) => `C1 ${h.slice(0, 24)}… shared by lines ${v.join(', ')} → equal P1 (equality leak)`)
    : ['No shared first blocks — no equality leak in this sample.'];
  return `Duplicate-IV analysis (${lines.length} ciphertexts, shared IV ${bytesToHex(iv).slice(0, 24)}…):\n${leakLines.join('\n')}\n\nEqual C1 ⟺ equal P1 under one IV. Predictable IVs (chained/counter/timestamp) additionally enable BEAST-style chosen-plaintext byte recovery — see the Explanation tab.`;
}

function runStreamBitflip(ctHex: string, offText: string, curHex: string, target: string): string {
  const ct = hex(ctHex);
  if (!ct.length) throw new Error('Ciphertext (hex) is required');
  const off = Number(offText.trim());
  if (!Number.isInteger(off) || off < 0) throw new Error(`Byte offset must be a non-negative integer (got "${offText}")`);
  const cur = hex(curHex);
  if (!cur.length) throw new Error('Current plaintext window (hex) is required');
  const tgt = new TextEncoder().encode(target);
  if (!tgt.length) throw new Error('Target text is empty');
  if (cur.length !== tgt.length) throw new Error(`Window lengths must match (current ${cur.length}B vs target ${tgt.length}B)`);
  if (off + tgt.length > ct.length) throw new Error(`Window [${off}..${off + tgt.length}) exceeds ciphertext (${ct.length} bytes)`);
  const forged = new Uint8Array(ct);
  for (let j = 0; j < tgt.length; j++) forged[off + j] ^= cur[j] ^ tgt[j];
  return `Forged ciphertext:\n${bytesToHex(forged)}\n\nBytes [${off}..${off + tgt.length}) now decrypt to "${target}". CTR/CFB/OFB flip only the targeted window — neighbours are untouched (no error propagation, no padding involved).`;
}

function runCbcKeyIv(p1Hex: string): string {
  const p1 = hex(p1Hex);
  if (p1.length !== 16) throw new Error(`Known P1 must be exactly one 16-byte block (got ${p1.length} bytes)`);
  // Offline simulation: the "victim" holds a hidden random key as IV.
  const K = randomBytes(16);
  const victimC1 = cbc(K, K).encrypt(p1).subarray(0, 16);
  const dC1 = ecb(K, { disablePadding: true }).decrypt(victimC1); // zero-IV oracle query
  const kRec = recoverKeystream(p1, dC1);
  const check = bytesToHex(cbc(kRec, kRec).encrypt(p1).subarray(0, 16)) === bytesToHex(victimC1);
  return `Offline CBC key-as-IV simulation (hidden random key, known P1 = ${bytesToHex(p1)}):\nVictim C1 (IV = key): ${bytesToHex(victimC1)}\nZero-IV oracle answer D(C1): ${bytesToHex(dC1)}\nK = D(C1) XOR P1: ${bytesToHex(kRec)}\nRe-encryption check under IV = recovered key: ${check ? 'MATCHES ✓ — key recovered' : 'MISMATCH ✗'}\n\nReal attack: capture C1 + known P1, ask a decryption oracle once with IV = 0. Unknown bytes elsewhere? Drag cribs with the CTR scorer.`;
}

export function AESAttacksTab({ selectedAttack }: { selectedAttack?: string } = {}) {
  const [attack, setAttack] = useState(selectedAttack ?? 'ctr-nonce');
  const out = useCalculatorOutput({ category: 'calculator-aes' });
  const def = AES_DEFS[attack] ?? AES_DEFS['ctr-nonce'];
  const explanation = AES_ATTACK_EXPLANATIONS[attack] ?? AES_ATTACK_EXPLANATIONS['ctr-nonce'];

  const handleRun = useCallback((vals: Record<string, string>) => {
    out.clear();
    try {
      out.dispatch(def.run(vals), `AES Attack: ${attack}`);
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [out, def, attack]);

  return (
    <Stack direction="vertical" gap={2}>
      {!selectedAttack && (
        <Selector
          label="Attack"
          options={AES_ATTACKS.map(a => ({ value: a.value, label: a.label }))}
          value={attack}
          onChange={setAttack}
          width="100%"
        />
      )}
      <SharedAttackPanel
        key={attack}
        title={explanation.title}
        description={explanation.description}
        explanationNode={<AttackExplanationPanel data={explanation} />}
        fields={def.fields}
        generateLabel="Generate"
        onGenerate={def.generate}
        onRun={handleRun}
        sourceCode={def.source}
        sourceLanguage="typescript"
        resultNode={(
          <>
            {out.result && <ResultBox value={out.result} label="Result" variant="medium" />}
            {out.error && <Banner status="error" title={out.error} />}
          </>
        )}
      />
    </Stack>
  );
}
