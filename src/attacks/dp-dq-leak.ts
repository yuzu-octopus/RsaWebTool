import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'dp-dq-leak',
  name: 'dp/dq Leak',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from leaked d_p = d mod (p-1). Use when CRT exponent d_p is known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dp', label: 'dp (d mod p-1)', placeholder: 'Enter dp value...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    e = Integer(${v.e})
    dp = Integer(${v.dp})
    if n <= 0 or e <= 0 or dp <= 0:
        print("DP_DQ_LEAK=FAILED: invalid input values")
    else:
        found = False
        num = dp * e - 1
        for k in range(1, e):
            if num % k == 0:
                p_candidate = num // k + 1
                if n % p_candidate == 0:
                    q = n // p_candidate
                    print(f"Verification: p * q = {p_candidate * q}")
                    print(f"DP_DQ_LEAK=SUCCESS")
                    print(f"dp={dp}")
                    print(f"p={p_candidate}")
                    print(f"q={q}")
                    found = True
                    break
        if not found:
            print("DP_DQ_LEAK=FAILED: no valid p found")
except Exception as ex:
    print(f"DP_DQ_LEAK=FAILED: {ex}")`,
  proof: `\\textbf{Theorem:} Given $d_p = d \\bmod (p-1)$, factor $n$ by iterating $k$ in the equation $d_p \\cdot e - 1 = k(p-1)$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA-CRT: $d_p = d \\bmod (p-1)$ satisfies $d_p \\cdot e \\equiv 1 \\pmod{p-1}$
\\item $d_p \\cdot e - 1 = k(p-1)$ for some integer $k \\in [1, e)$
\\item $n = p \\cdot q$ is the RSA modulus
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
d_p \\cdot e &\\equiv 1 \\pmod{p-1} \\\\
d_p \\cdot e - 1 &= k(p-1) \\\\
p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\\\
\\text{Since } d_p < p-1, \\quad k &= \\frac{d_p \\cdot e - 1}{p-1} < e \\\\
\\text{Iterate } k = 1, \\ldots, e-1: \\quad &\\text{check if } k \\mid (d_p \\cdot e - 1) \\\\
p &= (d_p \\cdot e - 1)/k + 1, \\quad \\text{check } p \\mid n \\qed
\\end{align*}

\\textbf{Explanation:} Compute $\\text{num} = d_p \\cdot e - 1$. For each $k \\in [1, e)$, check if $k$ divides num. If so, compute $p = \\text{num}/k + 1$ and verify $p \\mid n$. Since $d_p < p-1$, we have $k < e$, so at most 65536 iterations for standard $e = 65537$.

\\textbf{References:} Standard RSA-CRT analysis`,
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.e && !!p.dp,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const dp = d % (p - 1n);
  return { n: n.toString(), e: e.toString(), dp: dp.toString() };
};
