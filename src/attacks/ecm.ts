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
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
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
            from sage.libs.libecm import ecmfactor
            B1_vals = [2000, 10000, 50000]    # capped at 50k to avoid SageMathCell timeout
            curves_per_B1 = 10
            found_p = None
            for B1_cur in B1_vals:
                for attempt in range(curves_per_B1):
                    try:
                        result = ecmfactor(n, B1_cur)
                        if result[0]:
                            factor = result[1]
                            if factor != 1 and factor != n and n % factor == 0:
                                found_p = factor
                                break
                    except Exception:
                        continue
                if found_p is not None:
                    break
            if found_p is not None:
                q = n // found_p
                if found_p > q:
                    found_p, q = q, found_p
                print(f"p = {found_p}")
                print(f"q = {q}")
                print(f"Verification: p * q = {found_p * q}")
                print(f"p is prime: {found_p.is_prime()}")
                print("ECM=SUCCESS")
            else:
                print("ECM failed to find any factor after multiple attempts")
                print("Try increasing B1 bounds or using a different method")
                print("ECM=FAILED")
        except Exception as e:
            print(f"ERROR: {e}")
            print("ECM=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("ECM=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} ECM finds a prime factor p of n in expected time O(\\exp(\\sqrt{2 \\ln p \\ln \\ln p})).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Elliptic curve E: y^2 = x^3 + ax + b over \\mathbb{Z}/n\\mathbb{Z}
\\item Group law on E: point addition and scalar multiplication
\\item Hasse's theorem: |\\#E(\\mathbb{F}\\_p) - (p + 1)| \\leq 2\\sqrt{p}
\\item B-smooth: all prime factors \\leq B
\\item M = \\prod\\_{q \\leq B\\_1} q^{\\lfloor \\log\\_q B\\_1 \\rfloor}
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

\\textbf{Explanation:} Pick a random elliptic curve and point. Compute M \\cdot P where M is the product of all prime powers up to B\\_1. If the curve order modulo p is B\\_1-smooth, the computation fails modulo p but not modulo other factors, revealing p via gcd. Try different curves until one succeeds.

\\textbf{References:} H. W. Lenstra Jr., "Factoring Integers with Elliptic Curves", Annals of Mathematics, 1987`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one small factor (≤30 bits) so ECM succeeds quickly within SageMathCell 35s
  const p = randomPrime(30);
  const q = randomPrime(TESTCASE_BITS.p + TESTCASE_BITS.q - 30);
  return { n: (p * q).toString() };
};
