import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'simple-lattice',
  name: 'Simple Lattice',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from an approximation. Use when nearp ≈ p with |nearp - p| < n^(1/4).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'nearp', label: 'nearp (approximate p)', placeholder: 'Enter approximate p value...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    nearp = Integer(${v.nearp})
    if n <= 0 or nearp <= 0:
        print("SIMPLE_LATTICE=FAILED: invalid input values")
    else:
        R.<x> = PolynomialRing(Zmod(n))
        f = nearp + x
        # Bound: we expect |x| < n^(1/4) for Coppersmith to work
        bound = ZZ(n**(1/4))
        print(f"Using bound X = {bound}")
        roots = f.small_roots(X=bound, beta=0.5)
        if roots:
            p = Integer(nearp + roots[0])
            if n % p == 0:
                q = n // p
                print(f"Verification: p * q = {p * q}")
                if p * q == n:
                    print(f"SIMPLE_LATTICE=SUCCESS")
                    print(f"p={p}")
                    print(f"q={q}")
                else:
                    print("SIMPLE_LATTICE=FAILED: verification mismatch")
            else:
                print("SIMPLE_LATTICE=FAILED: recovered p does not divide n")
        else:
            print("SIMPLE_LATTICE=FAILED: no roots found")
except Exception as ex:
    print(f"SIMPLE_LATTICE=FAILED: {ex}")`,
  proof: '\\textbf{Theorem:} If $p = p_0 + x$ where $|x| < n^{1/4}$, Coppersmith recovers $p$.\\newline\\newline\\textbf{Prerequisites:} Coppersmith method, polynomial root finding\\newline\\newline\\textbf{Proof:}\\begin{align*}p &= p_0 + x \\\\ f(x) &= p_0 + x \\pmod{n} \\\\ \\text{Coppersmith finds } &x_0 \\text{ when } |x_0| < n^{1/4}\\end{align*}\\newline\\textbf{References:} Coppersmith (1996)',
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.nearp,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const offset = BigInt(Math.floor(Math.random() * 1000) - 500);
  const nearp = p + offset;
  return { n: n.toString(), nearp: nearp.toString() };
};
