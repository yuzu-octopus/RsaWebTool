var e=`import type { Attack } from '../types';
import { bitLength, rsaNeeds, noopSageTemplate } from './_rsaHelpers';
import { isPrimeMR, randomPrime } from '../utils/testcases/core';
import { crtRSA, gcd, modInverse, modPow } from '../utils/bigint';

const DEFAULT_FACTOR_BOUND = 1_000_000;
const MAX_FACTOR_BOUND = 5_000_000;

function sievePrimes(limit: number): number[] {
  const sieve = new Uint8Array(limit + 1);
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (sieve[i] === 0) {
      primes.push(i);
      if (i * i <= limit) {
        for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
      }
    }
  }
  return primes;
}

interface PrimePower {
  base: bigint;
  exp: number;
}

/**
 * Totally factor n by trial division up to bound. A leftover > 1 that is
 * itself prime completes the factorization; a composite leftover means the
 * bound was too small and null is returned.
 */
function trialFactor(n: bigint, bound: number): PrimePower[] | null {
  const factors: PrimePower[] = [];
  let rest = n;
  for (const prime of sievePrimes(bound)) {
    const p = BigInt(prime);
    if (p * p > rest) break;
    if (rest % p === 0n) {
      let exp = 0;
      while (rest % p === 0n) {
        rest /= p;
        exp++;
      }
      factors.push({ base: p, exp });
    }
  }
  if (rest === 1n) return factors;
  if (isPrimeMR(rest)) {
    factors.push({ base: rest, exp: 1 });
    return factors;
  }
  return null;
}

export const attack: Attack = {
  // This attack runs entirely in the browser via frontendCheck — no SageMath needed.
  // The sageTemplate is a no-op that returns a clear message if ever triggered.
  sageTemplate: (_) => noopSageTemplate('SMALL_PRIME_CRT'),
  id: 'small-prime-crt',
  name: 'Small-Prime CRT',
  category: 'Factorization',
  description: 'Decrypts RSA moduli that factor fully into small primes: trial-divides n, decrypts c per prime power, and CRT-combines the results. Use when n has only small factors.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'factorBound', label: 'factorBound (trial-division bound, optional)', placeholder: '1000000', required: false, multiline: false },
  ],
  usageGuide: \`Use when n factors fully into small primes (weak key generation, CTF challenges).

How to use:
1. Provide n, e, and c
2. Trial division up to factorBound (default 1000000) extracts every prime factor
3. Each ciphertext fragment is decrypted modulo its prime power, then CRT-combined into m

Tip: Prime powers p^k are handled as single CRT moduli with phi p^k - p^(k-1). If trial division leaves a composite remainder, increase factorBound or use a general factoring attack instead.\`,
  frontendCheck: (vals: Record<string, string>) => {
    try {
      if (!vals.n || !vals.e || !vals.c) return 'ERROR: Missing required input: n, e, or c\\nSMALL_PRIME_CRT=FAILED';
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const c = BigInt(vals.c);
      if (n <= 1n || e <= 1n || c < 0n || c >= n) {
        return 'ERROR: Require 1 < n, 1 < e, and 0 <= c < n\\nSMALL_PRIME_CRT=FAILED';
      }
      let bound = DEFAULT_FACTOR_BOUND;
      let clampNote = '';
      if ((vals.factorBound || '').trim()) {
        bound = Number(vals.factorBound);
        if (!Number.isInteger(bound) || bound < 2) {
          return 'ERROR: factorBound must be an integer >= 2\\nSMALL_PRIME_CRT=FAILED';
        }
        if (!Number.isSafeInteger(bound)) {
          return 'ERROR: factorBound exceeds Number precision (hang guard); use an integer <= ' + MAX_FACTOR_BOUND + '\\nSMALL_PRIME_CRT=FAILED';
        }
        if (bound > MAX_FACTOR_BOUND) {
          clampNote = \` (clamped to \${MAX_FACTOR_BOUND}, hang guard)\`;
          bound = MAX_FACTOR_BOUND;
        }
      }

      const factors = trialFactor(n, bound);
      if (!factors || factors.length === 0) return null;

      const remainders: bigint[] = [];
      const moduli: bigint[] = [];
      const lines: string[] = [
        \`Small-Prime CRT\`,
        \`n = \${n}\`,
        \`e = \${e}\`,
        \`c = \${c}\`,
        ...(clampNote ? [\`note: factorBound\${clampNote}\`] : []),
        \`\`,
        \`Results:\`,
      ];
      for (const { base: p, exp } of factors) {
        const q = p ** BigInt(exp);
        const phi = q - q / p;
        if (phi === 1n) {
          // q = 2: the multiplicative group is trivial, so c ≡ m (mod 2).
          const mi = c % q;
          remainders.push(mi);
          moduli.push(q);
          lines.push(\`factor: \${p}\${exp > 1 ? \`^\${exp}\` : ''} (m_i = \${mi})\`);
          continue;
        }
        const d = modInverse(e % phi, phi);
        if (d === null) {
          return \`ERROR: e is not invertible modulo phi(\${p}\${exp > 1 ? \`^\${exp}\` : ''}) — per-factor decryption is undefined\\nSMALL_PRIME_CRT=FAILED\`;
        }
        const mi = modPow(c % q, d, q);
        remainders.push(mi);
        moduli.push(q);
        lines.push(\`factor: \${p}\${exp > 1 ? \`^\${exp}\` : ''} (m_i = \${mi})\`);
      }
      const m = crtRSA(remainders, moduli);
      if (m === null) return null;
      if (modPow(m, e, n) !== c) {
        return 'ERROR: CRT recombination failed verification (m^e mod n != c)\\nSMALL_PRIME_CRT=FAILED';
      }
      lines.push(\`\`);
      lines.push(\`m = \${m}\`);
      lines.push(\`\`);
      lines.push(\`Verification: m^e mod n = \${modPow(m, e, n)}\`);
      lines.push(\`\`);
      lines.push(\`SMALL_PRIME_CRT=SUCCESS\`);
      return lines.join('\\n');
    } catch (err) {
      console.warn('[small-prime-crt] frontendCheck error:', err);
      return null;
    }
  },
  proof: \`\\\\textbf{Theorem:} If $n = \\\\prod_{i=1}^{k} q_i$ with $q_i = p_i^{e_i}$ pairwise coprime and every $q_i$ recovered by trial division, then $m$ is recovered by per-factor decryption plus CRT.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $n = \\\\prod_{i=1}^{k} q_i$, $q_i = p_i^{e_i}$ for distinct primes $p_i$
\\\\item $\\\\phi(q_i) = q_i - q_i / p_i$ (Euler's totient for prime powers)
\\\\item $c \\\\equiv m^e \\\\pmod{n}$, $\\\\gcd(e, \\\\phi(q_i)) = 1$ for all $i$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
d_i &\\\\equiv e^{-1} \\\\pmod{\\\\phi(q_i)} \\\\\\\\
m_i &\\\\equiv c^{d_i} \\\\equiv m^{e d_i} \\\\equiv m \\\\pmod{q_i} \\\\quad\\\\text{(Euler's theorem per factor)} \\\\\\\\
m &= \\\\text{CRT}(m_1, \\\\ldots, m_k;\\\\; q_1, \\\\ldots, q_k) \\\\\\\\
m &\\\\equiv m_i \\\\equiv m \\\\pmod{q_i}\\\\ \\\\forall i \\\\implies m \\\\equiv m \\\\pmod{n} \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} Trial division up to the bound extracts every prime factor of a smooth modulus (a leftover prime remainder completes the factorization directly). Each fragment $c \\\\bmod q_i$ is an independent RSA ciphertext under the prime-power modulus $q_i$, decrypted with the per-factor exponent $d_i$. Since distinct prime powers are coprime, the Chinese Remainder Theorem lifts the fragments to the unique $m \\\\bmod n$, verified by checking $m^e \\\\equiv c \\\\pmod{n}$.

\\\\textbf{References:} J. Hoffstein, J. Pipher, J. Silverman, "An Introduction to Mathematical Cryptography", Ch.~3 (RSA/CRT); D. Boneh, "Twenty Years of Attacks on RSA", Notices of the AMS, 1999\`,
  priority: 'medium',
  applicableCheck: rsaNeeds.nEC,
};

export const generateTestcase = (): Record<string, string> => {
  // 13 distinct 19-bit primes stay below the default trial-division bound
  // while giving n ~ 240 bits, so the attack terminates in milliseconds.
  const primes = new Set<bigint>();
  while (primes.size < 13) primes.add(randomPrime(19));
  const list = [...primes];
  const n = list.reduce((a, b) => a * b, 1n);
  const phi = list.reduce((a, p) => a * (p - 1n), 1n);
  let e = 65537n;
  while (gcd(e, phi) !== 1n) e += 2n;
  const nBits = bitLength(n);
  let m: bigint;
  do {
    const bytes = new Uint8Array(Math.ceil(nBits / 8));
    crypto.getRandomValues(bytes);
    let v = 0n;
    for (const b of bytes) v = (v << 8n) | BigInt(b);
    m = v % n;
  } while (m < 2n || gcd(m, n) !== 1n);
  const c = modPow(m, e, n);
  return { n: n.toString(), e: e.toString(), c: c.toString() };
};
`;export{e as default};