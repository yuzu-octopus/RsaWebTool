import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'rsa-crt-fault',
  name: 'RSA-CRT Fault Attack (Bellcore)',
  category: 'Message / Protocol',
  description: 'Recovers p from faulty CRT signature. Use when a signature was computed with CRT fault.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'm', label: 'm (message)', placeholder: 'Enter message m...', multiline: true, rows: 3 },
    { name: 'sig_valid', label: 'Valid signature', placeholder: 'Enter valid signature...', multiline: true, rows: 3 },
    { name: 'sig_faulty', label: 'Faulty signature', placeholder: 'Enter faulty signature...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.m || !vals.sig_valid || !vals.sig_faulty) {
      return `print("ERROR: Missing required inputs (n, e, m, sig_valid, sig_faulty)")
print("RSA_CRT_FAULT=FAILED")`;
    }
    return `try:
    n = Integer(${vals.n})
    e = Integer(${vals.e})
    m = Integer(${vals.m})
    sig_valid = Integer(${vals.sig_valid})
    sig_faulty = Integer(${vals.sig_faulty})

    print(f"RSA-CRT Fault Attack (Bellcore Attack)")
    print(f"n = {n}")
    print()

    # Verify the valid signature
    v_valid = power_mod(sig_valid, e, n)
    print(f"Valid signature verification: sig_valid^e mod n = {v_valid}")
    print(f"Expected (m): {m}")
    print(f"Valid: {v_valid == m}")
    print()

    # The faulty signature is correct mod one prime but wrong mod the other
    # gcd(sig_faulty^e - m, n) reveals one factor

    sig_faulty_e = power_mod(sig_faulty, e, n)
    print(f"Faulty signature verification: sig_faulty^e mod n = {sig_faulty_e}")
    print()

    # Compute GCD
    g = gcd(sig_faulty_e - m, n)
    print(f"gcd(sig_faulty^e - m, n) = {g}")

    if 1 < g < n:
        p = g
        q = n // g
        print(f"\\nFactorization found!")
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print(f"q is prime: {q.is_prime()}")

        # Compute private key
        phi = (p - 1) * (q - 1)
        d = power_mod(e, -1, phi)
        print(f"\\nPrivate exponent: d = {d}")

        # Verify with valid signature
        sig_recovered = power_mod(m, d, n)
        print(f"Recovered signature: {sig_recovered}")
        print(f"Matches valid signature: {sig_recovered == sig_valid}")
        print("RSA_CRT_FAULT=SUCCESS")
    else:
        print("GCD did not reveal a factor. The fault may not be a CRT fault.")
        print("RSA_CRT_FAULT=FAILED")
except Exception as e:
    print(f"ERROR: {e}")
    print("RSA_CRT_FAULT=FAILED")
`;
  },
  proof: `\\textbf{Theorem:} A single faulty RSA-CRT signature s' on known message m factors n via \\gcd(s'^e - m, n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, m, s_{valid}, s_{faulty} (modulus, exponent, message, valid and faulty signatures)
\\item n = pq, fault in one CRT component only
\\item s' \\equiv s \\pmod{p} but s' \\not\\equiv s \\pmod{q}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s &\\equiv m^d \\pmod{n} \\\\
s' &\\equiv s \\pmod{p}, \\quad s' \\not\\equiv s \\pmod{q} \\\\
s'^e &\\equiv s^e \\equiv m \\pmod{p} \\\\
s'^e &\\not\\equiv m \\pmod{q} \\\\
p \\mid (s'^e - m), \\quad q &\\nmid (s'^e - m) \\\\
\\gcd(s'^e - m, n) &= p \\\\
q &= n / p \\qed
\\end{align*}

\\textbf{Explanation:} A CRT fault makes the signature correct mod one prime but wrong mod the other. Raising the faulty signature to e and subtracting m yields a value divisible by exactly one prime factor. GCD with n extracts it.

\\textbf{References:} Boneh, DeMillo, Lipton, "On the Importance of Checking Cryptographic Protocols for Faults", Eurocrypt 1997; Joye, "Fault Injection Attacks on CRT-RSA", 2012`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.sig_valid && !!p.sig_faulty,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d, p } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const sigValid = modPow(m, d, n);
  const dp = d % (p - 1n);
  const sigFaulty = modPow(m, dp, p);
  return { n: n.toString(), e: e.toString(), m: m.toString(), sig_valid: sigValid.toString(), sig_faulty: sigFaulty.toString() };
};
