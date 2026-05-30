var e=`import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';
import { gcd, extendedGcd, modPow, modInverse } from '../utils/bigint';

export const attack: Attack = {
  id: 'common-modulus',
  name: 'Common Modulus Attack',
  category: 'Message / Protocol',
  description: "Recovers m from two ciphertexts under the same n with coprime exponents via Bezout's identity. Use when same m encrypted with different e values under same modulus.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e1', label: 'e1 (first exponent)', placeholder: 'Enter first exponent e1...', multiline: true, rows: 3 },
    { name: 'e2', label: 'e2 (second exponent)', placeholder: 'Enter second exponent e2...', multiline: true, rows: 3 },
    { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e1 || !vals.e2 || !vals.c1 || !vals.c2) {
      return \`print("ERROR: Missing required inputs (n, e1, e2, c1, c2)")
print("COMMON_MODULUS=FAILED")\`;
    }
    return \`def _attack():
    try:
        out = []
        n = Integer(\${vals.n})
        e1 = Integer(\${vals.e1})
        e2 = Integer(\${vals.e2})
        c1 = Integer(\${vals.c1})
        c2 = Integer(\${vals.c2})
        # Check gcd(e1, e2) first
        g = gcd(e1, e2)
        out.append(f"gcd(e1, e2) = {g}")
        if g != 1:
            out.append(f"ERROR: gcd(e1, e2) = {g} != 1. Exponents must be coprime.")
            out.append("COMMON_MODULUS=FAILED")
        else:
            # Extended GCD to find a, b such that a*e1 + b*e2 = 1
            _, a, b = xgcd(e1, e2)
            out.append(f"Bezout coefficients: a = {a}, b = {b}")
            out.append(f"Verification: a*e1 + b*e2 = {a*e1 + b*e2}")
            # Compute m = c1^a * c2^b mod n (power_mod handles negative exponents)
            part1 = power_mod(c1, a, n)
            part2 = power_mod(c2, b, n)
            m = (part1 * part2) % n
            out.append(f"Recovered message: m = {m}")
            # Verify
            v1 = power_mod(m, e1, n)
            v2 = power_mod(m, e2, n)
            out.append(f"Verification: m^e1 mod n = {v1} (should equal c1 = {c1})")
            out.append(f"Verification: m^e2 mod n = {v2} (should equal c2 = {c2})")
            if v1 == c1 and v2 == c2:
                out.append("")
                out.append("COMMON_MODULUS=SUCCESS")
            else:
                out.append("COMMON_MODULUS=FAILED")
        print("\\\\n".join(out))
    except Exception as e:
        try:
            out.append(f"ERROR: {e}")
            out.append("COMMON_MODULUS=FAILED")
            print("\\\\n".join(out))
        except:
            print(f"ERROR: {e}")
            print("COMMON_MODULUS=FAILED")
    #
_attack()\`;
  },
  frontendCheck: (vals) => {
    if (!vals.n || !vals.e1 || !vals.e2 || !vals.c1 || !vals.c2) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e1 = BigInt(vals.e1);
      const e2 = BigInt(vals.e2);
      const c1 = BigInt(vals.c1);
      const c2 = BigInt(vals.c2);
      const g = gcd(e1, e2);
      if (g !== 1n) return Promise.resolve(null);
      const { x, y } = extendedGcd(e1, e2);
      let part1: bigint;
      if (x < 0n) {
        const inv = modInverse(c1, n);
        if (!inv) return Promise.resolve(null);
        part1 = modPow(inv, -x, n);
      } else {
        part1 = modPow(c1, x, n);
      }
      let part2: bigint;
      if (y < 0n) {
        const inv = modInverse(c2, n);
        if (!inv) return Promise.resolve(null);
        part2 = modPow(inv, -y, n);
      } else {
        part2 = modPow(c2, y, n);
      }
      const m = (part1 * part2) % n;
      const v1 = modPow(m, e1, n);
      const v2 = modPow(m, e2, n);
      if (v1 === c1 && v2 === c2) {
        return Promise.resolve(\`Recovered message: m = \${m}\\nCOMMON_MODULUS=SUCCESS\`);
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  },
  proof: \`\\\\textbf{Theorem:} Given two ciphertexts $c_1 \\\\equiv m^{e_1} \\\\pmod{n}$ and $c_2 \\\\equiv m^{e_2} \\\\pmod{n}$ with $\\\\gcd(e_1, e_2) = 1$, recover $m$ without factoring $n$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item Same message $m$ encrypted under the same modulus $n$ with two different public exponents $e_1, e_2$
\\\\item $\\\\gcd(e_1, e_2) = 1$, i.e., the exponents are coprime
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\gcd(e_1, e_2) = 1 &\\\\implies \\\\exists\\\\, a, b \\\\in \\\\mathbb{Z} \\\\text{ with } a e_1 + b e_2 = 1 \\\\\\\\
c_1^a \\\\cdot c_2^b &\\\\equiv (m^{e_1})^a \\\\cdot (m^{e_2})^b \\\\pmod{n} \\\\\\\\
&\\\\equiv m^{a e_1 + b e_2} \\\\pmod{n} \\\\\\\\
&\\\\equiv m^1 \\\\equiv m \\\\pmod{n}
\\\\end{align*}
When $a < 0$, compute $c_1^a = (c_1^{-1})^{|a|} \\\\pmod{n}$. Same for $b < 0$.

\\\\textbf{Explanation:} Bezout's identity guarantees integers $a, b$ satisfying $a e_1 + b e_2 = 1$ because $\\\\gcd(e_1, e_2) = 1$. Multiplying $c_1^a \\\\cdot c_2^b$ yields $m^{a e_1 + b e_2} = m$. This is why coprime exponents are essential: if $\\\\gcd(e_1, e_2) > 1$, the GCD may directly factor $n$.

\\\\textbf{References:} Simmons & Norris, 1977; Boneh, "Twenty Years of Attacks on RSA," 1999\`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e1 && !!p.e2 && !!p.c1 && !!p.c2,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const e1 = 65537n, e2 = 104729n;
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  return { n: n.toString(), e1: e1.toString(), e2: e2.toString(), c1: encrypt(m, n, e1).toString(), c2: encrypt(m, n, e2).toString() };
};
`;export{e as default};