import type { Attack } from '../types';
import { randomPrime, generateKeyPair, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
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
    if n <= 0 or e <= 0:
        print("DEPENDENT_PRIME=FAILED: invalid input values")
    else:
        ne = n * e
        found = False
        for k in range(1, 100000):
            disc = 1 + 4*k*ne
            if disc >= 0:
                sqrt_disc = isqrt(disc)
                if sqrt_disc * sqrt_disc == disc:
                    num = -1 + sqrt_disc
                    if num > 0 and num % (2*k) == 0:
                        p = num // (2*k)
                        if n % p == 0:
                            q = n // p
                            print(f"Verification: p * q = {p * q}")
                            if p * q == n:
                                print(f"DEPENDENT_PRIME=SUCCESS")
                                print(f"p={p}")
                                print(f"q={q}")
                                found = True
                                break
        if not found:
            print("DEPENDENT_PRIME=FAILED: no valid factorization found")
except Exception as ex:
    print(f"DEPENDENT_PRIME=FAILED: {ex}")`,
  proof: '\\textbf{Theorem:} If $q = e^{-1} \\bmod p$, then $n = pq$ creates a solvable quadratic system.\\newline\\newline\\textbf{Prerequisites:} Modular inverse, quadratic equations\\newline\\newline\\textbf{Proof:}\\begin{align*}q \\cdot e &\\equiv 1 \\pmod{p} \\\\ q \\cdot e &= 1 + kp \\\\ n &= p \\cdot q = p \\cdot \\frac{1 + kp}{e} \\\\ ne &= p + kp^2 \\\\ kp^2 + p - ne &= 0 \\\\ p &= \\frac{-1 + \\sqrt{1 + 4kne}}{2k}\\end{align*}\\newline\\textbf{References:} Custom CTF construction',
  priority: 'medium',
  applicableCheck: (p) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 65537n;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const p = randomPrime(TESTCASE_BITS.p);
    const q = modInverse(e, p);
    if (q !== null && q >= 2n && isPrimeMR(q)) {
      const n = p * q;
      const k = (q * e - 1n) / p;
      if (k <= 100000n) {
        return { n: n.toString(), e: e.toString() };
      }
    }
  }
  const pair = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: pair.n.toString(), e: pair.e.toString() };
};
