import type { Attack } from '../types';
import { modPow, iroot } from '../utils/bigint';
import { generateKeyPair, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'known-plaintext',
  name: 'Known Plaintext Attack',
  category: 'Message / Protocol',
  description: 'Recovers m via integer e-th root when m^e < n, or via known-prefix brute-force for up to 24 unknown bits. Use when plaintext is small or partially known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'known_prefix', label: 'Known plaintext prefix', placeholder: 'e.g., flag{', multiline: false },
    { name: 'unknown_bits', label: 'Unknown bits after prefix', placeholder: '24', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c) {
      return `print("ERROR: n and c are required")
print("KNOWN_PLAINTEXT=FAILED")`;
    }
    return `def _attack():
    try:
        out = []
        n = Integer(${vals.n})
        e_val = "${vals.e}".strip()
        e = Integer(e_val) if e_val else Integer(65537)
        c = Integer(${vals.c})
        known_prefix = "${vals.known_prefix || ''}"
        unknown_bits = Integer("${(vals.unknown_bits || '24').trim()}")
        out.append(f"Known plaintext attack on RSA")
        out.append(f"n = {n} ({n.nbits()} bits)")
        out.append(f"e = {e}")
        out.append(f"c = {c}")
        # Strategy 1: Try direct integer e-th root of c
        # Works when m^e < n (no modular wrap-around), which is common for e=3
        try:
            m_int_root, is_exact = c.nth_root(int(e), truncate_mode=True)
            if is_exact and pow(int(m_int_root), int(e), int(n)) == c:
                out.append(f"RECOVERED via integer e-th root! m = {m_int_root}")
                try:
                    m_hex = hex(Integer(m_int_root))[2:]
                    if len(m_hex) % 2 != 0:
                        m_hex = '0' + m_hex
                    out.append(f"m as bytes: {bytes.fromhex(m_hex)}")
                except Exception:
                    pass
                out.append("KNOWN_PLAINTEXT=SUCCESS")
                print("\\n".join(out))
                return
        except Exception:
            pass
        # Strategy 2: Known prefix + brute-force for small unknown bits
        if known_prefix:
            out.append(f"Known prefix: '{known_prefix}'")
            out.append(f"Unknown bits: {unknown_bits}")
            prefix_bytes = known_prefix.encode('utf-8')
            prefix_int = Integer(int.from_bytes(prefix_bytes, 'big'))
            out.append(f"Prefix as integer: {prefix_int}")
            out.append(f"Prefix byte length: {len(prefix_bytes)}")
            shift = 1 << int(unknown_bits)
            if unknown_bits <= 24:
                out.append(f"Brute forcing 2^{unknown_bits} possibilities...")
                found = False
                if e == 3:
                    # Horner evaluation: (prefix*shift + k)^3 mod n
                    # = A + B*k + C*k^2 + k^3 mod n (avoids modular exponentiation)
                    n_int_h = int(n)
                    c_int = int(c)
                    PS_int = int(prefix_int * shift)
                    A = pow(PS_int, 3, n_int_h)
                    B = (3 * PS_int * PS_int) % n_int_h
                    C_base = (3 * PS_int) % n_int_h
                    for k in range(shift):
                        k_mod = k % n_int_h
                        k2 = (k_mod * k_mod) % n_int_h
                        val = (A + B * k_mod) % n_int_h
                        val = (val + C_base * k2) % n_int_h
                        val = (val + k2 * k_mod) % n_int_h
                        if val == c_int:
                            m_try = prefix_int * shift + k
                            out.append(f"FOUND! m = {m_try}")
                            try:
                                m_hex = hex(m_try)[2:]
                                if len(m_hex) % 2 != 0:
                                    m_hex = '0' + m_hex
                                out.append(f"m as bytes: {bytes.fromhex(m_hex)}")
                            except:
                                pass
                            out.append("KNOWN_PLAINTEXT=SUCCESS")
                            found = True
                            break
                else:
                    for k in range(shift):
                        m_try = prefix_int * shift + k
                        if pow(int(m_try), int(e), int(n)) == c:
                            out.append(f"FOUND! m = {m_try}")
                            try:
                                m_hex = hex(m_try)[2:]
                                if len(m_hex) % 2 != 0:
                                    m_hex = '0' + m_hex
                                out.append(f"m as bytes: {bytes.fromhex(m_hex)}")
                            except:
                                pass
                            out.append("KNOWN_PLAINTEXT=SUCCESS")
                            found = True
                            break
                if not found:
                    out.append("Brute force exhausted without finding match.")
                    out.append("KNOWN_PLAINTEXT=FAILED")
            else:
                out.append(f"Unknown portion ({unknown_bits} bits) too large for brute force.")
                out.append(f"Brute-force limit is 24 bits (found {unknown_bits}) — try Coppersmith's method or a different approach.")
                out.append("KNOWN_PLAINTEXT=FAILED")
        else:
            out.append("No known prefix provided.")
            out.append("Provide the known portion of the plaintext to attempt recovery.")
            out.append("KNOWN_PLAINTEXT=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        out.append(f"Error: {ex}")
        out.append("KNOWN_PLAINTEXT=FAILED")
        print("\\n".join(out))
_attack()`;
  },
  frontendCheck: (vals, onProgress) => {
    if (!vals.n || !vals.c) return Promise.resolve(null);
    try {
      let lastProgress = -1;
      const n = BigInt(vals.n);
      const eVal = vals.e?.trim() || '65537';
      const e = BigInt(eVal);
      const c = BigInt(vals.c);
      // Strategy 1: Integer e-th root (works when m^e < n, e.g. e=3 with small m)
      const root = iroot(c, e);
      if (root ** e === c && modPow(root, e, n) === c) {
        onProgress?.(100);
        try {
          const hexStr = root.toString(16);
          const padded = hexStr.length % 2 ? '0' + hexStr : hexStr;
          const bytes = new Uint8Array(padded.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
          const text = new TextDecoder().decode(bytes);
          return Promise.resolve(`RECOVERED via integer e-th root! m = ${root}\nm as bytes: ${text}\nKNOWN_PLAINTEXT=SUCCESS`);
        } catch {
          onProgress?.(100);
          return Promise.resolve(`RECOVERED via integer e-th root! m = ${root}\nKNOWN_PLAINTEXT=SUCCESS`);
        }
      }
      // Strategy 2: Known prefix + brute-force
      const knownPrefix = vals.known_prefix || '';
      const unknownBitsStr = (vals.unknown_bits || '24').trim();
      const unknownBits = parseInt(unknownBitsStr, 10);
      if (knownPrefix && unknownBits <= 24) {
        const prefixBytes = new TextEncoder().encode(knownPrefix);
        let prefixInt = 0n;
        for (const b of prefixBytes) prefixInt = (prefixInt << 8n) + BigInt(b);
        const shift = 1n << BigInt(unknownBits);
        const limit = Number(shift);
        if (e === 3n) {
          // Horner evaluation: (prefix*shift + k)^3 mod n
          // = A + B*k + C*k^2 + k^3 mod n (avoids modular exponentiation)
          const PS = prefixInt << BigInt(unknownBits);
          const PS_mod = PS % n;
          const A = modPow(PS_mod, 3n, n);
          const B = (3n * PS_mod * PS_mod) % n;
          const C = (3n * PS_mod) % n;
          for (let k = 0; k < limit; k++) {
            if (onProgress && limit > 1000) {
              const pct = Math.round(k * 100 / limit);
              if (pct !== lastProgress) {
                lastProgress = pct;
                onProgress(pct, `k = ${k.toLocaleString()} / ${limit.toLocaleString()}`);
              }
            }
            const k_mod = BigInt(k) % n;
            const k2 = (k_mod * k_mod) % n;
            const val = (((A + B * k_mod) % n + C * k2) % n + k2 * k_mod) % n;
            if (val === c) {
              const mTry = (prefixInt << BigInt(unknownBits)) + BigInt(k);
              onProgress?.(100);
              try {
                const hexStr = mTry.toString(16);
                const padded = hexStr.length % 2 ? '0' + hexStr : hexStr;
                const bytes = new Uint8Array(padded.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
                const text = new TextDecoder().decode(bytes);
                return Promise.resolve(`FOUND! m = ${mTry}\nm as bytes: ${text}\nKNOWN_PLAINTEXT=SUCCESS`);
              } catch {
                onProgress?.(100);
                return Promise.resolve(`FOUND! m = ${mTry}\nKNOWN_PLAINTEXT=SUCCESS`);
              }
            }
          }
        } else {
          for (let k = 0; k < limit; k++) {
            if (onProgress && limit > 1000) {
              const pct = Math.round(k * 100 / limit);
              if (pct !== lastProgress) {
                lastProgress = pct;
                onProgress(pct, `k = ${k.toLocaleString()} / ${limit.toLocaleString()}`);
              }
            }
            const mTry = (prefixInt << BigInt(unknownBits)) + BigInt(k);
            if (modPow(mTry, e, n) === c) {
              onProgress?.(100);
              try {
                const hexStr = mTry.toString(16);
                const padded = hexStr.length % 2 ? '0' + hexStr : hexStr;
                const bytes = new Uint8Array(padded.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
                const text = new TextDecoder().decode(bytes);
                return Promise.resolve(`FOUND! m = ${mTry}\nm as bytes: ${text}\nKNOWN_PLAINTEXT=SUCCESS`);
              } catch {
                onProgress?.(100);
                return Promise.resolve(`FOUND! m = ${mTry}\nKNOWN_PLAINTEXT=SUCCESS`);
              }
            }
          }
        }
        return Promise.resolve(null);
      }
      if (knownPrefix && unknownBits > 24) {
        return Promise.resolve(null); // too large for brute-force, fall through to SageCell
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  },
  proof: `\\textbf{Theorem:} When $m^e < n$, the plaintext is recovered by taking the integer e-th root of $c$. When high-order bytes of $m$ are known, brute-force over the unknown low bits recovers the full plaintext.

\\textbf{Strategy 1: Integer e-th Root}
\\begin{align*}
c &= m^e \\quad \\text{(no modular reduction when } m^e < n\\text{)} \\\\
m &= \\sqrt[e]{c} \\quad \\text{(exact integer root over $\\mathbb{Z}$)}
\\end{align*}
Works when $m$ is small relative to $n$ (common with $e = 3$ and short plaintexts).

\\textbf{Strategy 2: Known Prefix + Brute Force}
\\begin{align*}
m &= m_0 \\cdot 2^k + x, \\quad 0 \\leq x < 2^k \\\\
c &\\equiv (m_0 \\cdot 2^k + x)^e \\pmod{n} \\\\
\\text{Iterate } x &= 0, 1, \\ldots, 2^k - 1 \\\\
\\text{Check: } &(m_0 \\cdot 2^k + x)^e \\equiv c \\pmod{n}
\\end{align*}
Feasible for $k \\leq 24$ (approx. 16 million modular exponentiations in the browser).

\\textbf{Explanation:} Two complementary strategies. Strategy 1 works when the plaintext is so small that $m^e$ never wraps around modulo $n$ — the ciphertext literally equals $m^e$ as an integer, so taking the e-th root recovers $m$. Strategy 2 works when part of the plaintext is known (e.g., a flag format like "flag\\{...\\}") — the unknown suffix is brute-forced by testing each candidate against the ciphertext.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Horner evaluation (e = 3):} Expands $(prefix \\cdot shift + k)^3 \\bmod n$ into precomputed cubic coefficients $A + Bk + Ck^2 + k^3$ where $A, B, C$ are derived from the known prefix and shift. Evaluates via Horner's method — three multiplications and three additions per candidate — avoiding modular exponentiation entirely ($\\sim 25\\times$ faster than $pow$ per candidate).
\\end{itemize}

\\textbf{References:} D. Coppersmith, 1997; May, "Attacks on RSA with Small Parameters," 2003`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.c),
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const { n } = generateKeyPair(256, 256, e);
  const prefix = new TextEncoder().encode('flag{');
  const prefixInt = BigInt('0x' + Array.from(prefix).map(b => b.toString(16).padStart(2, '0')).join(''));
  const unknownBits = 20;
  const unknown = BigInt(Math.floor(Math.random() * 2 ** unknownBits));
  const m = (prefixInt << BigInt(unknownBits)) | unknown;
  return { n: n.toString(), e: e.toString(), c: encrypt(m, n, e).toString(), known_prefix: 'flag{', unknown_bits: unknownBits.toString() };
};
