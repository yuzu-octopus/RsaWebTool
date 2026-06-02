var e=`import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, modInverse } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'homomorphic-forgery',
  name: 'Homomorphic Forgery Attack',
  category: 'Message / Protocol',
  description: "Forges a valid RSA signature by exploiting textbook RSA's multiplicative homomorphism. Use when an oracle signs chosen messages and target is a product of signed messages.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'target_m', label: 'Target message to forge', placeholder: 'Enter target message...', multiline: true, rows: 3 },
    { name: 'oracle_pairs', label: 'Oracle pairs (m,s semicolon-separated)', placeholder: 'm1,s1;m2,s2;m3,s3...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.target_m || !vals.oracle_pairs) {
      return \`print("ERROR: Missing required inputs (n, e, target_m, oracle_pairs)")
print("HOMOMORPHIC_FORGERY=FAILED")\`;
    }
    return wrapSageTemplate({
      token: 'HOMOMORPHIC_FORGERY',
      useGuard: false,
      body: \`        n = Integer(\${vals.n})
        e = Integer(\${vals.e})
        target_m = Integer(\${vals.target_m})
        found = True
        if n < 3 or e < 2:
            out.append("ERROR: Invalid n or e")
            found = False
        else:
            pairs_str = "\${vals.oracle_pairs}".strip()
            if not pairs_str:
                out.append("ERROR: Empty oracle_pairs")
                found = False
            else:
                oracle_pairs = []
                for pair in pairs_str.split(';'):
                    pair = pair.strip()
                    if not pair:
                        continue
                    parts = pair.split(',')
                    if len(parts) < 2:
                        continue
                    m_i = Integer(parts[0].strip())
                    s_i = Integer(parts[1].strip())
                    oracle_pairs.append((m_i, s_i))
                if len(oracle_pairs) < 1:
                    out.append("ERROR: No valid oracle pairs parsed")
                    found = False
        if found:
            out.append("Homomorphic Forgery")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"target_m = {target_m}")
            out.append(f"oracle_pairs = {pairs_str}")
            out.append("")
            out.append("Results:")
            # Meet-in-the-middle: split oracle pairs into two halves
            # Reduces 2^n search to 2^(n/2+1) operations
            mid = len(oracle_pairs) // 2
            left = oracle_pairs[:mid]
            right = oracle_pairs[mid:]
            target_mod = target_m % n
            # Build hash map for right half products
            right_map = {}
            right_count = 1 << len(right)
            for mask in range(1, right_count):
                prod_m = 1
                prod_s = 1
                for j in range(len(right)):
                    if mask & (1 << j):
                        m_i, s_i = right[j]
                        prod_m = (prod_m * m_i) % n
                        prod_s = (prod_s * s_i) % n
                key = prod_m
                if key not in right_map:
                    right_map[key] = []
                right_map[key].append(prod_s)
            # Include empty right subset for left-only solutions
            if 1 not in right_map:
                right_map[1] = []
            right_map[1].append(1)
            # Search left half for matching complement
            found_sig = False
            left_count = 1 << len(left)
            for mask in range(left_count):
                prod_m = 1
                prod_s = 1
                for j in range(len(left)):
                    if mask & (1 << j):
                        m_i, s_i = left[j]
                        prod_m = (prod_m * m_i) % n
                        prod_s = (prod_s * s_i) % n
                if prod_m == 0:
                    continue
                try:
                    inv = inverse_mod(prod_m, n)
                except Exception:
                    continue
                need = (target_mod * inv) % n
                if need in right_map:
                    for r_prod_s in right_map[need]:
                        final_s = (prod_s * r_prod_s) % n
                        if final_s == 0:
                            continue
                        v = Integer(pow(int(final_s), int(e), int(n)))
                        if v == target_mod:
                            out.append(f"s = {final_s}")
                            out.append("")
                            out.append(f"Verification: s^e mod n = {v}")
                            out.append("")
                            out.append("HOMOMORPHIC_FORGERY=SUCCESS")
                            found_sig = True
                            break
                if found_sig:
                    break
            if not found_sig:
                out.append("Could not factor target_m from oracle pairs using multiplication.")
                out.append("")
                out.append("HOMOMORPHIC_FORGERY=FAILED")
        else:
            out.append("HOMOMORPHIC_FORGERY=FAILED")\`,
    });
  },
  frontendCheck: (vals: Record<string, string>, onProgress?: (pct: number, detail?: string) => void) => {
    if (!vals.n || !vals.e || !vals.target_m || !vals.oracle_pairs) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const targetM = BigInt(vals.target_m);

      // Parse oracle pairs: "m1,s1;m2,s2;..."
      const pairs: Array<[bigint, bigint]> = vals.oracle_pairs.split(';')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => {
          const [m, s] = p.split(',').map(x => BigInt(x.trim()));
          return [m, s] as [bigint, bigint];
        });

      if (pairs.length === 0) return Promise.resolve(null);

      // Verify each pair
      for (const [m_i, s_i] of pairs) {
        if (modPow(s_i, e, n) !== m_i) return Promise.resolve(null);
      }

      // Meet-in-the-middle: split oracle pairs into two halves
      // Reduces 2^n search to 2^(n/2+1) operations
      if (pairs.length > 30) return Promise.resolve(null);
      const mid = Math.floor(pairs.length / 2);
      const left = pairs.slice(0, mid);
      const right = pairs.slice(mid);

      // Build hash map for right half products
      const rightMap = new Map<string, { m: bigint; s: bigint }[]>();
      const rightCount = 1 << right.length;
      for (let mask = 1; mask < rightCount; mask++) {
        if (onProgress && mask % 500 === 0) {
          onProgress(Math.round(mask * 50 / rightCount), \`right mask \${mask} / \${rightCount}\`);
        }
        let prodM = 1n, prodS = 1n;
        for (let j = 0; j < right.length; j++) {
          if (mask & (1 << j)) {
            prodM = (prodM * right[j][0]) % n;
            prodS = (prodS * right[j][1]) % n;
          }
        }
        const key = prodM.toString();
        if (!rightMap.has(key)) rightMap.set(key, []);
        rightMap.get(key)!.push({ m: prodM, s: prodS });
      }

      // Search left half for matching complement
      const targetM_mod = targetM % n;
      const leftCount = 1 << left.length;
      for (let mask = 0; mask < leftCount; mask++) {
        if (onProgress && mask % 500 === 0) {
          onProgress(50 + Math.round(mask * 50 / leftCount), \`left mask \${mask} / \${leftCount}\`);
        }
        let prodM = 1n, prodS = 1n;
        for (let j = 0; j < left.length; j++) {
          if (mask & (1 << j)) {
            prodM = (prodM * left[j][0]) % n;
            prodS = (prodS * left[j][1]) % n;
          }
        }
        const inv = modInverse(prodM, n);
        if (inv === null) continue;
        const need = (targetM_mod * inv) % n;
        const rightEntries = rightMap.get(need.toString());
        if (rightEntries) {
          for (const entry of rightEntries) {
            const finalM = (prodM * entry.m) % n;
            const finalS = (prodS * entry.s) % n;
            if (finalM === targetM_mod) {
              onProgress?.(100);
              return Promise.resolve(\`Homomorphic Forgery\\nn = \${n}\\ne = \${e}\\ntarget_m = \${targetM}\\noracle_pairs = \${vals.oracle_pairs}\\n\\nResults:\\ns = \${finalS}\\n\\nVerification: s^e mod n = \${modPow(finalS, e, n)}\\n\\nHOMOMORPHIC_FORGERY=SUCCESS\`);
            }
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: \`\\\\textbf{Theorem:} Textbook RSA signatures are multiplicatively homomorphic: the product of signatures signs the product of messages.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item Oracle signs chosen messages: $s_i = m_i^d \\\\bmod n$
\\\\item Target message $m^*$ factors as $\\\\prod_{i \\\\in I} m_i \\\\pmod{n}$ for some subset $I$ of oracle queries
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
s_1 &= m_1^d \\\\pmod{n} \\\\\\\\
s_2 &= m_2^d \\\\pmod{n} \\\\\\\\
s^* &= s_1 \\\\cdot s_2 \\\\bmod n \\\\\\\\
    &\\\\equiv m_1^d \\\\cdot m_2^d \\\\pmod{n} \\\\\\\\
    &\\\\equiv (m_1 \\\\cdot m_2)^d \\\\pmod{n} \\\\\\\\
(s^*)^e &\\\\equiv m_1 \\\\cdot m_2 \\\\equiv m^* \\\\pmod{n} \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} Since $(m_1 m_2)^d = m_1^d \\\\cdot m_2^d \\\\pmod{n}$, multiplying known signatures yields a valid signature for the product of their messages. The attack searches subsets of oracle pairs whose message-product equals $m^*$, then multiplies the corresponding signatures. Modern padding schemes (OAEP, PSS) destroy this homomorphism by hashing and randomizing before signing.

\\\\textbf{Optimizations:}
\\\\begin{itemize}
\\\\item \\\\textbf{Meet-in-the-middle search:} Splits the $n$ oracle signature pairs into two halves of size $n/2$. Builds a product-to-signature hash map for the right half ($2^{n/2}$ entries), then searches the left half for multiplicative complements that produce the target message. Reduces subset-search complexity from $O(2^n)$ to $O(2^{n/2+1})$ with early stop on first match.
\\\\end{itemize}

\\\\textbf{References:} Rivest, Shamir, Adleman, 1978; Boneh, "Twenty Years of Attacks on RSA," 1999\`,
  usageGuide: 'This attack exploits RSA\\'s multiplicative homomorphism to forge signatures from known oracle pairs.\\n\\nHow to use:\\n1. Obtain oracle pairs (m_i, s_i) where s_i is a valid signature on m_i under the target public key\\n2. Provide n, e, target_m (message to forge), and oracle_pairs formatted as "m1,s1;m2,s2;..."\\n3. The attack uses meet-in-the-middle: split oracle pairs into two halves, build a product hash map for the right half, then search the left half for matching complements. This reduces the 2^n search to 2^(n/2+1) operations.\\n\\nTip: The more oracle pairs you have, the more likely you can factor target_m into a subset product. Up to 30 pairs supported (2^15 + 2^15 ≈ 65K operations). Modern RSA with OAEP/PSS padding prevents this attack.',
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.target_m && !!p.oracle_pairs,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const m1 = 2n, m2 = 3n;
  const s1 = modPow(m1, d, n);
  const s2 = modPow(m2, d, n);
  const targetM = (m1 * m2) % n;
  return { n: n.toString(), e: e.toString(), target_m: targetM.toString(), oracle_pairs: \`\${m1},\${s1};\${m2},\${s2}\` };
};
`;export{e as default};