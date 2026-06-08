var e=`import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'bleichenbacher',
  name: "Bleichenbacher PKCS#1 v1.5",
  category: 'Oracle',
  description: 'Decrypts a PKCS#1 v1.5 ciphertext using a padding oracle in ~2^17 queries. Use when a server reveals whether padding is valid.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated 0/1)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
      token: 'BLEICHENBACHER',
      useGuard: false,
      body: \`        valid = True
        if not "\${vals.n}".strip():
            out.append("ERROR: n is required")
            valid = False
        if not "\${vals.e}".strip():
            out.append("ERROR: e is required")
            valid = False
        if not "\${vals.c}".strip():
            out.append("ERROR: c is required")
            valid = False
        responses_raw = """\${vals.oracle_responses || ''}""".strip()
        if not responses_raw:
            out.append("ERROR: oracle_responses is required")
            valid = False
        if valid:
            n = Integer(\${vals.n})
            e = Integer(\${vals.e})
            c = Integer(\${vals.c})
            orig_c = Integer(\${vals.c})
            oracle_bits = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            out.append("Bleichenbacher PKCS#1 v1.5")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"c = {c}")
            out.append(f"oracle_responses = {len(oracle_bits)}")
            k = (n.nbits() + 7) // 8
            B = Integer(2)**(8 * (k - 2))

            out.append("")
            valid_s = [Integer(i + 1) for i, r in enumerate(oracle_bits) if r == 1]
            out.append(f"Valid padding responses: {len(valid_s)}")
            if len(valid_s) < 2:
                out.append("")
                out.append("BLEICHENBACHER=FAILED")
            else:
                s1 = valid_s[0]
                out.append(f"s1 = {s1}")
                if s1 == 1:
                    a = 2 * B
                    b = 3 * B - 1
                else:
                    a = 2 * B
                    b = 3 * B - 1
                    r_min = ceil((a * s1 - 3 * B + 1) / n)
                    r_min = max(Integer(0), r_min)
                    r_max = floor((b * s1 - 2 * B) / n)
                    for r in range(int(r_min), int(r_max) + 1):
                        r_int = r
                        ca = ceil((2 * B + r_int * n) / s1)
                        cb = floor((3 * B - 1 + r_int * n) / s1)
                        inter_a = max(2 * B, ca)
                        inter_b = min(3 * B - 1, cb)
                        if inter_a <= inter_b:
                            a = inter_a
                            b = inter_b
                            break

                for idx in range(1, min(len(valid_s), 50)):
                    s = valid_s[idx]
                    r_min = ceil((a * s - 3 * B + 1) / n)
                    r_max = floor((b * s - 2 * B) / n)
                    new_a = None
                    new_b = None
                    for r in range(int(r_min), int(r_max) + 1):
                        r_int = r
                        ca = ceil((2 * B + r_int * n) / s)
                        cb = floor((3 * B - 1 + r_int * n) / s)
                        inter_a = max(a, ca)
                        inter_b = min(b, cb)
                        if inter_a <= inter_b:
                            if new_a is None or inter_a > new_a:
                                new_a = inter_a
                            if new_b is None or inter_b < new_b:
                                new_b = inter_b
                    if new_a is not None and new_b is not None:
                        a = new_a
                        b = new_b

                    if a == b:
                        m = a
                        break
                else:
                    m = (a + b) // 2
                v = Integer(pow(int(m), int(e), int(n)))
                out.append("")
                out.append("Results:")
                out.append(f"m = {m}")
                out.append("")
                out.append(f"Verification: m^e mod n = {v}")
                out.append("")
                if v == orig_c:
                    out.append("BLEICHENBACHER=SUCCESS")
                else:
                    out.append("BLEICHENBACHER=FAILED")
        else:
            out.append("BLEICHENBACHER=FAILED")\`,
    }),
  frontendCheck: (vals) => {
    if (!vals.n || !vals.e || !vals.c || !vals.oracle_responses) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const c = BigInt(vals.c);
      const responses = vals.oracle_responses.split(',').map(x => x.trim() === '1');
      const nBits = n.toString(2).length;
      const k = Math.ceil(nBits / 8);
      const B = 1n << BigInt(8 * (k - 2));
      const twoB = 2n * B;
      const threeB = 3n * B;

      // Collect valid s values (1-indexed positions where oracle = 1)
      const validS: bigint[] = [];
      for (let i = 0; i < responses.length; i++) {
        if (responses[i]) validS.push(BigInt(i + 1));
      }
      // Need at least s=1 (original ciphertext) + one more valid s
      if (validS.length < 2) return Promise.resolve(null);

      // Initial interval from s=1: original message m ∈ [2B, 3B-1]
      let a = twoB;
      let b = threeB - 1n;

      // Narrow using remaining valid s values (skip s=1, it sets initial interval)
      for (let idx = 1; idx < validS.length && a < b; idx++) {
        const s = validS[idx];
        // r range: r = ceil((a*s - 3B + 1)/n) ... floor((b*s - 2B)/n)
        const rMinNum = a * s - threeB + 1n;
        const rMin = rMinNum <= 0n ? 0n : (rMinNum + n - 1n) / n;
        const rMaxNum = b * s - twoB;
        const rMax = rMaxNum < 0n ? -1n : rMaxNum / n;

        if (rMin > rMax) continue;

        let newA: bigint | null = null;
        let newB: bigint | null = null;
        
        for (let r = rMin; r <= rMax; r++) {
          // ceil((2B + r*n) / s)
          const ca = (twoB + r * n + s - 1n) / s;
          // floor((3B - 1 + r*n) / s)
          const cb = (threeB - 1n + r * n) / s;
          
          const interA = ca > a ? ca : a; // max(a, ca)
          const interB = cb < b ? cb : b; // min(b, cb)
          
          if (interA <= interB) {
            if (newA === null || interA > newA) newA = interA;
            if (newB === null || interB < newB) newB = interB;
          }
        }

        if (newA !== null && newB !== null) {
          a = newA;
          b = newB;
        }
      }

      // Verify
      for (let mVal = a; mVal <= b && mVal < a + 100n; mVal++) {
        if (modPow(mVal, e, n) === c) {
          return Promise.resolve(\`Bleichenbacher PKCS#1 v1.5\\nn = \${n}\\ne = \${e}\\nc = \${c}\\noracle_responses = \${responses.length}\\n\\nResults:\\nm = \${mVal}\\n\\nVerification: m^e mod n = \${modPow(mVal, e, n)}\\n\\nBLEICHENBACHER=SUCCESS\`);
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: \`\\\\textbf{Theorem:} A PKCS#1 v1.5 padding oracle decrypts any RSA ciphertext in approximately $2^{17}$ adaptive queries.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $c = m^e \\\\bmod n$, with $m$ having valid PKCS#1 v1.5 padding: $m = 0x00\\\\,0x02\\\\,PS\\\\,0x00\\\\,M$
\\\\item Oracle $\\\\mathcal{O}(c') = 1$ iff $\\\\text{decrypt}(c')$ has valid PKCS#1 v1.5 padding
\\\\item $B = 2^{8(k-2)}$ where $k = \\\\lceil n/8 \\\\rceil$ is the byte length; valid messages lie in $[2B, 3B)$
\\\\item Multiplying ciphertext: $(c \\\\cdot s^e)^d \\\\equiv m \\\\cdot s \\\\pmod{n}$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\mathcal{O}(c \\\\cdot s^e) = 1 &\\\\implies 2B \\\\leq m \\\\cdot s - rn < 3B \\\\quad \\\\text{for some } r \\\\\\\\
&\\\\implies \\\\frac{2B + rn}{s} \\\\leq m < \\\\frac{3B + rn}{s} \\\\\\\\
M_i &= \\\\bigcup_{r=0}^{s_i-1} \\\\left[\\\\left\\\\lceil \\\\frac{2B+rn}{s_i}\\\\right\\\\rceil, \\\\left\\\\lfloor \\\\frac{3B-1+rn}{s_i}\\\\right\\\\rfloor\\\\right] \\\\\\\\
[a_{i+1}, b_{i+1}] &= [a_i, b_i] \\\\cap M_i \\\\\\\\
b - a \\\\to 0 &\\\\implies m = a \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} Bleichenbacher's attack works by blinding the ciphertext: $c' = c \\\\cdot s^e \\\\bmod n$ decrypts to $m \\\\cdot s \\\\bmod n$. When the oracle says the decryption has valid PKCS#1 v1.5 padding, we know $m \\\\cdot s \\\\bmod n \\\\in [2B, 3B)$. For each valid $s$, this constrains $m$ to a set of intervals (one per wrap-around $r$). Intersecting intervals across multiple $s$ values progressively narrows the candidate range. With roughly 20 valid $s$ values, the interval collapses to a single integer -- the original message $m$.

\\\\textbf{References:} D. Bleichenbacher, "Chosen Ciphertext Attacks Against Protocols Based on the RSA Encryption Standard PKCS#1", CRYPTO 1998\`,
  usageGuide: 'This requires oracle_responses \\u2014 a comma-separated list of 1s (valid padding) and 0s (invalid) from a PKCS#1 v1.5 padding oracle.\\n\\nHow to use:\\n1. Set up an oracle that returns 1 if decrypt(c\\') has valid PKCS#1 v1.5 padding, 0 otherwise\\n2. For s = 1, 2, 3, ... query the oracle with c\\' = c * s^e mod n\\n3. Record the responses as comma-separated bits: 1,0,0,1,0,0,... (1 = valid padding)\\n4. Provide n, e, c, and the full oracle_responses string\\n\\nTip: s=1 always returns 1 (the original ciphertext has valid padding). You need roughly 20 valid responses to narrow the interval.',
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
};

export const generateTestcase = (): Record<string, string> => {
  // Use small primes (10-bit → n ≈ 20 bits) so the oracle response array stays small
  // and the template converges within SageMathCell's 120s timeout.
  // B = 2^(8*(k-2)) where k = ceil(nbits/8). For n≈20 bits: k=3, B=256.
  const { n, e } = generateKeyPair(10, 10);
  const k = Math.ceil(n.toString(2).length / 8);
  const B = 256n ** BigInt(k - 2);
  const lower = 2n * B;
  const upper = 3n * B;
  const range = upper - lower;
  const m = lower + BigInt(Math.floor(Math.random() * Number(range)));
  const c = encrypt(m, n, e);

  // Compute valid s positions: m*s mod n ∈ [2B, 3B)
  // For wrapping round r: s ∈ [ceil((r·n+2B)/m), floor((r·n+3B-1)/m)]
  // maxS=8192 gives ~16KB response string, enough for 5-10 valid s values
  const maxS = 8192;
  const validPositions = new Set<number>();
  validPositions.add(1); // s=1 always valid

  const sStep = Number(n / m) || 256;
  const maxR = Math.min(maxS, Math.floor(maxS / Math.max(1, sStep)) + 10);

  for (let r = 1; r <= maxR; r++) {
    const rBig = BigInt(r);
    const sMin = Number((rBig * n + lower + m - 1n) / m);
    const sMax = Number((rBig * n + upper - 1n) / m);
    const lo = Math.max(2, sMin);
    const hi = Math.min(maxS, sMax);
    for (let s = lo; s <= hi; s++) {
      validPositions.add(s);
    }
  }

  // Build response string: "1,0,0,1,0,..."
  const parts: string[] = [];
  for (let s = 1; s <= maxS; s++) {
    parts.push(validPositions.has(s) ? '1' : '0');
  }

  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: parts.join(',') };
};
`;export{e as default};