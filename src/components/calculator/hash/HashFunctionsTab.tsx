import { useState, useRef, useCallback } from 'react';
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
import { bytesToHex } from '@noble/hashes/utils.js';
import { useAppContext } from '../../../hooks/useAppContext';
import { ResultBox } from '../_shared/ResultBox';

const ALGORITHMS = [
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha384', label: 'SHA-384' },
  { value: 'sha512', label: 'SHA-512' },
  { value: 'md5', label: 'MD5' },
  { value: 'sha1', label: 'SHA-1' },
  { value: 'blake2b', label: 'BLAKE2b' },
  { value: 'blake2s', label: 'BLAKE2s' },
  { value: 'blake3', label: 'BLAKE3' },
  { value: 'sha3_256', label: 'SHA-3-256' },
  { value: 'sha3_512', label: 'SHA-3-512' },
  { value: 'keccak256', label: 'Keccak-256' },
  { value: 'keccak512', label: 'Keccak-512' },
];

const ENCODINGS: { value: string; label: string }[] = [
  { value: 'utf8', label: 'UTF-8' },
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
];

type HashFn = (data: Uint8Array) => Uint8Array;

const HASH_FNS: Record<string, HashFn> = {
  sha256, sha384, sha512, md5, sha1,
  blake2b, blake2s, blake3,
  sha3_256, sha3_512, keccak_256, keccak_512,
};

function decodeInput(data: string, encoding: string): Uint8Array {
  const cleaned = data.replace(/\s/g, '');
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

export default function HashFunctionsTab() {
  const [algorithm, setAlgorithm] = useState('sha256');
  const [encoding, setEncoding] = useState('utf8');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCompute = useCallback(() => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    try {
      const fn = HASH_FNS[algorithm];
      if (!fn) throw new Error('Unknown algorithm');
      const bytes = decodeInput(input, encoding);
      if (bytes.length === 0) throw new Error('Empty input');
      const hashHex = bytesToHex(fn(bytes));
      setResult(hashHex);
      setCtxOutput(hashHex);
      setOutputSource('calculator');
      addToHistory('calculator-hash', `Hash: ${algorithm}`, hashHex, true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setCtxError(msg);
      setOutputSource('calculator');
    }
  }, [algorithm, encoding, input, setCtxOutput, setCtxError, setOutputSource, addToHistory]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const fn = HASH_FNS[algorithm];
        if (fn) {
          const hashHex = bytesToHex(fn(new Uint8Array(reader.result as ArrayBuffer)));
          setResult(hashHex);
          setCtxOutput(hashHex);
          setOutputSource('calculator');
          addToHistory('calculator-hash', `Hash: ${algorithm} (file)`, hashHex, true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setCtxError(msg);
        setOutputSource('calculator');
      }
    };
    reader.onerror = () => {
      setError('File read error');
      setCtxError('File read error');
      setOutputSource('calculator');
    };
    reader.readAsArrayBuffer(file);
  }, [algorithm, setCtxOutput, setCtxError, setOutputSource, addToHistory]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector label="Algorithm" options={ALGORITHMS} value={algorithm} onChange={setAlgorithm} width="100%" />
      <Selector label="Input Encoding" options={ENCODINGS} value={encoding} onChange={setEncoding} width="100%" />
      {encoding === 'utf8' ? (
        <TextArea
          label="Input Text"
          value={input}
          onChange={setInput}
          rows={3}
          placeholder="Enter text to hash..."
        />
      ) : (
        <TextInput
          label={`Input (${encoding.toUpperCase()})`}
          value={input}
          onChange={setInput}
          placeholder={encoding === 'hex' ? 'Hex string (e.g., 48656c6c6f)' : 'Base64 string (e.g., SGVsbG8=)'}
          width="100%"
        />
      )}
      <Stack direction="horizontal" gap={1}>
        <Button label="Compute Hash" variant="primary" onClick={handleCompute} isDisabled={!input.trim()} />
        <Button label="Hash File" variant="secondary" onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" hidden onChange={handleFile} aria-label="Select a file to hash" />
      </Stack>
      {result && (
        <ResultBox value={result} label={`${algorithm.toUpperCase()} hash (${encoding.toUpperCase()} input):`} />
      )}
      {error && <Banner status="error" title={error} />}
    </Stack>
  );
}
