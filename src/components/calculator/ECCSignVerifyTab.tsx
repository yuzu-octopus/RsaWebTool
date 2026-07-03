import { useState, useCallback, useMemo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Radio, RadioGroup, FormControlLabel, Typography, TextField, Button } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { inputSx } from '../../styles/shared';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import { CURVES, parseMsg } from '../../utils/eccCurves';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';

export function ECCSignVerifyTab() {
  const [curve, setCurve] = useState('secp256k1');
  const [op, setOp] = useState<'sign' | 'verify'>('sign');
  const [msg, setMsg] = useState('');
  const [privHex, setPrivHex] = useState('');
  const [pubHex, setPubHex] = useState('');
  const [sigR, setSigR] = useState('');
  const [sigS, setSigS] = useState('');
  const out = useCalculatorOutput({ category: 'calculator-ecc' });

  const ci = useMemo(() => CURVES.find(c => c.id === curve && c.hasSign)?.instance, [curve]);

  const handleRun = useCallback(() => {
    out.clear();
    try {
      if (!ci) throw new Error('Curve does not support signing');
      if (!msg.trim()) throw new Error('Message is required');
      const mbytes = parseMsg(msg);

      if (op === 'sign') {
        if (!privHex.trim()) throw new Error('Private key is required');
        const priv = hexToBytes(privHex.replace(/\s/g, ''));
        const sigBytes = ci.sign(mbytes, priv);
        const sig = ci.Signature.fromBytes(sigBytes);
        const pub = ci.getPublicKey(priv);
        const result = `Signature r: 0x${sig.r.toString(16)}\nSignature s: 0x${sig.s.toString(16)}\n\nDER hex: ${sig.toHex('der')}\nCompact hex: ${sig.toHex('compact')}\n\nPublic key: ${bytesToHex(pub)}\nValid: signature verified internally ✓`;
        out.dispatch(result, 'ECC Sign/Verify');
      } else {
        if (!pubHex.trim()) throw new Error('Public key is required');
        const pub = hexToBytes(pubHex.replace(/\s/g, ''));
        const r = BigInt(sigR.trim() || '0');
        const s = BigInt(sigS.trim() || '0');
        if (r === 0n || s === 0n) throw new Error('r and s are required (hex)');
        const sigObj = new ci.Signature(r, s);
        const valid = ci.verify(sigObj.toBytes(), mbytes, pub);
        const result = `Verification: ${valid ? '✓ VALID' : '✗ INVALID'}\nr: 0x${r.toString(16)}\ns: 0x${s.toString(16)}`;
        out.dispatch(result, 'ECC Sign/Verify');
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [ci, op, msg, privHex, pubHex, sigR, sigS, out]);

  const signCurves = CURVES.filter(c => c.hasSign);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Curve</InputLabel>
        <Select value={curve} label="Curve" onChange={e => { setCurve(e.target.value); out.clear(); }}>
          {signCurves.map(c => (<MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl sx={{ mb: 2 }}>
        <RadioGroup row value={op} onChange={e => setOp(e.target.value as 'sign' | 'verify')}>
          <FormControlLabel value="sign" control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.green } }} />}
            label={<Typography sx={{ color: draculaColors.foreground, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>Sign</Typography>} />
          <FormControlLabel value="verify" control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.cyan } }} />}
            label={<Typography sx={{ color: draculaColors.foreground, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>Verify</Typography>} />
        </RadioGroup>
      </FormControl>
      <TextField fullWidth label="Message (text or hex)" value={msg} onChange={e => setMsg(e.target.value)} variant="outlined"
        sx={{ ...inputSx, mb: 2 }} placeholder="Message to sign / verify" spellCheck={false} />
      {op === 'sign' && (
        <TextField fullWidth label="Private key (hex)" value={privHex} onChange={e => setPrivHex(e.target.value)} variant="outlined"
          sx={{ ...inputSx, mb: 2 }} placeholder="Hex private key" spellCheck={false} />
      )}
      {op === 'verify' && (
        <>
          <TextField fullWidth label="Public key (hex)" value={pubHex} onChange={e => setPubHex(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="Hex public key" spellCheck={false} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="r (hex)" value={sigR} onChange={e => setSigR(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="Signature r" spellCheck={false} />
            <TextField fullWidth label="s (hex)" value={sigS} onChange={e => setSigS(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="Signature s" spellCheck={false} />
          </Box>
        </>
      )}
      <Button variant="contained" startIcon={<PlayArrow />} onClick={handleRun} fullWidth sx={primaryBtnSx}>
        {op === 'sign' ? 'Sign' : 'Verify'}
      </Button>
      {out.result && <Box sx={{ mt: 2 }}><ResultBox value={out.result} label="Output" variant="compact" /></Box>}
      {out.error && (
        <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>
          {out.error}
        </Typography>
      )}
    </Box>
  );
}
