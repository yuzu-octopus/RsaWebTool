import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { modPow, modInverse } from '../../utils/bigint';
import { parseBigInt, toHex, toAscii, isPrintableAscii } from '../../utils/rsaCalc';
import { inputSx, primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';

export function RsaDecryptTab() {
  const [form, setForm] = useState({ c: '', n: '', d: '', p: '', q: '', e: '' });
  const out = useCalculatorOutput({ category: 'calculator-rsa' });

  useEffect(() => {
    const handler = (event: Event) => {
      const { n, e } = (event as CustomEvent<{ n?: string; e?: string }>).detail ?? {};
      if (n) setForm(prev => ({ ...prev, n }));
      if (e) setForm(prev => ({ ...prev, e }));
    };
    window.addEventListener('calculator-prefill', handler);
    return () => window.removeEventListener('calculator-prefill', handler);
  }, []);

  const handleDecrypt = () => {
    out.clear();
    const cn = parseBigInt(form.c);
    let nn = parseBigInt(form.n);
    let pn = parseBigInt(form.p);
    let qn = parseBigInt(form.q);
    const en = parseBigInt(form.e);
    const dn = parseBigInt(form.d);

    if (cn === null) {
      out.dispatchError('c must be a valid number');
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
      out.dispatchError('Provide n, or p+q (any 2 of p, q, n)');
      return;
    }
    if (nn <= 1n) {
      out.dispatchError('n must be > 1');
      return;
    }
    if (cn < 0n || cn >= nn) {
      out.dispatchError('c must be >= 0 and < n');
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
      out.dispatchError('Provide d, or at least 2 of (p, q, n) + e');
      return;
    }

    let outputText = `m = ${m}\n`;
    outputText += `m (hex) = ${toHex(m)}\n`;
    if (isPrintableAscii(m)) {
      outputText += `m (ascii) = ${toAscii(m)}`;
    }
    out.dispatch(outputText, 'RSA Decrypt');
  };

  return (
    <>
      <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
        Enter every value as decimal or with a <code>0x</code> hexadecimal prefix.
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.foreground, mb: 1 }}>
          Ciphertext and modulus
        </Typography>
        <TextField
          fullWidth
          label="c (ciphertext)"
          helperText="Ciphertext to decrypt, in decimal or 0x hexadecimal."
          value={form.c}
          onChange={e => setForm(prev => ({ ...prev, c: e.target.value }))}
          variant="outlined"
          sx={{ ...inputSx, mb: 2 }}
        />
        <TextField
          fullWidth
          label="n (modulus)"
          helperText="Required unless both p and q are supplied."
          value={form.n}
          onChange={e => setForm(prev => ({ ...prev, n: e.target.value }))}
          variant="outlined"
          sx={inputSx}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.foreground, mb: 1 }}>
          Private exponent or key factors
        </Typography>
        <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
          Provide d directly, or provide p, q, and e so d can be derived.
        </Typography>
        <TextField
          fullWidth
          label="d (private exponent)"
          helperText="Optional when p, q, and e are provided."
          value={form.d}
          onChange={e => setForm(prev => ({ ...prev, d: e.target.value }))}
          variant="outlined"
          sx={{ ...inputSx, mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="p (prime factor)"
            value={form.p}
            onChange={e => setForm(prev => ({ ...prev, p: e.target.value }))}
            variant="outlined"
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="q (prime factor)"
            value={form.q}
            onChange={e => setForm(prev => ({ ...prev, q: e.target.value }))}
            variant="outlined"
            sx={inputSx}
          />
        </Box>
        <TextField
          fullWidth
          label="e (public exponent)"
          value={form.e}
          onChange={e => setForm(prev => ({ ...prev, e: e.target.value }))}
          variant="outlined"
          sx={inputSx}
        />
      </Box>
      <Button
        fullWidth
        variant="contained"
        onClick={handleDecrypt}
        disabled={!form.c.trim() || (!form.n.trim() && (!form.p.trim() || !form.q.trim()))}
        sx={primaryBtnSx}
      >
        Decrypt
      </Button>
      {out.result && <ResultBox value={out.result} label="Decrypted RSA plaintext" />}
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
