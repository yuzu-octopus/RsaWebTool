import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'homomorphic-forgery',
  name: 'Homomorphic Forgery Attack',
  category: 'Message / Protocol',
  description: 'Forges signature via multiplicative property. Use when oracle signs chosen messages.',
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
            v = power_mod(s_i, e, n)
            valid = "OK" if v == m_i else "FAIL"
            print(f"Pair {i+1}: s_i^e mod n = {v}, m_i = {m_i} [{valid}]")
        # Multiplicative forgery: compute product of all oracle signatures
        # If target_m = product of oracle messages (mod n), then
        # forged_sig = product of oracle signatures (mod n)
        from itertools import combinations
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
                    v = power_mod(prod_s, e, n)
                    if v == target_m % n:
                        print(f"Forged signature from pairs {[i+1 for i in combo]}: {prod_s}")
                        print(f"Verification: sig^e mod n = {v}")
                        print("HOMOMORPHIC_FORGERY=SUCCESS")
                        found = True
                        return
        if not found:
            print("Could not factor target_m from oracle pairs using multiplication.")
            print("Try more oracle queries or different combination patterns.")
            print("HOMOMORPHIC_FORGERY=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("HOMOMORPHIC_FORGERY=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} Textbook RSA is multiplicatively homomorphic: \\(s_1 \\cdot s_2 \\bmod n\\) is a valid signature for \\(m_1 \\cdot m_2 \\bmod n\\).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e (modulus, public exponent)
\\item Oracle pairs \\((m_i, s_i)\\) where \\(s_i = m_i^d \\bmod n\\)
\\item Target \\(m^*\\) factors as \\(m^* = \\prod m_i \\pmod{n}\\)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s_1 &= m_1^d \\bmod n, \\quad s_2 = m_2^d \\bmod n \\\\
s &= s_1 \\cdot s_2 \\bmod n \\\\
s^e &= (s_1 \\cdot s_2)^e \\bmod n \\\\
&= s_1^e \\cdot s_2^e \\bmod n \\\\
&= m_1 \\cdot m_2 \\bmod n \\\\
m^* &= \\prod_{i=1}^{k} m_i \\pmod{n} \\\\
s^* &= \\prod_{i=1}^{k} s_i \\bmod n \\\\
(s^*)^e &= m^* \\bmod n \\qed
\\end{align*}

\\textbf{Explanation:} Factor the target message into a product of oracle-signed messages. Multiply the corresponding signatures to forge a valid signature on the target. This works because \\((ab)^d \\equiv a^d \\cdot b^d \\pmod{n}\\).

\\textbf{References:} Rivest, Shamir, Adleman, "A Method for Obtaining Digital Signatures", 1978; Boneh, "Twenty Years of Attacks on RSA", 1999`,
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
