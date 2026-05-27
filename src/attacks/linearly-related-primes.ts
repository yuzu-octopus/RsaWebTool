import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { isqrt } from '../utils/bigint';

export const attack: Attack = {
  id: 'linearly-related-primes',
  name: 'Linearly Related Primes',
  category: 'Partial Key / Lattice',
  description: 'Factors n when primes are linearly related (q = k·p + δ) via quadratic discriminant. Use when p and q share a known relationship with multiplier k.',
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
                print(f"Verification: p * q = {p * p}")
                print(f"p = {p}")
                print(f"q = {p}")
                print()
                print("LINEARLY_RELATED_PRIMES=SUCCESS")
                return
            # Use Python ints for fast iteration
            n_int = int(n)
            k_int = int(k)
            found = False
            for delta in range(-100000, 100001):
                disc = delta * delta + 4 * k_int * n_int
                # Valid squares mod 16: only 0, 1, 4, 9
                last_nibble = disc & 15
                if last_nibble not in (0, 1, 4, 9):
                    continue
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
  frontendCheck: (vals, onProgress) => {
    if (!vals.n || !vals.k) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const k = BigInt(vals.k);
      const fourKN = 4n * k * n;
      for (let delta = -100000n; delta <= 100000n; delta++) {
        const disc = delta * delta + fourKN;
        const discNybble = Number(disc & 15n);
        if (discNybble !== 0 && discNybble !== 1 && discNybble !== 4 && discNybble !== 9) continue;
        if (onProgress && delta % 10000n === 0n) {
          onProgress(Number((delta + 100000n) * 100n / 200001n));
        }
        const sqrt_disc = isqrt(disc);
        if (sqrt_disc * sqrt_disc !== disc) continue;
        const num = -delta + sqrt_disc;
        if (num > 0n && num % (2n * k) === 0n) {
          const p = num / (2n * k);
          if (p > 1n && n % p === 0n) {
            const q = n / p;
            onProgress?.(100);
            return Promise.resolve(`Factor found!\np = ${p}\nq = ${q}\nk = ${k}\ndelta = ${delta}\nLINEARLY_RELATED_PRIMES=SUCCESS`);
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If $q = kp + \\delta$ for known $k$ and small $|\\delta| < 10^5$, solve $kp^2 + \\delta p - n = 0$ to recover $p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$ and $q = kp + \\delta$
\\item $k$ known, $\\delta$ unknown but small ($|\\delta| < 10^5$)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p(kp + \\delta) = kp^2 + \\delta p \\\\
kp^2 + \\delta p - n &= 0 \\\\
p &= \\frac{-\\delta + \\sqrt{\\delta^2 + 4kn}}{2k} \\\\
\\text{For each } \\delta \\in [-B, B]:\\quad &\\text{check if } \\delta^2 + 4kn \\text{ is a perfect square} \\\\
\\text{If so, } p &\\mid n \\implies \\text{factorization found} \\qed
\\end{align*}

\\textbf{Explanation:} Substituting $q = kp + \\delta$ into $n = pq$ gives a quadratic in $p$. The discriminant $\\Delta = \\delta^2 + 4kn$ must be a perfect square for integer $p$. The attack iterates $\\delta$ over $[-10^5, 10^5]$, which covers the typical range for CTF challenges and poorly generated primes. Setting $k = 1$ gives the classic twin-prime case ($p$ and $q$ close together).

\\textbf{References:} A. Nitaj, "Cryptanalysis of RSA with Constrained Primes", 1999`,
  usageGuide: 'This attack factors n when the two primes are linearly related: q = k*p + δ for known k.\n\nHow to use:\n1. You know that n = p*q where q = k*p + δ for some known multiplier k and small unknown δ\n2. Provide n and k\n3. The attack solves the quadratic equation k*p^2 + δ*p - n = 0 to recover p\n\nTip: This is common in CTF challenges or badly generated keys. Setting k=1 gives the classic twin-prime case (p = q + δ). For p = a*q + b form, try inverting the relationship.',
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
