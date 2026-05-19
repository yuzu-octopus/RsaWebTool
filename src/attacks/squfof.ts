import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'squfof',
  name: 'SQUFOF',
  category: 'Factorization',
  description: 'Factors n via continued fractions of sqrt(n). Use for n < 10^14.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

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
if n.nbits() > 64:
    print(f"n has {n.nbits()} bits. SQUFOF is practical only up to ~64 bits.")
    print("Use Pollard's rho or ECM instead.")
    print("SQUFOF=FAILED")
    return

# Shanks' Square Forms Factorization (SQUFOF)
try:
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
        Po = isqrt(sqrtD)
        P = Po
        Q = 1
        Qprev = 1

        # Step 1: find square form
        limit = 2 * isqrt(isqrt(n)) + 2
        for i in range(limit):
            b = (sqrtD + P) // Q
            Pnew = b * Q - P
            Qnew = D - Pnew**2
            Qnew //= Q
            if i % 2 == 0 and Q.is_square():
                # Step 2: compute inverse root
                q = isqrt(Q)
                if (sqrtD - P) % q == 0:
                    b = (sqrtD - P) // q
                    P = b * q + P
                    Qprev = q
                    # Step 3: find factor
                    for j in range(limit):
                        b = (sqrtD + P) // Qprev
                        Pnew = b * Qprev - P
                        Qnew = D - Pnew**2
                        Qnew //= Qprev
                        if P == Pnew:
                            g = gcd(Qprev, n)
                            if 1 < g < n:
                                return g, n // g
                            break
                        Qprev = Qnew
                        P = Pnew
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
    print(f"Error in SQUFOF: {e}")
    print("SQUFOF=FAILED")
`,
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
\\text{Runtime: } O(n^{1/4}) &
\\end{align*}

\\textbf{Explanation:} SQUFOF traverses the cycle of reduced binary quadratic forms of discriminant D = kn. When a form with a square coefficient c is found, the inverse square root is computed and the cycle is continued until a factor emerges via GCD.

\\textbf{References:} D. Shanks, "SQUFOF: A Quadratic Form Factorization Algorithm", 1975; Gower & Wagstaff, "Square Form Factorization", Mathematics of Computation, 2008`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString() };
};
