var e=`import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd, modInverse, modPow } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'related-message',
  name: 'Franklin-Reiter Related Message Attack',
  category: 'Message / Protocol',
  description: 'Recovers m from two ciphertexts with arbitrary linear relations via polynomial GCD. Use when c1 = (a₁·m + b₁)^e and c2 = (a₂·m + b₂)^e mod n with known a₁,b₁,a₂,b₂. Defaults: a₁=1, b₁=0 (standard Franklin-Reiter).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c1', label: 'c1 (ciphertext of a₁·m + b₁)', placeholder: 'Enter c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (ciphertext of a₂·m + b₂)', placeholder: 'Enter c2...', multiline: true, rows: 3 },
    { name: 'a1', label: 'a1 (first linear coefficient)', placeholder: '1', multiline: false },
    { name: 'b1', label: 'b1 (first linear offset)', placeholder: '0', multiline: false },
    { name: 'a2', label: 'a2 (second linear coefficient)', placeholder: '2', multiline: false },
    { name: 'b2', label: 'b2 (second linear offset)', placeholder: '0', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
      token: 'FRANKLIN_REITER_RELATED_MESSAGE',
      useGuard: false,
      body: \`        n = Integer(\${vals.n})
        e_val = "\${vals.e}".strip()
        e = Integer(e_val) if e_val else Integer(65537)
        c1 = Integer(\${vals.c1})
        c2 = Integer(\${vals.c2})
        a1_val = "\${vals.a1 || ''}".strip()
        a1 = Integer(a1_val) if a1_val else Integer(1)
        b1_val = "\${vals.b1 || ''}".strip()
        b1 = Integer(b1_val) if b1_val else Integer(0)
        a2_val = "\${vals.a2 || ''}".strip()
        a2 = Integer(a2_val) if a2_val else Integer(2)
        b2_val = "\${vals.b2 || ''}".strip()
        b2 = Integer(b2_val) if b2_val else Integer(0)
        found = True
        if n < 2 or e < 2 or c1 < 0 or c2 < 0:
            out.append("Invalid input")
            found = False
        if found:
            out.append("Franklin-Reiter Related Message Attack")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"c1 = {c1}")
            out.append(f"c2 = {c2}")
            out.append(f"a1 = {a1}")
            out.append(f"b1 = {b1}")
            out.append(f"a2 = {a2}")
            out.append(f"b2 = {b2}")
            out.append("")
            if b1 == 0 and b2 == 0:
                ratio_check = power_mod(a2, e, n) * c1 % n
                alt_ratio = power_mod(a1, e, n) * c2 % n
                out.append(f"Diagnostic: a2^e * c1 mod n = {ratio_check}")
                out.append(f"Diagnostic: a1^e * c2 mod n = {alt_ratio}")
                out.append(f"Diagnostic: match? {ratio_check == alt_ratio}")
                if ratio_check == alt_ratio:
                    out.append("WARNING: b1=b2=0 and a2^e*c1 == a1^e*c2. Any m satisfies both equations.")
                    out.append("Cannot recover m uniquely. Try using non-zero b1 or b2.")
                    found = False
                else:
                    out.append("")
        if found:
            R.<x> = PolynomialRing(Zmod(n))
            f1 = (a1 * x + b1)**e - c1
            f2 = (a2 * x + b2)**e - c2
            def poly_gcd(p, q):
                # Poly GCD over composite modulus n: when leading coefficient shares
                # a factor with n, the \`%\` operator is not well-defined. Detect and
                # return None to signal failure (caller falls through to e=3 closed-form).
                while q != 0:
                    try:
                        p, q = q, p % q
                    except (ZeroDivisionError, ValueError, TypeError, NotImplementedError):
                        lc = q.leading_coefficient()
                        g = gcd(Integer(lc), Integer(n))
                        if 1 < g < n:
                            out.append(f"GCD found factor of n: {g}")
                        return None
                return p
            g = poly_gcd(f1, f2)
            if g is None:
                out.append("Polynomial GCD failed (composite-modulus non-Euclidean behavior).")
                out.append("Try the e=3 closed-form fallback below.")
            else:
                out.append(f"GCD degree: {g.degree()}")
            m_int = None
            if g is not None:
                if g.degree() == 1:
                    a_coeff = Integer(g[1])
                    b_coeff = Integer(g[0])
                    try:
                        m_int = Integer((-b_coeff) * inverse_mod(a_coeff, n) % n)
                    except (ZeroDivisionError, ValueError):
                        for r, _ in g.roots():
                            m_int = Integer(r)
                            break
                elif g.degree() > 1:
                    for r, _ in g.roots():
                        m_int = Integer(r)
                        break
            if m_int is None and e == 3:
                out.append("Trying e=3 closed-form fallback...")
                A = (3 * (a1**3 * a2**2 * b2 - a2**3 * a1**2 * b1)) % n
                B = (3 * (a1**3 * a2 * b2**2 - a2**3 * a1 * b1**2)) % n
                C = (a1**3 * b2**3 - a2**3 * b1**3 - a1**3 * c2 + a2**3 * c1) % n
                out.append(f"Algebraic elimination: {A}*m^2 + {B}*m + {C} = 0 (mod n)")
                if A == 0 and B == 0 and C == 0:
                    out.append("Degenerate: any m satisfies both equations (b1=b2=0 case).")
                elif A == 0 and B == 0:
                    out.append(f"Contradiction: {C} != 0. a1/b1/a2/b2 values produce inconsistent equations.")
                elif A == 0:
                    try:
                        m_int = Integer((-C) * inverse_mod(B, n) % n)
                        out.append(f"Linear fallback recovered m = {m_int}")
                    except (ZeroDivisionError, ValueError):
                        out.append("Linear fallback failed (B not invertible).")
                else:
                    denom = (A * C - B^2) % n
                    numer = (B * C - A^2 * c1) % n
                    out.append(f"Denominator (A*C - B^2): {denom}")
                    gd = gcd(Integer(denom), Integer(n))
                    if 1 < gd < n:
                        out.append(f"Denominator shares factor {gd} with n - trying CRT...")
                        try:
                            p1 = gd
                            q1 = n // p1
                            m_p = Integer(numer % p1 * inverse_mod(denom % p1, p1) % p1)
                            m_q = Integer(numer % q1 * inverse_mod(denom % q1, q1) % q1)
                            m_int = Integer(crt([m_p, m_q], [p1, q1]))
                            out.append(f"CRT fallback recovered m = {m_int}")
                        except Exception as ex2:
                            out.append(f"CRT fallback failed: {ex2}")
                    else:
                        try:
                            m_int = Integer(numer * inverse_mod(denom, n) % n)
                            out.append(f"Quadratic fallback recovered m = {m_int}")
                        except (ZeroDivisionError, ValueError):
                            out.append("Quadratic fallback failed (denominator not invertible).")
            if m_int is None:
                out.append("Could not recover message m.")
                out.append("")
                out.append("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
            else:
                out.append("Results:")
                out.append(f"m = {m_int}")
                v1 = power_mod(Integer(a1 * m_int + b1), e, n)
                v2 = power_mod(Integer(a2 * m_int + b2), e, n)
                if v1 == c1 and v2 == c2:
                    out.append("")
                    out.append(f"Verification: (a1*m+b1)^e mod n = {v1}")
                    out.append("")
                    out.append("FRANKLIN_REITER_RELATED_MESSAGE=SUCCESS")
                else:
                    out.append("")
                    out.append(f"Verification: (a1*m+b1)^e mod n = {v1}")
                    out.append("")
                    out.append("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")\`,
    }),
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c1 || !vals.c2) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const rawE = (vals.e || '').trim();
      const e = rawE ? BigInt(rawE) : 65537n;
      const c1 = BigInt(vals.c1);
      const c2 = BigInt(vals.c2);
      const rawA1 = (vals.a1 || '').trim();
      const a1 = rawA1 ? BigInt(rawA1) : 1n;
      const rawB1 = (vals.b1 || '').trim();
      const b1 = rawB1 ? BigInt(rawB1) : 0n;
      const rawA2 = (vals.a2 || '').trim();
      const a2 = rawA2 ? BigInt(rawA2) : 2n;
      const rawB2 = (vals.b2 || '').trim();
      const b2 = rawB2 ? BigInt(rawB2) : 0n;

      if (n < 2n || e < 2n || c1 < 0n || c2 < 0n) return Promise.resolve(null);
      // Only supports e=3 in frontendCheck (polynomial GCD over composite n is not feasible in JS)
      if (e !== 3n) return Promise.resolve(null);

      // General transformation: if a1 != 1 or b1 != 0, transform to standard form
      // y = a1*m + b1  =>  m = a1^(-1)*(y - b1)
      // c1 = y^3
      // c2 = (a2*a1^(-1)*y + (b2 - a2*a1^(-1)*b1))^3
      const workC1 = c1;
      const workC2 = c2;
      let workA = a2;
      let workB = b2;
      let invA1: bigint | null = null;

      if (a1 !== 1n || b1 !== 0n) {
        invA1 = modInverse(a1, n);
        if (invA1 === null) {
          // a1 shares factor with n - factor found!
          const g = gcd(a1, n);
          if (1n < g && g < n) {
            const p = g;
            const q = n / g;
            return Promise.resolve(\`Franklin-Reiter Related Message Attack\\nn = \${n}\\ne = \${e}\\nc1 = \${c1}\\nc2 = \${c2}\\na1 = \${a1}\\nb1 = \${b1}\\na2 = \${a2}\\nb2 = \${b2}\\n\\nResults:\\np = \${p}\\nq = \${q}\\n\\nVerification: p * q = \${p * q}\\n\\nFRANKLIN_REITER_RELATED_MESSAGE=SUCCESS\`);
          }
          return Promise.resolve(null); // fall through to Sage
        }
        // Transform coefficients
        workA = (a2 * invA1) % n;
        workB = (b2 - (a2 * invA1 % n) * b1) % n;
        if (workB < 0n) workB += n;
        // c1 becomes y^3 = c1 (already workC1 = c1)
      }

      // Now use existing algebraic elimination with workC1, workC2, workA, workB
      // (workA*x + workB)^3 = workA^3*x^3 + 3*workA^2*workB*x^2 + 3*workA*workB^2*x + workB^3
      // x^3 = workC1
      // => 3*workA^2*workB*x^2 + 3*workA*workB^2*x + (workB^3 - workC2 + workA^3*workC1) = 0
      const A = (3n * workA * workA % n * workB) % n;
      const B = (3n * workA * workB % n * workB) % n;
      const C = ((workB * workB * workB) - workC2 + (workA * workA * workA % n) * workC1) % n;
      const nMod = ((C % n) + n) % n;

      if (A === 0n && B === 0n) return Promise.resolve(null);
      if (A === 0n) {
        if (B === 0n) return Promise.resolve(null);
        const invB = modInverse(B, n);
        if (invB === null) return Promise.resolve(null);
        const m = ((-nMod % n) + n) % n * invB % n;
        const m_orig = invA1 !== null ? (((invA1 * ((m - b1) % n)) % n + n) % n) : m;
        if (modPow((a1 * m_orig + b1) % n, e, n) === c1 && modPow((a2 * m_orig + b2) % n, e, n) === c2) {
          const v1 = modPow((a1 * m_orig + b1) % n, e, n);
          const v2 = modPow((a2 * m_orig + b2) % n, e, n);
          return Promise.resolve(\`Franklin-Reiter Related Message Attack\\nn = \${n}\\ne = \${e}\\nc1 = \${c1}\\nc2 = \${c2}\\na1 = \${a1}\\nb1 = \${b1}\\na2 = \${a2}\\nb2 = \${b2}\\n\\nResults:\\nm = \${m_orig}\\n\\nVerification: (a1*m+b1)^e mod n = \${v1}, (a2*m+b2)^e mod n = \${v2}\\n\\nFRANKLIN_REITER_RELATED_MESSAGE=SUCCESS\`);
        }
        return Promise.resolve(null);
      }

      // Quadratic: A*m^2 + B*m + C = 0
      // Resultant: (A*C - B^2)*m = B*C - A^2*workC1
      const denom = ((A * nMod - B * B) % n + n) % n;
      const numer = ((B * nMod - A * A % n * workC1) % n + n) % n;

      if (denom === 0n) return Promise.resolve(null);
      const invDenom = modInverse(denom, n);
      if (invDenom === null) return Promise.resolve(null);
      const m = (numer * invDenom) % n;
      const m_orig = invA1 !== null ? (((invA1 * ((m - b1) % n)) % n + n) % n) : m;
      if (modPow((a1 * m_orig + b1) % n, e, n) === c1 && modPow((a2 * m_orig + b2) % n, e, n) === c2) {
        const v1 = modPow((a1 * m_orig + b1) % n, e, n);
        const v2 = modPow((a2 * m_orig + b2) % n, e, n);
        return Promise.resolve(\`Franklin-Reiter Related Message Attack\\nn = \${n}\\ne = \${e}\\nc1 = \${c1}\\nc2 = \${c2}\\na1 = \${a1}\\nb1 = \${b1}\\na2 = \${a2}\\nb2 = \${b2}\\n\\nResults:\\nm = \${m_orig}\\n\\nVerification: (a1*m+b1)^e mod n = \${v1}, (a2*m+b2)^e mod n = \${v2}\\n\\nFRANKLIN_REITER_RELATED_MESSAGE=SUCCESS\`);
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: \`\\\\textbf{Theorem:} Given $c_1 \\\\equiv (a_1 m + b_1)^e \\\\pmod{n}$ and $c_2 \\\\equiv (a_2 m + b_2)^e \\\\pmod{n}$ with known $a_1, b_1, a_2, b_2$ and $\\\\gcd(a_1, n) = 1$, recover $m$ by computing $\\\\gcd((a_1 x + b_1)^e - c_1, (a_2 x + b_2)^e - c_2)$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $c_1 \\\\equiv (a_1 m + b_1)^e \\\\pmod{n}$, $c_2 \\\\equiv (a_2 m + b_2)^e \\\\pmod{n}$
\\\\item $a_1, b_1, a_2, b_2$ are known, $\\\\gcd(a_1, n) = 1$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
f_1(x) &= (a_1 x + b_1)^e - c_1 \\\\in (\\\\mathbb{Z}/n\\\\mathbb{Z})[x] \\\\\\\\
f_2(x) &= (a_2 x + b_2)^e - c_2 \\\\in (\\\\mathbb{Z}/n\\\\mathbb{Z})[x] \\\\\\\\
f_1(m) &\\\\equiv (a_1 m + b_1)^e - c_1 \\\\equiv 0 \\\\pmod{n} \\\\\\\\
f_2(m) &\\\\equiv (a_2 m + b_2)^e - c_2 \\\\equiv 0 \\\\pmod{n} \\\\\\\\
\\\\gcd(f_1, f_2) &= (x - m) \\\\quad \\\\text{(with high probability)} \\\\\\\\
m &= -g[0] \\\\cdot g[1]^{-1} \\\\pmod{n}
\\\\qed\\\\\\\\
\\\\end{align*}

\\\\textbf{Generalization (e=3):} When $a_1=1, b_1=0$, this reduces to the classical Franklin-Reiter form $c_1=m^e, c_2=(am+b)^e$. For arbitrary $a_1, b_1$ with $\\\\gcd(a_1, n)=1$, substitute $y = a_1 m + b_1$ to get $c_1=y^e$, $c_2=(a_2 a_1^{-1} y + (b_2 - a_2 a_1^{-1} b_1))^e$, reducing to the standard case.

\\\\textbf{Explanation:} Both polynomials share $m$ as a root modulo $n$. The polynomial GCD extracts their common linear factor $(x - m)$. For $e = 3$, a closed-form algebraic elimination is available. When $a_1$ is not invertible modulo $n$, $\\\\gcd(a_1, n)$ immediately reveals a factor of $n$.

\\\\textbf{References:} Franklin & Reiter, 1996; Boneh, "Twenty Years of Attacks on RSA," 1999\`,
  usageGuide: 'This attack recovers m when two ciphertexts of the SAME message under different linear transforms are encrypted with the same public key.\\n\\nHow to use:\\n1. You have two ciphertexts c1, c2 encrypted under the same (n, e)\\n2. The plaintexts are: m1 = a1*m + b1, m2 = a2*m + b2 for known a1,b1,a2,b2\\n3. Provide n, e, c1, c2, a1, b1, a2, and b2\\n4. The attack computes gcd((a1*x+b1)^e - c1, (a2*x+b2)^e - c2) to recover m\\n\\nDefaults: a1=1, b1=0 (standard Franklin-Reiter where c1 = m^e)\\n\\nTip: The attack requires e = 3 for reliable algebraic recovery in the browser; e = 5 or higher uses SageMathCell (may timeout). If a1 shares a factor with n, the attack immediately factors n. For convenience, paste into Magic Mode which auto-detects the parameters.',
  priority: 'high',
  applicableCheck: rsaNeeds.nC1C2,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e);
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  let a1: bigint, b1: bigint, a2: bigint, b2: bigint;
  // Ensure (a1,b1) ≠ (a2,b2) — identical transforms make the attack fail (same polynomial)
  do {
    a1 = BigInt(Math.floor(Math.random() * 5) + 1);  // 1-5
    b1 = BigInt(Math.floor(Math.random() * 5));       // 0-4
    a2 = BigInt(Math.floor(Math.random() * 5) + 1);  // 1-5
    b2 = BigInt(Math.floor(Math.random() * 5));       // 0-4
  } while (a1 === a2 && b1 === b2);
  const am1_b1 = (a1 * m + b1) % n;
  const am2_b2 = (a2 * m + b2) % n;
  return {
    n: n.toString(),
    e: e.toString(),
    c1: modPow(am1_b1, e, n).toString(),
    c2: modPow(am2_b2, e, n).toString(),
    a1: a1.toString(),
    b1: b1.toString(),
    a2: a2.toString(),
    b2: b2.toString(),
  };
};
`;export{e as default};