import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'multi-prime',
  name: 'Multi-Prime RSA',
  category: 'Factorization',
  description: 'Factors n with k >= 3 prime factors using trial division and Sage factor(). Use for multi-prime RSA moduli.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            out = []
            n = Integer(${vals.n})
            n_int = int(n)
            if n < 2:
                out.append(f"n = {n} is too small to factor")
                out.append("MULTI_PRIME=FAILED")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append(f"n is even: {n}")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append(f"Verification: 2 * {n // 2} = {n}")
                out.append("MULTI_PRIME=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append(f"n is prime: {n}")
                out.append("No factorization possible")
                out.append("MULTI_PRIME=FAILED")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                out.append("MULTI_PRIME=SUCCESS")
                print("\\n".join(out))
                return
            # Use trial division + Sage's factor() for complete factorization
            def factor_all(m):
                """Complete factorization using trial division + Sage's factor()"""
                fac = []
                rem = int(m)
                for p in prime_range(2, 10000):
                    p_int = int(p)
                    while rem % p_int == 0:
                        fac.append(Integer(p_int))
                        rem //= p_int
                if rem == 1:
                    return sorted(fac)
                rem_sage = Integer(rem)
                if rem_sage.is_prime():
                    fac.append(rem_sage)
                    return sorted(fac)
                for p, e in factor(rem_sage):
                    fac.extend([p] * e)
                return sorted(fac)
            out.append(f"Attempting multi-prime factorization of n = {n}")
            out.append(f"Bit length: {n.nbits()} bits ({n.nbits() / 3.32:.0f} digits)")
            out.append("")
            prime_factors = factor_all(n)
            out.append(f"Prime factors ({len(prime_factors)} total):")
            for i, p in enumerate(prime_factors):
                prime_status = "prime" if p.is_prime() else "composite"
                out.append(f"  p[{i+1}] = {p} ({p.nbits()} bits, {prime_status})")
            out.append("")
            # Verify product
            product = 1
            for p in prime_factors:
                product *= p
            out.append(f"Verification: product = {product}")
            out.append(f"Matches n: {product == n}")
            out.append("")
            # Check if any factor is composite (partial factorization)
            all_prime = all(p.is_prime() for p in prime_factors)
            if len(prime_factors) > 2 and all_prime:
                out.append("Multi-prime RSA detected!")
                out.append(f"n = {' × '.join(str(p) for p in prime_factors)}")
                out.append("")
                # Compute phi(n) correctly for multi-prime with possible repeated factors
                from collections import Counter
                factor_counts = Counter(prime_factors)
                phi = 1
                for p, k in factor_counts.items():
                    phi *= p**(k-1) * (p - 1)
                out.append(f"phi(n) = {phi}")
                out.append("")
                out.append("MULTI_PRIME=SUCCESS")
            elif len(prime_factors) == 2 and all_prime:
                out.append("Standard 2-prime RSA (not multi-prime).")
                p, q = prime_factors[0], prime_factors[1]
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append(f"phi(n) = {(p-1)*(q-1)}")
                out.append("MULTI_PRIME=FAILED (only 2 factors)")
            elif not all_prime:
                out.append("Partial factorization only — some factors remain composite.")
                out.append("Suggestion: Try running ECM again with higher B1 bounds.")
                out.append("MULTI_PRIME=FAILED")
            else:
                out.append("n could not be factored into multiple primes.")
                out.append("MULTI_PRIME=FAILED")
            print("\\n".join(out))
        except Exception as e:
            out.append(f"Error in Multi-Prime RSA factorization: {e}")
            out.append("MULTI_PRIME=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("MULTI_PRIME=FAILED")
        except:
            out = [f"ERROR: {ex}", "MULTI_PRIME=FAILED"]
        print("\\n".join(out))
_attack()`,
  proof: `\\textbf{Theorem:} Multi-prime RSA uses $n = \\prod_{i=1}^{k} p_i$ with $k \\geq 3$, reducing each factor's bit size and enabling easier factorization.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p_1 p_2 \\cdots p_k$ with $k \\geq 3$
\\item $\\phi(n) = \\prod_{i=1}^{k} (p_i - 1)$
\\item $ed \\equiv 1 \\pmod{\\phi(n)}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= \\prod_{i=1}^{k} p_i,\\; \\phi(n) = \\prod_{i=1}^{k} (p_i - 1) \\\\
p_i &\\approx n^{1/k} \\text{ (each prime is smaller than in 2-prime RSA)} \\\\
\\text{CRT decryption: } m_i &= c^{d \\bmod (p_i-1)} \\bmod p_i \\\\
\\text{Factorization cost } &\\propto \\min_i (\\text{cost to factor } p_i) \\qed
\\end{align*}

\\textbf{Explanation:} Multi-prime RSA (also called "RSA Multiprime") uses three or more primes for a fixed modulus size, making each prime factor smaller and easier to find via generic factorization algorithms. The attack uses trial division up to 10,000 followed by Sage's factor() for complete factorization.

\\textbf{References:} G. J. Simmons and M. J. Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", Cryptologia, 1976; D. Boneh, "Twenty Years of Attacks on RSA", Notices of the AMS, 1999`,
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
