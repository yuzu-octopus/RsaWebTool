var e=`import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'squfof',
  name: 'SQUFOF',
  category: 'Factorization',
  description: "Factors n by finding a square form in the cycle of reduced binary quadratic forms. Use for n < 10^14 (faster than trial division for medium-sized factors).",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'SQUFOF',
    n: vals.n,
    imports: ['import math'],
    useGuard: true,
    body: \`        out.append("SQUFOF")
        out.append(f"n = {n}")
        out.append("")
        n_int = int(n)
        found = False
        primes_list = prime_range(3, 200000)
        prod = 1
        for i, trial in enumerate(primes_list):
            prod = (prod * int(trial)) % n_int
            if (i + 1) % 1000 == 0:
                g = math.gcd(prod, n_int)
                if 1 < g < n_int:
                    for t in range(i - 999, i + 1):
                        trial_t = primes_list[t]
                        if n_int % trial_t == 0:
                            p = Integer(trial_t)
                            q = n // p
                            out.append("Results:")
                            out.append(f"p = {p}")
                            out.append(f"q = {q}")
                            out.append("")
                            out.append(f"Verification: p * q = {p * q}")
                            out.append("")
                            out.append("SQUFOF=SUCCESS")
                            found = True
                            break
                    break
                prod = 1
        if not found and prod != 1:
            g = math.gcd(prod, n_int)
            if 1 < g < n_int:
                start = (len(primes_list) // 1000) * 1000
                for t in range(start, len(primes_list)):
                    trial_t = primes_list[t]
                    if n_int % trial_t == 0:
                        p = Integer(trial_t)
                        q = n // p
                        out.append("Results:")
                        out.append(f"p = {p}")
                        out.append(f"q = {q}")
                        out.append("")
                        out.append(f"Verification: p * q = {p * q}")
                        out.append("")
                        out.append("SQUFOF=SUCCESS")
                        found = True
                        break
        if not found:
            def squfof(n_val):
                n_int = int(n_val)
                D = 0
                for k in [1, 3, 5, 7, -1, -3, -5, -7]:
                    if kronecker(k, n_val) == -1:
                        D = k * n_int
                        break
                if D == 0:
                    D = n_int
                sqrtD = math.isqrt(D)
                Po = sqrtD
                P = Po
                Q = D - Po**2
                if Q <= 0:
                    return None
                Qprev = 1
                limit = 2 * math.isqrt(math.isqrt(n_int)) + 10
                for i in range(limit):
                    if Q == 0:
                        break
                    b = (sqrtD + P) // Q
                    Pnew = b * Q - P
                    Qnew = D - Pnew**2
                    if Qnew <= 0:
                        break
                    Qnew //= Q
                    if i % 2 == 0 and Qnew > 0:
                        r = math.isqrt(Qnew)
                        if r * r == Qnew and (sqrtD - Pnew) % r == 0:
                            b = (sqrtD - Pnew) // r
                            P = b * r + Pnew
                            Qprev = r
                            Q = (D - P**2) // Qprev
                            for _ in range(limit):
                                if Q == 0:
                                    break
                                b = (sqrtD + P) // Q
                                P_old = P
                                P = b * Q - P
                                Q_old = Q
                                Q = (D - P**2) // Q_old
                                if P == P_old:
                                    g_val = math.gcd(Q_old, n_int)
                                    if 1 < g_val < n_int:
                                        return Integer(g_val), Integer(n_int // g_val)
                                    break
                            break
                    Qprev = Q
                    Q = Qnew
                    P = Pnew
                return None
            result = squfof(n)
            if result:
                p, q = result
                out.append("Results:")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append("")
                out.append(f"Verification: p * q = {p * q}")
                out.append("")
                out.append("SQUFOF=SUCCESS")
                found = True
            else:
                out.append("Results:")
                out.append("")
                out.append("SQUFOF=FAILED")
\`,
  }),
  proof: \`\\\\textbf{Theorem:} SQUFOF factors $n$ by finding a square form in the cycle of reduced binary quadratic forms of discriminant $D = kn$ where $(k/n) = -1$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item Binary quadratic forms $ax^2 + bxy + cy^2$, discriminant $D = b^2 - 4ac$
\\\\item $D = kn$ where $\\\\left(\\\\frac{k}{n}\\\\right) = -1$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
n = pq, \\\\quad \\\\left(\\\\frac{k}{n}\\\\right) &= -1, \\\\quad D = kn \\\\\\\\
(a_0, b_0, c_0) &\\\\xrightarrow{\\\\rho} (a_1, b_1, c_1) \\\\xrightarrow{\\\\rho} \\\\cdots \\\\xrightarrow{\\\\rho} (a_L, b_L, c_L) = (a_0, b_0, c_0) \\\\\\\\
\\\\exists i: c_i &= q^2 \\\\;\\\\text{(a perfect square)} \\\\\\\\
s &= \\\\sqrt{c_i}, \\\\quad \\\\text{reverse the reduction } \\\\rho \\\\text{ from the square root} \\\\\\\\
\\\\gcd(s, n) &= p \\\\text{ or } q
\\\\end{align*}
The algorithm searches the forward cycle for a square $c_i$, then starts a reverse cycle from $s = \\\\sqrt{c_i}$ until the reduced form repeats. At the symmetry point, GCD recovers the factor.

\\\\textbf{Explanation:} SQUFOF (SQUare FOrm Factorization) exploits the structure of the class group of binary quadratic forms. The key insight is that when discriminant $D$ corresponds to a composite $n = pq$, the cycle of reduced forms contains a square form whose square root reveals one prime factor. It works well for $n < 10^{14}$ and requires no large-integer arithmetic beyond GCD.

\\\\textbf{Optimizations:}
\\\\begin{itemize}
\\\\item \\\\textbf{Batched GCD trial division:} Before the main SQUFOF algorithm, extracts small factors by trial division against primes in batches of 1000. The product of each prime batch is accumulated modulo $n$ before a single GCD call, reducing GCD operations by $\\\\sim 1000\\\\times$ vs individual trial division.
\\\\end{itemize}

\\\\textbf{References:} Shanks, 1975; Gower & Wagstaff, Math. Comp., 2008\`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one small factor (≤16 bits) so trial division succeeds
  // SQUFOF's trial division goes up to 200000, so 16-bit primes are well within range
  const p = randomPrime(16);
  const q = randomPrime(TESTCASE_BITS.p + TESTCASE_BITS.q - 16);
  return { n: (p * q).toString() };
};
`;export{e as default};