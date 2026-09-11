import { useState, useCallback, useMemo, useRef} from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../../hooks/useSageMath';
import { AttackExplanationPanel } from './AttackExplanationPanel';
import { ResultBox } from './_shared/ResultBox';
import { ECC_ATTACKS, ECC_ATTACK_EXPLANATIONS } from '../../data/attackExplanations/ecc';
import {
  CURVES,
  parseMsg,
  parseHexField,
  hexToBytesStrict,
  sageHex,
  sageHexNonZero,
  cleanHex,
  curveOrder,
  recoverNonce,
  recoverPrivKey,
  ecMul,
  ecOnCurve,
  ecCurveOrder,
  ecPointOrder,
  ecPohligHellman,
  X25519_P,
  X25519_L,
  X25519_LOW_ORDER_PEERS,
  x25519Legendre,
} from '../../utils/eccCurves';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '@noble/curves/utils.js';

const SECP256K1_ORDER_HEX = 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141';

export function ECCAttacksTab({ selectedAttack }: { selectedAttack?: string } = {}) {
  const [attack, setAttack] = useState(selectedAttack ?? 'nonce-reuse');
  const [h1, setH1] = useState('');
  const [h2, setH2] = useState('');
  const [r1, setR1] = useState('');
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [nHex, setNHex] = useState(SECP256K1_ORDER_HEX);
  const [aVal, setAVal] = useState('');
  const [bVal, setBVal] = useState('');
  const [pVal, setPVal] = useState('');
  const [xVal, setXVal] = useState('');
  const [yVal, setYVal] = useState('');
  const [gxVal, setGxVal] = useState('');
  const [gyVal, setGyVal] = useState('');
  const [pxVal, setPxVal] = useState('');
  const [pyVal, setPyVal] = useState('');
  const [pairsMultiline, setPairsMultiline] = useState('');
  const [kbitsVal, setKbitsVal] = useState('64');
  const [malCurve, setMalCurve] = useState('secp256k1');
  const [malMsg, setMalMsg] = useState('');
  const [malPriv, setMalPriv] = useState('');
  const [peerVal, setPeerVal] = useState('00'.repeat(32));
  const [isRunning, setIsRunning] = useState(false);
  const runningRef = useRef(false);
  const out = useCalculatorOutput({ category: 'calculator-ecc' });
  const { execute } = useSageMath();

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    out.clear();
    try {
      switch (attack) {
        case 'nonce-reuse': {
          if (!h1.trim() || !h2.trim() || !r1.trim() || !s1.trim() || !s2.trim()) throw new Error('All fields required');
          // Hex-labelled inputs parse as hex ('ff' -> 255n), never decimal.
          const n = parseHexField(nHex, 'curve order n');
          const hash1 = parseHexField(h1, 'h1');
          const hash2 = parseHexField(h2, 'h2');
          const rr = parseHexField(r1, 'r');
          const ss1 = parseHexField(s1, 's1');
          const ss2 = parseHexField(s2, 's2');
          const k = recoverNonce(hash1, hash2, ss1, ss2, n);
          const d = recoverPrivKey(ss1, k, hash1, rr, n);
          const lines = [
            `k (nonce): 0x${k.toString(16)}`,
            `Private key d: 0x${d.toString(16)}`,
            '',
          ];
          if (n === curveOrder(secp256k1)) {
            // Real verification: recompute k·G and compare its x-coordinate.
            const R = secp256k1.Point.BASE.multiply(k).toAffine();
            const match = (R.x % n) === (rr % n);
            lines.push(`Verification: k·G x-coord ${match ? 'MATCHES' : 'MISMATCHES'} r (0x${rr.toString(16)})`);
          } else {
            lines.push('Verification: k·G check skipped (n is not the secp256k1 order)');
            lines.push(`  r = 0x${rr.toString(16)}`);
          }
          out.dispatch(lines.join('\n'), `ECC Attack: ${attack}`);
          break;
        }
        case 'point-validation': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim() || !xVal.trim() || !yVal.trim()) throw new Error('All curve/point fields required');
          const a = parseHexField(aVal, 'a');
          const b = parseHexField(bVal, 'b');
          const p = parseHexField(pVal, 'p');
          const x = parseHexField(xVal, 'x');
          const y = parseHexField(yVal, 'y');
          if (p < 2n) throw new Error('Invalid p');
          const lhs = (y * y) % p;
          const rhs = (((x * x) % p * x) % p + a * x + b) % p;
          const onCurve = lhs === rhs;
          const result = `Point (0x${x.toString(16)}, 0x${y.toString(16)})
Curve: y² = x³ + ax + b over F_p
  a = 0x${a.toString(16)}
  b = 0x${b.toString(16)}
  p = 0x${p.toString(16)}

LHS: y² mod p = 0x${lhs.toString(16)}
RHS: x³+ax+b mod p = 0x${rhs.toString(16)}

${onCurve ? '✓ Point IS on the curve' : '✗ Point is NOT on the curve'}`;
          out.dispatch(result, `ECC Attack: ${attack}`);
          break;
        }
        case 'ec-ph': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          if (!gxVal.trim() || !gyVal.trim()) throw new Error('Base point G (Gx, Gy) required');
          if (!pxVal.trim() || !pyVal.trim()) throw new Error('Target point Q (Qx, Qy) required');
          const p = parseHexField(pVal, 'p');
          const a = parseHexField(aVal, 'a') % p;
          const b = parseHexField(bVal, 'b') % p;
          const G = { x: parseHexField(gxVal, 'Gx') % p, y: parseHexField(gyVal, 'Gy') % p };
          const Q = { x: parseHexField(pxVal, 'Qx') % p, y: parseHexField(pyVal, 'Qy') % p };
          if (!ecOnCurve(G, a, b, p)) throw new Error('G is not on the curve');
          if (!ecOnCurve(Q, a, b, p)) throw new Error('Q is not on the curve');
          const n = ecCurveOrder(a, b, p);
          const gOrd = ecPointOrder(G, n, a, p);
          if (gOrd < 2n) throw new Error('G has trivial order');
          // Pohlig-Hellman per prime-power subgroup + CRT (mirrors DH structure).
          const { d, subgroups } = ecPohligHellman(G, Q, gOrd, a, p);
          const check = ecMul(G, d, a, p);
          const match = check !== null && check.x === Q.x && check.y === Q.y;
          const lines = [
            `Curve order #E(F_p) = ${n} (local enumeration)`,
            `Base point order = ${gOrd}`,
            '',
            ...subgroups.map(s => `  Subgroup ${s.prime}^${s.exp} (mod ${s.mod}): log = ${s.log}`),
            '',
            `Recovered d = ${d} (0x${d.toString(16)})`,
            `Verification: d·G ${match ? 'MATCHES' : 'MISMATCHES'} Q`,
          ];
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', `ECC Attack: ${attack}`);
          break;
        }
        case 'sig-malleability': {
          if (!malMsg.trim() || !malPriv.trim()) throw new Error('Message and private key required');
          const ci = CURVES.find(c => c.id === malCurve && c.hasSign)?.instance;
          if (!ci) throw new Error('Curve does not support signing');
          const n = curveOrder(ci);
          const mbytes = parseMsg(malMsg);
          const priv = hexToBytesStrict(malPriv, 'private key');
          const pub = ci.getPublicKey(priv);
          const sig = ci.Signature.fromBytes(ci.sign(mbytes, priv));
          const low = sig.s * 2n < n ? sig.s : n - sig.s;
          const hi = n - low;
          const loSig = new ci.Signature(sig.r, low).toBytes();
          const hiSig = new ci.Signature(sig.r, hi).toBytes();
          const loDefault = ci.verify(loSig, mbytes, pub);
          const hiDefault = ci.verify(hiSig, mbytes, pub);
          const hiLax = ci.verify(hiSig, mbytes, pub, { lowS: false });
          const lines = [
            `Original s: 0x${sig.s.toString(16)}${sig.s === hi ? ' (high-S)' : ' (low-S)'}`,
            `Malleated twin (r, n-s): 0x${hi.toString(16)}`,
            '',
            `Low-S twin, default verify:  ${loDefault ? 'VALID' : 'INVALID'}`,
            `High-S twin, default verify: ${hiDefault ? 'VALID' : 'INVALID'} (lowS:true rejects — BIP-146 style)`,
            `High-S twin, lowS:false:     ${hiLax ? 'VALID' : 'INVALID'} (pure curve math accepts)`,
            '',
            'Ed25519 analogue: S -> S+L malleations are accepted by ZIP-215',
            'verifiers but rejected here by strict (RFC 8032) verification.',
          ];
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', `ECC Attack: ${attack}`);
          break;
        }
        case 'x25519-twist': {
          if (!peerVal.trim()) throw new Error('Peer key is required');
          const body = cleanHex(peerVal, 'peer key');
          if (body.length !== 64) throw new Error(`X25519 keys are 32 bytes (64 hex digits, got ${body.length})`);
          const bytes = hexToBytesStrict(peerVal, 'peer key');
          let u = 0n;
          for (let i = bytes.length - 1; i >= 0; i--) u = (u << 8n) + BigInt(bytes[i]);
          const leg = x25519Legendre(u);
          const membership = leg === 0n
            ? 'f(u) = 0 — degenerate (u = 0 or a root; order-2 point)'
            : leg === 1n ? 'ON the curve (quadratic residue)' : 'ON the quadratic TWIST (non-residue)';
          const lines = [
            `X25519: y² = x³ + 486662x² + x over p = 2^255-19`,
            `  p = 0x${X25519_P.toString(16)}`,
            `  Curve order = 8·L, twist order = 4·t′ (t′ prime) — twist-secure, not twist-proof`,
            '',
            `Peer u: 0x${body.toLowerCase()}`,
            `Membership: ${membership}`,
            '',
          ];
          const priv = x25519.keygen().secretKey;
          try {
            const shared = x25519.getSharedSecret(priv, bytes);
            lines.push(`ECDH accepted: shared = ${bytesToHex(shared).slice(0, 32)}…`);
            lines.push('(Feed raw output through a KDF; never use it as a key directly.)');
          } catch (e) {
            lines.push(`ECDH rejected: ${e instanceof Error ? e.message : String(e)}`);
            lines.push('(Low-order / torsion peer point — contributory ECDH would leak key bits here.)');
          }
          lines.push('');
          lines.push('Bundled low-order peers (both must reject):');
          for (const peerHex of X25519_LOW_ORDER_PEERS) {
            try {
              x25519.getSharedSecret(priv, hexToBytesStrict(peerHex, 'peer'));
              lines.push(`  ${peerHex.slice(0, 16)}… ACCEPTED (unexpected!)`);
            } catch {
              lines.push(`  ${peerHex.slice(0, 16)}… rejected ✓`);
            }
          }
          const alice = x25519.keygen();
          const bob = x25519.keygen();
          const sa = bytesToHex(x25519.getSharedSecret(alice.secretKey, bob.publicKey));
          const sb = bytesToHex(x25519.getSharedSecret(bob.secretKey, alice.publicKey));
          lines.push(`Legit control: Alice/Bob shared ${sa === sb ? 'MATCH ✓' : 'MISMATCH ✗'}`);
          lines.push(`  L = 0x${X25519_L.toString(16)}`);
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', `ECC Attack: ${attack}`);
          break;
        }
        case 'biased-nonce': {
          if (!nHex.trim() || !pairsMultiline.trim()) throw new Error('Curve order and signature pairs required');
          const nHexClean = sageHex(nHex, 'n');
          const code = `n = Integer(${nHexClean})
lines = '''${pairsMultiline.trim()}'''.strip().splitlines()
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
    print('\\n'.join(out)); print('TOKEN=FAILED')
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
        print('\\n'.join(out)); print('TOKEN=FAILED')
    else:
        print('\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
          break;
        }
        case 'invalid-curve': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          const pH = sageHex(pVal, 'p');
          const aH = sageHex(aVal, 'a');
          const bH = sageHex(bVal, 'b');
          const code = `p = Integer(${pH})
a = Integer(${aH})
b = Integer(${bH})
out = []
F = GF(p)
E = EllipticCurve(F, [a, b])
out.append(f"Curve: y^2 = x^3 + {a}x + {b} over F_{p}")
out.append(f"Order: {E.order()}")
out.append(f"Factors: {factor(E.order())}")
out.append("")
out.append("Searching for weak related curves (same a,p, different b):")
smooth = []
for db in range(1, 50):
    try:
        E2 = EllipticCurve(F, [a, F(b+db)])
        n2 = E2.order()
        fac = factor(n2)
        max_prime = max([e for _,e in fac])
        out.append(f"  b+{db}: order={n2}, max_prime={max_prime}")
        if max_prime < 2^16:
            P = E2.gens()[0]
            out.append(f"    SMOOTH! Generator: {P}")
            smooth.append((db, E2, P, n2))
    except: pass
if smooth:
    out.append("")
    out.append("Oracle + CRT stage (demo on first smooth curve):")
    db, E2, P, n2 = smooth[0]
    d_demo = 12345 % int(n2)
    Q = d_demo * P
    try:
        d_rec = discrete_log(Q, P, operation='+')
        out.append(f"  d_demo = {d_demo}, recovered = {d_rec}, match = {int(d_rec) == d_demo}")
    except Exception as e:
        out.append(f"  discrete_log failed: {e}")
    out.append("  Real attack: send each weak-curve point to the oracle, solve each")
    out.append("  prime-power DLP, combine with CRT (see the local EC Pohlig-Hellman mode).")
print('\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
          break;
        }
        case 'mov': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          const pH = sageHex(pVal, 'p');
          const aH = sageHex(aVal, 'a');
          const bH = sageHex(bVal, 'b');
          const code = `p = Integer(${pH})
a = Integer(${aH})
b = Integer(${bH})
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
print('\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
          break;
        }
        case 'anomalous': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          // Explicit non-zero Q required: defaulting an empty target to G
          // makes discrete_log return d=1 as a false SUCCESS.
          if (!pxVal.trim() || !pyVal.trim()) {
            throw new Error('Target point Q (Qx, Qy) is required — refusing to default to G (that fakes d=1 SUCCESS)');
          }
          const pH = sageHex(pVal, 'p');
          const aH = sageHex(aVal, 'a');
          const bH = sageHex(bVal, 'b');
          const qxH = sageHexNonZero(pxVal, 'Qx');
          const qyH = sageHexNonZero(pyVal, 'Qy');
          const code = `p = Integer(${pH})
a = Integer(${aH})
b = Integer(${bH})
Qx = Integer(${qxH})
Qy = Integer(${qyH})
out = []
F = GF(p)
E = EllipticCurve(F, [a, b])
n = E.order()
out.append(f"Curve: y^2 = x^3 + {a}x + {b} over F_{p}")
out.append(f"Order: {n}")
out.append(f"p = {p}")
out.append(f"n == p: {n == p}")
ok = False
if n == p:
    out.append("ANOMALOUS CURVE! Smart's attack applicable.")
    G = E.gens()[0]
    try:
        Q = E(Qx, Qy)
    except Exception as e:
        out.append(f"Target Q not on the curve: {e}")
        out.append("(Check Qx/Qy against y^2 = x^3 + ax + b first)")
        Q = None
    if Q is not None:
        out.append(f"Generator: {G}")
        out.append(f"Target: Q = {Q}")
        try:
            d = discrete_log(Q, G, operation='+')
            out.append(f"Private key d = {d}")
            out.append(f"Verify: d * G = {d*G}")
            out.append(f"d * G == Q: {d*G == Q}")
            ok = True
        except Exception as e:
            out.append(f"discrete_log failed: {e}")
            out.append("(SageCell may not support p-adic lift — try local Sage)")
else:
    out.append("NOT anomalous: trace != 1")
print('\\n'.join(out))
print('TOKEN=SUCCESS' if ok else 'TOKEN=FAILED')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
          break;
        }
        case 'singular': {
          if (!aVal.trim() || !bVal.trim() || !pVal.trim()) throw new Error('Curve parameters required');
          const pH = sageHex(pVal, 'p');
          const aH = sageHex(aVal, 'a');
          const bH = sageHex(bVal, 'b');
          const code = `p = Integer(${pH})
a = Integer(${aH})
b = Integer(${bH})
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
    try:
        E = EllipticCurve(F, [a, b])
        out.append(f"  Sage curve object: {E}")
        out.append(f"  Discriminant via Sage: {E.discriminant()}")
    except Exception as e:
        out.append(f"  (Sage refuses to build singular curves: {e})")
else:
    out.append("Δ ≠ 0 → non-singular curve (standard)")
    E = EllipticCurve(F, [a, b])
    out.append(f"  Order: {E.order()}")
    out.append(f"  Factors: {factor(E.order())}")
print('\\n'.join(out)); print('TOKEN=SUCCESS')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
          break;
        }
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal, gxVal, gyVal, pxVal, pyVal, pairsMultiline, kbitsVal, malCurve, malMsg, malPriv, peerVal, execute, out]);

  const malCurves = useMemo(() => CURVES.filter(c => c.hasSign && c.instance), []);

  const attackFields = useMemo(() => {
    switch (attack) {
      case 'nonce-reuse': return (
        <Stack direction="vertical" gap={2}>
          <TextInput label="Curve order n (hex)" value={nHex} onChange={setNHex} placeholder="secp256k1 order" width="100%" isDisabled={isRunning} />
          <Stack direction="horizontal" gap={1}>
            <TextInput label="Hash 1 (hex)" value={h1} onChange={setH1} placeholder="h1" width="100%" isDisabled={isRunning} />
            <TextInput label="Hash 2 (hex)" value={h2} onChange={setH2} placeholder="h2" width="100%" isDisabled={isRunning} />
          </Stack>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="r (hex)" value={r1} onChange={setR1} placeholder="r" width="100%" isDisabled={isRunning} />
            <TextInput label="s1 (hex)" value={s1} onChange={setS1} placeholder="s1" width="100%" isDisabled={isRunning} />
            <TextInput label="s2 (hex)" value={s2} onChange={setS2} placeholder="s2" width="100%" isDisabled={isRunning} />
          </Stack>
        </Stack>
      );
      case 'point-validation': return (
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="a (hex)" value={aVal} onChange={setAVal} placeholder="a param" width="100%" isDisabled={isRunning} />
            <TextInput label="b (hex)" value={bVal} onChange={setBVal} placeholder="b param" width="100%" isDisabled={isRunning} />
          </Stack>
          <TextInput label="p (prime, hex)" value={pVal} onChange={setPVal} placeholder="Field prime" width="100%" isDisabled={isRunning} />
          <Stack direction="horizontal" gap={1}>
            <TextInput label="x (hex)" value={xVal} onChange={setXVal} placeholder="x coord" width="100%" isDisabled={isRunning} />
            <TextInput label="y (hex)" value={yVal} onChange={setYVal} placeholder="y coord" width="100%" isDisabled={isRunning} />
          </Stack>
        </Stack>
      );
      case 'ec-ph': return (
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="a (hex)" value={aVal} onChange={setAVal} placeholder="a param" width="100%" isDisabled={isRunning} />
            <TextInput label="b (hex)" value={bVal} onChange={setBVal} placeholder="b param" width="100%" isDisabled={isRunning} />
          </Stack>
          <TextInput label="p (prime, hex — small enough to enumerate locally)" value={pVal} onChange={setPVal} placeholder="Field prime" width="100%" isDisabled={isRunning} />
          <Stack direction="horizontal" gap={1}>
            <TextInput label="Gx (hex)" value={gxVal} onChange={setGxVal} placeholder="Base point x" width="100%" isDisabled={isRunning} />
            <TextInput label="Gy (hex)" value={gyVal} onChange={setGyVal} placeholder="Base point y" width="100%" isDisabled={isRunning} />
          </Stack>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="Qx (hex)" value={pxVal} onChange={setPxVal} placeholder="Target point x" width="100%" isDisabled={isRunning} />
            <TextInput label="Qy (hex)" value={pyVal} onChange={setPyVal} placeholder="Target point y" width="100%" isDisabled={isRunning} />
          </Stack>
        </Stack>
      );
      case 'sig-malleability': return (
        <Stack direction="vertical" gap={2}>
          <Selector
            label="Curve"
            options={malCurves.map(c => ({ value: c.id, label: c.label }))}
            value={malCurve}
            onChange={setMalCurve}
            width="100%"
            isDisabled={isRunning}
          />
          <TextInput label="Message (text or even-length hex)" value={malMsg} onChange={setMalMsg} placeholder="Message to sign" width="100%" isDisabled={isRunning} />
          <TextInput label="Private key (hex)" value={malPriv} onChange={setMalPriv} placeholder="Hex private key" width="100%" isDisabled={isRunning} />
        </Stack>
      );
      case 'x25519-twist': return (
        <Stack direction="vertical" gap={2}>
          <TextInput label="Peer key (32-byte hex, little-endian u)" value={peerVal} onChange={setPeerVal} placeholder="Peer x-coordinate" width="100%" isDisabled={isRunning} />
        </Stack>
      );
      case 'biased-nonce': return (
        <Stack direction="vertical" gap={2}>
          <TextInput label="Curve order n (hex)" value={nHex} onChange={setNHex} placeholder="secp256k1 order" width="100%" isDisabled={isRunning} />
          <TextInput
            label="kbits (unknown nonce bits)"
            description="Lower = easier (e.g., kbits=64 means k < 2^64)"
            value={kbitsVal}
            onChange={setKbitsVal}
            placeholder="64"
            width="100%"
            isDisabled={isRunning}
          />
          <TextArea
            label="Signature pairs (r,s,h hex, one per line)"
            value={pairsMultiline}
            onChange={setPairsMultiline}
            rows={4}
            placeholder={'r1,s1,h1\nr2,s2,h2\n...'}
            isDisabled={isRunning}
          />
        </Stack>
      );
      case 'invalid-curve': return (
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="a (hex)" value={aVal} onChange={setAVal} placeholder="a param" width="100%" isDisabled={isRunning} />
            <TextInput label="b (hex)" value={bVal} onChange={setBVal} placeholder="b param" width="100%" isDisabled={isRunning} />
          </Stack>
          <TextInput label="p (prime, hex)" value={pVal} onChange={setPVal} placeholder="Field prime" width="100%" isDisabled={isRunning} />
        </Stack>
      );
      case 'mov': return (
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="a (hex)" value={aVal} onChange={setAVal} placeholder="a param" width="100%" isDisabled={isRunning} />
            <TextInput label="b (hex)" value={bVal} onChange={setBVal} placeholder="b param" width="100%" isDisabled={isRunning} />
          </Stack>
          <TextInput label="p (prime, hex)" value={pVal} onChange={setPVal} placeholder="Field prime" width="100%" isDisabled={isRunning} />
        </Stack>
      );
      case 'anomalous': return (
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="a (hex)" value={aVal} onChange={setAVal} placeholder="a param" width="100%" isDisabled={isRunning} />
            <TextInput label="b (hex)" value={bVal} onChange={setBVal} placeholder="b param" width="100%" isDisabled={isRunning} />
          </Stack>
          <TextInput label="p (prime, hex)" value={pVal} onChange={setPVal} placeholder="Field prime" width="100%" isDisabled={isRunning} />
          <Stack direction="horizontal" gap={1}>
            <TextInput label="Qx (hex, required)" value={pxVal} onChange={setPxVal} placeholder="Target point x" width="100%" isDisabled={isRunning} />
            <TextInput label="Qy (hex, required)" value={pyVal} onChange={setPyVal} placeholder="Target point y" width="100%" isDisabled={isRunning} />
          </Stack>
        </Stack>
      );
      case 'singular': return (
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1}>
            <TextInput label="a (hex)" value={aVal} onChange={setAVal} placeholder="a param" width="100%" isDisabled={isRunning} />
            <TextInput label="b (hex)" value={bVal} onChange={setBVal} placeholder="b param" width="100%" isDisabled={isRunning} />
          </Stack>
          <TextInput label="p (prime, hex)" value={pVal} onChange={setPVal} placeholder="Field prime" width="100%" isDisabled={isRunning} />
        </Stack>
      );
      default: return null;
    }
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal, gxVal, gyVal, pxVal, pyVal, pairsMultiline, kbitsVal, malCurve, malMsg, malPriv, peerVal, malCurves, isRunning]);

  return (
    <Stack direction="vertical" gap={2}>
      {!selectedAttack && (
      <Selector
        label="Attack"
        options={ECC_ATTACKS.map(a => ({ value: a.value, label: a.label }))}
        value={attack}
        onChange={setAttack}
        width="100%"
        isDisabled={isRunning}
      />
      )}
      {ECC_ATTACK_EXPLANATIONS[attack] && <AttackExplanationPanel data={ECC_ATTACK_EXPLANATIONS[attack]} />}
      {attackFields}
      <Button
        label={isRunning ? 'Running attack…' : 'Run Attack'}
        variant="primary"
        width="100%"
        onClick={() => { void run(); }}
        isDisabled={isRunning}
        isLoading={isRunning}
      />
      {isRunning && (
        <Text type="body" role="status" aria-live="polite">
          Running attack…
        </Text>
      )}
      {out.result && <ResultBox value={out.result} label="Result" variant="medium" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
