import type { Attack } from '../types';
import { isqrt } from '../utils/bigint';
import { randomPrime, isPrimeMR } from '../utils/testcases/core';
import { sageGuardBlock } from './guard';

export const attack: Attack = {
  id: 'close-prime',
  name: 'Close-Prime',
  category: 'Factorization',
  description: 'Factors n when p and q are close via Fermat iteration and Londahl BSGS fallback. Use when primes are suspected close together.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            import math
            n_int = int(n)
            ${sageGuardBlock("CLOSE_PRIME", '            ')}
            # Step 1: Fermat factorization (fast for close primes)
            print(f"Close-prime attack on n ({n.nbits()} bits): trying Fermat first...")
            a, rem = n.sqrtrem()
            b2 = -rem
            c = 2*a + 1
            max_iter = 100000
            iterations = 0
            while not b2.is_square():
                iterations += 1
                if iterations > max_iter:
                    break
                b2 += c
                c += 2
            if b2.is_square():
                a_final = (c - 1) // 2
                b = isqrt(b2)
                p = a_final - b
                q = a_final + b
                if p > 1 and q < n and p*q == n:
                    print(f"Fermat factorization succeeded!")
                    print(f"Verification: p * q = {p * q}")
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print(f"|p - q| = {q - p}")
                    print(f"Iterations: {iterations}")
                    print()
                    print("CLOSE_PRIME=SUCCESS")
                    return
            # Step 2: Londahl BSGS fallback (for larger prime gaps)
            print(f"Fermat did not converge in {max_iter} iterations, trying Londahl BSGS...")
            b = 50000
            phi_approx = n_int - 2*math.isqrt(n_int) + 1
            print(f"Building baby-step table (b={b})...")
            look_up = {}
            z = 1
            parity = int(phi_approx & 1)
            for j in range(b + 1):
                if (j & 1) == parity:
                    look_up[z] = j
                z = (z * 2) % n_int
            print(f"Searching ({b + 1} giant steps)...")
            mu = int(inverse_mod(power_mod(2, Integer(phi_approx), n), n))
            step = int(power_mod(2, b, n))
            found = False
            for i in range(b + 1):
                if mu in look_up:
                    j = look_up[mu]
                    phi = phi_approx + j - i*b
                    m = n_int - phi + 1
                    disc = m*m - 4*n_int
                    if disc > 0:
                        sqrt_disc = math.isqrt(disc)
                        if sqrt_disc*sqrt_disc == disc:
                            p_candidate = (m - sqrt_disc) // 2
                            q_candidate = (m + sqrt_disc) // 2
                            if p_candidate * q_candidate == n_int and p_candidate > 1 and q_candidate > 1:
                                print(f"Londahl BSGS factor found!")
                                print(f"Verification: p * q = {p_candidate * q_candidate}")
                                print(f"p = {p_candidate}")
                                print(f"q = {q_candidate}")
                                print(f"|p - q| = {abs(q_candidate - p_candidate)}")
                                print(f"Baby steps: {b+1}, Giant steps: {i+1}")
                                found = True
                                break
                mu = (mu * step) % n_int
            if found:
                print()
                print("CLOSE_PRIME=SUCCESS")
            else:
                print("Both Fermat and Londahl BSGS failed to factor n.")
                print("CLOSE_PRIME=FAILED")
        except Exception as e:
            print(f"Error: {e}")
            print("CLOSE_PRIME=FAILED")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("CLOSE_PRIME=FAILED")
_attack()`,
  frontendCheck: (vals, onProgress) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n % 2n === 0n) return Promise.resolve(`Factor found!\np = 2\nq = ${n / 2n}\nCLOSE_PRIME=SUCCESS`);
      // Incremental Fermat: b2 = a^2 - n, updated as b2 += 2*a + 1 each step
      // This avoids repeated a*a - n (a BigInt multiplication)
      let a = isqrt(n);
      if (a * a < n) a++;
      const initialA = a;
      let b2 = a * a - n;
      const limit = a + 1000000n;
      while (a < limit) {
        if (onProgress && a % 50000n === 0n) {
          onProgress(Number((a - initialA) * 100n / (limit - initialA)));
        }
        // Mod-16 perfect square pre-filter: valid squares end in 0,1,4,9 hex
        const lastNybble = Number(b2 & 15n);
        if (lastNybble === 0 || lastNybble === 1 || lastNybble === 4 || lastNybble === 9) {
          const b = isqrt(b2);
          if (b * b === b2) {
            const p = a - b;
            const q = a + b;
            if (p > 1n && q > 1n && p * q === n) {
              onProgress?.(100);
              return Promise.resolve(`Factor found!\np = ${p}\nq = ${q}\niterations = ${a - initialA}\nCLOSE_PRIME=SUCCESS`);
            }
          }
        }
        // Increment a and b2: (a+1)^2 - n = a^2 - n + 2a + 1 = b2 + 2a + 1
        b2 += 2n * a + 1n;
        a++;
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} Factor $n = pq$ when $|p-q|$ is small via Fermat's difference-of-squares iteration, extended by Londahl's BSGS to larger gaps.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$ with $p \\approx q$
\\item Let $a = \\frac{p+q}{2}$, $b = \\frac{p-q}{2}$, so $n = a^2 - b^2$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
a &= \\lceil\\sqrt{n}\\rceil,\\; b = \\sqrt{a^2 - n} \\\\
\\text{Fermat: } a_{i+1} &= a_i + 1,\\; b_i^2 = a_i^2 - n \\\\
a_i^2 - n \\text{ is square} &\\implies p = a_i - b_i,\\; q = a_i + b_i \\\\
\\text{BSGS: } \\phi_{\\text{approx}} &= n - 2\\lfloor\\sqrt{n}\\rfloor + 1 \\\\
2^{\\delta} &\\equiv 2^{-\\phi_{\\text{approx}}} \\pmod{n},\\; \\delta = \\phi(n) - \\phi_{\\text{approx}} \\\\
\\phi(n) &= \\phi_{\\text{approx}} + j - i \\cdot b,\\; p+q = n - \\phi(n) + 1
\\end{align*}

\\textbf{Explanation:} Fermat represents $n$ as $a^2 - b^2$ and searches for $a$ such that $a^2 - n$ is a perfect square. Each step increments $a$ by 1 and updates $b^2$ additively, avoiding multiplication. When $|p-q| < 10^6$, Fermat converges quickly. Londahl's BSGS recovers $\\phi(n)$ via a discrete-log collision for larger gaps.

\\textbf{References:} Fermat (1643); C. L\\"ondahl, "Finding Close-Prime Factorizations", 2017 (https://grocid.net/2017/09/16/finding-close-prime-factorizations/)`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Use 512-bit close primes — Fermat converges in < 5000 iterations
  // for |p - q| < 10000, regardless of absolute bit size
  const p = randomPrime(512);
  const delta = Math.floor(Math.random() * 250000) * 2 + 2;
  let q = p + BigInt(delta);
  while (!isPrimeMR(q)) q += 2n;
  return { n: (p * q).toString() };
};
