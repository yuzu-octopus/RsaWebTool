import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'known-plaintext',
  name: 'Known Plaintext Attack',
  category: 'Advanced',
  description: 'Recovers m from known prefix. Use when high-order bytes of m are known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'known_prefix', label: 'Known plaintext prefix (optional)', placeholder: 'e.g., flag{', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `# Validate inputs
if not "${vals.n}".strip():
    print("ERROR: n is required")
    print("KNOWN_PLAINTEXT=FAILED")
    quit()
if not "${vals.c}".strip():
    print("ERROR: c is required")
    print("KNOWN_PLAINTEXT=FAILED")
    quit()

try:
    n = Integer(${vals.n})
    e_val = "${vals.e}".strip()
    e = Integer(e_val) if e_val else Integer(65537)
    c = Integer(${vals.c})
    known_prefix = "${vals.known_prefix || ''}"

    print("Known plaintext attack on RSA")
    print(f"n = {n}")
    print(f"e = {e}")
    print(f"c = {c}")
    if known_prefix:
        print(f"Known prefix: '{known_prefix}'")
    print()

    # Convert known prefix to integer
    if known_prefix:
        prefix_bytes = known_prefix.encode('utf-8')
        prefix_int = Integer(int.from_bytes(prefix_bytes, 'big'))
        prefix_len = len(prefix_bytes)

        print(f"Prefix as integer: {prefix_int}")
        print(f"Prefix byte length: {prefix_len}")
        print()

        # The plaintext m has form: m = prefix_int * 256^k + unknown
        # where k is the number of unknown bytes
        # c = m^e mod n
        # We need to find m such that m^e = c (mod n) and m starts with prefix

        # Estimate total message length
        n_bits = n.nbits()
        max_bytes = n_bits // 8

        # Try brute force for small unknown portions
        unknown_bytes = max_bytes - prefix_len
        print(f"Estimated message length: {max_bytes} bytes")
        print(f"Unknown portion: {unknown_bytes} bytes")
        print()

        if unknown_bytes <= 4:
            print(f"Brute forcing {unknown_bytes} unknown byte(s)...")
            bound = 256**unknown_bytes
            found = False
            for k in range(bound):
                m = prefix_int * (256**unknown_bytes) + k
                if power_mod(m, e, n) == c:
                    print(f"FOUND! m = {m}")
                    print(f"m as bytes: {bytes.fromhex(hex(m)[2:] if len(hex(m)) % 2 == 0 else '0' + hex(m)[2:])}")
                    found = True
                    break
            if not found:
                print("Brute force exhausted without finding match.")
                print("KNOWN_PLAINTEXT=FAILED")
            else:
                print("KNOWN_PLAINTEXT=SUCCESS")
        elif unknown_bytes <= 10:
            print(f"Using Coppersmith's method for {unknown_bytes} unknown bytes...")
            # m = prefix * 2^k + x, where x is small
            R.<x> = PolynomialRing(Zmod(n))
            shift = 256**unknown_bytes
            f = (prefix_int * shift + x)**e - c
            roots = f.small_roots(X=shift, beta=1.0, epsilon=0.01)
            if roots:
                x = int(roots[0])
                m = prefix_int * shift + x
                print(f"FOUND! m = {m}")
                try:
                    print(f"m as bytes: {bytes.fromhex(hex(m)[2:].zfill(max_bytes*2))}")
                except:
                    print(f"m as hex: {hex(m)}")
                print("KNOWN_PLAINTEXT=SUCCESS")
            else:
                print("Coppersmith's method did not find a solution.")
                print("Try increasing epsilon or the unknown portion may be too large.")
                print("KNOWN_PLAINTEXT=FAILED")
        else:
            print(f"Unknown portion ({unknown_bytes} bytes) too large for direct attack.")
            print("Consider: lattice attacks, partial key recovery, or other methods.")
            print("KNOWN_PLAINTEXT=FAILED")
    else:
        print("No known prefix provided.")
        print("Try: small e attack, common modulus attack, or factorization methods.")
        print("KNOWN_PLAINTEXT=FAILED")

except Exception as ex:
    print(f"ERROR: {ex}")
    print("KNOWN_PLAINTEXT=FAILED")
`,
  proof: `\\textbf{Theorem:} Partial knowledge of the plaintext \\(m\\) enables RSA decryption via Coppersmith's method for small unknown portions.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Public key \\((n, e)\\) and ciphertext \\(c\\)
\\item Known prefix \\(m_0\\) such that \\(m = m_0 \\cdot 2^k + x\\) with unknown \\(x < 2^k\\)
\\item \\(k\\) — number of unknown bits, determines attack feasibility
\\item For brute force: \\(k \\leq 32\\) (4 bytes); for Coppersmith: \\(k \\lesssim \\frac{\\log_2 n}{e}\\)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= m_0 \\cdot 2^k + x, \\quad |x| < X = 2^k \\\\
c &\\equiv m^e \\pmod{n} \\\\
f(x) &= (m_0 \\cdot 2^k + x)^e - c \\equiv 0 \\pmod{n} \\\\
|x| &< n^{1/e} \\implies \\text{Coppersmith recovers } x \\\\
m &= m_0 \\cdot 2^k + x \\qed
\\end{align*}

\\textbf{Explanation:} The known prefix fixes the high-order bits of \\(m\\). Coppersmith's method finds the small unknown portion \\(x\\) as a root of the polynomial \\(f(x)\\) modulo \\(n\\). For very small unknowns (\\(\\leq 4\\) bytes), brute force is faster.

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
  return { n: n.toString(), e: e.toString(), c: encrypt(m, n, e).toString(), known_prefix: 'flag{' };
};
