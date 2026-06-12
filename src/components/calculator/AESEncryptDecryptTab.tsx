import { useState, useCallback, useMemo } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Radio, RadioGroup, FormControlLabel, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { inputSx } from '../../styles/inputSx';
import { primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import { decodeInput } from '../../utils/aesCrypto';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';
import { ecb, cbc, ctr, gcm, cfb } from '@noble/ciphers/aes.js';
import { ofbEncrypt } from '../../utils/aesCrypto';
import { AES_MODES, ENCODINGS } from '../../data/attackExplanations/aes';

export function AESEncryptDecryptTab() {
  const [mode, setMode] = useState<string>('CBC');
  const [keyHex, setKeyHex] = useState('');
  const [ivHex, setIvHex] = useState('');
  const [aadHex, setAadHex] = useState('');
  const [inputText, setInputText] = useState('');
  const [inputEnc, setInputEnc] = useState<string>('text');
  const [op, setOp] = useState<string>('encrypt');
  const out = useCalculatorOutput({ category: 'calculator-aes' });

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
    out.clear();
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
      let resultBytes: Uint8Array;
      switch (mode) {
        case 'ECB': { const c = ecb(key); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CBC': { const c = cbc(key, iv); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CTR': { const c = ctr(key, iv); resultBytes = c.encrypt(data); break; }
        case 'GCM': { const c = gcm(key, iv, aad); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CFB': { const c = cfb(key, iv); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'OFB': { if (iv.length !== 16) throw new Error('OFB needs 16-byte IV'); resultBytes = ofbEncrypt(key, iv, data); break; }
        default: throw new Error('Unknown mode');
      }
      const resultText = bytesToHex(resultBytes);
      out.dispatch(resultText, `AES ${op === 'encrypt' ? 'Encrypt' : 'Decrypt'} (${mode})`);
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [mode, keyHex, ivHex, aadHex, inputText, inputEnc, op, needsIv, needsAad, out]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Mode</InputLabel>
        <Select value={mode} label="Mode" onChange={e => setMode(e.target.value)}>
          {AES_MODES.map(m => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label={keyLabel}
        value={keyHex}
        onChange={e => setKeyHex(e.target.value)}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
        placeholder="32/48/64 hex chars"
        spellCheck={false}
      />
      {needsIv && (
        <TextField
          fullWidth
          label={`${mode === 'GCM' ? 'Nonce' : 'IV'} (hex)`}
          value={ivHex}
          onChange={e => setIvHex(e.target.value)}
          variant="outlined"
          sx={{ ...inputSx, mb: 2 }}
          placeholder={mode === 'GCM' ? '12+ byte nonce' : '32 hex chars'}
          spellCheck={false}
        />
      )}
      {needsAad && (
        <TextField
          fullWidth
          label="AAD (hex, opt)"
          value={aadHex}
          onChange={e => setAadHex(e.target.value)}
          variant="outlined"
          sx={{ ...inputSx, mb: 2 }}
          placeholder="Additional authenticated data"
          spellCheck={false}
        />
      )}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
        <FormControl sx={{ ...inputSx, minWidth: 100 }}>
          <InputLabel>Encoding</InputLabel>
          <Select value={inputEnc} label="Encoding" onChange={e => setInputEnc(e.target.value)}>
            {ENCODINGS.map(e => (
              <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          label="Input"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          variant="outlined"
          sx={inputSx}
          placeholder={inputEnc === 'text' ? 'Plaintext...' : `${inputEnc.toUpperCase()} data...`}
        />
      </Box>
      <FormControl sx={{ mb: 2 }}>
        <RadioGroup row value={op} onChange={e => setOp(e.target.value)}>
          <FormControlLabel
            value="encrypt"
            control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.green } }} />}
            label={<Typography sx={{ color: draculaColors.foreground, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>Encrypt</Typography>}
          />
          <FormControlLabel
            value="decrypt"
            control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.cyan } }} />}
            label={<Typography sx={{ color: draculaColors.foreground, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>Decrypt</Typography>}
          />
        </RadioGroup>
      </FormControl>
      <Button
        variant="contained"
        startIcon={<PlayArrow />}
        onClick={handleRun}
        disabled={!keyHex.trim() || !inputText.trim()}
        fullWidth
        sx={primaryBtnSx}
      >
        {op === 'encrypt' ? 'Encrypt' : 'Decrypt'}
      </Button>
      {out.result && <Box sx={{ mt: 2 }}><ResultBox value={out.result} label={`Output (${mode})`} variant="default" /></Box>}
      {out.error && (
        <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>
          {out.error}
        </Typography>
      )}
    </Box>
  );
}
