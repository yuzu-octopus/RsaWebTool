import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'common-prime-rsa',
  name: 'Common Prime RSA',
  category: 'Factorization',
  description: 'Factors two moduli sharing a prime. Use when n1 and n2 share a factor p.',
  inputs: [
    { name: 'n1', label: 'n1 (first modulus)', placeholder: 'Enter n1...', multiline: true, rows: 3 },
    { name: 'n2', label: 'n2 (second modulus)', placeholder: 'Enter n2...', multiline: true, rows: 3 },
  ],
  sageTemplate: () => `print("COMMON_PRIME_RSA=FAILED")`,
  proof: `\\textbf{Theorem:} If $n_1 = p \\cdot q_1$ and $n_2 = p \\cdot q_2$ share a prime $p$, then $\\gcd(n_1, n_2) = p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n_1 = p \\cdot q_1$, $n_2 = p \\cdot q_2$
\\item $q_1 \\neq q_2$, $\\gcd(q_1, q_2) = 1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\gcd(n_1, n_2) &= \\gcd(p \\cdot q_1, p \\cdot q_2) \\\\
&= p \\cdot \\gcd(q_1, q_2) = p \\qed
\\end{align*}

\\textbf{References:} A. K. Lenstra et al., "Ron was wrong, Whit is right" (2012) — found 0.2\\% of RSA keys shared factors`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n1 && !!p.n2,
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
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
          'Common Prime RSA Attack (browser-side, BigInt)',
          `n1 = ${n1}`,
          `n2 = ${n2}`,
          '',
          `gcd(n1, n2) = ${p}`,
          '',
          `Shared prime: p = ${p}`,
          `n1 = ${p} x ${q1}`,
          `n2 = ${p} x ${q2}`,
          `Verification: p * q1 = ${p * q1} == n1? ${p * q1 === n1}`,
          `Verification: p * q2 = ${p * q2} == n2? ${p * q2 === n2}`,
          'COMMON_PRIME_RSA=SUCCESS',
        ].join('\n');
      }
      return null;
    } catch {
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const n1 = p * q1;
  const n2 = p * q2;
  return { n1: n1.toString(), n2: n2.toString() };
};
