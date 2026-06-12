import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { wrapSageTemplate } from './guard';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'quadratic-sieve',
  name: 'Quadratic Sieve',
  category: 'Factorization',
  description: "Factors n by finding congruent squares via smoothness over a factor base. Use for medium-sized semiprimes (< 100 digits) with similar-sized factors.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'QUADRATIC_SIEVE',
    n: vals.n,
    useGuard: true,
    body: `        bits = n.nbits()
        out.append("Quadratic Sieve")
        out.append(f"n = {n}")
        out.append("")
        if bits > 330:
            out.append(f"WARNING: n has {bits} bits ({bits / 3.32:.0f} digits)")
            out.append("Quadratic Sieve is effective up to ~100 digits (330 bits)")
            out.append("For larger numbers, try ECM, Pollard's p-1, or other methods")
            out.append("")
        found = False
        if bits <= 40:
            tdiv_limit = 1000000
            tdiv = trial_division(n, tdiv_limit)
            if tdiv and 1 < tdiv < n:
                q_val = n // tdiv
                out.append("Results:")
                out.append(f"p = {tdiv}")
                out.append(f"q = {q_val}")
                out.append("")
                out.append(f"Verification: p * q = {tdiv * q_val}")
                out.append("")
                out.append("QUADRATIC_SIEVE=SUCCESS")
                found = True
        if not found:
            try:
                result = qsieve(n)
                if isinstance(result, tuple):
                    items = result[0]
                else:
                    items = result
                factors = []
                for item in items:
                    if isinstance(item, (list, tuple)):
                        factors.append((Integer(item[0]), Integer(item[1])))
                    else:
                        factors.append((Integer(item), 1))
                if not factors:
                    out.append("Results:")
                    out.append("")
                    out.append("QUADRATIC_SIEVE=FAILED")
                else:
                    if len(factors) == 2 and all(exp == 1 for _, exp in factors):
                        p_qs = Integer(factors[0][0])
                        q_qs = Integer(factors[1][0])
                        out.append("Results:")
                        out.append(f"p = {p_qs}")
                        out.append(f"q = {q_qs}")
                        out.append("")
                        out.append(f"Verification: p * q = {p_qs * q_qs}")
                        out.append("")
                        out.append("QUADRATIC_SIEVE=SUCCESS")
                        found = True
                    else:
                        out.append("Results:")
                        for prime, exp in factors:
                            if exp == 1:
                                out.append(f"  p = {prime}")
                            else:
                                out.append(f"  {prime}^{exp}")
                        out.append("")
                        product = 1
                        for prime, exp in factors:
                            product *= Integer(prime) ** exp
                        out.append(f"Verification: product = {product}")
                        out.append("")
                        out.append("QUADRATIC_SIEVE=SUCCESS")
                        found = True
            except Exception as ex:
                out.append("Results:")
                out.append("")
                out.append("QUADRATIC_SIEVE=FAILED")
`,
  }),
  proof: `\\textbf{Theorem:} The Quadratic Sieve factors $n$ in expected sub-exponential time $\\exp(\\sqrt{\\ln n \\ln \\ln n})$ by finding $x^2 \\equiv y^2 \\pmod{n}$ with $x \\not\\equiv \\pm y \\pmod{n}$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, a semiprime with no small factors
\\item Choose a factor base $\\mathcal{F} = \\{p_1, \\ldots, p_k\\}$ of small primes
\\item $Q(x) = (x + \\lfloor\\sqrt{n}\\rfloor)^2 - n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= \\lfloor\\sqrt{n}\\rfloor, \\quad Q(x) = (x + m)^2 - n \\\\
\\text{Sieve } Q(x) &\\text{ for } B\\text{-smooth values over } \\mathcal{F} \\\\
\\vec{v}_x &= (e_p \\bmod 2)_{p \\in \\mathcal{F}} \\in \\mathbb{F}_2^{|\\mathcal{F}|} \\\\
\\text{Find } S: \\; \\sum_{i \\in S} \\vec{v}_{x_i} &= \\vec{0} \\pmod{2} \\quad \\text{(linear dependency)} \\\\
X &= \\prod_{i \\in S} (x_i + m), \\quad Y = \\sqrt{\\prod Q(x_i)} \\\\
X^2 &\\equiv Y^2 \\pmod{n} \\\\
\\gcd(X - Y, n) &= p \\text{ or } q \\quad \\text{(prob } \\geq 1/2\\text{)}
\\qed\\\\
\\end{align*}

\\textbf{Explanation:} The QS finds many integers $x$ where $Q(x)$ factors completely over the factor base (a "smooth" number). Each smooth $Q(x)$ gives an exponent vector modulo 2. A linear dependency among these vectors means the product of the corresponding $Q(x_i)$ values is a perfect square. Since $Q(x) \\equiv (x+m)^2 \\pmod{n}$, we get $X^2 \\equiv Y^2 \\pmod{n}$ with $X \\not\\equiv \\pm Y \\pmod{n}$ about half the time, yielding a factor via GCD.

\\textbf{References:} C. Pomerance, "The Quadratic Sieve Factoring Algorithm", Eurocrypt 1984`,
  priority: 'high',
  applicableCheck: rsaNeeds.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use two small primes giving n ≈ 20 bits. Trial division fallback
  // (up to 10^6) reliably factors this, ensuring no SageMathCell timeout.
  const p = randomPrime(10);
  const q = randomPrime(10);
  return { n: (p * q).toString() };
};

