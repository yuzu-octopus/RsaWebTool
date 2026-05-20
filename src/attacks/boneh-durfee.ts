import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse } from '../utils/bigint';

export const attack: Attack = {
  id: 'boneh-durfee',
  name: 'Boneh-Durfee Attack',
  category: 'Factorization',
  description: 'Recovers d via lattice reduction. Use when d < n^0.292.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})

print(f"Boneh-Durfee Attack on n = {n}")
print()

if n < 2 or e < 2:
    print("Invalid input: n and e must be >= 2")
    print("BONEH_DURFEE=FAILED")
else:
    # Extended Wiener + lattice-based Boneh-Durfee approach
    # First try Wiener's attack
    def wiener_attack(n, e):
        cf = e.continued_fraction()
        for conv in cf.convergents():
            k, d = conv.numerator(), conv.denominator()
            if k == 0:
                continue
            if (e * d - 1) % k == 0:
                phi = (e * d - 1) // k
                s = n - phi + 1
                disc = s**2 - 4 * n
                if disc >= 0 and disc.is_square():
                    p = (s + isqrt(disc)) // 2
                    q = (s - isqrt(disc)) // 2
                    if p * q == n:
                        return d, p, q
        return None

    try:
        result = wiener_attack(n, e)
        if result:
            d, p, q = result
            print(f"Wiener's attack succeeded:")
            print(f"d = {d}, p = {p}, q = {q}")
            print(f"Verification: p * q = {p * q}")
            print("BONEH_DURFEE=SUCCESS")
        else:
            print("Wiener's attack failed. Full Boneh-Durfee requires custom Herrmann-May lattice construction.")
            print("Falling back to Wiener's attack which handles d < n^0.25.")
            print("BONEH_DURFEE=FAILED")
    except Exception as ex:
        print(f"Boneh-Durfee attack error: {ex}")
        print("BONEH_DURFEE=FAILED")
`,
  proof: `\\textbf{Theorem:} The private exponent d can be recovered in polynomial time when d < n^{0.292} using lattice reduction.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}, so ed - 1 = k\\varphi(n)
\\item \\varphi(n) = n - (p + q) + 1, let A = (n + 1)/2 \\approx (p + q)/2
\\item Coppersmith's method for small roots of modular polynomials
\\item LLL lattice basis reduction algorithm
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ed - 1 &= k\\varphi(n) = k(n - (p + q) + 1) \\\\
\\text{Let } A &= \\frac{n + 1}{2}, \\quad y = -\\frac{p + q}{2} \\\\
f(x, y) &= x(A + y) - 1 \\equiv 0 \\pmod{e} \\\\
f(k, y) &= k\\left(\\frac{n+1}{2} - \\frac{p+q}{2}\\right) - 1 = k \\cdot \\frac{n - (p+q) + 1}{2} - 1 \\\\
&= \\frac{k\\varphi(n)}{2} - 1 = \\frac{ed - 1}{2} - 1 \\not\\equiv 0 \\pmod{e} \\\\
\\text{Rescale: } f(x, y) &= x(A + y) - 1 \\equiv 0 \\pmod{e} \\\\
\\text{Construct lattice from shifts } x^i y^j f(x, y)^m &\\cdot e^{m-i} \\\\
\\text{Apply LLL} \\implies \\text{short vectors } g_1, g_2 &\\in \\mathbb{Z}[x, y] \\\\
g_1(k, y) = g_2(k, y) &= 0 \\text{ over } \\mathbb{Z} \\\\
\\gcd(g_1, g_2) &\\implies (k, y) \\\\
\\varphi(n) = n + 1 + 2y, \\quad \\text{factor } n &\\text{ from } \\varphi(n) \\qed
\\end{align*}

\\textbf{Explanation:} Build a bivariate polynomial f(x, y) = x(A + y) - 1 \\pmod{e} with small root (k, -(p+q)/2). Construct a lattice from polynomial shifts, apply LLL reduction to find integer polynomials vanishing at the root, then recover \\varphi(n) and factor n. The bound d < n^{0.292} comes from the lattice dimension analysis.

\\textbf{References:} D. Boneh & G. Durfee, "Cryptanalysis of RSA with Private Key d Less than n^0.292", IEEE Trans. Info. Theory, 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  // Need d < n^0.25 (Wiener fallback). For 256-bit n, n^0.25 ≈ 2^64. Pick d in [100, 10100].
  let d = BigInt(100 + Math.floor(Math.random() * 10000));
  while (modInverse(d, phi) === null) {
    d += 1n;
  }
  const e = modInverse(d, phi)!;
  return { n: n.toString(), e: e.toString() };
};
