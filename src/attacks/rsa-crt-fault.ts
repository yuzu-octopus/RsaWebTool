import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, modInverse, gcd } from '../utils/bigint';

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
            print(f"Verification: p * q = {p * q}")
            print(f"p is prime: {p.is_prime()}")
            print(f"q is prime: {q.is_prime()}")
            print(f"p = {p}")
            print(f"q = {q}")
            # Compute private key
            phi = (p - 1) * (q - 1)
            d = inverse_mod(e, phi)
            print(f"\\nPrivate exponent d = {d}")
            # Verify with valid signature
            sig_recovered = power_mod(m, d, n)
            print(f"Recovered sig: {sig_recovered}")
            print(f"Matches valid sig: {sig_recovered == sig_valid}")
            print()
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
  frontendCheck: (vals) => {
    if (!vals.n || !vals.e || !vals.m || !vals.sig_faulty) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const m = BigInt(vals.m);
      const sig_faulty = BigInt(vals.sig_faulty);
      const v = modPow(sig_faulty, e, n);
      const g_ = gcd(v - m, n);
      if (g_ > 1n && g_ < n) {
        const qq = n / g_;
        const phi = (g_ - 1n) * (qq - 1n);
        const d = modInverse(e, phi);
        const dLine = d ? `\nPrivate exponent d = ${d}` : '';
        return Promise.resolve(`Factor found!\np = ${g_}\nq = ${qq}${dLine}`);
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
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
  usageGuide: 'This attack exploits a faulty RSA-CRT signature. When a transient fault corrupts the CRT computation, the faulty signature leaks one prime factor.\n\nHow to use:\n1. Obtain a valid signature sig_valid for a message m (or compute hash_hex yourself)\n2. Obtain a faulty signature sig_faulty for the same m from a fault-injected device\n3. The attack computes gcd(sig_faulty^e - m, n) to recover p\n\nRequired: n, e, hash_hex (the signed message as hex), sig_valid, sig_faulty\n\nTip: The two signatures must be from the SAME message using the SAME key. The fault must affect only one of the two CRT exponentiations.',
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
