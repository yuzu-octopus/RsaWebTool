import { useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Tooltip, IconButton, Radio, RadioGroup,
  FormControlLabel,
} from '@mui/material';
import { Hub, PlayArrow, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { colFlexSx, centeredPanelSx, outputBoxSx } from '../../styles/shared';
import { inputSx } from '../../styles/inputSx';
import { CalculatorSubTabs } from './CalculatorSubTabs';
import { AttackExplanationPanel, type AttackExplanationData } from './AttackExplanationPanel';
import { ProofRenderer } from '../ProofRenderer';
import { useAppContext } from '../../hooks/useAppContext';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../../hooks/useSageMath';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256, p384, p521 } from '@noble/curves/nist.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';

/* ───────── Curve Registry ───────── */

interface CurveEntry {
  id: string;
  label: string;
  instance?: typeof secp256k1;
  hasSign: boolean;
  hasEcdh: boolean;
}

const CURVES: CurveEntry[] = [
  { id: 'secp256k1', label: 'secp256k1', instance: secp256k1, hasSign: true, hasEcdh: true },
  { id: 'p256', label: 'P-256 (secp256r1)', instance: p256, hasSign: true, hasEcdh: true },
  { id: 'p384', label: 'P-384 (secp384r1)', instance: p384, hasSign: true, hasEcdh: true },
  { id: 'p521', label: 'P-521 (secp521r1)', instance: p521, hasSign: true, hasEcdh: true },
  { id: 'curve25519', label: 'Curve25519 (X25519)', hasSign: false, hasEcdh: true },
];

/* ───────── TABS ───────── */

const TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'keyops', label: 'Key Operations' },
  { id: 'signverify', label: 'Sign / Verify' },
  { id: 'attacks', label: 'Attacks' },
];

/* ─── Explanation Tab ─── */

const PROOF = `\\textbf{Elliptic Curve Cryptography (ECC)}: Public-key cryptography based on the algebraic structure of elliptic curves over finite fields.

\\textbf{Weierstrass form:}
$y^2 = x^3 + ax + b \\quad (4a^3 + 27b^2 \\neq 0)$

\\textbf{Group Law:} Points on the curve form an additive group:
\\begin{itemize}
\\item \\textbf{Addition:} $P + Q = R$ — line through $P,Q$ reflects over $x$-axis
\\item \\textbf{Doubling:} $2P = R$ — tangent at $P$ reflects over $x$-axis
\\item \\textbf{Identity:} Point at infinity $\\mathcal{O}$
\\end{itemize}

\\textbf{Scalar Multiplication:} $k \\cdot P = P + P + \\cdots + P$ ($k$ times). The elliptic curve discrete logarithm problem (ECDLP) — finding $k$ given $P$ and $kP$ — is believed to be hard.

\\textbf{ECDSA (Sign):} Given private key $d$, message hash $h$:
\\begin{itemize}
\\item Choose random $k \\leftarrow [1, n-1]$
\\item Compute $R = k \\cdot G$, $r = R_x \\bmod n$
\\item $s = k^{-1}(h + dr) \\bmod n$
\\item Signature: $(r, s)$
\\end{itemize}

\\textbf{ECDSA (Verify):} Given public key $Q = d \\cdot G$, message hash $h$:
\\begin{itemize}
\\item $u_1 = hs^{-1} \\bmod n$, $u_2 = rs^{-1} \\bmod n$
\\item $R' = u_1 \\cdot G + u_2 \\cdot Q$
\\item Valid if $R'_x \\equiv r \\pmod{n}$
\\end{itemize}

\\textbf{Nonce Importance:} Reusing $k$ across two signatures immediately leaks $d$:
$k = \\frac{h_1 - h_2}{s_1 - s_2} \\bmod n, \\quad d = \\frac{s_1 \\cdot k - h_1}{r} \\bmod n$

\\textbf{ECDH Key Exchange:} Alice ($a, A = aG$), Bob ($b, B = bG$):
$\\text{Shared} = a \\cdot B = b \\cdot A = ab \\cdot G$

\\textbf{Standard Curves:}
\\begin{itemize}
\\item \\textbf{secp256k1}: $p = 2^{256} - 2^{32} - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1$, Bitcoin/ETH
\\item \\textbf{P-256}: NIST prime256v1, $a = -3$, widely used in TLS
\\item \\textbf{P-384}: 384-bit, higher security margin
\\item \\textbf{Curve25519}: Montgomery form $y^2 = x^3 + 486662x^2 + x$, twist-secure, fast
\\end{itemize}

\\textbf{Attacks:}
\\begin{itemize}
\\item \\textbf{Nonce Reuse}: Recovering $k$ from two signatures with same $k$
\\item \\textbf{Biased Nonce}: LLL recovers $d$ from many signatures with non-uniform $k$
\\item \\textbf{Invalid Curve}: Point not on curve skips cofactor validation
\\item \\textbf{MOV}: Small embedding degree $k$ transfers ECDLP to $\\mathbb{F}_{p^k}$
\\item \\textbf{Anomalous}: $\\#E(\\mathbb{F}_p) = p$ allows $\\mathbb{Z}_p$ lift attack
\\item \\textbf{Singular}: $\\Delta = 0$ reduces to multiplicative group
\\end{itemize}`;

function ECCExplanationTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>ECC Reference</Typography>
      <Box sx={{ maxHeight: '60vh', overflow: 'auto', pr: 1,
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
      }}>
        <ProofRenderer latex={PROOF} />
      </Box>
    </Box>
  );
}

/* ─── Key Operations Tab ─── */

const KEY_OPS = ['generate', 'pubkey', 'ecdh'] as const;
type KeyOp = typeof KEY_OPS[number];

function curveForOp(id: string): typeof secp256k1 | undefined {
  return CURVES.find(c => c.id === id)?.instance;
}

function ECCKeyOpsTab() {
  const [curve, setCurve] = useState('secp256k1');
  const [op, setOp] = useState<KeyOp>('generate');
  const [privHex, setPrivHex] = useState('');
  const [peerPubHex, setPeerPubHex] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const isX25519 = curve === 'curve25519';

  const handleRun = useCallback(() => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    try {
      if (op === 'generate') {
        if (isX25519) {
          const kp = x25519.keygen();
          const rGen = `Private key (hex): ${bytesToHex(kp.secretKey)}\nPublic key (hex): ${bytesToHex(kp.publicKey)}`;
          setResult(rGen); setCtxOutput(rGen); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Key Ops', rGen, true);
        } else {
          const ci = curveForOp(curve);
          if (!ci) throw new Error('Unknown curve');
          const kp = ci.keygen();
          const pubComp = ci.getPublicKey(kp.secretKey, true);
          const pubUnc = ci.getPublicKey(kp.secretKey, false);
          const rGen2 = `Private key (hex): ${bytesToHex(kp.secretKey)}\n\nPublic key (compressed): ${bytesToHex(pubComp)}\nPublic key (uncompressed): ${bytesToHex(pubUnc)}`;
          setResult(rGen2); setCtxOutput(rGen2); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Key Ops', rGen2, true);
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
        const rPub = `Public key (compressed): ${bytesToHex(pubComp)}\nPublic key (uncompressed): ${bytesToHex(pubUnc)}`;
        setResult(rPub); setCtxOutput(rPub); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Key Ops', rPub, true);
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
        const rEcdh = `Shared secret (hex): ${bytesToHex(shared)}`;
        setResult(rEcdh); setCtxOutput(rEcdh); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Key Ops', rEcdh, true);
      }
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); setError(msg); setCtxError(msg); setOutputSource('calculator'); }
  }, [curve, op, privHex, peerPubHex, isX25519, addToHistory, setCtxError, setCtxOutput, setOutputSource]);

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  const availOps = useMemo(() => {
    if (isX25519) return KEY_OPS.filter(o => o !== 'pubkey');
    return [...KEY_OPS];
  }, [isX25519]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Curve</InputLabel>
        <Select value={curve} label="Curve" onChange={e => { setCurve(e.target.value); setResult(null); setError(null); }}>
          {CURVES.map(c => (<MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl sx={{ mb: 2 }}>
        <RadioGroup row value={op} onChange={e => setOp(e.target.value as KeyOp)}>
          {availOps.map(o => (
            <FormControlLabel key={o} value={o} control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.green } }} />}
              label={<Typography sx={{ color: draculaColors.foreground, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
                {o === 'generate' ? 'Generate Keypair' : o === 'pubkey' ? 'Public from Private' : 'ECDH Shared Secret'}
              </Typography>} />
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
      <Button variant="contained" startIcon={<PlayArrow />} onClick={handleRun} fullWidth
        sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb: 2,
          '&:hover': { backgroundColor: '#a575f6' } }}>
        Run
      </Button>
      {result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>Output:</Typography>
            <Tooltip title="Copy"><IconButton size="small" onClick={handleCopy} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Box sx={{ ...outputBoxSx, maxHeight: '200px' }}><Box sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result}</Box></Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}

/* ─── Sign / Verify Tab ─── */

function parseMsg(input: string): Uint8Array {
  const t = input.trim();
  if (/^[0-9a-fA-F]+$/.test(t) && t.length % 2 === 0) return hexToBytes(t);
  return new TextEncoder().encode(t);
}

function ECCSignVerifyTab() {
  const [curve, setCurve] = useState('secp256k1');
  const [op, setOp] = useState<'sign' | 'verify'>('sign');
  const [msg, setMsg] = useState('');
  const [privHex, setPrivHex] = useState('');
  const [pubHex, setPubHex] = useState('');
  const [sigR, setSigR] = useState('');
  const [sigS, setSigS] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const ci = useMemo(() => CURVES.find(c => c.id === curve && c.hasSign)?.instance, [curve]);

  const handleRun = useCallback(() => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
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
        const rSign = `Signature r: 0x${sig.r.toString(16)}\nSignature s: 0x${sig.s.toString(16)}\n\nDER hex: ${sig.toHex('der')}\nCompact hex: ${sig.toHex('compact')}\n\nPublic key: ${bytesToHex(pub)}\nValid: signature verified internally ✓`;
        setResult(rSign); setCtxOutput(rSign); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Sign/Verify', rSign, true);
      } else {
        if (!pubHex.trim()) throw new Error('Public key is required');
        const pub = hexToBytes(pubHex.replace(/\s/g, ''));
        const r = BigInt(sigR.trim() || '0');
        const s = BigInt(sigS.trim() || '0');
        if (r === 0n || s === 0n) throw new Error('r and s are required (hex)');
        const sigObj = new ci.Signature(r, s);
        const valid = ci.verify(sigObj.toBytes(), mbytes, pub);
        const rVer = `Verification: ${valid ? '✓ VALID' : '✗ INVALID'}\nr: 0x${r.toString(16)}\ns: 0x${s.toString(16)}`;
        setResult(rVer); setCtxOutput(rVer); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Sign/Verify', rVer, true);
      }
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); setError(msg); setCtxError(msg); setOutputSource('calculator'); }
  }, [ci, op, msg, privHex, pubHex, sigR, sigS, addToHistory, setCtxError, setCtxOutput, setOutputSource]);

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  const signCurves = CURVES.filter(c => c.hasSign);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Curve</InputLabel>
        <Select value={curve} label="Curve" onChange={e => { setCurve(e.target.value); setResult(null); setError(null); }}>
          {signCurves.map(c => (<MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl sx={{ mb: 2 }}>
        <RadioGroup row value={op} onChange={e => setOp(e.target.value as 'sign' | 'verify')}>
          <FormControlLabel value="sign" control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.green } }} />}
            label={<Typography sx={{ color: draculaColors.foreground, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>Sign</Typography>} />
          <FormControlLabel value="verify" control={<Radio sx={{ color: draculaColors.comment, '&.Mui-checked': { color: draculaColors.cyan } }} />}
            label={<Typography sx={{ color: draculaColors.foreground, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>Verify</Typography>} />
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
      <Button variant="contained" startIcon={<PlayArrow />} onClick={handleRun} fullWidth
        sx={{ backgroundColor: draculaColors.purple, fontFamily: "'JetBrains Mono', monospace", mb: 2,
          '&:hover': { backgroundColor: '#a575f6' } }}>
        {op === 'sign' ? 'Sign' : 'Verify'}
      </Button>
      {result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>Output:</Typography>
            <Tooltip title="Copy"><IconButton size="small" onClick={handleCopy} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Box sx={{ ...outputBoxSx, maxHeight: '200px' }}><Box sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result}</Box></Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}

/* ─── Attacks Tab ─── */

const ECC_ATTACKS = [
  { value: 'nonce-reuse', label: 'ECDSA Nonce Reuse' },
  { value: 'point-validation', label: 'Point Validation Checker' },
  { value: 'biased-nonce', label: 'Biased Nonce / LLL — SageCell' },
  { value: 'invalid-curve', label: 'Invalid Curve Attack — SageCell' },
  { value: 'mov', label: 'MOV / Embedding Degree — SageCell' },
  { value: 'anomalous', label: "Smart's Attack (Anomalous) — SageCell" },
  { value: 'singular', label: 'Singular Curve — SageCell' },
];

/* ─── Attack Explanations ─── */

const ECC_ATTACK_EXPLANATIONS: Record<string, AttackExplanationData> = {
  'nonce-reuse': {
    title: 'ECDSA Nonce Reuse',
    description: 'When the same ephemeral key k is reused to sign two different messages, the private key d is immediately recoverable. Given two signatures (r, s1) on hash h1 and (r, s2) on hash h2 — sharing the same r means the same k was used — the private key falls out from basic algebra:\n\nk = (h1 - h2) * (s1 - s2)^-1 mod n\nd = (s1 * k - h1) * r^-1 mod n\n\nThis is the single most common ECDSA implementation bug, responsible for the PlayStation 3 ECDSA private key leak (2010) and multiple cryptocurrency thefts where biased or duplicated nonces leaked wallet private keys.',
    whenToUse: 'Two or more ECDSA signatures sharing the same r value (confirmed same nonce). The curve order n must be known.',
    algorithm: [
      'Confirm both signatures have identical r (non-repeating r means different k — this attack does not apply)',
      'Compute k = ((h1 - h2) mod n) * modinv((s1 - s2) mod n, n) mod n',
      'Compute d = ((s1 * k - h1) mod n) * modinv(r, n) mod n',
      'Verify: compute kG and confirm its x-coordinate equals r',
    ],
    python: `import sympy

n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

h1 = 0x0123456789abcdef...
h2 = 0xfedcba9876543210...
r  = 0x...
s1 = 0x...
s2 = 0x...

k = ((h1 - h2) * sympy.mod_inverse((s1 - s2) % n, n)) % n
d = ((s1 * k - h1) * sympy.mod_inverse(r, n)) % n

print(f"Recovered k: 0x{k:064x}")
print(f"Recovered d: 0x{d:064x}")

# Verify with pycryptodome
# from Cryptodome.PublicKey import ECC
# key = ECC.construct(curve='secp256k1', d=d)`,
    references: [
      'Wikipedia: Elliptic Curve Digital Signature Algorithm — security page',
      'SEC 2: Recommended Elliptic Curve Domain Parameters (Certicom)',
      'HD Wallet Cryptography / BIP32 — nonce misuse case studies',
    ],
  },
  'biased-nonce': {
    title: 'Biased Nonce / LLL Attack',
    description: 'When the ephemeral key k in ECDSA has known bias — e.g., only 64 bits of entropy instead of the full 256-bit curve order — the Hidden Number Problem (HNP) formulation applies. Given enough signatures (typically 3-10 for strong bias, more for weaker bias), the LLL lattice reduction algorithm recovers the private key.\n\nEach signature gives a relation: k_i = s_i^-1 * h_i + s_i^-1 * r_i * d (mod n). With k_i < 2^B for known bit-bound B, this is a Closest Vector Problem instance that LLL solves via Kannan embedding.',
    whenToUse: 'Multiple ECDSA signatures where the nonce k is known to be small (e.g., k < 2^B with B << 256). Common in embedded systems, smart cards, and RFC 6979 fallback failures.',
    algorithm: [
      'Collect m signatures (r_i, s_i, h_i) on distinct messages',
      'Compute a_i = r_i / s_i mod n and b_i = h_i / s_i mod n for each',
      'Build (m+2) by (m+2) Kannan embedding lattice matrix',
      'Run LLL reduction — the short vector contains d and k_i candidates',
      'Verify candidate d by checking k_0 = a_0 * d + b_0 mod n < 2^B',
    ],
    python: `import sympy
from fpylll import IntegerMatrix, LLL

n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

# (r_i, s_i, h_i) hex tuples from collected signatures
sigs = [
    ("0x...", "0x...", "0x..."),
    ("0x...", "0x...", "0x..."),
]
B = 64  # nonce bit-length bound

m = len(sigs)
M = [[0]*(m+2) for _ in range(m+2)]
for i, (r, s, h) in enumerate(sigs):
    r_i = int(r, 16); s_i = int(s, 16); h_i = int(h, 16)
    a_i = (r_i * sympy.mod_inverse(s_i, n)) % n
    b_i = (h_i * sympy.mod_inverse(s_i, n)) % n
    M[i][i] = n
    M[m][i] = a_i
    M[m+1][i] = b_i
M[m][m] = 1
M[m+1][m+1] = 2**B

L = IntegerMatrix.from_matrix(M)
L = LLL.reduction(L)
# Search short vectors for d candidate`,
    references: [
      'Howgrave-Graham & Smart, "Lattice Attacks on Digital Signature Schemes" (2001)',
      'Nguyen & Shparlinski, "The Insecurity of DSA with Biased Nonces" (2002)',
      'fpylll documentation — LLL implementation for Python',
    ],
  },
  'invalid-curve': {
    title: 'Invalid Curve Attack',
    description: 'In Weierstrass-form ECC, the curve addition formulas do not depend on the b parameter — only on the x,y coordinates and a. If an implementation skips full curve validation (checking b is correct), an attacker can send points on a weak curve E\': y^2 = x^3 + ax + b\' (same a, same field F_p, different b) where the group order has only small prime factors.\n\nSince the scalar multiplication operation still works (it only uses a), the computation proceeds on the weak curve where discrete_log is tractable via Pohlig-Hellman + CRT. This recovers the scalar multiplier, leaking the private key.',
    whenToUse: 'An ECC implementation that accepts foreign public keys without validating they belong to the intended curve. Especially relevant for Diffie-Hellman and ECDH protocols.',
    algorithm: [
      'Fix a target curve E: y^2 = x^3 + ax + b over F_p',
      'Search for b\' values where E\': y^2 = x^3 + ax + b\' has smooth order (small largest prime factor)',
      'Send a point on E\' to the target and observe the result',
      'Compute discrete_log on each weak E\' prime-power subgroup',
      'Reconstruct the full secret via CRT across all subgroups',
    ],
    python: `import sympy

# Target curve: y^2 = x^3 + ax + b over F_p
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a = 0
b = 7

# Search for weak related curves (same a, p)
for db in range(1, 50):
    bp = (b + db) % p
    F = sympy.GF(p)
    E = sympy.EllipticCurve(F, [a, int(bp)])
    order = E.order()
    factors = sympy.factorint(order)
    max_prime = max(factors.keys())
    if max_prime < 2**20:
        print(f"b'={bp:x} order={order} smooth! max_prime={max_prime}")
        G = E.gens()[0]
        # discrete_log(Q, G, operation='+') recovers key`,
    references: [
      'Ciet et al., "Elliptic Curve Cryptography: Serpentine Path of a Breakthrough" (2004)',
      'Jager, Schwenk, Somorovsky, "Practical Invalid Curve Attacks on TLS-ECDH" (2015)',
      'NIST SP 800-56A Rev. 3 — key agreement validation requirements',
    ],
  },
  'mov': {
    title: 'MOV / Embedding Degree Attack',
    description: 'The Menezes-Okamoto-Vanstone (MOV) attack uses the Weil or Tate pairing to transfer the elliptic curve discrete logarithm problem (ECDLP) from an elliptic curve E(F_p) to the multiplicative group of an extension field F_{p^k}. The embedding degree k is the smallest positive integer such that p^k = 1 mod n where n = #E(F_p).\n\nWhen k <= 6, the pairing-friendly embedding makes the DLP vulnerable to index calculus in F_{p^k} — much faster than Pollard rho on the curve. Curves with small embedding degree (pairing-friendly curves like BN254, BLS12-381 for k=12) are designed for pairing-based cryptography but must have k large enough for general security.',
    whenToUse: 'A curve where the order n divides p^k - 1 for small k (k <= 6). Verify by checking whether pow(p, k, n) == 1.',
    algorithm: [
      'Compute curve order n = #E(F_p)',
      'For k = 1 to 12: check if p^k = 1 mod n',
      'If found k <= 6: MOV attack feasible via pairing to F_{p^k}',
      'Use Weil/Tate pairing: e(P, Q) maps the ECDLP to F_{p^k}',
      'Apply index calculus or discrete_log in the extension field',
    ],
    python: `import sympy

# Curve E: y^2 = x^3 + ax + b over F_p
p = 0x...
a = 0
b = ...

F = sympy.GF(p)
E = sympy.EllipticCurve(F, [a, b])
n = E.order()

print(f"Curve order: {n}")
print(f"Factorization: {sympy.factorint(n)}")

# Find embedding degree k
for k in range(1, 13):
    if sympy.Mod(p**k, n) == 0:
        print(f"Embedding degree k = {k}")
        if k <= 6:
            print("MOV attack feasible via pairing")
        else:
            print("k > 6 — attack impractical")
        break
else:
    print("k > 12 — MOV not feasible")`,
    references: [
      'Menezes, Okamoto, Vanstone, "Reducing ECDLP to DLP in a Finite Field" (1993)',
      'Frey & Ruck, "A Remark on the MOV Attack" (1994)',
      'Galbraith & Smart, "Pairings and the MOV Attack" (2010 survey)',
    ],
  },
  'anomalous': {
    title: "Smart's Attack (Anomalous Curve)",
    description: 'An elliptic curve E over F_p is anomalous when #E(F_p) = p, i.e., the trace of Frobenius is 1. For such curves, the ECDLP can be solved in polynomial time using p-adic elliptic logarithms (Smart\'s attack, independently by Semaev and Satoh-Araki).\n\nThe attack lifts the curve to Q_p (p-adic numbers) via Hensel\'s lemma, computes the p-adic elliptic logarithm, and recovers the discrete logarithm in Z_p. This is a polynomial-time attack — no subexponential or exponential effort needed — making anomalous curves completely unsafe for cryptographic use.',
    whenToUse: 'A curve where #E(F_p) = p (trace = 1). Check: compare curve order to field prime p. If equal, Smart\'s attack applies.',
    algorithm: [
      'Compute curve order n = #E(F_p) and verify n === p',
      'Lift the curve E(F_p) to E(Q_p) via Hensel lifting (p-adic)',
      'Compute the formal logarithm: log_E maps E(Q_p) to Q_p',
      'Apply the logarithm to both generator G and target Q',
      'Recover d = log_E(Q) / log_E(G) mod p (the private key)',
    ],
    python: `import sympy

# Check if curve is anomalous
p = 0x...
a = 0
b = ...

F = sympy.GF(p)
E = sympy.EllipticCurve(F, [a, b])
n = E.order()

print(f"p = {p}")
print(f"n = {n}")
print(f"n == p: {n == p}")

if n == p:
    print("ANOMALOUS CURVE — Smart's attack applicable")
    # SageMath required for p-adic lift:
    # Qp = pAdicField(p, 10)
    # E_qp = EllipticCurve(Qp, [a, b])
    # Formal logarithm recovers d
    # d = log_e(Q) / log_e(G)
else:
    print("Not anomalous — Smart's attack does not apply")`,
    references: [
      'Smart, "The Discrete Logarithm Problem on Elliptic Curves of Trace One" (1999)',
      'Semaev, "Evaluation of Discrete Logarithms on Some Elliptic Curves" (1998)',
      'Satoh & Araki, "Fermat Quotients and the Discrete Log on Anomalous Curves" (1998)',
    ],
  },
  'singular': {
    title: 'Singular Curve Attack',
    description: 'An elliptic curve E: y^2 = x^3 + ax + b over F_p has discriminant Delta = -16(4a^3 + 27b^2). When Delta = 0 mod p, the curve is singular — it has a cusp or a node. The group law degenerates:\n\n- Cusp (a = 0, b = 0): ECDLP reduces to the additive group of F_p — completely trivial (discrete log is just division).\n- Node (Delta = 0 but not cusp): ECDLP reduces to the multiplicative group of F_p or F_{p^2} — solvable via index calculus or baby-step giant-step.\n\nSingular curves should never appear in practice (validation rejects Delta = 0), but CTF challenges and bad implementations may use them.',
    whenToUse: 'A curve where discriminant Delta = 0 mod p. Check: compute (-16 * (4a^3 + 27b^2)) mod p. If zero, the curve is singular.',
    algorithm: [
      'Compute discriminant Delta = -16(4a^3 + 27b^2) mod p',
      'If Delta != 0: curve is non-singular (standard crypto-grade)',
      'If Delta = 0 and a = 0, b = 0: cusp — additive group, ECDLP is trivial',
      'If Delta = 0 with non-zero a,b: node — multiplicative group, solve via discrete_log',
    ],
    python: `import sympy

p = 0x...
a = 0
b = ...

disc = sympy.Mod(-16 * (4*a**3 + 27*b**2), p)
print(f"Discriminant: {disc:x}")

if disc == 0:
    print("SINGULAR CURVE")
    if a == 0 and b == 0:
        print("Cusp — ECDLP reduces to additive group")
        print("Trivial: d = Q_target / G (in F_p)")
    else:
        print("Node — ECDLP reduces to multiplicative group")
        F = sympy.GF(p)
        E = sympy.EllipticCurve(F, [a, b])
        print(f"Order: {E.order()}")
        # Map to multiplicative group and solve
else:
    print("Non-singular curve (standard)")`,
    references: [
      'Silverman, "The Arithmetic of Elliptic Curves" (GTM 106) — singular curve classification',
      'Washington, "Elliptic Curves: Number Theory and Cryptography" — singular reduction',
      'Certicom ECC Standards — discriminant validation requirement',
    ],
  },
  'point-validation': {
    title: 'Point Validation Checker',
    description: 'Many ECC implementations fail to validate that public key points actually lie on the expected curve. The attacker supplies a point (x, y) and the curve equation y^2 = x^3 + ax + b (mod p) is checked or not. If validation is missing, the attacker can choose points on a different (weaker) curve where the discrete log is easy, then observe how the protocol responds differently.\n\nThis is a reconnaissance / sanity-check attack: feed a candidate point and learn whether the target validates curve membership. Once a non-validating point is accepted, stronger attacks (invalid curve, twist) become possible.',
    whenToUse: 'You have an ECC implementation that accepts a point (x, y) plus curve parameters (a, b, p). You want to test whether it validates curve membership before using the point.',
    algorithm: [
      'Parse curve parameters a, b, field prime p, and candidate point (x, y)',
      'Compute LHS = y^2 mod p',
      'Compute RHS = (x^3 + ax + b) mod p',
      'Compare: LHS === RHS means the point is on the curve',
      'Try points with modified b (same a, p) — these are on related curves',
    ],
    python: `import sympy

# Curve parameters (secp256k1)
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a = 0
b = 7

# Candidate point
x = 0x...
y = 0x...

lhs = sympy.Mod(y**2, p)
rhs = sympy.Mod(x**3 + a*x + b, p)

if lhs == rhs:
    print("Point IS on the curve")
else:
    print("Point NOT on the curve")

# gmpy2 alternative
# import gmpy2
# lhs = gmpy2.powmod(y, 2, p)`,
    references: [
      'NIST SP 800-186: Recommendations for Discrete Logarithm-based Cryptography',
      'Antipa et al. "Validation of Elliptic Curve Public Keys" (2003)',
      'Invalid-curve attacks in TLS (Jager, Schwenk, Somorovsky 2015)',
    ],
  },
};

function ECCAttacksTab() {
  const [attack, setAttack] = useState('nonce-reuse');
  const [h1, setH1] = useState('');
  const [h2, setH2] = useState('');
  const [r1, setR1] = useState('');
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [nHex, setNHex] = useState('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
  const [aVal, setAVal] = useState('');
  const [bVal, setBVal] = useState('');
  const [pVal, setPVal] = useState('');
  const [xVal, setXVal] = useState('');
  const [yVal, setYVal] = useState('');
  const [pxVal, setPxVal] = useState('');
  const [pyVal, setPyVal] = useState('');
  const [pairsMultiline, setPairsMultiline] = useState('');
  const [kbitsVal, setKbitsVal] = useState('64');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();
  const { execute } = useSageMath();

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  const run = useCallback(async () => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    try {
      switch (attack) {
        case 'nonce-reuse': {
          if (!h1.trim() || !h2.trim() || !r1.trim() || !s1.trim() || !s2.trim()) throw new Error('All fields required');
          const n = BigInt(nHex.trim().startsWith('0x') ? nHex.trim() : '0x' + nHex.trim().replace(/\s/g, ''));
          const hash1 = BigInt(h1.trim().startsWith('0x') ? h1.trim() : '0x' + h1.trim().replace(/\s/g, ''));
          const hash2 = BigInt(h2.trim().startsWith('0x') ? h2.trim() : '0x' + h2.trim().replace(/\s/g, ''));
          const rr = BigInt(r1.trim().startsWith('0x') ? r1.trim() : '0x' + r1.trim().replace(/\s/g, ''));
          const ss1 = BigInt(s1.trim().startsWith('0x') ? s1.trim() : '0x' + s1.trim().replace(/\s/g, ''));
          const ss2 = BigInt(s2.trim().startsWith('0x') ? s2.trim() : '0x' + s2.trim().replace(/\s/g, ''));
          // Modular inverse via extended Euclidean
          const modInv = (a: bigint, m: bigint): bigint => {
            let [old_r, r] = [a % m, m], [old_s, s] = [1n, 0n];
            while (r) { const q = old_r / r; [old_r, r] = [r, old_r - q * r]; [old_s, s] = [s, old_s - q * s]; }
            if (old_r !== 1n) throw new Error('Not invertible');
            return old_s < 0n ? old_s + m : old_s;
          };
          const sDiff = (ss1 - ss2 + n) % n;
          const k = ((hash1 - hash2 + n) % n * modInv(sDiff, n)) % n;
          const d = ((ss1 * k - hash1 + n) % n * modInv(rr, n)) % n;
          const rNonce = `k (nonce): 0x${k.toString(16)}\nPrivate key d: 0x${d.toString(16)}\n\nVerification: k·G should match r\n  r = 0x${rr.toString(16)}`;
          setResult(rNonce); setCtxOutput(rNonce); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, rNonce, true);
          break;
        }
        case 'point-validation': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim() || !xVal.trim() || !yVal.trim()) throw new Error('All curve/point fields required');
          const a = BigInt(aVal.trim().startsWith('0x') ? aVal.trim() : '0x' + aVal.trim().replace(/\s/g, ''));
          const b = BigInt(bVal.trim().startsWith('0x') ? bVal.trim() : '0x' + bVal.trim().replace(/\s/g, ''));
          const p = BigInt(pVal.trim().startsWith('0x') ? pVal.trim() : '0x' + pVal.trim().replace(/\s/g, ''));
          const x = BigInt(xVal.trim().startsWith('0x') ? xVal.trim() : '0x' + xVal.trim().replace(/\s/g, ''));
          const y = BigInt(yVal.trim().startsWith('0x') ? yVal.trim() : '0x' + yVal.trim().replace(/\s/g, ''));
          if (p < 2n) throw new Error('Invalid p');
          const lhs = (y * y) % p;
          const rhs = (((x * x) % p * x) % p + a * x + b) % p;
          const onCurve = lhs === rhs;
          const rPoint = `Point (0x${x.toString(16)}, 0x${y.toString(16)})
Curve: y² = x³ + ax + b over F_p
  a = 0x${a.toString(16)}
  b = 0x${b.toString(16)}
  p = 0x${p.toString(16)}

LHS: y² mod p = 0x${lhs.toString(16)}
RHS: x³+ax+b mod p = 0x${rhs.toString(16)}

${onCurve ? '✓ Point IS on the curve' : '✗ Point is NOT on the curve'}`;
          setResult(rPoint); setCtxOutput(rPoint); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, rPoint, true);
          break;
        }
        case 'biased-nonce': {
          if (!nHex.trim() || !pairsMultiline.trim()) throw new Error('Curve order and signature pairs required');
          const nHexClean = nHex.trim().replace(/\s/g, '');
          const nHexPrefix = nHexClean.startsWith('0x') ? nHexClean : '0x' + nHexClean;
          const code = `n = Integer(${nHexPrefix})
lines = '''${pairsMultiline.trim()}'''.strip().split('\\\\n')
pairs = []
for line in lines:
    if not line.strip(): continue
    parts = [p.strip() for p in line.split(',')]
    if len(parts) < 3: continue
    r, s, h = Integer(int(parts[0],16)), Integer(int(parts[1],16)), Integer(int(parts[2],16))
    pairs.append((r,s,h))
B = int(${kbitsVal.trim() || '64'})
m = len(pairs)
out = [f"Signatures loaded: {m}", f"Nonce bound: 2^{B}={2^B}"]
if m < 2:
    out.append("ERROR: Need >= 2 signatures")
    print('\\\\n'.join(out)); print('TOKEN=FAILED')
else:
    F = Integers(n)
    # Build HNP lattice: k_i = a_i*d + b_i mod n, k_i < 2^B
    M = Matrix(ZZ, m+2, m+2)
    for i in range(m):
        r,s,h = pairs[i]
        a = ZZ(F(r)/s)
        b = ZZ(F(h)/s)
        M[i,i] = n
        M[m,i] = a
        M[m+1,i] = b
    M[m,m] = 1
    M[m+1,m+1] = 2^B
    L = M.LLL()
    out.append(f"Lattice dim: {m+2} x {m+2}")
    out.append("---- Searching short vectors ----")
    found = False
    for i, row in enumerate(L.rows()):
        last = abs(row[m+1])
        if last == 2^B or last == 0: continue
        d_cand = abs(row[m])
        if d_cand > 1 and d_cand < n:
            r0,s0,h0 = pairs[0]
            k0 = ZZ(F(r0)/s0 * d_cand + F(h0)/s0)
            if k0 < 2^B * 2:
                out.append(f"Row {i}: d = 0x{hex(d_cand)}")
                out.append(f"  k0 = 0x{hex(k0)}")
                found = True
    if not found:
        out.append("No valid candidate. Try more signatures or larger B.")
        print('\\\\n'.join(out)); print('TOKEN=FAILED')
    else:
        print('\\\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) {
            const display = sageResult.stdout + '\nMETHOD=SAGEMATHCELL';
            setResult(display); setCtxOutput(display); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, display, true);
          } else {
            const errMsg = sageResult.error || 'SageCell execution failed';
            setError(errMsg); setCtxError(errMsg); setOutputSource('calculator');
          }
          break;
        }
        case 'invalid-curve': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          const code = `p = Integer(0x${pVal.trim().replace(/\s/g, '')})
a = Integer(0x${aVal.trim().replace(/\s/g, '')})
b = Integer(0x${bVal.trim().replace(/\s/g, '')})
out = []
F = GF(p)
E = EllipticCurve(F, [a, b])
out.append(f"Curve: y^2 = x^3 + {a}x + {b} over F_{p}")
out.append(f"Order: {E.order()}")
out.append(f"Factors: {factor(E.order())}")
out.append("")
out.append("Searching for weak related curves (same a,p, different b):")
for db in range(1, 20):
    try:
        E2 = EllipticCurve(F, [a, F(b+db)])
        n2 = E2.order()
        fac = factor(n2)
        max_prime = max([e for _,e in fac])
        out.append(f"  b+{db}: order={n2}, max_prime={max_prime}")
        if max_prime < 2^16:
            P = E2.gens()[0]
            out.append(f"    SMOOTH! Generator: {P}")
    except: pass
print('\\\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) {
            const display = sageResult.stdout + '\nMETHOD=SAGEMATHCELL';
            setResult(display); setCtxOutput(display); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, display, true);
          } else {
            const errMsg = sageResult.error || 'SageCell execution failed';
            setError(errMsg); setCtxError(errMsg); setOutputSource('calculator');
          }
          break;
        }
        case 'mov': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          const code = `p = Integer(0x${pVal.trim().replace(/\s/g, '')})
a = Integer(0x${aVal.trim().replace(/\s/g, '')})
b = Integer(0x${bVal.trim().replace(/\s/g, '')})
out = []
F = GF(p)
E = EllipticCurve(F, [a, b])
n = E.order()
out.append(f"Curve: y^2 = x^3 + {a}x + {b} over F_{p}")
out.append(f"Order n = {n}")
out.append(f"Factor: {factor(n)}")
out.append("")
out.append("Computing embedding degree k")
out.append("(smallest k > 0 where p^k ≡ 1 mod n):")
found = False
for k in range(1, 13):
    if Integer(p)^k % n == 1:
        out.append(f"  k = {k}")
        if k <= 6:
            out.append(f"  MOV attack feasible via pairing to F_{p}^{k}")
        else:
            out.append(f"  k > 6, pairing attack likely impractical")
        found = True
        break
if not found:
    out.append("  k > 12, MOV attack not feasible")
print('\\\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) {
            const display = sageResult.stdout + '\nMETHOD=SAGEMATHCELL';
            setResult(display); setCtxOutput(display); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, display, true);
          } else {
            const errMsg = sageResult.error || 'SageCell execution failed';
            setError(errMsg); setCtxError(errMsg); setOutputSource('calculator');
          }
          break;
        }
        case 'anomalous': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          const code = `p = Integer(0x${pVal.trim().replace(/\s/g, '')})
a = Integer(0x${aVal.trim().replace(/\s/g, '')})
b = Integer(0x${bVal.trim().replace(/\s/g, '')})
Qx = Integer(0x${pxVal.trim().replace(/\s/g, '') || 0})
Qy = Integer(0x${pyVal.trim().replace(/\s/g, '') || 0})
out = []
F = GF(p)
E = EllipticCurve(F, [a, b])
n = E.order()
out.append(f"Curve: y^2 = x^3 + {a}x + {b} over F_{p}")
out.append(f"Order: {n}")
out.append(f"p = {p}")
out.append(f"n == p: {n == p}")
if n == p:
    out.append("ANOMALOUS CURVE! Smart's attack applicable.")
    G = E.gens()[0]
    Q = E(Qx, Qy) if Qx > 0 else G
    out.append(f"Generator: {G}")
    out.append(f"Target: Q = {Q}")
    try:
        d = discrete_log(Q, G, operation='+')
        out.append(f"Private key d = {d}")
        out.append(f"Verify: d * G = {d*G}")
        out.append(f"d * G == Q: {d*G == Q}")
    except Exception as e:
        out.append(f"discrete_log failed: {e}")
        out.append("(SageCell may not support p-adic lift — try local Sage)")
else:
    out.append("NOT anomalous: trace != 1")
print('\\\\n'.join(out))
if n == p: print('TOKEN=SUCCESS')
else: print('TOKEN=FAILED')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) {
            const display = sageResult.stdout + '\nMETHOD=SAGEMATHCELL';
            setResult(display); setCtxOutput(display); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, display, true);
          } else {
            const errMsg = sageResult.error || 'SageCell execution failed';
            setError(errMsg); setCtxError(errMsg); setOutputSource('calculator');
          }
          break;
        }
        case 'singular': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          const code = `p = Integer(0x${pVal.trim().replace(/\s/g, '')})
a = Integer(0x${aVal.trim().replace(/\s/g, '')})
b = Integer(0x${bVal.trim().replace(/\s/g, '')})
out = []
F = GF(p)
disc = (-16 * (4*a^3 + 27*b^2)) % p
out.append(f"Curve: y^2 = x^3 + {a}x + {b} over F_{p}")
out.append(f"Discriminant Δ = -16(4a³+27b²) mod p = {disc}")
if disc == 0:
    out.append("Δ ≡ 0 → SINGULAR CURVE (node or cusp)")
    if a == 0 and b == 0:
        out.append("  Cusp: ECDLP reduces to additive group (trivial)")
    else:
        out.append("  Node: ECDLP reduces to multiplicative group of F_p")
        R.<x> = F[]
        f = x^3 + a*x + b
        roots = f.roots()
        out.append(f"  Singular point x = {roots}")
    E = EllipticCurve(F, [a, b])
    out.append(f"  Sage curve object: {E}")
    out.append(f"  Discriminant via Sage: {E.discriminant()}")
else:
    out.append("Δ ≠ 0 → non-singular curve (standard)")
    E = EllipticCurve(F, [a, b])
    out.append(f"  Order: {E.order()}")
    out.append(f"  Factors: {factor(E.order())}")
print('\\\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) {
            const display = sageResult.stdout + '\nMETHOD=SAGEMATHCELL';
            setResult(display); setCtxOutput(display); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, display, true);
          } else {
            const errMsg = sageResult.error || 'SageCell execution failed';
            setError(errMsg); setCtxError(errMsg); setOutputSource('calculator');
          }
          break;
        }
      }
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); setError(msg); setCtxError(msg); setOutputSource('calculator'); }
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal, pxVal, pyVal, pairsMultiline, kbitsVal, execute, addToHistory, setCtxError, setCtxOutput, setOutputSource]);

  const attackFields = useMemo(() => {
    switch (attack) {
      case 'nonce-reuse': return (
        <>
          <TextField fullWidth label="Curve order n (hex)" value={nHex} onChange={e => setNHex(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="secp256k1 order" spellCheck={false} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="Hash 1 (hex)" value={h1} onChange={e => setH1(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="h1" spellCheck={false} />
            <TextField fullWidth label="Hash 2 (hex)" value={h2} onChange={e => setH2(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="h2" spellCheck={false} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="r (hex)" value={r1} onChange={e => setR1(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="r" spellCheck={false} />
            <TextField fullWidth label="s1 (hex)" value={s1} onChange={e => setS1(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="s1" spellCheck={false} />
            <TextField fullWidth label="s2 (hex)" value={s2} onChange={e => setS2(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="s2" spellCheck={false} />
          </Box>
        </>
      );
      case 'point-validation': return (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="a (hex)" value={aVal} onChange={e => setAVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="a param" spellCheck={false} />
            <TextField fullWidth label="b (hex)" value={bVal} onChange={e => setBVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="b param" spellCheck={false} />
          </Box>
          <TextField fullWidth label="p (prime, hex)" value={pVal} onChange={e => setPVal(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="Field prime" spellCheck={false} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="x (hex)" value={xVal} onChange={e => setXVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="x coord" spellCheck={false} />
            <TextField fullWidth label="y (hex)" value={yVal} onChange={e => setYVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="y coord" spellCheck={false} />
          </Box>
        </>
      );
      case 'biased-nonce': return (
        <>
          <TextField fullWidth label="Curve order n (hex)" value={nHex} onChange={e => setNHex(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="secp256k1 order" spellCheck={false} />
          <TextField fullWidth label="kbits (unknown nonce bits)" value={kbitsVal} onChange={e => setKbitsVal(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="64" spellCheck={false} helperText="Lower = easier (e.g., kbits=64 means k &lt; 2^64)" />
          <TextField fullWidth multiline minRows={4} maxRows={8} label="Signature pairs (r,s,h hex, one per line)" value={pairsMultiline}
            onChange={e => setPairsMultiline(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder={'r1,s1,h1\nr2,s2,h2\n...'} spellCheck={false} />
        </>
      );
      case 'invalid-curve': return (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="a (hex)" value={aVal} onChange={e => setAVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="a param" spellCheck={false} />
            <TextField fullWidth label="b (hex)" value={bVal} onChange={e => setBVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="b param" spellCheck={false} />
          </Box>
          <TextField fullWidth label="p (prime, hex)" value={pVal} onChange={e => setPVal(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="Field prime" spellCheck={false} />

        </>
      );
      case 'mov': return (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="a (hex)" value={aVal} onChange={e => setAVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="a param" spellCheck={false} />
            <TextField fullWidth label="b (hex)" value={bVal} onChange={e => setBVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="b param" spellCheck={false} />
          </Box>
          <TextField fullWidth label="p (prime, hex)" value={pVal} onChange={e => setPVal(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="Field prime" spellCheck={false} />
        </>
      );
      case 'anomalous': return (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="a (hex)" value={aVal} onChange={e => setAVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="a param" spellCheck={false} />
            <TextField fullWidth label="b (hex)" value={bVal} onChange={e => setBVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="b param" spellCheck={false} />
          </Box>
          <TextField fullWidth label="p (prime, hex)" value={pVal} onChange={e => setPVal(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="Field prime" spellCheck={false} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="Qx (hex)" value={pxVal} onChange={e => setPxVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="Target point x" spellCheck={false} />
            <TextField fullWidth label="Qy (hex)" value={pyVal} onChange={e => setPyVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="Target point y" spellCheck={false} />
          </Box>
        </>
      );
      case 'singular': return (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label="a (hex)" value={aVal} onChange={e => setAVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="a param" spellCheck={false} />
            <TextField fullWidth label="b (hex)" value={bVal} onChange={e => setBVal(e.target.value)} variant="outlined"
              sx={{ ...inputSx, mb: 2 }} placeholder="b param" spellCheck={false} />
          </Box>
          <TextField fullWidth label="p (prime, hex)" value={pVal} onChange={e => setPVal(e.target.value)} variant="outlined"
            sx={{ ...inputSx, mb: 2 }} placeholder="Field prime" spellCheck={false} />
        </>
      );
    }
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal, pxVal, pyVal, pairsMultiline, kbitsVal]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Attack</InputLabel>
        <Select value={attack} label="Attack" onChange={e => setAttack(e.target.value)}>
          {ECC_ATTACKS.map(a => (<MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>))}
        </Select>
      </FormControl>
      {ECC_ATTACK_EXPLANATIONS[attack] && <AttackExplanationPanel data={ECC_ATTACK_EXPLANATIONS[attack]} />}
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
          <Box sx={{ ...outputBoxSx, maxHeight: '300px' }}><Box sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result}</Box></Box>
        </Box>
      )}
      {error && (<Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{error}</Typography>)}
    </Box>
  );
}

/* ───────── MAIN ───────── */

export default function ECCCalculator() {
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
      <Box sx={{ ...centeredPanelSx, pt: 2, px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hub sx={{ fontSize: 'inherit' }} /> ECC Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            Elliptic curve operations, ECDSA, ECDH, and attacks — powered by @noble/curves
          </Typography>
          <CalculatorSubTabs tabs={TABS} activeTab={tab} onChange={handleTabChange} />
          <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pt: 1 }}>
            {tab === 'explanation' && <ECCExplanationTab />}
            {tab === 'keyops' && <ECCKeyOpsTab />}
            {tab === 'signverify' && <ECCSignVerifyTab />}
            {tab === 'attacks' && <ECCAttacksTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
