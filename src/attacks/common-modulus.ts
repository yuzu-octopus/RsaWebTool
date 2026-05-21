import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'common-modulus',
  name: 'Common Modulus Attack',
  category: 'Message / Protocol',
  description: 'Recovers m from two encryptions under same n. Use when same message encrypted with coprime e1, e2.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e1', label: 'e1 (first exponent)', placeholder: 'Enter first exponent e1...', multiline: true, rows: 3 },
    { name: 'e2', label: 'e2 (second exponent)', placeholder: 'Enter second exponent e2...', multiline: true, rows: 3 },
    { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e1 || !vals.e2 || !vals.c1 || !vals.c2) {
      return `print("ERROR: Missing required inputs (n, e1, e2, c1, c2)")
print("COMMON_MODULUS=FAILED")`;
    }
    return `def _attack():
    try:
        n = Integer(${vals.n})
        e1 = Integer(${vals.e1})
        e2 = Integer(${vals.e2})
        c1 = Integer(${vals.c1})
        c2 = Integer(${vals.c2})
        # Check gcd(e1, e2) first
        g = gcd(e1, e2)
        print(f"gcd(e1, e2) = {g}")
        if g != 1:
            print(f"ERROR: gcd(e1, e2) = {g} != 1. Exponents must be coprime.")
            print("COMMON_MODULUS=FAILED")
        else:
            # Extended GCD to find a, b such that a*e1 + b*e2 = 1
            _, a, b = xgcd(e1, e2)
            print(f"Bezout coefficients: a = {a}, b = {b}")
            print(f"Verification: a*e1 + b*e2 = {a*e1 + b*e2}")
            # Compute m = c1^a * c2^b mod n (power_mod handles negative exponents)
            part1 = power_mod(c1, a, n)
            part2 = power_mod(c2, b, n)
            m = (part1 * part2) % n
            print(f"Recovered message: m = {m}")
            # Verify
            v1 = power_mod(m, e1, n)
            v2 = power_mod(m, e2, n)
            print(f"Verification: m^e1 mod n = {v1} (should equal c1 = {c1})")
            print(f"Verification: m^e2 mod n = {v2} (should equal c2 = {c2})")
            if v1 == c1 and v2 == c2:
                print("COMMON_MODULUS=SUCCESS")
            else:
                print("COMMON_MODULUS=FAILED")
    except Exception as e:
        print(f"ERROR: {e}")
        print("COMMON_MODULUS=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} Let n be an RSA modulus and e\\_1, e\\_2 be coprime exponents. Given c\\_1 \\equiv m^{e\\_1} \\pmod{n} and c\\_2 \\equiv m^{e\\_2} \\pmod{n}, recover m via Bezout coefficients.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e\\_1, e\\_2, c\\_1, c\\_2 (modulus, two exponents, two ciphertexts)
\\item \\gcd(e\\_1, e\\_2) = 1
\\item Same m encrypted under both exponents
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\gcd(e_1, e_2) = 1 \\implies \\exists a, b \\in \\mathbb{Z} &: \\\\
a \\cdot e_1 + b \\cdot e_2 &= 1 \\\\
c_1^a \\cdot c_2^b &\\equiv (m^{e_1})^a \\cdot (m^{e_2})^b \\pmod{n} \\\\
&\\equiv m^{a e_1 + b e_2} \\pmod{n} \\\\
&\\equiv m \\\\
a < 0 \\implies c_1^a &= (c_1^{-1})^{|a|} \\pmod{n} \\\\
b < 0 \\implies c_2^b &= (c_2^{-1})^{|b|} \\pmod{n} \\\\
m &= c_1^a \\cdot c_2^b \\pmod{n} \\qed
\\end{align*}

\\textbf{Explanation:} Find Bezout coefficients a, b such that a·e₁ + b·e₂ = 1. Compute c₁ᵃ · c₂ᵇ mod n, using modular inverses for negative coefficients. The exponents cancel to leave m.

\\textbf{References:} Simmons & Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", 1977; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e1 && !!p.e2 && !!p.c1 && !!p.c2,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const e1 = 65537n, e2 = 104729n;
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  return { n: n.toString(), e1: e1.toString(), e2: e2.toString(), c1: encrypt(m, n, e1).toString(), c2: encrypt(m, n, e2).toString() };
};
