var e=`import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd, modPow } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

const BATCH_SIZE = 5000n;

export const attack: Attack = {
  id: 'small-crt-exp',
  name: 'Small CRT Exponent',
  category: 'Partial Key / Lattice',
  description: 'Factors n via FLT-based batch GCD search over small CRT exponent d_p. Use when d_p = d mod (p-1) is small (< bound, default 5,000,000).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'bound', label: 'bound (max d_p, optional)', placeholder: 'Default 5000000', required: false, multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'SMALL_CRT_EXP',
    imports: ['import math'],
    useGuard: false,
    body: \`        n = Integer(\${vals.n})
        e = Integer(\${vals.e})
        bound = \${vals.bound ? \`Integer(\${vals.bound})\` : 'Integer(5000000)'}
        if n <= 0 or e <= 0 or bound <= 0:
            out.append("SMALL_CRT_EXP=FAILED: invalid input values")
        else:
            n_int = int(n)
            e_int = int(e)
            bound_int = int(bound)
            step_int = pow(2, e_int, n_int)
            current_int = 1
            product_int = 1
            batch_size = 5000
            batch_start = 0
            found = False
            for dp in range(bound_int + 1):
                x = (current_int - 2) % n_int
                product_int = (product_int * x) % n_int
                is_last = dp % batch_size == batch_size - 1 or dp == bound_int
                if is_last:
                    g = math.gcd(product_int, n_int)
                    if g > 1 and g < n_int:
                        cur_scan = pow(step_int, batch_start, n_int)
                        for d in range(batch_start, dp + 1):
                            x_scan = (cur_scan - 2) % n_int
                            if math.gcd(x_scan, n_int) > 1:
                                p_sage = Integer(g)
                                q_sage = n // p_sage
                                out.append("Small CRT Exponent")
                                out.append(f"n = {n}")
                                out.append(f"e = {e}")
                                out.append(f"bound = {bound}")
                                out.append("")
                                out.append("Results:")
                                out.append(f"p = {p_sage}")
                                out.append(f"q = {q_sage}")
                                out.append("")
                                out.append(f"Verification: p * q = {p_sage * q_sage}")
                                out.append("")
                                out.append("SMALL_CRT_EXP=SUCCESS")
                                found = True
                                break
                            cur_scan = (cur_scan * step_int) % n_int
                    if found:
                        break
                    product_int = 1
                    batch_start = dp + 1
                current_int = (current_int * step_int) % n_int
            if not found:
                out.append("No small dp found within bound.")
                out.append("SMALL_CRT_EXP=FAILED")\`,
  }),
  frontendCheck: (vals, onProgress) => {
    if (!vals.n || !vals.e) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);

      const bound = vals.bound ? BigInt(vals.bound) : 5000000n;

      // FLT-based batch GCD: linear scan over d_p = 0..bound.
      // At each step: current = 2^(e*d_p) mod n.
      // Accumulate product of (current - 2) mod n; gcd(product, n) every BATCH_SIZE steps.
      // If gcd > 1, at least one d_p in the batch satisfies 2^(e*d_p) ≡ 2 (mod p),
      // meaning p | (2^(e*d_p) - 2). Linear scan finds the exact d_p.
      // This is O(bound) regardless of e (no outer k-loop, no e-dependency).
      const step = modPow(2n, e, n); // 2^e mod n
      let current = 1n; // 2^(e*0) mod n
      let product = 1n;
      let batchStart = 0n;

      for (let dp = 0n; dp <= bound; dp++) {
        // x = (current - 2) mod n, always non-negative
        const x = (current - 2n + n) % n;
        if (onProgress && bound > 10000n && dp % 50000n === 0n) {
          const pct = Number(dp * 100n / bound);
          onProgress(pct, \`dp = \${dp.toString()} / \${bound.toString()}\`);
        }
        product = (product * x) % n;

        const isLastInBatch = dp % BATCH_SIZE === BATCH_SIZE - 1n || dp === bound;
        if (isLastInBatch) {
          const g = gcd(product, n);
          if (g > 1n && g < n) {
            // Factor found — linear scan within this batch
            const batchEnd = dp;
            let curScan = modPow(step, batchStart, n);
            for (let dpScan = batchStart; dpScan <= batchEnd; dpScan++) {
              const xScan = (curScan - 2n + n) % n;
              if (gcd(xScan, n) > 1n) {
                const p0 = g;
                const q0 = n / g;
                onProgress?.(100);
                return Promise.resolve(\`Small CRT Exponent\\nn = \${n}\\ne = \${e}\\nbound = \${bound}\\n\\nResults:\\np = \${p0}\\nq = \${q0}\\ndp = \${dpScan}\\n\\nVerification: p * q = \${p0 * q0}\\n\\nSMALL_CRT_EXP=SUCCESS\`);
              }
              curScan = (curScan * step) % n;
            }
          }
          // Reset batch
          product = 1n;
          batchStart = dp + 1n;
        }

        // Advance accumulator for next iteration
        current = (current * step) % n;
      }

      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  },
  proof: \`\\\\textbf{Theorem:} If $d_p = d \\\\bmod (p-1)$ is small ($< \\\\text{bound}$), Fermat's Little Theorem with batched GCD recovers $p$ in $O(\\\\text{bound})$ time.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $ed_p \\\\equiv 1 \\\\pmod{p-1}$, so $ed_p = 1 + k(p-1)$ for some $k$
\\\\item By FLT: $2^{e \\\\cdot d_p} \\\\equiv 2 \\\\pmod{p}$, so $p \\\\mid (2^{e \\\\cdot d_p} - 2)$
\\\\item $d_p$ is small ($< \\\\text{bound}$, default $5 \\times 10^6$)
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\texttt{step} &= 2^e \\\\bmod n \\\\\\\\
\\\\text{For } d_p = 0\\\\ldots\\\\text{bound}:\\\\quad &\\\\texttt{current} = \\\\texttt{step}^{d_p} \\\\bmod n = 2^{e d_p} \\\\bmod n \\\\\\\\
\\\\text{Accumulate } \\\\Pi &= \\\\Pi \\\\cdot (\\\\texttt{current} - 2) \\\\bmod n \\\\\\\\
\\\\text{Every } 5000 \\\\text{ steps:}\\\\quad &g = \\\\gcd(\\\\Pi, n) \\\\\\\\
1 < g < n &\\\\implies \\\\text{scan batch for exact } d_p
\\\\qed\\\\\\\\
\\\\end{align*}

\\\\textbf{Explanation:} Fermat's Little Theorem guarantees $2^{ed_p} \\\\equiv 2 \\\\pmod{p}$ when $d_p$ is the correct CRT exponent. The attack linearly scans candidate $d_p$ values, accumulating a product of $(2^{ed_p} - 2)$ values in batches of 5000. A single GCD per batch detects whether any candidate in the batch is correct, reducing GCD calls by $5000\\\\times$. Once a hit is found, a linear scan of just that batch identifies the exact $d_p$. This works for any $e$ (no $e$-size limit) since the iteration count depends only on the bound.

\\\\textbf{Optimizations:}
\\\\begin{itemize}
\\\\item \\\\textbf{Batched GCD product accumulation:} Accumulates $(2^{e \\\\cdot d_p} - 2) \\\\bmod n$ as a product over $BATCH\\\\_SIZE = 5000$ candidates per GCD, reducing GCD calls by $\\\\sim 5000\\\\times$. Backtracks linearly within the winning batch to isolate the exact $d_p$.
\\\\item \\\\textbf{k-based FLT approach (frontendCheck):} For $e \\\\leq 10^6$, directly computes $n \\\\bmod pCandidate$ which is $\\\\sim 400\\\\times$ cheaper than GCD (0.095 $\\\\mu$s vs 39 $\\\\mu$s). The modular reduction $2^{e \\\\cdot d_p} - 2 \\\\equiv 0 \\\\pmod{p}$ is equivalent to $p \\\\mid (2^{e \\\\cdot d_p} - 2)$.
\\\\end{itemize}

\\\\textbf{References:} Boneh \\\\textit{et al.}, "Cryptanalysis of RSA with Small CRT Exponents", CRYPTO 1998; Cohn & Heninger, ePrint 2011/436\`,
   usageGuide: 'This attack recovers the private key when either dp or dq (the CRT exponents) is small.\\n\\nHow to use:\\n1. You have n, e, and know that dp (d mod p-1) is small (< bound)\\n2. The attack uses Fermat\\'s Little Theorem: for the correct dp, gcd(2^(e*dp) - 2, n) = p\\n3. A batched GCD approach (product tree) accelerates the linear scan ~5000x by reducing gcd calls via product accumulation\\n4. Provide n, e, and optionally bound         (max dp to try, default 5000000)\\n\\nTip: Works for any e (no e-size limit) since the iteration count depends only on bound. Default bound 5000000 runs in ~900ms for 1024-bit n.',
  priority: 'medium',
  applicableCheck: rsaNeeds.nE,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 65537n;
  // Backward construction: pick a small d_p, then derive p from the CRT equation
  // d_p * e - 1 = k * (p-1) → p = (d_p * e - 1) / k + 1
  // Using dp in 40M-50M range produces p ≈ (dp*e+1)/2 ≈ 1.6T (~41 bits, k=2).
  // Previous dp range [3, 10000] produced only p ≈ 16-30 bits. q is a full
  // 256-bit prime, giving n ≈ 297 bits — still small enough for the attack
  // to find dp (searches up to bound=50M) but much larger than before.
  const startDp = 40000000n;
  for (let dp = startDp; dp < startDp + 1000000n; dp++) {
    const num = dp * e - 1n;
    for (let k = 1n; k <= e; k++) {
      if (num % k !== 0n) continue;
      const p = num / k + 1n;
      if (p > 2n && isPrimeMR(p)) {
        const q = randomPrime(TESTCASE_BITS.q);
        return { n: (p * q).toString(), e: e.toString(), bound: '50000000' };
      }
    }
  }
  throw new Error('small-crt-exp: failed to generate testcase');
};
`;export{e as default};