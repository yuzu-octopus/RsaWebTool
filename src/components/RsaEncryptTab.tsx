import { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Box, Typography, TextField, Button } from '@mui/material';
import { draculaColors } from '../theme/dracula';
import { modPow } from '../utils/bigint';
import { parseBigInt, toHex, toAscii, isPrintableAscii } from '../utils/rsaCalc';
import { inputSx } from '../styles/inputSx';
import { outputBoxSx } from '../styles/shared';

export function RsaEncryptTab() {
  const [m, setM] = useState('');
  const [n, setN] = useState('');
  const [e, setE] = useState('');
  const [result, setResult] = useState<{ output: string | null; error: string | null }>({
    output: null,
    error: null,
  });
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const handleEncrypt = () => {
    setResult({ output: null, error: null });
    setCtxOutput(null); setCtxError(null);
    const mn = parseBigInt(m);
    const nn = parseBigInt(n);
    const en = parseBigInt(e) || 65537n;

    if (mn === null || nn === null) {
      setResult({ output: null, error: 'm and n must be valid numbers (e defaults to 65537)' });
      setCtxError('m and n must be valid numbers (e defaults to 65537)'); setOutputSource('calculator');
      return;
    }
    if (nn <= 1n) {
      setResult({ output: null, error: 'n must be > 1' });
      setCtxError('n must be > 1'); setOutputSource('calculator');
      return;
    }
    if (en <= 0n) {
      setResult({ output: null, error: 'e must be positive' });
      setCtxError('e must be positive'); setOutputSource('calculator');
      return;
    }
    if (mn >= nn) {
      setResult({ output: null, error: 'm must be < n' });
      setCtxError('m must be < n'); setOutputSource('calculator');
      return;
    }

    const c = modPow(mn, en, nn);
    let outputText = `c = ${c}\n`;
    outputText += `c (hex) = ${toHex(c)}\n`;
    if (isPrintableAscii(c)) {
      outputText += `c (ascii) = ${toAscii(c)}`;
    }
    setResult({ output: outputText, error: null });
    setCtxOutput(outputText); setOutputSource('calculator'); addToHistory('calculator-rsa', 'RSA Encrypt', outputText, true);
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
        sx={{
          backgroundColor: draculaColors.purple,
          fontFamily: "'JetBrains Mono', monospace",
          '&:hover': { backgroundColor: '#a575f6' },
          '&:disabled': { backgroundColor: draculaColors.comment },
        }}
      >
        Encrypt
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
