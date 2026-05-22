import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { isqrt } from '../utils/bigint';

export const attack: Attack = {
  id: 'phi-leak',
  name: 'Phi(n) Leak',
  category: 'Advanced',
  description: 'Factors n when φ(n) is leaked. Use when Euler\'s totient φ(n) is known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'phi', label: 'phi(n) (Euler totient)', placeholder: 'Enter phi(n)...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n = Integer(${vals.n})
            phi = Integer(${vals.phi})
            print("Phi(n) leak attack")
            print(f"n = {n}")
            print(f"phi(n) = {phi}")
            print()
            # For n = p*q: phi(n) = (p-1)(q-1) = pq - p - q + 1 = n - p - q + 1
            # So: p + q = n - phi + 1
            # And: p * q = n
            # We solve: x^2 - (p+q)x + pq = 0
            # i.e.: x^2 - (n - phi + 1)x + n = 0
            sum_pq = n - phi + 1
            print(f"p + q = {sum_pq}")
            print(f"p * q = {n}")
            print()
            # Solve quadratic: x^2 - sum_pq * x + n = 0
            discriminant = sum_pq**2 - 4*n
            print(f"Discriminant = {discriminant}")
            if discriminant < 0:
                print("ERROR: Negative discriminant. phi(n) is inconsistent with n.")
                print("PHI_LEAK=FAILED")
            elif discriminant == 0:
                print("ERROR: p = q. n is a perfect square (not valid RSA).")
                print("PHI_LEAK=FAILED")
            else:
                sqrt_disc = isqrt(discriminant)
                if sqrt_disc**2 == discriminant:
                    p = (sum_pq - sqrt_disc) // 2
                    q = (sum_pq + sqrt_disc) // 2
                    print(f"SUCCESS! Factors recovered:")
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print(f"Verification: p * q = {p * q}")
                    print(f"Verification: (p-1)*(q-1) = {(p-1)*(q-1)}")
                    print("PHI_LEAK=SUCCESS")
                else:
                    print(f"Discriminant is not a perfect square: {discriminant}")
                    print("phi(n) may be incorrect, or n has more than 2 prime factors.")
                    print("PHI_LEAK=FAILED")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("PHI_LEAK=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PHI_LEAK=FAILED")
_attack()`,
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const n = BigInt(vals.n);
      const phi = BigInt(vals.phi);

      const sum_pq = n - phi + 1n;
      const discriminant = sum_pq * sum_pq - 4n * n;

      if (discriminant < 0n) {
        return `phi(n) is inconsistent with n.\nDiscriminant is negative: ${discriminant}`;
      }

      const sqrt_disc = isqrt(discriminant);
      if (sqrt_disc * sqrt_disc !== discriminant) {
        return null;
      }

      const p = (sum_pq - sqrt_disc) / 2n;
      const q = (sum_pq + sqrt_disc) / 2n;

      if (p * q !== n) {
        return null;
      }

      const phi_check = (p - 1n) * (q - 1n);

      return [
        `Phi(n) Leak Attack (browser-side, BigInt)`,
        `n = ${n}`,
        `phi(n) = ${phi}`,
        `p + q = ${sum_pq}`,
        `Discriminant = ${discriminant}`,
        ``,
        `Factors recovered:`,
        `p = ${p}`,
        `q = ${q}`,
        `Verification: p * q = ${p * q}`,
        `Verification: (p-1)*(q-1) = ${phi_check}`,
        `phi(n) matches: ${phi_check === phi ? 'YES' : 'NO'}`,
        `PHI_LEAK=SUCCESS`,
      ].join('\n');
    } catch {
      return null;
    }
  },
  proof: `\\textbf{Theorem:} Knowing \\(\\phi(n)\\) for \\(n = pq\\) allows factoring \\(n\\) in polynomial time by solving a quadratic equation.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Modulus \\(n = pq\\) (product of exactly two primes)
\\item Euler's totient \\(\\phi(n) = (p-1)(q-1)\\)
\\item \\(\\Delta = (n - \\phi(n) + 1)^2 - 4n\\) must be a perfect square
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\phi(n) &= (p-1)(q-1) = n - (p + q) + 1 \\\\
s &= p + q = n - \\phi(n) + 1 \\\\
\\Delta &= s^2 - 4n = (p - q)^2 \\\\
p &= \\frac{s - \\sqrt{\\Delta}}{2}, \\quad q = \\frac{s + \\sqrt{\\Delta}}{2} \\qed
\\end{align*}

\\textbf{Explanation:} From $n$ and $\\phi(n)$, we derive the sum $s = p + q$. Together with $pq = n$, this gives a quadratic whose roots are $p$ and $q$. The discriminant is always a perfect square $(p-q)^2$ for valid RSA moduli.

\\textbf{References:} Rivest, Shamir, Adleman, 1978; Menezes et al., "Handbook of Applied Cryptography", Section 8.2.2`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.phi),
};

export const generateTestcase = (): Record<string, string> => {
  const { n, phi } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString(), phi: phi.toString() };
};
