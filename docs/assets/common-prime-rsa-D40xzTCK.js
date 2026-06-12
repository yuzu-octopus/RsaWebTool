var e=`import type { Attack } from '../types';
import { rsaNeeds, noopSageTemplate } from './_rsaHelpers';
import { generateCommonPrimeTestcase } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  // This attack runs entirely in the browser via frontendCheck — no SageMath needed.
  // The sageTemplate is a no-op that returns a clear message if ever triggered.
  sageTemplate: (_vals) => noopSageTemplate('COMMON_PRIME_RSA'),
  id: 'common-prime-rsa',
  name: 'Common Prime RSA',
  category: 'Factorization',
  description: "Factors two RSA moduli n1, n2 that share a common prime by computing gcd(n1, n2). Use when two moduli may share a prime factor.",
  inputs: [
    { name: 'n1', label: 'n1 (first modulus)', placeholder: 'Enter n1...', multiline: true, rows: 3 },
    { name: 'n2', label: 'n2 (second modulus)', placeholder: 'Enter n2...', multiline: true, rows: 3 },
  ],
  proof: \`\\\\textbf{Theorem:} If $n_1 = p \\\\cdot q_1$ and $n_2 = p \\\\cdot q_2$ share a prime $p$, then $\\\\gcd(n_1, n_2) = p$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item Two RSA moduli $n_1 = p \\\\cdot q_1$ and $n_2 = p \\\\cdot q_2$
\\\\item $q_1 \\\\neq q_2$ (otherwise the moduli are identical)
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\gcd(n_1, n_2) &= \\\\gcd(p \\\\cdot q_1, p \\\\cdot q_2) \\\\\\\\
&= p \\\\cdot \\\\gcd(q_1, q_2) \\\\\\\\
&= p \\\\quad \\\\text{(since } q_1, q_2 \\\\text{ are distinct primes)}
\\\\end{align*}
The GCD extracts the shared prime directly — no factorization of either modulus is needed.

\\\\textbf{Explanation:} This is a simpler, two-modulus variant of the Batch GCD attack. When two RSA keys were generated on the same machine or with a shared entropy source, they may share a prime factor. Computing the GCD of the two moduli instantly recovers the shared prime, fully factoring both keys.

\\\\textbf{References:} A. K. Lenstra et al., "Ron was wrong, Whit is right" (2012) — found 0.2\\\\% of RSA keys shared factors\`,
  priority: 'high',
  applicableCheck: rsaNeeds.n1N2,
  frontendCheck: (vals: Record<string, string>) => {
    try {
      if (!vals.n1 || !vals.n2) return 'ERROR: Missing required input: n1 and n2\\nCOMMON_PRIME_RSA=FAILED';
      const n1 = BigInt(vals.n1);
      const n2 = BigInt(vals.n2);
      if (n1 < 2n || n2 < 2n) {
        return null;
      }
      if (n1 === n2) {
        return null;
      }
      const p = gcd(n1, n2);
      if (p > 1n && p < n1 && p < n2) {
        const q1 = n1 / p;
        const q2 = n2 / p;
        return [
          'Common Prime RSA',
          \`n1 = \${n1}\`,
          \`n2 = \${n2}\`,
          '',
          'Results:',
          \`p = \${p}\`,
          \`q1 = \${q1}\`,
          \`q2 = \${q2}\`,
          '',
          \`Verification: p * q1 = \${p * q1}\`,
          \`Verification: p * q2 = \${p * q2}\`,
          '',
          'COMMON_PRIME_RSA=SUCCESS',
        ].join('\\n');
      }
      return null;
    } catch {
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const kp = generateCommonPrimeTestcase();
  return { n1: kp.n1.toString(), n2: kp.n2.toString() };
};
`;export{e as default};