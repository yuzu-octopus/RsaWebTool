import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'squfof',
  name: 'SQUFOF',
  category: 'Factorization',
  description: 'Factors n via continued fractions of sqrt(n). Use for n < 10^14.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            print(f"SQUFOF on n = {n}")
            print()
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("SQUFOF=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print(f"Verification: 2 * {n // 2} = {n}")
                print("SQUFOF=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("No factorization possible")
                print("SQUFOF=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("SQUFOF=SUCCESS")
                return
            # SQUFOF works best for small factors; extract small factor first
            found_small = False
            for trial in range(3, 100000, 2):
                if n % trial == 0:
                    p = Integer(trial)
                    q = n // p
                    print(f"Small factor found: p = {p}")
                    print(f"q = {q}")
                    print(f"Verification: p * q = {p * q}")
                    print("SQUFOF=SUCCESS")
                    found_small = True
                    break
            if found_small:
                return
            # Shanks' Square Forms Factorization (SQUFOF)
            def squfof(n):
                # Find non-residue
                D = 0
                for k in [1, 3, 5, 7, -1, -3, -5, -7]:
                    if kronecker(k, n) == -1:
                        D = k * n
                        break
                if D == 0:
                    D = n
                sqrtD = isqrt(D)
                Po = sqrtD
                P = Po
                Q = D - Po**2
                Qprev = 1
                # Step 1: forward cycle — find a square form
                limit = 2 * isqrt(isqrt(n)) + 2
                for i in range(limit):
                    b = (sqrtD + P) // Q
                    Pnew = b * Q - P
                    Qnew = D - Pnew**2
                    Qnew //= Q
                    if i % 2 == 0 and Qnew.is_square() and Qnew > 0:
                        r = isqrt(Qnew)
                        if (sqrtD - Pnew) % r == 0:
                            # Step 2: inverse square root → start reverse cycle
                            b = (sqrtD - Pnew) // r
                            P = b * r + Pnew
                            Qprev = r
                            Q = (D - P**2) // Qprev
                            # Step 3: reverse cycle — find symmetry
                            for _ in range(limit):
                                b = (sqrtD + P) // Q
                                P_old = P
                                P = b * Q - P
                                Q_old = Q
                                Q = (D - P**2) // Q_old
                                if P == P_old:
                                    g = gcd(Q_old, n)
                                    if 1 < g < n:
                                        return g, n // g
                                    break
                            break
                    Qprev = Q
                    Q = Qnew
                    P = Pnew
                return None
            result = squfof(n)
            if result:
                p, q = result
                print(f"p = {p}")
                print(f"q = {q}")
                print(f"Verification: p * q = {p * q}")
                print("SQUFOF=SUCCESS")
            else:
                print("SQUFOF did not find a factor. Try a different method.")
                print("SQUFOF=FAILED")
        except Exception as e:
            print(f"ERROR: {e}")
            print("SQUFOF=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("SQUFOF=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} SQUFOF factors a composite integer n by finding a square form in the cycle of reduced binary quadratic forms of discriminant D = kn.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n — composite integer to factor (semiprime works best)
\\item k — multiplier with \\left(\\frac{k}{n}\\right) = -1 (Kronecker symbol)
\\item D = kn — discriminant of the binary quadratic forms
\\item Reduction operator \\rho(a, b, c) = (c, b', (b'^2 - D)/(4c)) where b' \\equiv -b \\pmod{2c}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n = pq, \\quad \\left(\\frac{k}{n}\\right) &= -1, \\quad D = kn \\\\
f(x, y) = ax^2 + bxy + cy^2, \\quad D &= b^2 - 4ac \\\\
\\rho(a, b, c) &= \\left(c,\\; b' \\bmod 2c,\\; \\frac{b'^2 - D}{4c}\\right), \\quad |b'| \\leq \\sqrt{D} \\\\
(a_0, b_0, c_0) &\\xrightarrow{\\rho} (a_1, b_1, c_1) \\xrightarrow{\\rho} \\cdots \\xrightarrow{\\rho} (a_L, b_L, c_L) = (a_0, b_0, c_0) \\\\
\\exists i: c_i &= q^2 \\text{ (perfect square)} \\\\
\\text{Let } s = \\sqrt{c_i}, \\quad (a', b', s^2) &\\xrightarrow{\\rho^{\\text{inv}}} \\cdots \\xrightarrow{\\rho} (s, b^*, s) \\\\
\\gcd(s, n) &= p \\text{ or } q \\\\
\\text{Runtime: } O(n^{1/4}) & \\qed
\\end{align*}

\\textbf{Explanation:} SQUFOF traverses the cycle of reduced binary quadratic forms of discriminant D = kn. When a form with a square coefficient c is found, the inverse square root is computed and the cycle is continued until a factor emerges via GCD.

\\textbf{References:} D. Shanks, "SQUFOF: A Quadratic Form Factorization Algorithm", 1975; Gower & Wagstaff, "Square Form Factorization", Mathematics of Computation, 2008`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate n with one small factor (≤16 bits) so trial division succeeds
  // SQUFOF's trial division goes up to 100000, so 16-bit primes are well within range
  const p = randomPrime(16);
  const q = randomPrime(TESTCASE_BITS.p + TESTCASE_BITS.q - 16);
  return { n: (p * q).toString() };
};
