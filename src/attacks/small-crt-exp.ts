import type { Attack } from '../types';
import { randomPrime, generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse } from '../utils/bigint';

export const attack: Attack = {
  id: 'small-crt-exp',
  name: 'Small CRT Exponent',
  category: 'Partial Key / Lattice',
  description: 'Factors n when d_p = d mod (p-1) is small. Use when d_p < 10^6.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'bound', label: 'bound (max d_p, optional)', placeholder: 'Default 1000000', multiline: false },
  ],
  sageTemplate: (v) => `try:
    n = Integer(${v.n})
    e = Integer(${v.e})
    bound = ${v.bound ? `Integer(${v.bound})` : '1000000'}
    if n <= 0 or e <= 0 or bound <= 0:
        print("SMALL_CRT_EXP=FAILED: invalid input values")
    else:
        found = False
        for k in range(1, e):
            if gcd(e, k) != 1:
                continue
            dp0 = inverse_mod(e, k)
            for dp in range(dp0, bound + 1, k):
                num = dp * e - 1
                p_candidate = num // k + 1
                if n % p_candidate == 0:
                    q = n // p_candidate
                    print(f"Verification: p * q = {p_candidate * q}")
                    print("SMALL_CRT_EXP=SUCCESS")
                    print(f"dp={dp}")
                    print(f"p={p_candidate}")
                    print(f"q={q}")
                    found = True
                    break
            if found:
                break
        if not found:
            print("No small dp found within bound.")
            print("SMALL_CRT_EXP=FAILED")
except Exception as ex:
    print(f"SMALL_CRT_EXP=FAILED: {ex}")`,
  proof: '\\textbf{Theorem:} If $d_p = d \\bmod (p-1)$ is small, $p$ can be recovered by searching.\\newline\\newline\\textbf{Prerequisites:} RSA-CRT, modular arithmetic\\newline\\newline\\textbf{Proof:}\\begin{align*}d_p \\cdot e &\\equiv 1 \\pmod{p-1} \\\\ d_p \\cdot e - 1 &= k(p-1) \\\\ p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\\\ \\text{For small } d_p, &\\text{ iterate and check } p \\mid n\\end{align*}\\newline\\textbf{References:} Standard RSA-CRT analysis',
  priority: 'medium',
  applicableCheck: (p) => !!p.n && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 65537n;
  // Strategy: find p where d_p = e^(-1) mod (p-1) is small
  // d_p * e ≡ 1 (mod p-1) → d_p = e^(-1) mod (p-1)
  // We need d_p < bound (default 10^6)
  for (let attempt = 0; attempt < 500; attempt++) {
    const p = randomPrime(TESTCASE_BITS.p);
    const phi_p = p - 1n;
    // Compute d_p = e^(-1) mod (p-1)
    const dp = modInverse(e, phi_p);
    if (dp !== null && dp < 1000000n && dp > 1n) {
      const q = randomPrime(TESTCASE_BITS.q);
      const n = p * q;
      return { n: n.toString(), e: e.toString() };
    }
  }
  // Fallback
  const pair = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: pair.n.toString(), e: pair.e.toString() };
};
