import { useState, useCallback } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { md5, sha1 } from '@noble/hashes/legacy.js';
import { blake2b, blake2s } from '@noble/hashes/blake2.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { sha3_256, sha3_512, keccak_256, keccak_512 } from '@noble/hashes/sha3.js';
import { hmac } from '@noble/hashes/hmac.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { CHash } from '@noble/hashes/utils.js';
import { useAppContext } from '../../../hooks/useAppContext';
import { ResultBox } from '../_shared/ResultBox';

const ENCODINGS: { value: string; label: string }[] = [
  { value: 'utf8', label: 'UTF-8' },
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
];

interface AlgorithmMeta {
  value: string;
  label: string;
  fn: CHash;
}

function decodeBytes(data: string, encoding: string): Uint8Array {
  const cleaned = encoding === 'utf8' ? data : data.replace(/\s/g, '');
  switch (encoding) {
    case 'hex': {
      if (cleaned.length % 2 !== 0) throw new Error('Hex string must have even length');
      const bytes = new Uint8Array(cleaned.length / 2);
      for (let i = 0; i < cleaned.length; i += 2) bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
      return bytes;
    }
    case 'base64': {
      const bin = atob(cleaned);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    default: return new TextEncoder().encode(data);
  }
}

export default function HMACTab() {
  const [algorithm, setAlgorithm] = useState('sha256');
  const [keyEncoding, setKeyEncoding] = useState('utf8');
  const [msgEncoding, setMsgEncoding] = useState('utf8');
  const [key, setKey] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const getAlgorithms = useCallback((): AlgorithmMeta[] => [
    { value: 'sha256', label: 'SHA-256', fn: sha256 },
    { value: 'sha384', label: 'SHA-384', fn: sha384 },
    { value: 'sha512', label: 'SHA-512', fn: sha512 },
    { value: 'md5', label: 'MD5', fn: md5 },
    { value: 'sha1', label: 'SHA-1', fn: sha1 },
    { value: 'blake2b', label: 'BLAKE2b', fn: blake2b },
    { value: 'blake2s', label: 'BLAKE2s', fn: blake2s },
    { value: 'blake3', label: 'BLAKE3', fn: blake3 },
    { value: 'sha3_256', label: 'SHA-3-256', fn: sha3_256 },
    { value: 'sha3_512', label: 'SHA-3-512', fn: sha3_512 },
    { value: 'keccak256', label: 'Keccak-256', fn: keccak_256 },
    { value: 'keccak512', label: 'Keccak-512', fn: keccak_512 },
  ], []);

  const handleCompute = useCallback(() => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    try {
      const alg = getAlgorithms().find(a => a.value === algorithm);
      if (!alg) throw new Error('Unknown algorithm');
      if (!key) throw new Error('Key is required');
      if (!message) throw new Error('Message is required');
      const keyBytes = decodeBytes(key, keyEncoding);
      const msgBytes = decodeBytes(message, msgEncoding);
      const hmacHex = bytesToHex(hmac(alg.fn, keyBytes, msgBytes));
      setResult(hmacHex);
      setCtxOutput(hmacHex);
      setOutputSource('calculator');
      addToHistory('calculator-hash', `HMAC-${algorithm}`, hmacHex, true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setCtxError(msg);
      setOutputSource('calculator');
    }
  }, [algorithm, keyEncoding, msgEncoding, key, message, getAlgorithms, setCtxOutput, setCtxError, setOutputSource, addToHistory]);

  const algs = getAlgorithms();
  const selectedAlg = algs.find(a => a.value === algorithm);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector
        label="Algorithm"
        options={algs.map(a => ({ value: a.value, label: a.label }))}
        value={algorithm}
        onChange={setAlgorithm}
        width="100%"
      />
      <Stack direction="horizontal" gap={1} vAlign="start">
        <Selector label="Key Enc." options={ENCODINGS} value={keyEncoding} onChange={setKeyEncoding} />
        <Stack direction="vertical" width="100%">
          <TextInput label="Key" value={key} onChange={setKey} placeholder="HMAC secret key..." width="100%" />
        </Stack>
      </Stack>
      <Stack direction="horizontal" gap={1} vAlign="start">
        <Selector label="Msg Enc." options={ENCODINGS} value={msgEncoding} onChange={setMsgEncoding} />
        <Stack direction="vertical" width="100%">
          <TextArea label="Message" value={message} onChange={setMessage} rows={3} placeholder="Message to authenticate..." />
        </Stack>
      </Stack>
      <Button
        label="Compute HMAC"
        variant="primary"
        width="100%"
        onClick={handleCompute}
        isDisabled={!key.trim() || !message.trim()}
      />
      {result && (
        <ResultBox value={result} label={`HMAC-${selectedAlg?.label ?? algorithm}:`} />
      )}
      {error && <Banner status="error" title={error} />}
    </Stack>
  );
}
