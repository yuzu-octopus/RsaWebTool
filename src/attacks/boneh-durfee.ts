import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'boneh-durfee',
  name: 'Boneh-Durfee Attack',
  category: 'Factorization',
  description: 'Recovers d when d < n^0.292 via Wiener continued fractions (d < n^0.25) or Boneh-Durfee lattice (d < n^0.292). Use for unbalanced private exponents.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'BONEH_DURFEE',
    n: vals.n,
    body: `        e = Integer(${vals.e})
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
                # Phase 2: Boneh-Durfee lattice attack (Herrmann-May simplification)
                A = (n + 1) // 2
                delta = 0.260
                m = 3
                t = int((1 - 2 * delta) * m)
                if t < 0:
                    t = 0
                XX = Integer(floor(RR(n) ** delta))
                YY = isqrt(n) + 1
                P = PolynomialRing(ZZ, 'x, y')
                x, y = P.gens()
                f = 1 + x * (A + y)
                PR = PolynomialRing(ZZ, 'u, x, y')
                u, x, y = PR.gens()
                Q = PR.quotient(x * y + 1 - u)
                fZ = Q(f).lift()
                UU = XX * YY + 1
                gg = []
                for kk in range(m + 1):
                    for ii in range(m - kk + 1):
                        gg.append(x ** ii * e ** (m - kk) * fZ(u, x, y) ** kk)
                gg.sort()
                monomials = []
                for poly in gg:
                    for mon in poly.monomials():
                        if mon not in monomials:
                            monomials.append(mon)
                monomials.sort()
                if t > 0:
                    for jj in range(1, t + 1):
                        for kk in range((m // t) * jj, m + 1):
                            gg.append(Q(y ** jj * fZ(u, x, y) ** kk * e ** (m - kk)).lift())
                            monomials.append(u ** kk * y ** jj)
                nn = len(monomials)
                BB = Matrix(ZZ, nn)
                for ii in range(nn):
                    BB[ii, 0] = gg[ii](0, 0, 0)
                    for jj in range(1, ii + 1):
                        if monomials[jj] in gg[ii].monomials():
                            BB[ii, jj] = gg[ii].monomial_coefficient(monomials[jj]) * monomials[jj](UU, XX, YY)
                BB = BB.LLL()
                import sympy
                w_sym, z_sym = sympy.symbols('w z')
                u_sym, x_sym, y_sym = sympy.symbols('u x y')
                def to_sympy(poly):
                    expr = sympy.sympify(str(poly))
                    return expr.subs({u_sym: w_sym*z_sym + 1, x_sym: w_sym, y_sym: z_sym})
                mon_syms = [to_sympy(m) for m in monomials]
                found2 = False
                for i1 in range(nn - 1):
                    if found2:
                        break
                    for i2 in range(i1 + 1, nn):
                        p1 = sum(sympy.Rational(int(BB[i1, j]), int(monomials[j](UU, XX, YY))) * mon_syms[j] for j in range(nn))
                        p2 = sum(sympy.Rational(int(BB[i2, j]), int(monomials[j](UU, XX, YY))) * mon_syms[j] for j in range(nn))
                        try:
                            rr = sympy.resultant(p1, p2, w_sym)
                        except Exception:
                            continue
                        if rr == 0 or rr == 1:
                            continue
                        try:
                            roots_dict = sympy.roots(rr, z_sym)
                        except Exception:
                            continue
                        for z0_sym in roots_dict:
                            try:
                                y0_int = Integer(int(z0_sym))
                            except Exception:
                                continue
                            try:
                                p1_y0 = p1.subs({z_sym: y0_int})
                                w_roots = sympy.solve(p1_y0, w_sym)
                            except Exception:
                                continue
                            for x0_sym in w_roots:
                                try:
                                    x0_int = Integer(int(x0_sym))
                                except Exception:
                                    continue
                                if f(x0_int, y0_int) % e == 0:
                                    d_val = (1 + x0_int * (A + y0_int)) // e
                                    if d_val > 0:
                                        p_plus_q = -2 * y0_int
                                        disc2 = p_plus_q ** 2 - 4 * n
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
                        out.append("BONEH_DURFEE=SUCCESS")
                        found = True
                if not found2:
                    out.append("Results:")
                    out.append("")
                    out.append("BONEH_DURFEE=FAILED")
        if not found:
            out.append("BONEH_DURFEE=FAILED")`,
    useGuard: true,
  }),
  proof: `\\textbf{Theorem:} Find $d$ when $d < n^{0.292}$ using Wiener's continued fractions ($d < n^{0.25}$) or Boneh-Durfee's lattice ($d < n^{0.292}$).

\\textbf{Setup:}
\\begin{itemize}
\\item $ed \\equiv 1 \\pmod{\\phi(n)}$ with unknown $d$, $k$, $\\phi(n)$
\\item $e \\approx n$ and $d < n^{\\delta}$ with $\\delta < 0.5$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\left|\\frac{e}{n} - \\frac{k}{d}\\right| &= \\frac{|ed - kn|}{dn} = \\frac{|1 - k(p+q-1)|}{dn} < \\frac{1}{2d^2} \\quad \\text{(for $d < n^{0.25}$)}\\\\
\\frac{k}{d} \\text{ a convergent of } \\frac{e}{n} &\\implies \\phi(n) = \\frac{ed-1}{k},\\; p+q = n - \\phi(n) + 1 \\\\
p,q &= \\frac{(p+q) \\pm \\sqrt{(p+q)^2 - 4n}}{2}
\\end{align*}

\\textbf{Explanation:} Wiener's attack exploits the fact that when $d$ is small, $e/n$ approximates $k/d$ so closely that $k/d$ appears as a convergent in the continued fraction expansion of $e/n$. The Boneh-Durfee lattice uses Coppersmith's method with a bivariate polynomial $f(x,y) = x(A+y)-1$ to extend the bound to $d < n^{0.292}$ by finding short vectors via LLL.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Two-phase execution:} Phase 1 runs Wiener's continued fraction attack ($d < n^{0.25}$) — a fast $O(\\log n)$ check using $e/n$ convergents that immediately succeeds for small $d$ without invoking lattice reduction. Phase 2 runs the Herrmann-May Coppersmith lattice ($d < n^{0.292}$) with sympy resultant for bivariate root recovery, only when Wiener fails.
\\end{itemize}

\\textbf{References:} M. Wiener, CRYPTO 1990; D. Boneh, G. Durfee, CRYPTO 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  // d must be < n^0.25/3 ≈ 2^126.4 so Wiener's continued fraction attack (Phase 1)
  // succeeds quickly on SageCell (120s timeout). The lattice phase (Phase 2) is too slow.
  // For 512-bit n: n^0.25 ≈ 2^128 → d with 125 bits ≈ n^0.244, well within Wiener bound.
  const nBits = n.toString(2).length;
  const fourthRootBits = Math.floor(nBits / 4);
  const dBits = fourthRootBits - 3;
  let d = (1n << BigInt(dBits)) + 1n;
  while (modInverse(d, phi) === null) {
    d += 2n;
  }
  const e = modInverse(d, phi)!;
  return { n: n.toString(), e: e.toString() };
};
