import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'lsb-oracle',
  name: 'LSB Oracle Attack',
  category: 'Message / Protocol',
  description: 'Recovers m via LSB oracle. Use when an oracle reveals LSB(decrypt(c·2^e mod n)).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated LSB bits)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        # LSB Oracle Attack — binary search via 2^e blinding
        if not "${vals.n}".strip():
            print("ERROR: n is required")
            print("LSB_ORACLE=FAILED")
            return
        if not "${vals.c}".strip():
            print("ERROR: c is required")
            print("LSB_ORACLE=FAILED")
            return
        responses_raw = """${vals.oracle_responses || ''}""".strip()
        if not responses_raw:
            print("ERROR: oracle_responses is required")
            print("LSB_ORACLE=FAILED")
            return
        try:
            n = Integer(${vals.n})
            e_val = "${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c = Integer(${vals.c})
            orig_c = c
            oracle_bits = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            print("LSB Oracle Attack on RSA")
            print(f"n = {n} ({n.nbits()} bits)")
            print(f"e = {e}")
            print(f"Oracle responses: {len(oracle_bits)} bits")
            print()
            if len(oracle_bits) < n.nbits():
                print(f"WARNING: Need {n.nbits()} responses for full recovery, got {len(oracle_bits)}.")
                print("Result may be approximate.")
                print()
            # Binary search using LSB oracle with 2^e blinding
            # Use QQ (rational) arithmetic to avoid integer-division convergence errors.
            # LSB(m * 2^(i+1) mod n) = 1 iff m >= n / 2^(i+1) (since n is odd)
            lower = QQ(0)
            upper = QQ(n)
            for i, bit in enumerate(oracle_bits):
                mid = (lower + upper) / 2
                c = (c * power_mod(Integer(2), e, n)) % n
                if bit == 0:
                    upper = mid
                else:
                    lower = mid
                if i < 5 or i % 50 == 0:
                    remaining = n.nbits() - i - 1
                    print(f"  Step {i+1}: LSB={bit}, interval ~ [{lower.numerator()}/{lower.denominator()}, {upper.numerator()}/{upper.denominator()}], remaining ~ {max(0, remaining)} bits")
            print()
            # Scan exact candidates from integer hull of rational interval
            lo_int = floor(lower)
            hi_int = ceil(upper)
            for m_candidate in range(lo_int, hi_int + 1):
                m = Integer(m_candidate)
                if power_mod(m, e, n) == orig_c:
                    print(f"Recovered message: m = {m}")
                    print("LSB_ORACLE=SUCCESS")
                    break
            else:
                print(f"LSB_ORACLE=FAILED (scanned {lo_int}..{hi_int})")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("LSB_ORACLE=FAILED")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("LSB_ORACLE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} An oracle \\mathcal{O}(c) = (c^d \\bmod n) \\bmod 2 recovers m in O(\\log n) queries via binary search.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle O(c) = (c^d \\bmod n) \\bmod 2
\\item Blind via c \\cdot 2^{ie} \\bmod n
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_i &= c \\cdot 2^{ie} \\bmod n \\\\
b_i &= \\text{LSB}(m \\cdot 2^{i} \\bmod n) \\\\
b_i = 0 &\\iff m < n/2^{i} \\\\
[\\ell_0, u_0) &= [0, n) \\\\
[\\ell_{i+1}, u_{i+1}) &= \\begin{cases}
[\\ell_i, (\\ell_i+u_i)/2) & b_i = 0 \\\\
[(\\ell_i+u_i)/2, u_i) & b_i = 1
\\end{cases} \\\\
\\lceil \\log_2 n \\rceil \\text{ queries} &\\implies u_k - \\ell_k = 1 \\implies m = \\ell_k \\qed
\\end{align*}

\\textbf{Explanation:} Each query halves the search interval. After \\lceil \\log_2 n \\rceil queries the interval contains exactly one integer.

\\textbf{References:} Goldwasser, Micali, 1982; Boneh, 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.e && p.c && p.oracle_responses),
};

export const generateTestcase = (): Record<string, string> => {
  // Use small primes (12-bit) so the attack completes in SageMathCell's 35s timeout.
  // 12+12=24 bits → 24 oracle iterations with integer arithmetic, sub-second execution.
  const { n, e, d } = generateKeyPair(12, 12);
  const m = BigInt(Math.floor(Math.random() * 1000) + 42);
  const c = encrypt(m, n, e);
  const responses: string[] = [];
  // Simulate LSB oracle: at each step, blind curC by 2^e and check LSB of decrypted value
  // LSB(2*m mod n) = 1 iff 2*m >= n (since n is odd) iff m >= mid
  let lower = 0n, upper = n;
  let curC = c;
  const nBits = n.toString(2).length;
  for (let i = 0; i < nBits; i++) {
    const mid = (lower + upper) / 2n;
    // Blind: curC = curC * 2^e mod n
    curC = (curC * modPow(2n, e, n)) % n;
    // LSB of decrypted value: 1 means 2*m >= n (upper half), 0 means lower half
    const lsb = modPow(curC, d, n) & 1n;
    if (lsb === 1n) {
      responses.push('1');
      lower = mid;
    } else {
      responses.push('0');
      upper = mid;
    }
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
