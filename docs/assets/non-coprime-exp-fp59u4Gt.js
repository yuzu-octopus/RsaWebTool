var e=`import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS, encrypt } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'non-coprime-exp',
  name: 'Non-Coprime Exponent Attack',
  category: 'Message / Protocol',
  description: 'Resolves multiple plaintexts when gcd(e, phi(n)) > 1 using known p and q factors. Use after factoring n, when public exponent shares a factor with phi(n).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'p', label: 'p (prime factor)', placeholder: 'Enter prime factor p...', multiline: true, rows: 3, required: true, tooltip: 'Required. Known prime factor of n.' },
    { name: 'q', label: 'q (prime factor)', placeholder: 'Enter prime factor q...', multiline: true, rows: 3, required: true, tooltip: 'Required. Known prime factor of n.' },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c) {
      return \`print("ERROR: Missing required inputs (n, e, c)")
print("NON_COPRIME_EXP=FAILED")\`;
    }
    if (!vals.p || !vals.q) {
      return \`print("ERROR: This attack requires p and q to resolve multiple e-th roots. Use factorization attacks first to find p and q.")
print("NON_COPRIME_EXP=FAILED")\`;
    }
    return wrapSageTemplate({
      token: 'NON_COPRIME_EXP',
      useGuard: false,
      body: \`        n = Integer(\${vals.n})
        e = Integer(\${vals.e})
        c = Integer(\${vals.c})
        p = Integer(\${vals.p})
        q = Integer(\${vals.q})
        out.append("Non-Coprime Exponent Attack")
        out.append(f"n = {n}")
        out.append(f"e = {e}")
        out.append(f"c = {c}")
        out.append(f"p = {p}")
        out.append(f"q = {q}")
        out.append("")
        out.append("Results:")
        phi = (p - 1) * (q - 1)
        g = gcd(e, phi)
        if g == 1:
            d = inverse_mod(e, phi)
            m = power_mod(c, d, n)
            out.append(f"m = {m}")
            v = power_mod(m, e, n)
            if v == c:
                out.append("")
                out.append("NON_COPRIME_EXP=SUCCESS")
            else:
                out.append("")
                out.append("NON_COPRIME_EXP=FAILED")
        else:
            gp = gcd(e, p - 1)
            roots_p = []
            if gp == 1:
                dp = inverse_mod(e, p - 1)
                mp = power_mod(c, dp, p)
                roots_p = [mp]
            else:
                Fp = GF(p)
                cp = Fp(c)
                try:
                    roots_p = cp.nth_root(e, all=True)
                except (NotImplementedError, TypeError, AttributeError):
                    roots_p = []
                    if e <= 10 and p < 2000000:
                        for x in range(p):
                            if power_mod(x, e, p) == cp:
                                roots_p.append(Fp(x))
                if not roots_p:
                    if e == 2 and p % 4 == 3:
                        r = cp ** ((p + 1) // 4)
                        if r**2 == cp:
                            roots_p = [r, -r]
            gq = gcd(e, q - 1)
            roots_q = []
            if gq == 1:
                dq = inverse_mod(e, q - 1)
                mq = power_mod(c, dq, q)
                roots_q = [mq]
            else:
                Fq = GF(q)
                cq = Fq(c)
                try:
                    roots_q = cq.nth_root(e, all=True)
                except (NotImplementedError, TypeError, AttributeError):
                    roots_q = []
                    if e <= 10 and q < 2000000:
                        for x in range(q):
                            if power_mod(x, e, q) == cq:
                                roots_q.append(Fq(x))
                if not roots_q:
                    if e == 2 and q % 4 == 3:
                        r = cq ** ((q + 1) // 4)
                        if r**2 == cq:
                            roots_q = [r, -r]
            found_valid = False
            for rp in roots_p:
                for rq in roots_q:
                    m = crt([Integer(rp), Integer(rq)], [p, q])
                    out.append(f"m = {m}")
                    v = power_mod(m, e, n)
                    ok = v == c
                    if ok:
                        found_valid = True
            if found_valid:
                out.append("")
                out.append("NON_COPRIME_EXP=SUCCESS")
            else:
                out.append("")
                out.append("NON_COPRIME_EXP=FAILED")\`,
    });
  },
  proof: \`\\\\textbf{Theorem:} When $\\\\gcd(e, \\\\varphi(n)) > 1$, the ciphertext $c = m^e \\\\bmod n$ has multiple preimages. All are recovered by finding e-th roots modulo $p$ and $q$ separately, then CRT-combining.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $n = pq$, $e$ shares a factor with $\\\\varphi(n) = (p-1)(q-1)$
\\\\item $g_p = \\\\gcd(e, p-1) > 1$ or $g_q = \\\\gcd(e, q-1) > 1$ (or both)
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
g_p &= \\\\gcd(e, p-1), \\\\quad g_q = \\\\gcd(e, q-1) \\\\\\\\
R_p &= \\\\{r \\\\in \\\\mathbb{F}_p : r^e \\\\equiv c \\\\pmod{p}\\\\}, \\\\quad |R_p| = g_p \\\\\\\\
R_q &= \\\\{r \\\\in \\\\mathbb{F}_q : r^e \\\\equiv c \\\\pmod{q}\\\\}, \\\\quad |R_q| = g_q \\\\\\\\
m_{i,j} &= \\\\text{CRT}(r_{p,i}, r_{q,j}; p, q) \\\\quad \\\\text{for each pair} \\\\\\\\
\\\\#\\\\text{valid plaintexts} &= g_p \\\\cdot g_q
\\\\end{align*}

\\\\textbf{Explanation:} RSA requires $\\\\gcd(e, \\\\varphi(n)) = 1$ for a unique decryption exponent $d$. When this fails, the encryption map $m \\\\mapsto m^e \\\\bmod n$ is many-to-one: multiple plaintexts produce the same ciphertext. The attack finds all e-th roots in $\\\\mathbb{F}_p$ and $\\\\mathbb{F}_q$ using finite field algebra, then combines them via CRT. Each combination is a valid preimage of $c$.

\\\\textbf{Optimizations:}
\\\\begin{itemize}
\\\\item \\\\textbf{Three-level e-th root fallback:} Tries progressively slower methods: (1) Sage's $\\\\mathbb{F}_p.\\\\mathtt{nth\\\\_root}(e, all=True)$ for a complete root set, (2) manual iteration for small $e \\\\leq 10$ and small fields $p < 2 \\\\times 10^6$, (3) Tonelli-Shanks for $e = 2$ with $p \\\\equiv 3 \\\\pmod{4}$. CRT combines all cross-product root pairs from both primes.
\\\\end{itemize}

\\\\textbf{References:} Williams, 1980; May, "Attacks on RSA with Small Parameters," 2003\`,
  priority: 'low',
  applicableCheck: (vals: Record<string, string>) => !!vals.n && !!vals.e && !!vals.c,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const e = 2n;
  return { n: n.toString(), e: e.toString(), c: encrypt(m, n, e).toString(), p: p.toString(), q: q.toString() };
};
`;export{e as default};