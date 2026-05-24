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
        if not "${vals.n}".strip():
            print("ERROR: n is required")
            print("PARITY_ORACLE=FAILED")
            return
        if not "${vals.c}".strip():
            print("ERROR: c is required")
            print("PARITY_ORACLE=FAILED")
            return
        responses_raw = """${vals.oracle_responses || ''}""".strip()
        if not responses_raw:
            print("ERROR: oracle_responses is required")
            print("PARITY_ORACLE=FAILED")
            return
        try:
            n = Integer(${vals.n})
            e_val = "${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c = Integer(${vals.c})
            orig_c = c
            responses = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            print("Parity oracle attack on RSA")
            print(f"n = {n} ({n.nbits()} bits)")
            print(f"e = {e}")
            print(f"Oracle responses: {len(responses)} bits")
            print()
            if len(responses) < n.nbits():
                print(f"WARNING: Need {n.nbits()} responses for full recovery, got {len(responses)}.")
                print("Result may be approximate.")
                print()
            # Binary search using parity oracle with 2^e blinding
            # Use QQ (rational) arithmetic to avoid integer-division convergence errors
            lower = QQ(0)
            upper = QQ(n)
            print("Binary search iterations:")
            for i, parity in enumerate(responses):
                mid = (lower + upper) / 2
                c = (c * power_mod(Integer(2), e, n)) % n
                if parity == 0:
                    upper = mid
                else:
                    lower = mid
                if i < 5 or i % 50 == 0:
                    remaining = n.nbits() - i - 1
                    print(f"  Step {i+1}: parity={parity}, remaining ~ {max(0, remaining)} bits")
            print()
            # Scan exact candidates from integer hull of rational interval
            lo_int = floor(lower)
            hi_int = ceil(upper)
            for candidate in range(lo_int, hi_int + 1):
                m = Integer(candidate)
                if power_mod(m, e, n) == orig_c:
                    print(f"FOUND! m = {m}")
                    print("PARITY_ORACLE=SUCCESS")
                    break
            else:
                print(f"PARITY_ORACLE=FAILED (scanned {lo_int}..{hi_int})")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("PARITY_ORACLE=FAILED")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARITY_ORACLE=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} A parity oracle (LSB) recovers m in $\\lceil \\log_2 n \\rceil$ queries.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle O(c') = LSB((c')^d \\bmod n)
\\item n odd
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_{i+1} &= c_i \\cdot 2^e \\bmod n, \\quad m_{i+1} = 2m_i \\bmod n \\\\
\\mathcal{O}(c_{i+1}) = 0 &\\implies 2m_i < n \\implies \\text{lower half} \\\\
\\mathcal{O}(c_{i+1}) = 1 &\\implies 2m_i \\geq n \\implies \\text{upper half} \\\\
\\lceil \\log_2 n \\rceil \\text{ queries} &\\implies u_k - \\ell_k < 1 \\implies m = \\ell_k \\qed
\\end{align*}

\\textbf{References:} Bleichenbacher, 1998; Manger, CRYPTO 2001`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!(p.n && p.e && p.c && p.oracle_responses),
};

export const generateTestcase = (): Record<string, string> => {
  // Use small primes (12-bit) so the attack completes in SageMathCell's 35s timeout.
  const { n, e, d } = generateKeyPair(12, 12);
  const m = BigInt(Math.floor(Math.random() * 1000) + 42);
  const c = encrypt(m, n, e);
  const responses: string[] = [];
  // Start from c so that c*2^e mod n on first iteration = encrypted(2m mod n),
  // matching the sage template which multiplies c by 2^e before each check
  const nBits = n.toString(2).length;
  let curC = c;
  for (let i = 0; i < nBits; i++) {
    curC = (curC * modPow(2n, e, n)) % n;
    responses.push((modPow(curC, d, n) % 2n).toString());
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
