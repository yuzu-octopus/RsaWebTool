import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'pollard-p1',
  name: "Pollard's p-1 Method",
  category: 'Factorization',
  description: 'Factors n when p-1 is smooth. Use when p-1 has only small prime factors.',
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

print(f"Pollard's p-1 on n = {n}")
print(f"Smoothness bound B = {B}")
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

# RsaCtfTool algorithm
from math import log, floor
primes_list = [p for p in range(2, B + 1) if is_prime(p)]

# Precompute z exponents (moved before outer loop)
z = []
logn = floor(log(isqrt(n)))
for primej in primes_list:
    logp = log(primej)
    if logp > 0:
        z.extend([primej] * int(floor(logn / logp)))

for pp in primes_list:
    for i in range(len(z)):
        pp = power_mod(pp, z[i], n)
        p = gcd(n, pp - 1)
        if 1 < p < n:
            q = n // p
            print(f"p = {p}")
            print(f"q = {q}")
            print(f"Verification: p * q = {p * q}")
            print(f"p-1 is B-smooth (B={B})")
            print("POLLARD_P1=SUCCESS")
            return

print("Pollard's p-1 failed: p-1 may not be B-smooth")
print("Try Pollard's rho or ECM instead")
print("POLLARD_P1=FAILED")
`,
  proof: `\\textbf{Theorem:} If p-1 is B-smooth, then p can be found in time O(B \\log B \\log^2 n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Fermat's Little Theorem: a^{p-1} \\equiv 1 \\pmod{p} for \\gcd(a, p) = 1
\\item p-1 is B-smooth: all prime factors of p-1 are \\leq B
\\item M = \\text{lcm}(1, 2, \\ldots, B) is divisible by every B-smooth number
\\item (p-1) | M \\implies a^M \\equiv 1 \\pmod{p}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p-1 &= q_1^{e_1} q_2^{e_2} \\cdots q_r^{e_r}, \\quad q_i \\leq B \\\\
M &= \\text{lcm}(1, 2, \\ldots, B) \\\\
(p-1) &\\mid M \\\\
a^{p-1} &\\equiv 1 \\pmod{p} \\\\
a^M &\\equiv 1 \\pmod{p} \\\\
p &\\mid (a^M - 1) \\\\
p &\\mid \\gcd(a^M - 1, n) \\\\
1 < \\gcd(a^M - 1, n) < n &\\implies \\text{nontrivial factor found} \\\\
\\text{Stage 2: check } B < q \\leq B_2, \\; p-1 &= q \\cdot s, \\; s \\text{ is B-smooth} \\\\
\\text{Runtime: } O(B \\log B \\log^2 n) & \\qed
\\end{align*}

\\textbf{Explanation:} Compute M = lcm(1, ..., B) and then a^M mod n. If p-1 is B-smooth, then a^M \\equiv 1 \\pmod{p}, so gcd(a^M - 1, n) reveals p. Stage 2 extends the search to catch p-1 with one large prime factor between B and B_2.

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Build ~128-bit p where p-1 is B-smooth
  const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n];
  let pMinus1 = 1n;
  for (const sp of smallPrimes) {
    const exp = Math.floor(Math.random() * 4) + 1;
    pMinus1 *= sp ** BigInt(exp);
  }
  while (pMinus1 < (1n << 127n)) pMinus1 *= 2n;
  let p = pMinus1 + 1n;
  while (!isPrimeMR(p)) { pMinus1 *= 2n; p = pMinus1 + 1n; }
  const q = randomPrime(TESTCASE_BITS.q);
  return { n: (p * q).toString() };
};
