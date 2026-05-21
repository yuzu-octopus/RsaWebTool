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
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
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
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2, q = {n // 2}")
                print("POLLARD_P1=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("POLLARD_P1=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("POLLARD_P1=SUCCESS")
                return
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
                    return
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
                            return
            print("Pollard p-1 failed: p-1 may not be smooth enough")
            print("POLLARD_P1=FAILED")
        except Exception as e:
            print(f"ERROR: {e}")
            print("POLLARD_P1=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("POLLARD_P1=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If p-1 is B\\_1-smooth, then p can be found in time O(B\\_1 \\log B\\_1 \\log^2 n). Stage 2 catches p-1 with one prime factor \\leq B\\_2 > B\\_1.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Fermat's Little Theorem: a^{p-1} \\equiv 1 \\pmod{p} for \\gcd(a, p) = 1
\\item p-1 is B\\_1-smooth: all prime factors of p-1 are \\leq B\\_1
\\item M = \\operatorname{lcm}(1, 2, \\ldots, B\\_1) = \\prod\\_{q \\leq B\\_1} q^{\\lfloor \\log\\_q B\\_1 \\rfloor}
\\item Stage 2: p-1 = q\\_0 \\cdot s where s is B\\_1-smooth and q\\_0 \\in (B\\_1, B\\_2]
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

\\textbf{Explanation:} Stage 1 computes M = lcm(1, \\ldots, B\\_1) and then a^M \\bmod n. If p-1 divides M, then \\gcd(a^M - 1, n) reveals p. Stage 2 extends the search when p-1 has one prime factor q\\_0 between B\\_1 and B\\_2: after computing H = a^M, check \\gcd(H^q - 1, n) for each prime q in (B\\_1, B\\_2]. The prime-difference optimization reuses H^{q\\_{j-1}} to compute H^{q\\_j} efficiently.

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  let p = 0n;
  let attempt = 0;
  while(true) {
    attempt++;
    let pMinus1 = 2n;
    let primes = [];
    for(let i=2; i<=2000; i++) if(isPrimeMR(BigInt(i))) primes.push(BigInt(i));
    primes.sort(() => Math.random() - 0.5);
    let currentBits = 0;
    let idx = 0;
    while (currentBits < 250 && idx < primes.length) {
      pMinus1 *= primes[idx];
      currentBits += primes[idx].toString(2).length;
      idx++;
    }
    
    // Check if Stage 1 or 2
    if (Math.random() < 0.7) {
      p = pMinus1 + 1n;
    } else {
      let largePrime = BigInt(Math.floor(Math.random() * 900000) + 10000);
      while (!isPrimeMR(largePrime)) {
        largePrime++;
      }
      p = pMinus1 * largePrime + 1n;
    }
    if (isPrimeMR(p)) break;
  }

  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  return { n: n.toString() };
};