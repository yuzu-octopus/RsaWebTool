import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'quadratic-sieve',
  name: 'Quadratic Sieve',
  category: 'Factorization',
  description: 'Factors n via quadratic sieve. Use for general factorization of medium-sized n.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"Quadratic Sieve on n = {n}")
print(f"Number of digits: {n.nbits() / 3.32:.0f}")
print(f"Bit length: {n.nbits()}")
print()

# Check for trivial cases
if n < 2:
    print(f"n = {n} is too small to factor")
    print("QUADRATIC_SIEVE=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("QUADRATIC_SIEVE=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("QUADRATIC_SIEVE=FAILED")
    return
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print(f"Verification: p * q = {p * p}")
    print("QUADRATIC_SIEVE=SUCCESS")
    return

# Check size before attempting factorization
if n.nbits() > 400:
    print(f"WARNING: n has {n.nbits()} bits ({n.nbits() / 3.32:.0f} digits)")
    print("Quadratic Sieve is effective up to ~100 digits (330 bits)")
    print("For larger numbers, try ECM, Pollard's p-1, or other methods")
    print()

# Use Sage's built-in factorization (auto-selects best algorithm)
try:
    print("Factoring n...")
    fac = factor(n)
    factors = list(fac)

    print(f"Factorization: {fac}")
    print()

    # Single prime factor (n is prime)
    if len(factors) == 1 and factors[0][1] == 1:
        print(f"n is prime: {n.is_prime()}")
        print("No factorization possible — n is already prime")
        print("QUADRATIC_SIEVE=FAILED")

    # Two prime factors (semiprime)
    elif len(factors) == 2 and all(exp == 1 for _, exp in factors):
        p = Integer(factors[0][0])
        q = Integer(factors[1][0])
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print(f"q is prime: {q.is_prime()}")
        print("QUADRATIC_SIEVE=SUCCESS")

    # Multiple factors or powers
    else:
        print(f"Found {len(factors)} prime factor(s):")
        for prime, exp in factors:
            if exp == 1:
                print(f"  p = {prime}")
            else:
                print(f"  {prime}^{exp}")
        print()
        # Verify product
        product = 1
        for prime, exp in factors:
            product *= Integer(prime) ** exp
        print(f"Verification: product = {product}")
        print(f"Matches n: {product == n}")
        print("QUADRATIC_SIEVE=SUCCESS")

except Exception as ex:
    print(f"Factorization failed: {ex}")
    print("n may be too large for available methods.")
    print("For numbers > 100 digits, try ECM or specialized attacks.")
    print("QUADRATIC_SIEVE=FAILED")
`,
  proof: `\\textbf{Theorem:} Quadratic Sieve factors n in expected time O(\\exp(\\sqrt{\\ln n \\ln \\ln n})).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Congruent squares: x^2 \\equiv y^2 \\pmod{n}, x \\not\\equiv \\pm y \\implies \\gcd(x - y, n) is a factor
\\item Factor base \\mathcal{F} = \\{-1\\} \\cup \\{p : p \\leq B, (n/p) = 1\\}
\\item Q(x) = (x + \\lfloor\\sqrt{n}\\rfloor)^2 - n, sieved for B-smooth values
\\item Linear algebra over \\mathbb{F}_2 on exponent vectors
\\item Smoothness bound B = \\exp(\\frac{1}{2}\\sqrt{\\ln n \\ln \\ln n})
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= \\lfloor\\sqrt{n}\\rfloor, \\quad Q(x) = (x + m)^2 - n \\\\
Q(x) &\\equiv (x + m)^2 \\pmod{n} \\\\
\\mathcal{F} &= \\{-1\\} \\cup \\{p \\leq B : (n/p) = 1\\} \\\\
\\text{Find } x \\text{ such that } Q(x) &\\text{ is B-smooth over } \\mathcal{F} \\\\
Q(x) &= \\prod_{p \\in \\mathcal{F}} p^{e_p} \\\\
\\vec{v}_x &= (e_p \\bmod 2)_{p \\in \\mathcal{F}} \\in \\mathbb{F}_2^{|\\mathcal{F}|} \\\\
\\text{Collect } |\\mathcal{F}| + 1 \\text{ vectors, find dependency: } & \\\\
\\sum_{i \\in S} \\vec{v}_{x_i} &= \\vec{0} \\pmod{2} \\\\
\\prod_{i \\in S} Q(x_i) &= y^2 \\\\
X &= \\prod_{i \\in S} (x_i + m), \\quad X^2 \\equiv y^2 \\pmod{n} \\\\
X \\not\\equiv \\pm y \\pmod{n} &\\implies \\gcd(X - y, n) \\text{ is a factor} \\\\
\\text{Success prob: } \\geq 1/2, \\quad \\text{time: } O(&\\exp(\\sqrt{\\ln n \\ln \\ln n})) \\qed
\\end{align*}

\\textbf{Explanation:} Sieve values of Q(x) = (x + \\sqrt{n})^2 - n for smoothness over a factor base. Each smooth value gives an exponent vector mod 2. Find a linear dependency over \\mathbb{F}_2 to get a congruence of squares X^2 \\equiv y^2 \\pmod{n}. Then gcd(X - y, n) yields a factor with probability \\geq 1/2.

\\textbf{References:} C. Pomerance, "The Quadratic Sieve Factoring Algorithm", Eurocrypt 1984`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString() };
};
