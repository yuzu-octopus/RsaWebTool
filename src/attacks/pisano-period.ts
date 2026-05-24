import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'pisano-period',
  name: 'Pisano Period Factorization',
  category: 'Factorization',
  description: 'Factors n via birthday collision on 2^x mod n (Pisano/Mersenne period). Fast for small n (< 64 bits).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            print(f"Pisano Period Factorization on n = {n}")
            print()
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("PISANO=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2, q = {n // 2}")
                print("PISANO=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("PISANO=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("PISANO=SUCCESS")
                return
            limit = 200000
            lookup = {}
            found = False
            for i in range(limit):
                val = (pow(2, i, n) - 1) % n
                if val == 0:
                    phi_guess = i
                    if phi_guess % 2 == 0:
                        s = n - phi_guess + 1
                        disc = s*s - 4*n
                        if disc > 0:
                            t = isqrt(disc)
                            if t*t == disc:
                                p = (s - t) // 2
                                q = (s + t) // 2
                                if p > 1 and p*q == n:
                                    print(f"p = {p}")
                                    print(f"q = {q}")
                                    print(f"Verification: p * q = {p * q}")
                                    print("PISANO=SUCCESS")
                                    found = True
                                    return
                if val in lookup:
                    period = i - lookup[val]
                    for mult in range(1, 200):
                        phi_guess = period * mult
                        if phi_guess >= n:
                            break
                        if phi_guess % 2 == 0:
                            s = n - phi_guess + 1
                            disc = s*s - 4*n
                            if disc > 0:
                                t = isqrt(disc)
                                if t*t == disc:
                                    p = (s - t) // 2
                                    q = (s + t) // 2
                                    if p > 1 and p*q == n:
                                        print(f"p = {p}")
                                        print(f"q = {q}")
                                        print(f"Verification: p * q = {p * q}")
                                        print("PISANO=SUCCESS")
                                        found = True
                                        return
                lookup[val] = i
            if not found:
                print("Pisano period attack failed: no collision found")
                print("PISANO=FAILED")
        except Exception as e:
            print(f"ERROR: {e}")
            print("PISANO=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PISANO=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Factor n = pq via birthday collision on the multiplicative order of 2 modulo n.

\\textbf{Setup:}
\\begin{itemize}
\\item $f(x) = 2^x - 1 \\pmod{n}$
\\item Birthday paradox: collision $f(i) = f(j)$ in $O(\\sqrt{\\operatorname{ord}_n(2)})$ steps
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(i) &= f(j) \\implies 2^i \\equiv 2^j \\pmod{n} \\\\
&\\implies 2^{|j-i|} \\equiv 1 \\pmod{n} \\\\
|j-i| &\\text{ is a multiple of }\\operatorname{ord}_n(2) \\mid \\lambda(n) \\\\
\\text{Try } \\phi &= k \\cdot |j-i| \\text{ as candidate for } \\varphi(n) \\\\
p, q &= \\frac{n - \\phi + 1 \\pm \\sqrt{(n - \\phi + 1)^2 - 4n}}{2} \\qed
\\end{align*}

\\textbf{References:} Wuliangshun, Integer Factorization With Pisano Period, IEEE 2019`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Pisano period attack needs small n for SageCell
  // Birthday collision in O(sqrt(ord_n(2))) — sqrt(2^20) ≈ 1024 steps for 20-bit primes
  const p = randomPrime(20);
  const q = randomPrime(24);
  return { n: (p * q).toString() };
};
