import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

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
        try:
            n = Integer(${vals.n})
            import math
            n_int = int(n)
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
                print(f"Verification: p * q = {p * p}")
                print(f"p = {p}")
                print(f"q = {p}")
                print()
                print("GIMMICKY_PRIMES=SUCCESS")
                return
            found = False
            # 1. Mersenne primes: 2^p - 1
            print("Checking Mersenne primes (2^p - 1)...")
            for p in [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]:
                mersenne = 2**p - 1
                if n_int % mersenne == 0:
                    print(f"  Found Mersenne prime factor: 2^{p} - 1 = {mersenne}")
                    print(f"  Cofactor: {n // mersenne}")
                    print(f"  Verification: {mersenne} * {n // mersenne} = {n}")
                    print(f"p = {mersenne}")
                    print(f"q = {n // mersenne}")
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
                    if candidate > 1 and n_int % int(candidate) == 0:
                    print(f"  Found primorial prime factor: {candidate} = {p}# {'+' if sign == 1 else '-'} 1")
                    print(f"  Cofactor: {n // candidate}")
                    print(f"  Verification: {candidate} * {n // candidate} = {n}")
                    print(f"p = {candidate}")
                    print(f"q = {n // candidate}")
                    found = True
            # 3. Fermat primes: 2^(2^k) + 1
            print()
            print("Checking Fermat primes (2^(2^k) + 1)...")
            for k in range(0, 5):
                fermat = 2**(2**k) + 1
                if n_int % fermat == 0:
                    print(f"  Found Fermat prime factor: 2^(2^{k}) + 1 = {fermat}")
                    print(f"  Cofactor: {n // fermat}")
                    print(f"  Verification: {fermat} * {n // fermat} = {n}")
                    print(f"p = {fermat}")
                    print(f"q = {n // fermat}")
                    found = True
            # 4. Fibonacci primes
            print()
            print("Checking Fibonacci primes...")
            fib_primes = [2, 3, 5, 13, 89, 233, 1597, 28657, 514229, 433494437, 2971215073]
            for fib in fib_primes:
                if n_int % fib == 0:
                    print(f"  Found Fibonacci prime factor: {fib}")
                    print(f"  Cofactor: {n // fib}")
                    print(f"  Verification: {fib} * {n // fib} = {n}")
                    print(f"p = {fib}")
                    print(f"q = {n // fib}")
                    found = True
            # 5. Repunit primes: (10^p - 1) / 9
            print()
            print("Checking repunit primes...")
            for p in [2, 19, 23, 317, 1031]:
                try:
                    repunit = (10**p - 1) // 9
                    if n_int % repunit == 0:
                    print(f"  Found repunit prime factor: R({p}) = {repunit}")
                    print(f"  Cofactor: {n // repunit}")
                    print(f"  Verification: {repunit} * {n // repunit} = {n}")
                    print(f"p = {repunit}")
                    print(f"q = {n // repunit}")
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
                    if candidate > 1 and n_int % candidate == 0:
                    print(f"  Found factorial prime factor: {k}! {'+' if sign == 1 else '-'} 1")
                    print(f"  Cofactor: {n // candidate}")
                    print(f"  Verification: {candidate} * {n // candidate} = {n}")
                    print(f"p = {candidate}")
                    print(f"q = {n // candidate}")
                    found = True
            # 7. Carol and Kynea primes: (2^k - 1)^2 - 2, (2^k + 1)^2 - 2
            # Cap k at 100 to keep candidate sizes manageable (≈ 2^200 max)
            print()
            print("Checking Carol and Kynea primes...")
            for k in range(1, 101):
                for sign in [-1, 1]:
                    candidate = (2**k + sign)**2 - 2
                    if candidate > 1 and n_int % candidate == 0:
                        name = "Carol" if sign == -1 else "Kynea"
                    print(f"  Found {name} prime factor: (2^{k} {'-' if sign == -1 else '+' } 1)^2 - 2")
                    print(f"  Cofactor: {n // candidate}")
                    print(f"  Verification: {candidate} * {n // candidate} = {n}")
                    print(f"p = {candidate}")
                    print(f"q = {n // candidate}")
                    found = True
            # 8. Cullen and Woodall primes: k * 2^k +/- 1
            # Cap k at 100 to keep candidate sizes manageable (k*2^k ≈ 2^107 max)
            print()
            print("Checking Cullen and Woodall primes (k * 2^k \u00b1 1)...")
            for k in range(1, 101):
                for sign in [1, -1]:
                    candidate = k * 2**k + sign
                    if candidate > 1 and n_int % candidate == 0:
                        name = "Cullen" if sign == 1 else "Woodall"
                    print(f"  Found {name} prime factor: {k} * 2^{k} {'+' if sign == 1 else '-'} 1")
                    print(f"  Cofactor: {n // candidate}")
                    print(f"  Verification: {candidate} * {n // candidate} = {n}")
                    print(f"p = {candidate}")
                    print(f"q = {n // candidate}")
                    found = True
            if found:
                print()
                print("GIMMICKY_PRIMES=SUCCESS")
            else:
                print("No gimmicky prime factors found.")
                print("The factors are likely standard randomly-generated primes.")
                print()
                print("GIMMICKY_PRIMES=FAILED")
        except Exception as e:
            print(f"Error in gimmicky primes check: {e}")
            print("GIMMICKY_PRIMES=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("GIMMICKY_PRIMES=FAILED")
_attack()`,
  frontendCheck: (vals) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n < 2n) return Promise.resolve(null);
      if (n % 2n === 0n) return Promise.resolve(`n is even: ${n}\np = 2\nq = ${n / 2n}\nGIMMICKY_PRIMES=SUCCESS`);
      const nInt = n;
      const checkDiv = (candidate: bigint): bigint | null => {
        if (candidate > 1n && nInt % candidate === 0n) return candidate;
        return null;
      };
      const report = (factor: bigint): string => `Factor found!\nCofactor: ${nInt / factor}\nVerification: ${factor} * ${nInt / factor} = ${nInt}\nGIMMICKY_PRIMES=SUCCESS`;
      // 1. Mersenne primes: 2^p - 1
      for (const exp of [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]) {
        const mersenne = (1n << BigInt(exp)) - 1n;
        const f = checkDiv(mersenne);
        if (f) return Promise.resolve(report(f));
      }
      // 2. Primorial primes
      const smallPrimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199];
      let primorial = 1n;
      for (const p of smallPrimes) {
        primorial *= BigInt(p);
        for (const sign of [1n, -1n]) {
          const candidate = primorial + sign;
          if (candidate > 1n && nInt % candidate === 0n) return Promise.resolve(report(candidate));
        }
      }
      // 3. Fermat primes: 2^(2^k) + 1
      for (let k = 0; k < 5; k++) {
        const fermat = (1n << (1n << BigInt(k))) + 1n;
        const f = checkDiv(fermat);
        if (f) return Promise.resolve(report(f));
      }
      // 4. Fibonacci primes
      const fibPrimes = [2n,3n,5n,13n,89n,233n,1597n,28657n,514229n,433494437n,2971215073n];
      for (const fib of fibPrimes) {
        if (fib < nInt && nInt % fib === 0n) return Promise.resolve(report(fib));
      }
      // 5. Repunit primes: (10^p - 1) / 9
      for (const p of [2, 19, 23, 317, 1031]) {
        try {
          const repunit = (10n ** BigInt(p) - 1n) / 9n;
          if (repunit < nInt && nInt % repunit === 0n) return Promise.resolve(report(repunit));
        } catch { continue; }
      }
      // 6. Factorial primes: k! +/- 1
      let factorial = 1n;
      for (let k = 1; k <= 100; k++) {
        factorial *= BigInt(k);
        for (const sign of [1n, -1n]) {
          const candidate = factorial + sign;
          if (candidate > 1n && nInt % candidate === 0n) return Promise.resolve(report(candidate));
        }
      }
      // 7. Carol/Kynea: (2^k +/- 1)^2 - 2
      for (let k = 1; k <= 100; k++) {
        const twoK = 1n << BigInt(k);
        for (const sign of [-1n, 1n]) {
          const candidate = (twoK + sign) ** 2n - 2n;
          if (candidate > 1n && nInt % candidate === 0n) return Promise.resolve(report(candidate));
        }
      }
      // 8. Cullen/Woodall: k * 2^k +/- 1
      for (let k = 1; k <= 100; k++) {
        const twoK = 1n << BigInt(k);
        const kBig = BigInt(k);
        for (const sign of [1n, -1n]) {
          const candidate = kBig * twoK + sign;
          if (candidate > 1n && nInt % candidate === 0n) return Promise.resolve(report(candidate));
        }
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
