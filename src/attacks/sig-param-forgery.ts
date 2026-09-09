import type { Attack } from '../types';
import { noopSageTemplate } from './_rsaHelpers';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'sig-param-forgery',
  name: 'Signature-Parameter Forgery (e=1 / Crafted n)',
  category: 'Message / Protocol',
  description:
    'Forges textbook-RSA signatures under degenerate parameters: e=1 (any sig = m verifies) or crafted n = sig - m. Use to demonstrate why verifiers must reject e=1 and validate key parameters.',
  inputs: [
    { name: 'm', label: 'm (message as integer)', placeholder: 'Enter message m...', multiline: true, rows: 3 },
    { name: 'sig', label: 'sig (forged signature)', placeholder: 'Enter signature sig...', multiline: true, rows: 3 },
    { name: 'n', label: 'n (modulus; default sig - m)', placeholder: 'Enter modulus n...', multiline: true, rows: 3, required: false },
    { name: 'e', label: 'e (default 1)', placeholder: '1', multiline: false, required: false },
  ],
  sageTemplate: (_) => noopSageTemplate('SIG_PARAM_FORGERY'),
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.m || !vals.sig) return Promise.resolve(null);
    try {
      const m = BigInt(vals.m);
      const sig = BigInt(vals.sig);
      const rawN = (vals.n || '').trim();
      const rawE = (vals.e || '').trim();
      const e = rawE ? BigInt(rawE) : 1n;
      if (e !== 1n) return Promise.resolve(null);
      if (m < 0n || sig < 0n) return Promise.resolve(null);
      // Crafted-n mode: no n supplied -> n = sig - m, so sig = m (mod n).
      const n = rawN ? BigInt(rawN) : sig - m;
      if (n <= 1n) return Promise.resolve(null);
      if (sig % n !== ((m % n) + n) % n) return Promise.resolve(null);
      // Forgery demo: s' = m + n also verifies, and under e=1 s = m always does.
      const forged = ((m % n) + n) % n;
      return Promise.resolve(
        `Signature-Parameter Forgery (e=1 / Crafted n)\ne = 1\nn = ${n}\nm = ${m}\n\nResults:\ns = ${forged}\n\nVerification: s^e mod n = ${forged} = m mod n\n\nA verifier accepting e=1 (or attacker-chosen n = sig - m) is broken: every message has the trivial signature s = m. Reject e < 3 and validate modulus parameters.\n\nSIG_PARAM_FORGERY=SUCCESS`,
      );
    } catch (err) {
      console.warn('[sig-param-forgery] frontendCheck error:', err);
      return Promise.resolve(null);
    }
  },
  proof: `\\textbf{Theorem:} Under $e = 1$, verification $s^e \\equiv m \\pmod{n}$ collapses to $s \\equiv m \\pmod{n}$: the "signature" is the message itself. With attacker-chosen $n = s - m$, any $s > m$ verifies.

\\textbf{Setup:}
\\begin{itemize}
\\item Textbook verification: accept iff $s^e \\equiv m \\pmod{n}$
\\item Degenerate parameters: $e = 1$, or $n$ chosen by the prover
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
e = 1 &\\implies s^e \\equiv s \\pmod{n}:\\; s = m \\text{ always verifies} \\\\
n = s - m &\\implies s \\equiv m \\pmod{n}:\\; \\text{any } s > m \\text{ verifies its own crafted } n \\\\
s' = m + n &\\implies s' \\equiv m \\pmod{n} \\qed
\\end{align*}

\\textbf{Explanation:} This is a verifier-bug class, not a math break: no legitimate key has $e = 1$, and CAs never let signers pick $n$. The tool demonstrates both degenerate modes (explicit $e = 1$ with a given $n$, and crafted $n = \\text{sig} - m$) and shows the whole forgery family $s = m + k n$. The fix is parameter validation: reject $e < 3$ (practice: allowlist $3, 65537$) and never accept key parameters from the prover.

\\textbf{See also:} Homomorphic Forgery, Bleichenbacher Signature Forgery (e=3) — other signature-forgery surfaces.

\\textbf{References:} General RSA parameter-misuse folklore; cf. Bleichenbacher Crypto 2006 (lax-verifier forgeries)`,
  usageGuide: `Use to demonstrate degenerate-verifier forgeries (novelty / test-harness class, not a break of real RSA).

How to use:
1. e=1 mode: provide n, m, sig (= m). Verification s^1 = m mod n passes trivially.
2. Crafted-n mode: provide m and sig only; the tool sets n = sig - m, under which sig verifies for any sig > m.
3. The tool also exhibits the forgery family s = m + k·n.

Tip: Real verifiers must reject e < 3 and validate (n, e) out-of-band. See also Homomorphic Forgery.`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.m && !!p.sig,
};

export const generateTestcase = (): Record<string, string> => {
  // Crafted-n mode: pick m, pick sig > m with n = sig - m odd and > 1.
  const m = BigInt(Math.floor(Math.random() * 100000) + 42);
  const p = randomPrime(64);
  const sig = m + p;
  const n = sig - m;
  return { n: n.toString(), m: m.toString(), sig: sig.toString() };
};
