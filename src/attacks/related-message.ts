import type { Attack } from '../types';
import { TESTCASE_BITS, randomPrime } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'related-message',
  name: 'Related Message Attack',
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
  sageTemplate: (v) => `n = Integer(${v.n})
e_val = "${v.e}".strip()
e = Integer(e_val) if e_val else Integer(65537)
c1 = Integer(${v.c1})
c2 = Integer(${v.c2})
a_val = "${v.a}".strip()
a = Integer(a_val) if a_val else Integer(2)
b_val = "${v.b}".strip()
b = Integer(b_val) if b_val else Integer(0)

if n < 2 or e < 2 or c1 < 0 or c2 < 0:
    print("Invalid input")
    print("RELATED_MESSAGE=FAILED")
    return

print(f"Related Message Attack")
print(f"n = {n}, e = {e}")
print(f"c1 = m^e mod n = {c1}")
print(f"c2 = (a·m + b)^e mod n = {c2}")
print(f"a = {a}, b = {b}")
print()

# f1(x) = x^e - c1, f2(x) = (a·x + b)^e - c2
# Both share root x = m over Zmod(n)
# gcd(f1, f2) = (x - m) → m = -constant / leading_coeff

R.<x> = PolynomialRing(Zmod(n))
f1 = x**e - c1
f2 = (a * x + b)**e - c2

g = f1.gcd(f2)
print(f"GCD degree: {g.degree()}")

if g.degree() == 1:
    # g(x) = x - m → m = -g[0] * g[1]^(-1)
    m = (-g[0]) * inverse_mod(g[1], n)
    m = m % n
    print(f"Recovered m = {m}")
    print(f"Verification: m^e mod n = {power_mod(m, e, n)} == c1? {power_mod(m, e, n) == c1}")
    print("RELATED_MESSAGE=SUCCESS")
elif g.degree() == 0:
    print("GCD is constant — no common root found.")
    print("Check that c1, c2 are related by the given a, b.")
    print("RELATED_MESSAGE=FAILED")
else:
    roots = g.roots()
    if roots:
        m = roots[0][0]
        print(f"Recovered m = {m}")
        print(f"Verification: m^e mod n = {power_mod(m, e, n)} == c1? {power_mod(m, e, n) == c1}")
        print("RELATED_MESSAGE=SUCCESS")
    else:
        print("GCD found but no roots extractable.")
        print("RELATED_MESSAGE=FAILED")
`,
  proof: `\\textbf{Theorem:} Given $c_1 = m^e \\bmod n$ and $c_2 = (am + b)^e \\bmod n$, $m$ is recovered via $\\gcd(x^e - c_1, (ax+b)^e - c_2)$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $c_1 = m^e \\bmod n$, $c_2 = (am + b)^e \\bmod n$
\\item $a, b$ — known linear relationship parameters, $a \\not\\equiv 0 \\pmod{n}$
\\item $f_1(x) = x^e - c_1$, $f_2(x) = (ax + b)^e - c_2$
\\item Both polynomials share root $x = m$ over $\\mathbb{Z}_n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(m) &= m^e - c_1 \\equiv 0 \\pmod{n} \\\\
f_2(m) &= (am + b)^e - c_2 \\equiv 0 \\pmod{n} \\\\
\\gcd(f_1, f_2) &= (x - m) \\quad \\text{(with high probability)} \\\\
m &= -\\frac{\\text{constant term}}{\\text{leading coefficient}} \\pmod{n} \\qed
\\end{align*}

\\textbf{Explanation:} Both polynomials vanish at $x = m$. Their GCD over $\\mathbb{Z}_n[x]$ is typically $(x - m)$, directly revealing the plaintext. Works for any linear relationship $am + b$.

\\textbf{References:} Coppersmith et al. (1996); related message attacks on RSA`,
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.c1 && !!p.c2,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
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
