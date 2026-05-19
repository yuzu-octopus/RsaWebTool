import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'partial-d',
  name: 'Partial Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from low bits of d. Use when LSBs of private exponent d are leaked.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dLow', label: 'dLow (low bits of d)', placeholder: 'Enter known low bits of d...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    e = Integer(${v.e})
    dLow = Integer(${v.dLow})
    if n <= 0 or e <= 0 or dLow < 0:
        print("PARTIAL_D=FAILED: invalid input values")
    else:
        m = dLow.bit_length()
        found = False
        for k in range(1, e + 1):
            d_approx = (k * n + 1) // e
            if d_approx % (2**m) == dLow:
                d = d_approx
                phi = (e * d - 1) // k
                s = n - phi + 1
                disc = s*s - 4*n
                if disc >= 0:
                    sqrt_disc = isqrt(disc)
                    if sqrt_disc * sqrt_disc == disc:
                        p = (s + sqrt_disc) // 2
                        q = (s - sqrt_disc) // 2
                        if p * q == n:
                            print(f"Verification: p * q = {p * q}")
                            print(f"PARTIAL_D=SUCCESS")
                            print(f"d={d}")
                            print(f"p={p}")
                            print(f"q={q}")
                            found = True
                            break
        if not found:
            print("PARTIAL_D=FAILED: no valid d found")
except Exception as ex:
    print(f"PARTIAL_D=FAILED: {ex}")`,
  proof: '\\textbf{Theorem:} If low bits of $d$ are known, full $d$ can be recovered when $d$ is small.\\newline\\newline\\textbf{Prerequisites:} Hensel lifting, RSA key equation\\newline\\newline\\textbf{Proof:}\\begin{align*}ed &\\equiv 1 \\pmod{\\varphi(n)} \\\\ d &= d_{\\text{high}} \\cdot 2^m + d_{\\text{low}} \\\\ \\text{For each } k: \\quad d &\\approx \\frac{k \\cdot n}{e} \\\\ \\text{Check if } d \\bmod 2^m &= d_{\\text{low}}\\end{align*}\\newline\\textbf{References:} Boneh, Durfee, Frankel (1998)',
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.e && !!p.dLow,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const dLow = d & ((1n << 20n) - 1n);
  return { n: n.toString(), e: e.toString(), dLow: dLow.toString() };
};
