import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'fermat',
  name: 'Fermat Factorization',
  category: 'Factorization',
  description: 'Factors n when p and q are close. Use when |p - q| < 2·n^(1/4).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"Fermat Factorization on n = {n}")
print()

# Pre-checks
if n < 2:
    print(f"n = {n} is too small to factor")
    print("FERMAT=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("FERMAT=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("FERMAT=FAILED")
    return
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print(f"Verification: p * q = {p * p}")
    print("FERMAT=SUCCESS")
    return

# Optimized Fermat (RsaCtfTool algorithm)
# Uses incremental update: b2 += c, c += 2 instead of recomputing a^2 - n
a, rem = n.sqrtrem()
b2 = -rem
c = (a << 1) + 1
max_iter = 10**6
iterations = 0

while not b2.is_square():
    iterations += 1
    if iterations > max_iter:
        print(f"Fermat factorization failed: no factor found within {max_iter} iterations")
        print("p and q may not be close enough for this method")
        print("FERMAT=FAILED")
        return
    b2 += c
    c += 2

a = (c - 1) >> 1
b = isqrt(b2)
p = a - b
q = a + b

if p <= 1 or q >= n:
    print(f"Found trivial factorization: {p} x {q} = {n}")
    print("No non-trivial factors found via Fermat")
    print("FERMAT=FAILED")
else:
    print(f"p = {p}")
    print(f"q = {q}")
    print(f"Verification: p * q = {p * q}")
    print(f"p is prime: {p.is_prime()}")
    print(f"q is prime: {q.is_prime()}")
    print(f"Iterations: {iterations}")
    print("FERMAT=SUCCESS")
`,
  proof: `\\textbf{Theorem:} If n = p \\cdot q with |p - q| < 2n^{1/4}, then n can be factored by finding a such that a^2 - n = b^2.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = p \\cdot q, p and q odd primes
\\item |p - q| < 2n^{1/4} (primes must be close)
\\item Difference of squares: a^2 - b^2 = (a - b)(a + b)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
a &= \\frac{p + q}{2}, \\quad b = \\frac{q - p}{2} \\\\
a^2 - b^2 &= \\frac{(p+q)^2 - (q-p)^2}{4} = \\frac{4pq}{4} = pq = n \\\\
|p - q| \\text{ small} &\\implies b \\text{ small} \\\\
a = \\sqrt{n + b^2} &\\approx \\sqrt{n} \\\\
\\text{Start from } a_0 = \\lceil\\sqrt{n}\\rceil, \\text{ iterate } a &\\text{ until } a^2 - n = b^2 \\\\
p = a - b, \\quad q &= a + b \\qed
\\end{align*}

\\textbf{Explanation:} Starting from \\lceil\\sqrt{n}\\rceil, increment a until a^2 - n is a perfect square b^2. Then p = a - b and q = a + b. The number of iterations equals (q - p)/2, so it's efficient only when p and q are close.

\\textbf{References:} Hardy & Wright, "An Introduction to the Theory of Numbers", Section 10.2`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const delta = Math.floor(Math.random() * 1000) * 2 + 2;
  let q = p + BigInt(delta);
  while (!isPrimeMR(q)) q += 2n;
  return { n: (p * q).toString() };
};
