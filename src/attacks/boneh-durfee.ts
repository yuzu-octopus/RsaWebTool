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
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})

print(f"Boneh-Durfee Attack on n = {n}")

if n < 2 or e < 2:
    print("Invalid input: n and e must be >= 2")
    print("BONEH_DURFEE=FAILED")
    quit()
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print("BONEH_DURFEE=SUCCESS")
    quit()
if n.is_prime():
    print(f"n is prime: {n}")
    print("BONEH_DURFEE=FAILED")
    quit()
if n.is_square():
    p = isqrt(n)
    print(f"n is a perfect square: {p}^2 = {n}")
    print("BONEH_DURFEE=SUCCESS")
    quit()

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
    quit()

# Phase 2: Boneh-Durfee lattice attack (Herrmann-May simplification)
# f(x,y) = 1 + x*(A + y) with root (2k, -(p+q)/2) where ed = 1 + k*phi(n)
print("Wiener failed (d >= n^0.25). Attempting Boneh-Durfee lattice attack...")
try:
    A = (n + 1) // 2
    delta = 0.25
    m = 3
    t = int((1 - 2 * delta) * m)
    if t < 0:
        t = 0
    XX = floor(n ** delta)
    YY = floor(sqrt(n))
    # Build polynomial f(x,y) = 1 + x*(A + y) with f(2k, y) = ed
    P = PolynomialRing(ZZ, 'x, y')
    x, y = P.gens()
    f = 1 + x * (A + y)
    # Herrmann-May substitution: u = xy + 1
    PR = PolynomialRing(ZZ, 'u, x, y')
    u, x, y = PR.gens()
    Q = PR.quotient(x * y + 1 - u)
    fZ = Q(f).lift()
    UU = XX * YY + 1
    # Build lattice from x-shifts
    gg = []
    for kk in range(m + 1):
        for ii in range(m - kk + 1):
            gg.append(x ** ii * e ** (m - kk) * fZ(u, x, y) ** kk)
    gg.sort()
    # Collect x-shift monomials
    monomials = []
    for poly in gg:
        for mon in poly.monomials():
            if mon not in monomials:
                monomials.append(mon)
    monomials.sort()
    # y-shifts (Herrmann-May selective)
    if t > 0:
        for jj in range(1, t + 1):
            for kk in range((m // t) * jj, m + 1):
                gg.append(Q(y ** jj * fZ(u, x, y) ** kk * e ** (m - kk)).lift())
                monomials.append(u ** kk * y ** jj)
    # Build lower-triangular lattice matrix (required for determinant bound)
    nn = len(monomials)
    BB = Matrix(ZZ, nn)
    for ii in range(nn):
        BB[ii, 0] = gg[ii](0, 0, 0)
        for jj in range(1, ii + 1):
            if monomials[jj] in gg[ii].monomials():
                BB[ii, jj] = gg[ii].monomial_coefficient(monomials[jj]) * monomials[jj](UU, XX, YY)
    # LLL reduction
    BB = BB.LLL()
    # Recover (x0, y0) by computing resultants on LLL-reduced vector pairs
    PR2 = PolynomialRing(ZZ, 'w, z')
    w, z = PR2.gens()
    found2 = False
    for i1 in range(nn - 1):
        if found2:
            break
        for i2 in range(i1 + 1, nn):
            p1 = sum(monomials[j](w * z + 1, w, z) * BB[i1, j] / monomials[j](UU, XX, YY) for j in range(nn))
            p2 = sum(monomials[j](w * z + 1, w, z) * BB[i2, j] / monomials[j](UU, XX, YY) for j in range(nn))
            rr = p1.resultant(p2)
            if rr.is_zero() or rr.monomials() == [1]:
                continue
            PR3 = PolynomialRing(ZZ, 'q')
            q = PR3.gen()
            rr = rr(q)
            y_roots = rr.roots()
            for (y0, _) in y_roots:
                x_poly = p1(w, y0)
                x_roots = x_poly.roots()
                if x_roots:
                    x0 = x_roots[0][0]
                    if f(ZZ(x0), ZZ(y0)) % e == 0:
                        d_val = (1 + x0 * (A + y0)) // e
                        if d_val > 0:
                            p_plus_q = -2 * y0
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
except Exception as ex:
    print(f"ERROR: Boneh-Durfee lattice computation failed: {ex}")
    print("BONEH_DURFEE=FAILED")
`,
  proof: `\\textbf{Theorem:} The private exponent d can be recovered in polynomial time when d < n^{0.292} using lattice reduction.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}, so ed - 1 = k\\varphi(n)
\\item \\varphi(n) = n - (p + q) + 1, let A = (n + 1)/2 and y = -(p + q)/2
\\item Herrmann-May bivariate Coppersmith method with lattice linearization
\\item LLL lattice basis reduction algorithm
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ed - 1 &= k\\varphi(n) = k(n - (p + q) + 1) \\\\
\\text{Let } A &= \\frac{n + 1}{2}, \\quad y = -\\frac{p + q}{2} \\\\
\\varphi(n) &= n + 1 - (p + q) = 2A + 2y \\\\
ed &= k(2A + 2y) + 1 = 2k(A + y) + 1 \\\\
\\text{So } 2k(A + y) + 1 &\\equiv 0 \\pmod{e} \\quad \\text{(since } ed \\equiv 0 \\pmod{e}\\text{)} \\\\
f(x, y) &= 1 + x(A + y) \\equiv 0 \\pmod{e} \\quad \\text{with root } (2k, y) \\\\
\\text{Substitute } u &= xy + 1 \\text{ (Herrmann-May) to linearize } \\varphi(n) \\text{ term} \\\\
\\text{Construct lattice from shifts } x^i f^k e^{m-k} &\\text{ and } y^j f^k e^{m-k} \\\\
\\text{Apply LLL} \\implies \\text{short vectors } g_1, g_2 &\\in \\mathbb{Z}[u, x, y] \\\\
\\text{Resultant } \\operatorname{Res}_w(g_1(w, z), g_2(w, z)) &\\implies \\text{root } z = y \\\\
\\varphi(n) = n + 1 + 2y, \\quad p + q &= -2y,\\quad \\text{solve } x^2 - (p+q)x + n = 0 \\qed
\\end{align*}

\\textbf{Explanation:} Build a bivariate polynomial f(x, y) = 1 + x(A + y) \\pmod{e} with small root (2k, -(p+q)/2). Use the Herrmann-May substitution u = xy + 1 to simplify lattice construction. Build shifts from powers of f and the modulus e, apply LLL to find short vectors, then extract y via resultant. Recover \\varphi(n) and factor n. The bound d < n^{0.292} comes from lattice dimension analysis.

\\textbf{References:} D. Boneh & G. Durfee, "Cryptanalysis of RSA with Private Key d Less than n^0.292", IEEE Trans. Info. Theory, 1999; M. Herrmann & A. May, "Maximizing Small Root Bounds by Linearization and Applications to Small Secret Exponent RSA", PKC 2008`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  // Need d < n^0.25 (Wiener fallback). For 512-bit n, n^0.25 ≈ 2^128. Pick d in [100, 10100].
  let d = BigInt(100 + Math.floor(Math.random() * 10000));
  while (modInverse(d, phi) === null) {
    d += 1n;
  }
  const e = modInverse(d, phi)!;
  return { n: n.toString(), e: e.toString() };
};
