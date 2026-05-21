import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd, modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'dp-dq-leak',
  name: 'dp/dq Leak',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from leaked d_p = d mod (p-1) or q from leaked d_q = d mod (q-1). Use when CRT exponents are known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dp', label: 'dp (d mod p-1)', placeholder: 'Enter dp value...', multiline: true, rows: 3 },
    { name: 'dq', label: 'dq (d mod q-1, optional)', placeholder: 'Enter dq value...', multiline: true, rows: 3 },
  ],
  frontendCheck: async (vals) => {
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
              return `Verification: p * q = ${(p * q).toString()}\nDP_DQ_LEAK=SUCCESS\ndp=${dp.toString()}\np=${p.toString()}\nq=${q.toString()}`;
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
              return `Verification: p * q = ${(p * q).toString()}\nDP_DQ_LEAK=SUCCESS\ndq=${dq.toString()}\np=${p.toString()}\nq=${q.toString()}`;
            }
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  },
  sageTemplate: (v) => {
    const dpBlock = v.dp ? `
        dp = Integer(${v.dp})
        if dp > 0:
            num = dp * e - 1
            for k in range(1, e):
                if num % k == 0:
                    p_candidate = num // k + 1
                    if n % p_candidate == 0:
                        q_val = n // p_candidate
                        print(f"Verification: p * q = {p_candidate * q_val}")
                        print("DP_DQ_LEAK=SUCCESS")
                        print(f"dp={dp}")
                        print(f"p={p_candidate}")
                        print(f"q={q_val}")
                        found = True
                        break` : '';

    const dqBlock = v.dq ? `
        if not found:
            dq = Integer(${v.dq})
            if dq > 0:
                num = dq * e - 1
                for k in range(1, e):
                    if num % k == 0:
                        q_candidate = num // k + 1
                        if n % q_candidate == 0:
                            p_val = n // q_candidate
                            print(f"Verification: p * q = {p_val * q_candidate}")
                            print("DP_DQ_LEAK=SUCCESS")
                            print(f"dq={dq}")
                            print(f"p={p_val}")
                            print(f"q={q_candidate}")
                            found = True
                            break` : '';

    return `try:
    n = Integer(${v.n})
    e = Integer(${v.e})
    if n <= 0 or e <= 0:
        print("DP_DQ_LEAK=FAILED: invalid input values")
    else:
        found = False${dpBlock}${dqBlock}
        if not found:
            print("DP_DQ_LEAK=FAILED: no valid factor found")
except Exception as ex:
    print(f"DP_DQ_LEAK=FAILED: {ex}")`;
  },
  proof: `\\textbf{Theorem:} Given $d_p = d \\bmod (p-1)$, factor $n$ by iterating $k$ in the equation $d_p \\cdot e - 1 = k(p-1)$. Symmetrically, $d_q = d \\bmod (q-1)$ recovers $q$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA-CRT: $d_p = d \\bmod (p-1)$ satisfies $d_p \\cdot e \\equiv 1 \\pmod{p-1}$
\\item Symmetrically: $d_q = d \\bmod (q-1)$ satisfies $d_q \\cdot e \\equiv 1 \\pmod{q-1}$
\\item $d_p \\cdot e - 1 = k(p-1)$ for some integer $k \\in [1, e)$
\\item $n = p \\cdot q$ is the RSA modulus
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
d_p \\cdot e &\\equiv 1 \\pmod{p-1} \\\\
d_p \\cdot e - 1 &= k(p-1) \\\\
p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\\\
\\text{Since } d_p < p-1, \\quad k &= \\frac{d_p \\cdot e - 1}{p-1} < e \\\\
\\text{Iterate } k &= 1, \\ldots, e-1: \\quad \\text{check if } k \\mid (d_p \\cdot e - 1) \\\\
p &= (d_p \\cdot e - 1)/k + 1, \\quad \\text{check } p \\mid n \\\\
\\text{Symmetric for } d_q:\\quad q &= (d_q \\cdot e - 1)/k + 1, \\quad \\text{check } q \\mid n \\qed
\\end{align*}

\\textbf{Explanation:} Compute $\\text{num} = d_p \\cdot e - 1$. For each $k \\in [1, e)$, check if $k$ divides num. If so, compute $p = \\text{num}/k + 1$ and verify $p \\mid n$. Since $d_p < p-1$, we have $k < e$, so at most 65536 iterations for standard $e = 65537$. The same method works for $d_q$ to recover $q$. A fast pre-check using GCD: $\\gcd(n, m^{e \\cdot d_p - 1} - 1 \\bmod n) = p$ with high probability for random $m$, providing an O($\\log n$) alternative to the O($e$) iteration scan.

\\textbf{References:} Standard RSA-CRT analysis; M. Campagna, A. Sethi, "Key Recovery Method for CRT Implementation of RSA"`,
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.e && (!!p.dp || !!p.dq),
};

export const generateTestcase = (): Record<string, string> => {
  const { p, q, n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const dp = d % (p - 1n);
  const dq = d % (q - 1n);
  return { n: n.toString(), e: e.toString(), dp: dp.toString(), dq: dq.toString() };
};
