import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse } from '../utils/bigint';

export const attack: Attack = {
  id: 'dependent-prime',
  name: 'Dependent-Prime RSA',
  category: 'Partial Key / Lattice',
  description: 'Factors n when q·e ≡ 1 (mod p). Use when q is derived from e and p via modular inverse.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    e = Integer(${v.e})
    if n < 2:
        print("DEPENDENT_PRIME=FAILED: n is too small")
        quit()
    if e < 2:
        print("DEPENDENT_PRIME=FAILED: e must be >= 2")
        quit()
    if n % 2 == 0:
        print(f"n is even: {n}")
        print(f"p = 2")
        print(f"q = {n // 2}")
        print(f"Verification: 2 * {n // 2} = {n}")
        print("DEPENDENT_PRIME=SUCCESS")
        quit()
    if n.is_prime():
        print("DEPENDENT_PRIME=FAILED: n is prime")
        quit()
    if n.is_square():
        p = isqrt(n)
        print(f"n is a perfect square: {p}^2 = {n}")
        print(f"p = q = {p}")
        print("DEPENDENT_PRIME=SUCCESS")
        quit()
    ne = n * e
    found = False
    for k in range(1, 100001):
        disc = 1 + 4*k*ne
        sqrt_disc = ZZ(disc).isqrt()
        if sqrt_disc * sqrt_disc == disc:
            num = -1 + sqrt_disc
            if num > 0 and num % (2*k) == 0:
                p = num // (2*k)
                if n % p == 0:
                    q = n // p
                    print(f"Verification: p * q = {p * q}")
                    print("DEPENDENT_PRIME=SUCCESS")
                    print(f"p={p}")
                    print(f"q={q}")
                    print(f"k={k}")
                    found = True
                    break
    if not found:
        print("DEPENDENT_PRIME=FAILED: no valid factorization found")
except Exception as ex:
    print(f"DEPENDENT_PRIME=FAILED: {ex}")`,
  proof: `\\textbf{Theorem:} If $q = e^{-1} \\bmod p$, then $n = pq$ creates a solvable quadratic system $kp^2 + p - ne = 0$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $q \\cdot e \\equiv 1 \\pmod{p}$ (q is the modular inverse of e mod p)
\\item $q \\cdot e = 1 + kp$ for some integer $k$
\\item $n = p \\cdot q$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
q \\cdot e &= 1 + kp \\\\
n &= p \\cdot q = p \\cdot \\frac{1 + kp}{e} \\\\
ne &= p + kp^2 \\\\
kp^2 + p - ne &= 0 \\\\
p &= \\frac{-1 + \\sqrt{1 + 4kne}}{2k} \\\\
\\text{Iterate } k = 1, \\ldots, 10^5: \\quad &\\text{check if } 1 + 4kne \\text{ is a perfect square} \\\\
\\text{If so, compute } p &\\text{ and verify } p \\mid n \\qed
\\end{align*}

\\textbf{Explanation:} From the constraint $q \\cdot e \\equiv 1 \\pmod{p}$, substitute $q = (1 + kp)/e$ into $n = pq$ to get $ne = p + kp^2$. This gives the quadratic $kp^2 + p - ne = 0$. For each $k$, check if the discriminant $1 + 4kne$ is a perfect square. If so, compute $p$ from the quadratic formula and verify $p \\mid n$.

\\textbf{References:} Custom CTF construction; related to Nitaj's constrained prime analysis`,
  priority: 'medium',
  applicableCheck: (p) => !!p.n && !!p.e,
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
