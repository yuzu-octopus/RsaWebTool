import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'common-factor',
  name: 'Common Factor Attack',
  category: 'Factorization',
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
    return `def _attack():
    try:
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
            if p.is_prime() and q.is_prime():
                print(f"\\nThe message m is a multiple of p = {p}")
                print(f"m = k * {p} for some integer k")
                print("COMMON_FACTOR=SUCCESS")
            else:
                print("gcd(c, n) did not yield valid prime factors.")
                print("COMMON_FACTOR=FAILED")
    except Exception as e:
        print(f"ERROR: {e}")
        print("COMMON_FACTOR=FAILED")
    #
_attack()`;
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const n = BigInt(vals.n);
      const c = BigInt(vals.c);
      const g = gcd(c, n);

      if (g === 1n) {
        return null;
      }
      if (g === n) {
        return null;
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
        `COMMON_FACTOR=SUCCESS`,
      ].join('\n');
    } catch {
      return null;
    }
  },
  proof: `\\textbf{Theorem:} If \\gcd(m,n) > 1, then \\gcd(c,n) reveals a factor of n.

\\textbf{Setup:}
\\begin{itemize}
\\item n = pq
\\item p \\mid m
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p \\mid m &\\implies m \\equiv 0 \\pmod{p} \\\\
c = m^e &\\equiv 0 \\pmod{p} \\\\
p \\mid c, \\quad p \\mid n &\\implies p = \\gcd(c,n) \\\\
q &= n/p \\qed
\\end{align*}

\\textbf{References:} Menezes et al., "HAC"; Boneh, 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.c,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n, e } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  // The message m is a multiple of p, so c = m^e mod n will also share factor p.
  // gcd(c, n) reveals p.
  const m = p * BigInt(Math.floor(Math.random() * 1000) + 2);
  const c = encrypt(m, n, e);
  return { n: n.toString(), c: c.toString() };
};
