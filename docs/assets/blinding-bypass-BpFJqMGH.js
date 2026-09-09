var e=`import type { Attack } from '../types';
import { modInverse, modPow } from '../utils/bigint';
import { generateKeyPair } from '../utils/testcases/core';
import { wrapSageTemplate, validateNumeric } from './guard';

export const attack: Attack = {
  id: 'blinding-decryption-bypass',
  name: 'Blinding Decryption Bypass',
  category: 'Oracle',
  description:
    'Decrypts c via a signing/decryption oracle that refuses c itself: blind c\\' = c·r^e, query the oracle for m\\' = m·r, unblind m = m\\'·r^{-1}. Use when the oracle signs arbitrary blinded values.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (target ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'r', label: 'r (blinding factor)', placeholder: 'Random r coprime to n...', multiline: true, rows: 3 },
    { name: 'm_blind', label: "m_blind (oracle's decryption of c·r^e)", placeholder: "Enter oracle response m'...", multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c || !vals.r || !vals.m_blind) {
      return \`print("ERROR: Missing required inputs (n, e, c, r, m_blind)")
print("BLINDING_BYPASS=FAILED")\`;
    }
    return wrapSageTemplate({
      token: 'BLINDING_BYPASS',
      useGuard: false,
      body: \`        n = Integer(\${validateNumeric(vals.n, 'n')})
        e = Integer(\${validateNumeric(vals.e, 'e')})
        c = Integer(\${validateNumeric(vals.c, 'c')})
        r = Integer(\${validateNumeric(vals.r, 'r')})
        m_blind = Integer(\${validateNumeric(vals.m_blind, 'm_blind')})
        out.append("Blinding Decryption Bypass")
        out.append(f"n = {n}")
        out.append(f"e = {e}")
        out.append(f"c = {c}")
        out.append(f"r = {r}")
        out.append("")
        found = True
        if gcd(r, n) != 1:
            out.append("ERROR: r must be coprime to n")
            found = False
        else:
            c_blind = (c * power_mod(r, e, n)) % n
            if power_mod(m_blind, e, n) != c_blind:
                out.append(f"Oracle response does not decrypt the blinded ciphertext (m'^e mod n = {power_mod(m_blind, e, n)} != {c_blind}).")
                found = False
        if found:
            m = (m_blind * inverse_mod(r, n)) % n
            out.append("Results:")
            out.append(f"m = {m}")
            out.append("")
            out.append(f"Verification: m^e mod n = {power_mod(m, e, n)}")
            out.append("")
            if power_mod(m, e, n) == c:
                out.append("BLINDING_BYPASS=SUCCESS")
            else:
                out.append("BLINDING_BYPASS=FAILED")
        else:
            out.append("BLINDING_BYPASS=FAILED")\`,
    });
  },
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c || !vals.r || !vals.m_blind) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const c = BigInt(vals.c);
      const r = BigInt(vals.r);
      const mBlind = BigInt(vals.m_blind);
      const rInv = modInverse(r, n);
      if (rInv === null) {
        return Promise.resolve(
          \`Blinding Decryption Bypass\\nn = \${n}\\ne = \${e}\\n\\nERROR: r shares a factor with n (no inverse).\\n\\nBLINDING_BYPASS=FAILED\`,
        );
      }
      const cBlind = ((c % n) * modPow(r, e, n)) % n;
      if (modPow(mBlind, e, n) !== cBlind) return Promise.resolve(null);
      const m = (mBlind * rInv) % n;
      if (modPow(m, e, n) !== ((c % n) + n) % n) return Promise.resolve(null);
      return Promise.resolve(
        \`Blinding Decryption Bypass\\nn = \${n}\\ne = \${e}\\nc = \${c}\\nr = \${r}\\n\\nResults:\\nm = \${m}\\n\\nVerification: m^e mod n = \${modPow(m, e, n)}\\n\\nBLINDING_BYPASS=SUCCESS\`,
      );
    } catch (err) {
      console.warn('[blinding-decryption-bypass] frontendCheck error:', err);
      return Promise.resolve(null);
    }
  },
  proof: \`\\\\textbf{Theorem:} A decryption oracle that refuses the target $c$ still decrypts it under blinding: query $c' = c \\\\cdot r^e \\\\bmod n$, get $m' = m \\\\cdot r \\\\bmod n$, unblind $m = m' \\\\cdot r^{-1} \\\\bmod n$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item Oracle $\\\\mathcal{O}(x) = x^d \\\\bmod n$ refuses $x = c$ but answers anything else
\\\\item $r$ uniform with $\\\\gcd(r, n) = 1$
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
c' &= c \\\\cdot r^e \\\\equiv m^e r^e \\\\equiv (mr)^e \\\\pmod{n} \\\\\\\\
m' &= \\\\mathcal{O}(c') \\\\equiv (mr)^{ed} \\\\equiv mr \\\\pmod{n} \\\\\\\\
m' \\\\cdot r^{-1} &\\\\equiv mr \\\\cdot r^{-1} \\\\equiv m \\\\pmod{n} \\\\\\\\
(m' r^{-1})^e &\\\\equiv m^e \\\\equiv c \\\\pmod{n} \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} Textbook RSA is multiplicatively homomorphic, so multiplying the ciphertext by $r^e$ multiplies the plaintext by $r$. The oracle sees only the uniformly random $c'$, which it decrypts willingly; dividing out $r$ recovers $m$. The tool verifies $m'^e \\\\equiv c'$ (oracle honesty) and $m^e \\\\equiv c$ (unblind correctness). Defences: structured padding (OAEP/PSS) and refusing related-message queries.

\\\\textbf{See also:} Homomorphic Forgery (signature side of the same homomorphism).

\\\\textbf{References:} D. Chaum, "Blind Signatures for Untraceable Payments", Crypto 1982; Menezes et al., Handbook of Applied Cryptography, Note 8.48\`,
  usageGuide: \`Use when a decryption/signing oracle refuses the target ciphertext itself but answers related queries (chosen-ciphertext setting).

How to use (blind / query / unblind):
1. Blind: pick random r coprime to n, send c' = c·r^e mod n to the oracle
2. Query: the oracle returns m' = (c')^d mod n = m·r mod n
3. Unblind: provide n, e, c, r, m_blind (= m'); the tool checks m'^e = c' and outputs m = m'·r^{-1} mod n, verified by m^e = c

Query-generator snippet (offline simulation against a known key):
  r = random coprime to n; c_blind = c * pow(r, e, n) % n; m_blind = pow(c_blind, d, n)

Tip: The oracle learns nothing about m (c' is uniform), which is exactly why naive "refuse c" filtering fails. See also Homomorphic Forgery.\`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.r && !!p.m_blind,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(256, 256);
  const mBytes = new Uint8Array(16);
  crypto.getRandomValues(mBytes);
  let m = 0n;
  for (const b of mBytes) m = (m << 8n) | BigInt(b);
  m = (m % (n - 2n)) + 1n;
  const c = modPow(m, e, n);
  // Random blinding factor coprime to n.
  const rBytes = new Uint8Array(16);
  let r: bigint;
  do {
    crypto.getRandomValues(rBytes);
    r = 0n;
    for (const b of rBytes) r = (r << 8n) | BigInt(b);
    r = (r % (n - 2n)) + 1n;
  } while (modInverse(r, n) === null);
  const mBlind = (m * r) % n;
  void d;
  return { n: n.toString(), e: e.toString(), c: c.toString(), r: r.toString(), m_blind: mBlind.toString() };
};
`;export{e as default};