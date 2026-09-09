import { useCallback, useMemo, useReducer, useRef } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
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
import { ResultBox } from './_shared/ResultBox';
import { AES_ATTACKS, AES_ATTACK_EXPLANATIONS } from '../../data/attackExplanations/aes';
import { bytesToHex } from '@noble/ciphers/utils.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { ecb, cbc } from '@noble/ciphers/aes.js';

function decodeText(b: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(b);
  } catch {
    return '(non-UTF8 bytes)';
  }
}

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

/** Every attack-form field in one object — 20+ useState calls tripped prefer-useReducer. */
interface AttackForm {
  attack: string;
  ct1: string;
  ct2: string;
  knownPt: string;
  cribInput: string;
  ivHex: string;
  blockIdx: string;
  blockOrder: string;
  targetText: string;
  currentPtHex: string;
  cts: string;
  gcmCt1: string;
  gcmPt1: string;
  gcmCt2: string;
  gcmTag1: string;
  gcmTag2: string;
  gcmAad: string;
  gcmForgeCt: string;
  ecbSecret: string;
  cbcPaddingPt: string;
  scheduleKey: string;
}

const INITIAL_FORM: AttackForm = {
  attack: 'ctr-nonce',
  ct1: '',
  ct2: '',
  knownPt: '',
  cribInput: '',
  ivHex: '',
  blockIdx: '0',
  blockOrder: '',
  targetText: '',
  currentPtHex: '',
  cts: '',
  gcmCt1: '',
  gcmPt1: '',
  gcmCt2: '',
  gcmTag1: '',
  gcmTag2: '',
  gcmAad: '',
  gcmForgeCt: '',
  ecbSecret: '',
  cbcPaddingPt: '',
  scheduleKey: '',
};

function formReducer(state: AttackForm, action: { key: keyof AttackForm; value: string }): AttackForm {
  return state[action.key] === action.value ? state : { ...state, [action.key]: action.value };
}

export function AESAttacksTab() {
  const [form, dispatchForm] = useReducer(formReducer, INITIAL_FORM);
  const set = useCallback(
    (key: keyof AttackForm) => (value: string) => dispatchForm({ key, value }),
    [],
  );
  const {
    attack, ct1, ct2, knownPt, cribInput, ivHex, blockIdx, blockOrder, targetText,
    currentPtHex, cts, gcmCt1, gcmPt1, gcmCt2, gcmTag1, gcmTag2, gcmAad, gcmForgeCt,
    ecbSecret, cbcPaddingPt, scheduleKey,
  } = form;
  const [loading, dispatchLoading] = useReducer((_s: boolean, action: 'start' | 'stop') => action === 'start', false);
  const isRunning = loading;
  const out = useCalculatorOutput({ category: 'calculator-aes' });
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    dispatchLoading('start');
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    out.clear();
    try {
      switch (attack) {
        case 'ctr-nonce': out.dispatch(runCtrNonce(ct1, ct2, knownPt, cribInput), `AES Attack: ${attack}`); break;
        case 'cbc-bitflip': out.dispatch(runCbcBitflip(ct1, ivHex, blockIdx, targetText, currentPtHex), `AES Attack: ${attack}`); break;
        case 'ecb-detect': out.dispatch(runEcbDetect(cts), `AES Attack: ${attack}`); break;
        case 'ecb-cutpaste': out.dispatch(runEcbCutpaste(ct1, blockOrder), `AES Attack: ${attack}`); break;
        case 'ecb-byte': out.dispatch(runEcbByteDemo(ecbSecret), 'AES Attack: ECB Byte-at-a-Time'); break;
        case 'cbc-padding': out.dispatch(runCbcPaddingDemo(cbcPaddingPt), 'AES Attack: CBC Padding Oracle'); break;
        case 'gcm-nonce': out.dispatch(runGcmNonce(gcmCt1, gcmPt1, gcmCt2, gcmTag1, gcmTag2, gcmAad, gcmForgeCt), `AES Attack: ${attack}`); break;
        case 'key-schedule': out.dispatch(runKeySchedule(scheduleKey), `AES Attack: ${attack}`); break;
        case 'cbc-iv': out.dispatch(runCbcIvDup(ivHex, cts), `AES Attack: ${attack}`); break;
        case 'stream-bitflip': out.dispatch(runStreamBitflip(ct1, blockIdx, currentPtHex, targetText), `AES Attack: ${attack}`); break;
        case 'cbc-keyiv': out.dispatch(runCbcKeyIv(currentPtHex), `AES Attack: ${attack}`); break;
        default: throw new Error(`Unknown attack "${attack}"`);
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    } finally {
      runningRef.current = false;
      dispatchLoading('stop');
    }
  }, [attack, ct1, ct2, knownPt, cribInput, ivHex, blockIdx, blockOrder, targetText, currentPtHex, cts, gcmCt1, gcmPt1, gcmCt2, gcmTag1, gcmTag2, gcmAad, gcmForgeCt, ecbSecret, cbcPaddingPt, scheduleKey, out]);

  const attackFields = useMemo(() => {
    switch (attack) {
      case 'ctr-nonce': return (
        <>
          <TextInput label="Ciphertext 1 (hex)" value={ct1} onChange={set('ct1')} placeholder="Hex CT1" width="100%" isDisabled={isRunning} />
          <TextInput label="Ciphertext 2 (hex)" value={ct2} onChange={set('ct2')} placeholder="Hex CT2" width="100%" isDisabled={isRunning} />
          <TextInput label="Known PT for CT1 (hex, optional — leave empty for crib-dragging)" value={knownPt} onChange={set('knownPt')} placeholder="Known plaintext window, ≥1 byte" width="100%" isDisabled={isRunning} />
          <TextInput label="Cribs, comma-separated (optional)" value={cribInput} onChange={set('cribInput')} placeholder="the , and , password (defaults built in)" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'cbc-bitflip': return (
        <>
          <TextInput label="Ciphertext (hex)" value={ct1} onChange={set('ct1')} placeholder="Hex CT" width="100%" isDisabled={isRunning} />
          <TextInput label="IV (hex)" value={ivHex} onChange={set('ivHex')} placeholder="Hex IV" width="100%" isDisabled={isRunning} />
          <TextInput label="Block index" value={blockIdx} onChange={set('blockIdx')} placeholder="0" width="100%" isDisabled={isRunning} />
          <TextInput label="Current Plaintext (hex)" value={currentPtHex} onChange={set('currentPtHex')} placeholder="Current plaintext block in hex" width="100%" isDisabled={isRunning} />
          <TextInput label="Target text" value={targetText} onChange={set('targetText')} placeholder="Desired plaintext (≤16 bytes)" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'ecb-detect': return (
        <TextArea label="Ciphertexts (one hex/line)" value={cts} onChange={set('cts')} rows={3} placeholder="Hex CT per line" isDisabled={isRunning} />
      );
      case 'ecb-cutpaste': return (
        <>
          <TextInput label="Ciphertext (hex)" value={ct1} onChange={set('ct1')} placeholder="Multiples of 16 bytes" width="100%" isDisabled={isRunning} />
          <TextInput label="Block order (optional)" value={blockOrder} onChange={set('blockOrder')} placeholder="e.g. 2,1,0,3" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'ecb-byte': return (
        <>
          <Banner
            status="info"
            title="Live oracle optional"
            description="Runs an offline simulation below (embedded secret, fresh key). For a live target, use the Python template in the Explanation tab."
          />
          <TextInput label="Secret (optional — defaults to embedded demo secret)" value={ecbSecret} onChange={set('ecbSecret')} placeholder="Custom secret to recover" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'cbc-padding': return (
        <>
          <Banner
            status="info"
            title="Live oracle optional"
            description="Runs an offline simulation below (random key/IV, local boolean oracle). For a live target, configure the Python template's status code + match string."
          />
          <TextInput label="Plaintext to encrypt-then-break (optional)" value={cbcPaddingPt} onChange={set('cbcPaddingPt')} placeholder="Defaults to demo message" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'gcm-nonce': return (
        <>
          <TextInput label="CT1 (raw hex — split the 16-byte tag off)" value={gcmCt1} onChange={set('gcmCt1')} placeholder="CT1 hex" width="100%" isDisabled={isRunning} />
          <TextInput label="PT1" value={gcmPt1} onChange={set('gcmPt1')} placeholder="PT1 hex" width="100%" isDisabled={isRunning} />
          <TextInput label="CT2" value={gcmCt2} onChange={set('gcmCt2')} placeholder="CT2 hex" width="100%" isDisabled={isRunning} />
          <TextInput label="TAG1 (hex, optional — enables H recovery)" value={gcmTag1} onChange={set('gcmTag1')} placeholder="16-byte tag hex" width="100%" isDisabled={isRunning} />
          <TextInput label="TAG2 (hex, optional)" value={gcmTag2} onChange={set('gcmTag2')} placeholder="16-byte tag hex" width="100%" isDisabled={isRunning} />
          <TextInput label="AAD (hex, optional — must be shared)" value={gcmAad} onChange={set('gcmAad')} placeholder="Shared additional data" width="100%" isDisabled={isRunning} />
          <TextInput label="Target CT to forge a tag for (hex, optional)" value={gcmForgeCt} onChange={set('gcmForgeCt')} placeholder="Same nonce + AAD" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'key-schedule': return (
        <TextInput label="Last round key (hex)" value={scheduleKey} onChange={set('scheduleKey')} placeholder="32 hex chars (AES-128)" width="100%" isDisabled={isRunning} />
      );
      case 'cbc-iv': return (
        <>
          <TextInput label="Shared IV (hex)" value={ivHex} onChange={set('ivHex')} placeholder="16-byte IV reused across messages" width="100%" isDisabled={isRunning} />
          <TextArea label="Ciphertexts (one hex/line)" value={cts} onChange={set('cts')} rows={3} placeholder="Hex CT per line" isDisabled={isRunning} />
        </>
      );
      case 'stream-bitflip': return (
        <>
          <TextInput label="Ciphertext (hex)" value={ct1} onChange={set('ct1')} placeholder="CTR/CFB/OFB ciphertext" width="100%" isDisabled={isRunning} />
          <TextInput label="Byte offset" value={blockIdx} onChange={set('blockIdx')} placeholder="0" width="100%" isDisabled={isRunning} />
          <TextInput label="Current plaintext window (hex)" value={currentPtHex} onChange={set('currentPtHex')} placeholder="Known bytes at offset" width="100%" isDisabled={isRunning} />
          <TextInput label="Target text" value={targetText} onChange={set('targetText')} placeholder="Desired bytes (same length)" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'cbc-keyiv': return (
        <TextInput label="Known P1 (hex, 16 bytes)" value={currentPtHex} onChange={set('currentPtHex')} placeholder="Known first plaintext block" width="100%" isDisabled={isRunning} />
      );
      default: return null;
    }
  }, [attack, ct1, ct2, knownPt, cribInput, ivHex, blockIdx, blockOrder, targetText, currentPtHex, cts, gcmCt1, gcmPt1, gcmCt2, gcmTag1, gcmTag2, gcmAad, gcmForgeCt, ecbSecret, cbcPaddingPt, scheduleKey, set, isRunning]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector
        label="Attack"
        options={AES_ATTACKS.map(a => ({ value: a.value, label: a.label }))}
        value={attack}
        onChange={set('attack')}
        width="100%"
        isDisabled={isRunning}
      />
      {AES_ATTACK_EXPLANATIONS[attack] && <AttackExplanationPanel data={AES_ATTACK_EXPLANATIONS[attack]} />}
      {attackFields}
      <Button
        label={isRunning ? 'Running attack…' : 'Run Attack'}
        variant="primary"
        width="100%"
        onClick={() => { void run(); }}
        isDisabled={isRunning}
        isLoading={isRunning}
      />
      {isRunning && (
        <Text type="supporting" role="status" aria-live="polite">
          Running attack…
        </Text>
      )}
      {out.result && <ResultBox value={out.result} label="Result" variant="medium" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
