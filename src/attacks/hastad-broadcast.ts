import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow, modInverse, iroot } from '../utils/bigint';

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
                        print()
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
        const fmt = (m: bigint): string => {
          const hex = m.toString(16);
          try {
            const padded = hex.length % 2 ? '0' + hex : hex;
            const bytes = new Uint8Array(padded.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
            return `Message recovered: m = ${m}\nm (hex) = 0x${hex}\nm (text) = ${new TextDecoder().decode(bytes)}\nHASTAD_BROADCAST=SUCCESS`;
          } catch {
            return `Message recovered: m = ${m}\nm (hex) = 0x${hex}\nHASTAD_BROADCAST=SUCCESS`;
          }
        };
        return Promise.resolve(fmt(lo));
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
\\end{align*}

\\textbf{Explanation:} CRT reconstructs $m^e$ as an integer $M$. Since $m^e$ is smaller than the product of all moduli, the reconstruction is exact — there is no modular wrap-around. The e-th root then recovers $m$ directly. This is why small exponents like $e = 3$ are dangerous when broadcasting: only 3 ciphertexts suffice for recovery.

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA," Eurocrypt 1988`,
  usageGuide: 'This attack recovers m when the same plaintext is encrypted with the same small exponent e to e different moduli.\n\nHow to use:\n1. Collect e ciphertext/modulus pairs: (c1, n1), (c2, n2), ..., (ce, ne)\n2. Paste them into the ciphertexts field, one per line: c, n\n3. Set e to the public exponent (usually 3)\n4. The attack uses CRT to combine the ciphertexts and takes the integer e-th root\n\nInput format:\nc1, n1\nc2, n2\nc3, n3\n\nTip: For convenience, paste this into Magic Mode which auto-detects the format. Works when m^e < n1*n2*...*ne.',
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
