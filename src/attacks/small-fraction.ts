import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { isqrt } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

const numGcd = (a: number, b: number): number => {
  while (b) { [a, b] = [b, a % b]; }
  return a;
};

// Precomputed BigInt offsets for the delta window to avoid BigInt(delta) per iteration
const DELTA_WINDOW = 2000;
const offsets: bigint[] = [];
for (let d = -DELTA_WINDOW; d <= DELTA_WINDOW; d++) {
  offsets.push(BigInt(d));
}

export const attack: Attack = {
  id: 'small-fraction',
  name: 'Small Fraction Attack',
  category: 'Factorization',
  description: "Factors n when p/q approximates a small rational a/b using parity-optimized trial division over the search window. Use when p/q is close to a simple fraction with denominator ≤ 100.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'SMALL_FRACTION',
    n: vals.n,
    useGuard: true,
    body: `        #
        # Small fraction attack: p/q ≈ a/b for small a, b
        # Use Python ints for fast trial division
        out.append("Small Fraction Attack")
        out.append(f"n = {n}")
        out.append("")
        found = False
        max_den = 100
        trial_window = 2000
        pairs_tried = 0
        divs_tried = 0
        n_int = int(n)
        for b in range(1, max_den + 1):
            for a in range(1, b + 1):
                if math.gcd(a, b) != 1:
                    continue
                pairs_tried += 1
                q0 = math.isqrt(n_int * b // a)
                if q0 <= 1:
                    continue
                if n_int % q0 == 0:
                    q_sage = Integer(q0)
                    p_sage = n // q_sage
                    if p_sage > 1 and p_sage * q_sage == n:
                        out.append("Results:")
                        out.append(f"p = {p_sage}")
                        out.append(f"q = {q_sage}")
                        out.append("")
                        out.append(f"Verification: p * q = {p_sage * q_sage}")
                        out.append(f"a/b = {a}/{b}")
                        out.append("")
                        out.append("SMALL_FRACTION=SUCCESS")
                        found = True
                        break
                for delta in range(1, trial_window + 1):
                    divs_tried += 1
                    q_candidate = q0 + delta
                    if q_candidate > 1 and (q_candidate & 1) and n_int % q_candidate == 0:
                        q_sage = Integer(q_candidate)
                        p_sage = n // q_sage
                        if p_sage > 1 and p_sage * q_sage == n:
                            out.append("Results:")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {q_sage}")
                            out.append("")
                            out.append(f"Verification: p * q = {p_sage * q_sage}")
                            out.append(f"a/b = {a}/{b}")
                            out.append("")
                            out.append("SMALL_FRACTION=SUCCESS")
                            found = True
                            break
                    q_candidate = q0 - delta
                    if q_candidate > 1 and (q_candidate & 1) and n_int % q_candidate == 0:
                        q_sage = Integer(q_candidate)
                        p_sage = n // q_sage
                        if p_sage > 1 and p_sage * q_sage == n:
                            out.append("Results:")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {q_sage}")
                            out.append("")
                            out.append(f"Verification: p * q = {p_sage * q_sage}")
                            out.append(f"a/b = {a}/{b}")
                            out.append("")
                            out.append("SMALL_FRACTION=SUCCESS")
                            found = True
                            break
                if found:
                    break
            if found:
                break
        if not found:
            out.append("Results:")
            out.append("")
            out.append("SMALL_FRACTION=FAILED")
`,
    imports: ['import math'],
  }),
  frontendCheck: (vals, onProgress) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n % 2n === 0n) {
        return Promise.resolve(`Small Fraction Attack\nn = ${n}\n\nResults:\np = 2\nq = ${n / 2n}\n\nVerification: p * q = ${n}\n\nSMALL_FRACTION=SUCCESS`);
      }

      // n is odd (product of odd primes) — skip even q candidates
      const isOdd = (x: bigint): boolean => (x & 1n) !== 0n;

      for (let b = 1; b <= 100; b++) {
        if (onProgress) {
          const pct = Math.round((b - 1) * 100 / 100);
          onProgress(pct, `b = ${b} / 100`);
        }
        for (let a = 1; a <= b; a++) {
          if (numGcd(a, b) !== 1) continue;
          const q0 = isqrt(n * BigInt(b) / BigInt(a));
          if (q0 <= 1n) continue;
          // Use precomputed offsets + skip even q (n is odd, can't have even divisor)
          for (const offset of offsets) {
            const q = q0 + offset;
            if (isOdd(q) && n % q === 0n) {
              const p = n / q;
              if (p > 1n) {
                onProgress?.(100);
                onProgress?.(100);
                return Promise.resolve(`Small Fraction Attack\nn = ${n}\n\nResults:\np = ${p}\nq = ${q}\n\nVerification: p * q = ${p * q}\na/b = ${a}/${b}\n\nSMALL_FRACTION=SUCCESS`);
              }
            }
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  usageGuide: 'This attack factors n when the ratio of its two prime factors p/q is close to a simple fraction a/b with small denominator (≤ 100).\n\nHow it works:\n1. For each coprime pair (a,b) with 1 ≤ b ≤ 100 and 1 ≤ a ≤ b, estimate q₀ ≈ √(n·b/a)\n2. Test q₀ ± 2000 for divisibility: if q | n then p = n/q recovers both factors\n3. Since n is odd (product of two odd primes), even q can never divide n — a single-bit (q & 1) check skips ~50% of BigInt divisions\n4. Precomputed offset BigInts avoid per-iteration allocation overhead\n\nTip: Works in-browser (frontendCheck) for any n. Falls back to SageMathCell for larger systematic searches. Testcase generated with a=3, b=5 for immediate verification.',
  proof: `\\textbf{Theorem:} If $p/q \\approx a/b$ for small coprime $a, b$, then $q \\approx \\sqrt{nb/a}$ and parity-optimized trial division near $q_0$ recovers the factor.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, with $p,q$ odd primes
\\item $p/q \\approx a/b$, $\\gcd(a,b) = 1$, $1 \\leq b \\leq 100$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\frac{p}{q} &\\approx \\frac{a}{b} \\\\
n = pq &\\approx \\frac{a}{b} q^2 \\\\
q_0 &= \\left\\lfloor\\sqrt{\\frac{nb}{a}}\\right\\rfloor \\\\
\\text{Search } q_0 \\pm k\\text{ for } &|k| \\leq 2000,\\; k \\in \\mathbb{Z} \\\\
\\text{Even } q\\text{ cannot divide odd } n &\\implies \\text{skip } q \\equiv 0 \\pmod{2} \\\\
\\text{Search space: } 1 \\leq b &\\leq 100,\\; 1 \\leq a \\leq b,\\; \\gcd(a,b) = 1 \\\\
\\text{Complexity: } O(B^2 \\cdot \\Delta) & \\text{ with }\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!
\\text{ parity filter: } \\frac{1}{2}\\text{ fewer divisions}
\\end{align*}

\\textbf{Explanation:} When $p \\approx (a/b) \\cdot q$, substituting into $n = pq$ gives $q^2 \\approx nb/a$. We compute $q_0 = \\lfloor\\sqrt{nb/a}\\rfloor$ for each coprime $a,b$ and test $q_0 \\pm 2000$ for an exact divisor of $n$. Since $n$ is odd (product of odd primes), even candidates can never divide $n$ and are skipped via a $\\& 1$ bit check — cutting the effective trial division count in half. Precomputed BigInt offsets avoid per-iteration allocation. The search examines $\\approx 5050$ fraction pairs, each with $4001$ delta candidates, halved to $\\approx 10$M BigInt divisions worst-case.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Parity pre-filter:} Since $n$ is odd (product of odd primes), even $q$ can never divide $n$, so a single-bit check $(q \\& 1)$ skips half the trial divisions with zero BigInt arithmetic cost.
\\item \\textbf{Precomputed BigInt offsets:} Delta candidates are stored in a precomputed array as $BigInt$ values, avoiding per-iteration $BigInt(number)$ allocation overhead in the inner loop.
\\end{itemize}

\\textbf{References:} Menezes et al., "Handbook of Applied Cryptography"; Boneh, "Twenty Years of Attacks on the RSA Cryptosystem", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Need p/q close to a small rational a/b. Construct: pick small a, b, then generate q, set p ≈ q * a/b.
  const a = BigInt(3);
  const b = BigInt(5);
  const q = randomPrime(TESTCASE_BITS.q);
  const pTarget = (q * a) / b;
  let p = pTarget;
  for (let delta = 0n; delta < 500n; delta += 1n) {
    const candidate1 = pTarget + delta;
    if (candidate1 > 1n && isPrimeMR(candidate1)) { p = candidate1; break; }
    const candidate2 = pTarget - delta;
    if (candidate2 > 1n && isPrimeMR(candidate2)) { p = candidate2; break; }
  }
  return { n: (p * q).toString() };
};
