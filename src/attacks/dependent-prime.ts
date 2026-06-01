import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse, isqrt } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'dependent-prime',
  name: 'Dependent-Prime RSA',
  category: 'Partial Key / Lattice',
  description: 'Factors n when q is derived from e (q·e ≡ 1 mod p) via quadratic discriminant. Use when q = e^{-1} mod p as in some embedded RSA implementations.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'DEPENDENT_PRIME',
    n: vals.n,
    imports: ['import math'],
    useGuard: true,
    body: `        e = Integer(${vals.e})
        if e < 2:
            out.append("DEPENDENT_PRIME=FAILED: e must be >= 2")
        else:
            # Use Python ints for fast iteration
            n_int = int(n)
            e_int = int(e)
            ne_int = n_int * e_int
            found = False
            for k in range(1, 5000001):
                disc = 1 + 4 * k * ne_int
                # Valid squares mod 16 for disc ≡ 1 (mod 4): only 1 and 9
                last_nibble = disc & 15
                if last_nibble != 1 and last_nibble != 9:
                    continue
                sqrt_disc = math.isqrt(disc)
                if sqrt_disc * sqrt_disc == disc:
                    num = -1 + sqrt_disc
                    if num > 0 and num % (2 * k) == 0:
                        p_candidate = num // (2 * k)
                        if p_candidate > 1 and n_int % p_candidate == 0:
                            p_sage = Integer(p_candidate)
                            q_sage = n // p_sage
                            out.append("Dependent-Prime")
                            out.append(f"n = {n}")
                            out.append(f"e = {e}")
                            out.append("")
                            out.append("Results:")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {q_sage}")
                            out.append("")
                            out.append(f"Verification: p * q = {p_sage * q_sage}")
                            out.append("")
                            out.append("DEPENDENT_PRIME=SUCCESS")
                            found = True
                            break
            if not found:
                out.append("DEPENDENT_PRIME=FAILED: no valid factorization found")`,
  }),
  frontendCheck: (vals, onProgress) => {
    if (!vals.n || !vals.e) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const fourNE = 4n * n * e;
      for (let k = 1n; k <= 5000000n; k++) {
        if (onProgress && k % 500000n === 0n) {
          const pct = Number(k * 100n / 5000000n);
          onProgress(pct, `k = ${k.toString()} / 5,000,000`);
        }
        const disc = 1n + k * fourNE;
        // Mod-16 perfect square pre-filter: disc ≡ 1 (mod 4), so valid squares mod 16 are only 1 and 9
        // This rejects ~50% of candidates without calling isqrt
        const lastNybble = Number(disc & 15n);
        if (lastNybble !== 1 && lastNybble !== 9) continue;
        const sqrt_disc = isqrt(disc);
        if (sqrt_disc * sqrt_disc !== disc) continue;
        const num = -1n + sqrt_disc;
        if (num > 0n && num % (2n * k) === 0n) {
          const p = num / (2n * k);
          if (p > 1n && n % p === 0n) {
            const q = n / p;
            onProgress?.(100);
            return Promise.resolve(`Dependent-Prime RSA\nn = ${n}\ne = ${e}\n\nResults:\np = ${p}\nq = ${q}\n\nVerification: p * q = ${p * q}\n\nDEPENDENT_PRIME=SUCCESS`);
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If $qe \\equiv 1 \\pmod{p}$, solve $kp^2 + p - ne = 0$ for $p$ by iterating $k$.

\\textbf{Setup:}
\\begin{itemize}
\\item $qe = 1 + kp$ for some integer $k$
\\item $n = pq$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ne &= p(qe) = p(1 + kp) = p + kp^2 \\\\
kp^2 + p - ne &= 0 \\\\
p &= \\frac{-1 + \\sqrt{1 + 4kne}}{2k} \\\\
\\text{Iterate } k &= 1, \\ldots, 5 \\cdot 10^6:\\quad \\text{check if } 1 + 4kne \\text{ is a perfect square} \\\\
\\text{If so, } p &\\mid n \\implies \\text{factorization found} \\qed
\\end{align*}

\\textbf{Explanation:} Multiplying $n = pq$ by $e$ and substituting $qe = 1 + kp$ yields a quadratic in $p$. The discriminant $\\Delta = 1 + 4kne$ must be a perfect square. The attack iterates $k$ up to $10^5$, using a mod-16 perfect-square pre-filter (only residues 1 and 9 are valid squares mod 16) to reject $\\sim 50\\%$ of candidates without computing an integer square root. This key generation pattern occurs in some embedded RSA implementations that derive $q$ from $p$ to speed up CRT parameter computation.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Mod-16 discriminant pre-filter:} The discriminant $\\Delta = 1 + 4kne$ is checked modulo 16 before computing its integer square root. For $\\Delta \\equiv 1 \\pmod{4}$, the only valid square residues mod 16 are $\\{1, 9\\}$. Candidates with other residue patterns are skipped immediately — rejecting $\\sim 50\\%$ of values without a costly $\\mathtt{isqrt}$ call.
\\end{itemize}

\\textbf{References:} Custom CTF construction; related to Nitaj's constrained prime analysis`,
  usageGuide: 'This attack factors n when q is derived from p through a modular relationship: q·e ≡ 1 (mod p).\n\nHow to use:\n1. You have n and e, and know that q is computed as q = e^(-1) mod p\n2. Provide n and e\n3. The attack solves the equation k*p^2 + p - n*e = 0 to recover p\n\nTip: This key generation pattern occurs in some embedded RSA implementations where q is derived from p to speed up CRT operations.',
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 65537n;
  for (let attempt = 0; attempt < 5000; attempt++) {
    const p = randomPrime(TESTCASE_BITS.p);
    const q = modInverse(e, p);
    if (q !== null && q >= 2n && isPrimeMR(q)) {
      const n = p * q;
      const k = (q * e - 1n) / p;
      if (k > 0n && k < 5000001n) {
        return { n: n.toString(), e: e.toString() };
      }
    }
  }
  throw new Error('dependent-prime: failed to generate testcase after 5000 attempts');
};
