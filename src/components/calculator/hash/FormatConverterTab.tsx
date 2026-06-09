import { useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import { SwapHoriz, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../../../theme/dracula';
import { inputSx } from '../../../styles/inputSx';
import { outputBoxSx } from '../../../styles/shared';
import { bytesToHex } from '@noble/hashes/utils.js';
import { useAppContext } from '../../../hooks/useAppContext';

const CONVERSION_TYPES: { value: string; label: string }[] = [
  { value: 'hex2b64', label: 'Hex → Base64' },
  { value: 'b642hex', label: 'Base64 → Hex' },
  { value: 'detect', label: 'Auto-detect hash format' },
];

interface HashInfo { algorithm: string; bits: number; hexLen: number; }

const HASH_SIGNATURES: { algorithm: string; bits: number; hexLen: number; prefix?: string }[] = [
  { algorithm: 'MD5', bits: 128, hexLen: 32 },
  { algorithm: 'SHA-1', bits: 160, hexLen: 40 },
  { algorithm: 'SHA-224', bits: 224, hexLen: 56 },
  { algorithm: 'SHA-256', bits: 256, hexLen: 64 },
  { algorithm: 'SHA-384', bits: 384, hexLen: 96 },
  { algorithm: 'SHA-512', bits: 512, hexLen: 128 },
  { algorithm: 'SHA-512/224', bits: 224, hexLen: 56 },
  { algorithm: 'SHA-512/256', bits: 256, hexLen: 64 },
  { algorithm: 'BLAKE2b-160', bits: 160, hexLen: 40 },
  { algorithm: 'BLAKE2b-256', bits: 256, hexLen: 64 },
  { algorithm: 'BLAKE2b-512', bits: 512, hexLen: 128 },
  { algorithm: 'BLAKE2s-128', bits: 128, hexLen: 32 },
  { algorithm: 'BLAKE2s-160', bits: 160, hexLen: 40 },
  { algorithm: 'BLAKE2s-224', bits: 224, hexLen: 56 },
  { algorithm: 'BLAKE2s-256', bits: 256, hexLen: 64 },
  { algorithm: 'SHA-3-224', bits: 224, hexLen: 56 },
  { algorithm: 'SHA-3-256', bits: 256, hexLen: 64 },
  { algorithm: 'SHA-3-384', bits: 384, hexLen: 96 },
  { algorithm: 'SHA-3-512', bits: 512, hexLen: 128 },
  { algorithm: 'Keccak-224', bits: 224, hexLen: 56 },
  { algorithm: 'Keccak-256', bits: 256, hexLen: 64 },
  { algorithm: 'Keccak-384', bits: 384, hexLen: 96 },
  { algorithm: 'Keccak-512', bits: 512, hexLen: 128 },
  { algorithm: 'RIPEMD-160', bits: 160, hexLen: 40 },
  { algorithm: 'CRC32', bits: 32, hexLen: 8 },
  { algorithm: 'SHA-256 (Unix $5$)', bits: 256, hexLen: 0, prefix: '$5$' },
  { algorithm: 'SHA-512 (Unix $6$)', bits: 512, hexLen: 0, prefix: '$6$' },
  { algorithm: 'bcrypt', bits: 184, hexLen: 0, prefix: '$2' },
  { algorithm: 'scrypt', bits: 256, hexLen: 0, prefix: '$7$' },
];

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) bytes[i/2] = parseInt(cleaned.substring(i, i+2), 16);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function detectHash(input: string): HashInfo | null {
  const cleaned = input.replace(/\s/g, '');
  for (const sig of HASH_SIGNATURES) {
    if (sig.prefix && cleaned.startsWith(sig.prefix)) return { algorithm: sig.algorithm, bits: sig.bits, hexLen: cleaned.length };
  }
  if (/^[0-9a-fA-F]+$/.test(cleaned)) {
    const hexLen = cleaned.length;
    const match = HASH_SIGNATURES.find(h => h.hexLen === hexLen && !h.prefix);
    if (match) return { algorithm: match.algorithm, bits: match.bits, hexLen };
    return hexLen > 0 ? { algorithm: `Unknown (${hexLen*4}-bit hex)`, bits: hexLen*4, hexLen } : null;
  }
  return null;
}

export default function FormatConverterTab() {
  const [input, setInput] = useState('');
  const [conversion, setConversion] = useState('detect');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();
  const detected = useMemo(() => input.trim() ? detectHash(input) : null, [input]);

  const handleConvert = useCallback(() => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    try {
      const cleaned = input.replace(/\s/g, '');
      if (!cleaned) throw new Error('No input');
      if (conversion === 'detect') {
        const info = detectHash(input);
        if (!info) throw new Error('Could not detect hash format');
        const outStr = `Detected: ${info.algorithm}\nBit length: ${info.bits}\nHex length: ${info.hexLen} chars`;
        setResult(outStr);
        setCtxOutput(outStr);
        setOutputSource('calculator');
        addToHistory('calculator-hash', 'Format Converter', outStr, true);
        return;
      }
      if (conversion === 'hex2b64') {
        if (!/^[0-9a-fA-F]+$/.test(cleaned)) throw new Error('Invalid hex');
        const outStr = bytesToBase64(hexToBytes(cleaned));
        setResult(outStr);
        setCtxOutput(outStr);
        setOutputSource('calculator');
        addToHistory('calculator-hash', 'Format Converter', outStr, true);
      } else if (conversion === 'b642hex') {
        try { const bin = atob(cleaned); const bytes = new Uint8Array(bin.length); for (let i=0; i<bin.length; i++) bytes[i]=bin.charCodeAt(i); const outStr = bytesToHex(bytes); setResult(outStr); setCtxOutput(outStr); setOutputSource('calculator'); addToHistory('calculator-hash', 'Format Converter', outStr, true); }
        catch { throw new Error('Invalid Base64'); }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setCtxError(msg);
      setOutputSource('calculator');
    }
  }, [input, conversion, setCtxOutput, setCtxError, setOutputSource, addToHistory]);

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb:2 }}>
        <InputLabel>Conversion</InputLabel>
        <Select value={conversion} label="Conversion" onChange={e => setConversion(e.target.value)}>
          {CONVERSION_TYPES.map(c => (<MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>))}
        </Select>
      </FormControl>
      <TextField fullWidth multiline minRows={3} maxRows={8} label="Input" value={input} onChange={e => setInput(e.target.value)} variant="outlined" sx={{ ...inputSx, mb:2 }} placeholder="Paste hex, Base64, or hash string to detect/convert..." />
      {detected && conversion === 'detect' && (
        <Box sx={{ mb:2, p:1, borderRadius:1, border: `1px solid ${draculaColors.cyan}`, backgroundColor: 'rgba(139,233,253,0.06)' }}>
          <Typography variant="caption" sx={{ color: draculaColors.cyan }}>Live detection: <strong>{detected.algorithm}</strong> ({detected.bits} bits)</Typography>
        </Box>
      )}
      <Button variant="contained" startIcon={<SwapHoriz />} onClick={handleConvert} disabled={!input.trim()} fullWidth
        sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb:2, '&:hover': { backgroundColor: '#a575f6' }, '&:disabled': { backgroundColor: draculaColors.comment } }}>
        Convert / Detect
      </Button>
      {result && (
        <Box>
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>Output:</Typography>
            <Tooltip title="Copy result"><IconButton size="small" onClick={handleCopy} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Box sx={outputBoxSx}><Box sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{result}</Box></Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt:2, fontFamily: "'JetBrains Mono', monospace", fontSize:'0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}
