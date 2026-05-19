import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';

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

# Multi-prime RSA factorization
try:
    print(f"Attempting multi-prime factorization of n = {n}")
    print(f"Number of digits: {n.nbits() / 3.32:.0f}")
    print()

    # Use Sage's built-in factorization
    factors = factor(n)
    print(f"Factorization: {factors}")
    print()

    prime_factors = []
    for p, mult in factors:
        p = Integer(p)
        for _ in range(mult):
            prime_factors.append(p)

    prime_factors.sort()
    print(f"Number of prime factors: {len(prime_factors)}")
    print()

    if len(prime_factors) > 2:
        print("Multi-prime RSA detected!")
        print(f"n = {' × '.join(str(p) for p in prime_factors)}")
        print()
        print("Individual primes:")
        for i, p in enumerate(prime_factors):
            print(f"  p[{i+1}] = {p} ({p.nbits()} bits, prime: {p.is_prime()})")
        print()

        # Compute phi(n) for multi-prime (handles repeated factors)
        from collections import Counter
        factor_counts = Counter(prime_factors)
        phi = 1
        for p, k in factor_counts.items():
            phi *= p**(k-1) * (p - 1)
        print(f"phi(n) = {phi}")
        print("MULTI_PRIME=SUCCESS")
    elif len(prime_factors) == 2:
        print("Standard 2-prime RSA (not multi-prime).")
        p, q = prime_factors
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"phi(n) = {(p-1)*(q-1)}")
        print("MULTI_PRIME=FAILED (only 2 factors)")
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
p_i &\\approx n^{1/r} \\implies \\text{ECM, QS more effective}
\\end{align*}

\\textbf{Explanation:} Multi-prime RSA splits n into more than two primes for faster CRT-based decryption. However, each prime is smaller (n^{1/r} bits), making factorization easier. For a 2048-bit modulus with r=3, each prime is only ~683 bits.

\\textbf{References:} Simmons & Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", 1976; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const bits = Math.floor(TESTCASE_BITS.p * 2 / 3);
  const p1 = randomPrime(bits);
  const p2 = randomPrime(bits);
  const p3 = randomPrime(bits);
  return { n: (p1 * p2 * p3).toString() };
};
