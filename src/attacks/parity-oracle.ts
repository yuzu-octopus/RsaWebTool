import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'parity-oracle',
  name: 'Parity Oracle Attack',
  category: 'Advanced',
  description: 'Recovers m via parity oracle. Use when oracle reveals LSB(decrypt(c)).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated, LSB of each query)', placeholder: '1,0,1,1,0,...', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        # Validate inputs
        if not "${vals.n}".strip():
            print("ERROR: n is required")
            print("PARITY_ORACLE=FAILED")
            return
        if not "${vals.c}".strip():
            print("ERROR: c is required")
            print("PARITY_ORACLE=FAILED")
            return
        if not "${vals.oracle_responses}".strip():
            print("ERROR: oracle_responses is required")
            print("PARITY_ORACLE=FAILED")
            return
        try:
            n = Integer(${vals.n})
            e_val = "${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c = Integer(${vals.c})
            orig_c = Integer(${vals.c})
            responses_str = "${vals.oracle_responses || ''}".replace(' ', '')
            responses = [int(x) for x in responses_str.split(',') if x]
            print("Parity oracle attack on RSA")
            print(f"n = {n}")
            print(f"e = {e}")
            print(f"c = {c}")
            print(f"Oracle responses: {len(responses)} bits")
            print()
            n_bits = n.nbits()
            if len(responses) < n_bits:
                print(f"WARNING: Need {n_bits} responses for {n_bits}-bit modulus.")
                print(f"Got {len(responses)}. Attack may be incomplete.")
                print()
            # Binary search using parity oracle with exact rational division
            # NOTE: Use /2 (Rational) not //2 to avoid floor-division drift
            lower = Integer(0)
            upper = Integer(n)
            #
            print("Binary search iterations:")
            for i, parity in enumerate(responses):
                mid = (lower + upper) / 2  # Rational — exact midpoint
                # Multiply ciphertext by 2^e mod n
                c = (c * power_mod(Integer(2), e, n)) % n
                if parity == 0:
                    # 2m mod n is even, so 2m < n, m is in lower half
                    upper = mid
                else:
                    # 2m mod n is odd (since n is odd), so 2m >= n, m is in upper half
                    lower = mid
                if i < 10 or i % 50 == 0:
                    print(f"  Step {i+1}: parity={parity}, range bits = {(upper - lower).nbits()}")
            #
            print()
            print(f"Estimated m in range [{lower}, {upper}]")
            print(f"Range size: {upper - lower}")
            #
            # Scan candidates from rational interval [lower, upper)
            from math import ceil, floor
            for candidate in range(Integer(ceil(lower)), Integer(floor(upper)) + 1):
                m = Integer(candidate)
                if power_mod(m, e, n) == orig_c:
                    print(f"FOUND! m = {m}")
                    try:
                        m_bytes = bytes.fromhex(hex(m)[2:] if len(hex(m)) % 2 == 0 else '0' + hex(m)[2:])
                        print(f"m as text: {m_bytes.decode('utf-8', errors='replace')}")
                    except:
                        print(f"m as hex: {hex(m)}")
                    print("PARITY_ORACLE=SUCCESS")
                    break
            else:
                print("Verification failed. Oracle responses may be inconsistent.")
                print("PARITY_ORACLE=FAILED")
        #
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("PARITY_ORACLE=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARITY_ORACLE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} A parity oracle returning \\(\\text{LSB}(m)\\) for \\(m = c^d \\bmod n\\) reveals the full plaintext in \\(\\lceil \\log_2 n \\rceil\\) queries.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Public key \\((n, e)\\) and ciphertext \\(c\\)
\\item Oracle \\(\\mathcal{O}(c') = \\text{LSB}((c')^d \\bmod n)\\)
\\item \\(\\lceil \\log_2 n \\rceil\\) oracle queries needed for exact recovery
\\item \\(n\\) must be odd (always true for RSA moduli)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_0 &= c, \\quad m_0 = m \\\\
c_{i+1} &= c_i \\cdot 2^e \\bmod n \\\\
m_{i+1} &= 2 \\cdot m_i \\bmod n \\\\
\\mathcal{O}(c_{i+1}) = 0 &\\implies 2m_i < n \\implies m \\in [\\ell_i, \\tfrac{\\ell_i + u_i}{2}) \\\\
\\mathcal{O}(c_{i+1}) = 1 &\\implies 2m_i \\geq n \\implies m \\in [\\tfrac{\\ell_i + u_i}{2}, u_i) \\\\
\\text{After } k \\text{ steps:} &\\quad u_k - \\ell_k = \\frac{n}{2^k} \\\\
k = \\lceil \\log_2 n \\rceil &\\implies u_k - \\ell_k < 1 \\implies m = \\ell_k \\qed
\\end{align*}

\\textbf{Explanation:} Each query doubles the effective plaintext modulo \\(n\\). The parity of the result reveals whether the doubling wrapped around \\(n\\), halving the search interval. After \\(\\log_2 n\\) steps the interval contains exactly one integer — the plaintext.

\\textbf{References:} D. Bleichenbacher, "Generating ElGamal Signatures Without Knowing the Secret Key", Eurocrypt 1998; Manger, "A Chosen Ciphertext Attack on RSA Optimal Asymmetric Encryption Padding (OAEP)", CRYPTO 2001`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.e && p.c && p.oracle_responses),
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(32, 32);
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const c = encrypt(m, n, e);
  const responses: string[] = [];
  // Start from c * 2^e mod n so that responses[0] = LSB(2m mod n)
  // matching the sage template which multiplies c by 2^e before each check
  let curC = (c * modPow(2n, e, n)) % n;
  const nBits = 32 + 32;
  for (let i = 0; i < nBits; i++) {
    responses.push((modPow(curC, d, n) % 2n).toString());
    curC = (curC * modPow(2n, e, n)) % n;
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
