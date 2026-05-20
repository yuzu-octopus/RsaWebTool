import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'small-crt-exp',
  name: 'Small CRT Exponent',
  category: 'Partial Key / Lattice',
  description: 'Factors n when d_p = d mod (p-1) is small. Use when d_p < 10^6.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'bound', label: 'bound (max d_p, optional)', placeholder: 'Default 1000000', multiline: false },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    e = Integer(${v.e})
    bound = ${v.bound ? `Integer(${v.bound})` : '1000000'}
    if n <= 0 or e <= 0 or bound <= 0:
        print("SMALL_CRT_EXP=FAILED: invalid input values")
    else:
        found = False
        for k in range(1, e):
            if gcd(e, k) != 1:
                continue
            dp0 = inverse_mod(e, k)
            for dp in range(dp0, bound + 1, k):
                num = dp * e - 1
                p_candidate = num // k + 1
                if p_candidate > 1 and n % p_candidate == 0:
                    q = n // p_candidate
                    print(f"Verification: p * q = {p_candidate * q}")
                    print("SMALL_CRT_EXP=SUCCESS")
                    print(f"dp={dp}")
                    print(f"p={p_candidate}")
                    print(f"q={q}")
                    found = True
                    break
            if found:
                break
        if not found:
            print("No small dp found within bound.")
            print("SMALL_CRT_EXP=FAILED")
except Exception as ex:
    print(f"SMALL_CRT_EXP=FAILED: {ex}")`,
  proof: `\\textbf{Theorem:} If $d_p = d \\bmod (p-1)$ is small, $p$ can be recovered by exhaustive search over $k$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA-CRT: $d_p = d \\bmod (p-1)$, $d_q = d \\bmod (q-1)$
\\item $d_p \\cdot e \\equiv 1 \\pmod{p-1}$
\\item $d_p \\cdot e - 1 = k(p-1)$ for some integer $k$
\\item $d_p$ is small (e.g., $d_p < 10^6$)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
d_p \\cdot e &\\equiv 1 \\pmod{p-1} \\\\
d_p \\cdot e - 1 &= k(p-1) \\\\
p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\\\
\\text{For each } k \\in [1, e): \\quad &\\text{compute } d_p \\equiv e^{-1} \\pmod{k} \\\\
\\text{Iterate } d_p &= d_{p0}, d_{p0}+k, d_{p0}+2k, \\ldots \\le \\text{bound} \\\\
\\text{Check if } p \\mid n &\\implies \\text{factorization found} \\qed
\\end{align*}

\\textbf{Explanation:} From $d_p \\cdot e \\equiv 1 \\pmod{p-1}$, we get $p = (d_p \\cdot e - 1)/k + 1$. For each $k \\in [1, e)$, compute $d_{p0} = e^{-1} \\bmod k$, then iterate $d_p = d_{p0} + j \\cdot k$ up to the bound. For each candidate, check if $p$ divides $n$.

\\textbf{References:} Standard RSA-CRT analysis; see also Jochemsz-May attack on small CRT exponents`,
  priority: 'medium',
  applicableCheck: (p) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 65537n;
  // Construct p where d_p = e^(-1) mod (p-1) is small
  // d_p * e - 1 = k * (p-1) → p = (d_p * e - 1) / k + 1
  for (let dp = 3n; dp < 10000n; dp++) {
    const num = dp * e - 1n;
    // Try divisors k of num
    for (let k = 1n; k <= e; k++) {
      if (num % k !== 0n) continue;
      const p = num / k + 1n;
      if (p > 2n && isPrimeMR(p)) {
        const q = randomPrime(TESTCASE_BITS.q);
        return { n: (p * q).toString(), e: e.toString() };
      }
    }
  }
  // Fallback: should never reach here given the search space
  throw new Error('small-crt-exp: failed to generate testcase');
};
