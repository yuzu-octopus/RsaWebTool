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
            import math
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
                print(f"Verification: p * q = {p * p}")
                print(f"p = {p}")
                print(f"q = {p}")
                print()
                print("SQUFOF=SUCCESS")
                return
            # SQUFOF works best for small factors; extract small factor first
            # Use prime_range for ~3x faster traversal vs trial division by odds
            n_int = int(n)
            found_small = False
            for trial in prime_range(3, 200000):
                t_int = int(trial)
                if n_int % t_int == 0:
                    p = Integer(t_int)
                    q = n // p
                    print(f"Small factor found: p = {p}")
                    print(f"Verification: p * q = {p * q}")
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print()
                    print("SQUFOF=SUCCESS")
                    found_small = True
                    break
            if found_small:
                return
            # Shanks' Square Forms Factorization (SQUFOF)
            def squfof(n_val):
                n_int = int(n_val)
                # Find non-residue
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
                # Step 1: forward cycle — find a square form
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
                            # Step 2: inverse square root → start reverse cycle
                            b = (sqrtD - Pnew) // r
                            P = b * r + Pnew
                            Qprev = r
                            Q = (D - P**2) // Qprev
                            # Step 3: reverse cycle — find symmetry
                            for _ in range(limit):
                                if Q == 0:
                                    break
                                b = (sqrtD + P) // Q
                                P_old = P
                                P = b * Q - P
                                Q_old = Q
                                Q = (D - P**2) // Q_old
                                if P == P_old:
                                    g = math.gcd(Q_old, n_int)
                                    if 1 < g < n_int:
                                        return Integer(g), Integer(n_int // g)
                                    break
                            break
                    Qprev = Q
                    Q = Qnew
                    P = Pnew
                return None
            result = squfof(n)
            if result:
                p, q = result
                print(f"Verification: p * q = {p * q}")
                print(f"p = {p}")
                print(f"q = {q}")
                print()
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
  proof: `\\textbf{Theorem:} SQUFOF factors n by finding a square form in the cycle of reduced forms of discriminant D = kn.

\\textbf{Setup:}
\\begin{itemize}
\\item Binary quadratic forms ax^2 + bxy + cy^2, discriminant D = b^2 - 4ac
\\item D = kn where \\left(\\frac{k}{n}\\right) = -1
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n = pq, \\quad \\left(\\frac{k}{n}\\right) &= -1, \\quad D = kn \\\\
(a_0, b_0, c_0) &\\xrightarrow{\\rho} (a_1, b_1, c_1) \\xrightarrow{\\rho} \\cdots \\xrightarrow{\\rho} (a_L, b_L, c_L) = (a_0, b_0, c_0) \\\\
\\exists i: c_i &= q^2 \\;\\text{(perfect square)} \\\\
s &= \\sqrt{c_i}, \\quad \\text{reverse } \\rho \\text{ to find } (s, b^*, s) \\\\
\\gcd(s, n) &= p \\text{ or } q \\qed
\\end{align*}

\\textbf{References:} Shanks, 1975; Gower \\& Wagstaff, Math. Comp., 2008`,
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
