import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'pollard-p1',
  name: "Pollard's p-1 Method",
  category: 'Factorization',
  description: 'Factors n when p-1 is smooth. Stage 1 handles p-1 with all prime factors ≤ B1. Stage 2 (B2) extends to catch p-1 with one larger factor.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'B', label: 'B1 (stage 1 bound, optional)', placeholder: '10000', multiline: false },
    { name: 'B2', label: 'B2 (stage 2 bound, optional)', placeholder: '0 (disabled)', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `try:
    n = Integer(${vals.n})
    B1 = Integer(${vals.B || '10000'})
    if B1 < 2:
        B1 = 10000
    B2 = Integer(${vals.B2 || '0'})
    if B2 <= B1:
        B2 = 0
    print(f"Pollard's p-1 on n = {n}")
    print(f"Initial B1 = {B1}")
    if B2 > 0:
        print(f"Initial B2 = {B2}")
    print()
    if n < 2:
        print(f"n = {n} is too small to factor")
        print("POLLARD_P1=FAILED")
        quit()
    if n % 2 == 0:
        print(f"n is even: {n}")
        print(f"p = 2, q = {n // 2}")
        print("POLLARD_P1=SUCCESS")
        quit()
    if n.is_prime():
        print(f"n is prime: {n}")
        print("POLLARD_P1=FAILED")
        quit()
    if n.is_square():
        p = isqrt(n)
        print(f"n is a perfect square: {p}^2 = {n}")
        print(f"p = q = {p}")
        print("POLLARD_P1=SUCCESS")
        quit()
    # Build bound configurations: original + auto-escalation (10x)
    B1_orig = B1
    B2_orig = B2
    configs = [(B1_orig, B2_orig)]
    if B2_orig > 0:
        configs.append((B1_orig * 10, B2_orig * 10))
    else:
        configs.append((B1_orig * 10, 0))
        configs.append((B1_orig * 10, B1_orig * 100))
    for attempt, (B1_cur, B2_cur) in enumerate(configs):
        if attempt > 0:
            print(f"Retry #{attempt}: B1 = {B1_cur}", end="")
            if B2_cur > 0:
                print(f", B2 = {B2_cur}")
            else:
                print()
        print(f"Stage 1: computing a = 2^lcm(1..{B1_cur}) mod n...")
        a = 2
        for p in prime_range(2, B1_cur + 1):
            q = p
            while q <= B1_cur:
                a = power_mod(a, p, n)
                q *= p
        g = gcd(a - 1, n)
        if 1 < g < n:
            q = n // g
            print(f"p = {g}")
            print(f"q = {q}")
            print(f"Verification: p * q = {g * q}")
            print(f"p-1 is B1-smooth (B1={B1_cur})")
            print("POLLARD_P1=SUCCESS")
            quit()
        if B2_cur > B1_cur:
            print(f"Stage 2: checking primes q in (B1={B1_cur}, B2={B2_cur}]...")
            H = a
            prime_list = list(prime_range(B1_cur + 1, B2_cur + 1))
            if len(prime_list) > 0:
                Q = 1
                Hq = power_mod(H, prime_list[0], n)
                Q = (Q * (Hq - 1)) % n
                for j in range(1, len(prime_list)):
                    d = prime_list[j] - prime_list[j-1]
                    Hq = (Hq * power_mod(H, d, n)) % n
                    Q = (Q * (Hq - 1)) % n
                g = gcd(Q, n)
                if 1 < g < n:
                    q = n // g
                    print(f"p = {g}")
                    print(f"q = {q}")
                    print(f"Verification: p * q = {g * q}")
                    print(f"p-1 has one large factor <= B2 (B1={B1_cur}, B2={B2_cur})")
                    print("POLLARD_P1=SUCCESS")
                    quit()
    print("Pollard p-1 failed: p-1 may not be smooth enough")
    print("POLLARD_P1=FAILED")
except Exception as e:
    print(f"ERROR: {e}")
    print("POLLARD_P1=FAILED")
`,
  proof: `\\textbf{Theorem:} If p-1 is B_1-smooth, then p can be found in time O(B_1 \\log B_1 \\log^2 n). Stage 2 catches p-1 with one prime factor \\leq B_2 > B_1.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Fermat's Little Theorem: a^{p-1} \\equiv 1 \\pmod{p} for \\gcd(a, p) = 1
\\item p-1 is B_1-smooth: all prime factors of p-1 are \\leq B_1
\\item M = \\operatorname{lcm}(1, 2, \\ldots, B_1) = \\prod_{q \\leq B_1} q^{\\lfloor \\log_q B_1 \\rfloor}
\\item Stage 2: p-1 = q_0 \\cdot s where s is B_1-smooth and q_0 \\in (B_1, B_2]
\\end{itemize}

\\textbf{Proof (Stage 1):}
\\begin{align*}
p-1 &= q_0^{e_0} q_1^{e_1} \\cdots q_r^{e_r}, \\quad q_i \\leq B_1 \\\\
M &= \\prod_{q \\leq B_1} q^{\\lfloor \\log_q B_1 \\rfloor} \\\\
(p-1) &\\mid M \\implies a^M \\equiv 1 \\pmod{p} \\\\
p &\\mid (a^M - 1) \\implies 1 < \\gcd(a^M - 1, n) < n
\\end{align*}

\\textbf{Proof (Stage 2):}
\\begin{align*}
p-1 &= q_0 \\cdot s, \\quad s \\text{ is } B_1\\text{-smooth}, \\; q_0 \\in (B_1, B_2] \\\\
s &\\mid M \\implies H = a^M \\equiv 1 \\pmod{p} \\\\
H^{q_0} &\\equiv 1 \\pmod{p} \\;\\;\\; (\\text{since } p-1 \\mid M \\cdot q_0) \\\\
p &\\mid (H^{q_0} - 1) \\implies 1 < \\gcd\\left(\\prod_{q \\in (B_1, B_2]} (H^q - 1), n\\right) < n \\\\
\\text{Prime-difference trick: } H^{q_j} &= H^{q_{j-1}} \\cdot H^{d_j}, \\; d_j = q_j - q_{j-1} \\\\
\\text{Runtime: } O(B_1 \\log B_1 \\log^2 n) &+ O(\\pi(B_2) - \\pi(B_1)) \\; \\text{multiplications} \\qed
\\end{align*}

\\textbf{Explanation:} Stage 1 computes M = lcm(1, \\ldots, B_1) and then a^M \\bmod n. If p-1 divides M, then \\gcd(a^M - 1, n) reveals p. Stage 2 extends the search when p-1 has one prime factor q_0 between B_1 and B_2: after computing H = a^M, check \\gcd(H^q - 1, n) for each prime q in (B_1, B_2]. The prime-difference optimization reuses H^{q_{j-1}} to compute H^{q_j} efficiently.

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // 70% chance: create a stage 1 testcase (p-1 entirely B1-smooth, small factors)
  // 30% chance: create a stage 2 testcase (p-1 has one large factor > B1, ≤ B2)
  if (Math.random() < 0.7) {
    // Stage 1 case: all prime factors of p-1 are ≤ 71, well within B1=10000
    const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n];
    let pMinus1 = 2n;
    for (const sp of smallPrimes) {
      const exp = Math.floor(Math.random() * 4) + 1;
      pMinus1 *= sp ** BigInt(exp);
    }
    while (pMinus1 < (1n << 255n)) pMinus1 *= 2n;
    let p = pMinus1 + 1n;
    while (!isPrimeMR(p)) { pMinus1 *= 2n; p = pMinus1 + 1n; }
    const q = randomPrime(TESTCASE_BITS.q);
    return { n: (p * q).toString(), B: '10000', B2: '0' };
  } else {
    // Stage 2 case: p-1 = smooth_part * large_prime, large_prime in (10000, 50000]
    // smooth_part has all prime factors ≤ 71
    const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n];
    let smoothPart = 2n;
    for (const sp of smallPrimes) {
      const exp = Math.floor(Math.random() * 3) + 1;
      smoothPart *= sp ** BigInt(exp);
    }
    while (smoothPart < (1n << 240n)) smoothPart *= 2n;
    // Pick a random prime between 10007 and 50000 for the large factor
    // All candidates must be ≤ B2 (50000) so Stage 2 can find them
    const largeCandidates = [
      10007n, 10009n, 10037n, 10039n, 10061n, 10067n, 10069n, 10079n, 10091n, 10093n,
      20011n, 20021n, 20023n, 20029n, 20047n, 20051n, 20063n, 20071n, 20089n, 20101n,
      30011n, 30013n, 30029n, 30047n, 30059n, 30071n, 30089n, 30091n, 30097n, 30103n,
      40009n, 40013n, 40031n, 40037n, 40039n, 40063n, 40087n, 40093n, 40099n, 40111n,
      43003n, 43013n, 43019n, 43037n, 43049n, 43051n, 43063n, 43067n, 43093n, 43103n,
      46021n, 46027n, 46049n, 46051n, 46061n, 46073n, 46091n, 46093n, 46099n, 46103n,
    ];
    const largePrime = largeCandidates[Math.floor(Math.random() * largeCandidates.length)];
    let pMinus1 = smoothPart * largePrime;
    // Ensure pMinus1 is even (p is odd)
    if (pMinus1 % 2n === 1n) pMinus1 *= 2n;
    let p = pMinus1 + 1n;
    while (!isPrimeMR(p)) { pMinus1 += largePrime; p = pMinus1 + 1n; }
    const q = randomPrime(TESTCASE_BITS.q);
    return { n: (p * q).toString(), B: '10000', B2: '50000' };
  }
};
