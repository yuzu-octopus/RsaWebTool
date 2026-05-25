import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'multi-prime',
  name: 'Multi-Prime RSA',
  category: 'Factorization',
  description: 'Factors multi-prime RSA (n = p·q·r...). Use when n has more than 2 prime factors.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("MULTI_PRIME=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print(f"Verification: 2 * {n // 2} = {n}")
                print("MULTI_PRIME=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("No factorization possible")
                print("MULTI_PRIME=FAILED")
                return
            # Use trial division + Sage's factor() for complete factorization
            def factor_all(m):
                """Complete factorization using trial division + Sage's factor()"""
                fac = []
                rem = Integer(m)
                for p in prime_range(2, 10000):
                    while rem % p == 0:
                        fac.append(Integer(p))
                        rem //= p
                if rem == 1:
                    return sorted(fac)
                if rem.is_prime():
                    fac.append(rem)
                    return sorted(fac)
                for p, e in factor(rem):
                    fac.extend([p] * e)
                return sorted(fac)
            print(f"Attempting multi-prime factorization of n = {n}")
            print(f"Bit length: {n.nbits()} bits ({n.nbits() / 3.32:.0f} digits)")
            print()
            prime_factors = factor_all(n)
            print(f"Prime factors ({len(prime_factors)} total):")
            for i, p in enumerate(prime_factors):
                prime_status = "prime" if p.is_prime() else "composite"
                print(f"  p[{i+1}] = {p} ({p.nbits()} bits, {prime_status})")
            print()
            # Verify product
            product = 1
            for p in prime_factors:
                product *= p
            print(f"Verification: product = {product}")
            print(f"Matches n: {product == n}")
            print()
            # Check if any factor is composite (partial factorization)
            all_prime = all(p.is_prime() for p in prime_factors)
            if len(prime_factors) > 2 and all_prime:
                print("Multi-prime RSA detected!")
                print(f"n = {' × '.join(str(p) for p in prime_factors)}")
                print()
                # Compute phi(n) correctly for multi-prime with possible repeated factors
                from collections import Counter
                factor_counts = Counter(prime_factors)
                phi = 1
                for p, k in factor_counts.items():
                    phi *= p**(k-1) * (p - 1)
                print(f"phi(n) = {phi}")
                print()
                print("MULTI_PRIME=SUCCESS")
            elif len(prime_factors) == 2 and all_prime:
                print("Standard 2-prime RSA (not multi-prime).")
                p, q = prime_factors[0], prime_factors[1]
                print(f"p = {p}")
                print(f"q = {q}")
                print(f"phi(n) = {(p-1)*(q-1)}")
                print("MULTI_PRIME=FAILED (only 2 factors)")
            elif not all_prime:
                print("Partial factorization only — some factors remain composite.")
                print("Suggestion: Try running ECM again with higher B1 bounds.")
                print("MULTI_PRIME=FAILED")
            else:
                print("n could not be factored into multiple primes.")
                print("MULTI_PRIME=FAILED")
        except Exception as e:
            print(f"Error in Multi-Prime RSA factorization: {e}")
            print("MULTI_PRIME=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("MULTI_PRIME=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Multi-prime RSA uses $n = \\prod_{i=1}^{r} p_i$ with $r > 2$ primes and $\\varphi(n) = \\prod (p_i - 1)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p_1 p_2 \\cdots p_r$, $r \\geq 3$
\\item $\\varphi(n) = \\prod_{i=1}^{r} (p_i - 1)$
\\item $ed \\equiv 1 \\pmod{\\varphi(n)}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= \\prod_{i=1}^{r} p_i \\\\
\\varphi(n) &= \\prod_{i=1}^{r} (p_i - 1) \\\\
m_i &= c^d \\bmod p_i \\quad\\text{(CRT decryption)} \\\\
p_i &\\approx n^{1/r} \\implies \\text{smaller primes, easier factoring} \\qed
\\end{align*}

\\textbf{References:} Simmons & Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", 1976; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use three small factors so trial division + Sage factor() runs instantly.
  // p1 = 10-bit (≈1K) found by trial division up to 10000.
  // p2, p3 = 28-bit (≈268M) found by Sage's ECM with default bounds.
  // n ≈ 66 bits total.
  const p1 = randomPrime(10);
  const p2 = randomPrime(28);
  const p3 = randomPrime(28);
  return { n: (p1 * p2 * p3).toString() };
};
