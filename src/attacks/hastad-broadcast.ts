import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { generateHastadBroadcastTestcase } from '../utils/testcases/core';
import { modPow, modInverse, iroot, gcd } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'hastad-broadcast',
  name: "Hastad's Broadcast Attack",
  category: 'Message / Protocol',
  description: 'Recovers m from e ciphertexts under distinct moduli with small e via CRT and integer e-th root. Use when same m encrypted with exponent e to e recipients.',
  inputs: [
    { name: 'e', label: 'e (public exponent / number of ciphertexts)', placeholder: '3', multiline: false },
    { name: 'ciphertexts', label: 'ciphertexts (one per line: c, n)', placeholder: 'c1, n1\nc2, n2\nc3, n3', multiline: true, rows: 6 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.e || !vals.ciphertexts) {
      return `print("ERROR: Missing required inputs (e, ciphertexts)")
print("HASTAD_BROADCAST=FAILED")`;
    }
    return wrapSageTemplate({
      token: 'HASTAD_BROADCAST',
      useGuard: false,
      body: `        e = Integer(${vals.e})
        out.append(f"Hastad's Broadcast Attack")
        out.append(f"Public exponent: e = {e}")
        if e < 2:
            out.append(f"ERROR: e must be >= 2, got e = {e}")
            out.append("HASTAD_BROADCAST=FAILED")
        else:
            lines_str = """${vals.ciphertexts}""".strip()
            pairs = []
            for line in lines_str.split('\\n'):
                line = line.strip()
                if not line:
                    continue
                parts = line.split(',')
                if len(parts) < 2:
                    continue
                c = Integer(parts[0].strip())
                n = Integer(parts[1].strip())
                pairs.append((c, n))
            out.append(f"Number of ciphertexts: {len(pairs)}")
            if len(pairs) < e:
                out.append(f"ERROR: Need at least {e} ciphertexts for e = {e}, got {len(pairs)}")
                out.append("HASTAD_BROADCAST=FAILED")
            else:
                moduli = [p[1] for p in pairs[:e]]
                remainders = [p[0] for p in pairs[:e]]
                # Check pairwise GCD of moduli — if any share a factor, that's even better
                shared_info = None
                for i in range(len(moduli)):
                    for j in range(i+1, len(moduli)):
                        g = gcd(moduli[i], moduli[j])
                        if g > 1:
                            shared_info = (i, j, g)
                            break
                    if shared_info is not None:
                        break
                if shared_info is not None:
                    i, j, g = shared_info
                    out.append("")
                    out.append("Shared prime factor found via pairwise GCD!")
                    p = g
                    q_i = moduli[i] // g
                    q_j = moduli[j] // g
                    out.append(f"gcd(n_{i}, n_{j}) = {g}")
                    out.append(f"n_{i} factors: {p} * {q_i}")
                    out.append(f"  Verification: {p} * {q_i} = {moduli[i]}")
                    out.append(f"n_{j} factors: {p} * {q_j}")
                    out.append(f"  Verification: {p} * {q_j} = {moduli[j]}")
                    out.append("")
                    out.append("HASTAD_BROADCAST=SUCCESS")
                else:
                    N = prod(moduli)
                    M = crt(remainders, moduli)
                    m, exact = M.nth_root(e, truncate_mode=True)
                    if exact:
                        out.append("")
                        out.append("Results:")
                        out.append(f"m = {m}")
                        out.append("")
                        out.append(f"Verification: m^e mod product(n_i) = CRT(c_i)")
                        all_ok = True
                        for i, (c_i, n_i) in enumerate(pairs):
                            v = power_mod(m, e, n_i)
                            ok = v == c_i
                            if not ok:
                                all_ok = False
                        if all_ok:
                            out.append("")
                            out.append("HASTAD_BROADCAST=SUCCESS")
                        else:
                            out.append("HASTAD_BROADCAST=FAILED")
                    else:
                        out.append(f"Approximate root: m = {m}")
                        out.append("Warning: m^e was not a perfect e-th power")
                        out.append("HASTAD_BROADCAST=FAILED")`,
    });
  },
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.e || !vals.ciphertexts) return Promise.resolve(null);
    try {
      const e = BigInt(vals.e);
      const lines = vals.ciphertexts.split('\n').filter(l => l.trim());
      if (lines.length < Number(e)) return Promise.resolve(null);
      const pairs = lines.slice(0, Number(e)).map(l => {
        const [c, n] = l.split(',').map(x => BigInt(x.trim()));
        return { c, n };
      });
      // Check pairwise GCD — if moduli share a factor, report factorization directly
      for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
          const g = gcd(pairs[i].n, pairs[j].n);
          if (g > 1n && g < pairs[i].n) {
            const qi = pairs[i].n / g;
            const qj = pairs[j].n / g;
            return Promise.resolve(`Hastad's Broadcast Attack\nShared prime factor found via pairwise GCD!\ngcd(n_${i}, n_${j}) = ${g}\nn_${i} factors: ${g} * ${qi}\n  Verification: ${g} * ${qi} = ${pairs[i].n}\nn_${j} factors: ${g} * ${qj}\n  Verification: ${g} * ${qj} = ${pairs[j].n}\n\nHASTAD_BROADCAST=SUCCESS`);
          }
        }
      }

      const N = pairs.reduce((acc, {n}) => acc * n, 1n);
      let M = 0n;
      for (const {c, n} of pairs) {
        const Ni = N / n;
        const inv = modInverse(Ni % n, n);
        if (inv === null) return Promise.resolve(null);
        M = (M + c * Ni * inv) % N;
      }
      if (M < 2n) return Promise.resolve(null);
      const lo = iroot(M, e);
      if (lo ** e === M) {
        for (const {c, n} of pairs) {
          if (modPow(lo, e, n) !== c) return Promise.resolve(null);
        }
        return Promise.resolve(`Hastad's Broadcast Attack\nPublic exponent: e = ${e}\nNumber of ciphertexts: ${pairs.length}\n\nResults:\nm = ${lo}\n\nVerification: m^e mod product(n_i) = CRT(c_i)\n\nHASTAD_BROADCAST=SUCCESS`);
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If the same plaintext $m$ is encrypted under $e$ distinct moduli with the same exponent $e$, CRT recovers $m^e$ over $\\mathbb{Z}$ and $m = \\sqrt[e]{m^e}$.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_i \\equiv m^e \\pmod{n_i}$ for $i = 1, \\ldots, e$
\\item $\\gcd(n_i, n_j) = 1$ for $i \\neq j$ (moduli are pairwise coprime)
\\item $m^e < \\prod_{i=1}^e n_i$ (message is smaller than the combined modulus)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_i &\\equiv m^e \\pmod{n_i} \\\\
M &\\equiv m^e \\pmod{\\prod n_i} \\quad \\text{(by CRT)} \\\\
m^e < \\prod n_i &\\implies M = m^e \\quad \\text{(equality over $\\mathbb{Z}$, not just modulo)} \\\\
m &= \\sqrt[e]{M} \\quad \\text{(exact integer e-th root)}
\\qed\\\\
\\end{align*}

\\textbf{Explanation:} CRT reconstructs $m^e$ as an integer $M$. Since $m^e$ is smaller than the product of all moduli, the reconstruction is exact — there is no modular wrap-around. The e-th root then recovers $m$ directly. This is why small exponents like $e = 3$ are dangerous when broadcasting: only 3 ciphertexts suffice for recovery.

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA," Eurocrypt 1988`,
  usageGuide: 'This attack recovers m when the same plaintext is encrypted with the same small exponent e to e different moduli.\n\nHow to use:\n1. Collect e ciphertext/modulus pairs: (c1, n1), (c2, n2), ..., (ce, ne)\n2. Paste them into the ciphertexts field, one per line: c, n\n3. Set e to the public exponent (usually 3)\n4. The attack uses CRT to combine the ciphertexts and takes the integer e-th root\n\nInput format:\nc1, n1\nc2, n2\nc3, n3\n\nTip: For convenience, paste this into Magic Mode which auto-detects the format. Works when m^e < n1*n2*...*ne.',
  priority: 'high',
  applicableCheck: rsaNeeds.nECiphertexts,
};

export const generateTestcase = (): Record<string, string> => {
  const kp = generateHastadBroadcastTestcase();
  // frontendCheck only reads `ciphertexts` (newline-separated "c, n" pairs) and `e`.
  // n1/n2/n3 are intentionally embedded inside `ciphertexts` rather than exported
  // as separate top-level fields, since the input schema declares only `ciphertexts`.
  return {
    e: kp.e.toString(),
    ciphertexts: `${kp.c1}, ${kp.n1}\n${kp.c2}, ${kp.n2}\n${kp.c3}, ${kp.n3}`,
  };
};
