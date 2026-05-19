import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'linearly-related-primes',
  name: 'Linearly Related Primes',
  category: 'Partial Key / Lattice',
  description: 'Factors n when q = k·p + δ. Use when primes have a linear relationship.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'k', label: 'k (known multiplier)', placeholder: 'Enter k value...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    k = Integer(${v.k})
    if n <= 0 or k <= 0:
        print("LINEARLY_RELATED=FAILED: invalid input values")
    else:
        found = False
        for delta in range(-10000, 10001):
            disc = delta*delta + 4*k*n
            if disc >= 0:
                sqrt_disc = isqrt(disc)
                if sqrt_disc * sqrt_disc == disc:
                    num = -delta + sqrt_disc
                    if num > 0 and num % (2*k) == 0:
                        p = num // (2*k)
                        if n % p == 0:
                            q = n // p
                            print(f"Verification: p * q = {p * q}")
                            if p * q == n:
                                print(f"LINEARLY_RELATED=SUCCESS")
                                print(f"p={p}")
                                print(f"q={q}")
                                print(f"delta={delta}")
                                found = True
                                break
        if not found:
            print("LINEARLY_RELATED=FAILED: no valid factorization found")
except Exception as ex:
    print(f"LINEARLY_RELATED=FAILED: {ex}")`,
  proof: '\\textbf{Theorem:} If $q = kp + \\delta$ for known $k$ and small $\\delta$, solve the quadratic to factor $n$.\\newline\\newline\\textbf{Prerequisites:} Quadratic equations, Coppersmith method\\newline\\newline\\textbf{Proof:}\\begin{align*}n &= p \\cdot q = p(kp + \\delta) = kp^2 + \\delta p \\\\ kp^2 + \\delta p - n &= 0 \\\\ p &= \\frac{-\\delta \\pm \\sqrt{\\delta^2 + 4kn}}{2k} \\\\ \\text{For small } \\delta, &\\text{ iterate and check } p \\mid n\\end{align*}\\newline\\textbf{References:} Nitaj (1999)',
  priority: 'medium',
  applicableCheck: (p) => !!p.n && !!p.k,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const k = 1n;
  const delta = BigInt(Math.floor(Math.random() * 100) - 50);
  let q = k * p + delta;
  if (q < 2n) q = -q;
  while (!isPrimeMR(q)) q += 2n;
  const n = p * q;
  return { n: n.toString(), k: k.toString() };
};
