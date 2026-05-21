import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'implicit-key-exposure',
  name: 'Implicit Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from a^p mod n leak. Use when a^p mod n is accidentally exposed.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'a', label: 'a (base)', placeholder: 'Enter base a...', multiline: false },
    { name: 'leak', label: 'leak (a^p mod n)', placeholder: 'Enter leaked value...', multiline: true, rows: 3 },
  ],
  sageTemplate: (v) => `def _attack():
    try:
        try:
            n = Integer(${v.n})
            a = Integer(${v.a})
            leak = Integer(${v.leak})
            if n < 2 or a < 2 or leak < 0:
                print("Invalid input")
                print("IMPLICIT_KEY_EXPOSURE=FAILED")
                return
            print(f"Implicit Key Exposure Attack")
            print(f"n = {n}")
            print(f"a = {a}")
            print(f"leak = a^p mod n = {leak}")
            print()
            # By Fermat's little theorem: a^p = a (mod p)
            # leak = a^p (mod n) => leak = a^p (mod p) => leak = a (mod p)
            # Therefore: p | (leak - a) => p = gcd(leak - a, n)
            g = gcd(leak - a, n)
            print(f"gcd(leak - a, n) = {g}")
            print()
            if g > 1 and g < n:
                p = g
                q = n // p
                print(f"p = {p}")
                print(f"q = {q}")
                print(f"Verification: p * q = {p * q}")
                print(f"Verification: a^p mod n = {power_mod(a, p, n)} == leak? {power_mod(a, p, n) == leak}")
                print("IMPLICIT_KEY_EXPOSURE=SUCCESS")
            else:
                print("gcd(leak - a, n) = 1 or n. Fermat trick failed.")
                print("Possible causes: p divides a, or leak is not a^p mod n.")
                print("IMPLICIT_KEY_EXPOSURE=FAILED")
        except Exception as ex:
            print(f"IMPLICIT_KEY_EXPOSURE=FAILED: {ex}")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("IMPLICIT_KEY_EXPOSURE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $a^p \\bmod n$ is leaked, $p$ is recovered via $\\gcd(a - \\text{leak}, n)$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n = pq$ — RSA modulus
\\item $a$ — known base, $p \\nmid a$
\\item $\\text{leak} = a^p \\bmod n$
\\item Fermat's little theorem: $a^p \\equiv a \\pmod{p}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{leak} &\\equiv a^p \\pmod{n} \\\\
\\text{leak} &\\equiv a^p \\pmod{p} \\\\
a^p &\\equiv a \\pmod{p} \\quad \\text{(Fermat's little theorem)} \\\\
\\text{leak} &\\equiv a \\pmod{p} \\\\
p &\\mid (\\text{leak} - a) \\\\
p &= \\gcd(\\text{leak} - a, n) \\qed
\\end{align*}

\\textbf{Explanation:} By Fermat's little theorem, $a^p \\equiv a \\pmod{p}$ for any $a$ not divisible by $p$. Since leak $\\equiv a^p \\pmod{n}$, we also have leak $\\equiv a^p \\pmod{p}$. Combining: leak $\\equiv a \\pmod{p}$, so $p$ divides $(\\text{leak} - a)$. Computing $\\gcd(\\text{leak} - a, n)$ recovers $p$ in one step.

\\textbf{References:} Common CTF pattern; based on Fermat's Little Theorem`,
  priority: 'high',
  applicableCheck: (p) => !!p.n && !!p.a && !!p.leak,
  frontendCheck: async (vals) => {
    try {
      const n = BigInt(vals.n);
      const a = BigInt(vals.a);
      const leak = BigInt(vals.leak);
      const g = gcd(leak - a, n);
      if (g > 1n && g < n) {
        const p = g;
        const q = n / p;
        return [
          `Implicit Key Exposure Attack (browser-side, BigInt)`,
          `n = ${n}`,
          `a = ${a}`,
          `leak = ${leak}`,
          ``,
          `Factors recovered:`,
          `p = ${p}`,
          `q = ${q}`,
          `Verification: p * q = ${p * q}`,
          `Verification: a^p mod n = ${modPow(a, p, n)} == leak? ${modPow(a, p, n) === leak}`,
        ].join('\n');
      }
      return null;
    } catch {
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const { p, n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const a = 3n;
  const leak = modPow(a, p, n);
  return { n: n.toString(), a: a.toString(), leak: leak.toString() };
};
