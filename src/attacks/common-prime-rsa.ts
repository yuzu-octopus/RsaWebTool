import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'common-prime-rsa',
  name: 'Common Prime RSA',
  category: 'Factorization',
  description: 'Factors two moduli sharing a prime. Use when n1 and n2 share a factor p.',
  inputs: [
    { name: 'n1', label: 'n1 (first modulus)', placeholder: 'Enter n1...', multiline: true, rows: 3 },
    { name: 'n2', label: 'n2 (second modulus)', placeholder: 'Enter n2...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n1 = Integer(${vals.n1})
            n2 = Integer(${vals.n2})
            print(f"Common Prime RSA Attack")
            print(f"n1 = {n1}")
            print(f"n2 = {n2}")
            print()
            if n1 < 2 or n2 < 2:
                print("Invalid input: moduli must be >= 2")
                print("COMMON_PRIME_RSA=FAILED")
                return
            if n1 == n2:
                print("n1 == n2. No shared factor beyond the number itself.")
                print("COMMON_PRIME_RSA=FAILED")
                return
            p = gcd(n1, n2)
            print(f"gcd(n1, n2) = {p}")
            print()
            if p > 1 and p < n1 and p < n2:
                q1 = n1 // p
                q2 = n2 // p
                print(f"Shared prime: p = {p}")
                print(f"n1 = {p} x {q1}")
                print(f"n2 = {p} x {q2}")
                print(f"Verification: p * q1 = {p * q1} == n1? {p * q1 == n1}")
                print(f"Verification: p * q2 = {p * q2} == n2? {p * q2 == n2}")
                print(f"p is prime: {p.is_prime()}")
                print(f"q1 is prime: {q1.is_prime()}")
                print(f"q2 is prime: {q2.is_prime()}")
                print("COMMON_PRIME_RSA=SUCCESS")
            elif p == 1:
                print("gcd(n1, n2) = 1. No shared prime factor.")
                print("These moduli are coprime. Try other factorization methods.")
                print("COMMON_PRIME_RSA=FAILED")
            else:
                print("Unexpected result. One modulus may divide the other.")
                print("COMMON_PRIME_RSA=FAILED")
        except Exception as e:
            print(f"ERROR: {e}")
            print("COMMON_PRIME_RSA=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("COMMON_PRIME_RSA=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $n_1 = p \\cdot q_1$ and $n_2 = p \\cdot q_2$ share a prime $p$, then $\\gcd(n_1, n_2) = p$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n_1 = p \\cdot q_1$, $n_2 = p \\cdot q_2$ — two RSA moduli
\\item $p$ — shared prime factor
\\item $q_1 \\neq q_2$ — distinct cofactors
\\item $\\gcd(q_1, q_2) = 1$ — cofactors are coprime
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n_1 &= p \\cdot q_1 \\\\
n_2 &= p \\cdot q_2 \\\\
\\gcd(n_1, n_2) &= \\gcd(p \\cdot q_1, p \\cdot q_2) \\\\
&= p \\cdot \\gcd(q_1, q_2) \\\\
&= p \\cdot 1 = p \\qed
\\end{align*}

\\textbf{Explanation:} When two RSA moduli share a prime factor (common in poor RNG implementations), computing their GCD directly reveals the shared prime. Both moduli are instantly factored.

\\textbf{References:} A. K. Lenstra et al., "Ron was wrong, Whit is right" (2012) — found 0.2\\% of RSA keys shared factors`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n1 && !!p.n2,
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const n1 = BigInt(vals.n1);
      const n2 = BigInt(vals.n2);
      if (n1 < 2n || n2 < 2n) {
        return null;
      }
      if (n1 === n2) {
        return null;
      }
      const p = gcd(n1, n2);
      if (p > 1n && p < n1 && p < n2) {
        const q1 = n1 / p;
        const q2 = n2 / p;
        return [
          'Common Prime RSA Attack (browser-side, BigInt)',
          `n1 = ${n1}`,
          `n2 = ${n2}`,
          '',
          `gcd(n1, n2) = ${p}`,
          '',
          `Shared prime: p = ${p}`,
          `n1 = ${p} x ${q1}`,
          `n2 = ${p} x ${q2}`,
          `Verification: p * q1 = ${p * q1} == n1? ${p * q1 === n1}`,
          `Verification: p * q2 = ${p * q2} == n2? ${p * q2 === n2}`,
          'COMMON_PRIME_RSA=SUCCESS',
        ].join('\n');
      }
      if (p === 1n) {
        return null;
      }
      return null;
    } catch {
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const p = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const n1 = p * q1;
  const n2 = p * q2;
  return { n1: n1.toString(), n2: n2.toString() };
};
