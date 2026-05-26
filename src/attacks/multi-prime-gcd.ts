import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'multi-prime-gcd',
  name: 'Multi-Prime GCD',
  category: 'Factorization',
  description: 'Finds shared primes across multiple moduli via pairwise GCD. Use when given 2+ RSA moduli. Unlike Batch GCD (Factorization category), this attack reports exact moduli pairs that share each factor.',
  inputs: [
    { name: 'moduli_list', label: 'Moduli (one per line)', placeholder: 'Enter multiple moduli, one per line...', multiline: true, rows: 6 },
  ],
  sageTemplate: () => `print("Multi-prime GCD requires multiple moduli — run in browser mode")`,
  proof: `\\textbf{Theorem:} Pairwise GCD of moduli reveals shared factors and their pairs.

\\textbf{Setup:}
\\begin{itemize}
\\item Moduli $\\{n_i\\}$
\\item Some pair shares a factor
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
g_{ij} &= \\gcd(n_i, n_j) \\quad (1 \\leq i < j \\leq k) \\\\
g_{ij} > 1 &\\implies p \\mid n_i \\land p \\mid n_j \\\\
n_i &= g_{ij} \\cdot \\frac{n_i}{g_{ij}}, \\quad n_j = g_{ij} \\cdot \\frac{n_j}{g_{ij}} \\qed
\\end{align*}

\\textbf{References:} Heninger et al., USENIX Security 2012`,
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
      if (!raw) return null;

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

      let foundAny = false;

      for (let i = 0; i < moduli.length; i++) {
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
