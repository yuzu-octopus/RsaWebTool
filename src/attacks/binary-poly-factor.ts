import type { Attack } from '../types';

export const attack: Attack = {
  id: 'binary-poly-factor',
  name: 'Binary Polynomial Factoring',
  category: 'Factorization',
  description: 'Factors n via binary polynomial factorization. Use when n\'s binary form yields factorable polynomial.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("BINARY_POLY_FACTOR=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print(f"Verification: 2 * {n // 2} = {n}")
                print("BINARY_POLY_FACTOR=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("No factorization possible")
                print("BINARY_POLY_FACTOR=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("BINARY_POLY_FACTOR=SUCCESS")
                return
            if n > 0 and (n & (n - 1)) == 0:
                print(f"n is a power of 2: n = 2^{n.nbits() - 1}")
                print("No non-trivial factorization possible")
                print("BINARY_POLY_FACTOR=FAILED")
                return
            coeffs = n.digits(2)
            R.<x> = PolynomialRing(ZZ)
            f = sum(c * x**i for i, c in enumerate(coeffs))
            print(f"Polynomial: f(x) = {f}")
            print(f"Degree: {f.degree()}")
            print(f"f(2) = {f(2)}")
            print(f"f(2) == n: {f(2) == n}")
            print()
            if f.is_irreducible():
                print(f"Polynomial f(x) = {f} is irreducible over ZZ[x]")
                print("No nontrivial polynomial factorization exists.")
                print("BINARY_POLY_FACTOR=FAILED")
                return
            factors = f.factor()
            print(f"Factorization of f(x): {factors}")
            print()
            print("Evaluating factors at x=2:")
            for factor, mult in factors:
                val = factor(2)
                print(f"  {factor}(2) = {val}")
                if mult > 1:
                    print(f"    multiplicity: {mult}")
            product = 1
            for factor, mult in factors:
                product *= factor(2)**mult
            print(f"\\nProduct of evaluations: {product}")
            print(f"Original n: {n}")
            print(f"Match: {product == n}")
            if product == n:
                proper_vals = [factor(2) for factor, _ in factors if 1 < factor(2) < n]
                if proper_vals:
                    print("\\nPotential factors found:")
                    for factor, mult in factors:
                        val = factor(2)
                        if val > 1:
                            print(f"  {val} (is prime: {val.is_prime()})")
                    print("BINARY_POLY_FACTOR=SUCCESS")
                else:
                    print("No proper factors: polynomial factorization is trivial (irreducible f(x)).")
                    print("BINARY_POLY_FACTOR=FAILED")
            else:
                print("Polynomial factorization does not yield integer factors.")
                print("BINARY_POLY_FACTOR=FAILED")
        except Exception as e:
            print(f"Error in Binary Polynomial Factoring: {e}")
            print("BINARY_POLY_FACTOR=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BINARY_POLY_FACTOR=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $n$'s binary polynomial $f(x) = \\sum b_i x^i$ factors over $\\mathbb{Z}[x]$, then evaluating at $x=2$ reveals factors of $n$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = \\sum b_i 2^i$, binary digits $b_i \\in \\{0,1\\}$
\\item $f(x) = \\sum b_i x^i \\in \\mathbb{Z}[x]$, $f(2) = n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(x) &= \\sum b_i x^i \\\\
f(x) &= \\prod g_i(x)^{e_i} \\quad\\text{(factor over } \\mathbb{Z}[x]\\text{)} \\\\
n = f(2) &= \\prod g_i(2)^{e_i} \\\\
\\exists i: g_i(2) &= p \\text{ or } q \\qed
\\end{align*}

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
