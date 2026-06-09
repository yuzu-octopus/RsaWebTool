import { useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Radio, RadioGroup,
  FormControlLabel,
} from '@mui/material';
import { Lock, PlayArrow, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { colFlexSx, centeredPanelSx, outputBoxSx } from '../../styles/shared';
import { inputSx } from '../../styles/inputSx';
import { CalculatorSubTabs } from './CalculatorSubTabs';
import { ProofRenderer } from '../ProofRenderer';
import { ecb, cbc, ctr, gcm, cfb } from '@noble/ciphers/aes.js';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

/* ───────── Utilities ───────── */

function decodeInput(text: string, encoding: string): Uint8Array {
  const cleaned = encoding === 'text' ? text : text.replace(/\s/g, '');
  if (encoding === 'hex') return hexToBytes(cleaned);
  if (encoding === 'base64') { const b = atob(cleaned); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  return new TextEncoder().encode(text);
}

function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const len = Math.min(a.length, b.length), out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = a[i] ^ b[i];
  return out;
}

function ofbEncrypt(key: Uint8Array, iv: Uint8Array, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  let fb = new Uint8Array(iv);
  const c = ecb(key, { disablePadding: true });
  for (let i = 0; i < data.length; i += 16) {
    fb = c.encrypt(fb);
    for (let j = 0; j < 16 && i + j < data.length; j++) out[i + j] = data[i + j] ^ fb[j];
  }
  return out;
}

/* ───────── AES-128 Key Schedule ───────── */

const SBOX = [0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];
const RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
const sw = (w: number) => (SBOX[(w>>24)&0xff]<<24)|(SBOX[(w>>16)&0xff]<<16)|(SBOX[(w>>8)&0xff]<<8)|SBOX[w&0xff];
const rw = (w: number) => (w<<8)|(w>>>24);

function expandKey(key: Uint8Array): number[] {
  const nk = key.length / 4, nb = 4, nr = nk + 6;
  const w: number[] = [];
  for (let i = 0; i < nk; i++) w.push((key[4*i]<<24)|(key[4*i+1]<<16)|(key[4*i+2]<<8)|key[4*i+3]);
  for (let i = nk; i < nb * (nr + 1); i++) {
    let t = w[i-1];
    if (i % nk === 0) t = sw(rw(t)) ^ (RCON[Math.floor(i/nk)-1] << 24);
    else if (nk > 6 && i % nk === 4) t = sw(t);
    w.push(w[i - nk] ^ t);
  }
  return w;
}

function fmtRounds(w: number[], nr: number): string[] {
  const rks: string[] = [];
  for (let r = 0; r <= nr; r++) {
    const bytes = new Uint8Array(16);
    for (let j = 0; j < 4; j++) { const v = w[r*4+j]; bytes[4*j]=(v>>24)&0xff; bytes[4*j+1]=(v>>16)&0xff; bytes[4*j+2]=(v>>8)&0xff; bytes[4*j+3]=v&0xff; }
    rks.push(`Round ${r}: ${bytesToHex(bytes)}`);
  }
  return rks;
}

/* ───────── TABS ───────── */

const TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'encrypt-decrypt', label: 'Encrypt / Decrypt' },
  { id: 'attacks', label: 'Attacks' },
];

/* ─── Explanation Tab ─── */

const PROOF = `\\textbf{AES (Rijndael)}: 128-bit block cipher, 10/12/14 rounds for AES-128/192/256.

\\textbf{Per-round:} SubBytes (S-box), ShiftRows (cyclic shift), MixColumns ($GF(2^8)$), AddRoundKey (XOR).

\\textbf{Mode Comparison:}
$\\begin{array}{ll}
\\text{ECB} & \\text{Each block independent — pattern leaks} \\\\
\\text{CBC} & \\text{CT chain + IV — parallel decrypt only} \\\\
\\text{CTR} & \\text{Counter + AES = keystream — parallel, no pad} \\\\
\\text{GCM} & \\text{CTR + GHASH — AEAD, unique nonce} \\\\
\\text{OFB} & \\text{AES(feedback) — precomputable} \\\\
\\text{CFB} & \\text{AES(prev CT) — self-synchronising}
\\end{array}$

\\textbf{PKCS#7}: Fill remaining bytes with N where N = pad count. Verify on decrypt.

\\textbf{GCM}: AES-CTR + GHASH over $GF(2^{128})$. Tag = GHASH(AAD, CT) $\\oplus$ AES(key, nonce||1).

\\textbf{Attacks:} ECB block reordering / byte-at-a-time oracle; CBC bit flip / padding oracle; CTR/GCM nonce reuse $\\rightarrow$ total break; AES-128 key schedule inversion (last round key $\\rightarrow$ original key).`;

function AESExplanationTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>AES Block Cipher Reference</Typography>
      <Box sx={{ maxHeight: '60vh', overflow: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' } }}>
        <ProofRenderer latex={PROOF} />
      </Box>
    </Box>
  );
}

/* ─── Encrypt/Decrypt Tab ─── */

const AES_MODES = ['ECB', 'CBC', 'CTR', 'GCM', 'OFB', 'CFB'];
const ENCODINGS = [
  { value: 'text', label: 'Text' },
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
];

function AESEncryptDecryptTab() {
  const [mode, setMode] = useState('CBC');
  const [keyHex, setKeyHex] = useState('');
  const [ivHex, setIvHex] = useState('');
  const [aadHex, setAadHex] = useState('');
  const [inputText, setInputText] = useState('');
  const [inputEnc, setInputEnc] = useState('text');
  const [op, setOp] = useState('encrypt');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsIv = useMemo(() => ['CBC', 'CTR', 'GCM', 'OFB', 'CFB'].includes(mode), [mode]);
  const needsAad = mode === 'GCM';
  const keyLabel = useMemo(() => {
    const k = keyHex.replace(/\s/g, '');
    const len = k.length / 2;
    if (len === 16) return 'Key (hex) — AES-128';
    if (len === 24) return 'Key (hex) — AES-192';
    if (len === 32) return 'Key (hex) — AES-256';
    return 'Key (hex)';
  }, [keyHex]);

  const handleRun = useCallback(() => {
    setError(null); setResult(null);
    try {
      const key = hexToBytes(keyHex.replace(/\s/g, ''));
      if (![16, 24, 32].includes(key.length)) throw new Error('Key must be 16/24/32 hex bytes');
      const data = decodeInput(inputText, inputEnc);
      if (!data.length) throw new Error('Input is empty');
      let iv = new Uint8Array(0);
      if (needsIv) {
        iv = hexToBytes(ivHex.replace(/\s/g, ''));
        if (mode === 'GCM' && iv.length < 12) throw new Error('GCM nonce ≥ 12 bytes');
        if (!['CTR', 'GCM'].includes(mode) && iv.length !== 16) throw new Error(`${mode} requires 16-byte IV`);
        if (mode === 'CTR' && iv.length !== 16) throw new Error('CTR needs full 16-byte counter');
      }
      const aad = needsAad && aadHex.trim() ? hexToBytes(aadHex.replace(/\s/g, '')) : undefined;
      const enc = op === 'encrypt';
      let out: Uint8Array;
      switch (mode) {
        case 'ECB': { const c = ecb(key); out = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CBC': { const c = cbc(key, iv); out = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CTR': { const c = ctr(key, iv); out = c.encrypt(data); break; }
        case 'GCM': { const c = gcm(key, iv, aad); out = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CFB': { const c = cfb(key, iv); out = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'OFB': { if (iv.length !== 16) throw new Error('OFB needs 16-byte IV'); out = ofbEncrypt(key, iv, data); break; }
        default: throw new Error('Unknown mode');
      }
      setResult(bytesToHex(out));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, [mode, keyHex, ivHex, aadHex, inputText, inputEnc, op, needsIv, needsAad]);

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Mode</InputLabel>
        <Select value={mode} label="Mode" onChange={e => setMode(e.target.value)}>
          {AES_MODES.map(m => (<MenuItem key={m} value={m}>{m}</MenuItem>))}
        </Select>
      </FormControl>
      <TextField fullWidth label={keyLabel} value={keyHex} onChange={e => setKeyHex(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="32/48/64 hex chars" spellCheck={false} />
      {needsIv && (
        <TextField fullWidth label={`${mode === 'GCM' ? 'Nonce' : 'IV'} (hex)`} value={ivHex} onChange={e => setIvHex(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder={mode === 'GCM' ? '12+ byte nonce' : '32 hex chars'} spellCheck={false} />
      )}
      {needsAad && (
        <TextField fullWidth label="AAD (hex, opt)" value={aadHex} onChange={e => setAadHex(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Additional authenticated data" spellCheck={false} />
      )}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
        <FormControl sx={{ ...inputSx, minWidth: 100 }}>
          <InputLabel>Encoding</InputLabel>
          <Select value={inputEnc} label="Encoding" onChange={e => setInputEnc(e.target.value)}>
            {ENCODINGS.map(e => (<MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>))}
          </Select>
        </FormControl>
        <TextField fullWidth multiline minRows={3} maxRows={8} label="Input" value={inputText} onChange={e => setInputText(e.target.value)} variant="outlined" sx={inputSx} placeholder={inputEnc === 'text' ? 'Plaintext...' : `${inputEnc.toUpperCase()} data...`} />
      </Box>
      <FormControl sx={{ mb: 2 }}>
        <RadioGroup row value={op} onChange={e => setOp(e.target.value)}>
          <FormControlLabel value="encrypt" control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.green } }} />} label={<Typography sx={{ color: draculaColors.foreground, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>Encrypt</Typography>} />
          <FormControlLabel value="decrypt" control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.cyan } }} />} label={<Typography sx={{ color: draculaColors.foreground, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>Decrypt</Typography>} />
        </RadioGroup>
      </FormControl>
      <Button variant="contained" startIcon={<PlayArrow />} onClick={handleRun} disabled={!keyHex.trim() || !inputText.trim()} fullWidth
        sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb: 2, '&:hover': { backgroundColor: '#a575f6' }, '&:disabled': { backgroundColor: draculaColors.comment } }}>
        {op === 'encrypt' ? 'Encrypt' : 'Decrypt'}
      </Button>
      {result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>Output ({mode}):</Typography>
            <Tooltip title="Copy"><IconButton size="small" onClick={handleCopy} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Box sx={outputBoxSx}><Box sx={{ fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{result}</Box></Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}

/* ─── Attacks Tab ─── */

const ATTACKS = [
  { value: 'ctr-nonce', label: 'CTR Nonce Reuse' },
  { value: 'cbc-bitflip', label: 'CBC Bit Flipping' },
  { value: 'ecb-detect', label: 'ECB Mode Detector' },
  { value: 'ecb-cutpaste', label: 'ECB Cut-and-Paste' },
  { value: 'ecb-byte', label: 'ECB Byte-at-a-Time (oracle)' },
  { value: 'cbc-padding', label: 'CBC Padding Oracle' },
  { value: 'gcm-nonce', label: 'GCM Nonce Reuse Simplified' },
  { value: 'key-schedule', label: 'AES Key Schedule Inversion' },
];

function AESAttacksTab() {
  const [attack, setAttack] = useState('ctr-nonce');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ct1, setCt1] = useState('');
  const [ct2, setCt2] = useState('');
  const [knownPt, setKnownPt] = useState('');
  const [ivHex, setIvHex] = useState('');
  const [blockIdx, setBlockIdx] = useState('0');
  const [targetText, setTargetText] = useState('');
  const [currentPtHex, setCurrentPtHex] = useState('');
  const [cts, setCts] = useState('');
  const [oracleUrl, setOracleUrl] = useState('');
  const [gcmCt1, setGcmCt1] = useState('');
  const [gcmPt1, setGcmPt1] = useState('');
  const [gcmCt2, setGcmCt2] = useState('');
  const [scheduleKey, setScheduleKey] = useState('');

  const copy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  const run = useCallback(() => {
    setError(null); setResult(null);
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
          setResult(`CTR keystream (${ks.length} bytes): ${bytesToHex(ks)}\n\nDecrypted CT2: ${bytesToHex(pt2)}\n\nAs text: ${txt}`);
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
          for (let j = 0; j < Math.min(tgt.length, curPlain.length, isIV ? iv.length - off : ct.length - off); j++)
            mod[off + j] ^= curPlain[j] ^ tgt[j];
          setResult(`Modified ${isIV ? 'IV' : `CT block ${idx-1}`}:\n${bytesToHex(mod)}\n\nCBC bit flip: mod[offset+j] = original[offset+j] ^ current_plaintext[j] ^ target_byte.`);
          break;
        }
        case 'ecb-detect': {
          const lines = cts.trim().split('\n').filter(l => l.trim());
          const out = lines.map(line => {
            const ct = hexToBytes(line.replace(/\s/g, ''));
            if (ct.length < 32) return `[SKIP] ${line.slice(0, 40)}...`;
            const seen = new Set<string>();
            for (let i = 0; i < ct.length; i += 16) { const h = bytesToHex(ct.subarray(i, i + 16)); if (seen.has(h)) return `[ECB] ${line.slice(0, 40)}...`; seen.add(h); }
            return `[not ECB] ${line.slice(0, 40)}...`;
          });
          setResult(out.join('\n'));
          break;
        }
        case 'ecb-cutpaste': {
          const ct = hexToBytes(ct1.replace(/\s/g, ''));
          if (ct.length < 32 || ct.length % 16) throw new Error('CT must be multiple of 16 bytes');
          const blks = [];
          for (let i = 0; i < ct.length; i += 16) blks.push(`[${i/16}] ${bytesToHex(ct.subarray(i, i+16))}`);
          setResult(`Blocks:\n${blks.join('\n')}\n\nReorder blocks to forge new plaintext under the same key.`);
          break;
        }
        case 'ecb-byte':
          setResult(`ECB Byte-at-a-Time Attack\n\nOracle: ${oracleUrl || '(not set)'}\n\n1. Feed 'A'*1..'A'*32 to find block size (output length jump)\n2. Send 48 'A's → repeating blocks → ECB confirmed\n3. For byte position p: send 'A'*(15-p%16), brute-force last byte\n\nRequires live oracle endpoint. This is the algorithmic reference.`);
          break;
        case 'cbc-padding':
          setResult(`CBC Padding Oracle Attack\n\nOracle: ${oracleUrl || '(not set)'}\n\nFor each pair (C[i-1], C[i]):\n  For byte p = 15..0:\n    For guess g = 0..255:\n      C'[i-1][p] = C[i-1][p] ^ g ^ (16-p)\n      Submit (C'[i-1] || C[i]) → oracle\n      If 'valid padding' → P[i][p] = C[i-1][p] ^ g ^ (16-p)\n\nCS'16 padding oracle: Pr[valid padding] ≈ 1/256 × (257 - #bad padding)`);
          break;
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
          setResult(`Keystream: ${bytesToHex(ks)}\nPT2: ${bytesToHex(pt2)}\nText: ${txt}\n\nGCM nonce reuse: same nonce → identical GHASH key H = AES_K(0). Compute H, forge tags.`);
          break;
        }
        case 'key-schedule': {
          const key = hexToBytes(scheduleKey.replace(/\s/g, ''));
          if (![16, 24, 32].includes(key.length)) throw new Error('Key must be 16/24/32 bytes');
          const nk = key.length / 4, nr = nk + 6;
          const rks = fmtRounds(expandKey(key), nr);
          rks.push(`\n${nr+1} round keys, ${expandKey(key).length} words`);
          if (key.length === 16) rks.push('\nAES-128: last round key → invert key schedule → original key. Side-channel the last round to recover the key.');
          setResult(rks.join('\n'));
          break;
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, [attack, ct1, ct2, knownPt, ivHex, blockIdx, targetText, currentPtHex, cts, oracleUrl, gcmCt1, gcmPt1, gcmCt2, scheduleKey]);

  const attackFields = useMemo(() => {
    switch (attack) {
      case 'ctr-nonce': return (
        <><TextField fullWidth label="Ciphertext 1 (hex)" value={ct1} onChange={e => setCt1(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Hex CT1" spellCheck={false} />
        <TextField fullWidth label="Ciphertext 2 (hex)" value={ct2} onChange={e => setCt2(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Hex CT2" spellCheck={false} />
        <TextField fullWidth label="Known PT (hex)" value={knownPt} onChange={e => setKnownPt(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Known plaintext for CT1" spellCheck={false} /></>
      );
      case 'cbc-bitflip': return (
        <><TextField fullWidth label="Ciphertext (hex)" value={ct1} onChange={e => setCt1(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Hex CT" spellCheck={false} />
        <TextField fullWidth label="IV (hex)" value={ivHex} onChange={e => setIvHex(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Hex IV" spellCheck={false} />
        <TextField fullWidth label="Block index" value={blockIdx} onChange={e => setBlockIdx(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="0" />
        <TextField fullWidth label="Current Plaintext (hex)" value={currentPtHex} onChange={e => setCurrentPtHex(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Current plaintext block in hex" spellCheck={false} />
        <TextField fullWidth label="Target text" value={targetText} onChange={e => setTargetText(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Desired plaintext" /></>
      );
      case 'ecb-detect': return (
        <TextField fullWidth multiline minRows={3} maxRows={8} label="Ciphertexts (one hex/line)" value={cts} onChange={e => setCts(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Hex CT per line" spellCheck={false} />
      );
      case 'ecb-cutpaste': return (
        <TextField fullWidth label="Ciphertext (hex)" value={ct1} onChange={e => setCt1(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Multiples of 16 bytes" spellCheck={false} />
      );
      case 'ecb-byte': return (
        <TextField fullWidth label="Oracle URL" value={oracleUrl} onChange={e => setOracleUrl(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="http://localhost:8000/encrypt?data=" />
      );
      case 'cbc-padding': return (
        <TextField fullWidth label="Oracle URL" value={oracleUrl} onChange={e => setOracleUrl(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="http://localhost:8000/decrypt?ct=" />
      );
      case 'gcm-nonce': return (
        <><TextField fullWidth label="CT1" value={gcmCt1} onChange={e => setGcmCt1(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="CT1 hex" spellCheck={false} />
        <TextField fullWidth label="PT1" value={gcmPt1} onChange={e => setGcmPt1(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="PT1 hex" spellCheck={false} />
        <TextField fullWidth label="CT2" value={gcmCt2} onChange={e => setGcmCt2(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="CT2 hex" spellCheck={false} /></>
      );
      case 'key-schedule': return (
        <TextField fullWidth label="AES Key (hex)" value={scheduleKey} onChange={e => setScheduleKey(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="32/48/64 hex chars" spellCheck={false} />
      );
      default: return null;
    }
  }, [attack, ct1, ct2, knownPt, ivHex, blockIdx, targetText, currentPtHex, cts, oracleUrl, gcmCt1, gcmPt1, gcmCt2, scheduleKey]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Attack</InputLabel>
        <Select value={attack} label="Attack" onChange={e => setAttack(e.target.value)}>
          {ATTACKS.map(a => (<MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>))}
        </Select>
      </FormControl>
      {attackFields}
      <Button variant="contained" startIcon={<PlayArrow />} onClick={run} fullWidth
        sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb: 2, '&:hover': { backgroundColor: '#a575f6' } }}>
        Run Attack
      </Button>
      {result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>Result:</Typography>
            <Tooltip title="Copy"><IconButton size="small" onClick={copy} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Box sx={{ ...outputBoxSx, maxHeight: '300px' }}><Box sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result}</Box></Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}

/* ───────── MAIN ───────── */

export default function AESCalculator() {
  const [tab, setTab] = useState('explanation');
  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock sx={{ fontSize: 'inherit' }} /> AES Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            AES encryption, decryption, mode analysis, and attacks — powered by @noble/ciphers
          </Typography>
          <CalculatorSubTabs tabs={TABS} activeTab={tab} onChange={setTab} />
          <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pt: 1 }}>
            {tab === 'explanation' && <AESExplanationTab />}
            {tab === 'encrypt-decrypt' && <AESEncryptDecryptTab />}
            {tab === 'attacks' && <AESAttacksTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
