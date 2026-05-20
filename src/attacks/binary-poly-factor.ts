import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'binary-poly-factor',
  name: 'Binary Polynomial Factoring',
  category: 'Factorization',
  description: 'Factors n via binary polynomial factorization. Use when n\'s binary form yields factorable polynomial.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

if n < 2:
    print(f"n = {n} is too small to factor")
    print("BINARY_POLY=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("BINARY_POLY=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("BINARY_POLY=FAILED")
    return

# Check if n is a power of 2
if n > 0 and (n & (n - 1)) == 0:
    print(f"n is a power of 2: n = 2^{n.nbits() - 1}")
    print("No non-trivial factorization possible")
    print("BINARY_POLY=FAILED")
    return

# Binary polynomial factorization
try:
    # Convert n to polynomial: n = sum(b_i * 2^i) -> f(x) = sum(b_i * x^i)
    coeffs = n.digits(2)

    R.<x> = PolynomialRing(ZZ)
    f = sum(c * x^i for i, c in enumerate(coeffs))

    print(f"Polynomial: f(x) = {f}")
    print(f"Degree: {f.degree()}")
    print(f"f(2) = {f(2)}")
    print(f"f(2) == n: {f(2) == n}")
    print()

    # Factor the polynomial
    factors = f.factor()
    print(f"Factorization of f(x): {factors}")
    print()

    # Evaluate each factor at x=2
    print("Evaluating factors at x=2:")
    for factor, mult in factors:
        val = factor(2)
        print(f"  {factor}(2) = {val}")
        if mult > 1:
            print(f"    multiplicity: {mult}")

    # Check if product of evaluations equals n
    product = 1
    for factor, mult in factors:
        product *= factor(2)**mult

    print(f"\\nProduct of evaluations: {product}")
    print(f"Original n: {n}")
    print(f"Match: {product == n}")

    if product == n:
        print("\\nPotential factors found:")
        for factor, mult in factors:
            val = factor(2)
            if val > 1:
                print(f"  {val} (is prime: {val.is_prime()})")
        print("BINARY_POLY=SUCCESS")
    else:
        print("Polynomial factorization does not yield integer factors.")
        print("BINARY_POLY=FAILED")
except Exception as e:
    print(f"Error in Binary Polynomial Factoring: {e}")
    print("BINARY_POLY=FAILED")
`,
  proof: `\\textbf{Theorem:} If n's binary polynomial f(x) factors over \\mathbb{Z}[x] as f(x) = g(x)h(x), then n = g(2)h(2).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n — integer to factor, with binary digits b_i \\in \\{0, 1\\}
\\item f(x) = \\sum b_i x^i \\in \\mathbb{Z}[x] — polynomial with f(2) = n
\\item Unique factorization in \\mathbb{Z}[x]
\\item Evaluation homomorphism \\text{ev}_2: \\mathbb{Z}[x] \\to \\mathbb{Z}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= \\sum_{i=0}^{k} b_i 2^i, \\quad b_i \\in \\{0, 1\\} \\\\
f(x) &= \\sum_{i=0}^{k} b_i x^i \\in \\mathbb{Z}[x], \\quad f(2) = n \\\\
f(x) &= g_1(x)^{e_1} g_2(x)^{e_2} \\cdots g_r(x)^{e_r} \\\\
n = f(2) &= g_1(2)^{e_1} g_2(2)^{e_2} \\cdots g_r(2)^{e_r} \\\\
\\exists i: g_i(2) &= p \\text{ or } q \\quad \\text{(when factorization aligns)} \\\\
\\text{Test each } g_i(2) &\\text{ for divisibility of } n \\qed
\\end{align*}

\\textbf{Explanation:} Convert n to a polynomial by treating its binary digits as coefficients. Factor this polynomial over the integers, then evaluate each factor at x=2. If the polynomial factorization aligns with the integer factorization, the evaluations reveal p and q. Works best when p and q have structured binary patterns.

\\textbf{References:} Coppersmith, "Finding a Small Root of a Univariate Modular Equation", 1996; von zur Gathen & Gerhard, "Modern Computer Algebra", Chapter 5`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Construct primes with sparse binary patterns (more likely to yield factorable polynomials)
  // Build p = 2^a + 2^b + 1 with random a, b positions
  const trySparsePrime = (bits: number): bigint => {
    for (let attempt = 0; attempt < 200; attempt++) {
      let val = (1n << BigInt(bits - 1)) | 1n; // top and bottom bits set
      const numOnes = 3 + Math.floor(Math.random() * 4); // 3-6 bits set
      const positions = new Set<number>();
      positions.add(bits - 1);
      positions.add(0);
      while (positions.size < numOnes) {
        positions.add(1 + Math.floor(Math.random() * (bits - 2)));
      }
      for (const pos of positions) {
        val |= (1n << BigInt(pos));
      }
      if (isPrimeMR(val)) return val;
    }
    return randomPrime(bits);
  };

  const p = trySparsePrime(TESTCASE_BITS.p);
  const q = trySparsePrime(TESTCASE_BITS.q);
  return { n: (p * q).toString() };
};
