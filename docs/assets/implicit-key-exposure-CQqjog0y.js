var e=`import type { Attack } from '../types';
import { rsaNeeds, noopSageTemplate } from './_rsaHelpers';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, gcd } from '../utils/bigint';

export const attack: Attack = {
  // This attack runs entirely in the browser via frontendCheck — no SageMath needed.
  // The sageTemplate is a no-op that returns a clear message if ever triggered.
  sageTemplate: noopSageTemplate,
  id: 'implicit-key-exposure',
  name: 'Implicit Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from leaked value a^p mod n using Fermat\\'s Little Theorem GCD. Use when a^p mod n is accidentally exposed via side-channel or implementation bug.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'a', label: 'a (base)', placeholder: 'Enter base a...', multiline: false },
    { name: 'leak', label: 'leak (a^p mod n)', placeholder: 'Enter leaked value...', multiline: true, rows: 3 },
  ],
  proof: \`\\\\textbf{Theorem:} If $a^p \\\\bmod n$ is leaked, recover $p$ via $\\\\gcd(a - \\\\text{leak}, n)$ using Fermat's Little Theorem.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $n = pq$, assume $p \\\\nmid a$
\\\\item $\\\\text{leak} = a^p \\\\bmod n$ is known
\\\\item FLT: $a^p \\\\equiv a \\\\pmod{p}$ for prime $p$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\text{leak} &\\\\equiv a^p \\\\pmod{n} \\\\\\\\
\\\\text{leak} &\\\\equiv a^p \\\\equiv a \\\\pmod{p} \\\\quad\\\\text{(by FLT)} \\\\\\\\
\\\\text{leak} - a &\\\\equiv 0 \\\\pmod{p} \\\\\\\\
p &= \\\\gcd(\\\\text{leak} - a, n) \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} Fermat's Little Theorem states $a^p \\\\equiv a \\\\pmod{p}$. Since the leaked value $\\\\text{leak} \\\\equiv a^p \\\\pmod{n}$, it also satisfies $\\\\text{leak} \\\\equiv a^p \\\\pmod{p}$. Therefore $\\\\text{leak} \\\\equiv a \\\\pmod{p}$, meaning $p$ divides $(\\\\text{leak} - a)$. Computing $\\\\gcd(\\\\text{leak} - a, n)$ extracts $p$ directly. This is a simple single-shot attack requiring no iteration or lattice reduction.

\\\\textbf{References:} Common CTF pattern; based on Fermat's Little Theorem\`,
  priority: 'high',
  applicableCheck: rsaNeeds.nALeak,
  frontendCheck: (vals: Record<string, string>) => {
    try {
      if (!vals.n || !vals.a || !vals.leak) return 'ERROR: Missing required input: n, a, or leak\\nIMPLICIT_KEY_EXPOSURE=FAILED';
      const n = BigInt(vals.n);
      const a = BigInt(vals.a);
      const leak = BigInt(vals.leak);
      const g = gcd(leak - a, n);
      if (g > 1n && g < n) {
        const p = g;
        const q = n / p;
        return [
          \`Implicit Key Exposure\`,
          \`n = \${n}\`,
          \`a = \${a}\`,
          \`leak = \${leak}\`,
          \`\`,
          \`Results:\`,
          \`p = \${p}\`,
          \`q = \${q}\`,
          \`\`,
          \`Verification: p * q = \${p * q}\`,
          \`\`,
          \`IMPLICIT_KEY_EXPOSURE=SUCCESS\`,
        ].join('\\n');
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
`;export{e as default};