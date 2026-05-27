import type { Attack } from '../types';
import { queryFactorDB, formatFactorDBResult } from '../utils/factordb';

export const attack: Attack = {
  id: 'factordb-lookup',
  name: 'FactorDB Lookup',
  category: 'Advanced',
  description: 'Looks up factorization of n in the FactorDB database with local fallbacks (trial division, ECM, Pollard\'s rho). Use as the first step for any unknown RSA modulus.',
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
                print(f"Verification: p * q = {p * p}")
                print(f"p = {p}")
                print(f"q = {p}")
                print()
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
  proof: `\\textbf{Theorem:} FactorDB provides instant factorization for any previously factored modulus via a public API, with local fallbacks for unknown moduli.

\\textbf{Setup:}
\\begin{itemize}
\\item Input: RSA modulus $n$ to factor
\\item FactorDB maintains a database of known factorizations
\\item CORS proxy at \`factordb-proxy\` bridges browser-to-API requests
\\end{itemize}

\\textbf{API Mechanism:}
\\begin{itemize}
\\item Query: \`GET /query?n=<hex>\` to factordb.com API
\\item Response contains status (FF = fully factored, CF = composite factors, etc.)
\\item If FF, factors are returned as a list of prime-power pairs
\\item Verification: $\\prod p_i^{e_i} = n$
\\end{itemize}

\\textbf{Fallback Chain (when n is not in FactorDB):}
\\begin{align*}
\\text{Fallback 1: } &\\text{Trial division up to } 10^4 \\\\
\\text{Fallback 2: } &\\text{ECM factorisation via SageMath: } n.\\text{factor(algorithm='ecm')} \\\\
\\text{Fallback 3: } &\\text{Pollard's rho: Floyd cycle detection} \\qed
\\end{align*}

\\textbf{Explanation:} FactorDB is the internet's largest database of integer factorizations, containing billions of entries. The attack first queries FactorDB via a CORS proxy. If the modulus has been factored before (common for CTF challenges), the result is instant. If not, SageMathCell falls back to local factorization methods: trial division for small factors, ECM for medium-sized factors, and Pollard's rho for larger ones. This makes FactorDB Lookup an excellent first diagnostic step for any unknown RSA modulus.

\\textbf{References:} https://factordb.com`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use a known-factored modulus confirmed in FactorDB (143 = 11 * 13, status FF)
  // so the frontendCheck L3 test can successfully query and verify the API works.
  return { n: "143" };
};
