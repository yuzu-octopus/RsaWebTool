import { useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Tooltip, IconButton,
} from '@mui/material';
import { Security, PlayArrow, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { colFlexSx, centeredPanelSx, outputBoxSx } from '../../styles/shared';
import { inputSx } from '../../styles/inputSx';
import { CalculatorSubTabs } from './CalculatorSubTabs';
import { useAppContext } from '../../hooks/useAppContext';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../../hooks/useSageMath';
import { modPow, modInverse } from '../../utils/bigint';

/* ───────── RFC 3526 MODP Groups ───────── */

interface RFCGroupEntry {
  name: string;
  p: bigint;
  g: bigint;
}

const RFC3526_GROUPS: RFCGroupEntry[] = [
  {
    name: 'Group 5 (1536-bit)',
    p: 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFFFFn,
    g: 2n,
  },
  {
    name: 'Group 14 (2048-bit)',
    p: 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFFn,
    g: 2n,
  },
  {
    name: 'Group 16 (4096-bit)',
    p: 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFFn,
    g: 2n,
  },
];

/* ───────── TABS ───────── */

const TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'keyexchange', label: 'Key Exchange' },
  { id: 'attacks', label: 'Attacks' },
];

/* ─── DLP / Number Theory Helpers ─── */

/** Trial division factorisation returning small prime factors (up to limit). */
function factorSmall(n: bigint, limit: number): bigint[] {
  const factors: bigint[] = [];
  let m = n;
  for (let p = 2; p <= limit && m > 1n; p++) {
    const bp = BigInt(p);
    if (m % bp === 0n) {
      factors.push(bp);
      while (m % bp === 0n) m /= bp;
    }
    // Skip evens after 2
    if (p === 2) p = 1;
  }
  return factors;
}

/** Factor n by trial division, returning { prime, exponent } array. */
function factorPowers(n: bigint, limit: number): { prime: bigint; exp: number }[] {
  const result: { prime: bigint; exp: number }[] = [];
  let m = n;
  for (let p = 2; p <= limit && m > 1n; p++) {
    const bp = BigInt(p);
    if (m % bp === 0n) {
      let exp = 0;
      while (m % bp === 0n) {
        m /= bp;
        exp++;
      }
      result.push({ prime: bp, exp });
    }
    if (p === 2) p = 1;
  }
  if (m > 1n) result.push({ prime: m, exp: 1 });
  return result;
}

/** Baby-step Giant-step for prime order subgroup r. */
function bsgsSubgroup(g: bigint, y: bigint, p: bigint, r: bigint): bigint | null {
  const sqrtR = BigInt(Math.ceil(Math.sqrt(Number(r))));
  const baby: Map<string, bigint> = new Map();
  let cur = 1n;
  for (let j = 0n; j < sqrtR; j++) {
    if (!baby.has(cur.toString())) baby.set(cur.toString(), j);
    cur = (cur * g) % p;
  }
  const factor = modPow(g, (r - 1n - sqrtR + r) % r, p);
  if (factor === null) return null;
  let gamma = y;
  for (let i = 0n; i < sqrtR; i++) {
    const key = gamma.toString();
    if (baby.has(key)) {
      const x = i * sqrtR + baby.get(key)!;
      if (x < r) return x;
    }
    gamma = (gamma * factor) % p;
  }
  return null;
}

/** Chinese Remainder Theorem: find x ≡ a_i (mod m_i) for pairwise coprime m_i. */
function crt(remainders: bigint[], moduli: bigint[]): bigint | null {
  if (remainders.length === 0 || remainders.length !== moduli.length) return null;
  let M = 1n;
  for (const m of moduli) M *= m;
  let x = 0n;
  for (let i = 0; i < remainders.length; i++) {
    const Mi = M / moduli[i];
    const inv = modInverse(Mi % moduli[i], moduli[i]);
    if (inv === null) return null;
    x = (x + remainders[i] * Mi * inv) % M;
  }
  return x;
}

/** Generate random 256-bit private key. */
function generatePrivateKey(): bigint {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  let key = 0n;
  for (const b of buf) key = (key << 8n) + BigInt(b);
  return key;
}

/** Parse hex string (with or without 0x prefix), strip whitespace. */
function parseHex(s: string): bigint {
  const clean = s.trim().replace(/\s/g, '');
  if (!clean) return 0n;
  return BigInt(clean.startsWith('0x') ? clean : '0x' + clean);
}

/* ─── Explanation Tab ─── */

function DHExplanationTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>Diffie-Hellman Key Exchange</Typography>
      <Box sx={{
        maxHeight: '60vh', overflow: 'auto', pr: 1, pb: '20vh',
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
      }}>
        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>Protocol</Typography>
        <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
          Diffie-Hellman (DH) key exchange allows two parties to establish a shared secret over an insecure channel.
          Security relies on the Computational Diffie-Hellman (CDH) assumption and the Discrete Logarithm Problem (DLP).
        </Typography>

        <Box sx={{
          backgroundColor: draculaColors.currentLine,
          p: 2, borderRadius: 1, mb: 2,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem',
          lineHeight: 1.8,
          color: draculaColors.foreground,
          whiteSpace: 'pre',
          overflow: 'auto',
        }}>
{`Alice                              Bob
  |                                  |
  |--- agree on (p, g) ------------>|
  |                                  |
  a = random secret                 b = random secret
  A = g^a mod p                     B = g^b mod p
  |--- A -------------------------->|
  |<----------- B -------------------|
  |                                  |
  s = B^a mod p                     s = A^b mod p
  s = g^(ab) mod p                  s = g^(ab) mod p`}
        </Box>

        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>Security</Typography>
        <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
          The security of DH depends on the difficulty of computing discrete logarithms in the group Z<sub>p</sub>*.
          Standardized MODP groups (RFC 3526) use safe primes p = 2q + 1 to prevent Pohlig-Hellman attacks.
        </Typography>

        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>RFC 3526 MODP Groups</Typography>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
          <Box component="thead">
            <Box component="tr" sx={{ borderBottom: `1px solid ${draculaColors.comment}` }}>
              <Box component="th" sx={{ textAlign: 'left', p: 1, color: draculaColors.cyan }}>Group</Box>
              <Box component="th" sx={{ textAlign: 'left', p: 1, color: draculaColors.cyan }}>Bits</Box>
              <Box component="th" sx={{ textAlign: 'left', p: 1, color: draculaColors.cyan }}>Strength</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {[
              { id: '5', bits: '1536', strength: '~90-bit' },
              { id: '14', bits: '2048', strength: '~112-bit' },
              { id: '16', bits: '4096', strength: '~150-bit' },
            ].map(row => (
              <Box key={row.id} component="tr" sx={{ borderBottom: `1px solid ${draculaColors.currentLine}` }}>
                <Box component="td" sx={{ p: 1, color: draculaColors.green }}>{row.id}</Box>
                <Box component="td" sx={{ p: 1, color: draculaColors.foreground }}>{row.bits}</Box>
                <Box component="td" sx={{ p: 1, color: draculaColors.foreground }}>{row.strength}</Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>Limitations</Typography>
        <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
          Raw DH provides no authentication and is vulnerable to man-in-the-middle (MITM) attacks.
          In practice, DH is combined with digital signatures (e.g., IKE, TLS) or used in
          authenticated protocols like Station-to-Station.
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Key Exchange Tab ─── */

function DHKeyExchangeTab() {
  const [group, setGroup] = useState('group5');
  const [customP, setCustomP] = useState('');
  const [customG, setCustomG] = useState('2');
  const [alicePriv, setAlicePriv] = useState<bigint | null>(null);
  const [alicePub, setAlicePub] = useState<bigint | null>(null);
  const [bobPriv, setBobPriv] = useState<bigint | null>(null);
  const [bobPub, setBobPub] = useState<bigint | null>(null);
  const [sharedAlice, setSharedAlice] = useState<bigint | null>(null);
  const [sharedBob, setSharedBob] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputSource, addToHistory } = useAppContext();

  const currentGroup = useMemo(() => {
    if (group === 'custom') return null;
    const idx = group === 'group5' ? 0 : group === 'group14' ? 1 : 2;
    return RFC3526_GROUPS[idx];
  }, [group]);

  const p = useMemo(() => currentGroup?.p ?? (parseHex(customP) || 0n), [currentGroup, customP]);
  const g = useMemo(() => currentGroup?.g ?? (parseHex(customG) || 0n), [currentGroup, customG]);

  const genAlice = useCallback(() => {
    setError(null);
    setSharedAlice(null);
    setSharedBob(null);
    if (p <= 1n || g <= 1n) { setError('Invalid group parameters'); return; }
    const a = generatePrivateKey();
    const A = modPow(g, a, p);
    setAlicePriv(a);
    setAlicePub(A);
  }, [p, g]);

  const genBob = useCallback(() => {
    setError(null);
    setSharedAlice(null);
    setSharedBob(null);
    if (p <= 1n || g <= 1n) { setError('Invalid group parameters'); return; }
    const b = generatePrivateKey();
    const B = modPow(g, b, p);
    setBobPriv(b);
    setBobPub(B);
  }, [p, g]);

  const computeAlice = useCallback(() => {
    setError(null);
    if (alicePriv === null || bobPub === null) { setError('Alice private key or Bob public key missing'); return; }
    if (p <= 1n) { setError('Invalid group parameters'); return; }
    const s = modPow(bobPub, alicePriv, p);
    setSharedAlice(s);
    const display = `Shared secret (Alice): 0x${s.toString(16)}\nMETHOD=TYPESCRIPT`;
    setCtxOutput(display); setOutputSource('calculator');
    addToHistory('calculator-dh', 'DH Key Exchange', display, true);
  }, [alicePriv, bobPub, p, setCtxOutput, setOutputSource, addToHistory]);

  const computeBob = useCallback(() => {
    setError(null);
    if (bobPriv === null || alicePub === null) { setError('Bob private key or Alice public key missing'); return; }
    if (p <= 1n) { setError('Invalid group parameters'); return; }
    const s = modPow(alicePub, bobPriv, p);
    setSharedBob(s);
    const display = `Shared secret (Bob): 0x${s.toString(16)}\nMETHOD=TYPESCRIPT`;
    setCtxOutput(display); setOutputSource('calculator');
    addToHistory('calculator-dh', 'DH Key Exchange', display, true);
  }, [bobPriv, alicePub, p, setCtxOutput, setOutputSource, addToHistory]);

  const copy = useCallback((val: string) => { navigator.clipboard.writeText(val).catch(() => {}); }, []);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>DH Group</InputLabel>
        <Select value={group} label="DH Group" onChange={e => { setGroup(e.target.value); setError(null); }}>
          <MenuItem value="group5">RFC 3526 Group 5 (1536-bit)</MenuItem>
          <MenuItem value="group14">RFC 3526 Group 14 (2048-bit)</MenuItem>
          <MenuItem value="group16">RFC 3526 Group 16 (4096-bit)</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>

      {group === 'custom' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField fullWidth label="p (hex)" value={customP} onChange={e => setCustomP(e.target.value)}
            variant="outlined" sx={{ ...inputSx }} placeholder="Prime modulus" spellCheck={false} />
          <TextField fullWidth label="g (decimal)" value={customG} onChange={e => setCustomG(e.target.value)}
            variant="outlined" sx={{ ...inputSx }} placeholder="Generator" spellCheck={false} />
        </Box>
      )}

      {/* Alice panel */}
      <Box sx={{
        border: `1px solid ${draculaColors.comment}`, borderRadius: 1, p: 2, mb: 2,
        backgroundColor: draculaColors.background,
      }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mb: 1 }}>Alice</Typography>
        <Button variant="contained" startIcon={<PlayArrow />} onClick={genAlice} fullWidth
          sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb: 1,
            '&:hover': { backgroundColor: '#a575f6' } }}>
          Generate
        </Button>
        {alicePriv !== null && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment }}>
              Private: <Box component="span" sx={{ color: draculaColors.foreground, wordBreak: 'break-all' }}>
                0x{alicePriv.toString(16)}
              </Box>
              <IconButton size="small" onClick={() => copy(`0x${alicePriv.toString(16)}`)} sx={{ color: draculaColors.cyan, ml: 0.5 }}><ContentCopy fontSize="inherit" /></IconButton>
            </Typography>
          </Box>
        )}
        {alicePub !== null && (
          <Box>
            <Typography variant="caption" sx={{ color: draculaColors.comment }}>
              Public: <Box component="span" sx={{ color: draculaColors.green, wordBreak: 'break-all' }}>
                0x{alicePub.toString(16)}
              </Box>
              <IconButton size="small" onClick={() => copy(`0x${alicePub.toString(16)}`)} sx={{ color: draculaColors.cyan, ml: 0.5 }}><ContentCopy fontSize="inherit" /></IconButton>
            </Typography>
          </Box>
        )}
      </Box>

      {/* Bob panel */}
      <Box sx={{
        border: `1px solid ${draculaColors.comment}`, borderRadius: 1, p: 2, mb: 2,
        backgroundColor: draculaColors.background,
      }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mb: 1 }}>Bob</Typography>
        <Button variant="contained" startIcon={<PlayArrow />} onClick={genBob} fullWidth
          sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb: 1,
            '&:hover': { backgroundColor: '#a575f6' } }}>
          Generate
        </Button>
        {bobPriv !== null && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment }}>
              Private: <Box component="span" sx={{ color: draculaColors.foreground, wordBreak: 'break-all' }}>
                0x{bobPriv.toString(16)}
              </Box>
              <IconButton size="small" onClick={() => copy(`0x${bobPriv.toString(16)}`)} sx={{ color: draculaColors.cyan, ml: 0.5 }}><ContentCopy fontSize="inherit" /></IconButton>
            </Typography>
          </Box>
        )}
        {bobPub !== null && (
          <Box>
            <Typography variant="caption" sx={{ color: draculaColors.comment }}>
              Public: <Box component="span" sx={{ color: draculaColors.green, wordBreak: 'break-all' }}>
                0x{bobPub.toString(16)}
              </Box>
              <IconButton size="small" onClick={() => copy(`0x${bobPub.toString(16)}`)} sx={{ color: draculaColors.cyan, ml: 0.5 }}><ContentCopy fontSize="inherit" /></IconButton>
            </Typography>
          </Box>
        )}
      </Box>

      {/* Shared Secret panel */}
      <Box sx={{
        border: `1px solid ${draculaColors.comment}`, borderRadius: 1, p: 2, mb: 2,
        backgroundColor: draculaColors.background,
      }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mb: 1 }}>Shared Secret</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="contained" onClick={computeAlice} fullWidth
            sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem',
              '&:hover': { backgroundColor: '#a575f6' } }}>
            Alice computes
          </Button>
          <Button variant="contained" onClick={computeBob} fullWidth
            sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem',
              '&:hover': { backgroundColor: '#a575f6' } }}>
            Bob computes
          </Button>
        </Box>
        {sharedAlice !== null && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment }}>
              Alice shared: <Box component="span" sx={{ color: draculaColors.green, wordBreak: 'break-all' }}>
                0x{sharedAlice.toString(16)}
              </Box>
              <IconButton size="small" onClick={() => copy(`0x${sharedAlice.toString(16)}`)} sx={{ color: draculaColors.cyan, ml: 0.5 }}><ContentCopy fontSize="inherit" /></IconButton>
            </Typography>
          </Box>
        )}
        {sharedBob !== null && (
          <Box>
            <Typography variant="caption" sx={{ color: draculaColors.comment }}>
              Bob shared: <Box component="span" sx={{ color: draculaColors.green, wordBreak: 'break-all' }}>
                0x{sharedBob.toString(16)}
              </Box>
              <IconButton size="small" onClick={() => copy(`0x${sharedBob.toString(16)}`)} sx={{ color: draculaColors.cyan, ml: 0.5 }}><ContentCopy fontSize="inherit" /></IconButton>
            </Typography>
          </Box>
        )}
        {sharedAlice !== null && sharedBob !== null && (
          <Typography variant="caption" sx={{ color: sharedAlice === sharedBob ? draculaColors.green : draculaColors.red, mt: 1, display: 'block' }}>
            {sharedAlice === sharedBob ? '✓ Shared secrets match!' : '✗ Shared secrets differ!'}
          </Typography>
        )}
      </Box>

      {error && <Typography sx={{ color: draculaColors.red, mt: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{error}</Typography>}
    </Box>
  );
}

/* ─── Attacks Tab ─── */

const DH_ATTACKS = [
  { value: 'small-subgroup', label: 'Small Subgroup Confinement' },
  { value: 'pohlig-hellman', label: 'Pohlig-Hellman DLP' },
  { value: 'general-dlp', label: 'General Discrete Log — SageCell' },
];

function DHAttacksTab() {
  const [attack, setAttack] = useState('small-subgroup');
  const [pVal, setPVal] = useState('');
  const [gVal, setGVal] = useState('');
  const [yVal, setYVal] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();
  const { execute } = useSageMath();

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  const run = useCallback(async () => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    try {
      const p = parseHex(pVal);
      const g = parseHex(gVal);
      const y = parseHex(yVal);
      if (p <= 1n) throw new Error('Invalid prime p');
      if (g <= 0n || g >= p) throw new Error('Generator g must be in (1, p-1)');
      if (y <= 0n || y >= p) throw new Error('Public key y must be in (1, p-1)');

      switch (attack) {
        case 'small-subgroup': {
          const lines: string[] = [];
          const pMinus1 = p - 1n;
          lines.push(`p-1 = ${pMinus1.toString()}`);
          lines.push('');

          const factors = factorSmall(pMinus1, 100_000);
          lines.push(`Small factors of p-1 (trial division up to 10^5):`);
          if (factors.length === 0) {
            lines.push('  No small factors found (p-1 has no smooth component < 10^5)');
          } else {
            lines.push(`  Found: [${factors.join(', ')}]`);
          }
          lines.push('');

          const remainders: bigint[] = [];
          const moduli: bigint[] = [];
          for (const r of factors) {
            const gPrime = modPow(g, pMinus1 / r, p);
            const yPrime = modPow(y, pMinus1 / r, p);
            if (gPrime === 1n) {
              lines.push(`  Subgroup order r=${r}: g' = 1, skipping`);
              continue;
            }
            const x = bsgsSubgroup(gPrime, yPrime, p, r);
            if (x !== null) {
              lines.push(`  Subgroup order r=${r}: log = ${x}`);
              remainders.push(x);
              moduli.push(r);
            } else {
              lines.push(`  Subgroup order r=${r}: DLP failed (x >= r?)`);
            }
          }
          lines.push('');

          if (remainders.length > 0) {
            const xReconstructed = crt(remainders, moduli);
            if (xReconstructed !== null) {
              lines.push(`CRT-reconstructed private key: ${xReconstructed}`);
              const verify = modPow(g, xReconstructed, p);
              lines.push(`Verification: g^x mod p = ${verify}`);
              lines.push(`Target y: ${y}`);
              lines.push(`Match: ${verify === y ? '✓' : '✗ (key may need more factors)'}`);
              const display = lines.join('\n') + '\nMETHOD=TYPESCRIPT';
              setResult(display); setCtxOutput(display); setOutputSource('calculator');
              addToHistory('calculator-dh', 'DH Attack: small-subgroup', display, true);
            } else {
              throw new Error('CRT reconstruction failed');
            }
          } else {
            const display = lines.join('\n') + '\nMETHOD=TYPESCRIPT';
            setResult(display); setCtxOutput(display); setOutputSource('calculator');
            addToHistory('calculator-dh', 'DH Attack: small-subgroup', display, true);
          }
          break;
        }
        case 'pohlig-hellman': {
          const lines: string[] = [];
          const pMinus1 = p - 1n;
          lines.push(`p-1 = ${pMinus1.toString()}`);
          lines.push('');

          const primePowers = factorPowers(pMinus1, 100_000);
          lines.push('Factorisation of p-1 (trial division up to 10^5):');
          for (const { prime: pr, exp: e } of primePowers) {
            lines.push(`  ${pr.toString()}^${e}`);
          }
          lines.push('');

          const remainders: bigint[] = [];
          const moduli: bigint[] = [];
          for (const { prime: pr, exp: e } of primePowers) {
            const q = pr ** BigInt(e);
            const gQ = modPow(g, pMinus1 / q, p);
            const yQ = modPow(y, pMinus1 / q, p);
            if (gQ === 1n) {
              lines.push(`  Prime power ${pr}^${e}: g' = 1, skipping`);
              continue;
            }
            // Precompute powers for BSGS in subgroup of order q
            const x = bsgsSubgroup(gQ, yQ, p, q);
            if (x !== null) {
              lines.push(`  Prime power ${pr}^${e}: x ≡ ${x} (mod ${q})`);
              remainders.push(x);
              moduli.push(q);
            } else {
              lines.push(`  Prime power ${pr}^${e}: DLP failed`);
            }
          }
          lines.push('');

          if (remainders.length > 0) {
            const xReconstructed = crt(remainders, moduli);
            if (xReconstructed !== null) {
              lines.push(`CRT-reconstructed private key: ${xReconstructed}`);
              const verify = modPow(g, xReconstructed, p);
              lines.push(`Verification: g^x mod p = ${verify}`);
              lines.push(`Target y: ${y}`);
              lines.push(`Match: ${verify === y ? '✓' : '✗ (key may need more factors)'}`);
              const display = lines.join('\n') + '\nMETHOD=TYPESCRIPT';
              setResult(display); setCtxOutput(display); setOutputSource('calculator');
              addToHistory('calculator-dh', 'DH Attack: pohlig-hellman', display, true);
            } else {
              throw new Error('CRT reconstruction failed');
            }
          } else {
            const display = lines.join('\n') + '\nMETHOD=TYPESCRIPT';
            setResult(display); setCtxOutput(display); setOutputSource('calculator');
            addToHistory('calculator-dh', 'DH Attack: pohlig-hellman', display, true);
          }
          break;
        }
        case 'general-dlp': {
          const pClean = pVal.trim().replace(/\s/g, '');
          const pHex = pClean.startsWith('0x') ? pClean : '0x' + pClean;
          const gDec = gVal.trim().replace(/\s/g, '');
          const yClean = yVal.trim().replace(/\s/g, '');
          const yHex = yClean.startsWith('0x') ? yClean : '0x' + yClean;

          const code = `p = Integer(${pHex})
g = Mod(${gDec}, p)
y = Mod(${yHex}, p)
out = []
out.append(f"p = {p}")
out.append(f"g = {g}")
out.append(f"y = {y}")
out.append("")
try:
    x = discrete_log(y, g, operation='pow')
    out.append(f"Private key x = {x}")
    verify = power_mod(Integer(${gDec}), x, p)
    out.append(f"Verification: g^x mod p = {verify}")
    out.append(f"Match: {verify == Integer(${yHex})}")
    print('\\\\n'.join(out)); print('TOKEN=SUCCESS')
except Exception as e:
    out.append(f"discrete_log failed: {e}")
    print('\\\\n'.join(out)); print('TOKEN=FAILED')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) {
            const display = sageResult.stdout + '\nMETHOD=SAGEMATHCELL';
            setResult(display); setCtxOutput(display); setOutputSource('calculator');
            addToHistory('calculator-dh', 'DH Attack: general-dlp', display, true);
          } else {
            const errMsg = sageResult.error || 'SageCell execution failed';
            setError(errMsg); setCtxError(errMsg); setOutputSource('calculator');
          }
          break;
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg); setCtxError(msg); setOutputSource('calculator');
    }
  }, [attack, pVal, gVal, yVal, execute, addToHistory, setCtxError, setCtxOutput, setOutputSource]);

  const attackFields = useMemo(() => {
    switch (attack) {
      case 'general-dlp': return null;
      default: return null;
    }
  }, [attack]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Attack</InputLabel>
        <Select value={attack} label="Attack" onChange={e => setAttack(e.target.value)}>
          {DH_ATTACKS.map(a => (<MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>))}
        </Select>
      </FormControl>

      <TextField fullWidth label="p (prime, hex)" value={pVal} onChange={e => setPVal(e.target.value)}
        variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Prime modulus" spellCheck={false} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField fullWidth label="g (decimal)" value={gVal} onChange={e => setGVal(e.target.value)}
          variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Generator" spellCheck={false} />
        <TextField fullWidth label="y (Alice public, hex)" value={yVal} onChange={e => setYVal(e.target.value)}
          variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="y = g^a mod p" spellCheck={false} />
      </Box>

      {attackFields}

      <Button variant="contained" startIcon={<PlayArrow />} onClick={() => { void run(); }} fullWidth
        sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb: 2,
          '&:hover': { backgroundColor: '#a575f6' } }}>
        Run Attack
      </Button>

      {result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>Result:</Typography>
            <Tooltip title="Copy"><IconButton size="small" onClick={handleCopy} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Box sx={{ ...outputBoxSx, maxHeight: '300px' }}>
            <Box sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result}</Box>
          </Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}

/* ───────── MAIN ───────── */

export default function DHCalculator() {
  const [tab, setTab] = useState('explanation');
  const { setOutputResult, setOutputError, setOutputSource } = useAppContext();

  const handleTabChange = useCallback((tabId: string) => {
    setTab(tabId);
    setOutputResult(null);
    setOutputError(null);
    setOutputSource(null);
  }, [setOutputResult, setOutputError, setOutputSource]);

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security sx={{ fontSize: 'inherit' }} /> DH Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            Diffie-Hellman key exchange simulation and discrete log attacks
          </Typography>
          <CalculatorSubTabs tabs={TABS} activeTab={tab} onChange={handleTabChange} />
          <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pt: 1 }}>
            {tab === 'explanation' && <DHExplanationTab />}
            {tab === 'keyexchange' && <DHKeyExchangeTab />}
            {tab === 'attacks' && <DHAttacksTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
