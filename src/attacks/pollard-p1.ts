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
        n = Integer(${vals.n})
        B1 = int(Integer(${vals.B || '10000'}))
        if B1 < 2:
            B1 = 10000
        B2 = int(Integer(${vals.B2 || '0'}))
        if B2 < 0:
            B2 = 0
        print(f"Pollard's p-1 on n = {n} ({n.nbits()} bits)")
        print(f"B1 = {B1}")
        if B2 > B1:
            print(f"B2 = {B2}")
        print()
        # Trivial checks
        if n < 2:
            print(f"n = {n} is too small")
            print("POLLARD_P1=FAILED")
            return
        if n % 2 == 0:
            print(f"n is even: {n}")
            print(f"Verification: 2 * {n // 2} = {n}")
            print(f"p = 2")
            print(f"q = {n // 2}")
            print()
            print("POLLARD_P1=SUCCESS")
            return
        if n.is_prime():
            print(f"n = {n} is prime")
            print("POLLARD_P1=FAILED")
            return
        if n.is_square():
            p = isqrt(n)
            print(f"n is a perfect square: {p}^2 = {n}")
            print(f"Verification: p * q = {p * p}")
            print(f"p = {p}")
            print(f"q = {p}")
            print()
            print("POLLARD_P1=SUCCESS")
            return
        # Sieve primes up to B1 (pure Python, no prime_range)
        limit = B1
        sieve = [True] * (limit + 1)
        if limit >= 0:
            sieve[0] = False
        if limit >= 1:
            sieve[1] = False
        i = 2
        while i * i <= limit:
            if sieve[i]:
                for j in range(i * i, limit + 1, i):
                    sieve[j] = False
            i += 1
        primes = [i for i in range(limit + 1) if sieve[i]]
        # Stage 1: compute 2^lcm(1..B1) mod n
        print(f"Stage 1: {len(primes)} primes up to B1={B1}...")
        a = 2
        for p in primes:
            q = p
            while q <= limit:
                a = pow(a, p, n)
                q *= p
        g = gcd(a - 1, n)
        if 1 < g < n:
            q_val = n // g
            print(f"Verification: p * q = {g * q_val}")
            print(f"p = {g}")
            print(f"q = {q_val}")
            print()
            print("POLLARD_P1=SUCCESS")
            return
        # Stage 2 (optional, only if B2 > B1 and Stage 1 failed)
        if B2 > B1:
            limit2 = B2
            print(f"Stage 2: checking primes in ({limit}, {limit2}]...")
            sieve2 = [True] * (limit2 + 1)
            if limit2 >= 0:
                sieve2[0] = False
            if limit2 >= 1:
                sieve2[1] = False
            i = 2
            while i * i <= limit2:
                if sieve2[i]:
                    for j in range(i * i, limit2 + 1, i):
                        sieve2[j] = False
                i += 1
            big_primes = [i for i in range(limit + 1, limit2 + 1) if sieve2[i]]
            if big_primes:
                Q = 1
                Hq = pow(a, big_primes[0], n)
                Q = (Q * (Hq - 1)) % n
                for j in range(1, len(big_primes)):
                    d = big_primes[j] - big_primes[j - 1]
                    Hq = (Hq * pow(a, d, n)) % n
                    Q = (Q * (Hq - 1)) % n
                g = gcd(Q, n)
                if 1 < g < n:
                    q_val = n // g
                    print(f"Verification: p * q = {g * q_val}")
                    print(f"p = {g}")
                    print(f"q = {q_val}")
                    print()
                    print("POLLARD_P1=SUCCESS")
                    return
        print("Pollard p-1 failed: p-1 is not smooth enough for these bounds")
        print("POLLARD_P1=FAILED")
    except Exception as e:
        print(f"ERROR: {e}")
        print("POLLARD_P1=FAILED")
    except BaseException as ex:
        print(f"FATAL: {ex}")
        print("POLLARD_P1=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If p-1 is B\\_1-smooth, find p via a^M mod n. Stage 2: one factor up to B\\_2.

\\textbf{Setup:}
\\begin{itemize}
\\item Fermat's Little Theorem: a^{p-1} \\equiv 1 \\pmod{p}
\\item p-1 is B\\_1-smooth
\\item M = \\operatorname{lcm}(1, 2, \\ldots, B\\_1)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p-1 &\\mid M \\implies a^M \\equiv 1 \\pmod{p} \\\\
p &\\mid (a^M - 1) \\implies \\gcd(a^M - 1, n) = p \\\\
\\text{Stage 2: } p-1 &= q_0 \\cdot s,\\; s \\mid M,\\; q_0 \\in (B_1, B_2] \\\\
H &= a^M,\\; H^{q_0} \\equiv 1 \\pmod{p} \\\\
\\gcd\\left(\\prod_{q \\in (B_1, B_2]} (H^q - 1), n\\right) &= p \\qed
\\end{align*}

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  let p: bigint;
  while (true) {
    let pMinus1 = 2n;
    const primes = [];
    for (let i = 2; i <= 2000; i++) {
      if (isPrimeMR(BigInt(i))) primes.push(BigInt(i));
    }
    // Fisher-Yates shuffle for unbiased randomness
    for (let i = primes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [primes[i], primes[j]] = [primes[j], primes[i]];
    }
    let currentBits = 0n;
    let idx = 0;
    while (currentBits < 128n && idx < primes.length) {
      pMinus1 *= primes[idx];
      // Use BigInt bitLength for accurate bit counting
      currentBits += BigInt(primes[idx].toString(2).length);
      idx++;
    }
    // Stage 1 only: p = smoothProduct + 1
    p = pMinus1 + 1n;
    if (isPrimeMR(p)) break;
  }

  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  return { n: n.toString(), B: '10000', B2: '0' };
};