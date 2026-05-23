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
  sageTemplate: (vals: Record<string, string>) => `def _attack():
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
            found = False
            for delta in range(-10000, 10001):
                disc = delta*delta + 4*k*n
                sqrt_disc = ZZ(disc).isqrt()
                if sqrt_disc * sqrt_disc == disc:
                    num = -delta + sqrt_disc
                    if num > 0 and num % (2*k) == 0:
                        p = num // (2*k)
                        if n % p == 0:
                            q = n // p
                            print(f"Verification: p * q = {p * q}")
                            print(f"LINEARLY_RELATED_PRIMES=SUCCESS")
                            print(f"p={p}")
                            print(f"q={q}")
                            print(f"delta={delta}")
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
  proof: `\\textbf{Theorem:} If $q = kp + \\delta$ for known $k$ and small $|\\delta|$, solve the quadratic $kp^2 + \\delta p - n = 0$ to factor $n$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = p \\cdot q$ where $q = kp + \\delta$
\\item $k$ is known, $\\delta$ is small (e.g., $|\\delta| < 10^4$)
\\item Quadratic formula: $p = \\frac{-\\delta + \\sqrt{\\delta^2 + 4kn}}{2k}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p \\cdot q = p(kp + \\delta) = kp^2 + \\delta p \\\\
kp^2 + \\delta p - n &= 0 \\\\
p &= \\frac{-\\delta \\pm \\sqrt{\\delta^2 + 4kn}}{2k} \\\\
\\text{Since } p > 0: \\quad p &= \\frac{-\\delta + \\sqrt{\\delta^2 + 4kn}}{2k} \\\\
\\text{Iterate } \\delta \\in [-B, B]: \\quad &\\text{check if } \\delta^2 + 4kn \\text{ is a perfect square} \\\\
\\text{If so, compute } p &\\text{ and verify } p \\mid n \\qed
\\end{align*}

\\textbf{Explanation:} Substitute $q = kp + \\delta$ into $n = pq$ to get the quadratic $kp^2 + \\delta p - n = 0$. For each candidate $\\delta$ in a small range, check if the discriminant $\\delta^2 + 4kn$ is a perfect square. If so, compute $p$ from the quadratic formula and verify $p \\mid n$.

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
