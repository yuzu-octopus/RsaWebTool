var e=`import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse, modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'related-message',
  name: 'Franklin-Reiter Related Message Attack',
  category: 'Message / Protocol',
  description: 'Recovers m from two ciphertexts with linearly related plaintexts via polynomial GCD. Use when c1 = m^e and c2 = (a·m + b)^e mod n with known a, b.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c1', label: 'c1 (ciphertext of m)', placeholder: 'Enter c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (ciphertext of a·m + b)', placeholder: 'Enter c2...', multiline: true, rows: 3 },
    { name: 'a', label: 'a (linear coefficient)', placeholder: '2', multiline: false },
    { name: 'b', label: 'b (linear offset)', placeholder: '0', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => \`def _attack():
    try:
        try:
            n = Integer(\${vals.n})
            e_val = "\${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c1 = Integer(\${vals.c1})
            c2 = Integer(\${vals.c2})
            a_val = "\${vals.a}".strip()
            a = Integer(a_val) if a_val else Integer(2)
            b_val = "\${vals.b}".strip()
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
            # Diagnostic: if b = 0, check degenerate case c2 == a^e * c1
            if b == 0:
                ratio_check = power_mod(a, e, n) * c1 % n
                print(f"Diagnostic: a^e * c1 mod n = {ratio_check}")
                print(f"Diagnostic: c2 = {c2}")
                print(f"Diagnostic: match? {ratio_check == c2}")
                if ratio_check == c2:
                    print("WARNING: b=0 and c2 == a^e*c1. Any m satisfies c2 = (am)^e mod n.")
                    print("Cannot recover m uniquely. Try using b != 0.")
                    print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
                    return
                print()
            # f1(x) = x^e - c1, f2(x) = (a*x + b)^e - c2
            # Both share root x = m over Zmod(n)
            R.<x> = PolynomialRing(Zmod(n))
            f1 = x**e - c1
            f2 = (a * x + b)**e - c2
            # Custom GCD for polynomials over Zmod(n) with composite n.
            # Use try/except around p %% q since pseudo-remainder can fail
            # when leading coefficient shares a factor with n.
            def poly_gcd(p, q):
                while q != 0:
                    try:
                        p, q = q, p % q
                    except (ZeroDivisionError, ValueError, TypeError):
                        lc = q.leading_coefficient()
                        g = gcd(Integer(lc), Integer(n))
                        if 1 < g < n:
                            print(f"GCD found factor of n: {g}")
                        break
                return p
            g = poly_gcd(f1, f2)
            print(f"GCD degree: {g.degree()}")
            m_int = None
            if g.degree() == 1:
                a_coeff = Integer(g[1])
                b_coeff = Integer(g[0])
                try:
                    m_int = Integer((-b_coeff) * inverse_mod(a_coeff, n) % n)
                except (ZeroDivisionError, ValueError):
                    for r, _ in g.roots():
                        m_int = Integer(r)
                        break
            elif g.degree() > 1:
                for r, _ in g.roots():
                    m_int = Integer(r)
                    break
            # Fallback: if GCD failed and e == 3, use closed-form elimination.
            # Derivation:
            #   (am+b)^3 = a^3*m^3 + 3a^2*b*m^2 + 3a*b^2*m + b^3 = c2
            #   m^3 = c1
            #   Substitute: 3a^2*b*m^2 + 3a*b^2*m + (b^3 - c2 + a^3*c1) = 0
            #   Multiply by (A*m - B) and use m^3 = c1 to eliminate m^2:
            #   (A*C - B^2)*m = B*C - A^2*c1
            if m_int is None and e == 3:
                print("Trying e=3 closed-form fallback...")
                A = (3 * a^2 * b) % n
                B = (3 * a * b^2) % n
                C = (b^3 - c2 + a^3 * c1) % n
                print(f"Algebraic elimination: {A}*m^2 + {B}*m + {C} = 0 (mod n)")
                if A == 0 and B == 0 and C == 0:
                    print("Degenerate: any m satisfies both equations (b=0 case).")
                elif A == 0 and B == 0:
                    print(f"Contradiction: {C} != 0. a/b values are wrong.")
                elif A == 0:
                    # Linear case: B*m + C = 0
                    try:
                        m_int = Integer((-C) * inverse_mod(B, n) % n)
                        print(f"Linear fallback recovered m = {m_int}")
                    except (ZeroDivisionError, ValueError):
                        print("Linear fallback failed (B not invertible).")
                else:
                    # Quadratic case: use derived formula
                    denom = (A * C - B^2) % n
                    numer = (B * C - A^2 * c1) % n
                    print(f"Denominator (A*C - B^2): {denom}")
                    gd = gcd(Integer(denom), Integer(n))
                    if 1 < gd < n:
                        print(f"Denominator shares factor {gd} with n - trying CRT...")
                        try:
                            p1 = gd
                            q1 = n // p1
                            m_p = Integer(numer % p1 * inverse_mod(denom % p1, p1) % p1)
                            m_q = Integer(numer % q1 * inverse_mod(denom % q1, q1) % q1)
                            m_int = Integer(crt([m_p, m_q], [p1, q1]))
                            print(f"CRT fallback recovered m = {m_int}")
                        except Exception as ex2:
                            print(f"CRT fallback failed: {ex2}")
                    else:
                        try:
                            m_int = Integer(numer * inverse_mod(denom, n) % n)
                            print(f"Quadratic fallback recovered m = {m_int}")
                        except (ZeroDivisionError, ValueError):
                            print("Quadratic fallback failed (denominator not invertible).")
            if m_int is None:
                print("Could not recover message m.")
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
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
_attack()\`,
  frontendCheck: (vals) => {
    if (!vals.n || !vals.c1 || !vals.c2) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const rawE = (vals.e || '').trim();
      const e = rawE ? BigInt(rawE) : 65537n;
      const c1 = BigInt(vals.c1);
      const c2 = BigInt(vals.c2);
      const rawA = (vals.a || '').trim();
      const a = rawA ? BigInt(rawA) : 2n;
      const rawB = (vals.b || '').trim();
      const b = rawB ? BigInt(rawB) : 0n;

      if (n < 2n || e < 2n || c1 < 0n || c2 < 0n) return Promise.resolve(null);
      // Only supports e=3 in frontendCheck (polynomial GCD over composite n is not feasible in JS)
      if (e !== 3n) return Promise.resolve(null);

      // Closed-form solution for e=3 (from sageTemplate):
      // (am+b)^3 = a^3*m^3 + 3a^2*b*m^2 + 3a*b^2*m + b^3 = c2
      // m^3 = c1
      // => A*m^2 + B*m + C = 0 (mod n) where:
      // A = 3*a^2*b, B = 3*a*b^2, C = b^3 - c2 + a^3*c1
      const A = (3n * a * a * b) % n;
      const B = (3n * a * b * b) % n;
      const C = ((b * b * b) - c2 + (a * a * a % n) * c1) % n;
      const nMod = ((C % n) + n) % n;
      const Cnorm = nMod;

      if (A === 0n && B === 0n) {
        // Degenerate or contradiction
        return Promise.resolve(null);
      }
      if (A === 0n) {
        // Linear case: B*m + C = 0 => m = -C * B^(-1) mod n
        if (B === 0n) return Promise.resolve(null);
        const invB = modInverse(B, n);
        if (invB === null) return Promise.resolve(null);
        const m = ((-Cnorm % n) + n) % n * invB % n;
        if (modPow(m, e, n) === c1) {
          return Promise.resolve(\`Recovered m = \${m}\\nFRANKLIN_REITER_RELATED_MESSAGE=SUCCESS\`);
        }
        return Promise.resolve(null);
      }

      // Quadratic case: A*m^2 + B*m + C = 0
      // From the derived formula: (A*C - B^2)*m = B*C - A^2*c1 (mod n)
      const denom = ((A * Cnorm - B * B) % n + n) % n;
      const numer = ((B * Cnorm - A * A % n * c1) % n + n) % n;

      if (denom === 0n) return Promise.resolve(null);
      const invDenom = modInverse(denom, n);
      if (invDenom === null) return Promise.resolve(null);
      const m = (numer * invDenom) % n;

      if (modPow(m, e, n) === c1) {
        return Promise.resolve(\`Recovered m = \${m}\\nFRANKLIN_REITER_RELATED_MESSAGE=SUCCESS\`);
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: \`\\\\textbf{Theorem:} Given $c_1 \\\\equiv m^e \\\\pmod{n}$ and $c_2 \\\\equiv (am + b)^e \\\\pmod{n}$ with known $a, b$ and $\\\\gcd(a, n) = 1$, recover $m$ by computing $\\\\gcd(x^e - c_1, (ax + b)^e - c_2)$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $c_1 \\\\equiv m^e \\\\pmod{n}$, $c_2 \\\\equiv (am+b)^e \\\\pmod{n}$
\\\\item $a, b$ are known and $\\\\gcd(a, n) = 1$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
f_1(x) &= x^e - c_1 \\\\in (\\\\mathbb{Z}/n\\\\mathbb{Z})[x] \\\\\\\\
f_2(x) &= (ax + b)^e - c_2 \\\\in (\\\\mathbb{Z}/n\\\\mathbb{Z})[x] \\\\\\\\
f_1(m) &\\\\equiv m^e - c_1 \\\\equiv 0 \\\\pmod{n} \\\\\\\\
f_2(m) &\\\\equiv (am+b)^e - c_2 \\\\equiv 0 \\\\pmod{n} \\\\\\\\
\\\\gcd(f_1, f_2) &= (x - m) \\\\quad \\\\text{(with high probability)} \\\\\\\\
m &= -g[0] \\\\cdot g[1]^{-1} \\\\pmod{n}
\\\\end{align*}

\\\\textbf{Explanation:} Both polynomials $f_1$ and $f_2$ share $m$ as a root modulo $n$. The polynomial GCD extracts their common linear factor $(x - m)$. For $e = 3$, a closed-form algebraic elimination is available without polynomial arithmetic over composite moduli.

\\\\textbf{References:} Franklin & Reiter, 1996; Boneh, "Twenty Years of Attacks on RSA," 1999\`,
  usageGuide: 'This attack recovers m when two related messages are encrypted with the same public key.\\n\\nHow to use:\\n1. You have two ciphertexts c1, c2 encrypted under the same (n, e)\\n2. The plaintexts are related: m2 = a*m1 + b for known a, b\\n3. Provide n, e, c1, c2, a, and b\\n4. The attack computes gcd(m1^e - c1, (a*m1 + b)^e - c2) to recover m1\\n\\nTip: The attack requires e = 3 for reliable algebraic recovery; e = 5 or 7 may work via polynomial GCD but can fail over composite moduli. For convenience, paste into Magic Mode which auto-detects the parameters.',
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
`;export{e as default};