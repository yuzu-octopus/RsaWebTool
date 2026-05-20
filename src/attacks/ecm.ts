import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'ecm',
  name: 'ECM Factorization',
  category: 'Factorization',
  description: 'Factors n using elliptic curves. Use for general factorization when other methods fail.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"ECM Factorization on n = {n}")
print()

if n < 2:
    print(f"n = {n} is too small to factor")
    print("ECM=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2, q = {n // 2}")
    print("ECM=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("ECM=FAILED")
    return
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print("ECM=SUCCESS")
    return

try:
    # Use SageMath's Integer.ecm() method
    p = n.ecm()
    if p > 1 and p < n:
        q = n // p
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print("ECM=SUCCESS")
    else:
        print("ECM found no non-trivial factors")
        print("ECM=FAILED")
except Exception as ex:
    print(f"ECM failed: {ex}")
    print("ECM=FAILED")
`,
  proof: `\\textbf{Theorem:} ECM finds a prime factor p of n in expected time O(\\exp(\\sqrt{2 \\ln p \\ln \\ln p})).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Elliptic curve E: y^2 = x^3 + ax + b over \\mathbb{Z}/n\\mathbb{Z}
\\item Group law on E: point addition and scalar multiplication
\\item Hasse's theorem: |\\#E(\\mathbb{F}_p) - (p + 1)| \\leq 2\\sqrt{p}
\\item B-smooth: all prime factors \\leq B
\\item M = \\prod_{q \\leq B_1} q^{\\lfloor \\log_q B_1 \\rfloor}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Choose random } E: y^2 &= x^3 + ax + b \\pmod{n}, \\; P \\in E \\\\
Q = M \\cdot P, \\quad M &= \\prod_{q \\leq B_1} q^{\\lfloor \\log_q B_1 \\rfloor} \\\\
\\#E(\\mathbb{F}_p) \\text{ is } B_1\\text{-smooth} &\\implies M \\equiv 0 \\pmod{\\#E(\\mathbb{F}_p)} \\\\
M \\cdot P &= \\mathcal{O} \\text{ in } E(\\mathbb{F}_p) \\\\
\\text{Scalar multiplication encounters} & \\\\
\\text{non-invertible denominator } d &\\pmod{n} \\\\
\\gcd(d, n) &= p \\\\
\\#E(\\mathbb{F}_p) &\\in [p + 1 - 2\\sqrt{p}, \\; p + 1 + 2\\sqrt{p}] \\\\
\\text{Vary curve } (a, b) \\implies \\text{different } \\#E &\\implies \\text{one is smooth} \\\\
\\text{Expected time: } O(&\\exp(\\sqrt{2 \\ln p \\ln \\ln p})) \\qed
\\end{align*}

\\textbf{Explanation:} Pick a random elliptic curve and point. Compute M \\cdot P where M is the product of all prime powers up to B_1. If the curve order modulo p is B_1-smooth, the computation fails modulo p but not modulo other factors, revealing p via gcd. Try different curves until one succeeds.

\\textbf{References:} H. W. Lenstra Jr., "Factoring Integers with Elliptic Curves", Annals of Mathematics, 1987`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one small factor (≤60 bits) so ECM succeeds quickly
  const p = randomPrime(60);
  const q = randomPrime(TESTCASE_BITS.p + TESTCASE_BITS.q - 60);
  return { n: (p * q).toString() };
};
