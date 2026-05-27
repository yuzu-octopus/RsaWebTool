import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'multi-prime-gcd',
  name: 'Multi-Prime GCD',
  category: 'Factorization',
  description: 'Finds shared prime factors across multiple RSA moduli using pairwise GCD with pair reporting. Use when two or more moduli may share a common factor.',
  inputs: [
    { name: 'moduli_list', label: 'Moduli (one per line)', placeholder: 'Enter multiple moduli, one per line...', multiline: true, rows: 6 },
  ],
  sageTemplate: () => `print("Multi-prime GCD requires multiple moduli — run in browser mode")`,
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

\\textbf{References:} N. Heninger, Z. Durumeric, E. Wustrow, J. A. Halderman, "Mining Your Ps and Qs", USENIX Security Symposium, 2012`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => {
    const vals = (p.moduli_list || '').trim();
    if (!vals) return false;
    return vals.split('\n').filter(x => x.trim()).length >= 2;
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const raw = (vals.moduli_list || '').trim();
      if (!raw) return 'ERROR: Missing required input: moduli_list\nMULTI_PRIME_GCD=FAILED';

      const moduli = raw.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => BigInt(s));

      if (moduli.length < 2) {
        return null;
      }

      const lines: string[] = [
        `Multi-Prime GCD Attack (browser-side, BigInt)`,
        `Running pairwise GCD on ${moduli.length} moduli...`,
        ``,
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

      // Only check pairs involving hit indices
      for (let ii = 0; ii < hitIndices.length; ii++) {
        const i = hitIndices[ii];
        const ni = moduli[i];
        for (let j = i + 1; j < moduli.length; j++) {
          const nj = moduli[j];
          const g = gcd(ni, nj);
          if (g > 1n && g < ni) {
            foundAny = true;
            lines.push(`SHARED FACTOR FOUND between moduli ${i + 1} and ${j + 1}!`);
            lines.push(`gcd(n${i + 1}, n${j + 1}) = ${g}`);
            lines.push(`n${i + 1} = ${ni}`);
            lines.push(`  p = ${g}`);
            lines.push(`  q = ${ni / g}`);
            lines.push(`n${j + 1} = ${nj}`);
            lines.push(`  p' = ${g}`);
            lines.push(`  q' = ${nj / g}`);
            lines.push('');
          }
        }
      }

      if (!foundAny) {
        return null;
      }

      lines.push('MULTI_PRIME_GCD=SUCCESS');
      return lines.join('\n');
    } catch {
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const sharedP = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const q3 = randomPrime(TESTCASE_BITS.q);
  return { moduli_list: `${sharedP * q1}\n${sharedP * q2}\n${sharedP * q3}` };
};
