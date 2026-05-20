import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'close-prime',
  name: 'Close-Prime (Londahl)',
  category: 'Factorization',
  description: 'Factors n when primes are within small delta. Use when |p - q| < 10000.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

if n < 2:
    print(f"n = {n} is too small to factor")
    print("CLOSE_PRIME=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("CLOSE_PRIME=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("CLOSE_PRIME=FAILED")
    return
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print("CLOSE_PRIME=SUCCESS")
    return

# Close-prime attack (Londahl variant of Fermat)
# Optimized incremental update (same as Fermat but with extended bounds)
try:
    print(f"Close-prime attack on n = {n}")
    print()

    a, rem = n.sqrtrem()
    b2 = -rem
    c = (a << 1) + 1

    max_iter = 10**7
    print(f"Max iterations: {max_iter}")

    found = False
    for i in range(max_iter):
        if b2.is_square():
            b = isqrt(b2)
            p = a - b
            q = a + b
            if p * q == n and p > 1:
                print(f"Factor found after {i+1} iterations!")
                print(f"p = {p}")
                print(f"q = {q}")
                print(f"|p - q| = {q - p}")
                print(f"Verification: p * q = {p * q}")
                found = True
                break
        b2 += c
        c += 2

    if found:
        print("CLOSE_PRIME=SUCCESS")
    else:
        print(f"Close-prime attack failed after {max_iter} iterations.")
        print("The prime gap may be too large. Try a different method.")
        print("CLOSE_PRIME=FAILED")
except Exception as e:
    print(f"Error in Close-Prime attack: {e}")
    print("CLOSE_PRIME=FAILED")
`,
  proof: `\\textbf{Theorem:} Fermat factorization extended with larger iteration bounds handles structured prime gaps up to $2 \\times 10^7$ iterations.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq — RSA modulus with p \\leq q
\\item a = (p + q)/2, b = (q - p)/2
\\item a_0 = \\lceil\\sqrt{n}\\rceil — starting point
\\item Gap: |p - q| determines iterations needed
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= pq = (a - b)(a + b) = a^2 - b^2 \\\\
a &= \\frac{p + q}{2}, \\quad b = \\frac{q - p}{2} \\\\
a_0 &= \\lceil\\sqrt{n}\\rceil \\\\
a_{i+1} &= a_i + 1, \\quad b_i^2 = a_i^2 - n \\\\
b_i^2 &= \\square \\implies b = \\sqrt{b_i^2}, \\quad p = a - b, \\quad q = a + b \\\\
\\text{Iterations: } b &= \\frac{|q - p|}{2} \\\\
\\text{Standard bound: } b &< n^{1/4} \\\\
\\text{Extended bound: } b &< 10^7 \\quad \\text{(max iterations)} \\\\
\\text{Runtime: } O(|p - q|) & \\qed
\\end{align*}

\\textbf{Explanation:} The close-prime attack is Fermat factorization with an extended iteration limit. It works when |p - q| is small enough that iterating from \\sqrt{n} finds a perfect square within the bound. The Londahl variant increases the bound to handle larger gaps.

\\textbf{References:} Londahl, "Close-Prime Factorization", CTF writeup; Menezes et al., "Handbook of Applied Cryptography", Algorithm 3.21`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const delta = Math.floor(Math.random() * 5000) * 2 + 2;
  let q = p + BigInt(delta);
  while (!isPrimeMR(q)) q += 2n;
  return { n: (p * q).toString() };
};
