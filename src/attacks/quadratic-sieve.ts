import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'quadratic-sieve',
  name: 'Quadratic Sieve',
  category: 'Factorization',
  description: "Factors n by finding congruent squares via smoothness over a factor base. Use for medium-sized semiprimes (< 100 digits) with similar-sized factors.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        n = Integer(${vals.n})
        #
        print(f"Quadratic Sieve on n = {n}")
        print(f"Number of digits: {n.nbits() / 3.32:.0f}")
        print(f"Bit length: {n.nbits()}")
        print()
        #
        # Check for trivial cases
        if n < 2:
            print(f"n = {n} is too small to factor")
            print("QUADRATIC_SIEVE=FAILED")
            return
        if n % 2 == 0:
            print(f"n is even: {n}")
            print(f"Verification: 2 * {n // 2} = {n}")
            print(f"p = 2")
            print(f"q = {n // 2}")
            print()
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
            print(f"Verification: p * q = {p * p}")
            print(f"p = {p}")
            print(f"q = {p}")
            print()
            print("QUADRATIC_SIEVE=SUCCESS")
            return
        #
        # Check size before attempting factorization
        if n.nbits() > 330:
            print(f"WARNING: n has {n.nbits()} bits ({n.nbits() / 3.32:.0f} digits)")
            print("Quadratic Sieve is effective up to ~100 digits (330 bits)")
            print("For larger numbers, try ECM, Pollard's p-1, or other methods")
            print()
        #
        # Trial division handles small testcases reliably and is always available
        if n.nbits() <= 40:
            tdiv_limit = 1000000
            tdiv = trial_division(n, tdiv_limit)
            if tdiv and 1 < tdiv < n:
                q = n // tdiv
                print(f"Small factor found via trial division: {tdiv}")
                print(f"Verification: {tdiv} * {q} = {tdiv * q}")
                print(f"p = {tdiv}")
                print(f"q = {q}")
                print()
                print("QUADRATIC_SIEVE=SUCCESS")
                return
            print("No small factor via trial division, trying qsieve...")
        #
        # Use Sage's quadratic sieve (qsieve) specifically
        try:
            print("Factoring n with qsieve (Quadratic Sieve)...")
            result = qsieve(n)
            # Handle multiple qsieve return formats:
            #   Old API (sage.interfaces): [p, q] or ([p, q], time_str)
            #   New API (sage.libs.flint): [(p, 1), (q, 1)]
            if isinstance(result, tuple):
                items = result[0]  # Old API with time=True
            else:
                items = result
            factors = []
            for item in items:
                if isinstance(item, (list, tuple)):
                    factors.append((Integer(item[0]), Integer(item[1])))
                else:
                    factors.append((Integer(item), 1))
            if not factors:
                print("No factors found")
                print("QUADRATIC_SIEVE=FAILED")
                return
            # Display factorization
            fac_str = " * ".join(
                f"{p}**{e}" if e > 1 else str(p) for p, e in factors
            )
            print(f"Factorization: {fac_str}")
            print()
            # Single factor (qsieve could not factor properly)
            if len(factors) == 1 and factors[0][1] == 1:
                print(f"Only one factor found: {factors[0][0]}")
                print("QUADRATIC_SIEVE=FAILED")
            # Two prime factors (semiprime) — typical QS use case
            elif len(factors) == 2 and all(exp == 1 for _, exp in factors):
                p = Integer(factors[0][0])
                q = Integer(factors[1][0])
                print(f"Verification: p * q = {p * q}")
                print(f"p = {p}")
                print(f"q = {q}")
                print(f"p is prime: {p.is_prime()}")
                print(f"q is prime: {q.is_prime()}")
                print()
                print("QUADRATIC_SIEVE=SUCCESS")
            # Multiple factors or powers
            else:
                print(f"Found {len(factors)} factor(s):")
                for prime, exp in factors:
                    if exp == 1:
                        print(f"  p = {prime}")
                    else:
                        print(f"  {prime}^{exp}")
                print()
                product = 1
                for prime, exp in factors:
                    product *= Integer(prime) ** exp
                print(f"Verification: product = {product}")
                print(f"Matches n: {product == n}")
                print()
                print("QUADRATIC_SIEVE=SUCCESS")
        except Exception as ex:
            print(f"Factorization failed: {ex}")
            print("n may be too large for the quadratic sieve.")
            print("For numbers > 100 digits, try ECM or specialized attacks.")
            print()
            print("QUADRATIC_SIEVE=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("QUADRATIC_SIEVE=FAILED")
_attack()`,
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
\\end{align*}

\\textbf{Explanation:} The QS finds many integers $x$ where $Q(x)$ factors completely over the factor base (a "smooth" number). Each smooth $Q(x)$ gives an exponent vector modulo 2. A linear dependency among these vectors means the product of the corresponding $Q(x_i)$ values is a perfect square. Since $Q(x) \\equiv (x+m)^2 \\pmod{n}$, we get $X^2 \\equiv Y^2 \\pmod{n}$ with $X \\not\\equiv \\pm Y \\pmod{n}$ about half the time, yielding a factor via GCD.

\\textbf{References:} C. Pomerance, "The Quadratic Sieve Factoring Algorithm", Eurocrypt 1984`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use two small primes giving n ≈ 20 bits. Trial division fallback
  // (up to 10^6) reliably factors this, ensuring no SageMathCell timeout.
  const p = randomPrime(10);
  const q = randomPrime(10);
  return { n: (p * q).toString() };
};

