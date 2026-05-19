import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'williams-p1',
  name: "Williams' p+1 Method",
  category: 'Factorization',
  description: 'Factors n when p+1 is smooth. Use when p+1 has only small prime factors.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'B', label: 'B (smoothness bound, optional)', placeholder: '10000', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Handle B parameter: default to 10000 if not provided or invalid
try:
    B = Integer(${vals.B || '10000'})
    if B < 2:
        B = 10000
except:
    B = 10000

print(f"Williams' p+1 method on n = {n}")
print(f"Smoothness bound B = {B}")
print()

# Check for trivial cases
if n < 2:
    print(f"n = {n} is too small to factor")
    print("WILLIAMS_P1=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("WILLIAMS_P1=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("WILLIAMS_P1=FAILED")
    return
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print(f"Verification: p * q = {p * p}")
    print("WILLIAMS_P1=SUCCESS")
    return

# Williams' p+1 using Lucas sequences
# V_k(P, Q) where Q = 1, V_0 = 2, V_1 = P, V_k = P*V_{k-1} - V_{k-2}
def williams_p1(n, B, P):
    # Compute M = lcm(1, 2, ..., B)
    M = 1
    for i in range(2, B + 1):
        M = lcm(M, i)

    # Lucas sequence V_M(P, 1) mod n
    # Using binary exponentiation with dual tracking (V_j, V_{j+1})
    def lucas_V(k, P, n):
        if k == 0:
            return 2 % n
        if k == 1:
            return P % n
        result = 2 % n   # V_0
        result1 = P % n  # V_1
        bits = k.nbits()
        for bit in reversed(bits):
            # Double: from (V_j, V_{j+1}) compute (V_{2j}, V_{2j+1})
            V2j = (result**2 - 2) % n
            V2j1 = (result * result1 - P) % n
            result, result1 = V2j, V2j1
            if bit == 1:
                # Add one: from (V_{2j}, V_{2j+1}) compute (V_{2j+1}, V_{2j+2})
                V2j2 = (result1**2 - 2) % n
                result, result1 = result1, V2j2
        return result

    VM = lucas_V(M, P, n)
    return gcd(VM - 2, n)

# Try different P values
try:
    found = False
    for P in range(3, 30):
        g = williams_p1(n, B, P)
        if 1 < g < n:
            p = Integer(g)
            q = n // g
            print(f"Factor found with P = {P}!")
            print(f"p = {p}")
            print(f"q = {q}")
            print(f"Verification: p * q = {p * q}")
            found = True
            break

    if not found:
        print("Williams' p+1 failed. p+1 may not be B-smooth for tested P values.")
        print("Try increasing B or using a different method.")
        print("WILLIAMS_P1=FAILED")
    else:
        print("WILLIAMS_P1=SUCCESS")
except Exception as ex:
    print(f"Williams' p+1 error: {ex}")
    print("WILLIAMS_P1=FAILED")
`,
  proof: `\\textbf{Theorem:} If p+1 is B-smooth, then p can be found using Lucas sequences in time O(B \\log B \\log^2 n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Lucas sequences: V_k(P, 1) with V_0 = 2, V_1 = P, V_k = P \\cdot V_{k-1} - V_{k-2}
\\item V_k(\\alpha + \\alpha^{-1}, 1) = \\alpha^k + \\alpha^{-k} where \\alpha, \\alpha^{-1} are roots of x^2 - Px + 1 = 0
\\item For (D/p) = -1 with D = P^2 - 4: \\alpha^{p+1} = 1 in \\mathbb{F}_{p^2}^*
\\item M = \\text{lcm}(1, 2, \\ldots, B)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p+1 &= q_1^{e_1} q_2^{e_2} \\cdots q_r^{e_r}, \\quad q_i \\leq B \\\\
\\text{Choose } P: \\; D = P^2 - 4, \\quad (D/p) &= -1 \\\\
x^2 - Px + 1 &= 0 \\text{ has roots } \\alpha, \\beta = \\alpha^{-1} \\text{ in } \\mathbb{F}_{p^2} \\\\
V_k &= \\alpha^k + \\alpha^{-k} \\\\
\\alpha^{p+1} &= 1 \\text{ in } \\mathbb{F}_{p^2}^* \\\\
M &= \\text{lcm}(1, 2, \\ldots, B), \\quad (p+1) \\mid M \\\\
\\alpha^M &= 1 \\\\
V_M &= \\alpha^M + \\alpha^{-M} = 1 + 1 = 2 \\pmod{p} \\\\
p &\\mid (V_M - 2) \\\\
p &\\mid \\gcd(V_M - 2, n) \\\\
\\text{Try different } P &\\text{ until } (D/p) = -1 \\qed
\\end{align*}

\\textbf{Explanation:} Choose P and compute V_M(P, 1) mod n using Lucas sequences. If p+1 is B-smooth and (P^2-4/p) = -1, then V_M \\equiv 2 \\pmod{p}, so gcd(V_M - 2, n) reveals p. Try different P values to find one with the right Legendre symbol.

\\textbf{References:} H. C. Williams, "A p+1 Method of Factoring", Mathematics of Computation, 1982`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Build ~128-bit p where p+1 is B-smooth
  const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n];
  let pPlus1 = 2n;
  for (const sp of smallPrimes) {
    const exp = Math.floor(Math.random() * 4) + 1;
    pPlus1 *= sp ** BigInt(exp);
  }
  while (pPlus1 < (1n << 127n)) pPlus1 *= 2n;
  let p = pPlus1 - 1n;
  while (!isPrimeMR(p) || p <= 2n) { pPlus1 *= 2n; p = pPlus1 - 1n; }
  const q = randomPrime(TESTCASE_BITS.q);
  return { n: (p * q).toString() };
};
