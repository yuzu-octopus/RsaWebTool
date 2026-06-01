import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd, modPow } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'dp-dq-leak',
  name: 'dp/dq Leak',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from leaked d_p (or q from leaked d_q) via FLT-based GCD. Use when CRT exponents d_p or d_q are known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dp', label: 'dp (d mod p-1)', placeholder: 'Enter dp value...', multiline: true, rows: 3 },
    { name: 'dq', label: 'dq (d mod q-1, optional)', placeholder: 'Enter dq value...', required: false, multiline: true, rows: 3 },
  ],
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      if (n <= 0n || e <= 0n) return null;
      const m = 2n;

      if (vals.dp) {
        const dp = BigInt(vals.dp);
        if (dp > 0n) {
          const exp = e * dp - 1n;
          if (exp > 0n) {
            const x = modPow(m, exp, n);
            const p = gcd(x - 1n, n);
            if (p > 1n && p < n) {
              const q = n / p;
              return `DP-DQ Leak\nn = ${n.toString()}\ne = ${e.toString()}\ndp = ${dp.toString()}\n\nResults:\np = ${p.toString()}\nq = ${q.toString()}\n\nVerification: p * q = ${(p * q).toString()}\n\nDP_DQ_LEAK=SUCCESS`;
            }
          }
        }
      }

      if (vals.dq) {
        const dq = BigInt(vals.dq);
        if (dq > 0n) {
          const exp = e * dq - 1n;
          if (exp > 0n) {
            const x = modPow(m, exp, n);
            const q = gcd(x - 1n, n);
            if (q > 1n && q < n) {
              const p = n / q;
              return `DP-DQ Leak\nn = ${n.toString()}\ne = ${e.toString()}\ndq = ${dq.toString()}\n\nResults:\np = ${p.toString()}\nq = ${q.toString()}\n\nVerification: p * q = ${(p * q).toString()}\n\nDP_DQ_LEAK=SUCCESS`;
            }
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  },
  sageTemplate: (vals: Record<string, string>) => {
    const dpBlock = vals.dp ? `
        dp_val = int(Integer(${vals.dp}))
        if dp_val > 0:
            num = dp_val * e_int - 1
            for k in range(1, e_int):
                if num % k == 0:
                    p_candidate = num // k + 1
                    if p_candidate > 1 and n_int % p_candidate == 0:
                        p_sage = Integer(p_candidate)
                        q_val = n // p_sage
                        out.append("DP-DQ Leak")
                        out.append(f"n = {n}")
                        out.append(f"e = {e}")
                        out.append(f"dp = {dp_val}")
                        out.append("")
                        out.append("Results:")
                        out.append(f"p = {p_sage}")
                        out.append(f"q = {q_val}")
                        out.append("")
                        out.append(f"Verification: p * q = {p_sage * q_val}")
                        out.append("")
                        out.append("DP_DQ_LEAK=SUCCESS")
                        found = True
                        break` : '';

    const dqBlock = vals.dq ? `
        if not found:
            dq_val = int(Integer(${vals.dq}))
            if dq_val > 0:
                num = dq_val * e_int - 1
                for k in range(1, e_int):
                    if num % k == 0:
                        q_candidate = num // k + 1
                        if q_candidate > 1 and n_int % q_candidate == 0:
                            p_val = n // Integer(q_candidate)
                            q_sage = Integer(q_candidate)
                            out.append("DP-DQ Leak")
                            out.append(f"n = {n}")
                            out.append(f"e = {e}")
                            out.append(f"dq = {dq_val}")
                            out.append("")
                            out.append("Results:")
                            out.append(f"p = {p_val}")
                            out.append(f"q = {q_sage}")
                            out.append("")
                            out.append(f"Verification: p * q = {p_val * q_sage}")
                            out.append("")
                            out.append("DP_DQ_LEAK=SUCCESS")
                            found = True
                            break` : '';

    return wrapSageTemplate({
      token: 'DP_DQ_LEAK',
      n: vals.n,
      body: `        e = Integer(${vals.e})
        if n <= 0 or e <= 0:
            out.append("DP_DQ_LEAK=FAILED: invalid input values")
            out.append("DP_DQ_LEAK=FAILED")
        else:
            n_int = int(n)
            e_int = int(e)
            found = False${dpBlock}${dqBlock}
            if not found:
                out.append("DP_DQ_LEAK=FAILED: no valid factor found")
        if not found:
            out.append("DP_DQ_LEAK=FAILED")`,
      useGuard: true,
    });
  },
  proof: `\\textbf{Theorem:} Given $d_p = d \\bmod (p-1)$, factor $n$ by iterating $k$ in $d_p \\cdot e - 1 = k(p-1)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed_p \\equiv 1 \\pmod{p-1}$, so $d_p e - 1 = k(p-1)$ for some $k < e$
\\item Symmetrically, $d_q e - 1 = k'(q-1)$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\quad\\text{(if } k \\text{ divides } d_p e - 1\\text{)} \\\\
\\text{Iterate } k &= 1, \\ldots, e-1:\\quad \\text{check } k \\mid (d_p e - 1) \\\\
p &= \\frac{d_p e - 1}{k} + 1,\\quad \\text{verify } p \\mid n \\\\
\\text{Symmetric for } d_q:\\quad q &= \\frac{d_q e - 1}{k} + 1 \\qed
\\end{align*}

\\textbf{Explanation:} Since $ed_p \\equiv 1 \\pmod{p-1}$, we have $ed_p - 1 = k(p-1)$. Iterating $k$ from 1 to $e-1$, when $k$ divides $ed_p - 1$, compute $p = (ed_p - 1)/k + 1$ and check if $p$ divides $n$. The browser-side frontendCheck uses a faster FLT-based GCD method: compute $g = \\gcd(2^{ed_p - 1} - 1, n)$, which directly yields $p$ without iterating $k$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{FLT-based direct GCD (frontendCheck):} Instead of iterating $k$ from $1$ to $e-1$ (up to $65{,}537$ iterations for standard $e$), computes $g = \\gcd(2^{e \\cdot d_p - 1} - 1, n)$ which directly yields $p$ in a single modular exponentiation and GCD — $\\sim 10^4\\times$ faster for $e = 65537$.
\\end{itemize}

\\textbf{References:} Standard RSA-CRT analysis; M. Campagna, A. Sethi, "Key Recovery Method for CRT Implementation of RSA"`,
  usageGuide: 'This attack factors n using leaked CRT parameters dp and dq.\n\nHow to use:\n1. You have modulus n, public exponent e, and the CRT exponent dp (= d mod p-1)\n2. Optionally provide dq (= d mod q-1) as well\n3. The attack computes p from dp via gcd(pow(2, e*dp - 1, n) - 1, n)\n4. q = n / p gives the factorization\n\nTip: dp and dq are often stored alongside the private key. This attack runs entirely in your browser — no server computation needed.',
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && (!!p.dp || !!p.dq),
};

export const generateTestcase = (): Record<string, string> => {
  const { p, q, n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const dp = d % (p - 1n);
  const dq = d % (q - 1n);
  return { n: n.toString(), e: e.toString(), dp: dp.toString(), dq: dq.toString() };
};
