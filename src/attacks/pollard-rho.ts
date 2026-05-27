import type { Attack } from '../types';
import { gcd } from '../utils/bigint';
import { randomPrime } from '../utils/testcases/core';
import { sageGuardBlock } from './guard';

export const attack: Attack = {
  id: 'pollard-rho',
  name: "Pollard's Rho (Brent variant)",
  category: 'Factorization',
  description: "Factors n via birthday paradox with Brent's cycle detection and batched GCD reduction. Use for general-purpose factorization of medium-sized factors.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    import math
    try:
        try:
            out = []
            n = Integer(${vals.n})
            out.append(f"Pollard's Rho (Brent variant) on n = {n}")
            out.append("")
            ${sageGuardBlock("POLLARD_RHO", '            ')}
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
                    out.append(f"Verification: p * q = {p * q}")
                    out.append(f"p = {p}")
                    out.append(f"q = {q}")
                    out.append(f"c value: {c_val}")
                    out.append("")
                    out.append("POLLARD_RHO=SUCCESS")
                    found = True
                    break
            if not found:
                out.append("Pollard's rho (Brent variant) failed: no factor found")
                out.append("Try ECM or other methods")
                out.append("POLLARD_RHO=FAILED")
            print("\\n".join(out))
        except Exception as e:
            out.append(f"ERROR: {e}")
            out.append("POLLARD_RHO=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("POLLARD_RHO=FAILED")
        except:
            out = [f"ERROR: {ex}", "POLLARD_RHO=FAILED"]
        print("\\n".join(out))
_attack()`,
  frontendCheck: (vals, onProgress) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n % 2n === 0n) return Promise.resolve(`Factor found!\np = 2\nq = ${n / 2n}\nPOLLARD_RHO=SUCCESS`);
      let totalProgressCalls = 0;
      for (let c = 1n; c < 10n; c++) {
        if (onProgress) {
          const progress = Math.round(Number(c - 1n) * 100 / 9);
          if (progress > totalProgressCalls) {
            totalProgressCalls = progress;
            onProgress(progress, `curve ${Number(c)} / 9`);
          }
        }
        const n_i = n;
        const c_i = BigInt(c);
        let y = 2n, x = 2n, qProd = 1n, g = 1n;
        let r = 1n, k = 0n;
        const batchM = 100;
        const maxIter = 500000;
        let iter = 0;
        while (g === 1n && iter < maxIter) {
          x = y;
          let count = 0;
          while (count < Number(r) && iter < maxIter) {
            y = (y * y + c_i) % n_i;
            iter++;
            count++;
          }
          k = 0n;
          while (k < r && g === 1n && iter < maxIter) {
            const batchSize = Math.min(batchM, Number(r - k));
            for (let i = 0; i < batchSize; i++) {
              y = (y * y + c_i) % n_i;
              const diff = y > x ? y - x : x - y;
              qProd = (qProd * diff) % n_i;
              iter++;
            }
            g = gcd(qProd, n_i);
            qProd = 1n;
            k += BigInt(batchM);
          }
          r *= 2n;
        }
        if (g > 1n && g < n_i) {
          const q = n_i / g;
          onProgress?.(100);
          return Promise.resolve(`Factor found!\np = ${g}\nq = ${q}\nc = ${c}\niterations = ${iter}\nPOLLARD_RHO=SUCCESS`);
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} Pollard's rho algorithm with Brent's cycle detection and batched GCD finds a non-trivial factor in expected $O(n^{1/4})$ time.

\\textbf{Setup:}
\\begin{itemize}
\\item Birthday paradox: among $\\sqrt{p}$ random elements modulo a prime $p$, a collision is expected
\\item Pseudo-random walk $x_{i+1} = x_i^2 + c \\pmod{n}$ eventually cycles modulo each prime factor
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
x_{i+1} &= x_i^2 + c \\pmod{n} \\\\
\\text{Collision after } O(\\sqrt{p}) &\\text{ steps (birthday paradox)} \\\\
\\exists i \\neq j: \\; x_i &\\equiv x_j \\pmod{p} \\\\
p &\\mid (x_i - x_j) \\\\
\\text{Brent: save } x \\text{ only at powers of } 2 &\\;\\;\\; \\text{(1 evaluation per step)} \\\\
\\text{Batched GCD: accumulate } \\prod |x-y| &\\text{ for } m \\text{ steps, then one gcd} \\qed
\\end{align*}

\\textbf{Explanation:} Pollard's rho uses $f(x) = x^2 + c$ to generate a sequence that eventually cycles modulo $p$. Brent's cycle detection compares each value against a saved snapshot at powers of two, requiring only one evaluation per step instead of Floyd's three. Batched GCD reduces overhead by accumulating $m$ differences into one product before each GCD call. If the accumulated product contains $n$ as a factor, backtracking identifies the exact step.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Brent cycle detection:} Saves one snapshot per step at powers of two — requires only one evaluation per iteration vs Floyd's three, reducing modular multiplications by $\\sim 2\\times$ per cycle.
\\item \\textbf{Batched GCD:} Accumulates $m = 100$ product differences into $\\prod |x_i - y_i|$ before each GCD call, reducing expensive GCD operations by $\\sim 100\\times$. Backtracks within the winning batch when the accumulated product contains all of $n$.
\\end{itemize}

\\textbf{References:} J. M. Pollard, "A Monte Carlo Method for Factorization", BIT 1975; R. P. Brent, "An Improved Monte Carlo Factorization Algorithm", BIT 1980`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one SMALL factor (≤28 bits) so rho succeeds within SageCell 120s
  // Rho runs in O(sqrt(p)) — with p=28 bits, ~2^14 = 16384 iterations, very fast
  // n = 28 + 64 = 92 bits total — fast modular arithmetic
  const p = randomPrime(34);
  const q = randomPrime(64);
  return { n: (p * q).toString() };
};
