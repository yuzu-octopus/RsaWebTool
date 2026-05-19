import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'bleichenbacher-sig',
  name: 'Bleichenbacher Signature Forgery (e=3)',
  category: 'Message / Protocol',
  description: 'Forges signature with weak PKCS#1 v1.5 verification. Use when e=3 and padding check is loose.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'hash_hex', label: 'Hash (hex)', placeholder: 'Enter hash in hex (e.g., SHA256)...', multiline: false },
  ],
  sageTemplate: (v) => `n = Integer(${v.n})
hash_hex = "${v.hash_hex || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}".strip()
if not hash_hex:
    print("ERROR: hash_hex is empty")
    print("BLEICHENBACHER_SIG=FAILED")
    return
e = Integer(${v.e || '3'})

if n < 2:
    print("Invalid input")
    print("BLEICHENBACHER_SIG=FAILED")
    return

print(f"Bleichenbacher Signature Forgery (e={e})")
print(f"n = {n}")
print(f"Target hash: {hash_hex}")
print()

if e != 3:
    print("This attack requires e=3.")
    print(f"Got e={e}.")
    print("BLEICHENBACHER_SIG=FAILED")
    return

# Construct EM: 0x00 || 0x01 || 0xFF*padding || 0x00 || DER_prefix || hash
# Simplified: EM = 0x0001FFFF...00[DER][hash]
n_bytes = (n.nbits() + 7) // 8
hash_int = Integer("0x" + hash_hex)
hash_bytes = (hash_int.nbits() + 7) // 8

# PKCS#1 v1.5 signature format: 00 01 FF...FF 00 <hash>
# EM = 0x0001 * 256^(n_bytes-2-hash_bytes) + (256^hash_bytes - 1) * 256^hash_bytes + hash_int
# Simplified: place hash at the end, fill middle with 0xFF
em = (2**(8 * (n_bytes - 2)) - 2**(8 * (hash_bytes + 2))) + (hash_int)
# Add 0x0001 prefix
em = em + (2**(8 * (n_bytes - 2)) - 2**(8 * (n_bytes - hash_bytes - 2)))

print(f"EM has {em.nbits()} bits")

# Compute integer cube root
S, exact = em.nth_root(3, truncate_mode=True)
if exact:
    print(f"Forged signature: S = {S}")
    check = power_mod(S, 3, n)
    print(f"S^3 mod n = {check}")
    check_hex = hex(check)[2:]
    if hash_hex in check_hex:
        print(f"Hash found in forged signature!")
        print("BLEICHENBACHER_SIG=SUCCESS")
    else:
        print("Hash not found in forged signature.")
        print("BLEICHENBACHER_SIG=FAILED")
else:
    # Try Coppersmith-style: S = floor(n^(1/3)) + delta
    n_root = n.nth_root(3, truncate_mode=True)[0]
    for delta in range(-1000, 1001):
        S = n_root + delta
        check = power_mod(S, 3, n)
        check_hex = hex(check)[2:]
        if hash_hex in check_hex[-len(hash_hex):]:
            print(f"Found with delta={delta}")
            print(f"Forged signature: S = {S}")
            print("BLEICHENBACHER_SIG=SUCCESS")
            break
    else:
        print("No valid forgery found in search range.")
        print("BLEICHENBACHER_SIG=FAILED")
`,
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
  return { n: n.toString(), hash_hex: 'a'.repeat(32) };
};
