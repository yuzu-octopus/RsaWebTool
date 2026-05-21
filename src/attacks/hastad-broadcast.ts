import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'hastad-broadcast',
  name: "Hastad's Broadcast Attack (CRT Recovery)",
  category: 'Message / Protocol',
  description: 'Recovers m from e ciphertexts with small e using CRT. Use when same m sent to e recipients with exponent e.',
  inputs: [
    { name: 'e', label: 'e (public exponent / number of ciphertexts)', placeholder: '3', multiline: false },
    { name: 'ciphertexts', label: 'ciphertexts (one per line: c, n)', placeholder: 'c1, n1\nc2, n2\nc3, n3', multiline: true, rows: 6 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.e || !vals.ciphertexts) {
      return `print("ERROR: Missing required inputs (e, ciphertexts)")
print("HASTAD_BROADCAST=FAILED")`;
    }
    return `def _attack():
    try:
        e = Integer(${vals.e})
        print(f"Hastad's Broadcast Attack")
        print(f"Public exponent: e = {e}")
        if e < 2:
            print(f"ERROR: e must be >= 2, got e = {e}")
            print("HASTAD_BROADCAST=FAILED")
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
            print(f"Number of ciphertexts: {len(pairs)}")
            if len(pairs) < e:
                print(f"ERROR: Need at least {e} ciphertexts for e = {e}, got {len(pairs)}")
                print("HASTAD_BROADCAST=FAILED")
            else:
                moduli = [p[1] for p in pairs[:e]]
                remainders = [p[0] for p in pairs[:e]]
                N = prod(moduli)
                M = crt(remainders, moduli)
                print(f"CRT combined m^e = {M}")
                print(f"Modulus product bits: {N.nbits()}")
                m, exact = M.nth_root(e, truncate_mode=True)
                if exact:
                    print(f"Recovered message: m = {m}")
                    all_ok = True
                    for i, (c_i, n_i) in enumerate(pairs):
                        v = power_mod(m, e, n_i)
                        ok = v == c_i
                        if not ok:
                            all_ok = False
                        print(f"  Verify {i+1}: m^{e} mod n{i+1} = {v} (c{i+1} = {c_i}) {'OK' if ok else 'FAIL'}")
                    if all_ok:
                        print("HASTAD_BROADCAST=SUCCESS")
                    else:
                        print("HASTAD_BROADCAST=FAILED")
                else:
                    print(f"Approximate root: m = {m}")
                    print("Warning: m^e was not a perfect e-th power")
                    print("HASTAD_BROADCAST=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("HASTAD_BROADCAST=FAILED")
_attack()`;
  },
  proof: `\\textbf{Theorem:} If $m$ is encrypted with the same $e$ to $e$ different moduli, CRT recovers $m^e$ over $\\mathbb{Z}$, then $m = \\sqrt[e]{m^e}$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $c_i = m^e \\bmod n_i$ for $i = 1, \\ldots, e$
\\item All $n_i$ are pairwise coprime
\\item $m^e < \\prod_{i=1}^{e} n_i$ (guaranteed when $m < \\min(n_i)$)
\\item Chinese Remainder Theorem
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_i &\\equiv m^e \\pmod{n_i} \\\\
\\text{CRT} \\implies M &\\equiv m^e \\pmod{\\prod n_i} \\\\
m^e &< \\prod n_i \\implies M = m^e \\text{ (over } \\mathbb{Z}\\text{)} \\\\
m &= \\sqrt[e]{M} \\qed
\\end{align*}

\\textbf{Explanation:} The same message encrypted with exponent $e$ across $e$ different moduli. CRT reconstructs $m^e$ as an integer (not modulo anything). Since $m^e < \\prod n_i$, no modular reduction occurred — just take the integer $e$-th root.

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA", 1988`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.e && !!p.ciphertexts,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const lines: string[] = [];
  for (let i = 0; i < Number(e); i++) {
    const p = randomPrime(TESTCASE_BITS.p);
    const q = randomPrime(TESTCASE_BITS.q);
    const n = p * q;
    const c = modPow(m, e, n);
    lines.push(`${c}, ${n}`);
  }
  return { e: e.toString(), ciphertexts: lines.join('\n') };
};
