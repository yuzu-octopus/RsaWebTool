import type { Attack } from '../types';
import { rsaNeeds, coppersmithLatticePython } from './_rsaHelpers';
import { generateKeyPair } from '../utils/testcases/core';
import { wrapSageTemplate, validateNumeric, sanitizePython} from './guard';

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
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'PARTIAL_PQ_BITS',
    n: validateNumeric(vals.n, 'n'),
    body: `        knownBits = Integer(${validateNumeric(vals.knownBits, 'knownBits')})
        bitPosition = "${sanitizePython(vals.bitPosition)}"
        found = False
        if n <= 0 or knownBits < 0:
            out.append("PARTIAL_PQ_BITS=FAILED: invalid input values")
        elif bitPosition not in ("msb", "lsb"):
            out.append("PARTIAL_PQ_BITS=FAILED: bitPosition must be 'msb' or 'lsb'")
        elif bitPosition == "msb":
            k = n.nbits() // 2 - knownBits.nbits()
            if k <= 0:
                out.append("PARTIAL_PQ_BITS=FAILED: not enough unknown bits for Coppersmith")
            else:
                # Coppersmith lattice: degree-1, checks ALL LLL rows (bypasses Sage Row-0 bug).
${coppersmithLatticePython('(knownBits << k) + x')}
                if found_p:
                    q = n // found_p
                    out.append("Partial PQ Bits")
                    out.append(f"n = {n}")
                    out.append(f"knownBits = {knownBits}")
                    out.append("bitPosition = msb")
                    out.append("")
                    out.append("Results:")
                    out.append(f"p = {found_p}")
                    out.append(f"q = {q}")
                    out.append("")
                    out.append(f"Verification: p * q = {found_p * q}")
                    out.append("")
                    out.append("PARTIAL_PQ_BITS=SUCCESS")
                    found = True
                else:
                    out.append("PARTIAL_PQ_BITS=FAILED: no roots found")
        elif bitPosition == "lsb":
            m = knownBits.nbits()
            if m <= 0:
                out.append("PARTIAL_PQ_BITS=FAILED: knownBits is zero")
            else:
                # Coppersmith lattice: degree-1, checks ALL LLL rows (bypasses Sage Row-0 bug).
${coppersmithLatticePython('(2**m) * x + knownBits')}
                if found_p:
                    q = n // found_p
                    out.append("Partial PQ Bits")
                    out.append(f"n = {n}")
                    out.append(f"knownBits = {knownBits}")
                    out.append("bitPosition = lsb")
                    out.append("")
                    out.append("Results:")
                    out.append(f"p = {found_p}")
                    out.append(f"q = {q}")
                    out.append("")
                    out.append(f"Verification: p * q = {found_p * q}")
                    out.append("")
                    out.append("PARTIAL_PQ_BITS=SUCCESS")
                    found = True
                else:
                    out.append("PARTIAL_PQ_BITS=FAILED: no roots found")
        if not found:
            out.append("PARTIAL_PQ_BITS=FAILED")`,
    useGuard: true,
  }),
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
  usageGuide: 'This attack recovers a prime factor when a fraction of its bits are known (e.g., from side-channel leakage).\n\nHow to use:\n1. You know some bits of p (or q) and need to recover the full prime\n2. Provide n, knownBits, and bitPosition ("msb" or "lsb")\n3. The attack uses Coppersmith\\\'s method to find the missing bits\n\nTip: This is inherently probabilistic — the lattice may fail even with the right inputs. Try with more known bits if it fails. bitPosition=msb = known high bits, lsb = known low bits.',
  priority: 'high',
  applicableCheck: rsaNeeds.nKnownBitsBitPos,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(256, 256);
  const bitLen = p.toString(2).length;
  // Keep ≥ 86% of bits for degree-2 lattice (needs unknown < n^0.075 ≈ 2^38)
  const keepBits = Math.ceil(bitLen * 0.9);
  const isLsb = Math.random() < 0.5;
  if (isLsb) {
    // LSB: low bits of p
    const knownBits = p & ((1n << BigInt(keepBits)) - 1n);
    return { n: n.toString(), knownBits: knownBits.toString(), bitPosition: 'lsb' };
  }
  // MSB: high bits of p
  const knownBits = p >> BigInt(bitLen - keepBits);
  return { n: n.toString(), knownBits: knownBits.toString(), bitPosition: 'msb' };
};
