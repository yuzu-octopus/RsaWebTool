var e=`import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'simple-lattice',
  name: 'Simple Lattice',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from an approximate value nearp using Coppersmith\\'s lattice when |nearp - p| < n^(1/4). Use when a close approximation of p is known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'nearp', label: 'nearp (approximate p)', placeholder: 'Enter approximate p value...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'SIMPLE_LATTICE',
    useGuard: false,
    body: \`        n = Integer(\${vals.n})
        nearp = Integer(\${vals.nearp})
        found = False
        if n <= 0 or nearp <= 0:
            out.append("SIMPLE_LATTICE=FAILED: invalid input values")
        elif nearp >= n:
            out.append("nearp must be less than n (modulus)")
            out.append("SIMPLE_LATTICE=FAILED: nearp >= n")
        elif n % nearp == 0:
            p = nearp
            q = n // p
            out.append("Simple Lattice")
            out.append(f"n = {n}")
            out.append(f"nearp = {nearp}")
            out.append("")
            out.append("Results:")
            out.append(f"p = {p}")
            out.append(f"q = {q}")
            out.append("")
            out.append(f"Verification: p * q = {p * q}")
            out.append("")
            out.append("SIMPLE_LATTICE=SUCCESS")
            found = True
        elif n % 2 == 0:
            out.append("n is even — cannot apply lattice attack")
            out.append("SIMPLE_LATTICE=FAILED: even modulus")
        else:
            # Manual Coppersmith lattice (same shifts as Sage's small_roots).
            # Checks ALL LLL rows to bypass Sage's Row-0 (degree-1) bug.
            x = ZZ['x'].gen()
            f_ZZ = nearp + x
            X = n.nth_root(4, truncate_mode=True)[0] + 1
            m = 5; t = 5; dim = m + t
            shifts = []
            for i in range(m):
                shifts.append(n^(m - i) * f_ZZ^i)
            for k in range(t):
                shifts.append(f_ZZ^m * x^k)
            M_mat = matrix(ZZ, dim, dim)
            for i, shift in enumerate(shifts):
                for j, c in enumerate(shift.list()):
                    M_mat[i, j] = c * X^j
            B = M_mat.LLL()
            found_p = None
            for k in range(dim):
                row = B[k]
                a0 = Integer(row[0]); a1 = Integer(row[1])
                if a1 == 0:
                    continue
                # g(y) = sum row[i] * y^i, y = r/X.
                # g(r/X) = 0 → two-term: r ≈ -a0 * X / a1.
                # Error from higher terms: |r/X|^2 ≪ 1 → accurate within 1.
                r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                for delta in range(-2, 3):
                    r = Integer(floor(r_approx)) + delta
                    if abs(r) < X:
                        candidate = nearp + r
                        if n % candidate == 0:
                            found_p = candidate
                            break
                if found_p:
                    break
            if found_p:
                q = n // found_p
                out.append("Simple Lattice")
                out.append(f"n = {n}")
                out.append(f"nearp = {nearp}")
                out.append("")
                out.append("Results:")
                out.append(f"p = {found_p}")
                out.append(f"q = {q}")
                out.append("")
                out.append(f"Verification: p * q = {found_p * q}")
                out.append("")
                out.append("SIMPLE_LATTICE=SUCCESS")
                found = True
            else:
                out.append("SIMPLE_LATTICE=FAILED: no roots found in any LLL row")
        if not found:
            out.append("SIMPLE_LATTICE=FAILED")
\`,
  }),
  proof: \`\\\\textbf{Theorem:} If $|p-p_0| < n^{1/4}$, Coppersmith's method recovers $p$ from approximation $p_0$ via lattice reduction.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $n = p \\\\cdot q$ with balanced primes
\\\\item $p_0 \\\\approx p$, $|p - p_0| < X = n^{1/4}$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
f(x) &= p_0 + x \\\\equiv 0 \\\\pmod{p} \\\\\\\\
\\\\text{Construct lattice from shifts: } &x^i f(x)^j n^{m-j} \\\\\\\\
\\\\text{LLL finds short vector } g(x) &= a_0 + a_1 x \\\\text{ with root } x_0 \\\\\\\\
r &\\\\approx -\\\\frac{a_0 \\\\cdot X}{a_1},\\\\quad x_0 = \\\\text{round}(r) \\\\\\\\
p &= p_0 + x_0,\\\\quad q = n/p \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} The attack embeds $f(x) = p_0 + x$ into a lattice with $m=5$ shifts of decreasing $n$ powers and $t=5$ shifts of $f^m x^k$. After LLL reduction, each row of the reduced basis is a candidate polynomial; the attack checks all rows (not just row 0, because Sage's $\\\\texttt{small\\\\_roots}$ has a degree-1 bug) for two-term polynomials whose root rounds to the correct offset.

\\\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996\`,
  usageGuide: 'This recovers a factor p from an approximate value nearp using Coppersmith\\\\\\'s lattice method.\\n\\nHow to use:\\n1. You have a modulus n and an approximation nearp ≈ p (one of the prime factors)\\n2. The approximation must be within n^(1/4) of the actual p\\n3. Provide n and nearp\\n4. The attack constructs a lattice and uses LLL to find the exact p\\n\\nTip: nearp can come from side-channel leaks, known bits of p, or approximations from other attacks. If |nearp - p| > n^(1/4) the attack may fail.',
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.nearp,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  // Offset within Coppersmith bound: |offset| < n^(1/4) ≈ 2^128 for 512-bit n
  // Use up to 2^60 for a realistic but solvable testcase
  const offsetBits = 30;
  const maxOffset = (1n << BigInt(offsetBits)) - 1n;
  // Generate random offset using crypto.getRandomValues for full BigInt range
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let offset = 0n;
  for (let i = 0; i < 8; i++) {
    offset = (offset << 8n) | BigInt(bytes[i]);
  }
  offset &= maxOffset;
  // Randomly negate
  const signBytes = new Uint8Array(1);
  crypto.getRandomValues(signBytes);
  if (signBytes[0] & 1) offset = -offset;
  let nearp = p + offset;
  if (nearp <= 0n) nearp = p - offset;
  return { n: n.toString(), nearp: nearp.toString() };
};
`;export{e as default};