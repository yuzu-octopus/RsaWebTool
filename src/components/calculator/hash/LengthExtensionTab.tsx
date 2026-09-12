import { useState, useCallback } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import { Table, proportional, pixel } from '@astryxdesign/core/Table';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { sha1, md5 } from '@noble/hashes/legacy.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { useAppContext } from '../../../hooks/useAppContext';
import { useCalculatorOutput } from '../../../hooks/useCalculatorOutput';
import { ResultBox } from '../_shared/ResultBox';
import { AttackExplanationPanel, type AttackExplanationData } from '../AttackExplanationPanel';
import { SharedAttackPanel } from '../../attacks/SharedAttackPanel';

interface AlgInfo {
  value: string;
  label: string;
  blockLen: number;
  padOffset: number;
  isLE: boolean;
  stateWords: number;
  outputLen: number;
}

const ALGORITHMS: AlgInfo[] = [
  { value: 'sha256', label: 'SHA-256', blockLen: 64, padOffset: 8, isLE: false, stateWords: 8, outputLen: 32 },
  { value: 'sha1', label: 'SHA-1', blockLen: 64, padOffset: 8, isLE: false, stateWords: 5, outputLen: 20 },
  { value: 'md5', label: 'MD5', blockLen: 64, padOffset: 8, isLE: true, stateWords: 4, outputLen: 16 },
  { value: 'sha512', label: 'SHA-512', blockLen: 128, padOffset: 16, isLE: false, stateWords: 16, outputLen: 64 },
];

interface HashInstance {
  // Internal state words and properties — accessed dynamically by injectState
  [prop: string]: unknown;
  // Public API used by lengthExtend
  update(data: Uint8Array): void;
  digest(): Uint8Array;
}

const HASH_CREATORS: Record<string, () => HashInstance> = {
  sha256: () => sha256.create() as unknown as HashInstance,
  sha1: () => sha1.create() as unknown as HashInstance,
  md5: () => md5.create() as unknown as HashInstance,
  sha512: () => sha512.create() as unknown as HashInstance,
};

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s/g, '');
  if (cleaned.length % 2 !== 0) throw new Error('Hex string must have even length');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  return bytes;
}

function decodeMsg(data: string): Uint8Array {
  const cleaned = data.replace(/\s/g, '');
  if (cleaned.length >= 2 && /^[0-9a-fA-F]+$/.test(cleaned) && cleaned.length % 2 === 0) {
    return hexToBytes(cleaned);
  }
  return new TextEncoder().encode(data);
}

function readBE32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
}

function readLE32(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

function computeGluePadding(originalLen: number, blockLen: number, padOffset: number, isLE: boolean): Uint8Array {
  const zeros = (blockLen - ((originalLen + 1 + padOffset) % blockLen)) % blockLen;
  const totalPad = 1 + zeros + padOffset;
  const padding = new Uint8Array(totalPad);
  padding[0] = 0x80;
  const bitLen = BigInt(originalLen) * 8n;
  for (let i = 0; i < padOffset; i++) {
    const byteIdx = isLE ? (totalPad - 1 - i) : (totalPad - padOffset + i);
    padding[byteIdx] = Number((bitLen >> BigInt(8 * i)) & 0xffn);
  }
  return padding;
}

function paddedLen(originalLen: number, blockLen: number, padOffset: number): number {
  return Math.ceil((originalLen + 1 + padOffset) / blockLen) * blockLen;
}

function injectState(hash: HashInstance, alg: AlgInfo, hashBytes: Uint8Array, totalProcessed: number): void {
  if (alg.value === 'sha512') {
    for (let i = 0; i < 8; i++) {
      const hi = readBE32(hashBytes, i * 8);
      const lo = readBE32(hashBytes, i * 8 + 4);
      const props = ['Ah','Al','Bh','Bl','Ch','Cl','Dh','Dl','Eh','El','Fh','Fl','Gh','Gl','Hh','Hl'] as const;
      (hash as unknown as Record<string, number>)[props[i*2]] = hi;
      (hash as unknown as Record<string, number>)[props[i*2+1]] = lo;
    }
  } else if (alg.isLE) {
    hash.A = readLE32(hashBytes, 0);
    hash.B = readLE32(hashBytes, 4);
    hash.C = readLE32(hashBytes, 8);
    hash.D = readLE32(hashBytes, 12);
  } else {
    const names = alg.stateWords === 5
      ? ['A','B','C','D','E']
      : ['A','B','C','D','E','F','G','H'];
    for (let i = 0; i < alg.stateWords; i++) (hash as unknown as Record<string, number>)[names[i]] = readBE32(hashBytes, i * 4);
  }
  hash.length = totalProcessed;
  hash.pos = 0;
  (hash.buffer as Uint8Array).fill(0);
  hash.finished = false;
  hash.destroyed = false;
}

function lengthExtend(
  alg: AlgInfo,
  originalHashHex: string,
  originalMessage: Uint8Array,
  secretLen: number,
  appendData: Uint8Array,
): { extendedMessage: Uint8Array; newHash: string } {
  const hashBytes = hexToBytes(originalHashHex);
  if (hashBytes.length !== alg.outputLen) {
    throw new Error(`Expected ${alg.outputLen}-byte hash, got ${hashBytes.length} bytes`);
  }
  const totalOriginalLen = secretLen + originalMessage.length;
  const gluePadding = computeGluePadding(totalOriginalLen, alg.blockLen, alg.padOffset, alg.isLE);
  const totalProcessed = paddedLen(totalOriginalLen, alg.blockLen, alg.padOffset);
  const extMsg = new Uint8Array(originalMessage.length + gluePadding.length + appendData.length);
  extMsg.set(originalMessage, 0);
  extMsg.set(gluePadding, originalMessage.length);
  extMsg.set(appendData, originalMessage.length + gluePadding.length);
  const hash = HASH_CREATORS[alg.value]();
  injectState(hash, alg, hashBytes, totalProcessed);
  hash.update(appendData);
  return { extendedMessage: extMsg, newHash: bytesToHex(hash.digest()) };
}

interface CandidateRow extends Record<string, unknown> {
  secretLen: number;
  hash: string;
}

export default function LengthExtensionTab() {
  const [algorithm, setAlgorithm] = useState('sha256');
  const [originalHash, setOriginalHash] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  const [secretLen, setSecretLen] = useState(8);
  const [secretUnknown, setSecretUnknown] = useState(false);
  const [secretRangeEnd, setSecretRangeEnd] = useState(32);
  const [appendData, setAppendData] = useState('');
  const [result, setResult] = useState<{ extendedMsg: string; newHash: string } | null>(null);
  const [results, setResults] = useState<{ secretLen: number; hash: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const alg = ALGORITHMS.find(a => a.value === algorithm)!;
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const handleRun = useCallback(() => {
    setError(null); setResult(null); setResults([]);
    setCtxOutput(null); setCtxError(null);
    try {
      const msgBytes = decodeMsg(originalMessage);
      const appendBytes = decodeMsg(appendData);
      const hashHex = originalHash.replace(/\s/g, '');
      const runSingle = (sLen: number) => lengthExtend(alg, hashHex, msgBytes, sLen, appendBytes);
      if (secretUnknown && secretRangeEnd > 0) {
        const attempts: { secretLen: number; hash: string }[] = [];
        for (let sl = 1; sl <= secretRangeEnd; sl++) {
          try { attempts.push({ secretLen: sl, hash: runSingle(sl).newHash }); }
          catch { /* skip */ }
        }
        if (attempts.length === 0) throw new Error('No results for any secret length');
        setResults(attempts);
        const leResult = { extendedMsg: bytesToHex(runSingle(1).extendedMessage), newHash: attempts[0].hash };
        setResult(leResult);
        setCtxOutput(`Extended Message: ${leResult.extendedMsg}\nNew Hash: ${leResult.newHash}`);
        setOutputSource('calculator');
        addToHistory('calculator-hash', 'Length Extension', `Extended Message: ${leResult.extendedMsg}\nNew Hash: ${leResult.newHash}`, true);
      } else {
        const out = runSingle(secretLen);
        const leResult = { extendedMsg: bytesToHex(out.extendedMessage), newHash: out.newHash };
        setResult(leResult);
        setCtxOutput(`Extended Message: ${leResult.extendedMsg}\nNew Hash: ${leResult.newHash}`);
        setOutputSource('calculator');
        addToHistory('calculator-hash', 'Length Extension', `Extended Message: ${leResult.extendedMsg}\nNew Hash: ${leResult.newHash}`, true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setCtxError(msg);
      setOutputSource('calculator');
    }
  }, [originalHash, originalMessage, secretLen, secretUnknown, secretRangeEnd, appendData, alg, setCtxOutput, setCtxError, setOutputSource, addToHistory]);

  return (
    <Stack direction="vertical" gap={2}>
      <Banner
        status="warning"
        title="Length extension attack"
        description="Length extension on Merkle-Damgård hashes (SHA-256, SHA-1, MD5, SHA-512). Given H(secret || message), computes H(secret||message||pad||append) without the secret."
      />
      <Selector
        label="Algorithm"
        options={ALGORITHMS.map(a => ({ value: a.value, label: a.label }))}
        value={algorithm}
        onChange={setAlgorithm}
        width="100%"
      />
      <TextInput label="Original Hash (hex)" value={originalHash} onChange={setOriginalHash} placeholder="Original hash output (e.g., from H(secret || message))" width="100%" />
      <TextArea
        label="Original Message (known part)"
        value={originalMessage}
        onChange={setOriginalMessage}
        rows={2}
        placeholder="Hex or plaintext — known message after the secret prefix"
      />
      <Stack direction="vertical" gap={1}>
        <Stack direction="horizontal" gap={2} vAlign="center">
          <Text type="label">Secret Length:</Text>
          {secretUnknown ? (
            <Text type="body" style={{ color: 'var(--dracula-orange)' }} hasTabularNumbers>Brute-force 1 – {secretRangeEnd} bytes</Text>
          ) : (
            <Text type="body" style={{ color: 'var(--dracula-cyan)' }} hasTabularNumbers>{secretLen} bytes</Text>
          )}
          <Button
            label={secretUnknown ? 'Fixed' : 'Unknown'}
            variant="ghost"
            size="sm"
            onClick={() => setSecretUnknown(!secretUnknown)}
          />
        </Stack>
        {secretUnknown ? (
          <NumberInput
            label="Max secret length (bytes)"
            value={secretRangeEnd}
            onChange={v => setSecretRangeEnd(Math.max(1, v))}
            min={1}
            max={256}
            width="100%"
          />
        ) : (
          <NumberInput
            label="Secret length (bytes)"
            value={secretLen}
            onChange={setSecretLen}
            min={1}
            max={128}
            step={1}
            width="100%"
          />
        )}
      </Stack>
      <TextArea
        label="Append Data"
        value={appendData}
        onChange={setAppendData}
        rows={2}
        placeholder="Data to append (hex or plaintext)"
      />
      <Button
        label={secretUnknown ? 'Brute-force & Compute' : 'Compute Extension'}
        variant="primary"
        width="100%"
        onClick={handleRun}
        isDisabled={!originalHash.trim() || !originalMessage.trim() || !appendData.trim()}
      />
      {result && (
        <Stack direction="vertical" gap={2}>
          <ResultBox value={result.extendedMsg} label="Extended Message (original || glue_padding || append):" variant="compact" />
          <ResultBox
            value={result.newHash}
            label={secretUnknown ? 'New Hash (for secret_len=1):' : `New Hash (secret_len=${secretLen}):`}
          />
          {results.length > 1 && (
            <Stack direction="vertical" gap={1}>
              <Text type="label" hasTabularNumbers>All candidates ({results.length} lengths):</Text>
              <Table<CandidateRow>
                data={results}
                columns={[
                  { key: 'secretLen', header: 'Len', width: pixel(80), renderCell: (row) => (
                    <Text type="code" hasTabularNumbers>{String(row.secretLen)}</Text>
                  ) },
                  { key: 'hash', header: 'Hash', width: proportional(1), renderCell: (row) => (
                    <Text type="code">{String(row.hash)}</Text>
                  ) },
                ]}
                idKey="secretLen"
                density="compact"
                textOverflow="truncate"
                hasHover
              />
            </Stack>
          )}
        </Stack>
      )}
      {error && <Banner status="error" title={error} />}
    </Stack>
  );
}

/* ─── Shared-panel attack wrapper (attacks pane; operations keeps the full tab) ─── */

const LENGTH_EXTENSION_EXPLANATION: AttackExplanationData = {
  title: 'Length Extension Attack',
  description:
    'Merkle-Damgard hashes (MD5, SHA-1, SHA-256, SHA-512) output their full internal state. ' +
    'Given H(secret || message) — without the secret — forge H(secret || message || glue_padding || suffix) ' +
    'by injecting the digest as the hash state and continuing from the padded length.',
  whenToUse:
    'The target verifies H(secret || message) with a secret prefix (API signing, download tokens). ' +
    'You know the message and its hash, and know or can guess the secret length.',
  algorithm: [
    'Read the original hash as the internal state words (big- or little-endian per algorithm)',
    'Recompute the Merkle-Damgard glue padding for (secret_len + len(message)) bytes',
    'Set total-processed to the padded length, inject the state, then hash your suffix',
    'Forged message = message || glue_padding || suffix; forged hash = the continued digest',
  ],
  python: `import hashlib

# Merkle-Damgard hashes output their full internal state, so
# H(secret || message) can be continued without the secret:
#   1. glue = padding for (secret_len + len(message)) bytes
#   2. state = digest bytes of H(secret || message)
#   3. forged = message + glue + suffix
#   4. H(secret || forged) = compress_from(state, suffix)
# (hashlib cannot inject state, so this tab runs the equivalent
# state-injection locally in TypeScript — see the Source tab.)`,
};

function generateLengthExtensionDemo(): Record<string, string> {
  const secret = crypto.getRandomValues(new Uint8Array(8));
  const message = 'Hello, world!';
  const hash = HASH_CREATORS['sha256']();
  hash.update(secret);
  hash.update(new TextEncoder().encode(message));
  return {
    algorithm: 'sha256',
    originalHash: bytesToHex(hash.digest()),
    originalMessage: message,
    secretLen: '8',
    appendData: '&admin=true',
  };
}

function runLengthExtensionAttack(vals: Record<string, string>): string {
  const alg = ALGORITHMS.find(a => a.value === (vals.algorithm ?? 'sha256')) ?? ALGORITHMS[0];
  const sLen = Number((vals.secretLen ?? '').trim());
  if (!Number.isInteger(sLen) || sLen < 1 || sLen > 256) {
    throw new Error(`Secret length must be an integer in 1..256 (got "${vals.secretLen ?? ''}")`);
  }
  const out = lengthExtend(
    alg,
    vals.originalHash ?? '',
    decodeMsg(vals.originalMessage ?? ''),
    sLen,
    decodeMsg(vals.appendData ?? ''),
  );
  return `Extended Message (hex): ${bytesToHex(out.extendedMessage)}\nNew Hash: ${out.newHash}`;
}

export function LengthExtensionAttackPanel() {
  const out = useCalculatorOutput({ category: 'calculator-hash' });
  const handleRun = useCallback((vals: Record<string, string>) => {
    out.clear();
    try {
      out.dispatch(runLengthExtensionAttack(vals), 'Hash Attack: length-extension');
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [out]);
  return (
    <SharedAttackPanel
      title={LENGTH_EXTENSION_EXPLANATION.title}
      description={LENGTH_EXTENSION_EXPLANATION.description}
      explanationNode={<AttackExplanationPanel data={LENGTH_EXTENSION_EXPLANATION} />}
      fields={[
        { name: 'algorithm', label: 'Algorithm', kind: 'select', options: ALGORITHMS.map(a => ({ value: a.value, label: a.label })) },
        { name: 'originalHash', label: 'Original hash (hex)', placeholder: 'H(secret || message)' },
        { name: 'originalMessage', label: 'Original message (known part)', placeholder: 'Hex or plaintext', kind: 'textarea' },
        { name: 'secretLen', label: 'Secret length (bytes)', placeholder: '8' },
        { name: 'appendData', label: 'Data to append', placeholder: 'Hex or plaintext', kind: 'textarea' },
      ]}
      generateLabel="Generate"
      onGenerate={generateLengthExtensionDemo}
      onRun={handleRun}
      sourceCode={lengthExtend.toString()}
      sourceLanguage="typescript"
      resultNode={(
        <>
          {out.result && <ResultBox value={out.result} label="Result" variant="medium" />}
          {out.error && <Banner status="error" title={out.error} />}
        </>
      )}
    />
  );
}
