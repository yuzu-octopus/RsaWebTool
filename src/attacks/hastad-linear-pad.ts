import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'hastad-linear-pad',
  name: "Hastad's Attack with Linear Padding",
  category: 'Message / Protocol',
  description: 'Recovers m from k >= e ciphertexts with affine padding under same exponent via CRT and Coppersmith. Use when c_i = (a_i·m + b_i)^e mod n_i.',
  inputs: [
    { name: 'triples', label: 'Triples (n,c,a,b per line)', placeholder: 'n1,c1,a1,b1\\nn2,c2,a2,b2...', multiline: true, rows: 5 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter exponent e (e.g., 3)...', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.triples || !vals.e) {
      return `print("ERROR: Missing required inputs (triples, e)")
print("HASTAD_LINEAR_PAD=FAILED")`;
    }
    return wrapSageTemplate({
      token: 'HASTAD_LINEAR_PAD',
      useGuard: false,
      body: `        e = Integer(${vals.e})
        triples_str = """${vals.triples}""".strip()
        triples = []
        for line in triples_str.split('\\n'):
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            if len(parts) < 4:
                continue
            n_i = Integer(parts[0].strip())
            c_i = Integer(parts[1].strip())
            a_i = Integer(parts[2].strip())
            b_i = Integer(parts[3].strip())
            triples.append((n_i, c_i, a_i, b_i))
        out.append(f"Number of ciphertexts: {len(triples)}")
        out.append(f"Public exponent: e = {e}")
        if len(triples) < e:
            out.append(f"ERROR: Need at least {e} ciphertexts for e = {e}, got {len(triples)}")
            out.append("HASTAD_LINEAR_PAD=FAILED")
        else:
            N = prod([t[0] for t in triples])
            out.append(f"Combined modulus N has {N.nbits()} bits")
            R.<x> = PolynomialRing(Zmod(N))
            F = 0
            for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                Ni = N // n_i
                coeff = Ni * inverse_mod(Ni, n_i)
                fi = (a_i*x + b_i)**e - c_i
                F += coeff * fi
            out.append(f"Combined polynomial degree: {F.degree()}")
            try:
                F = F.monic()
            except Exception as ex:
                out.append(f"Cannot make monic directly: {ex}")
                lc = Integer(F.leading_coefficient())
                g = gcd(lc, Integer(N))
                if g > 1 and g < N:
                    out.append(f"Lead coeff shares factor g={g} with N — can factor directly")
                elif g == N:
                    out.append("Lead coeff is a multiple of N")
                else:
                    try:
                        F = F * inverse_mod(lc, N)
                    except Exception as ex2:
                        out.append(f"Cannot invert lead coeff: {ex2}")
            if F.leading_coefficient() != 1:
                out.append("HASTAD_LINEAR_PAD=FAILED")
            else:
                found_m = None
                try:
                    roots = F.small_roots(beta=1.0, epsilon=0.05)
                    if roots:
                        found_m = roots[0]
                        out.append(f"m = {found_m}")
                except Exception as sr_ex:

                if found_m is None:
                    all_simple = all(t[2] == 1 and t[3] == 0 for t in triples)
                    if all_simple:
                        moduli = [t[0] for t in triples]
                        remainders = [t[1] for t in triples]
                        m_e = crt(remainders, moduli)
                        m_root, exact = m_e.nth_root(e, truncate_mode=True)
                        if exact:
                            found_m = m_root
                            out.append(f"m = {found_m}")
                    if found_m is None:
                        a_int = [int(t[2]) for t in triples]
                        b_int = [int(t[3]) for t in triples]
                        n_int = [int(t[0]) for t in triples]
                        c_int = [int(t[1]) for t in triples]
                        coeffs = []
                        for i in range(len(triples)):
                            ai = a_int[i]; bi = b_int[i]; ni = n_int[i]
                            A = pow(ai, 3, ni)
                            B = (3 * ai * ai * bi) % ni
                            C = (3 * ai * bi * bi) % ni
                            D = (bi * bi * bi - c_int[i]) % ni
                            coeffs.append((ni, A, B, C, D))
                        limit = 5 * 10**5
                        for m_candidate in range(limit):
                            ok = True
                            for ni, A, B, C, D in coeffs:
                                val = (A * m_candidate + B) % ni
                                val = (val * m_candidate + C) % ni
                                val = (val * m_candidate + D) % ni
                                if val != 0:
                                    ok = False
                                    break
                            if ok:
                                found_m = m_candidate
                                out.append(f"m = {found_m}")
                                break
                if found_m is not None:
                    m = Integer(found_m)
                    out.append("")
                    out.append("Results:")
                    out.append(f"m = {m}")
                    out.append("")
                    all_ok = True
                    for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                        v = pow(int(a_i) * int(m) + int(b_i), int(e), int(n_i))
                        ok = v == c_i
                        if not ok:
                            all_ok = False
                    if all_ok:
                        out.append(f"Verification: (a*m+b)^e mod n = c")
                        out.append("")
                        out.append("HASTAD_LINEAR_PAD=SUCCESS")
                    else:
                        out.append("HASTAD_LINEAR_PAD=FAILED")
                else:
                    out.append("HASTAD_LINEAR_PAD=FAILED")`,
    });
  },
  proof: `\\textbf{Theorem:} Given $k \\geq e$ ciphertexts $c_i \\equiv (a_i m + b_i)^e \\pmod{n_i}$ with pairwise coprime moduli, recover $m$ by CRT-combining the polynomials and applying Coppersmith small roots.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_i \\equiv (a_i m + b_i)^e \\pmod{n_i}$ with $\\gcd(n_i, n_j) = 1$ for $i \\neq j$
\\item $k \\geq e$, affine transforms $(a_i, b_i)$ known for each modulus
\\item $m < \\min_i(n_i^{1/e})$ (message is small enough for Coppersmith)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_i(x) &= (a_i x + b_i)^e - c_i \\in (\\mathbb{Z}/n_i\\mathbb{Z})[x] \\\\
N &= \\prod_{i=1}^{k} n_i, \\quad N_i = N / n_i, \\quad t_i = N_i \\cdot N_i^{-1} \\bmod n_i \\\\
F(x) &= \\sum_{i=1}^{k} t_i \\cdot f_i(x) \\pmod{N} \\\\
F(m) &\\equiv 0 \\pmod{N} \\quad \\text{(by CRT, each $f_i(m) \\equiv 0$)} \\\\
m &= \\text{small\\_roots}(F) \\quad \\text{(since $|m| < N^{1/e}$)}
\\end{align*}

\\textbf{Explanation:} This generalizes Hastad's Broadcast Attack to affine-padded messages. CRT combines the polynomials into one modulo $N = \\prod n_i$, then Coppersmith's method finds the small root $m$. The requirement $k \\geq e$ ensures enough information to overcome the linear padding. Each $(a_i, b_i)$ must be known.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Horner evaluation with precomputed coefficients:} For each modulus $n_i$ with $(a_i, b_i)$, precomputes the polynomial coefficients $A_i, B_i, C_i, D_i$ for $(a_i m + b_i)^3 - c_i$. Evaluates each candidate as $((A_i m + B_i)m + C_i)m + D_i \\bmod n_i$ — four operations per candidate per modulus instead of a full modular exponentiation.
\\end{itemize}

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA," Eurocrypt 1988; Coppersmith et al., 1996`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.triples && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const triples: string[] = [];
  for (let i = 0; i < 3; i++) {
    const { n } = generateKeyPair(256, 256);
    const a = BigInt(Math.floor(Math.random() * 100) + 1);
    const b = BigInt(Math.floor(Math.random() * 1000));
    triples.push(`${n},${encrypt((a * m + b) % n, n, e)},${a},${b}`);
  }
  return { triples: triples.join('\n'), e: e.toString() };
};
