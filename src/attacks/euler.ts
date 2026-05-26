import type { Attack } from '../types';
import { isqrt, gcd } from '../utils/bigint';
import { randomPrime } from '../utils/testcases/core';

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
            n = Integer(${vals.n})
            print(f"Euler Factorization on n = {n}")
            print()
            import math
            n_int = int(n)
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("EULER=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"Verification: 2 * {n // 2} = {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print()
                print("EULER=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("No factorization possible")
                print("EULER=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"Verification: p * q = {p * p}")
                print(f"p = {p}")
                print(f"q = {p}")
                print()
                print("EULER=SUCCESS")
                return
            end = math.isqrt(n_int)
            solutions = []
            a = 0
            max_iter = 5000000
            while a < end and len(solutions) < 2:
                if a > max_iter:
                    print(f"Euler factorization failed: exceeded {max_iter} iterations")
                    print("EULER=FAILED")
                    return
                rem = n_int - a*a
                if rem >= 0:
                    b = math.isqrt(rem)
                    if b*b == rem:
                        distinct = True
                        for sol in solutions:
                            if sol[0] == b and sol[1] == a:
                                distinct = False
                                break
                        if distinct:
                            solutions.append([b, a])
                a += 1
            if len(solutions) < 2:
                print(f"Euler factorization failed: could not find two distinct sum-of-squares representations")
                print("n may not have both primes ≡ 1 (mod 4)")
                print("EULER=FAILED")
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
                print(f"Found trivial factorization: {p} x {q} = {n}")
                print("No non-trivial factors found via Euler")
                print("EULER=FAILED")
            else:
                if p * q != n:
                    q = n // p
                print(f"Verification: p * q = {p * q}")
                print(f"p is prime: {p.is_prime()}")
                print(f"q is prime: {q.is_prime()}")
                print(f"p = {p}")
                print(f"q = {q}")
                print()
                print("EULER=SUCCESS")
        except Exception as e:
            print(f"ERROR: {e}")
            print("EULER=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("EULER=FAILED")
_attack()`,
  frontendCheck: (vals) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n < 2n) return Promise.resolve(null);
      if (n % 2n === 0n) return Promise.resolve(`n is even: ${n}\np = 2\nq = ${n / 2n}\nEULER=SUCCESS`);
      const end = isqrt(n);
      const solutions: bigint[][] = [];
      const maxIter = 5000000n;
      for (let a = 0n; a < end && solutions.length < 2; a++) {
        if (a > maxIter) return Promise.resolve(null);
        const rem = n - a * a;
        if (rem >= 0n) {
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
      return Promise.resolve(`Factor found!\nVerification: p * q = ${p * q}\np = ${p}\nq = ${q}\nEULER=SUCCESS`);
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

\\textbf{References:} Euler, 1749`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  function prime1mod4(bits: number): bigint {
    while (true) {
      const p = randomPrime(bits);
      if (p % 4n === 1n) return p;
    }
  }
  const nBits = 20;
  const p = prime1mod4(nBits);
  const q = prime1mod4(nBits);
  return { n: (p * q).toString() };
};
