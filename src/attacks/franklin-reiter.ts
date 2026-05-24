import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'franklin-reiter',
  name: 'Franklin-Reiter Related Message Attack',
  category: 'Message / Protocol',
  description: 'Recovers m from related ciphertexts. Use when c1 = m^e and c2 = (a·m + b)^e mod n.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
    { name: 'a', label: 'a (linear coefficient)', placeholder: '1', multiline: false, defaultValue: '1' },
    { name: 'b', label: 'b (constant offset)', placeholder: 'Enter offset b...', multiline: true, rows: 2 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c1 || !vals.c2 || !vals.b) {
      return `print("ERROR: Missing required inputs (n, e, c1, c2, b)")
print("FRANKLIN_REITER=FAILED")`;
    }
    const aVal = vals.a || '1';
    return `def _attack():
    try:
        # Custom GCD for polynomials over Zmod(n) with composite n
        # Sage's built-in gcd() may fail for non-prime modulus
        def poly_gcd(a, b):
            while b != 0:
                a, b = b, a % b
            return a.monic()
        n = Integer(${vals.n})
        e = Integer(${vals.e})
        c1 = Integer(${vals.c1})
        c2 = Integer(${vals.c2})
        a = Integer(${aVal})
        b = Integer(${vals.b})
        R.<x> = PolynomialRing(Zmod(n))
        f1 = x**e - c1
        f2 = (a*x + b)**e - c2
        print(f"f1(x) = x^{e} - c1")
        print(f"f2(x) = ({a}*x + {b})^{e} - c2")
        print()
        g = poly_gcd(f1, f2)
        print(f"GCD degree: {g.degree()}")
        if g.degree() == 1:
            m = -g[0] / g[1]
            print(f"Recovered message: m = {m}")
            v1 = power_mod(Integer(m), e, n)
            v2 = power_mod(Integer(a * m + b), e, n)
            print(f"Verification: m^e mod n = {v1} (c1 = {c1})")
            print(f"Verification: (a*m+b)^e mod n = {v2} (c2 = {c2})")
            if v1 == c1 and v2 == c2:
                print("FRANKLIN_REITER=SUCCESS")
            else:
                print("FRANKLIN_REITER=FAILED")
        elif g.degree() == 0:
            print("GCD is constant - no common root found.")
            print("FRANKLIN_REITER=FAILED")
        else:
            roots = g.roots()
            if roots:
                m_val = Integer(roots[0][0])
                print(f"Recovered m = {m_val}")
                v1 = power_mod(m_val, e, n)
                v2 = power_mod(Integer(a * m_val + b), e, n)
                print(f"Verification: m^e mod n = {v1} == c1? {v1 == c1}")
                print(f"Verification: (a*m+b)^e mod n = {v2} == c2? {v2 == c2}")
                if v1 == c1 and v2 == c2:
                    print("FRANKLIN_REITER=SUCCESS")
                else:
                    print("FRANKLIN_REITER=FAILED")
            else:
                print(f"GCD has degree {g.degree()}, expected 1.")
                print(f"GCD: {g}")
                print("FRANKLIN_REITER=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("FRANKLIN_REITER=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} Given $c_1 \\equiv m^e \\pmod{n}$ and $c_2 \\equiv (am + b)^e \\pmod{n}$, recover $m$ via polynomial GCD.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_1 \\equiv m^e \\pmod{n}$, $c_2 \\equiv (am+b)^e \\pmod{n}$
\\item $\\gcd(a,n) = 1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(x) &= x^e - c_1, \\quad f_2(x) = (ax+b)^e - c_2 \\\\
f_1(m) &\\equiv 0 \\pmod{n}, \\quad f_2(m) \\equiv 0 \\pmod{n} \\\\
\\gcd(f_1,f_2) &= (x - m) \\quad \\text{(with high probability)} \\\\
m &= -g[0] \\cdot g[1]^{-1} \\qed
\\end{align*}

\\textbf{References:} Franklin \\& Reiter, 1996; Boneh, 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c1 && !!p.c2 && !!p.b,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, 3n);
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const a = 1n;
  const b = 12345n;
  return {
    n: n.toString(),
    e: e.toString(),
    c1: encrypt(m, n, e).toString(),
    c2: encrypt((a * m + b) % n, n, e).toString(),
    a: a.toString(),
    b: b.toString(),
  };
};
