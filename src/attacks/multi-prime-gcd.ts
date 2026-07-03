import type { Attack } from '../types';
import { rsaNeeds, noopSageTemplate } from './_rsaHelpers';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  // This attack runs entirely in the browser via frontendCheck — no SageMath needed.
  // The sageTemplate is a no-op that returns a clear message if ever triggered.
  sageTemplate: (_) => noopSageTemplate('MULTI_PRIME_GCD'),
  id: 'multi-prime-gcd',
  name: 'Multi-Prime GCD',
  category: 'Factorization',
  description: 'Finds shared prime factors across multiple RSA moduli using pairwise GCD with pair reporting. Use when two or more moduli may share a common factor.',
  inputs: [
    { name: 'n_values', label: 'Moduli (one per line)', placeholder: 'Enter multiple moduli, one per line...', multiline: true, rows: 6 },
  ],
  usageGuide: `Use when you need to find which specific pairs of moduli share prime factors.

How to use:
1. Enter multiple moduli, one per line
2. The attack computes GCD for every pair and reports which moduli share factors
3. Unlike batch-gcd, this explicitly identifies the sharing pairs

Tip: Use batch-gcd for speed with many moduli; use this when you need to know exactly which pairs share primes.`,
  proof: `\\textbf{Theorem:} Pairwise GCD among a set of RSA moduli reveals shared prime factors and identifies which moduli share them.

\\textbf{Setup:}
\\begin{itemize}
\\item Set of moduli $\\{n_1, n_2, \\ldots, n_k\\}$
\\item Some pair $(n_i, n_j)$ shares a prime factor $p$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
g_{ij} &= \\gcd(n_i, n_j) \\quad (1 \\leq i < j \\leq k) \\\\
g_{ij} > 1 &\\implies p \\mid n_i \\land p \\mid n_j \\\\
n_i &= g_{ij} \\cdot \\frac{n_i}{g_{ij}},\\; n_j = g_{ij} \\cdot \\frac{n_j}{g_{ij}} \\\\
\\text{Cost: } &O(k^2 \\cdot \\log^2 n) \\qed
\\end{align*}

\\textbf{Explanation:} When multiple RSA moduli are generated with insufficient entropy, two moduli may coincidentally share a prime factor. Pairwise GCD detects this — if $\\gcd(n_i, n_j) > 1$, the shared factor divides both moduli. Each unordered pair $(i,j)$ is checked once for $k$ moduli, yielding $O(k^2)$ GCD operations.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Two-stage batch GCD:} Stage 1 computes the product of all moduli and checks each $n_i$ via a single $\\gcd(\\prod_{j \\neq i} n_j,\\; n_i)$ to quickly identify which moduli share factors (hit indices). Stage 2 only performs pairwise GCDs involving hit indices, avoiding $O(k^2)$ work when most moduli have no shared factors.
\\end{itemize}

\\textbf{References:} N. Heninger, Z. Durumeric, E. Wustrow, J. A. Halderman, "Mining Your Ps and Qs", USENIX Security Symposium, 2012`,
  priority: 'high',
  applicableCheck: rsaNeeds.moduliList,
  frontendCheck: (vals: Record<string, string>) => {
    try {
      const raw = (vals.n_values || '').trim();
      if (!raw) return 'ERROR: Missing required input: n_values\nMULTI_PRIME_GCD=FAILED';

      const moduli = raw.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => BigInt(s));

      if (moduli.length < 2) {
        return null;
      }

      const lines: string[] = [
        `Multi-Prime GCD`,
        `n_values = ${raw}`,
        ``,
        `Results:`,
      ];

      // Fast path: batch GCD pre-filter
      // Compute product of all moduli and check each against the rest
      let batchProduct = 1n;
      for (const m of moduli) batchProduct *= m;

      const hitIndices: number[] = [];
      for (let i = 0; i < moduli.length; i++) {
        if (gcd(batchProduct / moduli[i], moduli[i]) !== 1n) {
          hitIndices.push(i);
        }
      }

      if (hitIndices.length < 2) {
        return null;  // No shared factor among any moduli
      }

      let foundAny = false;

      // Only check pairs of hit indices (proven: if gcd(ni, nj) > 1 then both are hits,
      // so restricting to hit × hit pairs is both correct and avoids O(k^2) wasted GCDs)
      for (let ii = 0; ii < hitIndices.length; ii++) {
        const i = hitIndices[ii];
        const ni = moduli[i];
        for (let jj = ii + 1; jj < hitIndices.length; jj++) {
          const j = hitIndices[jj];
          const nj = moduli[j];
          const g = gcd(ni, nj);
          if (g > 1n && g < ni) {
            foundAny = true;
            lines.push(`Moduli ${i + 1} and ${j + 1}:`);
            lines.push(`p = ${g}`);
            lines.push(`q1 = ${ni / g}`);
            lines.push(`q2 = ${nj / g}`);
            lines.push(`Verification: p * q1 = ${g * (ni / g)}`);
            lines.push(`Verification: p * q2 = ${g * (nj / g)}`);
            lines.push('');
          }
        }
      }

      if (!foundAny) {
        return null;
      }

      lines.push('');
      lines.push('MULTI_PRIME_GCD=SUCCESS');
      return lines.join('\n');
    } catch (e) {
      console.warn('[multi-prime-gcd] frontendCheck error:', e);
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const sharedP = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const q3 = randomPrime(TESTCASE_BITS.q);
  return { n_values: `${sharedP * q1}\n${sharedP * q2}\n${sharedP * q3}` };
};
