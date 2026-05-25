import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'small-public-exp',
  name: 'Small Public Exponent Analysis',
  category: 'Advanced',
  description: 'Recovers m when m^e < n. Use when e is small and message is short.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '3', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c) {
      return `print("ERROR: Missing required inputs (n, c)")
print("SMALL_PUBLIC_EXP=FAILED")`;
    }
    return `def _attack():
    try:
        n = Integer(${vals.n})
        e_val = "${vals.e}".strip()
        e = Integer(e_val) if e_val else Integer(3)
        c = Integer(${vals.c})
        print(f"Small public exponent analysis")
        print(f"n = {n}")
        print(f"e = {e}")
        print(f"c = {c}")
        print()
        # Check if e is small
        if e >= 100:
            print(f"e = {e} is not considered 'small' for this attack.")
            print("This attack is effective for e in {3, 5, 17}.")
            print("Try other attack methods.")
            print("SMALL_PUBLIC_EXP=FAILED")
        else:
            print(f"e = {e} is small. Checking for vulnerabilities...")
            print()
            # Attack 1: e-th root (m^e < n)
            print("Attack 1: e-th root attack (m^e < n)")
            m_root, exact = c.nth_root(e, truncate_mode=True)
            if exact:
                print(f"SUCCESS! c is a perfect {e}-th power.")
                print(f"m = {m_root}")
                try:
                    m_hex = hex(m_root)[2:]
                    if len(m_hex) % 2 != 0:
                        m_hex = '0' + m_hex
                    m_bytes = bytes.fromhex(m_hex)
                    print(f"m as text: {m_bytes.decode('utf-8', errors='replace')}")
                except Exception:
                    print(f"m as hex: {hex(m_root)}")
                print()
                print("SMALL_PUBLIC_EXP=SUCCESS")
            else:
                print(f"c is not a perfect {e}-th power over integers.")
                print("m^e >= n, so modular reduction occurred.")
                print()
                # Attack 2: Hastad broadcast (need multiple (n, c) pairs)
                print("Attack 2: Hastad broadcast note")
                print("If the SAME message m was encrypted with e = 3")
                print("under 3 DIFFERENT moduli n1, n2, n3, then:")
                print("  m = CRT(c1, c2, c3)^(1/3) over integers")
                print("Provide additional (n, c) pairs to attempt this attack.")
                print()
                # Attack 3: Franklin-Reiter related message
                print("Attack 3: Franklin-Reiter related message note")
                print("If two ciphertexts c1 = m^e and c2 = (m + delta)^e")
                print("are known with the same (n, e), then m can be recovered.")
                print("Provide a second ciphertext to attempt this attack.")
                print()
                print("SMALL_PUBLIC_EXP=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("SMALL_PUBLIC_EXP=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} Small e (3,5,17) enables e-th root, Hastad broadcast, and Franklin-Reiter attacks.

\\textbf{Setup:}
\\begin{itemize}
\\item $e \\in \\{3,5,17\\}$
\\item Known attacks become viable
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{e-th root:} &\\quad m^e < n \\implies m = \\sqrt[e]{c} \\\\
\\text{Hastad:} &\\quad C \\equiv m^e \\pmod{N}, \\; N = \\prod n_i \\\\
&\\quad m^e < N \\implies m = \\sqrt[e]{C} \\\\
\\text{Franklin-Reiter:} &\\quad \\gcd(x^e - c_1, (ax+b)^e - c_2) = x - m \\qed
\\end{align*}

\\textbf{References:} Hastad, 1988; Franklin \\& Reiter, 1996`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.e && p.c),
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, 3n);
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  return { n: n.toString(), e: e.toString(), c: encrypt(m, n, e).toString() };
};
