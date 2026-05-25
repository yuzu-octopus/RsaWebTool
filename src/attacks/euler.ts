import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'euler',
  name: 'Euler Factorization',
  category: 'Factorization',
  description: 'Factors n via two distinct sum-of-squares representations. Requires p ≡ q ≡ 1 (mod 4).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            print(f"Euler Factorization on n = {n}")
            print()
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
            end = isqrt(n)
            solutions = []
            a = 0
            max_iter = 10**6
            while a < end and len(solutions) < 2:
                if a > max_iter:
                    print(f"Euler factorization failed: exceeded {max_iter} iterations")
                    print("EULER=FAILED")
                    return
                rem = n - a*a
                if rem >= 0 and rem.is_square():
                    b = isqrt(rem)
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
  proof: `\\textbf{Theorem:} Factor n = pq using two distinct representations as a sum of squares. Requires p, q \\equiv 1 \\pmod{4}.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, $p \\equiv q \\equiv 1 \\pmod{4}$
\\item $n = a^2 + b^2 = c^2 + d^2$ (two representations)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
(a - c)(a + c) &= (d - b)(d + b) \\equiv 0 \\pmod{p \\text{ or } q} \\\\
k &= \\gcd(a - c, d - b)^2,\\; h = \\gcd(a + c, d + b)^2 \\\\
m &= \\gcd(a + c, d - b)^2,\\; \\ell = \\gcd(a - c, d + b)^2 \\\\
p &= \\gcd(k + h, n),\\; q = \\gcd(\\ell + m, n) \\qed
\\end{align*}

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
  const nBits = 18;
  const p = prime1mod4(nBits);
  const q = prime1mod4(nBits);
  return { n: (p * q).toString() };
};
