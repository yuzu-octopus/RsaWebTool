import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'implicit-key-exposure',
  name: 'Implicit Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from a^p mod n leak. Use when a^p mod n is accidentally exposed.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'a', label: 'a (base)', placeholder: 'Enter base a...', multiline: false },
    { name: 'leak', label: 'leak (a^p mod n)', placeholder: 'Enter leaked value...', multiline: true, rows: 3 },
  ],
  sageTemplate: () => `print("Implicit Key Exposure requires multiple keys — run in browser mode")`,
  proof: `\\textbf{Theorem:} If $a^p \\bmod n$ is leaked, $p$ is recovered via $\\gcd(a - \\text{leak}, n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, $p \\nmid a$
\\item $\\text{leak} = a^p \\bmod n$
\\item Fermat's little theorem: $a^p \\equiv a \\pmod{p}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{leak} &\\equiv a^p \\pmod{n} \\\\
\\text{leak} &\\equiv a^p \\equiv a \\pmod{p} \\quad \\text{(FLT)} \\\\
p &\\mid (\\text{leak} - a) \\\\
p &= \\gcd(\\text{leak} - a, n) \\qed
\\end{align*}

\\textbf{References:} Common CTF pattern; based on Fermat's Little Theorem`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.a && !!p.leak,
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const n = BigInt(vals.n);
      const a = BigInt(vals.a);
      const leak = BigInt(vals.leak);
      const g = gcd(leak - a, n);
      if (g > 1n && g < n) {
        const p = g;
        const q = n / p;
        return [
          `Implicit Key Exposure Attack (browser-side, BigInt)`,
          `n = ${n}`,
          `a = ${a}`,
          `leak = ${leak}`,
          ``,
          `Factors recovered:`,
          `p = ${p}`,
          `q = ${q}`,
          `Verification: p * q = ${p * q}`,
          `Verification: a^p mod n = ${modPow(a, p, n)} == leak? ${modPow(a, p, n) === leak}`,
          ``,
          `IMPLICIT_KEY_EXPOSURE=SUCCESS`,
        ].join('\n');
      }
      return null;
    } catch {
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const a = 3n;
  const leak = modPow(a, p, n);
  return { n: n.toString(), a: a.toString(), leak: leak.toString() };
};
