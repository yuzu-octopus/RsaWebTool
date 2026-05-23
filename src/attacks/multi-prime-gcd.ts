import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'multi-prime-gcd',
  name: 'Multi-Prime GCD',
  category: 'Advanced',
  description: 'Finds shared primes across multiple moduli via pairwise GCD. Use when given 2+ RSA moduli. Unlike Batch GCD (Factorization category), this attack reports exact moduli pairs that share each factor.',
  inputs: [
    { name: 'moduli_list', label: 'Moduli (one per line)', placeholder: 'Enter multiple moduli, one per line...', multiline: true, rows: 6 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            moduli_str = """${vals.moduli_list}""".strip()
            if not moduli_str:
                print("ERROR: moduli_list is required")
                print("MULTI_PRIME_GCD=FAILED")
                return
            moduli = [Integer(x.strip()) for x in moduli_str.split('\\n') if x.strip()]
            print(f"Multi-Prime GCD attack on {len(moduli)} moduli")
            print()
            if len(moduli) < 2:
                print("Need at least 2 moduli for this attack.")
                print("MULTI_PRIME_GCD=FAILED")
            else:
                print("Running pairwise GCD across all moduli...")
                print()
                found_any = False
                for i in range(len(moduli)):
                    ni = moduli[i]
                    for j in range(i + 1, len(moduli)):
                        nj = moduli[j]
                        g = gcd(ni, nj)
                        if g > 1 and g < ni:
                            found_any = True
                            print(f"SHARED FACTOR FOUND between moduli {i+1} and {j+1}!")
                            print(f"gcd(n{i+1}, n{j+1}) = {g}")
                            print(f"n{i+1} = {ni}")
                            print(f"  p = {g}")
                            print(f"  q = {ni // g}")
                            print(f"n{j+1} = {nj}")
                            print(f"  p' = {g}")
                            print(f"  q' = {nj // g}")
                            print()
                if found_any:
                    print("MULTI_PRIME_GCD=SUCCESS")
                else:
                    print("No shared factors found among the provided moduli.")
                    print()
                    print("This could mean:")
                    print("  1. All moduli use independently generated primes (good practice)")
                    print("  2. The shared factors are not between the provided pairs")
                    print("  3. More moduli are needed to find common factors")
                    print()
                    print("Note: In real-world scans, ~0.2% of RSA certificates share factors")
                    print("due to poor entropy during key generation.")
                    print("MULTI_PRIME_GCD=FAILED")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("MULTI_PRIME_GCD=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("MULTI_PRIME_GCD=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} Given RSA moduli \\{n\\_1, \\ldots, n\\_k\\} generated with insufficient entropy, pairwise GCD reveals both shared factors and the exact pairs that share them.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item At least 2 moduli $n_1, n_2, \\ldots, n_k$ to compare
\\item Each $n_i = p_i \\cdot q_i$ where $p_i, q_i$ are primes
\\item At least one pair shares a factor: $\\exists\\, i \\neq j : \\gcd(n_i, n_j) > 1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
g_{ij} &= \\gcd(n_i, n_j) \\quad (1 \\leq i < j \\leq k) \\\\
g_{ij} &> 1 \\implies \\exists\\, p : p \\mid n_i \\land p \\mid n_j \\\\
n_i &= g_{ij} \\cdot \\frac{n_i}{g_{ij}} \\\\
n_j &= g_{ij} \\cdot \\frac{n_j}{g_{ij}} \\\\
\\text{GCD complexity:} &\\quad O(\\log^2 \\max(n_i, n_j)) \\text{ per pair} \\\\
\\text{Total complexity:} &\\quad O(k^2 \\log^2 n) \\qed
\\end{align*}

\\textbf{Explanation:} Pairwise GCD checks every modulus pair individually, reporting exactly which pairs share a factor. This is simpler than batch GCD (Bernstein remainder tree) and provides pair-level detail, at the cost of $O(k^2)$ operations vs. $O(k \\log k)$ for the batch variant. Useful when investigating which specific keys are related (e.g., hardware RNG failure analysis).

\\textbf{References:} N. Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => {
    const vals = (p.moduli_list || '').trim();
    if (!vals) return false;
    return vals.split('\n').filter(x => x.trim()).length >= 2;
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const raw = (vals.moduli_list || '').trim();
      if (!raw) return null;

      const moduli = raw.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => BigInt(s));

      if (moduli.length < 2) {
        return null;
      }

      const lines: string[] = [
        `Multi-Prime GCD Attack (browser-side, BigInt)`,
        `Running pairwise GCD on ${moduli.length} moduli...`,
        ``,
      ];

      let foundAny = false;

      for (let i = 0; i < moduli.length; i++) {
        const ni = moduli[i];
        for (let j = i + 1; j < moduli.length; j++) {
          const nj = moduli[j];
          const g = gcd(ni, nj);
          if (g > 1n && g < ni) {
            foundAny = true;
            lines.push(`SHARED FACTOR FOUND between moduli ${i + 1} and ${j + 1}!`);
            lines.push(`gcd(n${i + 1}, n${j + 1}) = ${g}`);
            lines.push(`n${i + 1} = ${ni}`);
            lines.push(`  p = ${g}`);
            lines.push(`  q = ${ni / g}`);
            lines.push(`n${j + 1} = ${nj}`);
            lines.push(`  p' = ${g}`);
            lines.push(`  q' = ${nj / g}`);
            lines.push('');
          }
        }
      }

      if (!foundAny) {
        return null;
      }

      lines.push('MULTI_PRIME_GCD=SUCCESS');
      return lines.join('\n');
    } catch {
      return null;
    }
  },
};

export const generateTestcase = (): Record<string, string> => {
  const sharedP = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const q3 = randomPrime(TESTCASE_BITS.q);
  return { moduli_list: `${sharedP * q1}\n${sharedP * q2}\n${sharedP * q3}` };
};
