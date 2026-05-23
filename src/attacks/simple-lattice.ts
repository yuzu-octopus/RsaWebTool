import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'simple-lattice',
  name: 'Simple Lattice',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from an approximation. Use when nearp ≈ p with |nearp - p| < n^(1/4).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'nearp', label: 'nearp (approximate p)', placeholder: 'Enter approximate p value...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            nearp = Integer(${vals.nearp})
            if n <= 0 or nearp <= 0:
                print("SIMPLE_LATTICE=FAILED: invalid input values")
                return
            if nearp >= n:
                print("nearp must be less than n (modulus)")
                print("SIMPLE_LATTICE=FAILED: nearp >= n")
                return
            if n % nearp == 0:
                p = nearp
                q = n // p
                print("SIMPLE_LATTICE=SUCCESS: nearp exactly divides n")
                print(f"p={p}")
                print(f"q={q}")
                return
            if n % 2 == 0:
                print("n is even — cannot apply lattice attack")
                print("SIMPLE_LATTICE=FAILED: even modulus")
                return
            # Manual Coppersmith lattice (same shifts as Sage's small_roots).
            # Checks ALL LLL rows to bypass Sage's Row-0 (degree-1) bug.
            x = ZZ['x'].gen()
            f_ZZ = nearp + x
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
                # g(y) = sum row[i] * y^i, y = r/X.
                # g(r/X) = 0 → two-term: r ≈ -a0 * X / a1.
                # Error from higher terms: |r/X|^2 ≪ 1 → accurate within 1.
                r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                for delta in range(-2, 3):
                    r = Integer(floor(r_approx)) + delta
                    if abs(r) < X:
                        candidate = Integer(nearp + r)
                        if n % candidate == 0:
                            found_p = candidate
                            break
                if found_p:
                    break
            if found_p:
                q = n // found_p
                print("SIMPLE_LATTICE=SUCCESS")
                print(f"p={found_p}")
                print(f"q={q}")
            else:
                print("SIMPLE_LATTICE=FAILED: no roots found in any LLL row")
        except Exception as ex:
            print(f"SIMPLE_LATTICE=FAILED: {ex}")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("SIMPLE_LATTICE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $p = p_0 + x$ where $|x| < n^{1/4}$, Coppersmith's method recovers $p$ from the approximation $p_0$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = p \\cdot q$ with balanced primes ($p \\approx q \\approx \\sqrt{n}$)
\\item Approximation $p_0$ such that $|p - p_0| < n^{1/4}$
\\item Coppersmith's method for finding small roots of modular polynomials
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= p_0 + x \\quad \\text{where } |x| < n^{1/4} \\\\
f(x) &= p_0 + x \\equiv 0 \\pmod{p} \\\\
\\text{Since } p \\mid n, \\quad f(x) &\\equiv 0 \\pmod{p} \\implies \\gcd(f(x), n) \\ge p \\\\
\\text{Coppersmith finds } x_0 \\text{ when } |x_0| &< n^{1/4} \\quad (\\beta = 0.5 \\text{ for factor of size } \\sqrt{n}) \\\\
p &= p_0 + x_0, \\quad q = n / p \\qed
\\end{align*}

\\textbf{Explanation:} Construct the polynomial $f(x) = p_0 + x$ over $\\mathbb{Z}/n\\mathbb{Z}$. Since $f(x) \\equiv 0 \\pmod{p}$ and $p \\mid n$, Coppersmith's method finds the small root $x$ when $|x| < n^{1/4}$. Then $p = p_0 + x$ and $q = n/p$.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996`,
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
