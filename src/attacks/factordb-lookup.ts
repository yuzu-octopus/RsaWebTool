import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
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

try:
    n = Integer(${vals.n})

    # Even check
    if n % 2 == 0:
        print(f"n is even. p = 2, q = {n // 2}")
        print("FACTORDB_LOOKUP=SUCCESS")
        quit()

    # Prime check
    if is_prime(n):
        print("n is prime. Not a valid RSA modulus.")
        print("FACTORDB_LOOKUP=FAILED")
        quit()

    print(f"Checking if n = {n} has known factors")
    print()

    # Trial division with small primes
    print("Step 1: Trial division with small primes...")
    small_primes = primes(10000)
    found = False
    for p in small_primes:
        if n % p == 0:
            q = n // p
            print(f"Found small factor: p = {p}")
            print(f"q = {q}")
            if is_prime(q):
                print("q is prime. Factorization complete!")
            else:
                print(f"q is composite. Further factorization needed.")
                print(f"q factors: {factor(q)}")
            found = True
            break
    if not found:
        print("No factors found below 10000.")

    # Try ECM
    print()
    print("Step 2: ECM factorization...")
    try:
        factors = ecm.factor(n, max_steps=100)
        if factors and len(factors) > 1:
            print(f"ECM found factors: {factors}")
            flist = list(factors)
            if len(flist) == 2:
                p, q = flist[0][0], flist[1][0]
                print(f"p = {p}")
                print(f"q = {q}")
                print("FACTORDB_LOOKUP=SUCCESS")
            else:
                print(f"Complete factorization: {factors}")
                print("FACTORDB_LOOKUP=SUCCESS")
        else:
            print("ECM did not find factors within step limit.")
    except:
        print("ECM failed.")

    # Try Pollard's rho
    print()
    print("Step 3: Pollard's rho...")
    try:
        f = pollard_rho(n)
        if f and f != n:
            print(f"Pollard's rho found: {f}")
            print(f"Other factor: {n // f}")
            print("FACTORDB_LOOKUP=SUCCESS")
        else:
            print("Pollard's rho did not find a factor.")
            print("FACTORDB_LOOKUP=FAILED")
    except:
        print("Pollard's rho failed.")
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
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString() };
};
