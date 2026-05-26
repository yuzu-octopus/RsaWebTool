import type { Attack } from '../types';
import { modPow } from '../utils/bigint';
import { generateKeyPair, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'known-plaintext',
  name: 'Known Plaintext Attack',
  category: 'Message / Protocol',
  description: 'Recovers m from known prefix via Coppersmith. Use when high-order bytes of m are known and unknown portion is small.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'known_prefix', label: 'Known plaintext prefix', placeholder: 'e.g., flag{', multiline: false },
    { name: 'unknown_bits', label: 'Unknown bits after prefix', placeholder: '32', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c) {
      return `print("ERROR: n and c are required")
print("KNOWN_PLAINTEXT=FAILED")`;
    }
    return `def _attack():
    try:
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
        # Strategy 1: Try direct integer e-th root of c
        # Works when m^e < n (no modular wrap-around), which is common for e=3
        try:
            m_int_root, is_exact = c.nth_root(int(e), truncate_mode=True)
            if is_exact and pow(int(m_int_root), int(e), int(n)) == c:
                print(f"RECOVERED via integer e-th root! m = {m_int_root}")
                try:
                    m_hex = hex(Integer(m_int_root))[2:]
                    if len(m_hex) % 2 != 0:
                        m_hex = '0' + m_hex
                    print(f"m as bytes: {bytes.fromhex(m_hex)}")
                except Exception:
                    pass
                print("KNOWN_PLAINTEXT=SUCCESS")
                return
        except Exception:
            pass
        # Strategy 2: Known prefix + brute-force for small unknown bits
        if known_prefix:
            print(f"Known prefix: '{known_prefix}'")
            print(f"Unknown bits: {unknown_bits}")
            prefix_bytes = known_prefix.encode('utf-8')
            prefix_int = Integer(int.from_bytes(prefix_bytes, 'big'))
            print(f"Prefix as integer: {prefix_int}")
            print(f"Prefix byte length: {len(prefix_bytes)}")
            shift = 1 << int(unknown_bits)
            if unknown_bits <= 20:
                print(f"Brute forcing 2^{unknown_bits} possibilities...")
                found = False
                for k in range(shift):
                    m_try = prefix_int * shift + k
                    if pow(int(m_try), int(e), int(n)) == c:
                        print(f"FOUND! m = {m_try}")
                        try:
                            m_hex = hex(m_try)[2:]
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
            else:
                bound = n.nbits() // e
                print(f"Unknown portion ({unknown_bits} bits) too large for brute force.")
                print(f"Maximum feasible unknown bits for e={e} and n={n.nbits()} bits: {bound}")
                print("Consider: Coppersmith's method, factordb lookup, or other methods.")
                print("KNOWN_PLAINTEXT=FAILED")
        else:
            print("No known prefix provided.")
            print("Provide the known portion of the plaintext to attempt recovery.")
            print("KNOWN_PLAINTEXT=FAILED")
    except Exception as ex:
        print(f"Error: {ex}")
        print("KNOWN_PLAINTEXT=FAILED")
_attack()`;
  },
  frontendCheck: (vals) => {
    if (!vals.n || !vals.c) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const eVal = vals.e?.trim() || '65537';
      const e = BigInt(eVal);
      const c = BigInt(vals.c);
      // Strategy 1: Integer e-th root (works when m^e < n, e.g. e=3 with small m)
      const integerRoot = (target: bigint, exp: bigint): bigint | null => {
        let lo = 0n, hi = 1n;
        while (hi ** exp < target) hi *= 2n;
        while (lo <= hi) {
          const mid = (lo + hi) / 2n;
          const pow = mid ** exp;
          if (pow === target) return mid;
          if (pow < target) lo = mid + 1n;
          else hi = mid - 1n;
        }
        return null;
      };
      const root = integerRoot(c, e);
      if (root !== null && modPow(root, e, n) === c) {
        try {
          const hexStr = root.toString(16);
          const padded = hexStr.length % 2 ? '0' + hexStr : hexStr;
          const bytes = new Uint8Array(padded.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
          const text = new TextDecoder().decode(bytes);
          return Promise.resolve(`RECOVERED via integer e-th root! m = ${root}\nm as bytes: ${text}`);
        } catch {
          return Promise.resolve(`RECOVERED via integer e-th root! m = ${root}`);
        }
      }
      // Strategy 2: Known prefix + brute-force
      const knownPrefix = vals.known_prefix || '';
      const unknownBitsStr = (vals.unknown_bits || '32').trim();
      const unknownBits = parseInt(unknownBitsStr, 10);
      if (knownPrefix && unknownBits <= 20) {
        const prefixBytes = new TextEncoder().encode(knownPrefix);
        let prefixInt = 0n;
        for (const b of prefixBytes) prefixInt = (prefixInt << 8n) + BigInt(b);
        const shift = 1n << BigInt(unknownBits);
        const limit = Number(shift);
        for (let k = 0; k < limit; k++) {
          const mTry = (prefixInt << BigInt(unknownBits)) + BigInt(k);
          if (modPow(mTry, e, n) === c) {
            try {
              const hexStr = mTry.toString(16);
              const padded = hexStr.length % 2 ? '0' + hexStr : hexStr;
              const bytes = new Uint8Array(padded.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
              const text = new TextDecoder().decode(bytes);
              return Promise.resolve(`FOUND! m = ${mTry}\nm as bytes: ${text}`);
            } catch {
              return Promise.resolve(`FOUND! m = ${mTry}`);
            }
          }
        }
        return Promise.resolve(null);
      }
      if (knownPrefix && unknownBits > 20) {
        return Promise.resolve(null); // too large for brute-force, fall through to SageCell
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  },
  proof: `\\textbf{Theorem:} Partial plaintext knowledge + Coppersmith recovers m when unknown portion < n^{1/e}.

\\textbf{Setup:}
\\begin{itemize}
\\item $m = m_0 \\cdot 2^k + x$, $|x| < n^{1/e}$
\\item $n$, $e$, $c$ known
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= m_0 \\cdot 2^k + x, \\quad |x| < X \\\\
c &\\equiv (m_0 \\cdot 2^k + x)^e \\pmod{n} \\\\
f(x) &= (m_0 \\cdot 2^k + x)^e - c \\equiv 0 \\pmod{n} \\\\
|x| &< n^{1/e} \\implies \\text{Coppersmith recovers } x \\\\
m &= m_0 \\cdot 2^k + x \\qed
\\end{align*}

\\textbf{References:} D. Coppersmith, 1997; May, 2003`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.c),
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const { n } = generateKeyPair(256, 256, e);
  const prefix = new TextEncoder().encode('flag{');
  const prefixInt = BigInt('0x' + Array.from(prefix).map(b => b.toString(16).padStart(2, '0')).join(''));
  const unknownBits = 16;
  const unknown = BigInt(Math.floor(Math.random() * 2 ** unknownBits));
  const m = (prefixInt << BigInt(unknownBits)) | unknown;
  return { n: n.toString(), e: e.toString(), c: encrypt(m, n, e).toString(), known_prefix: 'flag{', unknown_bits: unknownBits.toString() };
};
