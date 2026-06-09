import { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Box, Typography, TextField, Button } from '@mui/material';
import { draculaColors } from '../theme/dracula';
import { modPow, modInverse } from '../utils/bigint';
import { parseBigInt, toHex, toAscii, isPrintableAscii } from '../utils/rsaCalc';
import { inputSx } from '../styles/inputSx';
import { outputBoxSx } from '../styles/shared';

export function RsaDecryptTab() {
  const [form, setForm] = useState({ c: '', n: '', d: '', p: '', q: '', e: '' });
  const [result, setResult] = useState<{ output: string | null; error: string | null }>({
    output: null,
    error: null,
  });
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const handleDecrypt = () => {
    setResult({ output: null, error: null });
    setCtxOutput(null); setCtxError(null);
    const cn = parseBigInt(form.c);
    let nn = parseBigInt(form.n);
    let pn = parseBigInt(form.p);
    let qn = parseBigInt(form.q);
    const en = parseBigInt(form.e);
    const dn = parseBigInt(form.d);

    if (cn === null) {
      setResult({ output: null, error: 'c must be a valid number' });
      setCtxError('c must be a valid number'); setOutputSource('calculator');
      return;
    }

    // Derive missing n, p, or q from the other two (any 2 of p, q, n)
    if (nn === null && pn !== null && qn !== null) {
      nn = pn * qn;
    } else if (qn === null && nn !== null && pn !== null && nn % pn === 0n) {
      qn = nn / pn;
    } else if (pn === null && nn !== null && qn !== null && nn % qn === 0n) {
      pn = nn / qn;
    }

    if (nn === null) {
      setResult({ output: null, error: 'Provide n, or p+q (any 2 of p, q, n)' });
      setCtxError('Provide n, or p+q (any 2 of p, q, n)'); setOutputSource('calculator');
      return;
    }
    if (nn <= 1n) {
      setResult({ output: null, error: 'n must be > 1' });
      setCtxError('n must be > 1'); setOutputSource('calculator');
      return;
    }
    if (cn >= nn) {
      setResult({ output: null, error: 'c must be < n' });
      setCtxError('c must be < n'); setOutputSource('calculator');
      return;
    }

    let m: bigint | null = null;

    if (dn !== null && dn > 0n) {
      m = modPow(cn, dn, nn);
    }

    if (m === null && pn !== null && qn !== null && en !== null && en > 0n) {
      const phi = (pn - 1n) * (qn - 1n);
      const dComputed = modInverse(en, phi);
      if (dComputed !== null) {
        m = modPow(cn, dComputed, nn);
      }
    }

    if (m === null) {
      setResult({ output: null, error: 'Provide d, or at least 2 of (p, q, n) + e' });
      setCtxError('Provide d, or at least 2 of (p, q, n) + e'); setOutputSource('calculator');
      return;
    }

    let outputText = `m = ${m}\n`;
    outputText += `m (hex) = ${toHex(m)}\n`;
    if (isPrintableAscii(m)) {
      outputText += `m (ascii) = ${toAscii(m)}`;
    }
    setResult({ output: outputText, error: null });
    setCtxOutput(outputText); setOutputSource('calculator'); addToHistory('calculator-rsa', 'RSA Decrypt', outputText, true);
  };

  return (
    <>
      <TextField
        fullWidth
        label="c (ciphertext)"
        value={form.c}
        onChange={e => setForm(prev => ({ ...prev, c: e.target.value }))}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <TextField
        fullWidth
        label="n (modulus)"
        value={form.n}
        onChange={e => setForm(prev => ({ ...prev, n: e.target.value }))}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <TextField
        fullWidth
        label="d (private exponent, optional)"
        value={form.d}
        onChange={e => setForm(prev => ({ ...prev, d: e.target.value }))}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="p (optional)"
          value={form.p}
          onChange={e => setForm(prev => ({ ...prev, p: e.target.value }))}
          variant="outlined"
          sx={inputSx}
        />
        <TextField
          fullWidth
          label="q (optional)"
          value={form.q}
          onChange={e => setForm(prev => ({ ...prev, q: e.target.value }))}
          variant="outlined"
          sx={inputSx}
        />
      </Box>
      <TextField
        fullWidth
        label="e (optional)"
        value={form.e}
        onChange={e => setForm(prev => ({ ...prev, e: e.target.value }))}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
      />
      <Button
        fullWidth
        variant="contained"
        onClick={handleDecrypt}
        disabled={!form.c.trim() || (!form.n.trim() && (!form.p.trim() || !form.q.trim()))}
        sx={{
          backgroundColor: draculaColors.purple,
          fontFamily: "'JetBrains Mono', monospace",
          '&:hover': { backgroundColor: '#a575f6' },
          '&:disabled': { backgroundColor: draculaColors.comment },
        }}
      >
        Decrypt
      </Button>
      {result.output && <Box sx={outputBoxSx}>{result.output}</Box>}
      {result.error && (
        <Typography
          sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}
        >
          {result.error}
        </Typography>
      )}
    </>
  );
}
