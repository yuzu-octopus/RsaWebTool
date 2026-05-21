import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';
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
        if not """${vals.oracle_responses || ''}""".strip():
            print("ERROR: oracle_responses is required")
            print("LSB_ORACLE=FAILED")
            return
        try:
            n = Integer(${vals.n})
            e_val = "${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c = Integer(${vals.c})
            orig_c = Integer(${vals.c})
            # Parse oracle responses (LSB of each blinded query)
            responses_str = """${vals.oracle_responses || ''}""".strip()
            oracle_bits = [int(x.strip()) for x in responses_str.split(',') if x.strip()]
            print("LSB Oracle Attack on RSA")
            print(f"n = {n}")
            print(f"e = {e}")
            print(f"c = {c}")
            print(f"Oracle responses: {len(oracle_bits)} bits")
            print()
            n_bits = n.nbits()
            if len(oracle_bits) < n_bits:
                print(f"WARNING: Need {n_bits} responses for {n_bits}-bit modulus.")
                print(f"Got {len(oracle_bits)}. Attack may be incomplete.")
                print()
            # Binary search using LSB oracle with 2^e blinding
            # LSB(2m mod n) = 1 iff 2m >= n (since n is odd) iff m >= current midpoint
            # NOTE: Use /2 (Rational) not //2 to avoid floor-division drift
            lower = Integer(0)
            upper = Integer(n)
            print("Binary search iterations:")
            for i, bit in enumerate(oracle_bits):
                mid = (lower + upper) / 2  # Rational — exact midpoint
                # Blind ciphertext: c = c * 2^e mod n, so oracle returns LSB(2m mod n)
                c = (c * power_mod(Integer(2), e, n)) % n
                if bit == 0:
                    # LSB = 0: 2m mod n is even, so 2m < n => m in lower half
                    upper = mid
                else:
                    # LSB = 1: 2m mod n is odd, so 2m >= n => m in upper half
                    lower = mid
                if i < 10 or i % 50 == 0:
                    remaining = n.nbits() - i - 1
                    print(f"  Step {i+1}: LSB={bit}, remaining ≈ {remaining} bits")
            print()
            # Scan exact candidates from rational interval [lower, upper)
            from math import ceil, floor
            for m_candidate in range(Integer(ceil(lower)), Integer(floor(upper)) + 1):
                m = Integer(m_candidate)
                if power_mod(m, e, n) == orig_c:
                    print(f"Recovered message: m = {m}")
                    v = power_mod(m, e, n)
                    print(f"Verification: m^e mod n = {v}")
                    print(f"Original c = {orig_c}")
                    print("LSB_ORACLE=SUCCESS")
                    break
            else:
                print("LSB_ORACLE=FAILED")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("LSB_ORACLE=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("LSB_ORACLE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} An oracle \\mathcal{O}(c) = (c^d \\bmod n) \\bmod 2 recovers m in O(\\log n) queries via binary search.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Public key (n, e) and ciphertext c = m^e \\bmod n
\\item Oracle returning the least significant bit of the decrypted blinded ciphertext
\\item Queries use blinded ciphertexts c\\_i = c \\cdot (2^i)^e \\bmod n
\\item n must be odd (always true for RSA moduli)
\\end{itemize}

\\textbf{Proof (Collection Phase --- Blinding):}
\\begin{align*}
c_i &= c \\cdot (2^{i})^e \\bmod n, \\quad i = 0, 1, \\ldots, \\lceil \\log_2 n \\rceil \\\\
b_i &= \\mathcal{O}(c_i) = \\text{LSB}((c_i)^d \\bmod n) = \\text{LSB}(m \\cdot 2^{i} \\bmod n) \\\\
b_i = 0 &\\iff m \\cdot 2^{i} < n \\iff m < \\frac{n}{2^{i}} \\\\
b_i = 1 &\\iff m \\cdot 2^{i} \\geq n \\iff m \\geq \\frac{n}{2^{i}}
\\end{align*}

\\textbf{Proof (Decoding Phase --- Binary Search):}
\\begin{align*}
[\\ell_0, u_0) &= [0, n) \\\\
[\\ell_{i+1}, u_{i+1}) &= \\begin{cases}
[\\ell_i, (\\ell_i + u_i)/2) & \\text{if } b_i = 0 \\\\
[(\\ell_i + u_i)/2, u_i) & \\text{if } b_i = 1
\\end{cases} \\\\
u_k - \\ell_k &= \\frac{n}{2^k} \\xrightarrow{k = \\lceil \\log_2 n \\rceil} 1 \\\\
m &= \\ell_k \\qed
\\end{align*}

\\textbf{Explanation:} Each oracle query on c \\cdot 2^{ie} \\bmod n determines whether 2^i \\cdot m \\bmod n is even or odd. Because n is odd, this is equivalent to checking whether multiplying m by 2^i overflows n (i.e., whether m \\geq n / 2^i). Each query narrows the search interval by half. After \\lceil \\log\\_2 n \\rceil queries the interval contains exactly one integer \\textemdash{} the plaintext.

\\textbf{References:} Goldwasser, Micali, "Probabilistic Encryption", 1982; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.e && p.c && p.oracle_responses),
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const c = encrypt(m, n, e);
  const responses: string[] = [];
  // Simulate LSB oracle: at each step, blind curC by 2^e and check LSB of decrypted value
  // LSB(2*m mod n) = 1 iff 2*m >= n (since n is odd) iff m >= mid
  let lower = 0n, upper = n;
  let curC = c;
  const nBits = TESTCASE_BITS.p + TESTCASE_BITS.q;
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
