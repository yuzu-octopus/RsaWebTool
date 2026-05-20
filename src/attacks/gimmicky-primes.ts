import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'gimmicky-primes',
  name: 'Gimmicky Primes',
  category: 'Factorization',
  description: 'Detects special-form primes (Mersenne, Fermat, etc.). Use when p may be a known special prime.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

if n < 2:
    print(f"n = {n} is too small to factor")
    print("GIMMICKY_PRIMES=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("GIMMICKY_PRIMES=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("GIMMICKY_PRIMES=FAILED")
    return

try:
    print(f"Checking for gimmicky/special-form prime factors of n = {n}")
    print()

    found = False

    # 1. Mersenne primes: 2^p - 1
    print("Checking Mersenne primes (2^p - 1)...")
    for p in [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]:
        mersenne = 2**p - 1
        if n % mersenne == 0:
            print(f"  Found Mersenne prime factor: 2^{p} - 1 = {mersenne}")
            print(f"  Cofactor: {n // mersenne}")
            found = True

    # 2. Primorial primes: p# +/- 1
    print("\\nChecking primorial primes (p# ± 1)...")
    primes_list = list(prime_range(2, 200))
    primorial = 1
    for p in primes_list:
        primorial *= p
        for sign in [1, -1]:
            candidate = primorial + sign
            if candidate > 1 and n % candidate == 0:
                print(f"  Found primorial prime factor: {candidate} = {p}# {'+' if sign == 1 else '-'} 1")
                print(f"  Cofactor: {n // candidate}")
                found = True

    # 3. Fermat primes: 2^(2^k) + 1
    print("\\nChecking Fermat primes (2^(2^k) + 1)...")
    for k in range(0, 5):
        fermat = 2**(2**k) + 1
        if n % fermat == 0:
            print(f"  Found Fermat prime factor: 2^(2^{k}) + 1 = {fermat}")
            print(f"  Cofactor: {n // fermat}")
            found = True

    # 4. Fibonacci primes
    print("\\nChecking Fibonacci primes...")
    fib_primes = [2, 3, 5, 13, 89, 233, 1597, 28657, 514229, 433494437, 2971215073]
    for fib in fib_primes:
        if n % fib == 0:
            print(f"  Found Fibonacci prime factor: {fib}")
            print(f"  Cofactor: {n // fib}")
            found = True

    # 5. Repunit primes: (10^p - 1) / 9
    print("\\nChecking repunit primes...")
    for p in [2, 19, 23, 317, 1031]:
        try:
            repunit = (10**p - 1) // 9
            if n % repunit == 0:
                print(f"  Found repunit prime factor: R({p}) = {repunit}")
                print(f"  Cofactor: {n // repunit}")
                found = True
        except:
            pass

    if found:
        print("GIMMICKY_PRIMES=SUCCESS")
    else:
        print("No gimmicky prime factors found.")
        print("The factors are likely standard randomly-generated primes.")
        print("GIMMICKY_PRIMES=FAILED")
except Exception as e:
    print(f"Error in Gimmicky Primes check: {e}")
    print("GIMMICKY_PRIMES=FAILED")
`,
  proof: `\\textbf{Theorem:} Special-form primes (Mersenne, primorial, Fermat, Fibonacci, repunit) appear in small known lists and can be tested by direct divisibility.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq — RSA modulus to test
\\item Mersenne: M_p = 2^p - 1 (51 known as of 2024)
\\item Primorial: p\\# \\pm 1 where p\\# = \\prod_{q \\leq p} q
\\item Fermat: F_k = 2^{2^k} + 1 (only 5 known: k = 0..4)
\\item Fibonacci: F_n prime (very few known)
\\item Repunit: R_n = (10^n - 1)/9
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p \\cdot q, \\quad p \\in \\mathcal{S} \\text{ (special-form set)} \\\\
\\mathcal{S} &= \\{M_{p_1}, \\ldots\\} \\cup \\{p\\# \\pm 1\\} \\cup \\{F_0, \\ldots, F_4\\} \\cup \\{\\text{Fib primes}\\} \\cup \\{R_n\\} \\\\
|\\mathcal{S}| &\\ll 100 \\quad \\text{(very small)} \\\\
n \\bmod s &= 0, \\quad s \\in \\mathcal{S} \\\\
\\text{If } n \\bmod s = 0 &\\implies s \\mid n, \\quad q = n/s \\\\
\\text{Cost: } O(|\\mathcal{S}| \\cdot \\log^2 n) & \\qed
\\end{align*}

\\textbf{Explanation:} Some CTF challenges use primes with recognizable mathematical structure. Since the total number of known special-form primes is very small, testing divisibility against all of them is fast. This exploits poor randomness in CTF key generation.

\\textbf{References:} Caldwell, "The Prime Pages" (primes.utm.edu); Ribenboim, "The New Book of Prime Number Records", 1996`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate a Mersenne prime: 2^p - 1 for small p
  // Skip trivial ones (2,3,5,7) and use 2^17-1=131071 or 2^19-1=524287
  const mersenneP = [17, 19, 31, 61, 89, 107, 127];
  let mersenne = 0n;
  for (const p of mersenneP) {
    const candidate = (1n << BigInt(p)) - 1n;
    if (isPrimeMR(candidate)) {
      mersenne = candidate;
      break;
    }
  }
  const q = randomPrime(TESTCASE_BITS.q);
  return { n: (mersenne * q).toString() };
};
