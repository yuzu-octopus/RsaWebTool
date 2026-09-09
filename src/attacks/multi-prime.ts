import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { randomPrime } from '../utils/testcases/core';
import { wrapSageTemplate, validateNumeric} from './guard';

export const attack: Attack = {
  id: 'multi-prime',
  name: 'Multi-Prime RSA',
  category: 'Factorization',
  description: 'Factors multi-prime n = p1...pk (k >= 3) via trial division to 10^4 then Sage factor() (ECM/QS). Practical in SageCell to <~60 digits; each factor ~n^{1/k} bits.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  usageGuide: `Use when n has 3 or more prime factors (multi-prime RSA).

How to use:
1. Provide n (the modulus)
2. Trial division finds small factors, then Sage's factor() handles the rest
3. All prime factors are returned

Tip: Multi-prime RSA uses CRT for faster decryption but is weaker against factorization. If you see n with more than 2 factors, this is the right tool.`,
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'MULTI_PRIME',
    n: validateNumeric(vals.n, 'n'),
    body: `        n_int = int(n)
        def factor_all(m):
            fac = []
            rem = int(m)
            for p in prime_range(2, 10000):
                p_int = int(p)
                while rem % p_int == 0:
                    fac.append(Integer(p_int))
                    rem //= p_int
            if rem == 1:
                return sorted(fac)
            rem_sage = Integer(rem)
            if rem_sage.is_prime():
                fac.append(rem_sage)
                return sorted(fac)
            for p, e in factor(rem_sage):
                fac.extend([p] * e)
            return sorted(fac)
        out.append("Multi-Prime RSA")
        out.append(f"n = {n}")
        out.append("")
        prime_factors = factor_all(n)
        all_prime = all(p.is_prime() for p in prime_factors)
        found = False
        out.append("Results:")
        if len(prime_factors) >= 2 and all_prime:
            for i, p in enumerate(prime_factors):
                out.append(f"p[{i+1}] = {p}")
            out.append("")
            product = 1
            for p in prime_factors:
                product *= p
            out.append(f"Verification: product = {product}")
            out.append("")
            out.append("MULTI_PRIME=SUCCESS")
            found = True
        elif len(prime_factors) >= 2:
            for i, p in enumerate(prime_factors):
                out.append(f"p[{i+1}] = {p}")
            out.append("")
            out.append("MULTI_PRIME=FAILED")
        else:
            out.append("")
            out.append("MULTI_PRIME=FAILED")
        if not found:
            out.append("MULTI_PRIME=FAILED")`,
    useGuard: true,
  }),
  proof: `\\textbf{Size proposition:} Multi-prime RSA uses $n = \\prod_{i=1}^{k} p_i$ with $k \\geq 3$, so each factor is $p_i \\approx n^{1/k}$ bits (for $k=3$, 512-bit $n$ gives $p_i \\approx 170$ bits vs 256 for standard RSA), making ECM/Pollard-rho exponentially faster per factor.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p_1 p_2 \\cdots p_k$ with $k \\geq 3$
\\item $\\phi(n) = \\prod_{i=1}^{k} (p_i - 1)$
\\item $ed \\equiv 1 \\pmod{\\phi(n)}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= \\prod_{i=1}^{k} p_i,\\; \\phi(n) = \\prod_{i=1}^{k} (p_i - 1) \\\\
p_i &\\approx n^{1/k} \\text{ (each prime is smaller than in 2-prime RSA)} \\\\
\\text{CRT decryption: } m_i &= c^{d \\bmod (p_i-1)} \\bmod p_i \\\\
\\text{Factorization cost } &\\propto \\min_i (\\text{cost to factor } p_i) \\\\
\\text{Each } p_i &\\approx n^{1/k} \\text{ bits. For } k=3,\\; 512\\text{-bit } n \\rightarrow p_i \\approx 170 \\text{ bits} \\\\
&\\text{(vs } 256 \\text{ bits for standard RSA), making ECM/Pollard's rho exponentially faster} \\qed
\\end{align*}

\\textbf{Explanation:} Multi-prime RSA (also called "RSA Multiprime") uses three or more primes for a fixed modulus size, making each prime factor smaller and easier to find via generic factorization algorithms. The attack trial-divides to 10,000 (honest note: this only catches small factors itself) and then delegates the cofactor to Sage's factor() (ECM/quadratic sieve), which is what does the real work — practical in SageCell to <~60 digits.

\\textbf{References:} G. J. Simmons and M. J. Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", Cryptologia, 1976; D. Boneh, "Twenty Years of Attacks on RSA", Notices of the AMS, 1999`,
  priority: 'medium',
  applicableCheck: rsaNeeds.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Small-case sizing (3x64-bit primes, n ~192-bit): ECM-solvable in SageCell
  // in seconds, unlike the 768-bit production shape. The cofactor path
  // (trial division to 10^4, then factor()) is identical at any size.
  const kp = generateSmallMultiPrimeForTest();
  return { n: kp.n.toString(), e: kp.e.toString() };
};

function generateSmallMultiPrimeForTest(): { n: bigint; e: bigint } {
  const p = randomPrime(64);
  let q = randomPrime(64);
  while (q === p) q = randomPrime(64);
  let r = randomPrime(64);
  while (r === p || r === q) r = randomPrime(64);
  return { n: p * q * r, e: 65537n };
};
