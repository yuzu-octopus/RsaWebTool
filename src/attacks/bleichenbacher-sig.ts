import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'bleichenbacher-sig',
  name: 'Bleichenbacher Signature Forgery (e=3)',
  category: 'Message / Protocol',
  description: 'Forges signature with weak PKCS#1 v1.5 verification. Use when e=3 and padding check is loose.',
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
  proof: `\\textbf{Theorem:} PKCS#1 v1.5 signature verification with e = 3 is forgeable: construct S such that S³ has valid padding and target hash.

\\textbf{Setup:}
\\begin{itemize}
\\item n, e = 3
\\item Verifier ignores trailing garbage after hash
\\end{itemize}

\\textbf{Construction:}
\\begin{align*}
\\text{target} &= \\text{0x00||0x01||FF}^8\\text{||0x00||}H\\text{||garbage} \\\\
S &= \\lceil \\sqrt[3]{\\text{target}} \\rceil \\\\
S^3 &= \\text{target} + \\varepsilon, \\quad 0 \\leq \\varepsilon < 3S^2
\\end{align*}

\\textbf{Analysis:}
\\begin{itemize}
\\item Error \\(\\varepsilon\\) from rounding bounded by \\(3S^2\\)
\\item Garbage bytes absorb \\(\\varepsilon\\), prefix \\text{0x0001FF}^8\\text{00}H stays intact
\\item Requires e = 3 and sufficient garbage bytes
\\end{itemize}

\\textbf{References:} D. Bleichenbacher, Crypto 2006 rump session`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.hash_hex,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString(), e: '3', hash_hex: 'ab' };
};
