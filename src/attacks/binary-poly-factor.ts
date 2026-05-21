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
  proof: `\\textbf{Theorem:} If n's binary polynomial f(x) factors over \\mathbb{Z}[x] as f(x) = g(x)h(x), then n = g(2)h(2).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n — integer to factor, with binary digits b\\_i \\in \\{0, 1\\}
\\item f(x) = \\sum b\\_i x^i \\in \\mathbb{Z}[x] — polynomial with f(2) = n
\\item Unique factorization in \\mathbb{Z}[x]
\\item Evaluation homomorphism \\text{ev}\\_2: \\mathbb{Z}[x] \\to \\mathbb{Z}
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
  const isPrime = (n: bigint): boolean => {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;
    // We use a small check or assume primality from Miller-Rabin test
    // But since we want it to be fast, we can use simple trial division for small numbers
    const limit = BigInt(Math.floor(Math.sqrt(Number(n))));
    for (let i = 3n; i <= limit; i += 2n) {
      if (n % i === 0n) return false;
    }
    return true;
  };

  const generateLowWeightPrime = (bits: number): bigint => {
    const maxAttempts = 1000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Hamming weight 2: 2^(bits-1) + 1
      if (Math.random() < 0.2) {
        const val = (1n << BigInt(bits - 1)) + 1n;
        if (isPrime(val)) return val;
      }
      // Hamming weight 3: 2^(bits-1) + 2^j + 1
      const j = Math.floor(Math.random() * (bits - 2)) + 1;
      const val = (1n << BigInt(bits - 1)) + (1n << BigInt(j)) + 1n;
      if (isPrime(val)) return val;
    }
    // Safe fallbacks for bits = 11, 13
    if (bits === 11) return 1033n; // 2^10 + 2^3 + 1 (prime)
    return 4129n; // 2^12 + 2^5 + 1 (prime)
  };

  const tryNoCarryPrime = (bits1: number, bits2: number): bigint => {
    let iterations = 0;
    while (true) {
      iterations++;
      if (iterations > 1000) {
        return 1033n * 4129n; // Fallback
      }
      const p = generateLowWeightPrime(bits1);
      const q = generateLowWeightPrime(bits2);
      
      const P: number[] = [], Q: number[] = [];
      for(let i=0; i<bits1; i++) if ((p >> BigInt(i)) & 1n) P.push(i);
      for(let j=0; j<bits2; j++) if ((q >> BigInt(j)) & 1n) Q.push(j);
      
      const counts: Record<number, number> = {};
      let ok = true;
      for(const x of P) {
        for(const y of Q) {
          counts[x+y] = (counts[x+y] || 0) + 1;
          if(counts[x+y] > 1) { ok = false; break; }
        }
        if(!ok) break;
      }
      if (ok) return p * q;
    }
  };

  return { n: tryNoCarryPrime(11, 13).toString() };
};
