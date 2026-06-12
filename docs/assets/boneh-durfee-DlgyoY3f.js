var e=`import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { generateWienerTestcase } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'boneh-durfee',
  name: 'Boneh-Durfee Attack',
  category: 'Factorization',
  description: 'Recovers d when d < n^0.260 via Wiener continued fractions (d < n^0.25) or Boneh-Durfee lattice (d < n^0.260). Use for unbalanced private exponents.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'BONEH_DURFEE',
    n: vals.n,
    body: \`        e = Integer(\${vals.e})
        found = False
        if e < 2:
            out.append("Boneh-Durfee Attack")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append("")
            out.append("Results:")
            out.append("")
            out.append("BONEH_DURFEE=FAILED")
        else:
            out.append("Boneh-Durfee Attack")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append("")
            # Phase 1: Wiener's attack via continued fraction convergents of e/n
            cf = continued_fraction(QQ(e)/QQ(n))
            for conv in cf.convergents():
                k, d = conv.numerator(), conv.denominator()
                if k == 0:
                    continue
                if (e * d - 1) % k == 0:
                    phi = (e * d - 1) // k
                    s = n - phi + 1
                    disc = s ** 2 - 4 * n
                    if disc > 0 and disc.is_square():
                        t = isqrt(disc)
                        if (s + t) % 2 == 0:
                            p = (s - t) // 2
                            q = (s + t) // 2
                            if p * q == n and p > 1:
                                out.append("Results:")
                                out.append(f"p = {p}")
                                out.append(f"q = {q}")
                                out.append("")
                                out.append(f"Verification: p * q = {p * q}")
                                out.append(f"d = {d}")
                                out.append("")
                                out.append("BONEH_DURFEE=SUCCESS")
                                found = True
                                break
            if not found:
                # Phase 2: Boneh-Durfee lattice attack with auto-escalation
                A = (n + 1) // 2
                delta = 0.260
                escalation = [(3, 1), (4, 1), (4, 2), (5, 2), (6, 2), (7, 3), (8, 3)]
                P = PolynomialRing(ZZ, 'x, y')
                x, y = P.gens()
                f = 1 + x * (A + y)
                PR = PolynomialRing(ZZ, 'u, x, y')
                u, x, y = PR.gens()
                Q = PR.quotient(x * y + 1 - u)
                fZ = Q(f).lift()
                for m_val, t_val in escalation:
                    if found:
                        break
                    out.append(f"BONEH_DURFEE: trying m={m_val}, t={t_val}...")
                    YY = isqrt(n) + 1
                    XX = Integer(floor(RR(2 * n^delta)))
                    UU = XX * YY + 1
                    # Build x-shifts
                    gg = []
                    for kk in range(m_val + 1):
                        for ii in range(m_val - kk + 1):
                            gg.append(x**ii * e**(m_val - kk) * fZ(u, x, y)**kk)
                    monomials = list(dict.fromkeys(m for g in gg for m in g.monomials()))
                    monomials.sort()
                    if t_val > 0:
                        for jj in range(1, t_val + 1):
                            start_k = (m_val // t_val) * jj
                            for kk in range(start_k, m_val + 1):
                                shifted = Q(y**jj * fZ(u, x, y)**kk * e**(m_val - kk)).lift()
                                gg.append(shifted)
                                for m_sh in shifted.monomials():
                                    if m_sh not in monomials:
                                        monomials.append(m_sh)
                        monomials.sort()
                    nn = len(monomials)
                    if nn == 0:
                        continue
                    BB = Matrix(ZZ, nn)
                    for ii in range(nn):
                        BB[ii, 0] = gg[ii](0, 0, 0)
                        for jj in range(1, ii + 1):
                            if monomials[jj] in gg[ii].monomials():
                                BB[ii, jj] = gg[ii].monomial_coefficient(monomials[jj]) * monomials[jj](UU, XX, YY)
                    # Singular check + determinant bound
                    if BB.det() == 0:
                        continue
                    if BB.det() >= e**(m_val * nn):
                        continue
                    try:
                        BB = BB.LLL()
                    except Exception:
                        continue
                    # Use Sage's native polynomial resultant
                    S = PolynomialRing(QQ, 'w, z')
                    w_var, z_var = S.gens()
                    def mon_to_sage(mon):
                        exp_vec = mon.exponents()[0]
                        a, b, c = exp_vec
                        return (w_var*z_var + 1)**a * w_var**b * z_var**c
                    mon_sage = [mon_to_sage(m) for m in monomials]
                    found2 = False
                    for i1 in range(nn - 1):
                        if found2:
                            break
                        for i2 in range(i1 + 1, nn):
                            p1 = sum(QQ(BB[i1, j]) / QQ(monomials[j](UU, XX, YY)) * mon_sage[j] for j in range(nn))
                            p2 = sum(QQ(BB[i2, j]) / QQ(monomials[j](UU, XX, YY)) * mon_sage[j] for j in range(nn))
                            try:
                                rr = p1.resultant(p2, w_var)
                            except Exception:
                                continue
                            if rr == 0 or rr == 1:
                                continue
                            try:
                                z_roots = rr.roots(ring=ZZ)
                            except Exception:
                                continue
                            for z_root, _ in z_roots:
                                y0_int = z_root
                                try:
                                    p1_at_z = p1.subs({z_var: QQ(z_root)})
                                    Rw = PolynomialRing(QQ, 'ww')
                                    w_root_var = Rw.gen()
                                    p1_w_uni = sum(c * w_root_var**e[0] for (e, c) in p1_at_z.dict().items())
                                    w_roots = p1_w_uni.roots(ring=ZZ)
                                except Exception:
                                    continue
                                for w_root, _ in w_roots:
                                    x0_int = w_root
                                    if f(x0_int, y0_int) % e == 0:
                                        d_val = (1 + x0_int * (A + y0_int)) // e
                                        if d_val > 0:
                                            p_plus_q = -2 * y0_int
                                            disc2 = p_plus_q**2 - 4 * n
                                            if disc2 > 0 and disc2.is_square():
                                                sqrt_disc2 = isqrt(disc2)
                                                p_val = ZZ((p_plus_q + sqrt_disc2) // 2)
                                                q_val = ZZ((p_plus_q - sqrt_disc2) // 2)
                                                if p_val * q_val == n and p_val > 1:
                                                    out.append("Results:")
                                                    out.append(f"p = {p_val}")
                                                    out.append(f"q = {q_val}")
                                                    out.append("")
                                                    out.append(f"Verification: p * q = {p_val * q_val}")
                                                    out.append(f"d = {d_val}")
                                                    out.append("")
                                                    found2 = True
                                                    break
                                    if found2:
                                        break
                            if found2:
                                break
                    if found2:
                        out.append("BONEH_DURFEE=SUCCESS")
                        found = True
                        break
        if not found:
            out.append("BONEH_DURFEE=FAILED")\`,
    useGuard: true,
  }),
  proof: \`\\\\textbf{Theorem:} Find $d$ when $d < n^{0.260}$ using Wiener's continued fractions ($d < n^{0.25}$) or Boneh-Durfee's lattice ($d < n^{0.260}$).

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $ed \\\\equiv 1 \\\\pmod{\\\\phi(n)}$ with unknown $d$, $k$, $\\\\phi(n)$
\\\\item $e \\\\approx n$ and $d < n^{\\\\delta}$ with $\\\\delta < 0.5$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\left|\\\\frac{e}{n} - \\\\frac{k}{d}\\\\right| &= \\\\frac{|ed - kn|}{dn} = \\\\frac{|1 - k(p+q-1)|}{dn} < \\\\frac{1}{2d^2} \\\\quad \\\\text{(for $d < n^{0.25}$)}\\\\\\\\
\\\\frac{k}{d} \\\\text{ a convergent of } \\\\frac{e}{n} &\\\\implies \\\\phi(n) = \\\\frac{ed-1}{k},\\\\; p+q = n - \\\\phi(n) + 1 \\\\\\\\
p,q &= \\\\frac{(p+q) \\\\pm \\\\sqrt{(p+q)^2 - 4n}}{2}
\\\\end{align*}

\\\\textbf{Explanation:} Wiener's attack exploits the fact that when $d$ is small, $e/n$ approximates $k/d$ so closely that $k/d$ appears as a convergent in the continued fraction expansion of $e/n$. The Boneh-Durfee lattice uses Coppersmith's method with a bivariate polynomial $f(x,y) = x(A+y)-1$ to extend the bound to $d < n^{0.260}$ by finding short vectors via LLL.

\\\\textbf{Optimizations:}
\\\\begin{itemize}
\\\\item \\\\textbf{Two-phase execution:} Phase 1 runs Wiener's continued fraction attack ($d < n^{0.25}$) — a fast $O(\\\\log n)$ check using $e/n$ convergents that immediately succeeds for small $d$ without invoking lattice reduction. Phase 2 runs the Herrmann-May Coppersmith lattice ($d < n^{0.260}$) with Sage native resultant for bivariate root recovery, only when Wiener fails.
\\\\end{itemize}

\\\\textbf{References:} M. Wiener, CRYPTO 1990; D. Boneh, G. Durfee, CRYPTO 1999\`,
  priority: 'high',
  applicableCheck: rsaNeeds.nE,
};

export const generateTestcase = (): Record<string, string> => {
  const kp = generateWienerTestcase();
  return { n: kp.n.toString(), e: kp.e.toString() };
};
`;export{e as default};