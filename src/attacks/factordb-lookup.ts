import type { Attack } from '../types';
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
        return formatFactorDBResult(result) + "\nFACTORDB_LOOKUP=SUCCESS";
      }
      return null;
    } catch {
      return null;
    }
  },
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            # Validate inputs
            if not "${vals.n}".strip():
                print("ERROR: n is required")
                print("FACTORDB_LOOKUP=FAILED")
                return
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
            n = Integer(${vals.n})
            # Pre-checks
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("FACTORDB_LOOKUP=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even. p = 2, q = {n // 2}")
                print("FACTORDB_LOOKUP=SUCCESS")
                return
            if n.is_prime():
                print("n is prime. Not a valid RSA modulus.")
                print("FACTORDB_LOOKUP=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("FACTORDB_LOOKUP=SUCCESS")
                return
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
                    return
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
                        return
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
                    return
                else:
                    print("Pollard's rho did not find a factor.")
            except Exception as ex:
                print(f"Pollard's rho failed: {ex}")
            print("FACTORDB_LOOKUP=FAILED")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("FACTORDB_LOOKUP=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("FACTORDB_LOOKUP=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Pre-factored moduli from public databases plus local fallbacks.

\\textbf{Setup:}
\\begin{itemize}
\\item n to factor
\\item FactorDB API available
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Query} &\\;\\text{factordb.com/api}?query = n \\\\
\\text{Verify} &\\; \\prod p_i = n \\\\
\\text{Fallback 1:} &\\; \\text{trial division up to bound } B \\\\
\\text{Fallback 2:} &\\; \\text{ECM}(n) \\\\
\\text{Fallback 3:} &\\; \\text{PollardRho}(n) \\qed
\\end{align*}

\\textbf{References:} https://factordb.com`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use a known-factored modulus confirmed in FactorDB (143 = 11 * 13, status FF)
  // so the frontendCheck L3 test can successfully query and verify the API works.
  return { n: "143" };
};
