import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';
import { sageGuardBlock } from './guard';

export const attack: Attack = {
  id: 'pollard-strassen',
  name: "Pollard-Strassen's Algorithm",
  category: 'Factorization',
  description: "Factors n in O(n^(1/4)) by computing GCD of interval products over [1, n^(1/4)] to find a small factor. Use when n has a factor ≤ n^(1/4).",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `import math
def _attack():
    try:
        try:
            n = Integer(${vals.n})
            print(f"Pollard-Strassen factorization on n = {n}")
            print()
            ${sageGuardBlock("POLLARD_STRASSEN", '            ')}
            c = int(floor(RR(n) ** (1/4))) + 1
            if c > 50000:
                print(f"n is too large for Strassen (n^(1/4) = {c} > 50000)")
                print("POLLARD_STRASSEN=FAILED")
                return
            n_int = int(n)
            # Single-pass Strassen: accumulate product incrementally with batched GCD
            prod = 1
            batch_size = 1000
            for i in range(1, c + 1):
                prod = (prod * i) % n_int
                if i % batch_size == 0 or i == c:
                    g = math.gcd(prod, n_int)
                    if g > 1 and g < n_int:
                        # Backtrack to find exact factor in this batch
                        backtrack_start = max(1, i - batch_size + 1)
                        backtrack_prod = 1
                        for j in range(backtrack_start, i + 1):
                            backtrack_prod = (backtrack_prod * j) % n_int
                            g2 = math.gcd(backtrack_prod, n_int)
                            if g2 > 1 and g2 < n_int:
                                p_sage = Integer(g2)
                                q_sage = n // p_sage
                                print(f"Verification: p * q = {p_sage * q_sage}")
                                print(f"p = {p_sage}")
                                print(f"q = {q_sage}")
                                print()
                                print("POLLARD_STRASSEN=SUCCESS")
                                return
                        # If product GCD found but backtrack didn't (shouldn't happen)
                        break
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
  proof: `\\textbf{Theorem:} Pollard-Strassen factors n in $O(n^{1/4} \\log n)$ time by partitioning $[1, n^{1/4}]$ into intervals and testing each via GCD.

\\textbf{Setup:}
\\begin{itemize}
\\item $n$ has a prime factor $p \\leq n^{1/4}$
\\item Partition $[1, n^{1/4}]$ into $c = \\lceil n^{1/4} \\rceil$ intervals
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } c &= \\lceil n^{1/4} \\rceil \\\\
\\text{Interval } I_i &= \\{i c + 1, \\dots, (i+1) c\\} \\\\
P_i &= \\prod_{j \\in I_i} j \\mod n \\\\
\\gcd(P_i, n) &> 1 \\iff I_i \\text{ contains a factor of } n
\\end{align*}
Compute each $P_i$ incrementally and take $\\gcd(P_i, n)$. When a match is found, back-track within the interval to isolate the exact factor. The cost is $O(c) = O(n^{1/4})$ multiplications and GCDs.

\\textbf{Explanation:} If $p \\mid n$ and $p \\leq n^{1/4}$, then $p$ lies in some interval $I_i$. Since every element of $I_i$ divides $P_i$, we have $p \\mid P_i$ and hence $\\gcd(P_i, n) \\geq p > 1$. The backtrack step finds $p$ within the winning interval by rebuilding the product one term at a time until the GCD becomes non-trivial.

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
