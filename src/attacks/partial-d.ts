import type { Attack } from '../types';
import { generateSmallDTestcase } from '../utils/testcases/core';
import { isqrt } from '../utils/bigint';
import { bitLength } from './_rsaHelpers';
import { wrapSageTemplate, validateNumeric} from './guard';

export const attack: Attack = {
  id: 'partial-d',
  name: 'Partial d Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers d from leaked low-order bits by iterating k in ed = k·φ(n)+1. Use when low-order bits of d are exposed via side-channel.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dLow', label: 'dLow (low bits of d)', placeholder: 'Enter known low bits of d...', multiline: true, rows: 3 },
    { name: 'dHigh', label: 'dHigh (known high bits of d, MSB mode)', placeholder: 'Enter known high bits of d...', required: false, multiline: true, rows: 3 },
    { name: 'm', label: 'm (known low-bit count)', placeholder: 'e.g. 20 (optional; defaults to dLow bit-length)', required: false, multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'PARTIAL_D',
    n: validateNumeric(vals.n, 'n'),
    imports: ['import math'],
    body: `        e = Integer(${validateNumeric(vals.e, 'e')})
        dLow = Integer(${validateNumeric(vals.dLow, 'dLow')})
        if n <= 0 or e <= 0 or dLow < 0:
            out.append("PARTIAL_D=FAILED: invalid input values")
        else:
            # Use Python ints for fast iteration
            n_int = int(n)
            e_int = int(e)
            dLow_int = int(dLow)
            m_str = "${validateNumeric(vals.m || '', 'm')}".strip()
            # Explicit m when dLow has leading zeros (bit_length would undercount
            # the known bits and shrink both mask and kBound); else default.
            m = int(m_str) if m_str else dLow_int.bit_length()
            if m < 1 or dLow_int >= (1 << m):
                out.append("PARTIAL_D=FAILED: m must be positive with dLow < 2^m")
                m = 0
            kBound = min(1 << min(m + 2, 24), e_int) if m > 0 else 0
            found = False
            # MSB branch (Boneh-Durfee-Frankel): d = dHigh + x with x < 2^t unknown.
            # f(x) = e*(dHigh + x) - 1 has root x0 mod 2^m; small_roots recovers
            # it when the unknown low part fits, then the quadratic verifies d.
            # Beyond this scope (large unknown part) use Boneh-Durfee lattice.
            dHigh_str = "${validateNumeric(vals.dHigh || '', 'dHigh')}".strip()
            if not found and dHigh_str:
                dHigh = Integer(dHigh_str)
                mm = m if m > 0 else dHigh.nbits()
                Rmsb.<x> = PolynomialRing(Zmod(2**mm))
                try:
                    f_msb = e * (dHigh + x) - 1
                    for r in f_msb.small_roots(beta=1.0):
                        d_cand = int(dHigh + r)
                        if d_cand > 0:
                            for k_cand in range(1, min(e_int, 1000000) + 1):
                                if (e_int * d_cand - 1) % k_cand != 0:
                                    continue
                                d_phi = (e_int * d_cand - 1) // k_cand
                                s_q = n_int - d_phi + 1
                                disc_q = s_q * s_q - 4 * n_int
                                if disc_q >= 0:
                                    sq = math.isqrt(disc_q)
                                    if sq * sq == disc_q:
                                        p_c = (s_q - sq) // 2
                                        if p_c > 1 and n_int % p_c == 0:
                                            p_sage = Integer(p_c)
                                            q_sage = n // p_sage
                                            out.append("Partial d (MSB branch)")
                                            out.append(f"n = {n}")
                                            out.append(f"e = {e}")
                                            out.append("")
                                            out.append("Results:")
                                            out.append(f"p = {p_sage}")
                                            out.append(f"q = {q_sage}")
                                            out.append("")
                                            out.append(f"Verification: p * q = {p_sage * q_sage}")
                                            out.append("")
                                            out.append("PARTIAL_D=SUCCESS")
                                            found = True
                                            break
                                if found:
                                    break
                except Exception as ex_msb:
                    out.append(f"MSB branch failed: {ex_msb}")
            if found:
                kBound = 0
            # Incremental d_approx update (avoid BigInt division per iteration)
            q = n_int // e_int
            r = n_int % e_int
            d_approx = (n_int + 1) // e_int
            rem = (n_int + 1) % e_int
            for k in range(1, kBound + 1):
                if (d_approx & ((1 << m) - 1)) == dLow_int:
                    d_phi = (e_int * d_approx - 1) // k
                    s = n_int - d_phi + 1
                    disc = s * s - 4 * n_int
                    if disc >= 0:
                        sqrt_disc = math.isqrt(disc)
                        if sqrt_disc * sqrt_disc == disc:
                            p_candidate = (s + sqrt_disc) // 2
                            if p_candidate > 1 and n_int % p_candidate == 0:
                                p_sage = Integer(p_candidate)
                                q_sage = n // p_sage
                                out.append("Partial d")
                                out.append(f"n = {n}")
                                out.append(f"e = {e}")
                                out.append(f"dLow = {dLow}")
                                out.append("")
                                out.append("Results:")
                                out.append(f"p = {p_sage}")
                                out.append(f"q = {q_sage}")
                                out.append("")
                                out.append(f"Verification: p * q = {p_sage * q_sage}")
                                out.append("")
                                out.append("PARTIAL_D=SUCCESS")
                                found = True
                                break
                # Increment d_approx for next iteration
                d_approx += q
                rem += r
                if rem >= e_int:
                    d_approx += 1
                    rem -= e_int
            if not found:
                out.append("PARTIAL_D=FAILED: no valid d found")
        if not found:
            out.append("PARTIAL_D=FAILED")`,
    useGuard: true,
  }),
  frontendCheck: (vals: Record<string, string>, onProgress?: (pct: number, detail?: string) => void) => {
    if (!vals.n || !vals.e || !vals.dLow) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const dLow = BigInt(vals.dLow);

      // Known-bit count m: explicit input when dLow has leading zeros (its
      // bit-length would then undercount); defaults to dLow bit-length.
      const rawM = (vals.m || '').trim();
      const m = rawM ? BigInt(rawM) : BigInt(bitLength(dLow));
      if (m < 1n || m > 1024n || dLow >= (1n << m)) return Promise.resolve(null);
      const eCap = e < (1n << 24n) ? e : (1n << 24n);
      const want = 1n << BigInt(Math.min(Number(m) + 2, 24)); // bound at ~16M max
      const kBound = want < eCap ? want : eCap; // k < e always (k = (ed-1)/phi)
      const mask = (1n << m) - 1n;

      // Precompute once
      const q = n / e;
      const r = n % e;

      // Initialize for k = 1
      let dApprox = (n + 1n) / e;
      let rem = (n + 1n) % e;

      for (let k = 1n; k <= kBound; k++) {
        if (onProgress && kBound > 10000n && k % 100000n === 0n) {
          const pct = Number(k * 100n / kBound);
          onProgress(pct, `k = ${k.toString()} / ${kBound.toString()}`);
        }
        if ((dApprox & mask) === dLow) {
          // Found candidate — verify
          const phi = (e * dApprox - 1n) / k;
          const s = n - phi + 1n;
          const disc = s * s - 4n * n;
          if (disc >= 0n) {
            const sqrtDisc = isqrt(disc);
            if (sqrtDisc * sqrtDisc === disc) {
              const p = (s - sqrtDisc) / 2n;
              if (p > 0n && n % p === 0n) {
                const qVal = n / p;
                onProgress?.(100);
                return Promise.resolve(`Partial d Key Exposure\nn = ${n}\ne = ${e}\ndLow = ${dLow}\n\nResults:\np = ${p}\nq = ${qVal}\n\nVerification: p * q = ${p * qVal}\n\nPARTIAL_D=SUCCESS`);
              }
            }
          }
        }

        // Update for next iteration (k -> k+1)
        dApprox += q;
        rem += r;
        if (rem >= e) {
          dApprox += 1n;
          rem -= e;
        }
      }
      return Promise.resolve(null);
    } catch (e) { console.warn('[partial-d] frontendCheck error:', e); return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If low $m$ bits of $d$ are known, recover $d$ by iterating $k$ in the key equation $ed = k\\varphi(n)+1$.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed \\equiv 1 \\pmod{\\varphi(n)}$, so $ed - 1 = k\\varphi(n)$ for some $k \\in [1, e]$
\\item $d_{\\text{low}} = d \\bmod 2^m$ known, $m$ = explicit known-bit count input (defaults to bit-length of $dLow$; pass it explicitly when $dLow$ has leading zeros)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Since } \\varphi(n) &\\approx n,\\quad d \\approx \\frac{kn + 1}{e} \\\\
d_{\\text{approx}} &= \\left\\lfloor \\frac{kn + 1}{e} \\right\\rfloor \\\\
d_{\\text{approx}} \\bmod 2^m &\\stackrel{?}{=} d_{\\text{low}} \\\\
\\varphi &= (ed_{\\text{approx}} - 1)/k \\\\
x^2 - (n - \\varphi + 1)x + n &= 0 \\\\implies p,q \\qed
\\end{align*}

\\textbf{Explanation:} For each $k \\in [1,e]$, compute $d_{\\text{approx}} = \\lfloor(kn+1)/e\\rfloor$. If the low $m$ bits match $d_{\\text{low}}$, recover $\\varphi(n) = (ed-1)/k$ and solve the quadratic $x^2 - (n-\\varphi+1)x + n = 0$ for $p$ and $q$. The search bound is limited to $k < 2^{m+2}$ (cap at $\\sim 16\\times 10^6$) for efficiency.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Incremental }$d_{\\text{approx}}$\\textbf{ update:} Instead of recomputing $d_{\\text{approx}} = \\lfloor (kn+1)/e \\rfloor$ from scratch each iteration (costly BigInt division), maintains a running quotient/remainder: increments $d_{\\text{approx}}$ by the constant $q = n \\div e$ per step (since $d_{\\text{approx}}$ for $k+1$ equals $d_{\\text{approx}}$ for $k$ plus $n/e$), and tracks a running remainder that handles the floor division.
\\end{itemize}

\\textbf{Scope:} LSB-only: $dLow = d \\bmod 2^m$ must be the low $m$ bits of $d$. The $k$-iteration reaches $k < 2^{m+2}$ (capped at $\\sim 16\\times 10^6$); full-size $d$ needs the Boneh-Durfee-Frankel lattice (Coppersmith on the key equation mod $2^m$), which is not implemented here.

\\textbf{References:} D. Boneh, G. Durfee, Y. Frankel, "An Attack on RSA Given a Small Fraction of the Private Key Bits", ASIACRYPT 1998`,
  usageGuide: 'This attack recovers the full private key d from leaked low-order bits by iterating k in the key equation.\n\nHow to use:\n1. You have modulus n, public exponent e, and dLow (the low-order bits of d)\n2. Provide n, e, dLow, and m (the known low-bit count; optional when dLow has no leading zeros)\n3. The attack iterates k in ed = kphi(n) + 1, checking if d_approx has matching low bits\n4. For each matching candidate, it computes phi(n) and solves the quadratic for p,q\n\nMSB mode: provide dHigh (known high bits of d) with m = unknown low-bit count (defaults to dHigh bit-length); Sage solves e·(dHigh+x) - 1 = 0 mod 2^m via small_roots (Boneh-Durfee-Frankel) and verifies each root through the key-equation quadratic. See also Boneh-Durfee (full small-d lattice) and Partial p/q Bits (prime-MSB lattice).\n\nTip: The attack works best when e is small (smaller k search space). The kBound is 2^(m+2) (max ~16M iterations). LSB-only scope: only low bits are supported — full-size d needs a Coppersmith lattice (Boneh-Durfee-Frankel), not implemented here. Uses incremental d_approx update (avoiding BigInt division per iteration) for performance.',
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && (!!p.dLow || !!p.dHigh),
};

export const generateTestcase = (): Record<string, string> => {
  // Use the shared small-d generator to get a keypair with d in [100, 10100],
  // then leak the low 20 bits of d. generateWienerTestcase doesn't fit because
  // Wiener d (up to n^0.25) is too large for the partial-d kBound cap (2^24).
  const kp = generateSmallDTestcase();
  const dLow = kp.d & ((1n << 20n) - 1n);
  return { n: kp.n.toString(), e: kp.e.toString(), dLow: dLow.toString() };
};
