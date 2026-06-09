var e=`import type { Attack } from '../types';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'binary-poly-factor',
  name: 'Binary Polynomial Factoring',
  category: 'Factorization',
  description: "Factors n by factoring its binary representation as a polynomial over Z[x] and evaluating at x=2. Use when the binary convolution of p and q has no carries.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'BINARY_POLY_FACTOR',
    n: vals.n,
    body: \`        out.append("Binary Polynomial Factoring")
        out.append(f"n = {n}")
        out.append("")
        found = False
        if n > 0 and (n & (n - 1)) == 0:
            out.append("Results:")
            out.append("")
            out.append("BINARY_POLY_FACTOR=FAILED")
        else:
            coeffs = n.digits(2)
            R.<x> = PolynomialRing(ZZ)
            f = sum(c * x**i for i, c in enumerate(coeffs))
            if f.is_irreducible():
                out.append("Results:")
                out.append("")
                out.append("BINARY_POLY_FACTOR=FAILED")
            else:
                factors = f.factor()
                product = 1
                for factor, mult in factors:
                    product *= factor(2)**mult
                if product == n:
                    proper_vals = [factor(2) for factor, _ in factors if 1 < factor(2) < n]
                    if proper_vals and len(proper_vals) >= 2:
                        p_factor = Integer(proper_vals[0])
                        q_factor = Integer(proper_vals[1])
                        if p_factor > 1 and q_factor > 1 and p_factor * q_factor == n:
                            out.append("Results:")
                            out.append(f"p = {p_factor}")
                            out.append(f"q = {q_factor}")
                            out.append("")
                            out.append(f"Verification: p * q = {p_factor * q_factor}")
                            out.append("")
                            out.append("BINARY_POLY_FACTOR=SUCCESS")
                            found = True
                if not found:
                    out.append("Results:")
                    out.append("")
                    out.append("BINARY_POLY_FACTOR=FAILED")
        if not found:
            out.append("BINARY_POLY_FACTOR=FAILED")\`,
    useGuard: true,
  }),
  proof: \`\\\\textbf{Theorem:} If $n$'s binary polynomial $f(x) = \\\\sum b_i x^i$ factors over $\\\\mathbb{Z}[x]$, then evaluating the factors at $x = 2$ recovers the integer factors of $n$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $n = \\\\sum b_i 2^i$, binary digits $b_i \\\\in \\\\{0,1\\\\}$
\\\\item $f(x) = \\\\sum b_i x^i \\\\in \\\\mathbb{Z}[x]$, so $f(2) = n$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
f(x) &= \\\\sum b_i x^i \\\\\\\\
f(x) &= \\\\prod g_i(x)^{e_i} \\\\quad \\\\text{(irreducible factorization over } \\\\mathbb{Z}[x]\\\\text{)} \\\\\\\\
n = f(2) &= \\\\prod g_i(2)^{e_i} \\\\\\\\
\\\\exists i: g_i(2) &= p \\\\text{ or } q
\\\\qed\\\\\\\\
\\\\end{align*}
If the binary convolution of $p$ and $q$ produces no carries, then $f_{pq}(x) = f_p(x) \\\\cdot f_q(x)$ and the polynomial factorization separates them.

\\\\textbf{Explanation:} When multiplying two integers whose binary representations trigger no carries (i.e., every bit position gets at most one 1 from each factor), the binary polynomial of the product equals the product of the binary polynomials. Factoring this polynomial over $\\\\mathbb{Z}[x]$ and evaluating at $x = 2$ recovers the original integers. This is a rare special case but works instantly when applicable.

\\\\textbf{References:} Coppersmith, "Finding a Small Root of a Univariate Modular Equation", 1996; von zur Gathen & Gerhard, "Modern Computer Algebra", Chapter 5\`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

// Pre-computed no-carry products: polynomials f(x) = p(x)·q(x) where binary
// convolution has no carries, so f(x) factors as p(x)·q(x) over ZZ[x].
// Verified: p=1033 (2^10+2^3+1), q=4099 (2^12+2+1) — bit-position sets
// [0,3,10] × [0,1,12] produce unique sums {0,1,3,4,10,11,12,15,22}.
const NO_CARRY_N = 4234267n; // = 1033n * 4099n

export const generateTestcase = (): Record<string, string> => {
  return { n: NO_CARRY_N.toString() };
};
`;export{e as default};