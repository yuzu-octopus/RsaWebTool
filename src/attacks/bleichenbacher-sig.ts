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
    print(f"Bleichenbacher Signature Forgery (e={e})")
    print(f"n = {n}")
    print(f"Target hash: {hash_hex}")
    print()
    # Construct EM: 0x00 || 0x01 || 0xFF...FF || 0x00 || hash
    n_bytes = (n.nbits() + 7) // 8
    hash_int = Integer("0x" + hash_hex)
    hash_bytes = len(hash_hex) // 2
    if hash_bytes == 0:
        print("ERROR: hash_hex is too short (need at least 2 hex chars)")
        print("BLEICHENBACHER_SIG=FAILED")
        quit()
    # Padding: at least 8 bytes of 0xFF
    pad_len = max(8, n_bytes - 3 - hash_bytes)
    em_len = 3 + pad_len + hash_bytes
    # EM = 0x0001 || 0xFF*pad_len || 0x00 || hash
    em = (Integer(1) << (8 * (em_len - 2))) + ((Integer(1) << (8 * pad_len)) - 1) * (Integer(1) << (8 * (1 + hash_bytes))) + hash_int
    print(f"EM has {em.nbits()} bits, n has {n.nbits()} bits")
    if em >= n:
        print("ERROR: EM >= n. Hash too large for this modulus.")
        print("BLEICHENBACHER_SIG=FAILED")
        quit()
    # Bleichenbacher: find S near n^(1/3) such that S^3 mod n ends with hash
    n_cbrt = n.nth_root(3, truncate_mode=True)[0]
    print(f"n^(1/3) = {n_cbrt}")
    found = False
    search_range = 100000
    for delta in range(-search_range, search_range + 1):
        S = n_cbrt + delta
        check = power_mod(S, 3, n)
        check_hex = hex(check)[2:].zfill(len(hash_hex))
        if check_hex.endswith(hash_hex):
            print(f"Found with delta={delta}")
            print(f"Forged signature: S = {S}")
            print(f"S^3 mod n = {check}")
            print(f"S^3 mod n (hex) = ...{check_hex[-len(hash_hex):]}")
            print(f"Hash found at end of forged signature!")
            found = True
            break
    if found:
        print("BLEICHENBACHER_SIG=SUCCESS")
    else:
        print(f"No valid forgery found in range +/- {search_range}.")
        print("Try a shorter hash or increase search range.")
        print("BLEICHENBACHER_SIG=FAILED")
except Exception as ex:
    print(f"ERROR: {ex}")
    print("BLEICHENBACHER_SIG=FAILED")
`;
  },
  proof: `\\textbf{Theorem:} PKCS#1 v1.5 verification with e = 3 is forgeable: construct S such that S³ mod n has valid format without the private key.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n (modulus), e = 3
\\item Target hash H (hex)
\\item Verifier does not strictly check all padding bytes
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
EM &= \\text{0x00} || \\text{0x01} || \\text{FF} \\cdots \\text{FF} || \\text{0x00} || \\text{DER} || H \\\\
S &= \\lfloor n^{1/3} \\rfloor + \\delta \\\\
S^3 &\\equiv EM \\pmod{n} \\\\
EM < n &\\implies S^3 = EM \\quad \\text{(exact, no mod reduction)} \\\\
\\text{Adjust } \\delta &\\text{ so } S^3 \\text{ ends with } H \\\\
\\text{Verifier checks hash suffix only} &\\implies \\text{forgery accepted} \\qed
\\end{align*}

\\textbf{Explanation:} Construct S ≈ ∛n and adjust lower bits so S³ ends with the target hash. If the verifier only checks that the hash appears at the correct position (not full padding), the forged signature passes. Requires e = 3 and lax verification.

\\textbf{References:} D. Bleichenbacher, "Forging PKCS#1 v1.5 Signatures", Crypto 2006 rump session; Halderman et al., "Low-Exponent RSA Signatures", 2006`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.hash_hex,
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString(), e: '3', hash_hex: 'ab' };
};
