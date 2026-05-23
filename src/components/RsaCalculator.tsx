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

const outputBoxSx = {
  mt: 2,
  p: 1,
  borderRadius: 1,
  backgroundColor: draculaColors.currentLine,
  border: `1px solid ${draculaColors.purple}`,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  color: draculaColors.foreground,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: '150px',
  overflow: 'auto',
};

const tabSx = {
  color: draculaColors.comment,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.85rem',
  minHeight: 40,
  '&.Mui-selected': {
    color: draculaColors.foreground,
  },
};

function parseBigInt(input: string): bigint | null {
  const trimmed = input.trim();
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

  // Key Gen state
  const [kgP, setKgP] = useState('');
  const [kgQ, setKgQ] = useState('');
  const [kgE, setKgE] = useState('65537');
  const [kgOutput, setKgOutput] = useState<string | null>(null);
  const [kgError, setKgError] = useState<string | null>(null);

  // Encrypt state
  const [encM, setEncM] = useState('');
  const [encN, setEncN] = useState('');
  const [encE, setEncE] = useState('');
  const [encOutput, setEncOutput] = useState<string | null>(null);
  const [encError, setEncError] = useState<string | null>(null);

  // Decrypt state
  const [decC, setDecC] = useState('');
  const [decN, setDecN] = useState('');
  const [decD, setDecD] = useState('');
  const [decP, setDecP] = useState('');
  const [decQ, setDecQ] = useState('');
  const [decE, setDecE] = useState('');
  const [decOutput, setDecOutput] = useState<string | null>(null);
  const [decError, setDecError] = useState<string | null>(null);

  if (viewMode !== 'calculator') return null;

  const handleTabChange = (_e: React.SyntheticEvent, v: number) => {
    setTab(v);
    setKgOutput(null);
    setKgError(null);
    setEncOutput(null);
    setEncError(null);
    setDecOutput(null);
    setDecError(null);
  };

  const handleKeyGen = () => {
    setKgOutput(null);
    setKgError(null);
    const p = parseBigInt(kgP);
    const q = parseBigInt(kgQ);
    const e = parseBigInt(kgE);

    if (p === null || q === null) {
      setKgError('p and q must be valid numbers');
      return;
    }
    if (p <= 1n || q <= 1n) {
      setKgError('p and q must be > 1');
      return;
    }
    if (e === null) {
      setKgError('e must be a valid number');
      return;
    }
    if (e <= 0n) {
      setKgError('e must be positive');
      return;
    }

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    const d = modInverse(e, phi);

    let result = `n  = ${n}\n`;
    result += `phi = ${phi}\n`;
    result += d !== null ? `d  = ${d}` : `d  = undefined (e and phi not coprime)`;
    setKgOutput(result);
  };

  const handleEncrypt = () => {
    setEncOutput(null);
    setEncError(null);
    const m = parseBigInt(encM);
    const n = parseBigInt(encN);
    const e = parseBigInt(encE);

    if (m === null || n === null || e === null) {
      setEncError('m, n, and e must be valid numbers');
      return;
    }
    if (n <= 1n) {
      setEncError('n must be > 1');
      return;
    }
    if (e <= 0n) {
      setEncError('e must be positive');
      return;
    }
    if (m >= n) {
      setEncError('m must be < n');
      return;
    }

    const c = modPow(m, e, n);
    let result = `c = ${c}\n`;
    result += `c (hex) = ${toHex(c)}\n`;
    if (isPrintableAscii(c)) {
      result += `c (ascii) = ${toAscii(c)}`;
    }
    setEncOutput(result);
  };

  const handleDecrypt = () => {
    setDecOutput(null);
    setDecError(null);
    const c = parseBigInt(decC);
    const n = parseBigInt(decN);

    if (c === null || n === null) {
      setDecError('c and n must be valid numbers');
      return;
    }
    if (n <= 1n) {
      setDecError('n must be > 1');
      return;
    }
    if (c >= n) {
      setDecError('c must be < n');
      return;
    }

    let m: bigint | null = null;
    const dProvided = decD.trim() !== '';
    const pProvided = decP.trim() !== '';
    const qProvided = decQ.trim() !== '';
    const eProvided = decE.trim() !== '';

    if (dProvided) {
      const d = parseBigInt(decD);
      if (d !== null && d > 0n) {
        m = modPow(c, d, n);
      }
    }

    if (m === null && pProvided && qProvided && eProvided) {
      const p = parseBigInt(decP);
      const q = parseBigInt(decQ);
      const e = parseBigInt(decE);
      if (p !== null && q !== null && e !== null && p > 1n && q > 1n && e > 0n) {
        const phi = (p - 1n) * (q - 1n);
        const dComputed = modInverse(e, phi);
        if (dComputed !== null) {
          m = modPow(c, dComputed, n);
        }
      }
    }

    if (m === null) {
      setDecError('Provide d, or p+q+e');
      return;
    }

    let result = `m = ${m}\n`;
    result += `m (hex) = ${toHex(m)}\n`;
    if (isPrintableAscii(m)) {
      result += `m (ascii) = ${toAscii(m)}`;
    }
    setDecOutput(result);
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h2" sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
              {kgOutput && <Box sx={outputBoxSx}>{kgOutput}</Box>}
              {kgError && <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{kgError}</Typography>}
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
                disabled={!encM.trim() || !encN.trim() || !encE.trim()}
                sx={{
                  backgroundColor: draculaColors.purple,
                  fontFamily: "'JetBrains Mono', monospace",
                  '&:hover': { backgroundColor: '#a575f6' },
                  '&:disabled': { backgroundColor: draculaColors.comment },
                }}
              >
                Encrypt
              </Button>
              {encOutput && <Box sx={outputBoxSx}>{encOutput}</Box>}
              {encError && <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{encError}</Typography>}
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
              <TextField fullWidth label="e (optional, needed with p+q)" value={decE} onChange={e => setDecE(e.target.value)} variant="outlined" sx={{ ...inputSx, mb: 2 }} />
              <Button
                fullWidth
                variant="contained"
                onClick={handleDecrypt}
                disabled={!decC.trim() || !decN.trim()}
                sx={{
                  backgroundColor: draculaColors.purple,
                  fontFamily: "'JetBrains Mono', monospace",
                  '&:hover': { backgroundColor: '#a575f6' },
                  '&:disabled': { backgroundColor: draculaColors.comment },
                }}
              >
                Decrypt
              </Button>
              {decOutput && <Box sx={outputBoxSx}>{decOutput}</Box>}
              {decError && <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{decError}</Typography>}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
