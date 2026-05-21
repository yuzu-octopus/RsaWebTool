import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'partial-key-exposure',
  name: 'Partial Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from known MSBs. Use when ≥ half the bits of p are known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'p_msb', label: 'p_msb (known MSBs of p)', placeholder: 'Enter known high bits of p...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    p_msb = Integer(${v.p_msb})
    if n < 2 or p_msb < 2:
        print("PARTIAL_KEY_EXPOSURE=FAILED: invalid input values")
        quit()
    if p_msb >= n:
        print("PARTIAL_KEY_EXPOSURE=FAILED: p_msb must be less than n")
        quit()
    if n % p_msb == 0:
        p = p_msb
        q = n // p
        print("PARTIAL_KEY_EXPOSURE=SUCCESS: p_msb exactly divides n")
        print(f"p={p}")
        print(f"q={q}")
        quit()
    # p = p_msb + x, where x is unknown low bits (trailing zeros = bit count of x)
    k = p_msb.trailing_zero_bits()
    X = 2 ** k
    # Coppersmith bound for beta=0.5: |x| < n^(beta^2) = n^0.25
    max_X = Integer(n.nth_root(4))
    if X >= max_X:
        X = max_X
    print(f"Partial Key Exposure Attack")
    print(f"n = {n}")
    print(f"p_msb = {p_msb}")
    print(f"Coppersmith bound X = {X}")
    P.<x> = PolynomialRing(Zmod(n))
    f = p_msb + x
    roots = f.small_roots(X=X, beta=0.5, epsilon=0.05)
    if roots:
        p = Integer(p_msb + int(roots[0]))
        if n % p == 0:
            q = n // p
            print(f"p = {p}")
            print(f"q = {q}")
            print(f"Verification: p * q = {p * q}")
            print("PARTIAL_KEY_EXPOSURE=SUCCESS")
        else:
            print("PARTIAL_KEY_EXPOSURE=FAILED: recovered p does not divide n")
    else:
        print("Need approximately half the bits of p for Coppersmith to work.")
        print("PARTIAL_KEY_EXPOSURE=FAILED")
except Exception as ex:
    print(f"PARTIAL_KEY_EXPOSURE=FAILED: {ex}")
`,
  proof: `\\textbf{Theorem:} If the MSBs of $p$ are known such that $p = p_{\\text{msb}} + x$ with $|x| < n^{\\beta^2}$, Coppersmith recovers $p$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = pq$ — RSA modulus
\\item $p_{\\text{msb}}$ — known high bits of $p$
\\item $p = p_{\\text{msb}} + x$, $|x| < X$ — unknown low bits
\\item Coppersmith bound: $|x| < n^{\\beta^2}$ for $\\beta = 0.5$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= p_{\\text{msb}} + x, \\quad |x| < X \\\\
f(x) &= p_{\\text{msb}} + x \\equiv 0 \\pmod{p} \\\\
\\text{Coppersmith: } |x| &< n^{\\beta^2} = n^{0.25} \\text{ for } \\beta=0.5 \\\\
\\text{Construct lattice from } x^i f(x)^j &\\cdot n^{m-j} \\\\
\\text{LLL} \\implies \\text{short vector } g(x) &\\in \\mathbb{Z}[x] \\\\
g(x_0) = 0 &\\implies \\text{recover } x_0 \\\\
p &= p_{\\text{msb}} + x_0 \\qed
\\end{align*}

\\textbf{Explanation:} Model $p$ as known MSBs plus unknown correction $x$. Build polynomial $f(x) = p_{\\text{msb}} + x$ modulo $n$. Coppersmith finds small roots when the unknown portion is below the bound. Approximately half the bits of $p$ must be known.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", Eurocrypt 1996; A. May, "Using Coppersmith's Method to Attack RSA", 2009`,
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.p_msb,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const pBits = p.toString(2).length;
  const keepBits = Math.floor(pBits * 0.6);
  const shift = BigInt(pBits - keepBits);
  const pMsb = (p >> shift) << shift;
  return { n: n.toString(), p_msb: pMsb.toString() };
};
