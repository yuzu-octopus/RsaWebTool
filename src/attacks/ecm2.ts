import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'ecm2',
  name: 'ECM Full Factorization',
  category: 'Factorization',
  description: 'Full factorization via repeated ECM. Use to find all prime factors of n by recursively applying ECM to composite remainders.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            from sage.libs.libecm import ecmfactor
            def ecm_factor_all(m, depth):
                indent = "  " * depth
                if m == 1:
                    return []
                if m.is_prime():
                    print(f"{indent}Prime: {m}")
                    return [m]
                print(f"{indent}Composite: {m} ({m.nbits()} bits)")
                B1_vals = [2000, 10000, 50000]    # capped at 50k to avoid SageMathCell timeout
                found_p = None
                for B1_cur in B1_vals:
                    for attempt in range(10):
                        try:
                            result = ecmfactor(m, B1_cur)
                            if result[0]:
                                p = result[1]
                                if p != 1 and p != m and m % p == 0:
                                    found_p = p
                                    break
                        except Exception:
                            continue
                    if found_p is not None:
                        break
                if found_p is not None:
                    print(f"{indent}ECM factor: {found_p}")
                    return ecm_factor_all(found_p, depth + 1) + ecm_factor_all(m // found_p, depth + 1)
                print(f"{indent}ECM found no factor, using factor()")
                fac = factor(m)
                result = []
                for prime, exp in fac:
                    for _ in range(exp):
                        result.append(prime)
                return result
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
            factors = ecm_factor_all(n, 0)
            factors.sort()
            print()
            print(f"All {len(factors)} prime factors: {factors}")
            print()
            counts = {}
            for f in factors:
                counts[f] = counts.get(f, 0) + 1
            print(f"Factorization:")
            product = 1
            for prime, exp in sorted(counts.items()):
                if exp == 1:
                    print(f"  p = {prime}")
                else:
                    print(f"  {prime}^{exp}")
                product *= prime ** exp
            print()
            print(f"Verification: product = {product}")
            print(f"Matches n: {product == n}")
            if product == n:
                print("ECM2=SUCCESS")
            else:
                print("ECM2=FAILED")
        except Exception as e:
            print(f"Error: {e}")
            print("ECM2=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("ECM2=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Repeated ECM with factor removal yields the complete prime factorization of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item ECM finds one prime factor p of n at a time
\\item Fundamental Theorem of Arithmetic: n = p\\_1^{e\\_1} \\cdots p\\_k^{e\\_k} uniquely
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
  // Generate n with 3 prime factors for multi-round ECM demonstration
  // Factors use smaller sizes so ECM converges within SageMathCell 35s
  const p1 = randomPrime(32);
  const p2 = randomPrime(40);
  const p3 = randomPrime(40);
  return { n: (p1 * p2 * p3).toString() };
};
