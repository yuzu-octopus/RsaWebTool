var e=`import type { Attack } from '../types';
import { bitLength, rsaNeeds, coppersmithLatticePython } from './_rsaHelpers';
import { generateKeyPair } from '../utils/testcases/core';
import { wrapSageTemplate, validateNumeric, sanitizePython} from './guard';

// Indent shared lattice code one level so it forms a valid suite when nested.
const nestedLattice = (f: string, recover?: string): string =>
  coppersmithLatticePython(f, 'n', 5, 5, recover)
    .split('\\n')
    .map((line) => (line ? \`    \${line}\` : line))
    .join('\\n');

export const attack: Attack = {
  id: 'partial-pq-bits',
  name: 'Partial p/q Bits',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from known high (MSB) or low (LSB) bits using Coppersmith\\'s lattice. Use when half or more of p\\'s bits are known via side-channel.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'knownBits', label: 'knownBits (known bits of p)', placeholder: 'Enter known bits as integer...', multiline: true, rows: 3 },
    { name: 'bitPosition', label: 'bitPosition', placeholder: 'msb or lsb', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'PARTIAL_PQ_BITS',
    n: validateNumeric(vals.n, 'n'),
    body: \`        knownBits = Integer(\${validateNumeric(vals.knownBits, 'knownBits')})
        bitPosition = "\${sanitizePython(vals.bitPosition)}"
        found = False
        if n <= 0 or knownBits < 0:
            out.append("PARTIAL_PQ_BITS=FAILED: invalid input values")
        elif bitPosition not in ("msb", "lsb"):
            out.append("PARTIAL_PQ_BITS=FAILED: bitPosition must be 'msb' or 'lsb'")
        elif bitPosition == "msb":
            # Shifted p_msb convention (same as Partial Key Exposure): the unknown
            # low bits of knownBits are already zeroed, so f = knownBits + x.
            found_p = None
            if knownBits <= 0:
                out.append("PARTIAL_PQ_BITS=FAILED: knownBits must be positive")
            elif knownBits >= n:
                out.append("PARTIAL_PQ_BITS=FAILED: knownBits must be less than n")
            elif n % knownBits == 0:
                found_p = knownBits
            else:
\${nestedLattice('knownBits + x')}
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
                # Monic f = x + knownBits * inv(2^m) mod n (n is odd here, so the
                # inverse exists): same small root as (2^m)*x + knownBits, while p
                # is recovered below via the original non-monic form.
                inv2m = inverse_mod(Integer(2)**m, n)
\${nestedLattice('x + (knownBits * inv2m % n)', '(2**m) * r + knownBits')}
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
            out.append("PARTIAL_PQ_BITS=FAILED")\`,
    useGuard: true,
  }),
  proof: \`\\\\textbf{Theorem:} If at least half the bits of $p$ are known (as MSBs or LSBs), Coppersmith's method recovers the full factorization.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $n = p \\\\cdot q$ with balanced primes
\\\\item MSB case: $p = p_{\\\\text{known}} + x$, $|x| < n^{1/4}$, with $p_{\\\\text{known}}$ shifted (unknown low bits zeroed, same convention as Partial Key Exposure)
\\\\item LSB case: $p = x \\\\cdot 2^m + p_{\\\\text{known}}$, $|x| < n^{1/4}$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\text{MSB: } f(x) &= p_{\\\\text{known}} + x \\\\equiv 0 \\\\pmod{p} \\\\\\\\
\\\\text{LSB: } f(x) &= x + p_{\\\\text{known}} \\\\cdot 2^{-m} \\\\pmod{n} \\\\equiv 0 \\\\pmod{p} \\\\\\\\
\\\\text{Construct lattice with shifts } x^i f(x)^j &n^{m-j},\\\\quad m=5,\\\\; t=5 \\\\\\\\
\\\\text{LLL finds short polynomial; check all basis rows } &\\\\text{for two-term root candidates} \\\\\\\\
\\\\text{Each row gives } r \\\\approx -a_0 X / a_1,\\\\; &x_0 = \\\\text{round}(r),\\\\; p = f(x_0) \\\\text{ (MSB) or } p = 2^m x_0 + p_{\\\\text{known}} \\\\text{ (LSB)} \\\\\\\\
\\\\text{Verify } p \\\\mid n,\\\\quad &q = n/p \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} This attack applies Coppersmith's univariate modular root-finding method. MSB inputs use the shifted p_msb convention (unknown low bits zeroed), matching Partial Key Exposure (see its guide for the shifted-MSB worked example). The LSB polynomial is made monic as $x + p_{known} 2^{-m} \\\\bmod n$ (same small root); $p$ is then recovered via the original form $2^m x_0 + p_{known}$. The lattice uses $m=5$ polynomial shifts of decreasing $n$ powers and $t=5$ shifts of the highest-degree polynomial times $x^k$. Because Sage's $\\\\texttt{small\\\\_roots}$ only examines row 0 of the reduced basis (which fails for degree-1 polynomials), the manual lattice checks all $m+t$ rows for two-term candidates $a_0 + a_1 x$ whose root rounds to a valid factor.

\\\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996; N. Howgrave-Graham, "Approximate Integer Common Divisors", 1997\`,
  usageGuide: 'This attack recovers a prime factor when a fraction of its bits are known (e.g., from side-channel leakage).\\n\\nHow to use:\\n1. You know some bits of p (or q) and need to recover the full prime\\n2. Provide n, knownBits, and bitPosition ("msb" or "lsb"). For msb, knownBits must be shifted like p_msb (unknown low bits zeroed, e.g. clear the low k bits); for lsb, knownBits is the integer value of the known low bits\\n3. The attack uses Coppersmith\\\\\\'s method to find the missing bits\\n\\nTip: This is inherently probabilistic — the lattice may fail even with the right inputs. Try with more known bits if it fails. bitPosition=msb = known high bits (shifted), lsb = known low bits. The LSB lattice uses the monic form x + knownBits*inv(2^m) mod n internally.',
  priority: 'high',
  applicableCheck: rsaNeeds.nKnownBitsBitPos,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(256, 256);
  const bitLen = bitLength(p);
  // Keep ≥ 86% of bits for degree-2 lattice (needs unknown < n^0.075 ≈ 2^38)
  const keepBits = Math.ceil(bitLen * 0.9);
  const isLsb = Math.random() < 0.5;
  if (isLsb) {
    // LSB: low bits of p
    const knownBits = p & ((1n << BigInt(keepBits)) - 1n);
    return { n: n.toString(), knownBits: knownBits.toString(), bitPosition: 'lsb' };
  }
  // MSB: shifted high bits (same convention as partial-key-exposure: unknown
  // low bits zeroed, so the Sage template uses f = knownBits + x directly)
  const shift = bitLen - keepBits;
  const knownBits = (p >> BigInt(shift)) << BigInt(shift);
  return { n: n.toString(), knownBits: knownBits.toString(), bitPosition: 'msb' };
};
`;export{e as default};