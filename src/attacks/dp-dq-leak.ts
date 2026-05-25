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
              return `Verification: p * q = ${(p * q).toString()}\ndp = ${dp.toString()}\np = ${p.toString()}\nq = ${q.toString()}\n\nDP_DQ_LEAK=SUCCESS`;
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
              return `Verification: p * q = ${(p * q).toString()}\ndq = ${dq.toString()}\np = ${p.toString()}\nq = ${q.toString()}\n\nDP_DQ_LEAK=SUCCESS`;
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
        dp = Integer(${vals.dp})
        if dp > 0:
            num = dp * e - 1
            for k in range(1, e):
                if num % k == 0:
                    p_candidate = num // k + 1
                    if n % p_candidate == 0:
                        q_val = n // p_candidate
                        print(f"Verification: p * q = {p_candidate * q_val}")
                        print(f"dp = {dp}")
                        print(f"p = {p_candidate}")
                        print(f"q = {q_val}")
                        print()
                        print("DP_DQ_LEAK=SUCCESS")
                        found = True
                        break` : '';

    const dqBlock = vals.dq ? `
        if not found:
            dq = Integer(${vals.dq})
            if dq > 0:
                num = dq * e - 1
                for k in range(1, e):
                    if num % k == 0:
                        q_candidate = num // k + 1
                        if n % q_candidate == 0:
                            p_val = n // q_candidate
                            print(f"Verification: p * q = {p_val * q_candidate}")
                            print(f"dq = {dq}")
                            print(f"p = {p_val}")
                            print(f"q = {q_candidate}")
                            print()
                            print("DP_DQ_LEAK=SUCCESS")
                            found = True
                            break` : '';

    return `def _attack():
    try:
        n = Integer(${vals.n})
        e = Integer(${vals.e})
        if n <= 0 or e <= 0:
            print("DP_DQ_LEAK=FAILED: invalid input values")
        else:
            found = False${dpBlock}${dqBlock}
            if not found:
                print("DP_DQ_LEAK=FAILED: no valid factor found")
    except Exception as ex:
        print(f"DP_DQ_LEAK=FAILED: {ex}")
_attack()`;
  },
  proof: `\\textbf{Theorem:} Given $d_p = d \\bmod (p-1)$, factor $n$ by iterating $k$ in $d_p \\cdot e - 1 = k(p-1)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $d_p \\cdot e \\equiv 1 \\pmod{p-1}$
\\item $d_p \\cdot e - 1 = k(p-1)$, $k < e$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\\\
\\text{Iterate } k &= 1, \\ldots, e-1: \\quad \\text{check } k \\mid (d_p \\cdot e - 1) \\\\
p &= (d_p \\cdot e - 1)/k + 1, \\quad \\text{verify } p \\mid n \\\\
\\text{Symmetric for } d_q:\\quad q &= (d_q \\cdot e - 1)/k + 1 \\qed
\\end{align*}

\\textbf{References:} Standard RSA-CRT analysis; M. Campagna, A. Sethi, "Key Recovery Method for CRT Implementation of RSA"`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && (!!p.dp || !!p.dq),
};

export const generateTestcase = (): Record<string, string> => {
  const { p, q, n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const dp = d % (p - 1n);
  const dq = d % (q - 1n);
  return { n: n.toString(), e: e.toString(), dp: dp.toString(), dq: dq.toString() };
};
