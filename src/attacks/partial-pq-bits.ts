import type { Attack } from '../types';
import { generateKeyPair } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'partial-pq-bits',
  name: 'Partial p/q Bits',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from known high (MSB) or low (LSB) bits using Coppersmith\'s lattice. Use when half or more of p\'s bits are known via side-channel.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'knownBits', label: 'knownBits (known bits of p)', placeholder: 'Enter known bits as integer...', multiline: true, rows: 3 },
    { name: 'bitPosition', label: 'bitPosition', placeholder: 'msb or lsb', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            knownBits = Integer(${vals.knownBits})
            bitPosition = "${vals.bitPosition}"
            if n <= 0 or knownBits < 0:
                print("PARTIAL_PQ_BITS=FAILED: invalid input values")
            elif bitPosition not in ("msb", "lsb"):
                print("PARTIAL_PQ_BITS=FAILED: bitPosition must be 'msb' or 'lsb'")
            elif bitPosition == "msb":
                k = n.nbits() // 2 - knownBits.nbits()
                if k <= 0:
                    print("PARTIAL_PQ_BITS=FAILED: not enough unknown bits for Coppersmith")
                else:
                    # Manual Coppersmith lattice for degree-1, checking ALL LLL rows.
                    # Sage's small_roots only checks Row 0 (Row-0 bug for degree-1).
                    x = ZZ['x'].gen()
                    f_ZZ = (knownBits << k) + x
                    X = Integer(n).nth_root(4, truncate_mode=True)[0] + 1
                    m = 5; t = 5; dim = m + t
                    shifts = []
                    for i in range(m):
                        shifts.append(n**(m - i) * f_ZZ**i)
                    for kk in range(t):
                        shifts.append(f_ZZ**m * x**kk)
                    M = matrix(ZZ, dim, dim)
                    for i, shift in enumerate(shifts):
                        for j, c in enumerate(shift.list()):
                            M[i, j] = c * X**j
                    B = M.LLL()
                    found_p = None
                    for row_idx in range(dim):
                        row = B[row_idx]
                        a0 = Integer(row[0]); a1 = Integer(row[1])
                        if a1 == 0:
                            continue
                        r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                        for delta in range(-2, 3):
                            r = Integer(floor(r_approx)) + delta
                            if abs(r) < X:
                                candidate = Integer((knownBits << k) + r)
                                if n % candidate == 0:
                                    found_p = candidate
                                    break
                        if found_p:
                            break
                    if found_p:
                        q = n // found_p
                        print(f"Verification: p * q = {found_p * q}")
                        print(f"p = {found_p}")
                        print(f"q = {q}")
                        print()
                        print("PARTIAL_PQ_BITS=SUCCESS")
                    else:
                        print("PARTIAL_PQ_BITS=FAILED: no roots found")
            elif bitPosition == "lsb":
                m = knownBits.nbits()
                if m <= 0:
                    print("PARTIAL_PQ_BITS=FAILED: knownBits is zero")
                else:
                    # Manual Coppersmith lattice for degree-1, checking ALL LLL rows.
                    # Sage's small_roots only checks Row 0 (Row-0 bug for degree-1).
                    x = ZZ['x'].gen()
                    f_ZZ = (2**m) * x + knownBits
                    X = Integer(n).nth_root(4, truncate_mode=True)[0] + 1
                    mm = 5; tt = 5; dim = mm + tt
                    shifts = []
                    for i in range(mm):
                        shifts.append(n**(mm - i) * f_ZZ**i)
                    for kk in range(tt):
                        shifts.append(f_ZZ**mm * x**kk)
                    M = matrix(ZZ, dim, dim)
                    for i, shift in enumerate(shifts):
                        for j, c in enumerate(shift.list()):
                            M[i, j] = c * X**j
                    B = M.LLL()
                    found_p = None
                    for row_idx in range(dim):
                        row = B[row_idx]
                        a0 = Integer(row[0]); a1 = Integer(row[1])
                        if a1 == 0:
                            continue
                        r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                        for delta in range(-2, 3):
                            r = Integer(floor(r_approx)) + delta
                            if abs(r) < X:
                                candidate = Integer(r * (2**m) + knownBits)
                                if n % candidate == 0:
                                    found_p = candidate
                                    break
                        if found_p:
                            break
                    if found_p:
                        q = n // found_p
                        print(f"Verification: p * q = {found_p * q}")
                        print(f"p = {found_p}")
                        print(f"q = {q}")
                        print()
                        print("PARTIAL_PQ_BITS=SUCCESS")
                    else:
                        print("PARTIAL_PQ_BITS=FAILED: no roots found")
        except Exception as ex:
            print(f"PARTIAL_PQ_BITS=FAILED: {ex}")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARTIAL_PQ_BITS=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If at least half the bits of $p$ are known (as MSBs or LSBs), Coppersmith's method recovers the full factorization.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$ with balanced primes
\\item MSB case: $p = p_{\\text{known}} \\cdot 2^k + x$, $|x| < n^{1/4}$
\\item LSB case: $p = x \\cdot 2^m + p_{\\text{known}}$, $|x| < n^{1/4}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{MSB: } f(x) &= p_{\\text{known}} \\cdot 2^k + x \\equiv 0 \\pmod{p} \\\\
\\text{LSB: } f(x) &= x \\cdot 2^m + p_{\\text{known}} \\equiv 0 \\pmod{p} \\\\
\\text{Construct lattice with shifts } x^i f(x)^j &n^{m-j},\\quad m=5,\\; t=5 \\\\
\\text{LLL finds short polynomial; check all basis rows } &\\text{for two-term root candidates} \\\\
\\text{Each row gives } r \\approx -a_0 X / a_1,\\; &x_0 = \\text{round}(r),\\; p = f(x_0) \\\\
\\text{Verify } p \\mid n,\\quad &q = n/p \\qed
\\end{align*}

\\textbf{Explanation:} This attack applies Coppersmith's univariate modular root-finding method. The lattice uses $m=5$ polynomial shifts of decreasing $n$ powers and $t=5$ shifts of the highest-degree polynomial times $x^k$. Because Sage's $\\texttt{small\\_roots}$ only examines row 0 of the reduced basis (which fails for degree-1 polynomials), the manual lattice checks all $m+t$ rows for two-term candidates $a_0 + a_1 x$ whose root rounds to a valid factor.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996; N. Howgrave-Graham, "Approximate Integer Common Divisors", 1997`,
  usageGuide: 'This attack recovers a prime factor when a fraction of its bits are known (e.g., from side-channel leakage).\n\nHow to use:\n1. You know some bits of p (or q) and need to recover the full prime\n2. Provide n, knownBits, and bitPosition (\\"msb\\" or \\"lsb\\")\n3. The attack uses Coppersmith\\\'s method to find the missing bits\n\nTip: This is inherently probabilistic — the lattice may fail even with the right inputs. Try with more known bits if it fails. bitPosition=msb = known high bits, lsb = known low bits.',
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.knownBits && !!p.bitPosition,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(256, 256);
  const bitLen = p.toString(2).length;
  // Keep ≥ 86% of bits for degree-2 lattice (needs unknown < n^0.075 ≈ 2^38)
  const keepBits = Math.ceil(bitLen * 0.9);
  const knownBits = p >> BigInt(bitLen - keepBits);
  return { n: n.toString(), knownBits: knownBits.toString(), bitPosition: 'msb' };
};
