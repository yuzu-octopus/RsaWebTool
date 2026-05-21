import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'williams-p1',
  name: "Williams' p+1 Method",
  category: 'Factorization',
  description: 'Factors n when p+1 is smooth. Use when p+1 has only small prime factors. Stage 2 catches p+1 with one larger prime factor.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'B', label: 'B1 (stage 1 bound, optional)', placeholder: '10000', multiline: false },
    { name: 'B2', label: 'B2 (stage 2 bound, optional)', placeholder: '0 (disabled)', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Handle B1 parameter: default to 10000 if not provided or invalid
try:
    B1 = Integer(${vals.B || '10000'})
    if B1 < 2:
        B1 = 10000
except:
    B1 = 10000

# Handle B2 parameter: default to 0 (disabled) if not provided or invalid
try:
    B2 = Integer(${vals.B2 || '0'})
    if B2 < 0:
        B2 = 0
except:
    B2 = 0

print(f"Williams' p+1 method on n = {n}")
print(f"Initial B1 = {B1}")
print(f"Initial B2 = {B2}")
print()

# Check for trivial cases
if n < 2:
    print(f"n = {n} is too small to factor")
    print("WILLIAMS_P1=FAILED")
    quit()
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("WILLIAMS_P1=SUCCESS")
    quit()
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("WILLIAMS_P1=FAILED")
    quit()
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print(f"p = q = {p}")
    print(f"Verification: p * q = {p * p}")
    print("WILLIAMS_P1=SUCCESS")
    quit()

# Williams' p+1 using Lucas sequences with two-stage
# V_k(P, Q) where Q = 1, V_0 = 2, V_1 = P, V_k = P * V_{k-1} - V_{k-2}
# Stage 1: compute V_M(P, 1) where M = lcm(1..B1) using binary exponentiation
# Stage 2: iterate V_{k*M} for k=B1..B2 using recurrence V_{(k+1)*M} = V_{k*M} * V_M - V_{(k-1)*M}
def lucas_V(k, P, n):
    if k == 0:
        return 2 % n
    if k == 1:
        return P % n
    result = 2 % n   # V_0
    result1 = P % n  # V_1
    bits = k.digits(2)  # LSB-first list of binary digits
    # Binary ladder: maintain (V_j, V_{j+1}) invariant, process MSB first
    for bit in reversed(bits):
        V2j = (result**2 - 2) % n          # V_{2j} = V_j^2 - 2 (Q=1)
        V2j1 = (result * result1 - P) % n   # V_{2j+1} = V_j * V_{j+1} - P (Q=1)
        result, result1 = V2j, V2j1
        if bit == 1:
            # Advance: (V_{2j}, V_{2j+1}) → (V_{2j+1}, V_{2j+2})
            # V_{2j+2} = P * V_{2j+1} - V_{2j} via recurrence V_k = P*V_{k-1} - V_{k-2}
            V2j2 = (P * result1 - result) % n
            result, result1 = result1, V2j2
    return result

def williams_p1_stage(n, B1, B2, P):
    M = 1
    for i in range(2, B1 + 1):
        M = lcm(M, i)
    VM = lucas_V(M, P, n)
    g = gcd(VM - 2, n)
    if 1 < g < n:
        return g
    if B2 > B1:
        V_curr = VM
        V_prev = 2
        for k in range(2, B2 + 1):
            V_next = (V_curr * VM - V_prev) % n
            V_prev, V_curr = V_curr, V_next
            if k > B1 and is_prime(k):
                g = gcd(V_curr - 2, n)
                if 1 < g < n:
                    return Integer(g)
    return None

# Build bound configurations: original + auto-escalation (10x)
B1_orig = B1
B2_orig = B2
configs = [(B1_orig, B2_orig)]
if B2_orig > 0:
    configs.append((B1_orig * 10, B2_orig * 10))
else:
    configs.append((B1_orig * 10, 0))
    configs.append((B1_orig * 10, B1_orig * 100))

try:
    found = False
    for attempt, (B1_cur, B2_cur) in enumerate(configs):
        if attempt > 0:
            print(f"Retry #{attempt}: B1 = {B1_cur}", end="")
            if B2_cur > 0:
                print(f", B2 = {B2_cur}")
            else:
                print()
        for P in range(3, 30):
            g = williams_p1_stage(n, B1_cur, B2_cur, P)
            if g is not None:
                p = Integer(g)
                q = n // g
                print(f"Factor found with P = {P}!")
                print(f"p = {p}")
                print(f"q = {q}")
                print(f"Verification: p * q = {p * q}")
                found = True
                break
        if found:
            break
    if not found:
        print("Williams' p+1 failed. p+1 may not be B1-smooth for tested P values.")
        print("Try increasing B1, enabling stage 2 with B2 > B1, or using a different method.")
        print("WILLIAMS_P1=FAILED")
    else:
        print("WILLIAMS_P1=SUCCESS")
except Exception as ex:
    print(f"Williams' p+1 error: {ex}")
    print("WILLIAMS_P1=FAILED")
`,
  proof: `\\textbf{Theorem:} If p+1 is B1-smooth, then p can be found using Lucas sequences in time O(B \\log B \\log^2 n). Stage 2 extends to p+1 with one prime factor between B1 and B2.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Lucas sequences: V_k(P, 1) with V_0 = 2, V_1 = P, V_k = P \\cdot V_{k-1} - V_{k-2}
\\item V_k(\\alpha + \\alpha^{-1}, 1) = \\alpha^k + \\alpha^{-k} where \\alpha, \\alpha^{-1} are roots of x^2 - Px + 1 = 0
\\item For (D/p) = -1 with D = P^2 - 4: \\alpha^{p+1} = 1 in \\mathbb{F}_{p^2}^*
\\item M = \\text{lcm}(1, 2, \\ldots, B1)
\\item Lucas recurrence with Q=1: V_{a+b} = V_a \\cdot V_b - V_{a-b}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p+1 &= q_1^{e_1} q_2^{e_2} \\cdots q_r^{e_r}, \\quad q_i \\leq B1 \\\\
\\text{Choose } P: \\; D = P^2 - 4, \\quad (D/p) &= -1 \\\\
x^2 - Px + 1 &= 0 \\text{ has roots } \\alpha, \\beta = \\alpha^{-1} \\text{ in } \\mathbb{F}_{p^2} \\\\
V_k &= \\alpha^k + \\alpha^{-k} \\\\
\\alpha^{p+1} &= 1 \\text{ in } \\mathbb{F}_{p^2}^* \\\\
M &= \\text{lcm}(1, 2, \\ldots, B1), \\quad (p+1) \\mid M \\\\
\\alpha^M &= 1 \\\\
V_M &= \\alpha^M + \\alpha^{-M} = 1 + 1 = 2 \\pmod{p} \\\\
p &\\mid (V_M - 2) \\\\
p &\\mid \\gcd(V_M - 2, n) \\\\
\\text{Stage 2: } p+1 &= q \\cdot s, \\; B1 < q \\leq B2, \\; s \\text{ is B1-smooth} \\\\
V_{qM} &\\equiv 2 \\pmod{p} \\\\
V_{(k+1)M} &= V_{kM} \\cdot V_M - V_{(k-1)M} \\pmod{n} \\\\
\\text{Iterate } k=2..B2, \\text{ check when } k &> B1 \\text{ and } k \\text{ is prime} \\\\
\\text{Try different } P &\\text{ until } (D/p) = -1 \\qed
\\end{align*}

\\textbf{Explanation:} Choose P and compute V_M(P, 1) mod n using Lucas sequences. If p+1 is B1-smooth and (P^2-4/p) = -1, then V_M \\equiv 2 \\pmod{p}, so gcd(V_M - 2, n) reveals p. Stage 2 checks V_{kM} for k > B1 up to B2 using the recurrence V_{(k+1)M} = V_{kM} \\cdot V_M - V_{(k-1)M}, catching cases where p+1 has one prime factor between B1 and B2. Try different P values to find one with the right Legendre symbol.

\\textbf{References:} H. C. Williams, "A p+1 Method of Factoring", Mathematics of Computation, 1982`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // 70% chance: stage 1 case (p+1 entirely B1-smooth, all factors ≤ 71)
  // 30% chance: stage 2 case (p+1 has one large factor ∈ (10007, 50000], B2=50000)
  if (Math.random() < 0.7) {
    // Stage 1 case: all prime factors of p+1 are ≤ 71, well within B1=10000
    const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n];
    let pPlus1 = 2n;
    for (const sp of smallPrimes) {
      const exp = Math.floor(Math.random() * 4) + 1;
      pPlus1 *= sp ** BigInt(exp);
    }
    while (pPlus1 < (1n << 255n)) pPlus1 *= 2n;
    let p = pPlus1 - 1n;
    while (!isPrimeMR(p) || p <= 2n) { pPlus1 *= 2n; p = pPlus1 - 1n; }
    const q = randomPrime(TESTCASE_BITS.q);
    return { n: (p * q).toString(), B: '10000', B2: '0' };
  } else {
    // Stage 2 case: p+1 = smooth_part * large_prime, large_prime ∈ (10007, 50000]
    const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n];
    let smoothPart = 2n;
    for (const sp of smallPrimes) {
      const exp = Math.floor(Math.random() * 3) + 1;
      smoothPart *= sp ** BigInt(exp);
    }
    while (smoothPart < (1n << 240n)) smoothPart *= 2n;
    // Pick a random prime between 10007 and 50000 for the large factor
    const largeCandidates = [
      10007n, 10009n, 10037n, 10039n, 10061n, 10067n, 10069n, 10079n, 10091n, 10093n,
      20011n, 20021n, 20023n, 20029n, 20047n, 20051n, 20063n, 20071n, 20089n, 20101n,
      30011n, 30013n, 30029n, 30047n, 30059n, 30071n, 30089n, 30091n, 30097n, 30103n,
      40009n, 40013n, 40031n, 40037n, 40039n, 40063n, 40087n, 40093n, 40099n, 40111n,
      50021n, 50023n, 50033n, 50047n, 50051n, 50053n, 50069n, 50077n, 50087n, 50093n,
    ];
    const largePrime = largeCandidates[Math.floor(Math.random() * largeCandidates.length)];
    let pPlus1 = smoothPart * largePrime;
    if (pPlus1 % 2n === 1n) pPlus1 *= 2n;
    let p = pPlus1 - 1n;
    while (!isPrimeMR(p) || p <= 2n) { pPlus1 += largePrime; p = pPlus1 - 1n; }
    const q = randomPrime(TESTCASE_BITS.q);
    return { n: (p * q).toString(), B: '10000', B2: '50000' };
  }
};
