import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'small-public-exp',
  name: 'Small Public Exponent',
  category: 'Advanced',
  description: 'Recovers plaintext m via integer e-th root (m = (c + k*n)^(1/e)). Use when e is small (e.g., 3, 5, 17).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '3' },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'k_bound', label: 'k bound (c + k*n iterations)', placeholder: '100000', required: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c) {
      return `print("ERROR: Missing required inputs (n, c)")
print("SMALL_PUBLIC_EXP=FAILED")`;
    }
    return `def _attack():
    try:
        n = Integer(${vals.n})
        e_val = "${vals.e}".strip()
        e = Integer(e_val) if e_val else Integer(3)
        c = Integer(${vals.c})
        k_bound_val = "${vals.k_bound}".strip() if "${vals.k_bound}" else "100000"
        k_bound = Integer(k_bound_val) if k_bound_val else Integer(100000)
        out = []
        for k in range(int(k_bound) + 1):
            candidate = c + k * n
            m, exact = candidate.nth_root(e, truncate_mode=True)
            if exact:
                out.append(f"SUCCESS! k = {k}")
                out.append(f"m = {m}")
                try:
                    m_hex = hex(m)[2:]
                    if len(m_hex) % 2 != 0:
                        m_hex = '0' + m_hex
                    m_bytes = bytes.fromhex(m_hex)
                    out.append(f"m as text: {m_bytes.decode('utf-8', errors='replace')}")
                except Exception:
                    out.append(f"m as hex: {hex(m)}")
                break
        if not out:
            out.append(f"No perfect {e}-th power found for k in 0..{k_bound} with e = {e}")
        print("\\\\n".join(out))
        print("SMALL_PUBLIC_EXP=SUCCESS" if out else "SMALL_PUBLIC_EXP=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("SMALL_PUBLIC_EXP=FAILED")
    #
_attack()`;
  },
  frontendCheck: (vals: Record<string, string>): Promise<string | null> => {
    const n = BigInt(vals.n);
    const e = BigInt(vals.e || '3');
    const c = BigInt(vals.c);
    if (e > 1000n) return Promise.resolve(null); // Delegate to Sage for large e
    const kBound = BigInt(vals.k_bound || '100000');
    if (kBound < 0n) return Promise.resolve(null);

    // Integer e-th root via Newton's method from an upper bound
    const iroot = (value: bigint): bigint => {
      if (value < 2n) return value;
      const bits = value.toString(2).length;
      let x = 1n << BigInt(Math.ceil(bits / Number(e)));
      while (true) {
        const x_em1 = x ** (e - 1n);
        const next = ((e - 1n) * x * x_em1 + value) / (e * x_em1);
        if (next >= x) break;
        x = next;
      }
      return x;
    };

    for (let k = 0n; k <= kBound; k++) {
      const candidate = c + k * n;
      const root = iroot(candidate);
      if (root ** e === candidate) return Promise.resolve(`m = ${root}\nk = ${k}\nSMALL_PUBLIC_EXP=SUCCESS`);
      if ((root + 1n) ** e === candidate) return Promise.resolve(`m = ${root + 1n}\nk = ${k}\nSMALL_PUBLIC_EXP=SUCCESS`);
      if (root > 0n && (root - 1n) ** e === candidate) return Promise.resolve(`m = ${root - 1n}\nk = ${k}\nSMALL_PUBLIC_EXP=SUCCESS`);
    }
    return Promise.resolve(null);
  },
  proof: `\\textbf{Theorem:} If $m^e \\geq n$, then $m^e = c + k \\cdot n$ for some $k \\geq 0$, and $m = \\sqrt[e]{c + k \\cdot n}$ when $k = \\lfloor m^e / n \\rfloor$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n$ is an RSA modulus, $e$ is a small public exponent
\\item $c = m^e \\bmod n$ (ciphertext)
\\item $k$ is the quotient $\\lfloor m^e / n \\rfloor$, small when $m$ is near $n^{1/e}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c &\\equiv m^e \\pmod{n} \\\\
m^e &= c + k \\cdot n \\quad\\text{for some } k \\in \\mathbb{Z}_{\\geq 0} \\\\
\\therefore m &= \\sqrt[e]{c + k \\cdot n} \\quad\\text{when } k \\text{ is correct} \\qed
\\end{align*}

\\textbf{Explanation:} The RSA relation $c \\equiv m^e \\pmod{n}$ is equivalent to $m^e = c + k \\cdot n$ for some integer $k \\geq 0$. When $m^e < n$ (short plaintext), $k = 0$ and $m = \\sqrt[e]{c}$ directly. Otherwise, $k$ is the (unknown) quotient $\\lfloor m^e / n \\rfloor$. For small $e$, this quotient is often small enough to brute-force: we iterate $k = 0, 1, 2, \\ldots$ and check whether $c + k \\cdot n$ is an exact $e$-th power.

\\textbf{References:} D. Boneh et al., "Twenty Years of Attacks on the RSA Cryptosystem", Notices AMS 1999`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.e && p.c),
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, 3n);
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  return { n: n.toString(), e: e.toString(), c: encrypt(m, n, e).toString(), k_bound: '100000' };
};
