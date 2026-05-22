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
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
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
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("GIMMICKY_PRIMES=SUCCESS")
                return
            found = False
            # 1. Mersenne primes: 2^p - 1
            print("Checking Mersenne primes (2^p - 1)...")
            for p in [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]:
                mersenne = 2**p - 1
                if n % mersenne == 0:
                    print(f"  Found Mersenne prime factor: 2^{p} - 1 = {mersenne}")
                    print(f"  Cofactor: {n // mersenne}")
                    print(f"  Verification: {mersenne} * {n // mersenne} = {n}")
                    found = True
            # 2. Primorial primes: p# +/- 1
            print()
            print("Checking primorial primes (p# \u00b1 1)...")
            primes_list = list(prime_range(2, 200))
            primorial = 1
            for p in primes_list:
                primorial *= p
                for sign in [1, -1]:
                    candidate = primorial + sign
                    if candidate > 1 and n % candidate == 0:
                        print(f"  Found primorial prime factor: {candidate} = {p}# {'+' if sign == 1 else '-'} 1")
                        print(f"  Cofactor: {n // candidate}")
                        print(f"  Verification: {candidate} * {n // candidate} = {n}")
                        found = True
            # 3. Fermat primes: 2^(2^k) + 1
            print()
            print("Checking Fermat primes (2^(2^k) + 1)...")
            for k in range(0, 5):
                fermat = 2**(2**k) + 1
                if n % fermat == 0:
                    print(f"  Found Fermat prime factor: 2^(2^{k}) + 1 = {fermat}")
                    print(f"  Cofactor: {n // fermat}")
                    print(f"  Verification: {fermat} * {n // fermat} = {n}")
                    found = True
            # 4. Fibonacci primes
            print()
            print("Checking Fibonacci primes...")
            fib_primes = [2, 3, 5, 13, 89, 233, 1597, 28657, 514229, 433494437, 2971215073]
            for fib in fib_primes:
                if n % fib == 0:
                    print(f"  Found Fibonacci prime factor: {fib}")
                    print(f"  Cofactor: {n // fib}")
                    print(f"  Verification: {fib} * {n // fib} = {n}")
                    found = True
            # 5. Repunit primes: (10^p - 1) / 9
            print()
            print("Checking repunit primes...")
            for p in [2, 19, 23, 317, 1031]:
                try:
                    repunit = (10**p - 1) // 9
                    if n % repunit == 0:
                        print(f"  Found repunit prime factor: R({p}) = {repunit}")
                        print(f"  Cofactor: {n // repunit}")
                        print(f"  Verification: {repunit} * {n // repunit} = {n}")
                        found = True
                except Exception:
                    pass
            # 6. Factorial primes: k! +/- 1
            print()
            print("Checking factorial primes (k! \u00b1 1)...")
            factorial = 1
            for k in range(1, 101):
                factorial *= k
                for sign in [1, -1]:
                    candidate = factorial + sign
                    if candidate > 1 and n % candidate == 0:
                        print(f"  Found factorial prime factor: {k}! {'+' if sign == 1 else '-'} 1")
                        print(f"  Cofactor: {n // candidate}")
                        print(f"  Verification: {candidate} * {n // candidate} = {n}")
                        found = True
            # 7. Carol and Kynea primes: (2^k - 1)^2 - 2, (2^k + 1)^2 - 2
            # Cap k at 100 to keep candidate sizes manageable (≈ 2^200 max)
            print()
            print("Checking Carol and Kynea primes...")
            for k in range(1, 101):
                for sign in [-1, 1]:
                    candidate = (2**k + sign)**2 - 2
                    if candidate > 1 and n % candidate == 0:
                        name = "Carol" if sign == -1 else "Kynea"
                        print(f"  Found {name} prime factor: (2^{k} {'-' if sign == -1 else '+' } 1)^2 - 2")
                        print(f"  Cofactor: {n // candidate}")
                        print(f"  Verification: {candidate} * {n // candidate} = {n}")
                        found = True
            # 8. Cullen and Woodall primes: k * 2^k +/- 1
            # Cap k at 100 to keep candidate sizes manageable (k*2^k ≈ 2^107 max)
            print()
            print("Checking Cullen and Woodall primes (k * 2^k \u00b1 1)...")
            for k in range(1, 101):
                for sign in [1, -1]:
                    candidate = k * 2**k + sign
                    if candidate > 1 and n % candidate == 0:
                        name = "Cullen" if sign == 1 else "Woodall"
                        print(f"  Found {name} prime factor: {k} * 2^{k} {'+' if sign == 1 else '-'} 1")
                        print(f"  Cofactor: {n // candidate}")
                        print(f"  Verification: {candidate} * {n // candidate} = {n}")
                        found = True
            if found:
                print("GIMMICKY_PRIMES=SUCCESS")
            else:
                print("No gimmicky prime factors found.")
                print("The factors are likely standard randomly-generated primes.")
                print("GIMMICKY_PRIMES=FAILED")
        except Exception as e:
            print(f"Error in gimmicky primes check: {e}")
            print("GIMMICKY_PRIMES=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("GIMMICKY_PRIMES=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If a prime factor $p$ or $q$ of $n = p \\cdot q$ is a special-form prime (e.g. Mersenne, primorial, Fermat, Fibonacci, repunit, Cullen, Woodall, or factorial), then $n$ can be factored in polynomial time by direct divisibility testing against a precomputed search space of candidates.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = p \\cdot q$ — RSA modulus to test
\\item Mersenne: $M_p = 2^p - 1$
\\item Primorial: $p\\# \\pm 1$ where $p\\# = \\prod_{r \\leq p} r$
\\item Fermat: $F_k = 2^{2^k} + 1$
\\item Fibonacci: $F_n$ prime
\\item Repunit: $R_k = (10^k - 1)/9$
\\item Cullen/Woodall: $C_k = k \\cdot 2^k + 1$ and $W_k = k \\cdot 2^k - 1$
\\item Carol/Kynea: $A_k = (2^k - 1)^2 - 2$ and $B_k = (2^k + 1)^2 - 2$
\\item Factorial: $k! \\pm 1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p \\cdot q, \\quad p \\in \\mathcal{S} \\text{ (special-form set)} \\\\
\\mathcal{S} &= \\{M_p\\} \\cup \\{p\\# \\pm 1\\} \\cup \\{F_k\\} \\cup \\{F_n\\} \\cup \\{R_k\\} \\cup \\{C_k\\} \\cup \\{W_k\\} \\cup \\{A_k\\} \\cup \\{B_k\\} \\cup \\{k! \\pm 1\\} \\\\
|\\mathcal{S}| &\\ll 5000 \\quad \\text{(extremely small candidate pool)} \\\\
n \\bmod s &= 0 \\quad \\text{for some } s \\in \\mathcal{S} \\\\
\\text{If } n \\bmod s = 0 &\\implies s \\mid n, \\quad q = n/s \\\\
\\text{Complexity: } & O(|\\mathcal{S}| \\cdot \\log^2 n) \\quad \\text{(extremely fast divisibility check)} \\qed
\\end{align*}

\\textbf{Explanation:} Some CTF challenges use primes with recognizable mathematical structures. Since the total number of known or feasible special-form primes up to typical RSA sizes is very small, testing divisibility against all of them is virtually instantaneous. This exploits poor entropy/randomness in custom CTF key generation scripts.

\\textbf{References:} Caldwell, "The Prime Pages" (primes.utm.edu); Ribenboim, "The New Book of Prime Number Records", 1996`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate using a random Mersenne prime: 2^p - 1
  // Skip trivial ones (2,3,5,7); use medium ones for variety
  const mersenneP = [17, 19, 31, 61, 89, 107, 127];
  const candidates = mersenneP
    .map(p => ({ p, val: (1n << BigInt(p)) - 1n }))
    .filter(({ val }) => isPrimeMR(val));
  // Fallback: 2^17 - 1 = 131071 is a known Mersenne prime guaranteed to pass
  const mersenne = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)].val
    : (1n << 17n) - 1n;
  const q = randomPrime(TESTCASE_BITS.q);
  return { n: (mersenne * q).toString() };
};
