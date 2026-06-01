import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'ecm2',
  name: 'ECM Full Factorization',
  category: 'Factorization',
  description: 'Factors n completely via repeated ECM with recursive factor removal. Use when n may have multiple prime factors beyond two.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'ECM2',
    n: vals.n,
    body: `        from sage.libs.libecm import ecmfactor
        def ecm_factor_all(m, depth):
            if m == 1:
                return []
            if m.is_prime():
                return [m]
            B1_vals = [2000, 10000, 50000]
            found_p = None
            for B1_cur in B1_vals:
                for attempt in range(10):
                    try:
                        result = ecmfactor(m, B1_cur)
                        if result[0]:
                            p = result[0]
                            if p != 1 and p != m and m % p == 0:
                                found_p = p
                                break
                    except Exception:
                        continue
                if found_p is not None:
                    break
            if found_p is not None:
                return ecm_factor_all(found_p, depth + 1) + ecm_factor_all(m // found_p, depth + 1)
            fac = factor(m)
            result = []
            for prime, exp in fac:
                for _ in range(exp):
                    result.append(prime)
            return result
        out.append("ECM Full Factorization")
        out.append(f"n = {n}")
        out.append("")
        found = False
        factors = ecm_factor_all(n, 0)
        factors.sort()
        out.append("Results:")
        if len(factors) == 2:
            out.append(f"p = {factors[0]}")
            out.append(f"q = {factors[1]}")
        else:
            for i, f in enumerate(factors):
                out.append(f"p[{i+1}] = {f}")
        out.append("")
        product = 1
        for f in factors:
            product *= f
        out.append(f"Verification: product = {product}")
        if product == n:
            out.append("")
            out.append("ECM2=SUCCESS")
            found = True
        else:
            out.append("")
            out.append("ECM2=FAILED")
        if not found:
            out.append("ECM2=FAILED")`,
    useGuard: true,
  }),
  proof: `\\textbf{Theorem:} Repeated ECM with recursive factor removal extracts all prime factors of a composite integer.

\\textbf{Setup:}
\\begin{itemize}
\\item ECM finds one prime factor $p_i$ at a time using random elliptic curves
\\item Composite remainder $n' = n / p_i$ may contain further factors
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p_1^{e_1} p_2^{e_2} \\cdots p_k^{e_k} \\\\
\\text{ECM finds } p_i &\\implies n' = n / p_i \\\\
\\text{Recurse on } p_i \\text{ and } n' &\\text{ until all factors are prime} \\\\
\\text{Total time } &\\propto \\text{largest prime factor's ECM difficulty} \\qed
\\end{align*}

\\textbf{Explanation:} ECM finds a factor when the elliptic curve's group order divides a smooth bound $B$. By extracting one factor at a time and recursing on both the factor and the cofactor, the full factorization is recovered. The $B_1$ bound is gradually increased to handle larger factors.

\\textbf{References:} H. W. Lenstra Jr., "Factoring Integers with Elliptic Curves", Annals of Mathematics, 1987`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with 3 prime factors for multi-round ECM demonstration
  // 48-bit smallest factor (~15 digits) — ECM with B1 up to 50000 finds it quickly
  const p1 = randomPrime(48);
  const p2 = randomPrime(56);
  const p3 = randomPrime(56);
  return { n: (p1 * p2 * p3).toString() };
};
