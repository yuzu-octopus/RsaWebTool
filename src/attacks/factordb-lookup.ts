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
                out = []
                # Validate inputs
                if not "${vals.n}".strip():
                    out.append("ERROR: n is required")
                    out.append("FACTORDB_LOOKUP=FAILED")
                    print("\\n".join(out))
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
                out.append(f"n = {n} is too small to factor")
                out.append("FACTORDB_LOOKUP=FAILED")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append(f"n is even. p = 2, q = {n // 2}")
                out.append("FACTORDB_LOOKUP=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append("n is prime. Not a valid RSA modulus.")
                out.append("FACTORDB_LOOKUP=FAILED")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                out.append("FACTORDB_LOOKUP=SUCCESS")
                print("\\n".join(out))
                return
            out.append(f"Checking if n = {n} has known factors")
            out.append("")
            # Step 1: Trial division with small primes
            out.append("Step 1: Trial division with small primes...")
            for p in primes(10000):
                if n % p == 0:
                    q = n // p
                    out.append(f"Found small factor: p = {p}")
                    out.append(f"q = {q}")
                    if q.is_prime():
                        out.append("q is prime. Factorization complete!")
                    else:
                        out.append("q is composite. Further factorization needed.")
                        out.append(f"q factors: {factor(q)}")
                    out.append("FACTORDB_LOOKUP=SUCCESS")
                    print("\\n".join(out))
                    return
            out.append("No factors found below 10000.")
            # Step 2: ECM factorization
            out.append("")
            out.append("Step 2: ECM factorization...")
            try:
                fac = n.factor(algorithm='ecm')
                if fac:
                    fac_p = None
                    for fp, exp in fac:
                        fac_p = fp
                        break
                    if fac_p is not None and 1 < fac_p < n:
                        q = n // fac_p
                        out.append(f"p = {fac_p}")
                        out.append(f"q = {q}")
                        out.append(f"Verification: p * q = {fac_p * q}")
                        out.append("FACTORDB_LOOKUP=SUCCESS")
                        print("\\n".join(out))
                        return
                    else:
                        out.append("ECM found no non-trivial factors.")
                else:
                    out.append("ECM did not find factors.")
            except Exception as ex:
                out.append(f"ECM failed: {ex}")
            # Step 3: Pollard's rho fallback
            out.append("")
            out.append("Step 3: Pollard's rho...")
            try:
                f = pollard_rho_factor(n)
                if f is not None and f != n:
                    out.append(f"Pollard's rho found: {f}")
                    out.append(f"Other factor: {n // f}")
                    out.append("FACTORDB_LOOKUP=SUCCESS")
                    print("\\n".join(out))
                    return
                else:
                    out.append("Pollard's rho did not find a factor.")
            except Exception as ex:
                out.append(f"Pollard's rho failed: {ex}")
            out.append("FACTORDB_LOOKUP=FAILED")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("FACTORDB_LOOKUP=FAILED")
            print("\\n".join(out))
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
