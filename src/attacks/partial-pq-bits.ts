import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'partial-pq-bits',
  name: 'Partial p/q Bits',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from known MSBs or LSBs. Use when partial bits of p are leaked.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'knownBits', label: 'knownBits (known bits of p)', placeholder: 'Enter known bits as integer...', multiline: true, rows: 3 },
    { name: 'bitPosition', label: 'bitPosition', placeholder: 'msb or lsb', multiline: false },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    knownBits = Integer(${v.knownBits})
    bitPosition = "${v.bitPosition}"
    if n <= 0 or knownBits < 0:
        print("PARTIAL_PQ_BITS=FAILED: invalid input values")
    elif bitPosition not in ("msb", "lsb"):
        print("PARTIAL_PQ_BITS=FAILED: bitPosition must be 'msb' or 'lsb'")
    elif bitPosition == "msb":
        k = n.nbits() // 2 - knownBits.nbits()
        if k <= 0:
            print("PARTIAL_PQ_BITS=FAILED: not enough unknown bits for Coppersmith")
        else:
            R.<x> = PolynomialRing(Zmod(n))
            f = (knownBits << k) + x
            bound = 2**k
            print(f"Using bound X = {bound}")
            roots = f.small_roots(X=bound, beta=0.5)
            if roots:
                p = Integer((knownBits << k) + roots[0])
                if n % p == 0:
                    q = n // p
                    print(f"Verification: p * q = {p * q}")
                    if p * q == n:
                        print(f"PARTIAL_PQ_BITS=SUCCESS")
                        print(f"p={p}")
                        print(f"q={q}")
                    else:
                        print("PARTIAL_PQ_BITS=FAILED: verification mismatch")
                else:
                    print("PARTIAL_PQ_BITS=FAILED: recovered p does not divide n")
            else:
                print("PARTIAL_PQ_BITS=FAILED: no roots found")
    elif bitPosition == "lsb":
        m = knownBits.nbits()
        if m <= 0:
            print("PARTIAL_PQ_BITS=FAILED: knownBits is zero")
        else:
            R.<x> = PolynomialRing(Zmod(n))
            f = x * (2**m) + knownBits
            f = f.monic()
            bound = 2**(n.nbits() // 2 - m)
            print(f"Using bound X = {bound}")
            roots = f.small_roots(X=bound, beta=0.5)
            if roots:
                p = Integer(roots[0] * (2**m) + knownBits)
                if n % p == 0:
                    q = n // p
                    print(f"Verification: p * q = {p * q}")
                    if p * q == n:
                        print(f"PARTIAL_PQ_BITS=SUCCESS")
                        print(f"p={p}")
                        print(f"q={q}")
                    else:
                        print("PARTIAL_PQ_BITS=FAILED: verification mismatch")
                else:
                    print("PARTIAL_PQ_BITS=FAILED: recovered p does not divide n")
            else:
                print("PARTIAL_PQ_BITS=FAILED: no roots found")
except Exception as ex:
    print(f"PARTIAL_PQ_BITS=FAILED: {ex}")`,
  proof: `\\textbf{Theorem:} If at least half the bits of $p$ are known (as MSBs or LSBs), Coppersmith's method recovers the full factorization of $n$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = p \\cdot q$ with balanced primes ($p \\approx q \\approx \\sqrt{n}$)
\\item Known MSBs: $p = p_{\\text{known}} \\cdot 2^k + x$ where $|x| < 2^k$
\\item Known LSBs: $p = x \\cdot 2^m + p_{\\text{known}}$ where $|x| < 2^{\\text{bits}(p) - m}$
\\item Coppersmith's bound: small roots found when $|x| < n^{1/4}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{MSB case:} \\quad p &= p_{\\text{known}} \\cdot 2^k + x \\\\
f(x) &= p_{\\text{known}} \\cdot 2^k + x \\equiv 0 \\pmod{p} \\\\
\\text{LSB case:} \\quad p &= x \\cdot 2^m + p_{\\text{known}} \\\\
f(x) &= x \\cdot 2^m + p_{\\text{known}} \\equiv 0 \\pmod{p} \\\\
\\text{Coppersmith finds } x &\\text{ when } |x| < n^{1/4} \\quad (\\beta = 0.5) \\\\
p &= f(x_0), \\quad q = n / p \\qed
\\end{align*}

\\textbf{Explanation:} Construct a linear polynomial $f(x)$ over $\\mathbb{Z}/n\\mathbb{Z}$ such that $f(x) \\equiv 0 \\pmod{p}$. For MSBs, $f(x) = p_{\\text{known}} \\cdot 2^k + x$. For LSBs, $f(x) = x \\cdot 2^m + p_{\\text{known}}$. Coppersmith's method finds the small root $x_0$, giving $p = f(x_0)$ and $q = n/p$.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996; N. Howgrave-Graham, "Approximate Integer Common Divisors", 1997`,
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.knownBits && !!p.bitPosition,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const bitLen = p.toString(2).length;
  // Keep 60% of MSBs — enough for Coppersmith (needs > 50%)
  const keepBits = Math.ceil(bitLen * 0.6);
  const knownBits = p >> BigInt(bitLen - keepBits);
  return { n: n.toString(), knownBits: knownBits.toString(), bitPosition: 'msb' };
};
