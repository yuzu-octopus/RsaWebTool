import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'common-factor',
  name: 'Common Factor Attack',
  category: 'Message / Protocol',
  description: 'Recovers p when p divides m. Use when gcd(c, n) > 1.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c) {
      return `print("ERROR: Missing required inputs (n, c)")
print("COMMON_FACTOR=FAILED")`;
    }
    return `try:
    n = Integer(${vals.n})
    c = Integer(${vals.c})

    print(f"Common Factor Attack")
    print(f"n = {n}")
    print(f"c = {c}")
    print()

    g = gcd(c, n)
    print(f"gcd(c, n) = {g}")

    if g == 1:
        print("gcd(c, n) = 1. No common factor. Message is not a multiple of p or q.")
        print("This attack does not apply.")
        print("COMMON_FACTOR=FAILED")
    elif g == n:
        print("gcd(c, n) = n. c is a multiple of n (c = 0 mod n).")
        print("The message m was 0 or a multiple of n.")
        print("COMMON_FACTOR=FAILED")
    else:
        p = g
        q = n // g
        print(f"\\nCommon factor found!")
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print(f"q is prime: {q.is_prime()}")

        # The message m was a multiple of p (or q)
        # m = k * p for some k
        # c = m^e mod n = (k*p)^e mod n
        # Since p | m, we have m = 0 mod p
        print(f"\\nThe message m is a multiple of p = {p}")
        print(f"m = k * {p} for some integer k")

        # If we know e, we can try to recover k
        # c = (k*p)^e mod (p*q)
        # c/p^e = k^e mod q (if p^e | c)
        # This requires knowing e
        print("COMMON_FACTOR=SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
    print("COMMON_FACTOR=FAILED")
`;
  },
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const n = BigInt(vals.n);
      const c = BigInt(vals.c);
      const g = gcd(c, n);

      if (g === 1n) {
        return "gcd(c, n) = 1. No common factor. Message is not a multiple of p or q.\nThis attack does not apply.";
      }
      if (g === n) {
        return "gcd(c, n) = n. c is a multiple of n (c = 0 mod n).\nThe message m was 0 or a multiple of n.";
      }

      const p = g;
      const q = n / g;
      return [
        `Common Factor Attack (browser-side, BigInt)`,
        `n = ${n}`,
        `c = ${c}`,
        `gcd(c, n) = ${g}`,
        ``,
        `Common factor found!`,
        `p = ${p}`,
        `q = ${q}`,
        `Verification: p * q = ${p * q}`,
      ].join('\n');
    } catch {
      return null;
    }
  },
  proof: `\\textbf{Theorem:} If \\gcd(c, n) > 1 where c = m^e \\bmod n, then \\gcd(c, n) reveals a factor of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, c (modulus, ciphertext)
\\item \\gcd(m, n) > 1 (message is a multiple of p or q)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p \\mid m &\\implies m \\equiv 0 \\pmod{p} \\\\
c = m^e &\\equiv 0 \\pmod{p} \\\\
p \\mid c, \\quad p \\mid n &\\implies p \\mid \\gcd(c, n) \\\\
\\gcd(c, n) < n &\\implies \\gcd(c, n) = p \\text{ (or } q\\text{)} \\\\
q &= n / \\gcd(c, n) \\qed
\\end{align*}

\\textbf{Explanation:} If the message shares a factor with n, the ciphertext does too. GCD(c, n) extracts that prime factor directly, factoring n. This is a degenerate case — proper RSA padding prevents it.

\\textbf{References:} Menezes et al., "Handbook of Applied Cryptography", Section 8.2.2; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.c,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const c = p * BigInt(Math.floor(Math.random() * 1000) + 2);
  return { n: n.toString(), c: c.toString() };
};
