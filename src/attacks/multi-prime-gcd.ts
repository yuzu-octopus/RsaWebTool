import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'multi-prime-gcd',
  name: 'Multi-Prime GCD',
  category: 'Advanced',
  description: 'Finds shared primes across multiple moduli. Use when given 3+ RSA moduli.',
  inputs: [
    { name: 'moduli_list', label: 'Moduli (one per line)', placeholder: 'Enter multiple moduli, one per line...', multiline: true, rows: 6 },
  ],
  sageTemplate: (vals: Record<string, string>) => `# Validate inputs
moduli_str = """${vals.moduli_list}""".strip()
if not moduli_str:
    print("ERROR: moduli_list is required")
    print("MULTI_PRIME_GCD=FAILED")
    quit()

try:
    # Parse moduli
    moduli = [Integer(x.strip()) for x in moduli_str.split('\\n') if x.strip()]

    print(f"Multi-Prime GCD attack on {len(moduli)} moduli")
    print()

    if len(moduli) < 2:
        print("Need at least 2 moduli for this attack.")
        print("MULTI_PRIME_GCD=FAILED")
    else:
        # Batch GCD: compute product of all moduli, then GCD each with product/others
        print("Computing batch GCD...")
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
`,
  proof: `\\textbf{Theorem:} RSA moduli generated with insufficient entropy may share prime factors, enabling factorization via pairwise GCD.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item At least 2 moduli $n_1, n_2, \\ldots, n_k$ to compare
\\item Each $n_i = p_i \\cdot q_i$ where $p_i, q_i$ are primes
\\item At least one pair shares a factor: $\\exists\\, i \\neq j : \\gcd(n_i, n_j) > 1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
g_{ij} &= \\gcd(n_i, n_j) \\\\
g_{ij} &> 1 \\implies \\exists\\, p : p \\mid n_i \\land p \\mid n_j \\\\
n_i &= g_{ij} \\cdot \\frac{n_i}{g_{ij}} \\\\
n_j &= g_{ij} \\cdot \\frac{n_j}{g_{ij}} \\\\
\\text{Batch optimization:} &\\quad P = \\prod_{i=1}^{k} n_i, \\quad g_i = \\gcd\\!\\left(n_i, \\frac{P}{n_i^2}\\right)
\\end{align*}

\\textbf{Explanation:} When two moduli share a prime factor, their GCD reveals that factor immediately. The batch variant computes the product of all moduli once, then checks each $n_i$ against $P/n_i^2$, reducing $O(k^2)$ pairwise GCDs to $O(k)$.

\\textbf{References:} N. Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => {
    const vals = (p.moduli_list || '').trim();
    if (!vals) return false;
    return vals.split('\n').filter(x => x.trim()).length >= 2;
  },
};

export const generateTestcase = (): Record<string, string> => {
  const sharedP = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const q3 = randomPrime(TESTCASE_BITS.q);
  return { moduli_list: `${sharedP * q1}\n${sharedP * q2}\n${sharedP * q3}` };
};
