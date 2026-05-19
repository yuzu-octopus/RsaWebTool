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
        if k < 0:
            print("PARTIAL_PQ_BITS=FAILED: knownBits has more bits than half of n")
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
        R.<x> = PolynomialRing(Zmod(n))
        f = x * (2**m) + knownBits
        bound = 2**(n.nbits()//2 - m)
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
  proof: '\\textbf{Theorem:} If half the bits of $p$ are known, Coppersmith recovers the full factorization.\\newline\\newline\\textbf{Prerequisites:} Coppersmith method, polynomial rings over $\\mathbb{Z}/n\\mathbb{Z}$\\newline\\newline\\textbf{Proof:}\\begin{align*}\\text{MSB: } p &= p_{\\text{known}} \\cdot 2^k + x \\\\ \\text{LSB: } p &= x \\cdot 2^m + p_{\\text{known}} \\\\ f(x) &\\equiv 0 \\pmod{p} \\implies f(x) \\mid n \\\\ \\text{Coppersmith finds } x &\\text{ when } |x| < n^{1/4}\\end{align*}\\newline\\textbf{References:} Coppersmith (1996), Howgrave-Graham (1997)',
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.knownBits && !!p.bitPosition,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const bitLen = p.toString(2).length;
  const keepBits = Math.ceil(bitLen * 0.55);
  const knownBits = p >> BigInt(bitLen - keepBits);
  return { n: n.toString(), knownBits: knownBits.toString(), bitPosition: 'msb' };
};
