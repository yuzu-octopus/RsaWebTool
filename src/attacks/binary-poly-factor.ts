import type { Attack } from '../types';
import { sageGuardBlock } from './guard';

export const attack: Attack = {
  id: 'binary-poly-factor',
  name: 'Binary Polynomial Factoring',
  category: 'Factorization',
  description: "Factors n by factoring its binary representation as a polynomial over Z[x] and evaluating at x=2. Use when the binary convolution of p and q has no carries.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            out = []
            n = Integer(${vals.n})
            ${sageGuardBlock("BINARY_POLY_FACTOR", '            ')}
            if n > 0 and (n & (n - 1)) == 0:
                out.append(f"n is a power of 2: n = 2^{n.nbits() - 1}")
                out.append("No non-trivial factorization possible")
                out.append("BINARY_POLY_FACTOR=FAILED")
                print("\\n".join(out))
                return
            coeffs = n.digits(2)
            R.<x> = PolynomialRing(ZZ)
            f = sum(c * x**i for i, c in enumerate(coeffs))
            out.append(f"Polynomial: f(x) = {f}")
            out.append(f"Degree: {f.degree()}")
            out.append(f"f(2) = {f(2)}")
            out.append(f"f(2) == n: {f(2) == n}")
            out.append("")
            if f.is_irreducible():
                out.append(f"Polynomial f(x) = {f} is irreducible over ZZ[x]")
                out.append("No nontrivial polynomial factorization exists.")
                out.append("BINARY_POLY_FACTOR=FAILED")
                print("\\n".join(out))
                return
            factors = f.factor()
            out.append(f"Factorization of f(x): {factors}")
            out.append("")
            out.append("Evaluating factors at x=2:")
            for factor, mult in factors:
                val = factor(2)
                out.append(f"  {factor}(2) = {val}")
                if mult > 1:
                    out.append(f"    multiplicity: {mult}")
            product = 1
            for factor, mult in factors:
                product *= factor(2)**mult
            out.append(f"\\nProduct of evaluations: {product}")
            out.append(f"Original n: {n}")
            out.append(f"Match: {product == n}")
            if product == n:
                proper_vals = [factor(2) for factor, _ in factors if 1 < factor(2) < n]
                if proper_vals:
                    out.append("\\nPotential factors found:")
                    for factor, mult in factors:
                        val = factor(2)
                        if val > 1:
                            out.append(f"  {val} (is prime: {val.is_prime()})")
                    if len(proper_vals) >= 2:
                        p_factor = Integer(proper_vals[0])
                        q_factor = Integer(proper_vals[1])
                        if p_factor > 1 and q_factor > 1 and p_factor * q_factor == n:
                            out.append(f"p = {p_factor}")
                            out.append(f"q = {q_factor}")
                    out.append("")
                    out.append("BINARY_POLY_FACTOR=SUCCESS")
                else:
                    out.append("No proper factors: polynomial factorization is trivial (irreducible f(x)).")
                    out.append("BINARY_POLY_FACTOR=FAILED")
            else:
                out.append("Polynomial factorization does not yield integer factors.")
                out.append("BINARY_POLY_FACTOR=FAILED")
            print("\\n".join(out))
        except Exception as e:
            try:
                out.append(f"Error in Binary Polynomial Factoring: {e}")
                out.append("BINARY_POLY_FACTOR=FAILED")
                print("\\n".join(out))
            except:
                print(f"Error in Binary Polynomial Factoring: {e}")
                print("BINARY_POLY_FACTOR=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BINARY_POLY_FACTOR=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $n$'s binary polynomial $f(x) = \\sum b_i x^i$ factors over $\\mathbb{Z}[x]$, then evaluating the factors at $x = 2$ recovers the integer factors of $n$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = \\sum b_i 2^i$, binary digits $b_i \\in \\{0,1\\}$
\\item $f(x) = \\sum b_i x^i \\in \\mathbb{Z}[x]$, so $f(2) = n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(x) &= \\sum b_i x^i \\\\
f(x) &= \\prod g_i(x)^{e_i} \\quad \\text{(irreducible factorization over } \\mathbb{Z}[x]\\text{)} \\\\
n = f(2) &= \\prod g_i(2)^{e_i} \\\\
\\exists i: g_i(2) &= p \\text{ or } q
\\end{align*}
If the binary convolution of $p$ and $q$ produces no carries, then $f_{pq}(x) = f_p(x) \\cdot f_q(x)$ and the polynomial factorization separates them.

\\textbf{Explanation:} When multiplying two integers whose binary representations trigger no carries (i.e., every bit position gets at most one 1 from each factor), the binary polynomial of the product equals the product of the binary polynomials. Factoring this polynomial over $\\mathbb{Z}[x]$ and evaluating at $x = 2$ recovers the original integers. This is a rare special case but works instantly when applicable.

\\textbf{References:} Coppersmith, "Finding a Small Root of a Univariate Modular Equation", 1996; von zur Gathen & Gerhard, "Modern Computer Algebra", Chapter 5`,
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
