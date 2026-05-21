import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'simple-lattice',
  name: 'Simple Lattice',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from an approximation. Use when nearp ≈ p with |nearp - p| < n^(1/4).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'nearp', label: 'nearp (approximate p)', placeholder: 'Enter approximate p value...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    nearp = Integer(${v.nearp})
    if n <= 0 or nearp <= 0:
        print("SIMPLE_LATTICE=FAILED: invalid input values")
        quit()
    if nearp >= n:
        print("nearp must be less than n (modulus)")
        print("SIMPLE_LATTICE=FAILED: nearp >= n")
        quit()
    if n % nearp == 0:
        p = nearp
        q = n // p
        print("SIMPLE_LATTICE=SUCCESS: nearp exactly divides n")
        print(f"p={p}")
        print(f"q={q}")
        quit()
    if n % 2 == 0:
        print("n is even — cannot apply lattice attack")
        print("SIMPLE_LATTICE=FAILED: even modulus")
        quit()
    R.<x> = PolynomialRing(Zmod(n))
    f = nearp + x
    # Bound: |x| < n^(1/4) for Coppersmith with beta=0.5, deg=1
    bound = n.nth_root(4)
    print(f"Using bound X = {bound}")
    roots = f.small_roots(X=bound, beta=0.5, epsilon=0.05)
    if roots:
        p = Integer(nearp + roots[0])
        if n % p == 0:
            q = n // p
            print(f"Verification: p * q = {p * q}")
            if p * q == n:
                print("SIMPLE_LATTICE=SUCCESS")
                print(f"p={p}")
                print(f"q={q}")
            else:
                print("SIMPLE_LATTICE=FAILED: verification mismatch")
        else:
            print("SIMPLE_LATTICE=FAILED: recovered p does not divide n")
    else:
        print("No roots found with X = %d. Try a smaller epsilon (e.g., 0.01) for a larger lattice if the offset is near the bound." % bound)
        print("SIMPLE_LATTICE=FAILED: no roots found")
except Exception as ex:
    print(f"SIMPLE_LATTICE=FAILED: {ex}")`,
  proof: `\\textbf{Theorem:} If $p = p_0 + x$ where $|x| < n^{1/4}$, Coppersmith's method recovers $p$ from the approximation $p_0$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = p \\cdot q$ with balanced primes ($p \\approx q \\approx \\sqrt{n}$)
\\item Approximation $p_0$ such that $|p - p_0| < n^{1/4}$
\\item Coppersmith's method for finding small roots of modular polynomials
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= p_0 + x \\quad \\text{where } |x| < n^{1/4} \\\\
f(x) &= p_0 + x \\equiv 0 \\pmod{p} \\\\
\\text{Since } p \\mid n, \\quad f(x) &\\equiv 0 \\pmod{p} \\implies \\gcd(f(x), n) \\ge p \\\\
\\text{Coppersmith finds } x_0 \\text{ when } |x_0| &< n^{1/4} \\quad (\\beta = 0.5 \\text{ for factor of size } \\sqrt{n}) \\\\
p &= p_0 + x_0, \\quad q = n / p \\qed
\\end{align*}

\\textbf{Explanation:} Construct the polynomial $f(x) = p_0 + x$ over $\\mathbb{Z}/n\\mathbb{Z}$. Since $f(x) \\equiv 0 \\pmod{p}$ and $p \\mid n$, Coppersmith's method finds the small root $x$ when $|x| < n^{1/4}$. Then $p = p_0 + x$ and $q = n/p$.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996`,
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.nearp,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  // Offset within Coppersmith bound: |offset| < n^(1/4) ≈ 2^128 for 512-bit n
  // Use up to 2^60 for a realistic but solvable testcase
  const offsetBits = 60;
  const maxOffset = (1n << BigInt(offsetBits)) - 1n;
  // Generate random offset using crypto.getRandomValues for full BigInt range
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let offset = 0n;
  for (let i = 0; i < 8; i++) {
    offset = (offset << 8n) | BigInt(bytes[i]);
  }
  offset &= maxOffset;
  // Randomly negate
  const signBytes = new Uint8Array(1);
  crypto.getRandomValues(signBytes);
  if (signBytes[0] & 1) offset = -offset;
  let nearp = p + offset;
  if (nearp <= 0n) nearp = p - offset;
  return { n: n.toString(), nearp: nearp.toString() };
};
