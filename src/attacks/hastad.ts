import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'hastad',
  name: "Hastad's Broadcast Attack",
  category: 'Message / Protocol',
  description: 'Recovers m from e encryptions with small e. Use when same m encrypted under e different moduli with exponent e.',
  inputs: [
    { name: 'pairs', label: 'Pairs (n1,c1 per line)', placeholder: 'n1,c1\\nn2,c2\\nn3,c3...', multiline: true, rows: 5 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter exponent e (e.g., 3)...', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.pairs || !vals.e) {
      return `print("ERROR: Missing required inputs (pairs, e)")
print("HASTAD=FAILED")`;
    }
    return `def _attack():
    try:
        e = Integer(${vals.e})
        print(f"Hastad's Broadcast Attack")
        print(f"Public exponent: e = {e}")
        if e < 2:
            print(f"ERROR: e must be >= 2, got e = {e}")
            print("HASTAD=FAILED")
        else:
            pairs_str = """${vals.pairs}""".strip()
            pairs = []
            for line in pairs_str.split('\\n'):
                line = line.strip()
                if not line:
                    continue
                parts = line.split(',')
                if len(parts) < 2:
                    continue
                n_i = Integer(parts[0].strip())
                c_i = Integer(parts[1].strip())
                pairs.append((n_i, c_i))
            print(f"Number of ciphertexts: {len(pairs)}")
            if len(pairs) < e:
                print(f"ERROR: Need at least {e} ciphertexts for e = {e}, got {len(pairs)}")
                print("HASTAD=FAILED")
            else:
                moduli = [p[0] for p in pairs[:e]]
                remainders = [p[1] for p in pairs[:e]]
                m_e = crt(remainders, moduli)
                N = prod(moduli)
                print(f"CRT combined m^e = {m_e}")
                print(f"Modulus product bits: {N.nbits()}")
                m, exact = m_e.nth_root(e, truncate_mode=True)
                if exact:
                    print(f"Recovered message: m = {m}")
                    all_ok = True
                    for i, (n_i, c_i) in enumerate(pairs):
                        v = power_mod(m, e, n_i)
                        ok = v == c_i
                        if not ok:
                            all_ok = False
                        print(f"  Verify {i+1}: m^{e} mod n{i+1} = {v} (c{i+1} = {c_i}) {'OK' if ok else 'FAIL'}")
                    if all_ok:
                        print("HASTAD=SUCCESS")
                    else:
                        print("HASTAD=FAILED")
                else:
                    print(f"Approximate root: m = {m}")
                    print("Warning: m^e was not a perfect e-th power")
                    print("HASTAD=FAILED")
    except Exception as exc:
        print(f"ERROR: {exc}")
        print("HASTAD=FAILED")
_attack()`;
  },
  proof: `\\textbf{Theorem:} Given $c_i \\equiv m^e \\pmod{n_i}$ with pairwise coprime $n_i$ and $k \\geq e$, recover $m$ via CRT + $e$-th root.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_i \\equiv m^e \\pmod{n_i}$, $\\gcd(n_i,n_j) = 1$
\\item $k \\geq e$, $m^e < \\prod n_i$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
C &\\equiv c_i \\pmod{n_i} \\quad \\text{(CRT)} \\\\
C &\\equiv m^e \\pmod{N}, \\quad N = \\prod_{i=1}^{k} n_i \\\\
m^e < N &\\implies C = m^e \\quad \\text{(over } \\mathbb{Z}\\text{)} \\\\
m &= \\sqrt[e]{C} \\qed
\\end{align*}

\\textbf{References:} J. Hastad, Eurocrypt 1988; Boneh, 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.pairs && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const pairs: string[] = [];
  for (let i = 0; i < 3; i++) {
    const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
    pairs.push(`${n},${encrypt(m, n, e)}`);
  }
  return { pairs: pairs.join('\n'), e: e.toString() };
};
