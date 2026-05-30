import type { Attack } from '../types';
import { isqrt, gcd } from '../utils/bigint';
import { randomPrime } from '../utils/testcases/core';
import { sageGuardBlock } from './guard';

export const attack: Attack = {
  id: 'euler',
  name: 'Euler Factorization',
  category: 'Factorization',
  description: "Factors n by finding two distinct representations as a sum of squares a^2+b^2 = c^2+d^2 = n. Use when both primes are ≡ 1 (mod 4).",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            out = []
            n = Integer(${vals.n})
            import math
            n_int = int(n)
            ${sageGuardBlock("EULER", '            ')}
            out.append(f"Euler Factorization on n = {n}")
            out.append("")
            end = math.isqrt(n_int)
            solutions = []
            a = 0
            a_sq = 0
            max_iter = 20000000
            while a < end and len(solutions) < 2:
                if a > max_iter:
                    out.append(f"Euler factorization failed: exceeded {max_iter} iterations")
                    out.append("EULER=FAILED")
                    print("\\n".join(out))
                    return
                rem = n_int - a_sq
                b = math.isqrt(rem)
                if b*b == rem:
                    distinct = True
                    for sol in solutions:
                        if sol[0] == b and sol[1] == a:
                            distinct = False
                            break
                    if distinct:
                        solutions.append([b, a])
                a_sq += 2*a + 1
                a += 1
            if len(solutions) < 2:
                out.append(f"Euler factorization failed: could not find two distinct sum-of-squares representations")
                out.append("n may not have both primes ≡ 1 (mod 4)")
                out.append("EULER=FAILED")
                print("\\n".join(out))
                return
            s0 = solutions[0]
            s1 = solutions[1]
            k = gcd(s0[0] - s1[0], s1[1] - s0[1])**2
            h = gcd(s0[0] + s1[0], s1[1] + s0[1])**2
            m = gcd(s0[0] + s1[0], s1[1] - s0[1])**2
            lev = gcd(s0[0] - s1[0], s1[1] + s0[1])**2
            p = gcd(k + h, n)
            q = gcd(lev + m, n)
            if p <= 1 or q >= n:
                out.append(f"Found trivial factorization: {p} x {q} = {n}")
                out.append("No non-trivial factors found via Euler")
                out.append("EULER=FAILED")
            else:
                if p * q != n:
                    q = n // p
                out.append(f"Verification: p * q = {p * q}")
                out.append(f"p is prime: {p.is_prime()}")
                out.append(f"q is prime: {q.is_prime()}")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append("")
                out.append("EULER=SUCCESS")
            print("\\n".join(out))
        except Exception as e:
            try:
                out.append(f"ERROR: {e}")
                out.append("EULER=FAILED")
                print("\\n".join(out))
            except:
                print(f"ERROR: {e}")
                print("EULER=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("EULER=FAILED")
_attack()`,
  frontendCheck: (vals, onProgress) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n < 2n) return Promise.resolve(null);
      if (n % 2n === 0n) return Promise.resolve(`n is even: ${n}\np = 2\nq = ${n / 2n}\nEULER=SUCCESS`);
      const end = isqrt(n);
      const solutions: bigint[][] = [];
      const maxIter = 20000000n;
      let a2 = 0n; // tracks a^2 via recurrence: (a+1)^2 = a^2 + 2a + 1
      for (let a = 0n; a < end && solutions.length < 2; a++) {
        if (onProgress && a % 100000n === 0n) {
          const pct = a > maxIter ? 100 : Number(a * 100n / (end < maxIter ? end : maxIter));
          const denominator = end < maxIter ? end : maxIter;
          onProgress(pct, `a = ${a.toString()} / ${denominator.toString()}`);
        }
        if (a > maxIter) {
          onProgress?.(100);
          return Promise.resolve(null);
        }
        const rem = n - a2;
        a2 += 2n * a + 1n; // update for next iteration: (a+1)^2
        // Mod-16 perfect square pre-filter (~80% rejection)
        const lastNybble = Number(rem & 15n);
        if (lastNybble === 0 || lastNybble === 1 || lastNybble === 4 || lastNybble === 9) {
          const b = isqrt(rem);
          if (b * b === rem) {
            let distinct = true;
            for (const sol of solutions) {
              if (sol[0] === b && sol[1] === a) {
                distinct = false;
                break;
              }
            }
            if (distinct) solutions.push([b, a]);
          }
        }
      }
      if (solutions.length < 2) return Promise.resolve(null);
      const [s0, s1] = [solutions[0], solutions[1]];
      const k = gcd(s0[0] - s1[0], s1[1] - s0[1]) ** 2n;
      const h = gcd(s0[0] + s1[0], s1[1] + s0[1]) ** 2n;
      const m_ = gcd(s0[0] + s1[0], s1[1] - s0[1]) ** 2n;
      const lev = gcd(s0[0] - s1[0], s1[1] + s0[1]) ** 2n;
      const p = gcd(k + h, n);
      let q = gcd(lev + m_, n);
      if (p <= 1n || q >= n) return Promise.resolve(null);
      if (p * q !== n) q = n / p;
      onProgress?.(100);
      return Promise.resolve(`Factor found!\nVerification: p * q = ${p * q}\np = ${p}\nq = ${q}\nn = ${s0[0]}^2 + ${s0[1]}^2 = ${s1[0]}^2 + ${s1[1]}^2\nEULER=SUCCESS`);
    } catch {
      return Promise.resolve(null);
    }
  },
  proof: `\\textbf{Theorem:} Factor $n = pq$ using two distinct representations as a sum of squares. Requires $p \\equiv q \\equiv 1 \\pmod{4}$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, with $p \\equiv q \\equiv 1 \\pmod{4}$
\\item $n = a^2 + b^2 = c^2 + d^2$ (two distinct representations)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
(a - c)(a + c) &= (d - b)(d + b) \\\\
k &= \\gcd(a - c, d - b)^2,\\; h = \\gcd(a + c, d + b)^2 \\\\
m &= \\gcd(a + c, d - b)^2,\\; \\ell = \\gcd(a - c, d + b)^2 \\\\
p &= \\gcd(k + h, n),\\; q = \\gcd(\\ell + m, n)
\\end{align*}
From the identity $(a-c)(a+c) = (d-b)(d+b)$, the GCD combinations recover the prime factors.

\\textbf{Explanation:} A theorem of Euler states that any prime $p \\equiv 1 \\pmod{4}$ has a unique representation as a sum of two squares (up to order and sign). A composite $n = pq$ where both primes are $\\equiv 1 \\pmod{4}$ therefore has two distinct representations, and these can be algebraically combined to recover $p$ and $q$. The method searches for the representations by iterating $a$ from $0$ to $\\sqrt{n}$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Square recurrence:} Tracks $a^2$ incrementally via $(a+1)^2 = a^2 + 2a + 1$, replacing a full BigInt multiplication with addition each iteration — critical for the up to $20 \\times 10^6$ steps required.
\\item \\textbf{Mod-16 perfect square pre-filter:} Checks $n - a^2 \\equiv 0, 1, 4, 9 \\pmod{16}$ before computing $\\sqrt{n - a^2}$, rejecting $\\sim 80\\%$ of candidates without an isqrt call.
\\end{itemize}

\\textbf{References:} Euler, 1749`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  function prime1mod4(bits: number = 22): bigint {
    while (true) {
      const p = randomPrime(bits);
      if (p % 4n === 1n) return p;
    }
  }
  const nBits = 22;
  const p = prime1mod4(nBits);
  const q = prime1mod4(nBits);
  return { n: (p * q).toString() };
};
