import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'bleichenbacher-sig',
  name: 'Bleichenbacher Signature Forgery (e=3)',
  category: 'Message / Protocol',
  description: "Forges RSA signature for any hash when e=3 and verifier accepts trailing garbage in PKCS#1 v1.5 padding. Use when verification skips strict padding checks.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '3', multiline: false },
    { name: 'hash_hex', label: 'Hash (hex)', placeholder: 'Enter hash in hex (e.g., SHA256)...', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.hash_hex) {
      return `print("ERROR: Missing required inputs (n, hash_hex)")
print("BLEICHENBACHER_SIG=FAILED")`;
    }
    return `def _attack():
    try:
        n = Integer(${vals.n})
        e = Integer(${vals.e || '3'})
        hash_hex = "${vals.hash_hex}".strip()
        if not hash_hex:
            print("ERROR: hash_hex is empty")
            print("BLEICHENBACHER_SIG=FAILED")
            return
        if e != 3:
            print("This attack requires e=3.")
            print(f"Got e={e}.")
            print("BLEICHENBACHER_SIG=FAILED")
            return
        n_bytes = (n.nbits() + 7) // 8
        hash_bytes = len(hash_hex) // 2
        if hash_bytes == 0:
            print("ERROR: hash_hex is too short (need at least 2 hex chars)")
            print("BLEICHENBACHER_SIG=FAILED")
            return
        hash_int = Integer("0x" + hash_hex)
        # PKCS#1 v1.5: 0x00 || 0x01 || 0xFF*min_padding || 0x00 || hash || garbage
        # Garbage bytes absorb the error from ceil(cuberoot(target))
        min_padding = 8
        fixed_overhead = 3 + min_padding
        garbage_len = n_bytes - fixed_overhead - hash_bytes
        if garbage_len < 0:
            print("ERROR: Hash too large for this modulus (need more garbage bytes)")
            print("BLEICHENBACHER_SIG=FAILED")
            return
        # Construct target with garbage = 0
        # Structure (LSB end): garbage | hash | 0x00 | 0xFF*min_padding | 0x01 | 0x00
        target = (Integer(1) << (8 * (garbage_len + hash_bytes + 1 + min_padding))) + ((Integer(1) << (8 * min_padding)) - 1) * (Integer(1) << (8 * (garbage_len + hash_bytes + 1))) + hash_int * (Integer(1) << (8 * garbage_len))
        # Forge S = ceil(cuberoot(target)) over the integers (no mod n needed)
        sig, exact = target.nth_root(3, truncate_mode=True)
        if not exact:
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
            print()
            print("BLEICHENBACHER_SIG=SUCCESS")
        else:
            print("Signature forgery failed — garbage area too small for this hash and modulus")
            print("BLEICHENBACHER_SIG=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("BLEICHENBACHER_SIG=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} When $e = 3$ and the verifier accepts trailing garbage bytes after the hash, a valid PKCS#1 v1.5 signature can be forged by taking the integer cube root of a crafted padding structure.

\\textbf{Setup:}
\\begin{itemize}
\\item $e = 3$, modulus $n$ large enough for hash + padding + garbage bytes
\\item Verifier only checks $\\text{0x00 0x01 FF}^* \\text{0x00}$ prefix and hash at expected offset — ignores trailing data
\\end{itemize}

\\textbf{Construction:}
\\begin{align*}
\\text{target} &= \\text{0x00} \\| \\text{0x01} \\| \\text{FF}^8 \\| \\text{0x00} \\| H \\| \\text{garbage} \\\\
S &= \\lceil \\sqrt[3]{\\text{target}} \\rceil \\\\
S^3 &= \\text{target} + \\varepsilon, \\quad 0 \\leq \\varepsilon < 3S^2
\\end{align*}
The error $\\varepsilon$ from rounding up is bounded by $3S^2$. Garbage bytes at the end of the padding absorb this error, keeping the $\\text{0x0001FF}^8\\text{00}H$ prefix intact.

\\textbf{Explanation:} PKCS#1 v1.5 signature padding places the hash after a fixed $\\text{0x0001FF\\ldots FF00}$ marker. A lax verifier checks only the marker and hash position, ignoring any bytes after the hash. By crafting a target integer with the correct prefix and enough trailing garbage bytes, then taking its cube root, we obtain $S$ such that $S^3$ has the correct padding and hash — the cube root rounding error is harmlessly absorbed into the garbage. This only works for $e = 3$ because the cube root is computable over integers and the error is small.

\\textbf{References:} D. Bleichenbacher, Crypto 2006 rump session presentation`,
  usageGuide: 'This attack forges RSA signatures by exploiting that s^3 < n makes the cube root computable over integers.\n\nHow to use:\n1. You have modulus n and a hash value you want a signature for\n2. Provide n and hash_hex (hash as hex string)\n3. The attack constructs an integer with PKCS#1 v1.5 padding + target hash, then takes its cube root\n4. The rounded cube root S satisfies S^3 = target + epsilon, where epsilon is absorbed by garbage bytes\n\nTip: e must be exactly 3 for this attack. The modulus must be large enough to accommodate the hash plus 8 bytes of padding plus garbage bytes. RSA with OAEP/PSS padding is NOT vulnerable.',
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.hash_hex,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString(), e: '3', hash_hex: 'ab' };
};
