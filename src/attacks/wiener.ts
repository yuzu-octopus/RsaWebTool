import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse } from '../utils/bigint';

export const attack: Attack = {
  id: 'wiener',
  name: "Wiener's Attack",
  category: 'Factorization',
  description: 'Recovers d via continued fractions. Use when d < n^0.25.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})

print(f"Wiener's Attack on n = {n}")
print()

if n < 2 or e < 2:
    print("Invalid input: n and e must be >= 2")
    print("WIENER=FAILED")
    return

# Continued fraction convergents of e/n using SageMath built-in
cf = e.continued_fraction()

found = False
for conv in cf.convergents():
    k, d = conv.numerator(), conv.denominator()
    if k == 0:
        continue
    if (e * d - 1) % k == 0:
        phi = (e * d - 1) // k
        if phi % 2 == 0:
            s = n - phi + 1
            disc = s * s - 4 * n
            if disc > 0 and disc.is_square():
                t = isqrt(disc)
                if (s + t) % 2 == 0:
                    p = (s - t) // 2
                    q = (s + t) // 2
                    if p * q == n and p > 1:
                        print(f"Private exponent d = {d}")
                        print(f"p = {p}")
                        print(f"q = {q}")
                        print(f"Verification: p * q = {p * q}")
                        print(f"d < n^0.25: {d < n ** 0.25}")
                        print("WIENER=SUCCESS")
                        found = True
                        break

if not found:
    print("Wiener's attack failed: d may be too large (d >= n^0.25)")
    print("Try Boneh-Durfee attack for larger d values")
    print("WIENER=FAILED")
`,
  proof: `\\textbf{Theorem:} If d < n^{1/4}/3 and q < p < 2q, then d can be recovered from the continued fraction expansion of e/n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA public key (n, e), private key d with ed \\equiv 1 \\pmod{\\varphi(n)}
\\item ed - 1 = k\\varphi(n) for some integer k
\\item q < p < 2q (balanced primes)
\\item d < n^{1/4}/3
\\item Legendre's theorem: if |\\alpha - a/b| < 1/(2b^2), then a/b is a convergent of \\alpha
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ed - 1 &= k\\varphi(n) \\implies \\frac{e}{\\varphi(n)} = \\frac{k}{d} + \\frac{1}{d\\varphi(n)} \\\\
\\left|\\frac{e}{n} - \\frac{k}{d}\\right| &= \\left|\\frac{e(\\varphi(n) - n)}{n\\varphi(n)} - \\frac{1}{d\\varphi(n)}\\right| \\\\
&= \\left|\\frac{e(p + q - 1)}{n\\varphi(n)} - \\frac{1}{d\\varphi(n)}\\right| \\\\
&< \\frac{e(p + q)}{n\\varphi(n)} < \\frac{3e}{2\\sqrt{n} \\cdot \\varphi(n)} \\\\
d < n^{1/4}/3 &\\implies \\left|\\frac{e}{n} - \\frac{k}{d}\\right| < \\frac{1}{2d^2} \\\\
\\text{By Legendre's theorem, } k/d &\\text{ is a convergent of } e/n \\\\
\\text{For each convergent } k/d: \\quad \\varphi &= (ed - 1)/k \\\\
x^2 - (n - \\varphi + 1)x + n &= 0 \\implies p, q \\qed
\\end{align*}

\\textbf{Explanation:} Compute the continued fraction convergents of e/n. For each convergent k/d, check if (ed - 1) is divisible by k, then solve the quadratic x^2 - (n - \\varphi + 1)x + n = 0. If the roots are integers multiplying to n, you've found d.

\\textbf{References:} M. Wiener, "Cryptanalysis of Short RSA Secret Exponents", IEEE Trans. Info. Theory, 1990`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  // Need d < n^0.25. For 256-bit n, n^0.25 ≈ 2^64. Pick d in [100, 10100].
  let d = BigInt(100 + Math.floor(Math.random() * 10000));
  while (modInverse(d, phi) === null) {
    d += 1n;
  }
  const e = modInverse(d, phi)!;
  return { n: n.toString(), e: e.toString() };
};
