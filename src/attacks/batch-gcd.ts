import type { Attack } from '../types';
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
  sageTemplate: () => `print("Batch GCD requires multiple moduli — run in browser mode")`,
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
        `Batch GCD Attack (browser-side, BigInt)`,
        `Processing ${moduli.length} moduli...`,
        ``,
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
          lines.push(`n[${i}] = ${n}`);
          lines.push(`  Shared factor found: p = ${p}`);
          lines.push(`  q = ${q}`);
          lines.push(`  Verification: p * q = ${p * q}`);
          lines.push('');
        } else if (g === n) {
          lines.push(`n[${i}] = ${n}`);
          lines.push(`  WARNING: n divides product of others (duplicate or fully shared)`);
          lines.push('');
        }
      }

      if (!foundAny) {
        return null;
      }

      lines.push('Batch GCD complete.');
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
\\text{Product tree: } O(k \\log k) &\\text{ vs } O(k^2) \\text{ for pairwise GCD}
\\end{align*}
The product $\\prod_{j \\neq i} n_j$ can be computed efficiently using a product tree (divide-and-conquer), achieving $O(k \\log k)$ complexity rather than $O(k^2)$ pairwise GCDs.

\\textbf{Explanation:} When RSA keys are generated with insufficient randomness, two moduli may share a common prime factor. Computing the GCD of each modulus against the product of all others efficiently catches this. In practice, this attack found real-world weak keys — the 2012 "Mining Your Ps and Qs" study found 0.2\\% of TLS certificates shared factors.

\\textbf{References:} Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012; Bernstein, "How to Find Small Factors of Products", 2004`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => {
    const vals = (p.n_values || '').trim();
    if (!vals) return false;
    return vals.split(/[\n,]+/).filter(x => x.trim()).length >= 2;
  },
};

export const generateTestcase = (): Record<string, string> => {
  const sharedP = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const q3 = randomPrime(TESTCASE_BITS.q);
  return { n_values: `${sharedP * q1}\n${sharedP * q2}\n${sharedP * q3}` };
};
