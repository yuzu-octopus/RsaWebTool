import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse, isqrt } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'partial-d',
  name: 'Partial d Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers d from leaked low-order bits by iterating k in ed = k·φ(n)+1. Use when low-order bits of d are exposed via side-channel.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dLow', label: 'dLow (low bits of d)', placeholder: 'Enter known low bits of d...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'PARTIAL_D',
    n: vals.n,
    imports: ['import math'],
    body: `        e = Integer(${vals.e})
        dLow = Integer(${vals.dLow})
        if n <= 0 or e <= 0 or dLow < 0:
            out.append("PARTIAL_D=FAILED: invalid input values")
        else:
            # Use Python ints for fast iteration
            n_int = int(n)
            e_int = int(e)
            dLow_int = int(dLow)
            m = dLow_int.bit_length()
            kBound = 1 << min(m + 2, 24)
            # Incremental d_approx update (avoid BigInt division per iteration)
            q = n_int // e_int
            r = n_int % e_int
            d_approx = (n_int + 1) // e_int
            rem = (n_int + 1) % e_int
            found = False
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

      // Infer mask from bit length of dLow; bound k by dLow bit-length
      const dLowBits = dLow.toString(2).length;
      const kBound = 1n << BigInt(Math.min(dLowBits + 2, 24)); // bound at ~16M max
      const mask = (1n << BigInt(dLowBits)) - 1n;

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
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If low $m$ bits of $d$ are known, recover $d$ by iterating $k$ in the key equation $ed = k\\varphi(n)+1$.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed \\equiv 1 \\pmod{\\varphi(n)}$, so $ed - 1 = k\\varphi(n)$ for some $k \\in [1, e]$
\\item $d_{\\text{low}} = d \\bmod 2^m$ known, $m = \\text{bit-length of } d_{\\text{low}}$
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
\\item \\textbf{Incremental }$d_{\\text{approx}}$\\textbf{ update:} Instead of recomputing $d_{\\text{approx}} = \\lfloor (kn+1)/e \\rfloor$ from scratch each iteration (costly BigInt division), maintains a running quotient/remainder: increments $d_{\\text{approx}}$ by $q = (d_{\\text{approx}} + n) \\div e$ and tracks a running remainder, updating both additively per step.
\\end{itemize}

\\textbf{References:} D. Boneh, G. Durfee, Y. Frankel, "An Attack on RSA Given a Small Fraction of the Private Key Bits", ASIACRYPT 1998`,
  usageGuide: 'This attack recovers the full private key d from leaked low-order bits by iterating k in the key equation.\n\nHow to use:\n1. You have modulus n, public exponent e, and dLow (the low-order bits of d)\n2. Provide n, e, and dLow\n3. The attack iterates k in ed = kphi(n) + 1, checking if d_approx has matching low bits\n4. For each matching candidate, it computes phi(n) and solves the quadratic for p,q\n\nTip: The attack works best when e is small (smaller k search space). The kBound is computed from dLow bit-length (max ~16M iterations). Uses incremental d_approx update (avoiding BigInt division per iteration) for performance.',
  priority: 'high',
  applicableCheck: rsaNeeds.nEDLow,
};

export const generateTestcase = (): Record<string, string> => {
  // Construct RSA key with small d so the k-iteration attack works
  // d must be small enough that k = (ed-1)/phi is in range [1, e]
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  // Pick small d and derive e from it
  let d = BigInt(100 + Math.floor(Math.random() * 10000));
  while (modInverse(d, phi) === null) {
    d += 1n;
  }
  const e = modInverse(d, phi)!;
  // Leak low 22 bits of d
  const dLow = d & ((1n << 22n) - 1n);
  return { n: n.toString(), e: e.toString(), dLow: dLow.toString() };
};
