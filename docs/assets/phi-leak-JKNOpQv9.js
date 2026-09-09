var e=`import type { Attack } from '../types';
import { generatePhiLeakTestcase } from '../utils/testcases/core';
import { gcd, isqrt, modPow } from '../utils/bigint';
import { bitLength } from './_rsaHelpers';
import { wrapSageTemplate, validateNumeric} from './guard';

export const attack: Attack = {
  id: 'phi-leak',
  name: 'Phi(n) Leak',
  category: 'Partial Key / Lattice',
  description: 'Factors n immediately when φ(n) has been leaked, via quadratic formula. Use when Euler\\'s totient φ(n) is known from side-channel leakage.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'phi', label: 'phi(n) (Euler totient)', placeholder: 'Enter phi(n)...', multiline: true, rows: 3, required: false, tooltip: 'Enter the leaked φ(n) value, if known from side-channel or other leakage' },
    { name: 'd', label: 'd (private exponent, alternative)', placeholder: 'Enter d...', multiline: true, rows: 3, required: false, tooltip: 'Alternative to phi(n): with e, ed-1 is a multiple of phi(n) and Miller-Rabin-style randomized splitting factors n' },
    { name: 'e', label: 'e (public exponent, with d only)', placeholder: 'Enter e...', multiline: false, required: false },
  ],
  usageGuide: \`Use when Euler's totient φ(n) is known, or when the private exponent d (plus e) is known.

How to use:
1. Provide n and the leaked φ(n) value
2. From φ(n) = (p-1)(q-1) and n = pq, solve the quadratic: p + q = n - φ(n) + 1
3. The factors are roots of x^2 - (p+q)x + n = 0

Alternative (d instead of phi): provide n, e, and d. Since ed - 1 is a multiple of φ(n), write ed - 1 = 2^s · t and split n with random bases: for random a, repeated squaring of a^t mod n hits a nontrivial square root of 1, and gcd(x - 1, n) factors n (Miller-Rabin-style randomized factoring).

Tip: Instant factorization once φ(n) is known. φ(n) can leak from CRT-based implementations or side-channel attacks on the decryption process. A leaked d is equivalent: ed - 1 is a multiple of φ(n), so the same quadratic applies after one randomized split.\`,
  sageTemplate: (vals: Record<string, string>) => {
    const nStr = vals.n ?? '';
    const phiStr = vals.phi ?? '';
    if (!nStr.trim()) {
      return 'print("ERROR: Missing required input: n")\\nprint("PHI_LEAK=FAILED")';
    }
    if (!phiStr.trim()) {
      const dStr = (vals.d ?? '').trim();
      const eStr = (vals.e ?? '').trim();
      if (dStr && eStr) {
        return wrapSageTemplate({
          token: 'PHI_LEAK',
          n: validateNumeric(vals.n, 'n'),
          imports: ['import random'],
          body: \`        e = Integer(\${validateNumeric(vals.e, 'e')})
        d = Integer(\${validateNumeric(vals.d, 'd')})
        found = False
        # ed - 1 is a multiple of phi(n): write ed - 1 = 2^s * t and split n
        # with random bases (Miller-Rabin-style randomized factoring).
        ed1 = e * d - 1
        if ed1 <= 0:
            out.append("PHI_LEAK=FAILED: ed - 1 must be positive")
        else:
            s_exp = valuation(ed1, 2)
            t = ed1 >> s_exp
            factors = set()
            for _ in range(32):
                a = Integer(random.randrange(2, int(n - 1)))
                x = power_mod(a, t, n)
                if x == 1 or x == n - 1:
                    continue
                for _ in range(s_exp - 1):
                    y = (x * x) % n
                    if y == 1:
                        g = gcd(x - 1, n)
                        if 1 < g < n:
                            factors.add(g)
                            factors.add(n // g)
                        break
                    if y == n - 1:
                        break
                    x = y
                if len(factors) >= 2 and prod(list(factors)) == n:
                    break
            fac = sorted(factors)
            if len(fac) == 2 and fac[0] * fac[1] == n:
                out.append(f"n = {n}")
                out.append(f"e = {e}")
                out.append(f"d = {d}")
                out.append("")
                out.append("Results:")
                out.append(f"p = {fac[0]}")
                out.append(f"q = {fac[1]}")
                out.append("")
                out.append(f"Verification: p * q = {fac[0] * fac[1]}")
                out.append("")
                out.append("PHI_LEAK=SUCCESS")
                found = True
            else:
                out.append(f"Randomized splitting found {len(fac)} factors; need exactly 2 primes.")
                out.append("PHI_LEAK=FAILED")
        if not found:
            out.append("PHI_LEAK=FAILED")\`,
          useGuard: true,
        });
      }
      return \`print("This attack requires a leaked φ(n) value, or (d, e) for randomized splitting.")\\nprint("Found n: \${validateNumeric(vals.n, 'n')} but neither φ(n) nor (d, e) was provided.")\\nprint("With n alone, the modulus cannot be factored.")\\nprint("PHI_LEAK=FAILED")\`;
    }
    return wrapSageTemplate({
      token: 'PHI_LEAK',
      n: validateNumeric(vals.n, 'n'),
      body: \`        phi = Integer(\${validateNumeric(vals.phi, 'phi')})
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
            out.append("PHI_LEAK=FAILED: Negative discriminant. phi(n) is inconsistent with n (for a multiple of phi, provide d to use the randomized MR-splitting mode).")
            out.append("PHI_LEAK=FAILED")
        elif discriminant == 0:
            # Square discriminant: p = q = sum_pq / 2 with n a perfect square.
            p = sum_pq // 2
            if p * p == n:
                out.append(f"n = {n}")
                out.append(f"phi = {phi}")
                out.append("")
                out.append("Results:")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                out.append(f"Verification: p * q = {p * p}")
                out.append("")
                out.append("PHI_LEAK=SUCCESS")
                found = True
            else:
                out.append("PHI_LEAK=FAILED: square discriminant but (s/2)^2 != n.")
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
                out.append(f"PHI_LEAK=FAILED: discriminant is not a perfect square (phi may belong to a multi-prime n or be inconsistent; for a multiple of phi, provide d to use the randomized MR-splitting mode)")
                out.append("PHI_LEAK=FAILED")
        if not found:
            out.append("PHI_LEAK=FAILED")\`,
      useGuard: true,
    });
  },
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.n || (!vals.phi && !(vals.d && vals.e))) return null;
    if (!vals.phi && vals.d && vals.e) return phiLeakFromD(vals);
    try {
      const n = BigInt(vals.n);
      const phi = BigInt(vals.phi);

      const sum_pq = n - phi + 1n;
      const discriminant = sum_pq * sum_pq - 4n * n;

      if (discriminant < 0n) {
        return [
          \`Phi(n) Leak\`,
          \`n = \${n}\`,
          \`phi = \${phi}\`,
          \`\`,
          \`No factorization: negative discriminant, so phi(n) is inconsistent with n.\`,
          \`For a multiple of phi, provide d to use the randomized MR-splitting mode.\`,
          \`\`,
          \`PHI_LEAK=FAILED\`,
        ].join('\\n');
      }

      const sqrt_disc = isqrt(discriminant);
      if (sqrt_disc * sqrt_disc !== discriminant) {
        return [
          \`Phi(n) Leak\`,
          \`n = \${n}\`,
          \`phi = \${phi}\`,
          \`\`,
          \`No factorization: discriminant \${discriminant} is not a perfect square.\`,
          \`phi may belong to a multi-prime n or be inconsistent; for a multiple\`,
          \`of phi, provide d to use the randomized MR-splitting mode.\`,
          \`\`,
          \`PHI_LEAK=FAILED\`,
        ].join('\\n');
      }

      const p = (sum_pq - sqrt_disc) / 2n;
      const q = (sum_pq + sqrt_disc) / 2n;

      if (p * q !== n) {
        return null;
      }

      return [
        \`Phi(n) Leak\`,
        \`n = \${n}\`,
        \`phi = \${phi}\`,
        \`\`,
        \`Results:\`,
        \`p = \${p}\`,
        \`q = \${q}\`,
        \`\`,
        \`Verification: p * q = \${p * q}\`,
        \`\`,
        \`PHI_LEAK=SUCCESS\`,
      ].join('\\n');
    } catch (e) {
      console.warn('[phi-leak] frontendCheck error:', e);
      return null;
    }
  },
  proof: \`\\\\textbf{Theorem:} Knowing $\\\\phi(n)$ factors $n = pq$ in polynomial time by solving the quadratic $x^2 - (n - \\\\phi(n) + 1)x + n = 0$.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item $n = pq$ with $p, q$ prime
\\\\item $\\\\phi(n) = (p-1)(q-1)$ is known (leaked or computed)
\\\\end{itemize}

\\\\textbf{Proof:}
\\\\begin{align*}
\\\\phi(n) &= (p-1)(q-1) = pq - p - q + 1 = n - (p+q) + 1 \\\\\\\\
s &= n - \\\\phi(n) + 1 = p + q \\\\\\\\
\\\\Delta &= s^2 - 4n = (p+q)^2 - 4pq = (p-q)^2 \\\\\\\\
p, q &= \\\\frac{s \\\\pm \\\\sqrt{\\\\Delta}}{2} \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} Given both $n = pq$ and $\\\\phi(n) = (p-1)(q-1)$, we know both the sum $p+q = n - \\\\phi(n) + 1$ and the product $pq = n$. By Vieta's formulas, $p$ and $q$ are the roots of $x^2 - (p+q)x + pq = 0$. Computing the discriminant $\\\\Delta = (p+q)^2 - 4n = (p-q)^2$ and taking its square root yields $p$ and $q$ directly via the quadratic formula. This is a single-shot deterministic attack with no iteration.

\\\\textbf{Scope:} If $\\\\Delta = 0$ then $p = q = s/2$ with $n$ a perfect square, returned directly via $\\\\sqrt{n}$. A non-square $\\\\Delta$ means $\\\\phi(n)$ is inconsistent with a two-prime $n$ (wrong leak or multi-prime modulus): the attack reports FAILED rather than guessing. Recovering factors from a mere multiple of $\\\\phi(n)$ uses the implemented Miller-Rabin-style randomized splitting mode — provide $d$ plus $e$ instead of $\\\\phi(n)$ ($ed - 1 = 2^s \\\\cdot t$).

\\\\textbf{References:} Rivest, Shamir, Adleman, "A Method for Obtaining Digital Signatures and Public-Key Cryptosystems", 1978; Menezes et al., "Handbook of Applied Cryptography", Section 8.2.2\`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && (!!p.phi || (!!p.d && !!p.e)),
};

/** Randomized Miller-Rabin-style splitting from (n, e, d): ed - 1 = 2^s · t. */
function phiLeakFromD(vals: Record<string, string>): string | null {
  try {
    const n = BigInt(vals.n);
    const e = BigInt(vals.e);
    const d = BigInt(vals.d);
    if (n <= 2n || e < 2n || d <= 0n) return null;
    const ed1 = e * d - 1n;
    if (ed1 <= 0n) return null;
    let sExp = 0n;
    let t = ed1;
    while (t % 2n === 0n) {
      t /= 2n;
      sExp++;
    }
    const randBelow = (limit: bigint): bigint => {
      const bits = bitLength(limit);
      const bytes = new Uint8Array(Math.ceil(bits / 8));
      for (let i = 0; i < 64; i++) {
        crypto.getRandomValues(bytes);
        let v = 0n;
        for (const b of bytes) v = (v << 8n) | BigInt(b);
        v %= limit;
        if (v >= 2n) return v;
      }
      return 0n;
    };
    const factors = new Set<bigint>();
    for (let trial = 0; trial < 32 && factors.size < 2; trial++) {
      const a = randBelow(n - 1n);
      if (a < 2n) continue;
      let x = modPow(a, t, n);
      if (x === 1n || x === n - 1n) continue;
      for (let r = 0n; r < sExp - 1n; r++) {
        const y = (x * x) % n;
        if (y === 1n) {
          const g = gcd(x - 1n, n);
          if (g > 1n && g < n) {
            factors.add(g);
            factors.add(n / g);
          }
          break;
        }
        if (y === n - 1n) break;
        x = y;
      }
    }
    const fac = [...factors].sort((x, y) => (x < y ? -1 : 1));
    if (fac.length === 2 && fac[0] * fac[1] === n) {
      return [
        'Phi(n) Leak (randomized splitting from d)',
        \`n = \${n}\`,
        \`e = \${e}\`,
        \`d = \${d}\`,
        '',
        'Results:',
        \`p = \${fac[0]}\`,
        \`q = \${fac[1]}\`,
        '',
        \`Verification: p * q = \${fac[0] * fac[1]}\`,
        '',
        'PHI_LEAK=SUCCESS',
      ].join('\\n');
    }
    return null;
  } catch (err) {
    console.warn('[phi-leak] d-path error:', err);
    return null;
  }
}

export const generateTestcase = (): Record<string, string> => {
  const kp = generatePhiLeakTestcase();
  return { n: kp.n.toString(), phi: kp.phi.toString() };
};
`;export{e as default};