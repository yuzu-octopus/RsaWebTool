import { useState, useCallback, useMemo, useRef } from 'react';
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

export function ECCAttacksTab() {
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
          const result = `k (nonce): 0x${k.toString(16)}\nPrivate key d: 0x${d.toString(16)}\n\nVerification: k·G should match r\n  r = 0x${rr.toString(16)}`;
          out.dispatch(result, `ECC Attack: ${attack}`);
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
        case 'biased-nonce': {
          if (!nHex.trim() || !pairsMultiline.trim()) throw new Error('Curve order and signature pairs required');
          const nHexClean = nHex.trim().replace(/\s/g, '');
          const nHexPrefix = nHexClean.startsWith('0x') ? nHexClean : '0x' + nHexClean;
          const code = `n = Integer(${nHexPrefix})
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
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
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
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
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
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
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
          if (sageResult.success) out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', `ECC Attack: ${attack}`);
          else out.dispatchError(sageResult.error || 'SageCell execution failed');
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
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal, pxVal, pyVal, pairsMultiline, kbitsVal, execute, out]);

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
            <TextInput label="Qx (hex)" value={pxVal} onChange={setPxVal} placeholder="Target point x" width="100%" isDisabled={isRunning} />
            <TextInput label="Qy (hex)" value={pyVal} onChange={setPyVal} placeholder="Target point y" width="100%" isDisabled={isRunning} />
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
  }, [attack, h1, h2, r1, s1, s2, nHex, aVal, bVal, pVal, xVal, yVal, pxVal, pyVal, pairsMultiline, kbitsVal, isRunning]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector
        label="Attack"
        options={ECC_ATTACKS.map(a => ({ value: a.value, label: a.label }))}
        value={attack}
        onChange={setAttack}
        width="100%"
        isDisabled={isRunning}
      />
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
        <Text type="supporting" role="status" aria-live="polite">
          Running attack…
        </Text>
      )}
      {out.result && <ResultBox value={out.result} label="Result" variant="medium" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
