import { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import { PlayArrow, UploadFile, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../../../theme/dracula';
import { inputSx } from '../../../styles/inputSx';
import { outputBoxSx, colorGhostBtn, primaryBtnSx, MONO_FAMILY } from '../../../styles/shared';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { md5, sha1 } from '@noble/hashes/legacy.js';
import { blake2b, blake2s } from '@noble/hashes/blake2.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { sha3_256, sha3_512, keccak_256, keccak_512 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { useAppContext } from '../../../hooks/useAppContext';

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

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Algorithm</InputLabel>
        <Select value={algorithm} label="Algorithm" onChange={e => setAlgorithm(e.target.value)}>
          {ALGORITHMS.map(a => (<MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Input Encoding</InputLabel>
        <Select value={encoding} label="Input Encoding" onChange={e => setEncoding(e.target.value)}>
          {ENCODINGS.map(e => (<MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>))}
        </Select>
      </FormControl>
      <TextField fullWidth multiline={encoding === 'utf8'} minRows={encoding === 'utf8' ? 3 : 1} maxRows={12}
        label={encoding === 'utf8' ? 'Input Text' : `Input (${encoding.toUpperCase()})`}
        value={input} onChange={e => setInput(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }}
        placeholder={encoding === 'hex' ? 'Hex string (e.g., 48656c6c6f)' : encoding === 'base64' ? 'Base64 string (e.g., SGVsbG8=)' : 'Enter text to hash...'} />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="contained" startIcon={<PlayArrow />} onClick={handleCompute} disabled={!input.trim()}
          sx={primaryBtnSx}>Compute Hash</Button>
        <Button variant="outlined" startIcon={<UploadFile />} onClick={() => fileRef.current?.click()} sx={colorGhostBtn(draculaColors.cyan)}>Hash File</Button>
        <input ref={fileRef} type="file" hidden onChange={handleFile} aria-label="Select a file to hash" />
      </Box>
      {result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>{algorithm.toUpperCase()} hash ({encoding.toUpperCase()} input):</Typography>
            <Tooltip title="Copy hash"><IconButton size="small" onClick={handleCopy} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Box sx={outputBoxSx}><Box sx={{ fontFamily: MONO_FAMILY, wordBreak: 'break-all' }}>{result}</Box></Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}
