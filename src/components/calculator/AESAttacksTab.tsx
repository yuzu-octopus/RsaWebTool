import { useState, useCallback, useMemo, useReducer, useRef } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import { xorBytes, expandKey, fmtRounds } from '../../utils/aesCrypto';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { AttackExplanationPanel } from './AttackExplanationPanel';
import { ResultBox } from './_shared/ResultBox';
import { AES_ATTACKS, AES_ATTACK_EXPLANATIONS } from '../../data/attackExplanations/aes';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

export function AESAttacksTab() {
  const [attack, setAttack] = useState<string>('ctr-nonce');
  const [ct1, setCt1] = useState('');
  const [ct2, setCt2] = useState('');
  const [knownPt, setKnownPt] = useState('');
  const [ivHex, setIvHex] = useState('');
  const [blockIdx, setBlockIdx] = useState('0');
  const [targetText, setTargetText] = useState('');
  const [currentPtHex, setCurrentPtHex] = useState('');
  const [cts, setCts] = useState('');
  const [gcmCt1, setGcmCt1] = useState('');
  const [gcmPt1, setGcmPt1] = useState('');
  const [gcmCt2, setGcmCt2] = useState('');
  const [scheduleKey, setScheduleKey] = useState('');
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
        case 'ctr-nonce': {
          const c1 = hexToBytes(ct1.replace(/\s/g, ''));
          const c2 = hexToBytes(ct2.replace(/\s/g, ''));
          const kp = hexToBytes(knownPt.replace(/\s/g, ''));
          if (c1.length < 16 || c2.length < 16 || kp.length < 16) throw new Error('All inputs must be ≥16 bytes');
          const ks = xorBytes(kp, c1.subarray(0, kp.length));
          const pt2 = xorBytes(c2.subarray(0, ks.length), ks);
          let txt = '';
          try { txt = new TextDecoder().decode(pt2); } catch { txt = '(non-UTF8)'; }
          const resultA = `CTR keystream (${ks.length} bytes): ${bytesToHex(ks)}\n\nDecrypted CT2: ${bytesToHex(pt2)}\n\nAs text: ${txt}`;
          out.dispatch(resultA, `AES Attack: ${attack}`);
          break;
        }
        case 'cbc-bitflip': {
          const ct = hexToBytes(ct1.replace(/\s/g, ''));
          const iv = hexToBytes(ivHex.replace(/\s/g, ''));
          const idx = parseInt(blockIdx, 10);
          const tgt = new TextEncoder().encode(targetText);
          const curPlain = hexToBytes(currentPtHex.replace(/\s/g, ''));
          if (ct.length < 16) throw new Error('CT must be ≥16 bytes');
          if (!curPlain.length) throw new Error('Current plaintext block (hex) is required');
          const isIV = idx === 0;
          const off = isIV ? 0 : (idx - 1) * 16;
          const mod = new Uint8Array(isIV ? iv : ct);
          for (let j = 0; j < Math.min(tgt.length, curPlain.length, (isIV ? iv.length - off : ct.length - off)); j++) {
            mod[off + j] ^= curPlain[j] ^ tgt[j];
          }
          const resultB = `Modified ${isIV ? 'IV' : `CT block ${idx - 1}`}:\n${bytesToHex(mod)}\n\nCBC bit flip: mod[offset+j] = original[offset+j] ^ current_plaintext[j] ^ target_byte.`;
          out.dispatch(resultB, `AES Attack: ${attack}`);
          break;
        }
        case 'ecb-detect': {
          const lines = cts.trim().split('\n').filter(l => l.trim());
          const detectOut = lines.map(line => {
            const ct = hexToBytes(line.replace(/\s/g, ''));
            if (ct.length < 32) return `[SKIP] ${line.slice(0, 40)}...`;
            const seen = new Set<string>();
            for (let i = 0; i < ct.length; i += 16) {
              const h = bytesToHex(ct.subarray(i, i + 16));
              if (seen.has(h)) return `[ECB] ${line.slice(0, 40)}...`;
              seen.add(h);
            }
            return `[not ECB] ${line.slice(0, 40)}...`;
          });
          const resultC = detectOut.join('\n');
          out.dispatch(resultC, `AES Attack: ${attack}`);
          break;
        }
        case 'ecb-cutpaste': {
          const ct = hexToBytes(ct1.replace(/\s/g, ''));
          if (ct.length < 32 || ct.length % 16) throw new Error('CT must be multiple of 16 bytes');
          const blks: string[] = [];
          for (let i = 0; i < ct.length; i += 16) blks.push(`[${i / 16}] ${bytesToHex(ct.subarray(i, i + 16))}`);
          const resultD = `Blocks:\n${blks.join('\n')}\n\nReorder blocks to forge new plaintext under the same key.`;
          out.dispatch(resultD, `AES Attack: ${attack}`);
          break;
        }
        case 'ecb-byte': {
          const msg = 'ECB Byte-at-a-Time requires a live oracle endpoint.\n\nUse the Python exploit template in the Explanation tab with your specific challenge.';
          out.dispatch(msg, 'AES Attack: ECB Byte-at-a-Time');
          break;
        }
        case 'cbc-padding': {
          const msg = 'CBC Padding Oracle requires a live oracle endpoint.\n\nUse the Python exploit template in the Explanation tab with your specific challenge.';
          out.dispatch(msg, 'AES Attack: CBC Padding Oracle');
          break;
        }
        case 'gcm-nonce': {
          const c1 = hexToBytes(gcmCt1.replace(/\s/g, ''));
          const p1 = hexToBytes(gcmPt1.replace(/\s/g, ''));
          const c2 = hexToBytes(gcmCt2.replace(/\s/g, ''));
          if (!c1.length || !p1.length || !c2.length) throw new Error('All fields required');
          const ml = Math.min(c1.length, p1.length, c2.length);
          const ks = xorBytes(c1.subarray(0, ml), p1.subarray(0, ml));
          const pt2 = xorBytes(c2.subarray(0, ml), ks);
          let txt = '';
          try { txt = new TextDecoder().decode(pt2); } catch { txt = '(non-UTF8)'; }
          const resultG = `Keystream: ${bytesToHex(ks)}\nPT2: ${bytesToHex(pt2)}\nText: ${txt}\n\nGCM nonce reuse: same nonce → identical GHASH key H = AES_K(0). Compute H, forge tags.`;
          out.dispatch(resultG, `AES Attack: ${attack}`);
          break;
        }
        case 'key-schedule': {
          const keyBytes = hexToBytes(scheduleKey.replace(/\s/g, ''));
          if (![16, 24, 32].includes(keyBytes.length)) throw new Error('Key must be 16/24/32 bytes');
          const nk = keyBytes.length / 4;
          const nr = nk + 6;
          const rks = fmtRounds(expandKey(keyBytes), nr);
          rks.push(`\n${nr + 1} round keys, ${expandKey(keyBytes).length} words`);
          if (keyBytes.length === 16) {
            rks.push('\nAES-128: last round key → invert key schedule → original key. Side-channel the last round to recover the key.');
          }
          const resultH = rks.join('\n');
          out.dispatch(resultH, `AES Attack: ${attack}`);
          break;
        }
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    } finally {
      runningRef.current = false;
      dispatchLoading('stop');
    }
  }, [attack, ct1, ct2, knownPt, ivHex, blockIdx, targetText, currentPtHex, cts, gcmCt1, gcmPt1, gcmCt2, scheduleKey, out]);

  const attackFields = useMemo(() => {
    switch (attack) {
      case 'ctr-nonce': return (
        <>
          <TextInput label="Ciphertext 1 (hex)" value={ct1} onChange={setCt1} placeholder="Hex CT1" width="100%" isDisabled={isRunning} />
          <TextInput label="Ciphertext 2 (hex)" value={ct2} onChange={setCt2} placeholder="Hex CT2" width="100%" isDisabled={isRunning} />
          <TextInput label="Known PT (hex)" value={knownPt} onChange={setKnownPt} placeholder="Known plaintext for CT1" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'cbc-bitflip': return (
        <>
          <TextInput label="Ciphertext (hex)" value={ct1} onChange={setCt1} placeholder="Hex CT" width="100%" isDisabled={isRunning} />
          <TextInput label="IV (hex)" value={ivHex} onChange={setIvHex} placeholder="Hex IV" width="100%" isDisabled={isRunning} />
          <TextInput label="Block index" value={blockIdx} onChange={setBlockIdx} placeholder="0" width="100%" isDisabled={isRunning} />
          <TextInput label="Current Plaintext (hex)" value={currentPtHex} onChange={setCurrentPtHex} placeholder="Current plaintext block in hex" width="100%" isDisabled={isRunning} />
          <TextInput label="Target text" value={targetText} onChange={setTargetText} placeholder="Desired plaintext" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'ecb-detect': return (
        <TextArea label="Ciphertexts (one hex/line)" value={cts} onChange={setCts} rows={3} placeholder="Hex CT per line" isDisabled={isRunning} />
      );
      case 'ecb-cutpaste': return (
        <TextInput label="Ciphertext (hex)" value={ct1} onChange={setCt1} placeholder="Multiples of 16 bytes" width="100%" isDisabled={isRunning} />
      );
      case 'ecb-byte': return (
        <Banner
          status="info"
          title="Live oracle required"
          description="This attack requires a live oracle endpoint. See the Explanation tab for a complete Python exploit template."
        />
      );
      case 'cbc-padding': return (
        <Banner
          status="info"
          title="Live oracle required"
          description="This attack requires a live oracle endpoint. See the Explanation tab for a complete Python exploit template."
        />
      );
      case 'gcm-nonce': return (
        <>
          <TextInput label="CT1" value={gcmCt1} onChange={setGcmCt1} placeholder="CT1 hex" width="100%" isDisabled={isRunning} />
          <TextInput label="PT1" value={gcmPt1} onChange={setGcmPt1} placeholder="PT1 hex" width="100%" isDisabled={isRunning} />
          <TextInput label="CT2" value={gcmCt2} onChange={setGcmCt2} placeholder="CT2 hex" width="100%" isDisabled={isRunning} />
        </>
      );
      case 'key-schedule': return (
        <TextInput label="AES Key (hex)" value={scheduleKey} onChange={setScheduleKey} placeholder="32/48/64 hex chars" width="100%" isDisabled={isRunning} />
      );
      default: return null;
    }
  }, [attack, ct1, ct2, knownPt, ivHex, blockIdx, targetText, currentPtHex, cts, gcmCt1, gcmPt1, gcmCt2, scheduleKey, isRunning]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector
        label="Attack"
        options={AES_ATTACKS.map(a => ({ value: a.value, label: a.label }))}
        value={attack}
        onChange={setAttack}
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
        <Text role="status" aria-live="polite">
          Running attack…
        </Text>
      )}
      {out.result && <ResultBox value={out.result} label="Result" variant="medium" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
