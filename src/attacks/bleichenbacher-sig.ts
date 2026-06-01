import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { wrapSageTemplate } from './guard';

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
    return wrapSageTemplate({
      token: 'BLEICHENBACHER_SIG',
      useGuard: false,
      body: `        n = Integer(${vals.n})
        e = Integer(${vals.e || '3'})
        hash_hex = "${vals.hash_hex}".strip()
        found = True
        if not hash_hex:
            out.append("ERROR: hash_hex is empty")
            found = False
        elif e != 3:
            out.append("This attack requires e=3.")
            out.append(f"Got e={e}.")
            found = False
        else:
            n_bytes = (n.nbits() + 7) // 8
            hash_bytes = len(hash_hex) // 2
            if hash_bytes == 0:
                out.append("ERROR: hash_hex is too short (need at least 2 hex chars)")
                found = False
            else:
                garbage_len = n_bytes - 3 - 8 - hash_bytes
                if garbage_len < 0:
                    out.append("ERROR: Hash too large for this modulus (need more garbage bytes)")
                    found = False
        if found:
            hash_int = Integer("0x" + hash_hex)
            target = (Integer(1) << (8 * (garbage_len + hash_bytes + 1 + 8))) + ((Integer(1) << (8 * 8)) - 1) * (Integer(1) << (8 * (garbage_len + hash_bytes + 1))) + hash_int * (Integer(1) << (8 * garbage_len))
            sig, exact = target.nth_root(3, truncate_mode=True)
            if not exact:
                sig += 1
            cube = sig ** 3
            out.append("Bleichenbacher Signature Forgery (e=3)")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"hash_hex = {hash_hex}")
            out.append("")
            out.append("Results:")
            out.append(f"s = {sig}")
            top_two = cube >> (8 * (n_bytes - 2))
            if top_two == Integer(0x0001):
                out.append("")
                out.append(f"Verification: s^3 = {cube} (PKCS#1 0x0001 prefix)")
                out.append("")
                out.append("BLEICHENBACHER_SIG=SUCCESS")
            else:
                out.append("")
                out.append("Verification: signature forgery failed — garbage area too small")
                out.append("")
                out.append("BLEICHENBACHER_SIG=FAILED")
        else:
            out.append("BLEICHENBACHER_SIG=FAILED")`,
    });
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
