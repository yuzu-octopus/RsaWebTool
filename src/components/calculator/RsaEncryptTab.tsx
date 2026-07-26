import { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { modPow } from '../../utils/bigint';
import { parseBigInt, toHex, toAscii, isPrintableAscii } from '../../utils/rsaCalc';
import { inputSx, primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';

export function RsaEncryptTab() {
  const [m, setM] = useState('');
  const [n, setN] = useState('');
  const [e, setE] = useState('');
  const out = useCalculatorOutput({ category: 'calculator-rsa' });

  const handleEncrypt = () => {
    out.clear();
    const mn = parseBigInt(m);
    const nn = parseBigInt(n);
    const en = parseBigInt(e) || 65537n;

    if (mn === null || nn === null) {
      out.dispatchError('m and n must be valid numbers (e defaults to 65537)');
      return;
    }
    if (nn <= 1n) {
      out.dispatchError('n must be > 1');
      return;
    }
    if (en <= 0n) {
      out.dispatchError('e must be positive');
      return;
    }
    if (mn < 0n || mn >= nn) {
      out.dispatchError('m must be >= 0 and < n');
      return;
    }

    const c = modPow(mn, en, nn);
    let outputText = `c = ${c}\n`;
    outputText += `c (hex) = ${toHex(c)}\n`;
    if (isPrintableAscii(c)) {
      outputText += `c (ascii) = ${toAscii(c)}`;
    }
    out.dispatch(outputText, 'RSA Encrypt');
  };

  return (
    <>
      <TextField
        fullWidth
        label="m (message)"
        value={m}
        onChange={e => setM(e.target.value)}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <TextField
        fullWidth
        label="n (modulus)"
        value={n}
        onChange={e => setN(e.target.value)}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <TextField
        fullWidth
        label="e (public exponent)"
        value={e}
        onChange={e => setE(e.target.value)}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <Button
        fullWidth
        variant="contained"
        onClick={handleEncrypt}
        disabled={!m.trim() || !n.trim()}
        sx={primaryBtnSx}
      >
        Encrypt
      </Button>
      {out.result && <ResultBox value={out.result} label="RSA ciphertext" />}
      {out.error && (
        <Typography
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          sx={{ color: draculaColors.red, mt: 2, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}
        >
          {out.error}
        </Typography>
      )}
    </>
  );
}
