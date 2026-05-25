import type { Attack } from '../types';
import { modPow, gcd } from '../utils/bigint';
import { randomPrime } from '../utils/testcases/core';

function multiplicativeOrder2(p: bigint): bigint {
  const trialPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n];
  const pm1 = p - 1n;
  let m = pm1;
  const factors: bigint[] = [];
  for (const q of trialPrimes) {
    while (m % q === 0n) {
      factors.push(q);
      m /= q;
    }
    if (m === 1n) break;
  }
  if (m > 1n) {
    let f = trialPrimes[trialPrimes.length - 1] + 2n;
    while (f * f <= m) {
      while (m % f === 0n) {
        factors.push(f);
        m /= f;
      }
      f += 2n;
    }
    if (m > 1n) {
      factors.push(m);
    }
  }
  let ord = pm1;
  for (const f of factors) {
    while (ord % f === 0n && modPow(2n, ord / f, p) === 1n) {
      ord /= f;
    }
  }
  return ord;
}

function lcm(a: bigint, b: bigint): bigint {
  return a / gcd(a, b) * b;
}

export const attack: Attack = {
  id: 'pisano-period',
  name: 'Pisano Period Factorization',
  category: 'Factorization',
  description: 'Factors n via birthday collision on 2^x mod n (Pisano/Mersenne period). Fast for small n (< 64 bits).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    out = []
    try:
        try:
            n = Integer(${vals.n})
            out.append("Pisano Period Factorization on n = " + str(n))
            out.append("")
            if n < 2:
                out.append("n = " + str(n) + " is too small to factor")
                out.append("PISANO=FAILED")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append("n is even: " + str(n))
                out.append("Verification: p * q = " + str(2 * (n // 2)))
                out.append("p = 2")
                out.append("q = " + str(n // 2))
                out.append("")
                out.append("PISANO=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append("n is prime: " + str(n))
                out.append("PISANO=FAILED")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append("n is a perfect square: " + str(p) + "^2 = " + str(n))
                out.append("Verification: p * q = " + str(p * p))
                out.append("p = " + str(p))
                out.append("q = " + str(p))
                out.append("")
                out.append("PISANO=SUCCESS")
                print("\\n".join(out))
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
                                p_factor = (s - t) // 2
                                q_factor = (s + t) // 2
                                if p_factor > 1 and p_factor * q_factor == n:
                                    out.append("Verification: p * q = " + str(p_factor * q_factor))
                                    out.append("p = " + str(p_factor))
                                    out.append("q = " + str(q_factor))
                                    out.append("")
                                    out.append("PISANO=SUCCESS")
                                    found = True
                                    print("\\n".join(out))
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
                                    p_factor = (s - t) // 2
                                    q_factor = (s + t) // 2
                                    if p_factor > 1 and p_factor * q_factor == n:
                                        out.append("Verification: p * q = " + str(p_factor * q_factor))
                                        out.append("p = " + str(p_factor))
                                        out.append("q = " + str(q_factor))
                                        out.append("")
                                        out.append("PISANO=SUCCESS")
                                        found = True
                                        print("\\n".join(out))
                                        return
                lookup[val] = i
            if not found:
                out.append("Pisano period attack failed: no collision found")
                out.append("PISANO=FAILED")
        except Exception as e:
            out.append("ERROR: " + str(e))
            out.append("PISANO=FAILED")
        #
    except BaseException as ex:
        out.append("ERROR: " + str(ex))
        out.append("PISANO=FAILED")
    print("\\n".join(out))
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
  for (let attempt = 0; attempt < 10000; attempt++) {
    const p = randomPrime(8);
    const q = randomPrime(8);
    const ord_p = multiplicativeOrder2(p);
    const ord_q = multiplicativeOrder2(q);
    const ord_n = lcm(ord_p, ord_q);
    const phi = (p - 1n) * (q - 1n);
    const ratio = Number(phi / ord_n);
    if (ord_n <= 200000n && ratio <= 199) {
      return { n: (p * q).toString() };
    }
  }
  return { n: (131n * 251n).toString() };
};
