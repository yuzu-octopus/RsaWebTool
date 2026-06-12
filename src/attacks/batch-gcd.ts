import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'batch-gcd',
  name: 'Batch GCD',
  category: 'Factorization',
  description: "Finds shared prime factors across a list of RSA moduli by computing gcd of each against the product of all others. Use when multiple moduli may share primes.",
  inputs: [
    { name: 'n_values', label: 'Moduli (one per line or comma-separated)', placeholder: 'n1\\nn2\\nn3...', multiline: true, rows: 5 },
  ],
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const raw = (vals.n_values || '').trim();
      if (!raw) return 'ERROR: Missing required input: n_values (comma-separated moduli)\nBATCH_GCD=FAILED';

      const moduli = raw.split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => BigInt(s));

      if (moduli.length < 2) {
        return null;
      }

      let product = 1n;
      for (const n of moduli) {
        product *= n;
      }

      const lines: string[] = [
        `Batch GCD`,
        `n_values = ${raw}`,
        ``,
        `Results:`,
      ];

      let foundAny = false;

      for (let i = 0; i < moduli.length; i++) {
        const n = moduli[i];
        if (n <= 1n) continue;

        const others = product / n;
        const g = gcd(n, others);

        if (g > 1n && g < n) {
          foundAny = true;
          const p = g;
          const q = n / g;
          lines.push(`n[${i}]:`);
          lines.push(`p = ${p}`);
          lines.push(`q = ${q}`);
          lines.push(`Verification: p * q = ${p * q}`);
          lines.push('');
        } else if (g === n) {
          lines.push(`n[${i}]: ${n}`);
          lines.push(`WARNING: n divides product of others (duplicate or fully shared)`);
          lines.push('');
        }
      }

      if (!foundAny) {
        return null;
      }

      lines.push('BATCH_GCD=SUCCESS');
      return lines.join('\n');
    } catch {
      return null;
    }
  },
  proof: `\\textbf{Theorem:} Given moduli $\\{n_1, \\ldots, n_k\\}$, if any two share a prime, then $\\gcd(n_i, \\prod_{j \\neq i} n_j)$ reveals it.

\\textbf{Setup:}
\\begin{itemize}
\\item RSA moduli $n_i = p_i \\cdot q_i$, $i = 1 \\ldots k$
\\item $p_i = p_j$ for some $i \\neq j$ (shared prime)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p \\mid n_i,\\; p \\mid n_j &\\implies p \\mid \\gcd(n_i, n_j) \\\\
\\text{For each } i: \\quad g_i &= \\gcd\\left(n_i, \\prod_{j \\neq i} n_j\\right) \\\\
g_i > 1 &\\implies g_i \\text{ is a shared prime factor} \\\\
\\text{Naive product: } O(k) &\\text{ vs } O(k^2) \\text{ for pairwise GCD}
\\qed\\\\
\\end{align*}
The product $\\prod_{j \\neq i} n_j$ is computed by first multiplying all moduli together, then dividing each out: $\\prod_{j \\neq i} n_j = (\\prod_j n_j) / n_i$, giving $O(k)$ total time rather than $O(k^2)$ pairwise GCDs.

\\textbf{Explanation:} When RSA keys are generated with insufficient randomness, two moduli may share a common prime factor. Computing the GCD of each modulus against the product of all others efficiently catches this. In practice, this attack found real-world weak keys — the 2012 "Mining Your Ps and Qs" study found 0.2\\% of TLS certificates shared factors.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Product method:} Multiplying all $k$ moduli together then dividing each back out computes $\\prod_{j \\neq i} n_j$ in $O(k)$ total time — much faster than $O(k^2)$ pairwise GCDs.
\\end{itemize}

\\textbf{References:} Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012; Bernstein, "How to Find Small Factors of Products", 2004`,
  priority: 'high',
  applicableCheck: rsaNeeds.nValues,
};

export const generateTestcase = (): Record<string, string> => {
  const sharedP = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const q3 = randomPrime(TESTCASE_BITS.q);
  return { n_values: `${sharedP * q1}\n${sharedP * q2}\n${sharedP * q3}` };
};
