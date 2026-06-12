import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { generatePhiLeakTestcase } from '../utils/testcases/core';
import { isqrt } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'phi-leak',
  name: 'Phi(n) Leak',
  category: 'Partial Key / Lattice',
  description: 'Factors n immediately when φ(n) has been leaked, via quadratic formula. Use when Euler\'s totient φ(n) is known from side-channel leakage.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'phi', label: 'phi(n) (Euler totient)', placeholder: 'Enter phi(n)...', multiline: true, rows: 3, required: false, tooltip: 'Enter the leaked φ(n) value, if known from side-channel or other leakage' },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    const nStr = vals.n ?? '';
    const phiStr = vals.phi ?? '';
    if (!nStr.trim()) {
      return 'print("ERROR: Missing required input: n")\nprint("PHI_LEAK=FAILED")';
    }
    if (!phiStr.trim()) {
      return `print("This attack requires a leaked φ(n) value.")\nprint("Found n: ${vals.n} but φ(n) is missing.")\nprint("With n alone, the modulus cannot be factored. The φ(n) value must be provided as a second input.")\nprint("PHI_LEAK=FAILED")`;
    }
    return wrapSageTemplate({
      token: 'PHI_LEAK',
      n: vals.n,
      body: `        phi = Integer(${vals.phi})
        found = False
        # For n = p*q: phi(n) = (p-1)(q-1) = pq - p - q + 1 = n - p - q + 1
        # So: p + q = n - phi + 1
        # And: p * q = n
        # We solve: x^2 - (p+q)x + pq = 0
        # i.e.: x^2 - (n - phi + 1)x + n = 0
        sum_pq = n - phi + 1
        out.append(f"p + q = {sum_pq}")
        # Solve quadratic: x^2 - sum_pq * x + n = 0
        discriminant = sum_pq**2 - 4*n
        if discriminant < 0:
            out.append("PHI_LEAK=FAILED: Negative discriminant. phi(n) is inconsistent with n.")
            out.append("PHI_LEAK=FAILED")
        elif discriminant == 0:
            out.append("PHI_LEAK=FAILED: p = q. n is a perfect square (not valid RSA).")
            out.append("PHI_LEAK=FAILED")
        else:
            sqrt_disc = isqrt(discriminant)
            if sqrt_disc**2 == discriminant:
                p = (sum_pq - sqrt_disc) // 2
                q = (sum_pq + sqrt_disc) // 2
                out.append(f"n = {n}")
                out.append(f"phi = {phi}")
                out.append("")
                out.append("Results:")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append("")
                out.append(f"Verification: p * q = {p * q}")
                out.append("")
                out.append("PHI_LEAK=SUCCESS")
                found = True
            else:
                out.append(f"PHI_LEAK=FAILED: discriminant is not a perfect square")
                out.append("PHI_LEAK=FAILED")
        if not found:
            out.append("PHI_LEAK=FAILED")`,
      useGuard: true,
    });
  },
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.n || !vals.phi) return null;
    try {
      const n = BigInt(vals.n);
      const phi = BigInt(vals.phi);

      const sum_pq = n - phi + 1n;
      const discriminant = sum_pq * sum_pq - 4n * n;

      if (discriminant < 0n) {
        return null;
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

      return [
        `Phi(n) Leak`,
        `n = ${n}`,
        `phi = ${phi}`,
        ``,
        `Results:`,
        `p = ${p}`,
        `q = ${q}`,
        ``,
        `Verification: p * q = ${p * q}`,
        ``,
        `PHI_LEAK=SUCCESS`,
      ].join('\n');
    } catch {
      return null;
    }
  },
  proof: `\\textbf{Theorem:} Knowing $\\phi(n)$ factors $n = pq$ in polynomial time by solving the quadratic $x^2 - (n - \\phi(n) + 1)x + n = 0$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$ with $p, q$ prime
\\item $\\phi(n) = (p-1)(q-1)$ is known (leaked or computed)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\phi(n) &= (p-1)(q-1) = pq - p - q + 1 = n - (p+q) + 1 \\\\
s &= n - \\phi(n) + 1 = p + q \\\\
\\Delta &= s^2 - 4n = (p+q)^2 - 4pq = (p-q)^2 \\\\
p, q &= \\frac{s \\pm \\sqrt{\\Delta}}{2} \\qed
\\end{align*}

\\textbf{Explanation:} Given both $n = pq$ and $\\phi(n) = (p-1)(q-1)$, we know both the sum $p+q = n - \\phi(n) + 1$ and the product $pq = n$. By Vieta's formulas, $p$ and $q$ are the roots of $x^2 - (p+q)x + pq = 0$. Computing the discriminant $\\Delta = (p+q)^2 - 4n = (p-q)^2$ and taking its square root yields $p$ and $q$ directly via the quadratic formula. This is a single-shot deterministic attack with no iteration.

\\textbf{References:} Rivest, Shamir, Adleman, "A Method for Obtaining Digital Signatures and Public-Key Cryptosystems", 1978; Menezes et al., "Handbook of Applied Cryptography", Section 8.2.2`,
  priority: 'high',
  applicableCheck: rsaNeeds.n,
};

export const generateTestcase = (): Record<string, string> => {
  const kp = generatePhiLeakTestcase();
  return { n: kp.n.toString(), phi: kp.phi.toString() };
};
