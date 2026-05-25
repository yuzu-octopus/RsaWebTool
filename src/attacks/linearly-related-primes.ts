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
  sageTemplate: (vals: Record<string, string>) => `import math
def _attack():
    try:
        try:
            n = Integer(${vals.n})
            k = Integer(${vals.k})
            if n < 2:
                print("LINEARLY_RELATED_PRIMES=FAILED: n is too small")
                return
            if k <= 0:
                print("LINEARLY_RELATED_PRIMES=FAILED: k must be positive")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print(f"Verification: 2 * {n // 2} = {n}")
                print("LINEARLY_RELATED_PRIMES=SUCCESS")
                return
            if n.is_prime():
                print("LINEARLY_RELATED_PRIMES=FAILED: n is prime")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("LINEARLY_RELATED_PRIMES=SUCCESS")
                return
            # Use Python ints for fast iteration
            n_int = int(n)
            k_int = int(k)
            found = False
            for delta in range(-10000, 10001):
                disc = delta * delta + 4 * k_int * n_int
                sqrt_disc = math.isqrt(disc)
                if sqrt_disc * sqrt_disc == disc:
                    num = -delta + sqrt_disc
                    if num > 0 and num % (2 * k_int) == 0:
                        p_candidate = num // (2 * k_int)
                        if p_candidate > 1 and n_int % p_candidate == 0:
                            p_sage = Integer(p_candidate)
                            q_sage = n // p_sage
                            print(f"Verification: p * q = {p_sage * q_sage}")
                            print(f"p = {p_sage}")
                            print(f"q = {q_sage}")
                            print(f"delta = {delta}")
                            print()
                            print("LINEARLY_RELATED_PRIMES=SUCCESS")
                            found = True
                            break
            if not found:
                print("LINEARLY_RELATED_PRIMES=FAILED: no valid factorization found")
        except Exception as ex:
            print(f"LINEARLY_RELATED_PRIMES=FAILED: {ex}")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("LINEARLY_RELATED_PRIMES=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $q = kp + \\delta$ for known $k$ and small $|\\delta|$, solve $kp^2 + \\delta p - n = 0$ for $p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$, $q = kp + \\delta$
\\item $k$ known, $\\delta$ small ($|\\delta| < 10^4$)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= kp^2 + \\delta p \\\\
kp^2 + \\delta p - n &= 0 \\\\
p &= \\frac{-\\delta + \\sqrt{\\delta^2 + 4kn}}{2k} \\\\
\\text{Iterate } \\delta \\in [-B, B]: \\quad &\\text{check if } \\delta^2 + 4kn \\text{ is square} \\\\
\\text{If so, } p &\\mid n \\implies \\text{found} \\qed
\\end{align*}

\\textbf{References:} A. Nitaj, "Cryptanalysis of RSA with Constrained Primes", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.k,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  // Vary k to test general linear relationship: q = k·p + δ
  const r = Math.random();
  const k = r < 0.4 ? 1n : r < 0.7 ? 2n : 3n;
  // Pick a small non-zero delta, then find q = k*p + delta that is prime
  let targetDelta = BigInt(Math.floor(Math.random() * 100) + 1); // [1, 100]
  if (Math.random() < 0.5) targetDelta = -targetDelta;
  let q = k * p + targetDelta;
  // q is always > 2 for 256-bit primes; keep safety guard
  if (q < 2n) q = k * p + BigInt(Math.abs(Number(targetDelta))) + 2n;
  // Ensure q is odd and q ≠ p
  if (q % 2n === 0n) q += 1n;
  while (!isPrimeMR(q) || q === p) {
    q += 2n;
  }
  const n = p * q;
  return { n: n.toString(), k: k.toString() };
};
