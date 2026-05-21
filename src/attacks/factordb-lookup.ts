import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { queryFactorDB, formatFactorDBResult } from '../utils/factordb';

export const attack: Attack = {
  id: 'factordb-lookup',
  name: 'FactorDB Lookup',
  category: 'Advanced',
  description: 'Looks up factorization in FactorDB. Use as first step for any unknown modulus.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const result = await queryFactorDB(vals.n);
      if (result.status === "FF" && result.factors && result.factors.length >= 2) {
        return formatFactorDBResult(result);
      }
      return null;
    } catch {
      return null;
    }
  },
  sageTemplate: (vals: Record<string, string>) => `# Validate inputs
if not "${vals.n}".strip():
    print("ERROR: n is required")
    print("FACTORDB_LOOKUP=FAILED")
    quit()

# Simple Floyd cycle Pollard's rho for fallback factorization
def pollard_rho_factor(n):
    if n % 2 == 0:
        return 2
    if n.is_prime():
        return None
    for c in range(1, 20):
        x = 2
        y = 2
        d = 1
        while d == 1:
            x = (x * x + c) % n
            y = (y * y + c) % n
            y = (y * y + c) % n
            d = gcd(abs(x - y), n)
        if d != n:
            return d
    return None

try:
    n = Integer(${vals.n})
    # Pre-checks
    if n < 2:
        print(f"n = {n} is too small to factor")
        print("FACTORDB_LOOKUP=FAILED")
        quit()
    if n % 2 == 0:
        print(f"n is even. p = 2, q = {n // 2}")
        print("FACTORDB_LOOKUP=SUCCESS")
        quit()
    if n.is_prime():
        print("n is prime. Not a valid RSA modulus.")
        print("FACTORDB_LOOKUP=FAILED")
        quit()
    if n.is_square():
        p = isqrt(n)
        print(f"n is a perfect square: {p}^2 = {n}")
        print(f"p = q = {p}")
        print("FACTORDB_LOOKUP=SUCCESS")
        quit()

    print(f"Checking if n = {n} has known factors")
    print()
    # Step 1: Trial division with small primes
    print("Step 1: Trial division with small primes...")
    for p in primes(10000):
        if n % p == 0:
            q = n // p
            print(f"Found small factor: p = {p}")
            print(f"q = {q}")
            if q.is_prime():
                print("q is prime. Factorization complete!")
            else:
                print("q is composite. Further factorization needed.")
                print(f"q factors: {factor(q)}")
            print("FACTORDB_LOOKUP=SUCCESS")
            quit()
    print("No factors found below 10000.")
    # Step 2: ECM factorization
    print()
    print("Step 2: ECM factorization...")
    try:
        fac = n.factor(algorithm='ecm')
        if fac:
            fac_p = None
            for fp, exp in fac:
                fac_p = fp
                break
            if fac_p is not None and 1 < fac_p < n:
                q = n // fac_p
                print(f"p = {fac_p}")
                print(f"q = {q}")
                print(f"Verification: p * q = {fac_p * q}")
                print("FACTORDB_LOOKUP=SUCCESS")
                quit()
            else:
                print("ECM found no non-trivial factors.")
        else:
            print("ECM did not find factors.")
    except Exception as ex:
        print(f"ECM failed: {ex}")
    # Step 3: Pollard's rho fallback
    print()
    print("Step 3: Pollard's rho...")
    try:
        f = pollard_rho_factor(n)
        if f is not None and f != n:
            print(f"Pollard's rho found: {f}")
            print(f"Other factor: {n // f}")
            print("FACTORDB_LOOKUP=SUCCESS")
            quit()
        else:
            print("Pollard's rho did not find a factor.")
    except Exception as ex:
        print(f"Pollard's rho failed: {ex}")
    print("FACTORDB_LOOKUP=FAILED")
except Exception as ex:
    print(f"ERROR: {ex}")
    print("FACTORDB_LOOKUP=FAILED")
`,
  proof: `\\textbf{Theorem:} Many RSA moduli from CTF challenges and weak key generation have been pre-factored and stored in public databases.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Modulus $n$ to check against known factorizations
\\item Network access to FactorDB API (or CORS proxy)
\\item Fallback: trial division primes up to bound $B$, ECM curves, Pollard's rho iterations
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Query:} &\\quad \\text{factordb.com/api}?query = n \\\\
\\text{Response:} &\\quad \\{ \\text{status}, \\text{factors} = [p_1, p_2, \\ldots, p_k] \\} \\\\
\\text{Verify:} &\\quad \\prod_{i=1}^{k} p_i = n \\\\
\\text{Fallback 1:} &\\quad \\exists\\, p \\in \\text{primes}(B) : n \\bmod p = 0 \\\\
\\text{Fallback 2:} &\\quad \\text{ECM}(n, \\text{curves}) \\rightarrow [p, q] \\\\
\\text{Fallback 3:} &\\quad \\text{PollardRho}(n) \\rightarrow p, \\quad q = n / p
\\end{align*}

\\textbf{Explanation:} FactorDB returns pre-computed factorizations instantly for known moduli. If the database has no entry, the SageMath fallback runs trial division, ECM, and Pollard's rho sequentially.

\\textbf{References:} https://factordb.com; RsaCtfTool project`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use a small factor (> 10000 so trial division misses it, < 40 bits so Pollard's rho finds it)
  const p = randomPrime(36);
  const q = randomPrime(TESTCASE_BITS.p + TESTCASE_BITS.q - 36);
  return { n: (p * q).toString() };
};
