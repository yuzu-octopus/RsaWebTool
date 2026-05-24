import type { Attack } from '../types';
import { TESTCASE_BITS, randomPrime } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'cube-root-crt',
  name: 'Cube Root CRT Attack',
  category: 'Message / Protocol',
  description: 'Finds all cube roots of c mod n. Use when e=3 and p ≡ q ≡ 1 (mod 3).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'p', label: 'p (prime factor)', placeholder: 'Enter prime factor p...', multiline: true, rows: 3 },
    { name: 'q', label: 'q (prime factor)', placeholder: 'Enter prime factor q...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c || !vals.p || !vals.q) {
      return `print("ERROR: Missing required inputs (n, c, p, q)")
print("CUBE_ROOT_CRT=FAILED")`;
    }
    return `def _attack():
    try:
        n = Integer(${vals.n})
        c = Integer(${vals.c})
        p = Integer(${vals.p})
        q = Integer(${vals.q})
        print(f"Cube Root CRT Attack (e = 3)")
        print(f"n = {n}")
        print(f"p = {p}, q = {q}")
        print()
        # Check conditions
        phi = (p - 1) * (q - 1)
        g = gcd(3, phi)
        print(f"gcd(3, phi(n)) = {g}")
        if g != 3:
            print("WARNING: gcd(3, phi) != 3. Standard cube root may apply.")
        # Cube roots mod p
        print(f"\\nFinding cube roots mod p...")
        Fp = GF(p)
        cp = Fp(c)
        roots_p = cp.nth_root(3, all=True)
        print(f"Cube roots mod p: {[Integer(r) for r in roots_p]}")
        # Cube roots mod q
        print(f"Finding cube roots mod q...")
        Fq = GF(q)
        cq = Fq(c)
        roots_q = cq.nth_root(3, all=True)
        print(f"Cube roots mod q: {[Integer(r) for r in roots_q]}")
        # CRT combine
        print(f"\\nAll possible plaintexts ({len(roots_p) * len(roots_q)} total):")
        found_valid = False
        for rp in roots_p:
            for rq in roots_q:
                m = crt([Integer(rp), Integer(rq)], [p, q])
                print(f"  m = {m}")
                v = power_mod(m, 3, n)
                ok = v == c
                if ok:
                    found_valid = True
                print(f"    m^3 mod n = {v} (c = {c}) {'OK' if ok else 'FAIL'}")
        if len(roots_p) * len(roots_q) == 1:
            print("\\nUnique solution found!")
        elif len(roots_p) * len(roots_q) == 9:
            print("\\n9 solutions (3 mod p × 3 mod q). Additional context needed to identify correct m.")
        if found_valid:
            print("CUBE_ROOT_CRT=SUCCESS")
        else:
            print("CUBE_ROOT_CRT=FAILED")
    except Exception as e:
        print(f"ERROR: {e}")
        print("CUBE_ROOT_CRT=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} When $e = 3$ and $p \\equiv q \\equiv 1 \\pmod{3}$, there are 9 cube roots via CRT.

\\textbf{Setup:}
\\begin{itemize}
\\item $e = 3$
\\item $3 \\mid (p-1)$, $3 \\mid (q-1)$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\{r_{p,1}, r_{p,2}, r_{p,3}\\} &= \\{x \\in \\mathbb{F}_p : x^3 = c\\} \\\\
\\{r_{q,1}, r_{q,2}, r_{q,3}\\} &= \\{x \\in \\mathbb{F}_q : x^3 = c\\} \\\\
m_{i,j} &= \\text{CRT}(r_{p,i}, r_{q,j}; p, q) \\\\
\\#\\text{solutions} &= 3 \\times 3 = 9 \\qed
\\end{align*}

\\textbf{References:} Williams, 1980; Rabin, 1979`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.c && !!p.p && !!p.q,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  function randomPrimeMod3(bits: number): bigint {
    while (true) {
      const p = randomPrime(bits);
      if (p % 3n === 1n) return p;
    }
  }
  const p = randomPrimeMod3(TESTCASE_BITS.p);
  const q = randomPrimeMod3(TESTCASE_BITS.q);
  const n = p * q;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const c = modPow(m, e, n);
  return { n: n.toString(), c: c.toString(), p: p.toString(), q: q.toString() };
};
