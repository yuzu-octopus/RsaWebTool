import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { sageGuardBlock } from './guard';

export const attack: Attack = {
  id: 'gimmicky-primes',
  name: 'Gimmicky Primes',
  category: 'Factorization',
  description: 'Detects special-form primes (Mersenne, primorial, Fermat, Fibonacci, repunit, and others) by trial division. Use for CTF moduli with crafted prime factors.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        out = []
        try:
            n = Integer(${vals.n})
            import math
            n_int = int(n)
            ${sageGuardBlock("GIMMICKY_PRIMES", '            ')}
            fp = None
            fq = None
            ftype = None
            fdetail = None
            def _found(t, d, pv):
                nonlocal fp, fq, ftype, fdetail
                fp = pv
                fq = n // pv
                ftype = t
                fdetail = d
            # 1. Mersenne primes: 2^p - 1
            if fp is None:
                for p in [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]:
                    mersenne = 2**p - 1
                    if n_int % mersenne == 0:
                        _found("Mersenne prime", f"2^{p} - 1", mersenne)
                        break
            # 2. Primorial primes: p# +/- 1
            if fp is None:
                primes_list = list(prime_range(2, 200))
                primorial = 1
                for p in primes_list:
                    primorial *= p
                    for sign in [1, -1]:
                        candidate = primorial + sign
                        if candidate > 1 and n_int % int(candidate) == 0:
                            _found("primorial prime", f"{p}# {'+' if sign == 1 else '-'} 1", int(candidate))
                            break
                    if fp is not None:
                        break
            # 3. Fermat primes: 2^(2^k) + 1
            if fp is None:
                for k in range(0, 5):
                    fermat = 2**(2**k) + 1
                    if n_int % fermat == 0:
                        _found("Fermat prime", f"2^(2^{k}) + 1", fermat)
                        break
            # 4. Fibonacci primes
            if fp is None:
                fib_primes = [2, 3, 5, 13, 89, 233, 1597, 28657, 514229, 433494437, 2971215073]
                for fib in fib_primes:
                    if n_int % fib == 0:
                        _found("Fibonacci prime", str(fib), fib)
                        break
            # 5. Repunit primes: (10^p - 1) / 9
            if fp is None:
                for p in [2, 19, 23, 317, 1031]:
                    try:
                        repunit = (10**p - 1) // 9
                        if n_int % repunit == 0:
                            _found("repunit prime", f"R({p})", repunit)
                            break
                    except Exception:
                        pass
            # 6. Factorial primes: k! +/- 1
            if fp is None:
                factorial = 1
                for k in range(1, 1001):
                    factorial *= k
                    for sign in [1, -1]:
                        candidate = factorial + sign
                        if candidate > n_int:
                            break
                        if candidate > 1 and n_int % candidate == 0:
                            _found("factorial prime", f"{k}! {'+' if sign == 1 else '-'} 1", candidate)
                            break
                    if fp is not None:
                        break
            # 7. Carol and Kynea primes
            if fp is None:
                for k in range(1, 1001):
                    for sign in [-1, 1]:
                        candidate = (2**k + sign)**2 - 2
                        if candidate > n_int:
                            break
                        if candidate > 1 and n_int % candidate == 0:
                            name = "Carol" if sign == -1 else "Kynea"
                            _found(f"{name} prime", f"(2^{k} {'-' if sign == -1 else '+'} 1)^2 - 2", candidate)
                            break
                    if fp is not None:
                        break
            # 8. Cullen and Woodall primes
            if fp is None:
                for k in range(1, 1001):
                    for sign in [1, -1]:
                        candidate = k * 2**k + sign
                        if candidate > n_int:
                            break
                        if candidate > 1 and n_int % candidate == 0:
                            name = "Cullen" if sign == 1 else "Woodall"
                            _found(f"{name} prime", f"{k} * 2^{k} {'+' if sign == 1 else '-'} 1", candidate)
                            break
                    if fp is not None:
                        break
            if fp is not None and fp > 1:
                out.append(f"p is {ftype} ({fdetail})")
                out.append(f"p = {fp}")
                out.append(f"q = {fq}")
                out.append("")
                out.append("GIMMICKY_PRIMES=SUCCESS")
            else:
                out.append("No gimmicky prime factors found.")
                out.append("The factors are likely standard randomly-generated primes.")
                out.append("")
                out.append("GIMMICKY_PRIMES=FAILED")
        except Exception as e:
            out.append(f"Error in gimmicky primes check: {e}")
            out.append("GIMMICKY_PRIMES=FAILED")
        #
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        out.append("GIMMICKY_PRIMES=FAILED")
    print("\\n".join(out))
_attack()`,
  frontendCheck: (vals) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n < 2n) return Promise.resolve(null);
      if (n % 2n === 0n) return Promise.resolve(`n is even: ${n}\np = 2\nq = ${n / 2n}\nGIMMICKY_PRIMES=SUCCESS`);

      type Found = { type: string; detail: string; p: bigint } | null;
      let found: Found = null;

      const checkDiv = (candidate: bigint): boolean => {
        return candidate > 1n && n % candidate === 0n;
      };

      // 1. Mersenne primes: 2^p - 1
      for (const exp of [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]) {
        const mersenne = (1n << BigInt(exp)) - 1n;
        if (checkDiv(mersenne)) { found = { type: 'Mersenne prime', detail: `2^${exp} - 1`, p: mersenne }; break; }
      }
      // 2. Primorial primes
      if (!found) {
        const smallPrimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199];
        let primorial = 1n;
        for (const p of smallPrimes) {
          primorial *= BigInt(p);
          for (const sign of [1n, -1n]) {
            const candidate = primorial + sign;
            if (candidate > 1n && n % candidate === 0n) {
              found = { type: 'primorial prime', detail: `${p}# ${sign === 1n ? '+' : '-'} 1`, p: candidate };
              break;
            }
          }
          if (found) break;
        }
      }
      // 3. Fermat primes: 2^(2^k) + 1
      if (!found) {
        for (let k = 0; k < 5; k++) {
          const fermat = (1n << (1n << BigInt(k))) + 1n;
          if (checkDiv(fermat)) { found = { type: 'Fermat prime', detail: `2^(2^${k}) + 1`, p: fermat }; break; }
        }
      }
      // 4. Fibonacci primes
      if (!found) {
        const fibPrimes = [2n,3n,5n,13n,89n,233n,1597n,28657n,514229n,433494437n,2971215073n];
        for (const fib of fibPrimes) {
          if (fib < n && n % fib === 0n) { found = { type: 'Fibonacci prime', detail: fib.toString(), p: fib }; break; }
        }
      }
      // 5. Repunit primes: (10^p - 1) / 9
      if (!found) {
        for (const p of [2, 19, 23, 317, 1031]) {
          try {
            const repunit = (10n ** BigInt(p) - 1n) / 9n;
            if (repunit < n && n % repunit === 0n) { found = { type: 'repunit prime', detail: `R(${p})`, p: repunit }; break; }
          } catch { continue; }
        }
      }
      // 6. Factorial primes: k! +/- 1
      if (!found) {
        let factorial = 1n;
        for (let k = 1; k <= 1000; k++) {
          factorial *= BigInt(k);
          for (const sign of [1n, -1n]) {
            const candidate = factorial + sign;
            if (candidate > 1n && n % candidate === 0n) {
              found = { type: 'factorial prime', detail: `${k}! ${sign === 1n ? '+' : '-'} 1`, p: candidate };
              break;
            }
          }
          if (found) break;
        }
      }
      // 7. Carol/Kynea: (2^k +/- 1)^2 - 2
      if (!found) {
        for (let k = 1; k <= 1000; k++) {
          const twoK = 1n << BigInt(k);
          for (const sign of [-1n, 1n]) {
            const candidate = (twoK + sign) ** 2n - 2n;
            if (candidate > 1n && n % candidate === 0n) {
              const name = sign === -1n ? 'Carol' : 'Kynea';
              found = { type: `${name} prime`, detail: `(2^${k} ${sign === -1n ? '-' : '+'} 1)^2 - 2`, p: candidate };
              break;
            }
          }
          if (found) break;
        }
      }
      // 8. Cullen/Woodall: k * 2^k +/- 1
      if (!found) {
        for (let k = 1; k <= 1000; k++) {
          const twoK = 1n << BigInt(k);
          const kBig = BigInt(k);
          for (const sign of [1n, -1n]) {
            const candidate = kBig * twoK + sign;
            if (candidate > 1n && n % candidate === 0n) {
              const name = sign === 1n ? 'Cullen' : 'Woodall';
              found = { type: `${name} prime`, detail: `${k} * 2^${k} ${sign === 1n ? '+' : '-'} 1`, p: candidate };
              break;
            }
          }
          if (found) break;
        }
      }

      if (found) {
        const q = n / found.p;
        return Promise.resolve(
          `p is ${found.type} (${found.detail})\np = ${found.p}\nq = ${q}\n\nGIMMICKY_PRIMES=SUCCESS`
        );
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If $p$ is a special-form prime from a known set $\\mathcal{S}$, trial division against $\\mathcal{S}$ finds $p$ in $O(|\\mathcal{S}| \\cdot \\log^2 n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$ where $p$ belongs to a known special-form set $\\mathcal{S}$
\\item $\\mathcal{S}$ includes Mersenne, primorial, Fermat, Fibonacci, repunit, factorial, Carol/Kynea, and Cullen/Woodall primes
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p \\cdot q,\\quad p \\in \\mathcal{S} \\\\
n \\bmod s &= 0 \\text{ for some } s \\in \\mathcal{S} \\\\
s \\mid n &\\implies p = s,\\; q = n/s \\\\
\\text{Cost: } &O(|\\mathcal{S}| \\cdot \\log^2 n) \\qed
\\end{align*}

\\textbf{Explanation:} In CTF challenges, primes are sometimes constructed from known sequences (Mersenne $2^p-1$, primorial $p\\#\\pm1$, Fermat $2^{2^k}+1$, etc.). This attack checks all small candidates from each family by trial division. The set size is a few hundred candidates, so the check completes nearly instantly.

\\textbf{References:} C. Caldwell, "The Prime Pages" (https://t5k.org); P. Ribenboim, "The New Book of Prime Number Records", Springer 1996`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate using a random Mersenne prime: 2^p - 1
  // Skip trivial ones (2,3,5,7); use medium ones for variety
  const mersenneP = [17, 19, 31, 61, 89, 107, 127];
  const candidates = mersenneP.flatMap(p => {
    const val = (1n << BigInt(p)) - 1n;
    return isPrimeMR(val) ? [{ p, val }] : [];
  });
  // Fallback: 2^17 - 1 = 131071 is a known Mersenne prime guaranteed to pass
  const mersenne = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)].val
    : (1n << 17n) - 1n;
  const q = randomPrime(TESTCASE_BITS.q);
  return { n: (mersenne * q).toString() };
};
