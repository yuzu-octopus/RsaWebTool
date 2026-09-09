var e=`import type { Attack } from '../types';
import { generateKeyPair, randomPrime } from '../utils/testcases/core';
import { exactNthRoot, modPow } from '../utils/bigint';
import { wrapSageTemplate, validateNumeric } from './guard';

// Browser scan cap for the unknown low part (2^20 candidates max).
const FRONTEND_X_CAP = 1 << 20;

export const attack: Attack = {
  id: 'stereotyped-message',
  name: 'Stereotyped Message (Coppersmith)',
  category: 'Partial Key / Lattice',
  description:
    'Recovers m = (prefix << k) + x with unknown small x (|x| < n^{1/e}) via Coppersmith small roots on f(x) = (prefix<<k + x)^e - c. Use when most message bits are known stereotype/padding.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'prefix', label: 'prefix (known high bits as integer)', placeholder: 'Enter known high bits of m...', multiline: true, rows: 3 },
    { name: 'k_bits', label: 'k (unknown low-bit count)', placeholder: 'e.g. 16', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c || !vals.prefix || !vals.k_bits) {
      return \`print("ERROR: Missing required inputs (n, e, c, prefix, k_bits)")
print("STEREOTYPED_MESSAGE=FAILED")\`;
    }
    return wrapSageTemplate({
      token: 'STEREOTYPED_MESSAGE',
      useGuard: false,
      body: \`        n = Integer(\${validateNumeric(vals.n, 'n')})
        e = Integer(\${validateNumeric(vals.e, 'e')})
        e_int = int(e)
        c = Integer(\${validateNumeric(vals.c, 'c')})
        prefix = Integer(\${validateNumeric(vals.prefix, 'prefix')})
        k_bits = int(Integer(\${validateNumeric(vals.k_bits, 'k_bits')}))
        if e_int < 2 or k_bits < 1:
            out.append("STEREOTYPED_MESSAGE=FAILED: need e >= 2 and k_bits >= 1")
        else:
            base = prefix << k_bits
            R.<x> = PolynomialRing(Zmod(n))
            f = (base + x) ** e_int - c
            X = Integer(1) << k_bits
            out.append("Stereotyped Message (Coppersmith)")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"prefix << {k_bits} = {base}")
            out.append("")
            found_m = None
            try:
                for r in f.small_roots(X=X, beta=1.0, epsilon=0.025):
                    m_cand = base + Integer(r)
                    if pow(int(m_cand), e_int, int(n)) == c:
                        found_m = m_cand
                        break
            except Exception as ex:
                out.append(f"small_roots failed: {ex}")
            if found_m is None:
                # Degenerate integer case: m^e < n, no modular wrap-around.
                m_root, exact = c.nth_root(e_int, truncate_mode=True)
                if exact and (m_root - base) >= 0 and (m_root - base) < X:
                    found_m = m_root
            if found_m is not None:
                out.append("Results:")
                out.append(f"m = {found_m}")
                out.append(f"x = {found_m - base}")
                out.append("")
                out.append(f"Verification: m^e mod n = {pow(int(found_m), e_int, int(n))}")
                out.append("")
                out.append("STEREOTYPED_MESSAGE=SUCCESS")
            else:
                out.append("Could not recover message: unknown part exceeds n^{1/e}.")
                out.append("STEREOTYPED_MESSAGE=FAILED")\`,
    });
  },
  frontendCheck: (vals: Record<string, string>, onProgress?: (pct: number, detail?: string) => void) => {
    if (!vals.n || !vals.e || !vals.c || !vals.prefix || !vals.k_bits) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const c = BigInt(vals.c);
      const prefix = BigInt(vals.prefix);
      const kBits = BigInt(vals.k_bits);
      if (e < 2n || kBits < 1n || kBits > 1024n || n <= 0n) return Promise.resolve(null);
      const base = prefix << kBits;
      // Degenerate integer case first: m^e < n means c is an exact e-th power.
      const direct = exactNthRoot(c, e);
      if (direct !== null && direct >= base && modPow(direct, e, n) === c) {
        return Promise.resolve(
          \`Stereotyped Message (Coppersmith)\\nn = \${n}\\ne = \${e}\\nprefix << \${kBits} = \${base}\\n\\nResults:\\nm = \${direct}\\nx = \${direct - base}\\n\\nVerification: m^e mod n = \${c}\\n\\nSTEREOTYPED_MESSAGE=SUCCESS\`,
        );
      }
      // Bounded scan of the unknown low part (browser cap 2^20).
      const total = 1n << kBits;
      if (total > BigInt(FRONTEND_X_CAP)) return Promise.resolve(null);
      for (let x = 0n; x < total; x++) {
        if (onProgress && total > 1000n && x % 5000n === 0n) {
          onProgress(Number((x * 100n) / total), \`x = \${x} / \${total}\`);
        }
        if (modPow(base + x, e, n) === c) {
          onProgress?.(100);
          const m = base + x;
          return Promise.resolve(
            \`Stereotyped Message (Coppersmith)\\nn = \${n}\\ne = \${e}\\nprefix << \${kBits} = \${base}\\n\\nResults:\\nm = \${m}\\nx = \${x}\\n\\nVerification: m^e mod n = \${c}\\n\\nSTEREOTYPED_MESSAGE=SUCCESS\`,
          );
        }
      }
      return Promise.resolve(null);
    } catch (err) {
      console.warn('[stereotyped-message] frontendCheck error:', err);
      return Promise.resolve(null);
    }
  },
  proof: \`\\\\textbf{Theorem:} If $m = B + x_0$ with known $B = \\\\text{prefix} \\\\cdot 2^k$ and $|x_0| < n^{1/e}$, then $f(x) = (B+x)^e - c$ has a small root $x_0$ modulo $n$, recovered by Coppersmith's method.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $c \\\\equiv m^e \\\\pmod{n}$ with $m = B + x_0$, $B$ known
\\\\item $|x_0| < 2^k \\\\leq n^{1/e}$ (unknown part fits the Coppersmith bound)
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
f(x) &= (B + x)^e - c \\\\in (\\\\mathbb{Z}/n\\\\mathbb{Z})[x] \\\\\\\\
f(x_0) &= m^e - c \\\\equiv 0 \\\\pmod{n} \\\\\\\\
|x_0| < n^{1/e} &\\\\implies x_0 = \\\\text{small\\\\_roots}(f) \\\\\\\\
m &= B + x_0 \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} A stereotyped message (fixed header plus a small unknown, e.g. a session key or nonce under a known padding prefix) yields a univariate modular equation of degree $e$ with a small root. Coppersmith's lattice finds all roots below $n^{1/e}$ in polynomial time. When $m^e < n$ there is no modular wrap-around and plain integer $e$-th root suffices (the browser tries that first, then a bounded scan of $x$ up to $2^{20}$).

\\\\textbf{See also:} Small Message Recovery (degenerate $m^e < n$ integer-root case); Hastad's Attack with Linear Padding (affine stereotype across moduli).

\\\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", Eurocrypt 1996; D. Boneh, "Twenty Years of Attacks on RSA", 1999\`,
  usageGuide: \`Use when all but a few low bits of the plaintext are known (stereotyped message, fixed padding prefix plus unknown nonce/key).

How to use:
1. Write m = (prefix << k) + x with the known high bits as the integer prefix
2. Provide n, e, c, prefix, and k_bits (the unknown low-bit count)
3. Sage runs Coppersmith small_roots on f(x) = (prefix<<k + x)^e - c with |x| < n^{1/e}
4. The browser covers the degenerate case (m^e < n via integer root) plus a bounded x scan to 2^20

Tip: Needs |x| < n^{1/e} (e.g. k <= ~170 for 512-bit n with e=3). Larger unknown parts need a lattice with more shifts or a different attack. See also Small Message Recovery for the pure integer-root case.\`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.prefix && !!p.k_bits,
};

export const generateTestcase = (): Record<string, string> => {
  // k = 16 unknown bits: brute-forceable in the browser/L3, well under n^{1/3}.
  const { n } = generateKeyPair(256, 256);
  const e = 3n;
  const kBits = 16n;
  const prefix = randomPrime(64);
  const xBits = new Uint8Array(2);
  crypto.getRandomValues(xBits);
  const x = (BigInt(xBits[0]) << 8n) | BigInt(xBits[1]);
  const m = (prefix << kBits) | x;
  const c = modPow(m, e, n);
  return { n: n.toString(), e: e.toString(), c: c.toString(), prefix: prefix.toString(), k_bits: kBits.toString() };
};
`;export{e as default};