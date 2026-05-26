import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse, isqrt } from '../utils/bigint';

export const attack: Attack = {
  id: 'dependent-prime',
  name: 'Dependent-Prime RSA',
  category: 'Partial Key / Lattice',
  description: 'Factors n when q·e ≡ 1 (mod p). Use when q is derived from e and p via modular inverse.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `import math
def _attack():
    try:
        try:
            n = Integer(${vals.n})
            e = Integer(${vals.e})
            if n < 2:
                print("DEPENDENT_PRIME=FAILED: n is too small")
                return
            if e < 2:
                print("DEPENDENT_PRIME=FAILED: e must be >= 2")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print(f"Verification: 2 * {n // 2} = {n}")
                print("DEPENDENT_PRIME=SUCCESS")
                return
            if n.is_prime():
                print("DEPENDENT_PRIME=FAILED: n is prime")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("DEPENDENT_PRIME=SUCCESS")
                return
            # Use Python ints for fast iteration
            n_int = int(n)
            e_int = int(e)
            ne_int = n_int * e_int
            found = False
            for k in range(1, 100001):
                disc = 1 + 4 * k * ne_int
                sqrt_disc = math.isqrt(disc)
                if sqrt_disc * sqrt_disc == disc:
                    num = -1 + sqrt_disc
                    if num > 0 and num % (2 * k) == 0:
                        p_candidate = num // (2 * k)
                        if p_candidate > 1 and n_int % p_candidate == 0:
                            p_sage = Integer(p_candidate)
                            q_sage = n // p_sage
                            print(f"Verification: p * q = {p_sage * q_sage}")
                            print(f"p = {p_sage}")
                            print(f"q = {q_sage}")
                            print(f"k = {k}")
                            print()
                            print("DEPENDENT_PRIME=SUCCESS")
                            found = True
                            break
            if not found:
                print("DEPENDENT_PRIME=FAILED: no valid factorization found")
        except Exception as ex:
            print(f"DEPENDENT_PRIME=FAILED: {ex}")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("DEPENDENT_PRIME=FAILED")
_attack()`,
  frontendCheck: (vals) => {
    if (!vals.n || !vals.e) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const fourNE = 4n * n * e;
      for (let k = 1n; k <= 100000n; k++) {
        const disc = 1n + k * fourNE;
        const sqrt_disc = isqrt(disc);
        if (sqrt_disc * sqrt_disc !== disc) continue;
        const num = -1n + sqrt_disc;
        if (num > 0n && num % (2n * k) === 0n) {
          const p = num / (2n * k);
          if (p > 1n && n % p === 0n) {
            const q = n / p;
            return Promise.resolve(`Factor found!\np = ${p}\nq = ${q}`);
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If $q \\cdot e \\equiv 1 \\pmod{p}$, solve $kp^2 + p - ne = 0$ for $p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $q \\cdot e = 1 + kp$ for some integer $k$
\\item $n = p \\cdot q$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ne &= p + kp^2 \\\\
kp^2 + p - ne &= 0 \\\\
p &= \\frac{-1 + \\sqrt{1 + 4kne}}{2k} \\\\
\\text{Iterate } k = 1, \\ldots, 10^5: \\quad &\\text{check if } 1 + 4kne \\text{ is square} \\\\
\\text{If so, } p &\\mid n \\implies \\text{found} \\qed
\\end{align*}

\\textbf{References:} Custom CTF construction; related to Nitaj's constrained prime analysis`,
  usageGuide: 'This attack factors n when q is derived from p through a modular relationship: q·e ≡ 1 (mod p).\n\nHow to use:\n1. You have n and e, and know that q is computed as q = e^(-1) mod p\n2. Provide n and e\n3. The attack solves the equation k*p^2 + p - n*e = 0 to recover p\n\nTip: This key generation pattern occurs in some embedded RSA implementations where q is derived from p to speed up CRT operations.',
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 65537n;
  for (let attempt = 0; attempt < 5000; attempt++) {
    const p = randomPrime(TESTCASE_BITS.p);
    const q = modInverse(e, p);
    if (q !== null && q >= 2n && isPrimeMR(q)) {
      const n = p * q;
      const k = (q * e - 1n) / p;
      if (k > 0n && k < 100001n) {
        return { n: n.toString(), e: e.toString() };
      }
    }
  }
  throw new Error('dependent-prime: failed to generate testcase after 5000 attempts');
};
