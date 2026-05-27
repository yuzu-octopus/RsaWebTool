import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse, isqrt } from '../utils/bigint';

export const attack: Attack = {
  id: 'dependent-prime',
  name: 'Dependent-Prime RSA',
  category: 'Partial Key / Lattice',
  description: 'Factors n when q is derived from e (q·e ≡ 1 mod p) via quadratic discriminant. Use when q = e^{-1} mod p as in some embedded RSA implementations.',
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
                print(f"Verification: p * q = {p * p}")
                print(f"p = {p}")
                print(f"q = {p}")
                print()
                print("DEPENDENT_PRIME=SUCCESS")
                return
            # Use Python ints for fast iteration
            n_int = int(n)
            e_int = int(e)
            ne_int = n_int * e_int
            found = False
            for k in range(1, 500001):
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
  frontendCheck: (vals, onProgress) => {
    if (!vals.n || !vals.e) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const fourNE = 4n * n * e;
      for (let k = 1n; k <= 500000n; k++) {
        if (onProgress && k % 50000n === 0n) {
          onProgress(Number(k * 100n / 500000n));
        }
        const disc = 1n + k * fourNE;
        // Mod-16 perfect square pre-filter: disc ≡ 1 (mod 4), so valid squares mod 16 are only 1 and 9
        // This rejects ~50% of candidates without calling isqrt
        const lastNybble = Number(disc & 15n);
        if (lastNybble !== 1 && lastNybble !== 9) continue;
        const sqrt_disc = isqrt(disc);
        if (sqrt_disc * sqrt_disc !== disc) continue;
        const num = -1n + sqrt_disc;
        if (num > 0n && num % (2n * k) === 0n) {
          const p = num / (2n * k);
          if (p > 1n && n % p === 0n) {
            const q = n / p;
            onProgress?.(100);
            return Promise.resolve(`Factor found!\np = ${p}\nq = ${q}\nk = ${k}\nDEPENDENT_PRIME=SUCCESS`);
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If $qe \\equiv 1 \\pmod{p}$, solve $kp^2 + p - ne = 0$ for $p$ by iterating $k$.

\\textbf{Setup:}
\\begin{itemize}
\\item $qe = 1 + kp$ for some integer $k$
\\item $n = pq$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ne &= p(qe) = p(1 + kp) = p + kp^2 \\\\
kp^2 + p - ne &= 0 \\\\
p &= \\frac{-1 + \\sqrt{1 + 4kne}}{2k} \\\\
\\text{Iterate } k &= 1, \\ldots, 5 \\cdot 10^5:\\quad \\text{check if } 1 + 4kne \\text{ is a perfect square} \\\\
\\text{If so, } p &\\mid n \\implies \\text{factorization found} \\qed
\\end{align*}

\\textbf{Explanation:} Multiplying $n = pq$ by $e$ and substituting $qe = 1 + kp$ yields a quadratic in $p$. The discriminant $\\Delta = 1 + 4kne$ must be a perfect square. The attack iterates $k$ up to $10^5$, using a mod-16 perfect-square pre-filter (only residues 1 and 9 are valid squares mod 16) to reject $\\sim 50\\%$ of candidates without computing an integer square root. This key generation pattern occurs in some embedded RSA implementations that derive $q$ from $p$ to speed up CRT parameter computation.

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
      if (k > 0n && k < 500001n) {
        return { n: n.toString(), e: e.toString() };
      }
    }
  }
  throw new Error('dependent-prime: failed to generate testcase after 5000 attempts');
};
