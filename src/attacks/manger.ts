import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'manger',
  name: "Manger's OAEP Attack",
  category: 'Oracle',
  description: 'Decrypts OAEP-encrypted messages using a first-byte oracle in O(log n) queries. Use when an oracle returns 1 if the plaintext\'s first byte is NOT 0x00 (i.e., plaintext >= B).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated 0/1)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
      token: 'MANGER',
      useGuard: false,
      body: `        valid = True
        if not "${vals.n}".strip():
            out.append("ERROR: n is required")
            valid = False
        if not "${vals.e}".strip():
            out.append("ERROR: e is required")
            valid = False
        if not "${vals.c}".strip():
            out.append("ERROR: c is required")
            valid = False
        responses_raw = """${vals.oracle_responses || ''}""".strip()
        if not responses_raw:
            out.append("ERROR: oracle_responses is required")
            valid = False
        if valid:
            n = Integer(${vals.n})
            e = Integer(${vals.e})
            c = Integer(${vals.c})
            oracle_list = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            oracle_idx = [0]
            def oracle():
                if oracle_idx[0] >= len(oracle_list):
                    out.append(f"WARNING: ran out of oracle responses at index {oracle_idx[0]}")
                    return False
                result = oracle_list[oracle_idx[0]] == 1
                oracle_idx[0] += 1
                return result
            def ceil_div(a, b):
                return (a + b - 1) // b
            def floor_div(a, b):
                return a // b
            out.append("Manger's OAEP Attack")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"c = {c}")
            out.append(f"oracle_responses = {len(oracle_list)}")
            k = ceil_div(n.nbits(), 8)
            B = Integer(2) ** (8 * (k - 1))
            queries_used = [0]
            f1 = Integer(2)
            while not oracle():
                queries_used[0] += 1
                f1 *= 2
            queries_used[0] += 1
            f1_half = f1 // 2
            f2 = floor_div(n + B, B) * f1_half
            while oracle():
                queries_used[0] += 1
                f2 += f1_half
            queries_used[0] += 1
            mmin = ceil_div(n, f2)
            mmax = floor_div(n + B, f2)
            step_count = 0
            twoB = Integer(2) * B
            while mmin < mmax:
                step_count += 1
                f_tmp = floor_div(twoB, mmax - mmin)
                i_val = floor_div(f_tmp * mmin, n)
                f3 = ceil_div(i_val * n, mmin)
                if f3 == 0:
                    f3 = Integer(1)
                oracle_result = oracle()
                queries_used[0] += 1
                iNB = i_val * n + B
                if oracle_result:
                    mmin = ceil_div(iNB, f3)
                else:
                    mmax = floor_div(iNB, f3)
            m = mmin
            v = Integer(pow(int(m), int(e), int(n)))
            out.append("")
            out.append("Results:")
            out.append(f"m = {m}")
            out.append("")
            out.append(f"Verification: m^e mod n = {v}")
            out.append("")
            if v == c:
                out.append("MANGER=SUCCESS")
            else:
                out.append("MANGER=FAILED")
        else:
            out.append("MANGER=FAILED")`,
    }),
  proof: `\\textbf{Theorem:} An OAEP first-byte oracle recovers the full plaintext in O(\\log n) oracle queries.

\\textbf{Setup:}
\\begin{itemize}
\\item $c = m^e \\bmod n$ with OAEP padding; first byte must be $0x00$
\\item Oracle $\\mathcal{O}(c') = 1$ iff plaintext's first byte is NOT $0x00$ (i.e., $m \\geq B$)
\\item $B = 2^{8(k-1)} \\approx n/256$, where $k = \\lceil n/8 \\rceil$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\mathcal{O}(c) = 1 &\\iff m < B = n/256 \\\\
\\mathcal{O}(c \\cdot s^e) = 1 &\\implies m \\cdot s - rn < B \\quad \\text{for some } r \\\\
m &\\in \\bigcup_{r=0}^{s-1} \\left[ \\frac{rn}{s}, \\frac{rn+B}{s} \\right) \\\\
\\text{Step 1: } &\\text{Find } f_1 = 2^t \\text{ with } \\mathcal{O}(c \\cdot f_1^e) = 1 \\\\
\\text{Step 2: } &\\text{Find } f_2 \\text{ where } \\mathcal{O}(c \\cdot f_2^e) = 0 \\text{ (wrapped past } n) \\\\
\\text{Step 3: } &\\text{Binary search: } [a_{i+1}, b_{i+1}] \\subset [a_i, b_i] \\\\
\\lceil \\log_2 n \\rceil + 8 \\text{ queries} &\\implies b - a = 0 \\implies m = a \\qed
\\end{align*}

\\textbf{Explanation:} Manger's attack has three phases. Step 1 doubles a multiplier $f$ until the blinded message $f \\cdot m \\bmod n$ exceeds $B$ (first byte nonzero). Step 2 adds $f/2$ increments until the value wraps past $n$ and falls below $B$ again. Step 3 performs a binary search, narrowing the interval by checking whether $f \\cdot m \\bmod n \\geq B$. The key insight is that the boundary $B$ partitions $[0, n)$ into exactly two contiguous segments, making this a textbook binary search problem. Unlike Bleichenbacher's attack which requires ~$2^{17}$ queries, Manger needs only O(\\log n) queries.

\\textbf{References:} J. Manger, "A Chosen Ciphertext Attack on RSA Optimal Asymmetric Encryption Padding (OAEP) as Standardized in PKCS#1 v2.0", CRYPTO 2001`,
  usageGuide: 'This requires oracle_responses \u2014 a comma-separated list from an oracle that reveals whether the decrypted plaintext\'s first byte is NOT 0x00 (i.e., plaintext >= B where B = 2^(8*(k-1)), k = ceil(n.nbits()/8)).\n\nHow to use:\n1. Set up an oracle that returns 1 if decrypt(c\') has first byte NOT 0x00 (plaintext >= B), 0 otherwise\n2. Query the oracle for successive blinding values\n3. Provide n, e, c, and oracle_responses as comma-separated bits\n4. The attack narrows the message interval with each query\n\nTip: Manger\'s attack requires O(log n) oracle queries \u2014 significantly fewer than Bleichenbacher. The oracle boundary is B = 2^(8*(k-1)) \u2248 n/256, NOT n/2.',
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
};

export const generateTestcase = (): Record<string, string> => {
  // Use small primes (12-bit → n ≈ 24 bits) so the attack completes in SageMathCell's 120s timeout.
  const { n, e, d } = generateKeyPair(12, 12);
  // k = byte length, B = 2^(8*(k-1))
  const k = Math.ceil(Number(n.toString(2).length) / 8);
  const B = BigInt(2) ** BigInt(8 * (k - 1));

  // m must be < B (OAEP format: first byte 0x00)
  // Use crypto.getRandomValues to avoid Number() overflow for large B (e.g., 2^504)
  const mBytes = new Uint8Array(k);
  crypto.getRandomValues(mBytes);
  mBytes[0] = 0; // ensure OAEP first byte is 0x00
  let m = 0n;
  for (const byte of mBytes) {
    m = (m << 8n) + BigInt(byte);
  }
  const c = encrypt(m, n, e);

  // Pre-compute oracle responses for the full 3-step attack
  // We simulate the attack to know exactly which f values will be queried
  const responses: string[] = [];
  const oracle = (queryC: bigint): boolean => {
    const dec = modPow(queryC, d, n);
    return dec >= B;
  };

  // Step 1: find f1
  let f1 = 2n;
  while (!oracle((c * modPow(f1, e, n)) % n)) {
    responses.push('0');
    f1 *= 2n;
  }
  responses.push('1');

  // Step 2: find f2
  const f1Half = f1 / 2n;
  let f2 = ((n + B) / B) * f1Half;
  while (oracle((c * modPow(f2, e, n)) % n)) {
    responses.push('1');
    f2 += f1Half;
  }
  responses.push('0');

  // Step 3: binary search
  let mmin = (n + f2 - 1n) / f2; // ceil(n/f2)
  let mmax = (n + B) / f2; // floor((n+B)/f2)
  const twoB = 2n * B;
  let steps = 0;
  const maxSteps = 2000; // safety limit
  while (mmin < mmax && steps < maxSteps) {
    const fTmp = twoB / (mmax - mmin);
    const iVal = (fTmp * mmin) / n;
    let f3 = (iVal * n + mmin - 1n) / mmin; // ceil(i*n/mmin)
    if (f3 === 0n) f3 = 1n;
    const oracleResult = oracle((c * modPow(f3, e, n)) % n);
    responses.push(oracleResult ? '1' : '0');
    const iNB = iVal * n + B;
    if (oracleResult) {
      mmin = (iNB + f3 - 1n) / f3; // ceil
    } else {
      mmax = iNB / f3; // floor
    }
    steps++;
  }

  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
