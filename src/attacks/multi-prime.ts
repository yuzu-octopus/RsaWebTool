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
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

if n < 2:
    print(f"n = {n} is too small to factor")
    print("MULTI_PRIME=FAILED")
    quit()
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("MULTI_PRIME=SUCCESS")
    quit()
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("MULTI_PRIME=FAILED")
    quit()

# Use ECM in a loop to find all prime factors (handles larger n than factor())
def factor_all(m):
    """Complete factorization using trial division + ECM loop"""
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
    while rem > 1:
        if rem.is_prime():
            fac.append(rem)
            break
        f = rem.ecm()
        if f > 1 and f < rem:
            fac.append(Integer(f))
            rem //= Integer(f)
        else:
            break
    if rem > 1:
        fac.append(rem)
    return sorted(fac)

try:
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
`,
  proof: `\\textbf{Theorem:} Multi-prime RSA uses n = \\prod_{i=1}^{r} p_i with r > 2 primes and \\varphi(n) = \\prod (p_i - 1).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = p_1 p_2 \\cdots p_r — product of r \\geq 3 distinct primes
\\item Euler's totient: \\varphi(n) = \\prod_{i=1}^{r} (p_i - 1)
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}
\\item CRT decryption: m_i = c^d \\bmod p_i, then combine
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p_1 p_2 \\cdots p_r, \\quad r \\geq 3 \\\\
\\varphi(n) &= \\prod_{i=1}^{r} \\varphi(p_i) = \\prod_{i=1}^{r} (p_i - 1) \\\\
ed &\\equiv 1 \\pmod{\\varphi(n)} \\\\
m &= c^d \\bmod n \\\\
m_i &= c^d \\bmod p_i, \\quad i = 1, \\ldots, r \\\\
m &= \\text{CRT}(m_1, \\ldots, m_r; p_1, \\ldots, p_r) \\\\
p_i &\\approx n^{1/r} \\implies \\text{ECM, QS more effective} \\qed
\\end{align*}

\\textbf{Explanation:} Multi-prime RSA splits n into more than two primes for faster CRT-based decryption. However, each prime is smaller (n^{1/r} bits), making factorization easier. For a 2048-bit modulus with r=3, each prime is only ~683 bits.

\\textbf{References:} Simmons & Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", 1976; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use one smaller factor (45 bits) that ECM finds quickly,
  // plus two larger factors — n ≈ 225 bits total.
  // This keeps runtime well under SageCell's 60s timeout.
  const p1 = randomPrime(45);
  const p2 = randomPrime(90);
  const p3 = randomPrime(90);
  return { n: (p1 * p2 * p3).toString() };
};
