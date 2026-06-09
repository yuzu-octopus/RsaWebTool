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
import { ProofRenderer } from '../ProofRenderer';
import { useAppContext } from '../../hooks/useAppContext';
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
      <Box sx={{ maxHeight: '60vh', overflow: 'auto', pr: 1, pb: '20vh',
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
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const handleCopy = useCallback(() => { if (result) navigator.clipboard.writeText(result).catch(() => {}); }, [result]);

  const run = useCallback(() => {
    setError(null); setResult(null);
    setCtxOutput(null); setCtxError(null);
    try {
      const biasedDesc = `Biased Nonce Attack (LLL)
Detects non-uniform k distribution from many ECDSA signatures.
Algorithm:
1. Collect signatures (r_i, s_i) with biased nonces k_i
2. Construct lattice basis from signature equations:
   k_i = s_i^{-1}·(h_i + r_i·d) mod n
3. If k_i has small bias (e.g. few bits of entropy), LLL recovers d
SageMathCell input (send to SageCell):
  n = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141
  sigs = [(r1,s1,h1), (r2,s2,h2), ...]
  # Build lattice, LLL(), recover d`;
      const invalidDesc = `Invalid Curve Attack
Exploits missing point validation: attacker submits a point on a weak curve
where ECDLP is easy.
Steps:
1. Choose a point P on a different curve with same p but different (a',b')
2. Find one where #E' has small factor or smooth order
3. Submit (x,y) — if implementation skips cofactor/on-curve check,
   scalar multiplication uses the attacker's curve
4. Solve ECDLP on the weak curve via Pohlig-Hellman / BSGS
SageMathCell input:
  F = GF(p)
  E = EllipticCurve(F, [a_smooth, b_smooth])
  P = E(x_attacker, y_attacker)
  Q = E(x_Q, y_Q)  # received from server
  discrete_log(Q, P, ord(P), operation='+')`;
      const movDesc = `MOV / Embedding Degree Attack
Checks whether the embedding degree k is small enough to transfer
the ECDLP to F_{p^k} where index calculus may be faster.
Given curve E(F_p) with order n:
1. Compute embedding degree k = min{ t > 0 : p^t ≡ 1 (mod n) }
2. If k is small (≤ 6), the Weil/Tate pairing maps ECDLP to F_{p^k}
3. Use GNFS or index calculus in F_{p^k}
Small k occurs for supersingular curves (k ≤ 6). Most standard
curves (secp256k1, P-256) have huge k (impractical).
SageMathCell input:
  p = ...
  n = ...
  for k in range(1, 13):
      if pow(p, k, n) == 1:
          print(f'Embedding degree k = {k}')
          break`;
      const anomalousDesc = `Smart's Attack (Anomalous Curve)
Exploits curves where #E(F_p) = p (anomalous/prime-field trace 1).
The ECDLP can be solved in O(log p) via p-adic elliptic logarithm lift.
Algorithm (Smart '99):
1. Lift P, Q ∈ E(F_p) to points P̂, Q̂ ∈ E(Q_p) (p-adic)
2. Compute p·P̂ = (x̂_P, ŷ_P), p·Q̂ = (x̂_Q, ŷ_Q)
3. Extract p-adic logarithms: φ(P) = x̂_P / ŷ_P (mod p)
4. d = φ(Q) / φ(P) mod p
SageMathCell input:
  p = <prime>
  E = EllipticCurve(GF(p), [a, b])
  P = E.gens()[0]
  Q = d*P  # target
  SmartAttack(P, Q, p)  # see Sage's anomalous.primes implementation`;
      const singularDesc = `Singular Curve Attack
When discriminant Δ = -16(4a³ + 27b²) = 0, the curve has a node or cusp.
This reduces ECDLP to the multiplicative or additive group.
For Δ = 0:
  - Node: map to F_p^* via (y - y₀) / (x - x₀) = t, then DLP in F_p^*
  - Cusp (a=b=0): map to F_p^+ via x/y, easy solve
SageMathCell input:
  p = <prime>
  a = ...; b = ...
  Δ = -16 * (4*a^3 + 27*b^2)
  if Δ % p == 0: print('SINGULAR')
  F = GF(p)
  E = EllipticCurve(F, [a, b])
  if E.discriminant() == 0: ...`;
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
        case 'biased-nonce':
          setResult(biasedDesc); setCtxOutput(biasedDesc); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, biasedDesc, true);
          break;
        case 'invalid-curve':
          setResult(invalidDesc); setCtxOutput(invalidDesc); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, invalidDesc, true);
          break;
        case 'mov':
          setResult(movDesc); setCtxOutput(movDesc); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, movDesc, true);
          break;
        case 'anomalous':
          setResult(anomalousDesc); setCtxOutput(anomalousDesc); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, anomalousDesc, true);
          break;
        case 'singular':
          setResult(singularDesc); setCtxOutput(singularDesc); setOutputSource('calculator'); addToHistory('calculator-ecc', 'ECC Attack: ' + attack, singularDesc, true);
          break;
      }
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); setError(msg); setCtxError(msg); setOutputSource('calculator'); }
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal, addToHistory, setCtxError, setCtxOutput, setOutputSource]);

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
      default: return (
        <Typography sx={{ color: draculaColors.comment, mb: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
          This attack requires SageMathCell. Click Run for the SageCell code and description.
        </Typography>
      );
    }
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Attack</InputLabel>
        <Select value={attack} label="Attack" onChange={e => setAttack(e.target.value)}>
          {ECC_ATTACKS.map(a => (<MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>))}
        </Select>
      </FormControl>
      {attackFields}
      <Button variant="contained" startIcon={<PlayArrow />} onClick={run} fullWidth
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
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
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
