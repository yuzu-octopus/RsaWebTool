import type { Attack } from '../types';
import { generateKeyPair } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'partial-key-exposure',
  name: 'Partial Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from known MSBs. Use when ≥ half the bits of p are known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'p_msb', label: 'p_msb (known MSBs of p)', placeholder: 'Enter known high bits of p...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            p_msb = Integer(${vals.p_msb})
            if n < 2 or p_msb < 2:
                print("PARTIAL_KEY_EXPOSURE=FAILED: invalid input values")
                return
            if p_msb >= n:
                print("PARTIAL_KEY_EXPOSURE=FAILED: p_msb must be less than n")
                return
            if n % p_msb == 0:
                p = p_msb
                q = n // p
                print("PARTIAL_KEY_EXPOSURE=SUCCESS: p_msb exactly divides n")
                print(f"p={p}")
                print(f"q={q}")
                return
            # p = p_msb + x, where x is unknown low bits (trailing zeros = bit count of x)
            k = p_msb.trailing_zero_bits()
            print(f"Partial Key Exposure Attack")
            print(f"n = {n}")
            print(f"p_msb = {p_msb}")
            print(f"Unknown low bits = {k}")
            # Manual Coppersmith lattice for degree-1, checking ALL LLL rows.
            # Sage's small_roots only checks Row 0 (Row-0 bug for degree-1).
            x = ZZ['x'].gen()
            f_ZZ = p_msb + x
            X = Integer(n).nth_root(4, truncate_mode=True)[0] + 1
            m = 5; t = 5; dim = m + t
            shifts = []
            for i in range(m):
                shifts.append(n^(m - i) * f_ZZ^i)
            for k in range(t):
                shifts.append(f_ZZ^m * x^k)
            M = matrix(ZZ, dim, dim)
            for i, shift in enumerate(shifts):
                for j, c in enumerate(shift.list()):
                    M[i, j] = c * X^j
            B = M.LLL()
            found_p = None
            for k in range(dim):
                row = B[k]
                a0 = Integer(row[0]); a1 = Integer(row[1])
                if a1 == 0:
                    continue
                r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                for delta in range(-2, 3):
                    r = Integer(floor(r_approx)) + delta
                    if abs(r) < X:
                        candidate = Integer(p_msb + r)
                        if n % candidate == 0:
                            found_p = candidate
                            break
                if found_p:
                    break
            if found_p:
                q = n // found_p
                print(f"p = {found_p}")
                print(f"q = {q}")
                print("PARTIAL_KEY_EXPOSURE=SUCCESS")
            else:
                print("Need approximately half the bits of p for Coppersmith to work.")
                print("PARTIAL_KEY_EXPOSURE=FAILED")
        except Exception as ex:
            print(f"PARTIAL_KEY_EXPOSURE=FAILED: {ex}")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARTIAL_KEY_EXPOSURE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If MSBs of $p$ are known with $|x| < n^{\\beta^2}$, Coppersmith recovers $p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$
\\item $p = p_{\\text{msb}} + x$, $|x| < X$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(x) &= p_{\\text{msb}} + x \\equiv 0 \\pmod{p} \\\\
\\text{Construct lattice from } x^i f(x)^j &\\cdot n^{m-j} \\\\
\\text{LLL} \\implies \\text{short vector } g(x) &\\in \\mathbb{Z}[x] \\\\
g(x_0) = 0 &\\implies \\text{recover } x_0 \\\\
p &= p_{\\text{msb}} + x_0 \\qed
\\end{align*}

\\textbf{Explanation:} Coppersmith's method constructs a lattice embedding $f(x) = p_{\\text{msb}} + x$; LLL finds the small root $x_0$ when $|x_0| < n^{\\beta^2}$, recovering $p$.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", Eurocrypt 1996; A. May, "Using Coppersmith's Method to Attack RSA", 2009`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.p_msb,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(512, 512);
  const pBits = p.toString(2).length;
  // Must keep ≥ 86% of bits (degree-2 bound: unknown < n^0.075 ≈ 2^77 for 1024-bit n)
  const keepBits = Math.floor(pBits * 0.9);
  const shift = BigInt(pBits - keepBits);
  const pMsb = (p >> shift) << shift;
  return { n: n.toString(), p_msb: pMsb.toString() };
};
