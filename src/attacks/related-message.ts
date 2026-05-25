import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'franklin-reiter-related-message',
  name: 'Franklin-Reiter Related Message Attack',
  category: 'Message / Protocol',
  description: 'Recovers m from linearly related ciphertexts. Use when c1 = m^e and c2 = (a·m + b)^e mod n.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c1', label: 'c1 (ciphertext of m)', placeholder: 'Enter c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (ciphertext of a·m + b)', placeholder: 'Enter c2...', multiline: true, rows: 3 },
    { name: 'a', label: 'a (linear coefficient)', placeholder: '2', multiline: false },
    { name: 'b', label: 'b (linear offset)', placeholder: '0', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            e_val = "${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c1 = Integer(${vals.c1})
            c2 = Integer(${vals.c2})
            a_val = "${vals.a}".strip()
            a = Integer(a_val) if a_val else Integer(2)
            b_val = "${vals.b}".strip()
            b = Integer(b_val) if b_val else Integer(0)
            if n < 2 or e < 2 or c1 < 0 or c2 < 0:
                print("Invalid input")
                print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
                return
            print(f"Related Message Attack")
            print(f"n = {n}, e = {e}")
            print(f"c1 = m^e mod n = {c1}")
            print(f"c2 = (a*m + b)^e mod n = {c2}")
            print(f"a = {a}, b = {b}")
            print()
            # Custom GCD for polynomials over Zmod(n) with composite n
            # Sage's built-in gcd() fails for non-prime modulus.
            # Avoid monic() since leading coeff may not be invertible
            # in Zmod(n) for composite n — just return the raw gcd.
            def poly_gcd(p, q):
                while q != 0:
                    p, q = q, p % q
                return p
            # f1(x) = x^e - c1, f2(x) = (a*x + b)^e - c2
            # Both share root x = m over Zmod(n)
            # gcd(f1, f2) = (x - m) -> m = -constant / leading_coeff
            R.<x> = PolynomialRing(Zmod(n))
            f1 = x**e - c1
            f2 = (a * x + b)**e - c2
            g = poly_gcd(f1, f2)
            print(f"GCD degree: {g.degree()}")
            if g.degree() == 1:
                # g(x) = a*x + b over Zmod(n); root m = -b * a^(-1) mod n
                a_coeff = Integer(g[1])
                b_coeff = Integer(g[0])
                try:
                    m_int = Integer((-b_coeff) * inverse_mod(a_coeff, n) % n)
                except (ZeroDivisionError, ValueError):
                    # Leading coeff not invertible — try all candidates
                    m_int = None
                    for r, _ in g.roots():
                        m_int = Integer(r)
                        break
                if m_int is None:
                    print("Could not extract root from degree-1 GCD.")
                    print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
                    return
                print(f"Recovered m = {m_int}")
                v1 = power_mod(m_int, e, n)
                v2 = power_mod(Integer(a * m_int + b), e, n)
                print(f"Verification: m^e mod n = {v1} == c1? {v1 == c1}")
                print(f"Verification: (a*m+b)^e mod n = {v2} == c2? {v2 == c2}")
                if v1 == c1 and v2 == c2:
                    print()
                    print("FRANKLIN_REITER_RELATED_MESSAGE=SUCCESS")
                else:
                    print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
            elif g.degree() == 0:
                print("GCD is constant - no common root found.")
                print("Check that c1, c2 are related by the given a, b.")
                print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
            else:
                roots = g.roots()
                if roots:
                    m_int = Integer(roots[0][0])
                    print(f"Recovered m = {m_int}")
                    v1 = power_mod(m_int, e, n)
                    v2 = power_mod(Integer(a * m_int + b), e, n)
                    print(f"Verification: m^e mod n = {v1} == c1? {v1 == c1}")
                    print(f"Verification: (a*m+b)^e mod n = {v2} == c2? {v2 == c2}")
                    if v1 == c1 and v2 == c2:
                        print()
                        print("FRANKLIN_REITER_RELATED_MESSAGE=SUCCESS")
                    else:
                        print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
                else:
                    print("GCD found but no roots extractable.")
                    print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
_attack()`,
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
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.c1 && !!p.c2,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e);
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const a = 2n;
  const b = 3n;
  const am_b = (a * m + b) % n;
  return {
    n: n.toString(),
    e: e.toString(),
    c1: modPow(m, e, n).toString(),
    c2: modPow(am_b, e, n).toString(),
    a: a.toString(),
    b: b.toString(),
  };
};
