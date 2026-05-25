import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

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
                print(f"Verification: 2 * {n // 2} = {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print()
                print("POLLARD_RHO=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("POLLARD_RHO=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"Verification: p * q = {p * p}")
                print(f"p = {p}")
                print(f"q = {p}")
                print()
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
            for c_val in range(1, 10):
                d = brent_rho_batch(n, c_val)
                if d is not None:
                    p = d
                    q = n // p
                    print(f"Verification: p * q = {p * q}")
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print(f"c value: {c_val}")
                    print()
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
  proof: `\\textbf{Theorem:} Pollard rho (Brent + batched GCD) finds a factor in expected O(n^{1/4}).

\\textbf{Setup:}
\\begin{itemize}
\\item Birthday paradox: collision among \\sqrt{N} random elements
\\item Brent cycle detection
\\item Batched GCD
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
x_{i+1} &= x_i^2 + c \\pmod{n} \\\\
\\text{Collision after } O(\\sqrt{p}) &\\text{ steps (birthday paradox)} \\\\
\\exists i \\neq j: \\; x_i &\\equiv x_j \\pmod{p} \\\\
p &\\mid (x_i - x_j) \\\\
\\text{Brent: save } x \\text{ at powers of 2} &\\;\\;\\; \\text{1 eval per step} \\\\
\\text{Batched GCD: 1 gcd per } m \\text{ steps } &\\implies O(n^{1/4}) \\qed
\\end{align*}

\\textbf{References:} Pollard, 1975; Brent, BIT 1980`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one SMALL factor (≤28 bits) so rho succeeds within SageCell 35s
  // Rho runs in O(sqrt(p)) — with p=28 bits, ~2^14 = 16384 iterations, very fast
  // n = 28 + 64 = 92 bits total — fast modular arithmetic
  const p = randomPrime(28);
  const q = randomPrime(64);
  return { n: (p * q).toString() };
};
