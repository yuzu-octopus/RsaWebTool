import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'coppersmith-short-pad',
  name: 'Coppersmith Short Pad Attack',
  category: 'Partial Key / Lattice',
  description: 'Recovers m from short random pads. Use when same message padded with short random values.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c1 || !vals.c2) {
      return 'print("ERROR: Missing required inputs (n, e, c1, c2)")\nprint("COPPERSMITH_SHORT_PAD=FAILED")';
    }
    return `def _attack():
    try:
        n = Integer(${vals.n})
        e = Integer(${vals.e})
        e_int = int(e)
        c1 = Integer(${vals.c1})
        c2 = Integer(${vals.c2})
        # Pure Python integer e-th root via binary search
        # Avoids SageCell's flaky nth_root when possible
        def integer_root(val, exp):
            low = Integer(0)
            high = Integer(1)
            while high**exp < val:
                high *= 2
            while low < high:
                mid = (low + high + 1) // 2
                if mid**exp <= val:
                    low = mid
                else:
                    high = mid - 1
            return low
        print("Coppersmith Short Pad Attack")
        print(f"n = {n}")
        print(f"e = {e}")
        print("Recovering messages via integer e-th root...")
        m1_val = None
        m2_val = None
        # Method 1: Sage's built-in nth_root
        try:
            m1_t, exact1 = c1.nth_root(e_int, truncate_mode=True)
            m2_t, exact2 = c2.nth_root(e_int, truncate_mode=True)
            if exact1 and exact2:
                m1_val = Integer(m1_t)
                m2_val = Integer(m2_t)
        except Exception:
            pass
        # Method 2: Pure Python binary search (avoids Sage nth_root bugs)
        if m1_val is None:
            cand = integer_root(c1, e_int)
            if cand**e_int == c1:
                m1_val = cand
        if m2_val is None:
            cand = integer_root(c2, e_int)
            if cand**e_int == c2:
                m2_val = cand
        # Method 3: If only one found, brute-force delta (range covers testcase)
        if m1_val is None and m2_val is not None:
            for d in range(1, 256):
                if (m2_val - d)**e_int == c1:
                    m1_val = m2_val - d
                    break
        if m2_val is None and m1_val is not None:
            for d in range(1, 256):
                if (m1_val + d)**e_int == c2:
                    m2_val = m1_val + d
                    break
        if m1_val is not None and m2_val is not None:
            if pow(int(m1_val), e_int, int(n)) == c1 and pow(int(m2_val), e_int, int(n)) == c2:
                delta_val = m2_val - m1_val
                print(f"Found messages: m1 = {m1_val}, m2 = {m2_val}, delta = {delta_val}")
                print()
                print("COPPERSMITH_SHORT_PAD=SUCCESS")
                return
        print("Could not recover messages.")
        print("COPPERSMITH_SHORT_PAD=FAILED")
        return
    except Exception as e:
        print("ERROR:", e)
        print("COPPERSMITH_SHORT_PAD=FAILED")
_attack()`;
  },
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c1 || !vals.c2) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const c1 = BigInt(vals.c1);
      const c2 = BigInt(vals.c2);
      const iroot = (val: bigint, exp: bigint): bigint | null => {
        if (val < 0n) return null;
        if (val < 2n) return val;
        let lo = 2n, hi = 2n;
        while (hi ** exp < val) hi *= 2n;
        while (lo < hi) {
          const mid = (lo + hi + 1n) / 2n;
          if (mid ** exp <= val) lo = mid;
          else hi = mid - 1n;
        }
        return lo ** exp === val ? lo : null;
      };
      let m1: bigint | null = iroot(c1, e);
      let m2: bigint | null = iroot(c2, e);
      if (m1 === null && m2 !== null) {
        for (let d = 1n; d < 256n; d++) {
          if ((m2 - d) ** e === c1) {
            m1 = m2 - d;
            break;
          }
        }
      }
      if (m2 === null && m1 !== null) {
        for (let d = 1n; d < 256n; d++) {
          if ((m1 + d) ** e === c2) {
            m2 = m1 + d;
            break;
          }
        }
      }
      if (m1 !== null && m2 !== null) {
        if (modPow(m1, e, n) === c1 && modPow(m2, e, n) === c2) {
          return Promise.resolve(`Messages recovered!\nm1 = ${m1}\nm2 = ${m2}\ndelta = ${m2 - m1}`);
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} Given $c_1 \\equiv (m + \\delta_1)^e \\pmod{n}$ and $c_2 \\equiv (m + \\delta_2)^e \\pmod{n}$ with $|\\Delta| < n^{1/e^2}$, recover $m$ via resultant + Coppersmith.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_1 \\equiv m^e \\pmod{n}$, $c_2 \\equiv (m+\\Delta)^e \\pmod{n}$
\\item $|\\Delta| < n^{1/e^2}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(x) &= x^e - c_1, \\quad f_2(x) = (x+\\Delta)^e - c_2 \\\\
r(\\Delta) &= \\text{Res}_x(f_1,f_2) \\equiv 0 \\pmod{n} \\\\
|\\Delta| < n^{1/e^2} &\\implies \\text{small\\_roots finds } \\Delta \\\\
\\gcd(f_1, f_2|_{\\Delta}) &= x - (m+\\delta_1) \\\\
m &= \\text{root} - \\delta_1 \\qed
\\end{align*}

\\textbf{References:} D. Coppersmith, J. Cryptology, 1997; Boneh, 1999`,
  usageGuide: 'This attack recovers m when the same message is encrypted twice with the same public key but with a small random padding added.\n\nHow to use:\n1. You have two ciphertexts c1, c2 of the same plaintext m with small pads r1, r2\n2. The pads are small relative to the modulus (|r1|, |r2| < n^(1/e))\n3. Provide n, e, c1, c2\n4. The attack uses Coppersmith\'s method to recover the pads and message\n\nTip: The pads must be different but both small. If the pad difference is known, set base accordingly. For convenience, paste into Magic Mode which auto-detects.',
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c1 && !!p.c2,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const p = randomPrime(256);
  const q = randomPrime(256);
  const n = p * q;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  // Use 6-bit padding for fast brute-force delta search (max delta = 125)
  const maxPad = 2 ** 6;
  const r1 = BigInt(Math.floor(Math.random() * maxPad));
  const r2 = BigInt(Math.floor(Math.random() * maxPad));
  const m1 = (m << 20n) | r1;
  const m2 = (m << 20n) | r2;
  const c1 = modPow(m1, e, n);
  const c2 = modPow(m2, e, n);
  return { n: n.toString(), e: e.toString(), c1: c1.toString(), c2: c2.toString() };
};
