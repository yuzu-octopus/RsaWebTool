import type { Attack } from '../types';
import { gcd } from '../utils/bigint';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'pollard-rho',
  name: "Pollard's Rho (Brent variant)",
  category: 'Factorization',
  description: "Factors n via birthday paradox with Brent's cycle detection and GCD. GCD reduces gcd overhead from O(sqrt(p)) to O(sqrt(p)/m). Backtracking recovers when accumulated product contains all factors.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    import math
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
            def brent_rho_batch(n_val, c_val):
                n_i = int(n_val)
                c_i = int(c_val)
                y = 2
                r = 1
                q = 1
                g = 1
                m = 100
                while g == 1:
                    x = y
                    for _ in range(r):
                        y = (y * y + c_i) % n_i
                    k = 0
                    while k < r and g == 1:
                        ys = y
                        batch = min(m, r - k)
                        for _ in range(batch):
                            y = (y * y + c_i) % n_i
                            q = (q * abs(x - y)) % n_i
                        g = math.gcd(q, n_i)
                        q = 1
                        k += m
                    r *= 2
                if g == n_i:
                    while True:
                        ys = (ys * ys + c_i) % n_i
                        g = math.gcd(abs(x - ys), n_i)
                        if g > 1:
                            break
                return Integer(g) if 1 < g < n_i else None
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
  frontendCheck: (vals) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n % 2n === 0n) return Promise.resolve(`Factor found!\np = 2\nq = ${n / 2n}\nPOLLARD_RHO=SUCCESS`);
      for (let c = 1n; c < 10n; c++) {
        let x = 2n, y = 2n, d = 1n;
        let power = 1n, lam = 0n;
        const maxPollardIter = 50000;
        let pollardIter = 0;
        while (d === 1n && pollardIter < maxPollardIter) {
          pollardIter++;
          if (power === lam) { x = y; power *= 2n; lam = 0n; }
          y = (y * y + c) % n;
          lam++;
          d = gcd(y - x > 0n ? y - x : x - y, n);
          if (d > 1n && d < n) {
            const q = n / d;
            return Promise.resolve(`Factor found!\np = ${d}\nq = ${q}\nPOLLARD_RHO=SUCCESS`);
          }
        }
        if (d === 1n && pollardIter >= maxPollardIter) {
          continue; // try next c value
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
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
  // Generate n with one SMALL factor (≤28 bits) so rho succeeds within SageCell 120s
  // Rho runs in O(sqrt(p)) — with p=28 bits, ~2^14 = 16384 iterations, very fast
  // n = 28 + 64 = 92 bits total — fast modular arithmetic
  const p = randomPrime(28);
  const q = randomPrime(64);
  return { n: (p * q).toString() };
};
