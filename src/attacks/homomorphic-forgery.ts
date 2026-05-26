import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

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
      return `print("ERROR: Missing required inputs (n, e, target_m, oracle_pairs)")
print("HOMOMORPHIC_FORGERY=FAILED")`;
    }
    return `def _attack():
    from itertools import combinations
    try:
        n = Integer(${vals.n})
        e = Integer(${vals.e})
        target_m = Integer(${vals.target_m})
        if n < 3 or e < 2:
            print("ERROR: Invalid n or e")
            print("HOMOMORPHIC_FORGERY=FAILED")
            return
        # Parse oracle pairs
        pairs_str = "${vals.oracle_pairs}".strip()
        if not pairs_str:
            print("ERROR: Empty oracle_pairs")
            print("HOMOMORPHIC_FORGERY=FAILED")
            return
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
            print("ERROR: No valid oracle pairs parsed")
            print("HOMOMORPHIC_FORGERY=FAILED")
            return
        print("Homomorphic Forgery Attack")
        print(f"Target message: {target_m}")
        print(f"Oracle pairs: {len(oracle_pairs)}")
        # Verify oracle pairs
        for i, (m_i, s_i) in enumerate(oracle_pairs):
            v = Integer(pow(int(s_i), int(e), int(n)))
            valid = "OK" if v == m_i else "FAIL"
            print(f"Pair {i+1}: s_i^e mod n = {v}, m_i = {m_i} [{valid}]")
        # Multiplicative forgery: compute product of all oracle signatures
        # If target_m = product of oracle messages (mod n), then
        # forged_sig = product of oracle signatures (mod n)
        found = False
        for r in range(1, len(oracle_pairs) + 1):
            for combo in combinations(range(len(oracle_pairs)), r):
                prod_m = 1
                prod_s = 1
                for idx in combo:
                    m_i, s_i = oracle_pairs[idx]
                    prod_m = (prod_m * m_i) % n
                    prod_s = (prod_s * s_i) % n
                if prod_m == target_m % n:
                    v = Integer(pow(int(prod_s), int(e), int(n)))
                    if v == target_m % n:
                        print(f"Forged signature from pairs {[i+1 for i in combo]}: {prod_s}")
                        print(f"Verification: sig^e mod n = {v}")
                        print()
                        print("HOMOMORPHIC_FORGERY=SUCCESS")
                        found = True
                        return
        if not found:
            print("Could not factor target_m from oracle pairs using multiplication.")
            print("Try more oracle queries or different combination patterns.")
            print()
            print("HOMOMORPHIC_FORGERY=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("HOMOMORPHIC_FORGERY=FAILED")
    #
_attack()`;
  },
  frontendCheck: (vals: Record<string, string>, onProgress?: (pct: number) => void) => {
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

      // Powerset search (limited to 15 pairs — 2^15 = 32768 subsets)
      if (pairs.length > 15) return Promise.resolve(null);
      const count = 1 << pairs.length;
      for (let mask = 1; mask < count; mask++) {
        if (onProgress && count > 100 && mask % 1000 === 0) {
          onProgress(Math.round(mask * 100 / count));
        }
        let prodM = 1n, prodS = 1n;
        for (let i = 0; i < pairs.length; i++) {
          if (mask & (1 << i)) {
            prodM = (prodM * pairs[i][0]) % n;
            prodS = (prodS * pairs[i][1]) % n;
          }
        }
        if (prodM === targetM) {
          onProgress?.(100);
          return Promise.resolve(`Factor found!\nForged signature: s = ${prodS}\nVerification: s^e mod n = ${modPow(prodS, e, n)}\nHOMOMORPHIC_FORGERY=SUCCESS`);
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} Textbook RSA signatures are multiplicatively homomorphic: the product of signatures signs the product of messages.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle signs chosen messages: $s_i = m_i^d \\bmod n$
\\item Target message $m^*$ factors as $\\prod_{i \\in I} m_i \\pmod{n}$ for some subset $I$ of oracle queries
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s_1 &= m_1^d \\pmod{n} \\\\
s_2 &= m_2^d \\pmod{n} \\\\
s^* &= s_1 \\cdot s_2 \\bmod n \\\\
    &\\equiv m_1^d \\cdot m_2^d \\pmod{n} \\\\
    &\\equiv (m_1 \\cdot m_2)^d \\pmod{n} \\\\
(s^*)^e &\\equiv m_1 \\cdot m_2 \\equiv m^* \\pmod{n} \\qed
\\end{align*}

\\textbf{Explanation:} Since $(m_1 m_2)^d = m_1^d \\cdot m_2^d \\pmod{n}$, multiplying known signatures yields a valid signature for the product of their messages. The attack searches subsets of oracle pairs whose message-product equals $m^*$, then multiplies the corresponding signatures. Modern padding schemes (OAEP, PSS) destroy this homomorphism by hashing and randomizing before signing.

\\textbf{References:} Rivest, Shamir, Adleman, 1978; Boneh, "Twenty Years of Attacks on RSA," 1999`,
  usageGuide: 'This attack exploits RSA\'s multiplicative homomorphism to forge signatures from known oracle pairs.\n\nHow to use:\n1. Obtain oracle pairs (m_i, s_i) where s_i is a valid signature on m_i under the target public key\n2. Provide n, e, target_m (message to forge), and oracle_pairs formatted as "m1,s1;m2,s2;..."\n3. The attack searches subset products: if target_m = product of some subset of m_i (mod n), then the forged signature = product of the corresponding s_i (mod n)\n\nTip: The more oracle pairs you have, the more likely you can factor target_m into a subset product. Modern RSA with OAEP/PSS padding prevents this attack.',
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.target_m && !!p.oracle_pairs,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const m1 = 2n, m2 = 3n;
  const s1 = modPow(m1, d, n);
  const s2 = modPow(m2, d, n);
  const targetM = (m1 * m2) % n;
  return { n: n.toString(), e: e.toString(), target_m: targetM.toString(), oracle_pairs: `${m1},${s1};${m2},${s2}` };
};
