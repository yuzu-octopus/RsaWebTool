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
    return `try:
    n = Integer(${vals.n})
    e = Integer(${vals.e})
    c1 = Integer(${vals.c1})
    c2 = Integer(${vals.c2})
    a = Integer(${aVal})
    b = Integer(${vals.b})

    R.<x> = PolynomialRing(Zmod(n))

    # f1(x) = x^e - c1
    # f2(x) = (a*x + b)^e - c2
    f1 = x**e - c1
    f2 = (a*x + b)**e - c2

    print(f"f1(x) = x^{e} - c1")
    print(f"f2(x) = ({a}*x + {b})^{e} - c2")
    print()

    # Compute GCD
    g = gcd(f1, f2)
    print(f"GCD degree: {g.degree()}")

    if g.degree() == 1:
        # g(x) = x - m, so m = -constant_term / leading_coefficient
        m = -g[0] / g[1]
        print(f"Recovered message: m = {m}")

        # Verify
        v1 = power_mod(Integer(m), e, n)
        v2 = power_mod(Integer(a * m + b), e, n)
        print(f"Verification: m^e mod n = {v1} (c1 = {c1})")
        print(f"Verification: (a*m+b)^e mod n = {v2} (c2 = {c2})")

        if v1 == c1 and v2 == c2:
            print("FRANKLIN_REITER=SUCCESS")
        else:
            print("FRANKLIN_REITER=FAILED")
    else:
        print(f"GCD has degree {g.degree()}, cannot extract unique solution.")
        print(f"GCD: {g}")
        print("FRANKLIN_REITER=FAILED")
except Exception as e:
    print(f"ERROR: {e}")
    print("FRANKLIN_REITER=FAILED")
`;
  },
  proof: `\\textbf{Theorem:} Given c_1 \\equiv m^e \\pmod{n} and c_2 \\equiv (am + b)^e \\pmod{n} with known a, b, recover m via polynomial GCD over \\mathbb{Z}/n\\mathbb{Z}.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, c_1, c_2, a, b (modulus, exponent, two ciphertexts, linear relation)
\\item m_2 = a \\cdot m_1 + b (known affine relation)
\\item \\gcd(a, n) = 1
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(x) &= x^e - c_1 \\in (\\mathbb{Z}/n\\mathbb{Z})[x] \\\\
f_2(x) &= (ax + b)^e - c_2 \\in (\\mathbb{Z}/n\\mathbb{Z})[x] \\\\
f_1(m) &= m^e - c_1 \\equiv 0 \\pmod{n} \\\\
f_2(m) &= (am + b)^e - c_2 \\equiv 0 \\pmod{n} \\\\
(x - m) \\mid \\gcd(f_1, f_2) & \\\\
g(x) = \\gcd(f_1, f_2), \\quad \\deg(g) = 1 &\\implies g(x) = x - m \\\\
m &= -g[0] / g[1] \\qed
\\end{align*}

\\textbf{Explanation:} Build two polynomials that both have m as a root. Their GCD is (x − m) for generic a, b. Extract m from the linear GCD's coefficients.

\\textbf{References:} M. Franklin & M. Reiter, "On the Security of RSA Padding", 1996; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c1 && !!p.c2,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const a = 1n, b = 12345n;
  return { n: n.toString(), e: e.toString(), c1: encrypt(m, n, e).toString(), c2: encrypt((a * m + b) % n, n, e).toString(), a: a.toString(), b: b.toString() };
};
