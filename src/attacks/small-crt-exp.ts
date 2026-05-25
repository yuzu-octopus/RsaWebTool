import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'small-crt-exp',
  name: 'Small CRT Exponent',
  category: 'Partial Key / Lattice',
  description: 'Factors n via brute-force search over k and d_p. Use when the CRT exponent d_p = d mod (p-1) is small (< bound). Each (k, d_p) pair gives a candidate p = (d_p * e - 1) / k + 1.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'bound', label: 'bound (max d_p, optional)', placeholder: 'Default 1000000', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `import math
def _attack():
    try:
        n = Integer(${vals.n})
        e = Integer(${vals.e})
        bound = ${vals.bound ? `Integer(${vals.bound})` : 'Integer(50000)'}
        if n <= 0 or e <= 0 or bound <= 0:
            print("SMALL_CRT_EXP=FAILED: invalid input values")
        else:
            # Use Python ints for fast iteration (avoids Sage Integer overhead)
            n_int = int(n)
            e_int = int(e)
            bound_int = int(bound)
            found = False
            for k in range(1, e_int):
                if math.gcd(e_int, k) != 1:
                    continue
                dp0 = pow(e_int, -1, k)
                for dp in range(dp0, bound_int + 1, k):
                    p_candidate = (dp * e_int - 1) // k + 1
                    if p_candidate > 1 and n_int % p_candidate == 0:
                        p_sage = Integer(p_candidate)
                        q_sage = n // p_sage
                        print(f"Verification: p * q = {p_sage * q_sage}")
                        print(f"dp = {dp}")
                        print(f"p = {p_sage}")
                        print(f"q = {q_sage}")
                        print()
                        print("SMALL_CRT_EXP=SUCCESS")
                        found = True
                        break
                if found:
                    break
            if not found:
                print("No small dp found within bound.")
                print("SMALL_CRT_EXP=FAILED")
    except Exception as ex:
        print(f"SMALL_CRT_EXP=FAILED: {ex}")
_attack()`,
  proof: `\\textbf{Theorem:} If $d_p = d \\bmod (p-1)$ is small ($< 10^6$), exhaustive search over $k$ recovers $p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $d_p \\cdot e \\equiv 1 \\pmod{p-1}$
\\item $d_p \\cdot e - 1 = k(p-1)$ for some $k$
\\item $d_p$ small ($< 10^6$)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\\\
\\text{For } k \\in [1, e): \\quad d_p &\\equiv e^{-1} \\pmod{k} \\\\
\\text{Iterate } d_p &= d_{p0}, d_{p0}+k, d_{p0}+2k, \\ldots \\le \\text{bound} \\\\
\\text{Check } p \\mid n &\\implies \\text{factorization found} \\qed
\\end{align*}

\\textbf{References:} Standard RSA-CRT analysis; see also Jochemsz-May attack on small CRT exponents`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 65537n;
  // Backward construction: pick a small d_p, then derive p from the CRT equation
  // d_p * e - 1 = k * (p-1) → p = (d_p * e - 1) / k + 1
  // For each candidate d_p (starting at 3), iterate over divisors k of (d_p * e - 1)
  // that yield a prime p. The resulting p is typically small (≈ 16-30 bits).
  // This ensures the attack's brute-force search finds d_p within the bound.
  for (let dp = 3n; dp < 10000n; dp++) {
    const num = dp * e - 1n;
    for (let k = 1n; k <= e; k++) {
      if (num % k !== 0n) continue;
      const p = num / k + 1n;
      if (p > 2n && isPrimeMR(p)) {
        const q = randomPrime(TESTCASE_BITS.q);
        return { n: (p * q).toString(), e: e.toString(), bound: '50000' };
      }
    }
  }
  throw new Error('small-crt-exp: failed to generate testcase');
};
