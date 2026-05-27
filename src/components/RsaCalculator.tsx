import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { Calculate } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { modPow, modInverse } from '../utils/bigint';
import { detectFormat } from '../utils/converters';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, outputBoxSx, tabSx } from '../styles/shared';



function parseBigInt(input: string): bigint | null {
  const trimmed = input.replace(/\s/g, '');
  if (!trimmed) return null;
  try {
    const fmt = detectFormat(trimmed);
    if (fmt === 'hex') return BigInt('0x' + trimmed.replace(/^0x/, ''));
    if (fmt === 'base64') {
      const raw = atob(trimmed);
      const hex = Array.from(raw).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return BigInt('0x' + hex);
    }
    if (fmt === 'ascii') {
      const hex = Array.from(trimmed).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return BigInt('0x' + hex);
    }
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

function toHex(n: bigint): string {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  return '0x' + hex;
}

function toAscii(n: bigint): string {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    result += code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
  }
  return result;
}

function isPrintableAscii(n: bigint): boolean {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code < 32 || code > 126) return false;
  }
  return true;
}

export function RsaCalculator() {
  const { viewMode } = useAppContext();
  const [tab, setTab] = useState(0);

  // Input states for each tab
  // Key Gen inputs
  const [kgP, setKgP] = useState('');
  const [kgQ, setKgQ] = useState('');
  const [kgE, setKgE] = useState('65537');
  // Encrypt inputs
  const [encM, setEncM] = useState('');
  const [encN, setEncN] = useState('');
  const [encE, setEncE] = useState('');
  // Decrypt inputs
  const [decC, setDecC] = useState('');
  const [decN, setDecN] = useState('');
  const [decD, setDecD] = useState('');
  const [decP, setDecP] = useState('');
  const [decQ, setDecQ] = useState('');
  const [decE, setDecE] = useState('');

  // Unified result state for all three tabs
  const [calcResult, setCalcResult] = useState<{ output: string | null; error: string | null }>({ output: null, error: null });

  if (viewMode !== 'calculator') return null;

  const handleTabChange = (_e: React.SyntheticEvent, v: number) => {
    setTab(v);
    setCalcResult({ output: null, error: null });
  };

  const handleKeyGen = () => {
    setCalcResult({ output: null, error: null });
    const p = parseBigInt(kgP);
    const q = parseBigInt(kgQ);
    const e = parseBigInt(kgE) || 65537n;

    if (p === null || q === null) {
      setCalcResult({ output: null, error: 'p and q must be valid numbers' });
      return;
    }
    if (p <= 1n || q <= 1n) {
      setCalcResult({ output: null, error: 'p and q must be > 1' });
      return;
    }
    if (e <= 0n) {
      setCalcResult({ output: null, error: 'e must be positive' });
      return;
    }

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    const d = modInverse(e, phi);

    let outputText = `n  = ${n}\n`;
    outputText += `phi = ${phi}\n`;
    outputText += d !== null ? `d  = ${d}` : `d  = undefined (e and phi not coprime)`;
    setCalcResult({ output: outputText, error: null });
  };

  const handleEncrypt = () => {
    setCalcResult({ output: null, error: null });
    const m = parseBigInt(encM);
    const n = parseBigInt(encN);
    const e = parseBigInt(encE) || 65537n;

    if (m === null || n === null) {
      setCalcResult({ output: null, error: 'm and n must be valid numbers (e defaults to 65537)' });
      return;
    }
    if (n <= 1n) {
      setCalcResult({ output: null, error: 'n must be > 1' });
      return;
    }
    if (e <= 0n) {
      setCalcResult({ output: null, error: 'e must be positive' });
      return;
    }
    if (m >= n) {
      setCalcResult({ output: null, error: 'm must be < n' });
      return;
    }

    const c = modPow(m, e, n);
    let outputText = `c = ${c}\n`;
    outputText += `c (hex) = ${toHex(c)}\n`;
    if (isPrintableAscii(c)) {
      outputText += `c (ascii) = ${toAscii(c)}`;
    }
    setCalcResult({ output: outputText, error: null });
  };

  const handleDecrypt = () => {
    setCalcResult({ output: null, error: null });
    const c = parseBigInt(decC);
    let n = parseBigInt(decN);
    let p = parseBigInt(decP);
    let q = parseBigInt(decQ);
    const e = parseBigInt(decE);
    const d = parseBigInt(decD);

    if (c === null) {
      setCalcResult({ output: null, error: 'c must be a valid number' });
      return;
    }

    // Derive missing n, p, or q from the other two (any 2 of p, q, n)
    if (n === null && p !== null && q !== null) {
      n = p * q;
    } else if (q === null && n !== null && p !== null && n % p === 0n) {
      q = n / p;
    } else if (p === null && n !== null && q !== null && n % q === 0n) {
      p = n / q;
    }

    if (n === null) {
      setCalcResult({ output: null, error: 'Provide n, or p+q (any 2 of p, q, n)' });
      return;
    }
    if (n <= 1n) {
      setCalcResult({ output: null, error: 'n must be > 1' });
      return;
    }
    if (c >= n) {
      setCalcResult({ output: null, error: 'c must be < n' });
      return;
    }

    let m: bigint | null = null;

    if (d !== null && d > 0n) {
      m = modPow(c, d, n);
    }

    if (m === null && p !== null && q !== null && e !== null && e > 0n) {
      const phi = (p - 1n) * (q - 1n);
      const dComputed = modInverse(e, phi);
      if (dComputed !== null) {
        m = modPow(c, dComputed, n);
      }
    }

    if (m === null) {
      setCalcResult({ output: null, error: 'Provide d, or at least 2 of (p, q, n) + e' });
      return;
    }

    let outputText = `m = ${m}\n`;
    outputText += `m (hex) = ${toHex(m)}\n`;
    if (isPrintableAscii(m)) {
      outputText += `m (ascii) = ${toAscii(m)}`;
    }
    setCalcResult({ output: outputText, error: null });
  };

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calculate sx={{ fontSize: 'inherit' }} /> RSA Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            Pure BigInt computation — no SageCell needed
          </Typography>

          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{
              mb: 2,
              borderBottom: `1px solid ${draculaColors.comment}`,
              '& .MuiTabs-indicator': { backgroundColor: draculaColors.purple },
            }}
          >
            <Tab label="Key Gen" sx={tabSx} />
            <Tab label="Encrypt" sx={tabSx} />
            <Tab label="Decrypt" sx={tabSx} />
          </Tabs>

          {/* Key Gen Tab */}
          {tab === 0 && (
            <>
              <TextField fullWidth label="p (prime)" value={kgP} onChange={e => setKgP(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <TextField fullWidth label="q (prime)" value={kgQ} onChange={e => setKgQ(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <TextField fullWidth label="e (public exponent)" value={kgE} onChange={e => setKgE(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <Button
                fullWidth
                variant="contained"
                onClick={handleKeyGen}
                disabled={!kgP.trim() || !kgQ.trim()}
                sx={{
                  backgroundColor: draculaColors.purple,
                  fontFamily: "'JetBrains Mono', monospace",
                  '&:hover': { backgroundColor: '#a575f6' },
                  '&:disabled': { backgroundColor: draculaColors.comment },
                }}
              >
                Compute
              </Button>
              {calcResult.output && <Box sx={outputBoxSx}>{calcResult.output}</Box>}
              {calcResult.error && <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{calcResult.error}</Typography>}
            </>
          )}

          {/* Encrypt Tab */}
          {tab === 1 && (
            <>
              <TextField fullWidth label="m (message)" value={encM} onChange={e => setEncM(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <TextField fullWidth label="n (modulus)" value={encN} onChange={e => setEncN(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <TextField fullWidth label="e (public exponent)" value={encE} onChange={e => setEncE(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <Button
                fullWidth
                variant="contained"
                onClick={handleEncrypt}
                disabled={!encM.trim() || !encN.trim()}
                sx={{
                  backgroundColor: draculaColors.purple,
                  fontFamily: "'JetBrains Mono', monospace",
                  '&:hover': { backgroundColor: '#a575f6' },
                  '&:disabled': { backgroundColor: draculaColors.comment },
                }}
              >
                Encrypt
              </Button>
              {calcResult.output && <Box sx={outputBoxSx}>{calcResult.output}</Box>}
              {calcResult.error && <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{calcResult.error}</Typography>}
            </>
          )}

          {/* Decrypt Tab */}
          {tab === 2 && (
            <>
              <TextField fullWidth label="c (ciphertext)" value={decC} onChange={e => setDecC(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <TextField fullWidth label="n (modulus)" value={decN} onChange={e => setDecN(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <TextField fullWidth label="d (private exponent, optional)" value={decD} onChange={e => setDecD(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField fullWidth label="p (optional)" value={decP} onChange={e => setDecP(e.target.value)} variant="outlined" sx={inputSx} />
                <TextField fullWidth label="q (optional)" value={decQ} onChange={e => setDecQ(e.target.value)} variant="outlined" sx={inputSx} />
              </Box>
              <TextField fullWidth label="e (optional)" value={decE} onChange={e => setDecE(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <Button
                fullWidth
                variant="contained"
                onClick={handleDecrypt}
                disabled={!decC.trim() || (!decN.trim() && (!decP.trim() || !decQ.trim()))}
                sx={{
                  backgroundColor: draculaColors.purple,
                  fontFamily: "'JetBrains Mono', monospace",
                  '&:hover': { backgroundColor: '#a575f6' },
                  '&:disabled': { backgroundColor: draculaColors.comment },
                }}
              >
                Decrypt
              </Button>
              {calcResult.output && <Box sx={outputBoxSx}>{calcResult.output}</Box>}
              {calcResult.error && <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{calcResult.error}</Typography>}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
