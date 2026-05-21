import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'pollard-rho',
  name: "Pollard's Rho (Brent variant)",
  category: 'Factorization',
  description: "Factors n via birthday paradox with Brent's cycle detection and batched GCD (primefac-style). Batched GCD reduces gcd overhead from O(sqrt(p)) to O(sqrt(p)/m). Backtracking recovers when accumulated product contains all factors.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            print(f"Pollard's Rho (Brent variant) on n = {n}")
            print()
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("POLLARD_RHO=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2, q = {n // 2}")
                print("POLLARD_RHO=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("POLLARD_RHO=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("POLLARD_RHO=SUCCESS")
                return
            # Brent's cycle detection with batched GCD (primefac-style, BIT 1980)
            # Batched GCD reduces overhead: accumulate |x-y| products, one gcd per batch
            # Backtracking handles g == n case (when accumulated product contains all factors)
            def brent_rho_batch(n, c):
                y = 2
                r = 1
                q = 1
                g = 1
                m = 100
                while g == 1:
                    x = y
                    for _ in range(r):
                        y = (y * y + c) % n
                    k = 0
                    while k < r and g == 1:
                        ys = y
                        batch = min(m, r - k)
                        for _ in range(batch):
                            y = (y * y + c) % n
                            q = (q * abs(x - y)) % n
                        g = gcd(q, n)
                        q = 1
                        k += m
                    r *= 2
                if g == n:
                    while True:
                        ys = (ys * ys + c) % n
                        g = gcd(abs(x - ys), n)
                        if g > 1:
                            break
                return g if 1 < g < n else None
            found = False
            for c_val in range(1, 20):
                d = brent_rho_batch(n, c_val)
                if d is not None:
                    p = d
                    q = n // p
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print(f"Verification: p * q = {p * q}")
                    print(f"c value: {c_val}")
                    print("POLLARD_RHO=SUCCESS")
                    found = True
                    break
            if not found:
                print("Pollard's rho (Brent variant) failed: no factor found")
                print("Try ECM or other methods")
                print("POLLARD_RHO=FAILED")
        except Exception as e:
            print(f"ERROR: {e}")
            print("POLLARD_RHO=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("POLLARD_RHO=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Pollard's rho (Brent variant) with batched GCD finds a nontrivial factor of n in expected O(n^{1/4}) time, reducing GCD overhead from O(n^{1/4} \\log n) to O(n^{1/4}).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Birthday paradox: collision among \\sqrt{N} random elements with prob \\approx 1/2
\\item Brent's cycle detection: saves sequence value at powers of 2, one function eval per step
\\item Pseudorandom sequence: x\\_{i+1} = x\\_i^2 + c \\pmod{n}
\\item Batched GCD: accumulate \\prod |x - y\\_i| \\bmod n for m iterations, then one gcd
\\item Backtracking: when gcd = n, find individual factor via per-step gcd
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
x_{i+1} &= x_i^2 + c \\pmod{n} \\\\
x_i \\pmod{p} &\\text{ lives in a set of size } p \\\\
\\text{Birthday paradox: collision after } &O(\\sqrt{p}) \\text{ steps} \\\\
\\exists i \\neq j: \\; x_i &\\equiv x_j \\pmod{p} \\\\
p &\\mid (x_i - x_j) \\\\
p &\\mid \\gcd\\left(\\prod_{k} |x - y_k|, n\\right) \\;\\;\\; \\text{(batch property)} \\\\
\\text{Brent: save } x \\text{ at powers of 2, } &\\text{advance } y \\text{ single step} \\\\
\\text{Batched GCD: 1 gcd per m steps } &\\text{(vs 1 per step standard)} \\\\
\\text{GCD reduction: } O(n^{1/4} \\log n) &\\to O(n^{1/4}) \\\\
\\text{Expected total time: } O(n^{1/4}) & \\qed
\\end{align*}

\\textbf{Explanation:} Generate a pseudorandom sequence x\\_{i+1} = x\\_i^2 + c mod n. Brent's cycle detection saves x at powers of 2. Batched GCD accumulates \\prod |x - y| mod n for m = 100 iterations, computing gcd once per batch. If gcd = n (all factors in product), backtrack per-step to isolate the individual factor. Expected O(\\sqrt{p}) iterations.

\\textbf{References:} R. P. Brent, "An Improved Monte Carlo Factorization Algorithm", BIT Numerical Mathematics, 20(2):176-184, 1980. J. M. Pollard, "A Monte Carlo Method for Factorization", BIT Numerical Mathematics, 1975. primefac v2.0.12, "pollardrho\\_brent" implementation, 2023`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one SMALL factor (≤40 bits) so rho succeeds quickly
  // Rho runs in O(sqrt(p)) — with p=40 bits, ~2^20 iterations, well within limits
  const p = randomPrime(40);
  const q = randomPrime(TESTCASE_BITS.p + TESTCASE_BITS.q - 40);
  return { n: (p * q).toString() };
};
