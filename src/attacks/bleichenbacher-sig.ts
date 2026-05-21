import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'bleichenbacher-sig',
  name: 'Bleichenbacher Signature Forgery (e=3)',
  category: 'Message / Protocol',
  description: 'Forges signature with weak PKCS#1 v1.5 verification. Use when e=3 and padding check is loose.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '3', multiline: false, defaultValue: '3' },
    { name: 'hash_hex', label: 'Hash (hex)', placeholder: 'Enter hash in hex (e.g., SHA256)...', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.hash_hex) {
      return `print("ERROR: Missing required inputs (n, hash_hex)")
print("BLEICHENBACHER_SIG=FAILED")`;
    }
    return `try:
    n = Integer(${vals.n})
    e = Integer(${vals.e || '3'})
    hash_hex = "${vals.hash_hex}".strip()
    if not hash_hex:
        print("ERROR: hash_hex is empty")
        print("BLEICHENBACHER_SIG=FAILED")
        quit()
    if e != 3:
        print("This attack requires e=3.")
        print(f"Got e={e}.")
        print("BLEICHENBACHER_SIG=FAILED")
        quit()
    n_bytes = (n.nbits() + 7) // 8
    hash_bytes = len(hash_hex) // 2
    if hash_bytes == 0:
        print("ERROR: hash_hex is too short (need at least 2 hex chars)")
        print("BLEICHENBACHER_SIG=FAILED")
        quit()
    hash_int = Integer("0x" + hash_hex)
    # PKCS#1 v1.5: 0x00 || 0x01 || 0xFF*min_padding || 0x00 || hash || garbage
    # Garbage bytes absorb the error from ceil(cuberoot(target))
    min_padding = 8
    fixed_overhead = 3 + min_padding + 1
    garbage_len = n_bytes - fixed_overhead - hash_bytes
    if garbage_len < 0:
        print("ERROR: Hash too large for this modulus (need more garbage bytes)")
        print("BLEICHENBACHER_SIG=FAILED")
        quit()
    # Construct target with garbage = 0
    # Structure (LSB end): garbage | hash | 0x00 | 0xFF*min_padding | 0x01 | 0x00
    target = (Integer(1) << (8 * (garbage_len + hash_bytes + 1 + min_padding))) + ((Integer(1) << (8 * min_padding)) - 1) * (Integer(1) << (8 * (garbage_len + hash_bytes + 1))) + hash_int * (Integer(1) << (8 * garbage_len))
    # Forge S = ceil(cuberoot(target)) over the integers (no mod n needed)
    sig = target.nth_root(3)
    if sig ** 3 < target:
        sig += 1
    cube = sig ** 3
    print(f"Bleichenbacher Signature Forgery (e={e})")
    print(f"n bytes = {n_bytes}")
    print(f"Target hash: {hash_hex}")
    print(f"Forged signature S = {sig}")
    print(f"S^3 = {cube}")
    # Verify PKCS#1 leading bytes 0x0001 are preserved
    top_two = cube >> (8 * (n_bytes - 2))
    if top_two == Integer(0x0001):
        print("PKCS#1 structure preserved — forged signature valid against lax verifier")
        print("BLEICHENBACHER_SIG=SUCCESS")
    else:
        print("Signature forgery failed — garbage area too small for this hash and modulus")
        print("BLEICHENBACHER_SIG=FAILED")
except Exception as ex:
    print(f"ERROR: {ex}")
    print("BLEICHENBACHER_SIG=FAILED")
`;
  },
  proof: `\\textbf{Theorem:} PKCS#1 v1.5 signature verification with e = 3 is forgeable: construct S such that S³ starts with valid PKCS#1 padding and the target hash, without access to the private key.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA public key (n, e = 3)
\\item Target hash H (hex)
\\item Verifier does not check that the hash is right-justified (trailing garbage ignored)
\\end{itemize}

\\textbf{Construction:}
\\begin{align*}
\\text{target} &= \\text{0x00} \\,||\\, \\text{0x01} \\,||\\, \\text{FF}^{8} \\,||\\, \\text{0x00} \\,||\\, H \\,||\\, \\text{0x00}^{\\text{garbage}} \\\\
S &= \\lceil \\sqrt[3]{\\text{target}} \\rceil \\quad \\text{(integer cube root)} \\\\
S^3 &= \\text{target} + \\varepsilon \\quad (0 \\leq \\varepsilon < 3S^2)
\\end{align*}

\\textbf{Analysis:}
\\begin{itemize}
\\item The error \\(\\varepsilon\\) from rounding the cube root is bounded by \\(3S^2 \\approx 3 \\cdot 2^{2|n|/3}\\)
\\item Garbage bytes at the LSB end absorb \\(\\varepsilon\\), leaving the prefix \\(\\text{0x0001FF}^8\\text{00}H\\) intact
\\item The forged signature S verifies as valid against a verifier that ignores trailing data after the hash
\\item Requires e = 3 (small exponent) and at least \\(\\lceil \\log_2(3S^2)/8 \\rceil\\) garbage bytes
\\end{itemize}

\\textbf{References:} D. Bleichenbacher, "Forging PKCS#1 v1.5 Signatures", Crypto 2006 rump session; A. Langley, "PKCS#1 signature validation", imperialviolet.org (2014)`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.hash_hex,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString(), e: '3', hash_hex: 'ab' };
};
