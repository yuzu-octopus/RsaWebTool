import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, modInverse, gcd } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'rsa-crt-fault',
  name: 'RSA-CRT Fault Attack (Bellcore)',
  category: 'Message / Protocol',
  description: "Factors n from a single faulty CRT signature via gcd. Use when a transient fault corrupts one of two CRT exponentiations during signing.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'm', label: 'm (message)', placeholder: 'Enter message m...', multiline: true, rows: 3 },
    { name: 'sig_valid', label: 'Valid signature', placeholder: 'Enter valid signature...', multiline: true, rows: 3 },
    { name: 'sig_faulty', label: 'Faulty signature', placeholder: 'Enter faulty signature...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.m || !vals.sig_faulty) {
      return `print("ERROR: Missing required inputs (n, e, m, sig_faulty)")
print("RSA_CRT_FAULT=FAILED")`;
    }
    return wrapSageTemplate({
      token: 'RSA_CRT_FAULT',
      useGuard: false,
      body: `        n = Integer(${vals.n})
        e = Integer(${vals.e})
        m = Integer(${vals.m})
        sig_faulty = Integer(${vals.sig_faulty})
        sig_valid_str = "${(vals.sig_valid || '').trim()}"
        if sig_valid_str:
            sig_valid = Integer(sig_valid_str)
        out.append("RSA-CRT Fault Attack (Bellcore)")
        out.append(f"n = {n}")
        out.append(f"e = {e}")
        out.append(f"m = {m}")
        out.append(f"sig_faulty = {sig_faulty}")
        out.append("")
        out.append("Results:")
        sig_faulty_e = power_mod(sig_faulty, e, n)
        g = gcd(sig_faulty_e - m, n)
        if 1 < g < n:
            p = g
            q = n // g
            out.append(f"p = {p}")
            out.append(f"q = {q}")
            out.append("")
            out.append(f"Verification: p * q = {p * q}")
            out.append("")
            out.append("RSA_CRT_FAULT=SUCCESS")
        else:
            out.append("GCD did not reveal a factor. The fault may not be a CRT fault.")
            out.append("")
            out.append("RSA_CRT_FAULT=FAILED")`,
    });
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
        return Promise.resolve(`RSA-CRT Fault Attack (Bellcore)\nn = ${n}\ne = ${e}\nm = ${m}\nsig_faulty = ${vals.sig_faulty}\n\nResults:\np = ${g_}\nq = ${qq}\n\nVerification: p * q = ${g_ * qq}\n\nRSA_CRT_FAULT=SUCCESS`);
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  },
  proof: `\\textbf{Theorem:} A single faulty CRT signature $s'$ on a known message $m$ reveals the factorization of $n = pq$ via $\\gcd(s'^e - m, n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $s' \\equiv s \\pmod{p}$, $s' \\not\\equiv s \\pmod{q}$ (fault in one CRT branch only)
\\item $n = pq$, message $m$ known, faulty signature $s'$ observed
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s &\\equiv m^d \\pmod{n} \\quad \\text{(correct signature)} \\\\
s'^e &\\equiv m \\pmod{p} \\quad \\text{(fault-free branch)} \\\\
s'^e &\\not\\equiv m \\pmod{q} \\quad \\text{(corrupted branch)} \\\\
p &\\mid (s'^e - m), \\quad q \\nmid (s'^e - m) \\\\
\\gcd(s'^e - m, n) &= p \\\\[4pt]
q &= n / p \\qed
\\end{align*}

\\textbf{Explanation:} CRT signing computes $s_p = m^{d_p} \\bmod p$ and $s_q = m^{d_q} \\bmod q$ separately, then combines. If a transient fault corrupts $s_q$ but leaves $s_p$ correct, the faulty signature $s'$ is valid modulo $p$ but invalid modulo $q$. The GCD of $(s'^e - m)$ with $n$ reveals $p$ directly.

\\textbf{References:} Boneh, DeMillo, Lipton, "On the Importance of Checking Cryptographic Protocols for Faults," Eurocrypt 1997`,
  usageGuide: 'This attack exploits a faulty RSA-CRT signature. When a transient fault corrupts the CRT computation, the faulty signature leaks one prime factor.\n\nHow to use:\n1. Obtain a valid signature sig_valid for a message m\n2. Obtain a faulty signature sig_faulty for the same message m from a fault-injected device\n3. The attack computes gcd(sig_faulty^e - m, n) to recover p\n\nRequired: n, e, m (the signed message as an integer), sig_valid, sig_faulty\n\nTip: The two signatures must be from the SAME message using the SAME key. The fault must affect only one of the two CRT exponentiations.',
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.m && !!p.sig_faulty,
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
