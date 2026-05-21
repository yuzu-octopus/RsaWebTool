import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'close-prime',
  name: 'Close-Prime (Londahl)',
  category: 'Factorization',
  description: 'Factor n when p and q are close using Londahl baby-step giant-step phi-approximation. Works for |p - q| up to ~sqrt(n).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

if n < 2:
    print(f"n = {n} is too small to factor")
    print("CLOSE_PRIME=FAILED")
    quit()
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("CLOSE_PRIME=SUCCESS")
    quit()
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("CLOSE_PRIME=FAILED")
    quit()
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print("CLOSE_PRIME=SUCCESS")
    quit()

print(f"Londahl close-prime factorization on n ({n.nbits()} bits)")
print()

# Londahl baby-step giant-step phi-approximation attack
# Source: https://grocid.net/2017/09/16/finding-close-prime-factorizations/
b = 500000

# Approximate phi(n) = n - (p+q) + 1 ~ n - 2*sqrt(n) + 1 when p ~ q
phi_approx = n - 2*isqrt(n) + 1

# Baby steps: store 2^j mod n for j = 0..b
# Parity optimization halves table size (store only parity matching phi_approx)
print(f"Building baby-step table (b={b})...")
look_up = {}
z = 1
parity = int(phi_approx & 1)
for j in range(b + 1):
    if (j & 1) == parity:
        look_up[z] = j
    z = (z * 2) % n

# Giant steps: search for phi = phi_approx + j - i*b
# We compute 2^(-phi_approx) * (2^b)^i and look for collision in baby-step table
print(f"Searching ({b + 1} giant steps)...")
mu = inverse_mod(pow(2, phi_approx, n), n)
step = pow(2, b, n)
found = False
for i in range(b + 1):
    if mu in look_up:
        j = look_up[mu]
        phi = phi_approx + j - i * b
        # Factor n from phi: p+q = n - phi + 1, solve x^2 - (p+q)x + n = 0
        m = n - phi + 1
        disc = m*m - 4*n
        if disc > 0:
            sqrt_disc = isqrt(disc)
            if sqrt_disc*sqrt_disc == disc:
                p_candidate = (m - sqrt_disc) // 2
                q_candidate = (m + sqrt_disc) // 2
                if p_candidate * q_candidate == n and p_candidate > 1 and q_candidate > 1:
                    print(f"Factor found!")
                    print(f"p = {p_candidate}")
                    print(f"q = {q_candidate}")
                    print(f"|p - q| = {abs(q_candidate - p_candidate)}")
                    print(f"Verification: p * q = {p_candidate * q_candidate}")
                    print(f"Baby steps: {b+1}, Giant steps: {i+1}")
                    found = True
                    break
    mu = (mu * step) % n

if found:
    print("CLOSE_PRIME=SUCCESS")
else:
    print("Londahl close-prime factorization failed after baby-step giant-step search.")
    print("The prime gap may be too large. Try Fermat factorization.")
    print("CLOSE_PRIME=FAILED")
`,
  proof: `\\textbf{Theorem:} If $n = p \\cdot q$ with $p \\approx q$, then $n$ can be factored by recovering $\\phi(n)$ via a baby-step giant-step discrete log attack.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = p \\cdot q$, $p$ and $q$ odd primes
\\item $\\phi(n) = (p-1)(q-1) = n - (p+q) + 1$ (Euler totient)
\\item $2^{\\phi(n)} \\equiv 1 \\pmod{n}$ (Euler's theorem)
\\item $\\phi_{\\text{approx}} = n - 2\\lfloor\\sqrt{n}\\rfloor + 1 \\approx \\phi(n)$ for close primes
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\delta &= \\phi(n) - \\phi_{\\text{approx}} \\quad \\text{(small when } p \\approx q\\text{)} \\\\
2^{\\phi_{\\text{approx}} + \\delta} &\\equiv 1 \\pmod{n} \\quad \\text{(by Euler)} \\\\
2^{\\delta} &\\equiv 2^{-\\phi_{\\text{approx}}} \\pmod{n} \\\\
\\text{Baby steps: store } 2^j &\\bmod n \\text{ for } j = 0,\\dots,b \\\\
\\text{Giant steps: compute } 2^{-\\phi_{\\text{approx}}} \\cdot (2^b)^i &\\bmod n \\text{ for } i = 0,\\dots,b \\\\
\\text{Match: } 2^j &\\equiv 2^{-\\phi_{\\text{approx}} + i \\cdot b} \\pmod{n} \\\\
\\phi(n) &= \\phi_{\\text{approx}} + j - i \\cdot b \\\\
p+q &= n - \\phi(n) + 1 \\\\
p,q &= \\frac{(p+q) \\pm \\sqrt{(p+q)^2 - 4n}}{2} \\qed
\\end{align*}

\\textbf{Explanation:} Londahl's attack uses a baby-step giant-step approach to find $\\phi(n)$ directly, unlike Fermat factorization which iteratively searches for $a^2 - n = b^2$. It exploits the approximation $\\phi(n) \\approx n - 2\\sqrt{n} + 1$ when $p \\approx q$, then solves $2^{\\delta} \\equiv 2^{-\\phi_{\\text{approx}}} \\pmod{n}$ via BSGS. With $b = 500{,}000$, it covers up to $2.5 \\times 10^{11}$ candidate $\\delta$ values, handling prime gaps far larger than pure Fermat.

\\textbf{References:} Carl L\\"ondahl, "Finding close-prime factorizations", 2017 (https://grocid.net/2017/09/16/finding-close-prime-factorizations/)`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const delta = Math.floor(Math.random() * 5000) * 2 + 2;
  let q = p + BigInt(delta);
  while (!isPrimeMR(q)) q += 2n;
  return { n: (p * q).toString() };
};
