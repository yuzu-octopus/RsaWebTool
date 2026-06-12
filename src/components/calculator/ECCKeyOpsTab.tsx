import { useState, useCallback, useMemo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Radio, RadioGroup, FormControlLabel, Typography, TextField, Button } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { inputSx } from '../../styles/inputSx';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import { CURVES, KEY_OPS, curveForOp, type KeyOp } from '../../utils/eccCurves';
import { x25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';

export function ECCKeyOpsTab() {
  const [curve, setCurve] = useState('secp256k1');
  const [op, setOp] = useState<KeyOp>('generate');
  const [privHex, setPrivHex] = useState('');
  const [peerPubHex, setPeerPubHex] = useState('');
  const out = useCalculatorOutput({ category: 'calculator-ecc' });

  const isX25519 = curve === 'curve25519';

  const handleRun = useCallback(() => {
    out.clear();
    try {
      if (op === 'generate') {
        if (isX25519) {
          const kp = x25519.keygen();
          const result = `Private key (hex): ${bytesToHex(kp.secretKey)}\nPublic key (hex): ${bytesToHex(kp.publicKey)}`;
          out.dispatch(result, 'ECC Key Ops');
        } else {
          const ci = curveForOp(curve);
          if (!ci) throw new Error('Unknown curve');
          const kp = ci.keygen();
          const pubComp = ci.getPublicKey(kp.secretKey, true);
          const pubUnc = ci.getPublicKey(kp.secretKey, false);
          const result = `Private key (hex): ${bytesToHex(kp.secretKey)}\n\nPublic key (compressed): ${bytesToHex(pubComp)}\nPublic key (uncompressed): ${bytesToHex(pubUnc)}`;
          out.dispatch(result, 'ECC Key Ops');
        }
        return;
      }

      if (op === 'pubkey') {
        if (!privHex.trim()) throw new Error('Private key is required');
        const priv = hexToBytes(privHex.replace(/\s/g, ''));
        if (isX25519) throw new Error('Curve25519 not supported for public-from-private');
        const ci = curveForOp(curve);
        if (!ci) throw new Error('Unknown curve');
        const pubComp = ci.getPublicKey(priv, true);
        const pubUnc = ci.getPublicKey(priv, false);
        const result = `Public key (compressed): ${bytesToHex(pubComp)}\nPublic key (uncompressed): ${bytesToHex(pubUnc)}`;
        out.dispatch(result, 'ECC Key Ops');
        return;
      }

      if (op === 'ecdh') {
        if (!privHex.trim() || !peerPubHex.trim()) throw new Error('Private key and peer public key required');
        const priv = hexToBytes(privHex.replace(/\s/g, ''));
        const peer = hexToBytes(peerPubHex.replace(/\s/g, ''));
        let shared: Uint8Array;
        if (isX25519) {
          shared = x25519.getSharedSecret(priv, peer);
        } else {
          const ci = curveForOp(curve);
          if (!ci) throw new Error('Unknown curve');
          shared = ci.getSharedSecret(priv, peer);
        }
        const result = `Shared secret (hex): ${bytesToHex(shared)}`;
        out.dispatch(result, 'ECC Key Ops');
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [curve, op, privHex, peerPubHex, isX25519, out]);

  const availOps = useMemo(() => {
    if (isX25519) return KEY_OPS.filter(o => o !== 'pubkey');
    return [...KEY_OPS];
  }, [isX25519]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Curve</InputLabel>
        <Select value={curve} label="Curve" onChange={e => { setCurve(e.target.value); out.clear(); }}>
          {CURVES.map(c => (<MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl sx={{ mb: 2 }}>
        <RadioGroup row value={op} onChange={e => setOp(e.target.value as KeyOp)}>
          {availOps.map(o => (
            <FormControlLabel
              key={o}
              value={o}
              control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.green } }} />}
              label={
                <Typography sx={{ color: draculaColors.foreground, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>
                  {o === 'generate' ? 'Generate Keypair' : o === 'pubkey' ? 'Public from Private' : 'ECDH Shared Secret'}
                </Typography>
              }
            />
          ))}
        </RadioGroup>
      </FormControl>
      {(op === 'pubkey' || op === 'ecdh') && (
        <TextField fullWidth label="Private key (hex)" value={privHex} onChange={e => setPrivHex(e.target.value)} variant="outlined"
          sx={{ ...inputSx, mb: 2 }} placeholder="Hex private key" spellCheck={false} />
      )}
      {op === 'ecdh' && (
        <TextField fullWidth label="Peer public key (hex)" value={peerPubHex} onChange={e => setPeerPubHex(e.target.value)} variant="outlined"
          sx={{ ...inputSx, mb: 2 }} placeholder="Hex public key" spellCheck={false} />
      )}
      <Button variant="contained" startIcon={<PlayArrow />} onClick={handleRun} fullWidth sx={primaryBtnSx}>
        Run
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
