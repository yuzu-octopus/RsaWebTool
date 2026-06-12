import { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { modInverse } from '../../utils/bigint';
import { parseBigInt } from '../../utils/rsaCalc';
import { inputSx } from '../../styles/inputSx';
import { outputBoxSx, primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';

export function RsaKeyGenTab() {
  const [p, setP] = useState('');
  const [q, setQ] = useState('');
  const [e, setE] = useState('65537');
  const out = useCalculatorOutput({ category: 'calculator-rsa' });

  const handleKeyGen = () => {
    out.clear();
    const pn = parseBigInt(p);
    const qn = parseBigInt(q);
    const en = parseBigInt(e) || 65537n;

    if (pn === null || qn === null) {
      out.dispatchError('p and q must be valid numbers');
      return;
    }
    if (pn <= 1n || qn <= 1n) {
      out.dispatchError('p and q must be > 1');
      return;
    }
    if (en <= 0n) {
      out.dispatchError('e must be positive');
      return;
    }

    const n = pn * qn;
    const phi = (pn - 1n) * (qn - 1n);
    const d = modInverse(en, phi);

    let outputText = `n  = ${n}\n`;
    outputText += `phi = ${phi}\n`;
    outputText += d !== null ? `d  = ${d}` : 'd  = undefined (e and phi not coprime)';
    out.dispatch(outputText, 'RSA Key Gen');
  };

  return (
    <>
      <TextField
        fullWidth
        label="p (prime)"
        value={p}
        onChange={e => setP(e.target.value)}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <TextField
        fullWidth
        label="q (prime)"
        value={q}
        onChange={e => setQ(e.target.value)}
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
        onClick={handleKeyGen}
        disabled={!p.trim() || !q.trim()}
        sx={primaryBtnSx}
      >
        Compute
      </Button>
      {out.result && <Box sx={outputBoxSx}>{out.result}</Box>}
      {out.error && (
        <Typography
          sx={{ color: draculaColors.red, mt: 2, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}
        >
          {out.error}
        </Typography>
      )}
    </>
  );
}
