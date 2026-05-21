import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd } from '../utils/bigint';

export const attack: Attack = {
  id: 'batch-gcd',
  name: 'Batch GCD',
  category: 'Factorization',
  description: 'Finds shared factors across multiple moduli. Use when given a list of RSA moduli.',
  inputs: [
    { name: 'n_values', label: 'Moduli (one per line or comma-separated)', placeholder: 'n1\\nn2\\nn3...', multiline: true, rows: 5 },
  ],
  sageTemplate: (vals: Record<string, string>) => `try:
    n_list_str = """${vals.n_values}"""
    import re
    n_list = [Integer(x.strip()) for x in re.split(r'[\\s,]+', n_list_str.strip()) if x.strip()]
    if len(n_list) < 2:
        print("Error: Need at least 2 moduli for Batch GCD attack.")
        print("BATCH_GCD=FAILED")
    else:
        print(f"Processing {len(n_list)} moduli...")
        print()
        product = prod(n_list)
        found_any = False
        for i, n in enumerate(n_list):
            if n <= 1:
                print(f"n[{i}] = {n}: invalid")
                continue
            others_product = product // n
            g = gcd(n, others_product)
            if g > 1 and g < n:
                found_any = True
                p = g
                q = n // g
                print(f"n[{i}] = {n}")
                print(f"  Shared factor found: p = {p}")
                print(f"  q = {q}")
                print(f"  Verification: p * q = {p * q}")
                print()
            elif g == n:
                print(f"n[{i}] = {n}")
                print(f"  WARNING: n divides product of others (duplicate or fully shared)")
                print()
        if not found_any:
            print("No shared factors found among the provided moduli.")
            print()
        print("Batch GCD complete.")
        if found_any:
            print("BATCH_GCD=SUCCESS")
        else:
            print("BATCH_GCD=FAILED")
except Exception as e:
    print(f"Error in Batch GCD: {e}")
    print("BATCH_GCD=FAILED")
`,
  frontendCheck: async (vals: Record<string, string>) => {
    try {
      const raw = (vals.n_values || '').trim();
      if (!raw) return null;

      const moduli = raw.split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => BigInt(s));

      if (moduli.length < 2) {
        return null;
      }

      let product = 1n;
      for (const n of moduli) {
        product *= n;
      }

      const lines: string[] = [
        `Batch GCD Attack (browser-side, BigInt)`,
        `Processing ${moduli.length} moduli...`,
        ``,
      ];

      let foundAny = false;

      for (let i = 0; i < moduli.length; i++) {
        const n = moduli[i];
        if (n <= 1n) continue;

        const others = product / n;
        const g = gcd(n, others);

        if (g > 1n && g < n) {
          foundAny = true;
          const p = g;
          const q = n / g;
          lines.push(`n[${i}] = ${n}`);
          lines.push(`  Shared factor found: p = ${p}`);
          lines.push(`  q = ${q}`);
          lines.push(`  Verification: p * q = ${p * q}`);
          lines.push('');
        } else if (g === n) {
          lines.push(`n[${i}] = ${n}`);
          lines.push(`  WARNING: n divides product of others (duplicate or fully shared)`);
          lines.push('');
        }
      }

      if (!foundAny) {
        return null;
      }

      lines.push('Batch GCD complete.');
      return lines.join('\n');
    } catch {
      return null;
    }
  },
  proof: `\\textbf{Theorem:} Given moduli \\{n_1, \\ldots, n_k\\}, if any two share a prime, \\gcd(n_i, \\prod_{j \\neq i} n_j) reveals it.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item \\{n_1, \\ldots, n_k\\} — set of RSA moduli, n_i = p_i q_i
\\item Shared prime: p_i = p_j for some i \\neq j
\\item Product tree for efficient computation of \\prod_{j \\neq i} n_j \\bmod n_i
\\item Euclidean GCD: O(\\log^2(\\max(a, b)))
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n_i &= p_i q_i, \\quad i = 1, \\ldots, k \\\\
p_1 = p_2 = p &\\implies p \\mid n_1 \\land p \\mid n_2 \\\\
p &\\mid \\gcd(n_1, n_2) \\\\
g_i = \\gcd\\left(n_i, \\prod_{j \\neq i} n_j\\right) & \\\\
g_i > 1 &\\implies g_i \\text{ is a shared prime factor} \\\\
\\text{Product tree: } T &= \\text{tree}(n_1, \\ldots, n_k), \\quad \\text{depth } O(\\log k) \\\\
\\text{Time: } O(M(k \\log N) &\\log k) \\quad \\text{vs } O(k^2) \\text{ pairwise} \\qed
\\end{align*}

\\textbf{Explanation:} If two RSA moduli share a prime factor, computing the GCD of each modulus against the product of all others exposes the shared factor. A product tree makes this efficient — O(k \\log k) instead of O(k^2) pairwise comparisons.

\\textbf{References:} Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012; Bernstein, "How to Find Small Factors of Products", 2004`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => {
    const vals = (p.n_values || '').trim();
    if (!vals) return false;
    return vals.split(/[\n,]+/).filter(x => x.trim()).length >= 2;
  },
};

export const generateTestcase = (): Record<string, string> => {
  const sharedP = randomPrime(TESTCASE_BITS.p);
  const q1 = randomPrime(TESTCASE_BITS.q);
  const q2 = randomPrime(TESTCASE_BITS.q);
  const q3 = randomPrime(TESTCASE_BITS.q);
  return { n_values: `${sharedP * q1}\n${sharedP * q2}\n${sharedP * q3}` };
};
