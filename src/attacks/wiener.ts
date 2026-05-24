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
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        def _wiener_attack():
            try:
                n = Integer(${vals.n})
                e = Integer(${vals.e})
                print(f"Wiener's Attack on n = {n}")
                if n < 2 or e < 2:
                    print("Invalid input: n and e must be >= 2")
                    print("WIENER=FAILED")
                    return
                if n % 2 == 0:
                    print(f"n is even: {n}")
                    print(f"p = 2")
                    print(f"q = {n // 2}")
                    print(f"Verification: 2 * {n // 2} = {n}")
                    print("WIENER=SUCCESS")
                    return
                if n.is_prime():
                    print(f"n is prime: {n}")
                    print("No factorization possible")
                    print("WIENER=FAILED")
                    return
                if n.is_square():
                    p = n.isqrt()
                    print(f"n is a perfect square: {p}^2 = {n}")
                    print(f"p = q = {p}")
                    print(f"Verification: p * q = {p * p}")
                    print("WIENER=SUCCESS")
                    return
                cf = continued_fraction(QQ(e) / QQ(n))
                found = False
                for conv in cf.convergents():
                    k, d = conv.numerator(), conv.denominator()
                    if k == 0 or d % 2 == 0:
                        continue
                    if (e * d - 1) % k == 0:
                        phi = (e * d - 1) // k
                        if phi % 2 == 0:
                            s = n - phi + 1
                            disc = s * s - 4 * n
                            if disc > 0 and disc.is_square():
                                t = disc.isqrt()
                                if (s + t) % 2 == 0:
                                    p = (s - t) // 2
                                    q = (s + t) // 2
                                    if p * q == n and p > 1:
                                        print(f"Private exponent d = {d}")
                                        print(f"p = {p}")
                                        print(f"q = {q}")
                                        print(f"Verification: p * q = {p * q}")
                                        print(f"d < n^0.25: {d ** 4 < n}")
                                        print("WIENER=SUCCESS")
                                        found = True
                                        break
                if not found:
                    print("Wiener's attack failed: d may be too large (d >= n^0.25)")
                    print("Try Boneh-Durfee attack for larger d values")
                    print("WIENER=FAILED")
            except BaseException as ex:
                print(f"ERROR: {ex}")
                print("WIENER=FAILED")
        _wiener_attack()
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("WIENER=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $d < n^{1/4}/3$, then $d$ can be recovered from the continued fraction expansion of $e/n$.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed \\equiv 1 \\pmod{\\varphi(n)}$, so $ed - 1 = k\\varphi(n)$
\\item $d < n^{1/4}/3$
\\item Convergents of $e/n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ed - 1 &= k\\varphi(n) \\\\
\\left|\\frac{e}{n} - \\frac{k}{d}\\right| &< \\frac{1}{2d^2} \\qquad (\\text{using } d < n^{1/4}/3) \\\\
\\therefore \\frac{k}{d} &\\text{ is a convergent of } \\frac{e}{n} \\\\
\\text{For each convergent: } \\varphi &= \\frac{ed - 1}{k} \\\\
x^2 - (n - \\varphi + 1)x + n &= 0 \\implies p, q \\qed
\\end{align*}

\\textbf{Explanation:} Compute the continued fraction convergents of $e/n$. For each convergent $k/d$, test if $(ed-1)/k$ is integer, then solve the quadratic to recover $p, q$.

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
