import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'pollard-strassen',
  name: "Pollard-Strassen's Algorithm",
  category: 'Factorization',
  description: "Factors n in O(n^(1/4)) by partitioning [1, n^(1/4)] into interval products and GCD. Fast when n has a factor <= n^(1/4).",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            print(f"Pollard-Strassen factorization on n = {n}")
            print()
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("POLLARD_STRASSEN=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2, q = {n // 2}")
                print("POLLARD_STRASSEN=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("POLLARD_STRASSEN=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("POLLARD_STRASSEN=SUCCESS")
                return
            c = Integer(floor(RR(n) ** (1/4))) + 1
            if c > 50000:
                print(f"n is too large for Strassen (n^(1/4) = {c} > 50000)")
                print("POLLARD_STRASSEN=FAILED")
                return
            for i in range(c):
                prod = 1
                jmin = i * c + 1
                jmax = jmin + c - 1
                for j in range(jmin, jmax + 1):
                    prod = (prod * j) % n
                g = gcd(prod, n)
                if g > 1 and g < n:
                    p = g
                    q = n // g
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print(f"Verification: p * q = {p * q}")
                    print("POLLARD_STRASSEN=SUCCESS")
                    return
            print("Pollard-Strassen failed: no factor found in intervals")
            print("POLLARD_STRASSEN=FAILED")
        except Exception as e:
            print(f"ERROR: {e}")
            print("POLLARD_STRASSEN=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("POLLARD_STRASSEN=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Pollard-Strassen factors n in O(n^{1/4} \\log n) using interval product GCD.

\\textbf{Setup:}
\\begin{itemize}
\\item n has a prime factor p \\leq n^{1/4}
\\item Partition $[1, n^{1/4}]$ into $c = \\lceil n^{1/4} \\rceil$ intervals
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } c &= \\lceil n^{1/4} \\rceil \\\\
\\text{Interval } I_i &= \\{ic + 1, \\dots, (i+1)c\\} \\\\
P_i &= \\prod_{j \\in I_i} j \\mod n \\\\
\\gcd(P_i, n) &> 1 \\iff I_i \\text{ contains a factor of } n \\qed
\\end{align*}

\\textbf{References:} Strassen, 1977; Pollard, 1974`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Strassen's Sage template caps c = n^(1/4) at 50000 (n <= 62 bit)
  // Use p=16, q=46 so n ≈ 62-bit, c ≈ 46000, safe under the 50000 cap
  let p: bigint, q: bigint, n: bigint;
  do {
    p = randomPrime(16);
    q = randomPrime(46);
    n = p * q;
  } while (Number(n) >= 0 && Math.pow(Number(n), 0.25) > 49900);
  return { n: (p * q).toString() };
};
