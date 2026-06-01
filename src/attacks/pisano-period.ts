import type { Attack } from '../types';
import { modPow, gcd, isqrt } from '../utils/bigint';
import { randomPrime } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

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
  description: 'Factors n via birthday collision on 2^x mod n using multiplicative period search. Use for small moduli under 64 bits.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'PISANO_PERIOD',
    n: vals.n,
    useGuard: true,
    body: `        out.append("Pisano Period Factorization")
        out.append(f"n = {n}")
        out.append("")
        limit = 200000
        lookup = {}
        found = False
        n_int = int(n)
        pow_val = 1  # 2^0 mod n
        for i in range(limit):
            pow_val = (pow_val * 2) % n_int  # recurrence instead of pow(2, i, n)
            val = (pow_val - 1) % n_int
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
                                out.append("Results:")
                                out.append(f"p = {p_factor}")
                                out.append(f"q = {q_factor}")
                                out.append("")
                                out.append(f"Verification: p * q = {p_factor * q_factor}")
                                out.append(f"Period length: {i}")
                                out.append("")
                                out.append("PISANO_PERIOD=SUCCESS")
                                found = True
                                break
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
                                    out.append("Results:")
                                    out.append(f"p = {p_factor}")
                                    out.append(f"q = {q_factor}")
                                    out.append("")
                                    out.append(f"Verification: p * q = {p_factor * q_factor}")
                                    out.append(f"Period length: {period}")
                                    out.append("")
                                    out.append("PISANO_PERIOD=SUCCESS")
                                    found = True
                                    break
                if found:
                    break
            lookup[val] = i
        if not found:
            out.append("Results:")
            out.append("")
            out.append("PISANO_PERIOD=FAILED")
`,
  }),
  frontendCheck: (vals, onProgress) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n % 2n === 0n) {
        return Promise.resolve(`Pisano Period Factorization\nn = ${n}\n\nResults:\np = 2\nq = ${n / 2n}\n\nVerification: p * q = ${n}\n\nPISANO_PERIOD=SUCCESS`);
      }
      const seen = new Map<bigint, bigint>();
      let pow_val = 1n;
      const limit = 200000n;
      for (let i = 0n; i < limit; i++) {
        if (onProgress && i % 10000n === 0n) {
          const pct = Number(i * 100n / limit);
          onProgress(pct, `i = ${i.toString()} / ${limit.toString()}`);
        }
        const val = pow_val === 0n ? n - 1n : pow_val - 1n;
        if (val === 0n && i > 0n) {
          const s = n - i + 1n;
          const disc = s * s - 4n * n;
          if (disc >= 0n) {
            const t = isqrt(disc);
            if (t * t === disc) {
              const p = (s - t) / 2n;
              const q = (s + t) / 2n;
              if (p > 1n && q > 1n && p * q === n) {
                onProgress?.(100);
                return Promise.resolve(`Pisano Period Factorization\nn = ${n}\n\nResults:\np = ${p}\nq = ${q}\n\nVerification: p * q = ${p * q}\nPeriod length: ${i}\n\nPISANO_PERIOD=SUCCESS`);
              }
            }
          }
        }
        if (seen.has(val)) {
          const prev_i = seen.get(val)!;
          const period = i - prev_i;
          for (let mult = 1n; mult < 200n; mult++) {
            const phi_guess = period * mult;
            if (phi_guess >= n) break;
            if (phi_guess % 2n !== 0n) continue;
            const s = n - phi_guess + 1n;
            const disc = s * s - 4n * n;
            if (disc < 0n) continue;
            const t = isqrt(disc);
            if (t * t === disc) {
              const p = (s - t) / 2n;
              const q = (s + t) / 2n;
              if (p > 1n && q > 1n && p * q === n) {
                onProgress?.(100);
                return Promise.resolve(`Pisano Period Factorization\nn = ${n}\n\nResults:\np = ${p}\nq = ${q}\n\nVerification: p * q = ${p * q}\nPeriod length: ${period}\n\nPISANO_PERIOD=SUCCESS`);
              }
            }
          }
        }
        seen.set(val, i);
        pow_val = (pow_val * 2n) % n;
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} Factor $n = pq$ via birthday collision on the sequence $f(i) = 2^i - 1 \\pmod{n}$, revealing $\\lambda(n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item Let $f(x) = 2^x - 1 \\pmod{n}$ for $x = 0, 1, 2, \\ldots$
\\item Birthday paradox: collision $f(i) = f(j)$ expected in $O(\\sqrt{\\operatorname{ord}_n(2)})$ steps
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(i) = f(j) &\\implies 2^i \\equiv 2^j \\pmod{n} \\\\
&\\implies 2^{|j-i|} \\equiv 1 \\pmod{n} \\\\
|j-i| &\\text{ is a multiple of } \\operatorname{ord}_n(2) \\mid \\lambda(n) \\\\
\\phi &= k \\cdot |j-i| \\text{ as candidate for } \\phi(n) \\\\
p,q &= \\frac{n - \\phi + 1 \\pm \\sqrt{(n - \\phi + 1)^2 - 4n}}{2} \\qed
\\end{align*}

\\textbf{Explanation:} The Pisano period attack tracks $2^i \\bmod n$ via recurrence ($v_{i+1} = 2 \\cdot v_i \\bmod n$). When a value repeats, the index difference is a multiple of the multiplicative order of 2 modulo $n$, which divides $\\lambda(n)$. Each candidate $\\phi$ is tested by checking whether the quadratic discriminant is a perfect square.

\\textbf{References:} Wuliangshun, "Integer Factorization With Pisano Period", IEEE Access, 2019`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  for (let attempt = 0; attempt < 10000; attempt++) {
    const p = randomPrime(10);
    const q = randomPrime(10);
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
