import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'ecm2',
  name: 'ECM Full Factorization',
  category: 'Factorization',
  description: 'Full factorization via repeated ECM. Use to find all prime factors of n by recursively applying ECM to composite remainders.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        out = []
        try:
            n = Integer(${vals.n})
            from sage.libs.libecm import ecmfactor
            def ecm_factor_all(m, depth):
                indent = "  " * depth
                if m == 1:
                    return []
                if m.is_prime():
                    out.append(f"{indent}Prime: {m}")
                    return [m]
                out.append(f"{indent}Composite: {m} ({m.nbits()} bits)")
                B1_vals = [2000, 10000, 50000]    # capped at 50k to avoid SageMathCell timeout
                found_p = None
                for B1_cur in B1_vals:
                    for attempt in range(10):
                        try:
                            result = ecmfactor(m, B1_cur)
                            if result[0]:
                                p = result[1]
                                if p != 1 and p != m and m % p == 0:
                                    found_p = p
                                    break
                        except Exception:
                            continue
                    if found_p is not None:
                        break
                if found_p is not None:
                    out.append(f"{indent}ECM factor: {found_p}")
                    return ecm_factor_all(found_p, depth + 1) + ecm_factor_all(m // found_p, depth + 1)
                out.append(f"{indent}ECM found no factor, using factor()")
                fac = factor(m)
                result = []
                for prime, exp in fac:
                    for _ in range(exp):
                        result.append(prime)
                return result
            out.append(f"ECM Full Factorization on n = {n}")
            out.append("")
            if n < 2:
                out.append(f"n = {n} is too small to factor")
                print("\\n".join(out))
                print("ECM2=FAILED")
                return
            if n % 2 == 0:
                out.append(f"n is even: {n}")
                out.append(f"Verification: 2 * {n // 2} = {n}")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append("")
                print("\\n".join(out))
                print("ECM2=SUCCESS")
                return
            if n.is_prime():
                out.append(f"n is prime: {n}")
                print("\\n".join(out))
                print("ECM2=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                print("\\n".join(out))
                print("ECM2=SUCCESS")
                return
            factors = ecm_factor_all(n, 0)
            factors.sort()
            out.append("")
            out.append(f"All {len(factors)} prime factors: {factors}")
            out.append("")
            counts = {}
            for f in factors:
                counts[f] = counts.get(f, 0) + 1
            out.append(f"Factorization:")
            product = 1
            for prime, exp in sorted(counts.items()):
                if exp == 1:
                    out.append(f"  p = {prime}")
                else:
                    out.append(f"  {prime}^{exp}")
                product *= prime ** exp
            out.append("")
            out.append(f"Verification: product = {product}")
            out.append(f"Matches n: {product == n}")
            if product == n:
                out.append("")
                print("\\n".join(out))
                print("ECM2=SUCCESS")
            else:
                out.append("")
                print("\\n".join(out))
                print("ECM2=FAILED")
        except Exception as e:
            out.append(f"Error: {e}")
            print("\\n".join(out))
            print("ECM2=FAILED")
        #
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        print("\\n".join(out))
        print("ECM2=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Repeated ECM with factor removal yields complete factorization.

\\textbf{Setup:}
\\begin{itemize}
\\item ECM finds one prime factor at a time
\\item n = \\prod p_i^{e_i}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p_1^{e_1} p_2^{e_2} \\cdots p_k^{e_k} \\\\
\\text{ECM finds } p_i &\\implies n' = n / p_i \\\\
\\text{Repeat until } n' &= 1 \\text{ or prime} \\\\
\\text{Total time dominated by } &\\text{largest prime factor} \\qed
\\end{align*}

\\textbf{References:} Lenstra, "Factoring Integers with Elliptic Curves", 1987`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with 3 prime factors for multi-round ECM demonstration
  // 48-bit smallest factor (~15 digits) — ECM with B1 up to 50000 finds it quickly
  const p1 = randomPrime(48);
  const p2 = randomPrime(56);
  const p3 = randomPrime(56);
  return { n: (p1 * p2 * p3).toString() };
};
