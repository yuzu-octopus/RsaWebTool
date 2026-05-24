import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, modInverse } from '../utils/bigint';

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
    return `def _attack():
    try:
        n = Integer(${vals.n})
        e = Integer(${vals.e})
        m = Integer(${vals.m})
        sig_valid = Integer(${vals.sig_valid})
        sig_faulty = Integer(${vals.sig_faulty})
        print(f"RSA-CRT Fault Attack (Bellcore Attack)")
        print(f"n = {n}")
        print(f"Valid sig: {sig_valid}")
        # Verify the valid signature
        v_valid = power_mod(sig_valid, e, n)
        print(f"sig_valid^e mod n = {v_valid}")
        print(f"Expected m = {m}")
        print(f"Valid sig check: {v_valid == m}")
        # Faulty signature: correct mod one prime, wrong mod the other
        # gcd(sig_faulty^e - m, n) reveals the factor
        sig_faulty_e = power_mod(sig_faulty, e, n)
        print(f"sig_faulty^e mod n = {sig_faulty_e}")
        # Compute GCD
        g = gcd(sig_faulty_e - m, n)
        print(f"gcd(sig_faulty^e - m, n) = {g}")
        if 1 < g < n:
            p = g
            q = n // g
            print(f"\\nFactorization found!")
            print(f"p = {p}")
            print(f"q = {q}")
            print(f"p * q = {p * q}")
            print(f"p is prime: {p.is_prime()}")
            print(f"q is prime: {q.is_prime()}")
            # Compute private key
            phi = (p - 1) * (q - 1)
            d = inverse_mod(e, phi)
            print(f"\\nPrivate exponent d = {d}")
            # Verify with valid signature
            sig_recovered = power_mod(m, d, n)
            print(f"Recovered sig: {sig_recovered}")
            print(f"Matches valid sig: {sig_recovered == sig_valid}")
            print("RSA_CRT_FAULT=SUCCESS")
        else:
            print("GCD did not reveal a factor. The fault may not be a CRT fault.")
            print("RSA_CRT_FAULT=FAILED")
    except Exception as e:
        print(f"ERROR: {e}")
        print("RSA_CRT_FAULT=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} A single faulty CRT signature s' on known m factors n via \\gcd(s'^e - m, n).

\\textbf{Setup:}
\\begin{itemize}
\\item s' \\equiv s \\pmod{p}, s' \\not\\equiv s \\pmod{q} (single-fault)
\\item n = pq
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s'^e &\\equiv m \\pmod{p} \\\\
s'^e &\\not\\equiv m \\pmod{q} \\\\
p \\mid (s'^e - m), \\quad q &\\nmid (s'^e - m) \\\\
\\gcd(s'^e - m, n) &= p, \\quad q = n/p \\qed
\\end{align*}

\\textbf{References:} Boneh, DeMillo, Lipton, Eurocrypt 1997`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.m && !!p.sig_valid && !!p.sig_faulty,
};

export const generateTestcase = (): Record<string, string> => {
  const { p, q, n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const sigValid = modPow(m, d, n);
  // CRT components: sp = m^dp mod p, sq = m^dq mod q
  const dp = d % (p - 1n);
  const dq = d % (q - 1n);
  const sp = modPow(m, dp, p);
  const sq = modPow(m, dq, q);
  // Fault: flip LSB of q-component so signature is correct mod p but wrong mod q
  const sqFaulty = sq ^ 1n;
  // CRT combine: sig = sp*q*inv_q_mod_p + sq_faulty*p*inv_p_mod_q mod n
  const invQ = modInverse(q % p, p)!;
  const invP = modInverse(p % q, q)!;
  const sigFaulty = (sp * q % n * invQ % n + sqFaulty * p % n * invP % n) % n;
  return { n: n.toString(), e: e.toString(), m: m.toString(), sig_valid: sigValid.toString(), sig_faulty: sigFaulty.toString() };
};
