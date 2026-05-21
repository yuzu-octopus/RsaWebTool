import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'known-plaintext',
  name: 'Known Plaintext Attack',
  category: 'Advanced',
  description: 'Recovers m from known prefix via Coppersmith. Use when high-order bytes of m are known and unknown portion is small.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'known_prefix', label: 'Known plaintext prefix', placeholder: 'e.g., flag{', multiline: false },
    { name: 'unknown_bits', label: 'Unknown bits after prefix', placeholder: '32', defaultValue: '32', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c) {
      return `print("ERROR: n and c are required")
print("KNOWN_PLAINTEXT=FAILED")`;
    }
    return `try:
    n = Integer(${vals.n})
    e_val = "${vals.e}".strip()
    e = Integer(e_val) if e_val else Integer(65537)
    c = Integer(${vals.c})
    known_prefix = "${vals.known_prefix || ''}"
    unknown_bits = Integer("${(vals.unknown_bits || '32').trim()}")
    print(f"Known plaintext attack on RSA")
    print(f"n = {n} ({n.nbits()} bits)")
    print(f"e = {e}")
    print(f"c = {c}")
    if known_prefix:
        print(f"Known prefix: '{known_prefix}'")
        print(f"Unknown bits: {unknown_bits}")
        prefix_bytes = known_prefix.encode('utf-8')
        prefix_int = Integer(int.from_bytes(prefix_bytes, 'big'))
        print(f"Prefix as integer: {prefix_int}")
        print(f"Prefix byte length: {len(prefix_bytes)}")
        shift = Integer(2)**unknown_bits
        bound = n.nbits() // e
        if unknown_bits <= 16:
            print(f"Brute forcing 2^{unknown_bits} possibilities...")
            found = False
            for k in range(Integer(2)**unknown_bits):
                if power_mod(prefix_int * shift + k, e, n) == c:
                    print(f"FOUND! m = {prefix_int * shift + k}")
                    m_found = prefix_int * shift + k
                    try:
                        m_hex = hex(m_found)[2:]
                        if len(m_hex) % 2 != 0:
                            m_hex = '0' + m_hex
                        print(f"m as bytes: {bytes.fromhex(m_hex)}")
                    except:
                        pass
                    print("KNOWN_PLAINTEXT=SUCCESS")
                    found = True
                    break
            if not found:
                print("Brute force exhausted without finding match.")
                print("KNOWN_PLAINTEXT=FAILED")
        elif unknown_bits <= bound:
            print(f"Using Coppersmith's method (bound = 2^{bound})...")
            R.<x> = PolynomialRing(Zmod(n))
            f = (prefix_int * shift + x)**e - c
            f = f.monic()
            roots = f.small_roots(X=shift, beta=1.0, epsilon=0.05)
            if roots:
                x = Integer(roots[0])
                m = prefix_int * shift + x
                print(f"FOUND! m = {m}")
                try:
                    m_hex = hex(m)[2:]
                    if len(m_hex) % 2 != 0:
                        m_hex = '0' + m_hex
                    print(f"m as bytes: {bytes.fromhex(m_hex)}")
                except:
                    print(f"m as hex: {hex(m)}")
                print("KNOWN_PLAINTEXT=SUCCESS")
            else:
                print("Coppersmith's method did not find a solution.")
                print("Try increasing epsilon, verify the unknown_bits is correct,")
                print("or the unknown portion may be too large for current parameters.")
                print("KNOWN_PLAINTEXT=FAILED")
        else:
            print(f"Unknown portion ({unknown_bits} bits) too large for this attack.")
            print(f"Maximum feasible unknown bits for e={e} and n={n.nbits()} bits: {bound}")
            print("Consider: factordb lookup, Fermat factorization, or other methods.")
            print("KNOWN_PLAINTEXT=FAILED")
    else:
        print("No known prefix provided.")
        print("Provide the known portion of the plaintext to attempt recovery.")
        print("KNOWN_PLAINTEXT=FAILED")
except Exception as ex:
    print(f"KNOWN_PLAINTEXT=FAILED: {ex}")
`;
  },
  proof: `\\textbf{Theorem:} Partial knowledge of the plaintext \\(m\\) enables RSA decryption via Coppersmith's method for small unknown portions.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Public key \\((n, e)\\) and ciphertext \\(c\\)
\\item Known prefix \\(m_0\\) such that \\(m = m_0 \\cdot 2^k + x\\) with unknown \\(x < 2^k\\)
\\item \\(k\\) — number of unknown bits, determines attack feasibility
\\item For brute force: \\(k \\leq 16\\); for Coppersmith: \\(k < \\frac{\\log_2 n}{e}\\)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= m_0 \\cdot 2^k + x, \\quad |x| < X = 2^k \\\\
c &\\equiv m^e \\pmod{n} \\\\
f(x) &= (m_0 \\cdot 2^k + x)^e - c \\equiv 0 \\pmod{n} \\\\
|x| &< n^{1/e} \\implies \\text{Coppersmith recovers } x \\\\
m &= m_0 \\cdot 2^k + x \\qed
\\end{align*}

\\textbf{Explanation:} The known prefix fixes the high-order bits of \\(m\\). Coppersmith's method finds the small unknown portion \\(x\\) as a root of the polynomial \\(f(x)\\) modulo \\(n\\). For very small unknowns (\\(\\leq 16\\) bits), brute force is faster. The attack works best with small \\(e\\) (e.g., \\(e=3\\)) because \\(n^{1/e}\\) is larger.

\\textbf{References:} D. Coppersmith, "Small Solutions to Polynomial Equations", 1997; May, "New RSA Vulnerabilities Using Lattice Reduction Methods", 2003`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.c),
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q, e);
  const prefix = new TextEncoder().encode('flag{');
  const prefixInt = BigInt('0x' + Array.from(prefix).map(b => b.toString(16).padStart(2, '0')).join(''));
  const unknownBits = 32;
  const unknown = BigInt(Math.floor(Math.random() * 2 ** unknownBits));
  const m = (prefixInt << BigInt(unknownBits)) | unknown;
  return { n: n.toString(), e: e.toString(), c: encrypt(m, n, e).toString(), known_prefix: 'flag{', unknown_bits: unknownBits.toString() };
};
