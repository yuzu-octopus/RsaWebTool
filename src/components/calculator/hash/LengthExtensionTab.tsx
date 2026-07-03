import { useState, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Slider,
} from '@mui/material';
import { PlayArrow, ContentCopy, WarningAmber } from '@mui/icons-material';
import { draculaColors } from '../../../theme/dracula';
import { inputSx } from '../../../styles/shared';
import { outputBoxSx, primaryBtnSx, MONO_FAMILY } from '../../../styles/shared';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { sha1, md5 } from '@noble/hashes/legacy.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { useAppContext } from '../../../hooks/useAppContext';

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

  const handleCopyHash = useCallback(() => { if (result?.newHash) navigator.clipboard.writeText(result.newHash).catch(() => {}); }, [result]);
  const handleCopyMsg = useCallback(() => { if (result?.extendedMsg) navigator.clipboard.writeText(result.extendedMsg).catch(() => {}); }, [result]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, borderRadius: 1, border: `1px solid ${draculaColors.orange}`, backgroundColor: 'rgba(255,184,108,0.08)' }}>
        <WarningAmber sx={{ color: draculaColors.orange, fontSize: 20 }} />
        <Typography variant="caption" sx={{ color: draculaColors.orange }}>
          Length extension on Merkle-Damgård hashes (SHA-256, SHA-1, MD5, SHA-512).
          Given H(secret || message), computes H(secret||message||pad||append) without the secret.
        </Typography>
      </Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Algorithm</InputLabel>
        <Select value={algorithm} label="Algorithm" onChange={e => setAlgorithm(e.target.value)}>
          {ALGORITHMS.map(a => (<MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>))}
        </Select>
      </FormControl>
      <TextField fullWidth label="Original Hash (hex)" value={originalHash} onChange={e => setOriginalHash(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Original hash output (e.g., from H(secret || message))" />
      <TextField fullWidth multiline minRows={2} maxRows={6} label="Original Message (known part)" value={originalMessage} onChange={e => setOriginalMessage(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Hex or plaintext — known message after the secret prefix" />
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="body2" sx={{ color: draculaColors.foreground, minWidth: 120 }}>Secret Length:</Typography>
          {secretUnknown ? (
            <Typography variant="body2" sx={{ color: draculaColors.orange }}>Brute-force 1 – {secretRangeEnd} bytes</Typography>
          ) : (
            <Typography variant="body2" sx={{ color: draculaColors.cyan }}>{secretLen} bytes</Typography>
          )}
          <Button size="small" variant="text" onClick={() => setSecretUnknown(!secretUnknown)} sx={{ color: draculaColors.purple, fontFamily: MONO_FAMILY, fontSize: '0.7rem', textTransform: 'none' }}>
            {secretUnknown ? 'Fixed' : 'Unknown'}
          </Button>
        </Box>
        {secretUnknown ? (
          <TextField fullWidth type="number" label="Max secret length (bytes)" value={secretRangeEnd}
            onChange={e => setSecretRangeEnd(Math.max(1, parseInt(e.target.value) || 1))} variant="outlined"
            sx={inputSx} slotProps={{ htmlInput: { min: 1, max: 256 } }} />
        ) : (
          <Box sx={{ px:1 }}>
            <Slider value={secretLen} onChange={(_,v) => setSecretLen(v)} min={1} max={128} step={1}
              sx={{ color: draculaColors.cyan, '& .MuiSlider-thumb': { backgroundColor: draculaColors.cyan }, '& .MuiSlider-track': { backgroundColor: draculaColors.cyan } }} />
          </Box>
        )}
      </Box>
      <TextField fullWidth multiline minRows={2} maxRows={6} label="Append Data" value={appendData} onChange={e => setAppendData(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Data to append (hex or plaintext)" />
      <Button variant="contained" startIcon={<PlayArrow />} onClick={handleRun} disabled={!originalHash.trim()||!originalMessage.trim()||!appendData.trim()} fullWidth
        sx={primaryBtnSx}>
        {secretUnknown ? 'Brute-force & Compute' : 'Compute Extension'}
      </Button>
      {result && (
        <Box>
          <Box sx={{ mb:1.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment, mb:0.5, display:'block' }}>Extended Message (original || glue_padding || append):</Typography>
            <Box sx={{ display:'flex', alignItems:'flex-start', gap:1 }}>
              <Box sx={{ ...outputBoxSx, flex:1, maxHeight:200, fontSize:'0.75rem' }}>{result.extendedMsg}</Box>
              <Tooltip title="Copy extended message"><IconButton size="small" onClick={handleCopyMsg} sx={{ color: draculaColors.cyan, mt:0.5 }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
            </Box>
          </Box>
          <Box>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
              <Typography variant="caption" sx={{ color: draculaColors.green }}>New Hash {secretUnknown ? '(for secret_len=1)' : `(secret_len=${secretLen})`}:</Typography>
              <Tooltip title="Copy new hash"><IconButton size="small" onClick={handleCopyHash} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
            </Box>
            <Box sx={outputBoxSx()}><Box sx={{ fontFamily: MONO_FAMILY, wordBreak:'break-all' }}>{result.newHash}</Box></Box>
          </Box>
          {results.length > 1 && (
            <Box sx={{ mt:2 }}>
              <Typography variant="caption" sx={{ color: draculaColors.comment, mb:0.5, display:'block' }}>All candidates ({results.length} lengths):</Typography>
              <Box sx={{ maxHeight:200, overflow:'auto', backgroundColor: draculaColors.currentLine, borderRadius:1, p:1 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.75rem', fontFamily: MONO_FAMILY }}>
                  <thead><tr><th style={{ color: draculaColors.cyan, textAlign:'left', padding:'2px 8px', borderBottom: `1px solid ${draculaColors.comment}` }}>Len</th><th style={{ color: draculaColors.cyan, textAlign:'left', padding:'2px 8px', borderBottom: `1px solid ${draculaColors.comment}` }}>Hash</th></tr></thead>
                  <tbody>{results.map(r => (<tr key={r.secretLen}><td style={{ color: draculaColors.foreground, padding:'2px 8px' }}>{r.secretLen}</td><td style={{ color: draculaColors.foreground, padding:'2px 8px', wordBreak:'break-all' }}>{r.hash}</td></tr>))}</tbody>
                </table>
              </Box>
            </Box>
          )}
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt:2, fontFamily: MONO_FAMILY, fontSize:'0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}
