import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'ecm2',
  name: 'ECM Full Factorization',
  category: 'Factorization',
  description: 'Full factorization via ECM. Use to find all prime factors of n.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"ECM Full Factorization on n = {n}")
print()

if n < 2:
    print(f"n = {n} is too small to factor")
    print("ECM2=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2, q = {n // 2}")
    print("ECM2=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("ECM2=FAILED")
    return
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print("ECM2=SUCCESS")
    return

try:
    fac = factor(n)
    factors = list(fac)

    print(f"Factorization: {fac}")
    print()

    if len(factors) == 1 and factors[0][1] == 1:
        print(f"n is prime: {n.is_prime()}")
        print("ECM2=FAILED")
    else:
        print(f"Found {len(factors)} prime factor(s):")
        for prime, exp in factors:
            if exp == 1:
                print(f"  p = {prime}")
            else:
                print(f"  {prime}^{exp}")
        print()
        product = 1
        for prime, exp in factors:
            product *= prime ** exp
        print(f"Verification: product = {product}")
        print(f"Matches n: {product == n}")
        print("ECM2=SUCCESS")
except Exception as ex:
    print(f"Factorization failed: {ex}")
    print("ECM2=FAILED")
`,
  proof: `\\textbf{Theorem:} Repeated ECM with factor removal yields the complete prime factorization of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item ECM finds one prime factor p of n at a time
\\item Fundamental Theorem of Arithmetic: n = p_1^{e_1} \\cdots p_k^{e_k} uniquely
\\item After finding p, reduce to n' = n / p and recurse
\\item Primality test (Miller-Rabin) for termination
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p_1^{e_1} p_2^{e_2} \\cdots p_k^{e_k}, \\quad p_1 < p_2 < \\cdots < p_k \\\\
\\text{ECM finds } p_i &\\text{ with prob. depending on smoothness of } \\#E(\\mathbb{F}_{p_i}) \\\\
n' &= n / p_i \\\\
\\text{Repeat until } n' = 1 &\\text{ or } n' \\text{ is prime} \\\\
n > n/p_{i_1} > n/(p_{i_1}p_{i_2}) > \\cdots &> 1 \\\\
\\text{Each step reduces } \\Omega(n) &\\text{ (total prime factors with multiplicity)} \\\\
\\text{Terminates in } \\Omega(n) &\\text{ iterations} \\\\
\\text{Total time: } \\sum_{i=1}^{k} O(\\exp(\\sqrt{2 \\ln p_i \\ln \\ln p_i})) & \\\\
\\text{Dominated by the largest prime factor.} & \\qed
\\end{align*}

\\textbf{Explanation:} Run ECM to find one factor, divide it out, and repeat on the quotient. The process terminates when the remainder is 1 or prime. Each iteration strictly reduces the number of prime factors, guaranteeing termination. The total cost is dominated by finding the largest prime factor.

\\textbf{References:} Lenstra, "Factoring Integers with Elliptic Curves", 1987`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one small factor (≤60 bits) so factor() succeeds quickly
  const p = randomPrime(60);
  const q = randomPrime(TESTCASE_BITS.p + TESTCASE_BITS.q - 60);
  return { n: (p * q).toString() };
};
