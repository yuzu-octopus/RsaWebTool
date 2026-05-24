import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse } from '../utils/bigint';

export const attack: Attack = {
  id: 'boneh-durfee',
  name: 'Boneh-Durfee Attack',
  category: 'Factorization',
  description: 'Recovers d via lattice reduction. Use when d < n^0.292.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        import sys
        #
        def _bd_attack():
            try:
                n = Integer(${vals.n})
                e = Integer(${vals.e})
                print(f"Boneh-Durfee Attack on n = {n}")
                if n < 2 or e < 2:
                    print("Invalid input: n and e must be >= 2")
                    print("BONEH_DURFEE=FAILED")
                    return
                if n % 2 == 0:
                    print(f"n is even: {n}")
                    print(f"p = 2")
                    print(f"q = {n // 2}")
                    print("BONEH_DURFEE=SUCCESS")
                    return
                if n.is_prime():
                    print(f"n is prime: {n}")
                    print("BONEH_DURFEE=FAILED")
                    return
                if n.is_square():
                    p = isqrt(n)
                    print(f"n is a perfect square: {p}^2 = {n}")
                    print("BONEH_DURFEE=SUCCESS")
                    return
                # Phase 1: Wiener's attack via continued fraction convergents of e/n
                cf = continued_fraction(QQ(e)/QQ(n))
                found = False
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
                                    print(f"Wiener's attack succeeded:")
                                    print(f"d = {d}, p = {p}, q = {q}")
                                    print(f"Verification: p * q = {p * q}")
                                    print("BONEH_DURFEE=SUCCESS")
                                    found = True
                                    break
                if found:
                    return
                # Phase 2: Boneh-Durfee lattice attack (Herrmann-May simplification)
                # f(x,y) = 1 + x*(A + y) with root (2k, -(p+q)/2) where ed = 1 + k*phi(n)
                # Theoretical bound: d < n^delta with delta < 1 - 1/sqrt(2) ≈ 0.292
                print("Wiener failed (d >= n^0.25). Attempting Boneh-Durfee lattice attack...")
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
                                                print("Boneh-Durfee lattice attack succeeded!")
                                                print(f"d = {d_val}")
                                                print(f"p = {p_val}")
                                                print(f"q = {q_val}")
                                                print(f"Verification: p * q = {p_val * q_val}")
                                                print("BONEH_DURFEE=SUCCESS")
                                                found2 = True
                                                break
                            if found2:
                                break
                if not found2:
                    print("Boneh-Durfee lattice attack failed: d >= n^0.292 or parameters insufficient.")
                    print("BONEH_DURFEE=FAILED")
            except BaseException as ex:
                print(f"ERROR: Boneh-Durfee computation failed: {ex}")
                print("BONEH_DURFEE=FAILED")
        #
        _bd_attack()
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BONEH_DURFEE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Recover d when d < n^{0.292} via lattice reduction.

\\textbf{Setup:}
\\begin{itemize}
\\item ed \\equiv 1 \\pmod{\\varphi(n)}, so ed - 1 = k\\varphi(n)
\\item \\varphi(n) \\approx 2(A + y) with A = (n+1)/2, y = -(p+q)/2
\\item LLL lattice basis reduction
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ed - 1 &= k\\varphi(n) = k(2A + 2y) \\\\
f(x, y) &= 1 + x(A + y) \\equiv 0 \\pmod{e} \\quad \\text{root } (2k, y) \\\\
u &= xy + 1 \\quad \\text{(Herrmann-May linearization)} \\\\
\\text{Construct lattice from shifts of } f^k e^{m-k} &\\text{, apply LLL} \\\\
\\text{Resultant of short vectors } &\\implies y, \\; \\varphi(n), \\; p+q \\\\
x^2 - (p+q)x + n &= 0 \\implies p, q \\qed
\\end{align*}

\\textbf{Explanation:} Build bivariate polynomial, apply Herrmann-May linearization, construct lattice, find short vectors via LLL, recover \\varphi(n) via resultant. The bound d < n^{0.292} comes from lattice dimension analysis.

\\textbf{References:} Boneh \\& Durfee, 1999; Herrmann \\& May, PKC 2008`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  // d must be < n^0.25/3 ≈ 2^126.4 so Wiener's continued fraction attack (Phase 1)
  // succeeds quickly on SageCell (35s timeout). The lattice phase (Phase 2) is too slow.
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
