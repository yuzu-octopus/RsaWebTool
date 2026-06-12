var e=`import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'lsb-oracle',
  name: 'LSB Oracle Attack',
  category: 'Oracle',
  description: 'Recovers plaintext m using an exact LSB oracle in log2(n) queries via binary fraction accumulation. Use when a side channel reveals the LSB of the decrypted ciphertext.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '65537', multiline: false },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated LSB bits)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
      token: 'LSB_ORACLE',
      useGuard: false,
      body: \`        valid = True
        if not "\${vals.n}".strip():
            out.append("ERROR: n is required")
            valid = False
        if not "\${vals.c}".strip():
            out.append("ERROR: c is required")
            valid = False
        responses_raw = """\${vals.oracle_responses || ''}""".strip()
        if not responses_raw:
            out.append("ERROR: oracle_responses is required")
            valid = False
        if valid:
            n = Integer(\${vals.n})
            e_val = "\${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c = Integer(\${vals.c})
            orig_c = c
            oracle_bits = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            two_e = pow(2, int(e), int(n))
            two_e_sage = Integer(two_e)
            out.append("LSB Oracle")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"c = {orig_c}")
            out.append(f"oracle_responses = {len(oracle_bits)} bits")

            lower = QQ(0)
            upper = QQ(n)
            for i, bit in enumerate(oracle_bits):
                mid = (lower + upper) / 2
                c = (c * two_e_sage) % n
                if bit == 0:
                    upper = mid
                else:
                    lower = mid

            out.append("")
            lo_int = floor(lower)
            hi_int = ceil(upper)
            found_m = None
            for m_candidate in range(lo_int, hi_int + 1):
                m = Integer(m_candidate)
                if pow(int(m), int(e), int(n)) == int(orig_c):
                    found_m = m_candidate
                    out.append("")
                    out.append("Results:")
                    out.append(f"m = {m}")
                    out.append("")
                    out.append(f"Verification: m^e mod n = {Integer(pow(int(m), int(e), int(n)))}")
                    out.append("")
                    out.append("LSB_ORACLE=SUCCESS")
                    break
            if found_m is None:
                out.append("LSB_ORACLE=FAILED")
        else:
            out.append("LSB_ORACLE=FAILED")\`,
    }),
  frontendCheck: (vals) => {
    if (!vals.n || !vals.e || !vals.c || !vals.oracle_responses) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const c = BigInt(vals.c);
      const bits = vals.oracle_responses.split(',').map(x => x.trim() === '1');
      const k = BigInt(bits.length);

      // Each LSB response b_i = floor(2^(i+1)*m/n) mod 2, which is bit i of the
      // binary fraction m/n. Accumulate all bits into quotient q, MSB first:
      // q = sum(b_i * 2^(k-1-i)) so that m/n ≈ q / 2^k.
      let q = 0n;
      for (const bit of bits) {
        q = (q << 1n) | (bit ? 1n : 0n);
      }

      // After k bits: m ∈ [q*n/2^k, (q+1)*n/2^k). Width = n/2^k.
      // When k >= n.bit_length(), width < 1 → m = ceil(q*n/2^k) uniquely.
      const divisor = 1n << k;
      const mCeil = divisor > n ? (q * n + divisor - 1n) / divisor : q * n / divisor;

      // Try mCeil directly (the binary-fraction ceil is exact when k >= n.bit_length());
      // fall back to ±2 scan only if rounding produces a neighbor match.
      if (mCeil >= 0n && modPow(mCeil, e, n) === c) {
        return Promise.resolve(\`LSB Oracle\\nn = \${n}\\ne = \${e}\\nc = \${c}\\noracle_responses = \${k} bits\\n\\nResults:\\nm = \${mCeil}\\n\\nVerification: m^e mod n = \${modPow(mCeil, e, n)}\\n\\nLSB_ORACLE=SUCCESS\`);
      }
      for (const mVal of [mCeil - 1n, mCeil + 1n, mCeil - 2n, mCeil + 2n]) {
        if (mVal >= 0n && modPow(mVal, e, n) === c) {
          return Promise.resolve(\`LSB Oracle\\nn = \${n}\\ne = \${e}\\nc = \${c}\\noracle_responses = \${k} bits\\n\\nResults:\\nm = \${mVal}\\n\\nVerification: m^e mod n = \${modPow(mVal, e, n)}\\n\\nLSB_ORACLE=SUCCESS\`);
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: \`\\\\textbf{Theorem:} An exact LSB oracle recovers $m$ in exactly $\\\\log_2 n$ queries via binary fraction accumulation.

\\\\textbf{Setup:}
\\\\begin{itemize}
\\\\item Oracle $\\\\mathcal{O}(c) = \\\\text{LSB}(m^d \\\\bmod n)$ -- the least significant bit
\\\\item Blinding: $\\\\mathcal{O}(c \\\\cdot 2^{e} \\\\bmod n) = \\\\text{LSB}(2m \\\\bmod n)$, hence $\\\\mathcal{O}(c \\\\cdot 2^{i e} \\\\bmod n) = \\\\text{LSB}(2^i m \\\\bmod n)$
\\\\end{itemize}

\\\\textbf{Proof (Binary Fraction):}
\\\\begin{align*}
\\\\text{LSB}(2^i m \\\\bmod n) &= \\\\text{bit } i \\\\text{ of the binary fraction } \\\\frac{m}{n} \\\\\\\\
b_i &= \\\\text{LSB}(2^{i+1} m \\\\bmod n) \\\\\\\\
q &= \\\\sum_{i=0}^{k-1} b_i \\\\cdot 2^{k-1-i} \\\\quad \\\\text{(accumulate bits MSB-first)} \\\\\\\\
m &= \\\\left\\\\lceil \\\\frac{q \\\\cdot n}{2^k} \\\\right\\\\rceil \\\\quad (k \\\\geq \\\\log_2 n \\\\implies \\\\text{unique}) \\\\qed
\\\\end{align*}

\\\\textbf{Proof (Interval Halving) -- Equivalent View:}
\\\\begin{align*}
[L_0, U_0] &= [0, n] \\\\\\\\
\\\\text{mid} &= \\\\frac{L_i + U_i}{2} \\\\quad \\\\text{(exact rational midpoint)} \\\\\\\\
\\\\mathcal{O}(c \\\\cdot 2^{i e}) = 0 &\\\\implies m \\\\in [L_i, \\\\text{mid}) \\\\\\\\
\\\\mathcal{O}(c \\\\cdot 2^{i e}) = 1 &\\\\implies m \\\\in [\\\\text{mid}, U_i) \\\\\\\\
\\\\log_2 n \\\\text{ steps} &\\\\implies U_i - L_i \\\\to 0 \\\\implies m = L_i \\\\qed
\\\\end{align*}

\\\\textbf{Explanation:} The key insight is that multiplying $m$ by 2 modulo $n$ either doubles it (if $2m < n$) or wraps around ($2m - n$). The LSB tells us which happened: LSB=1 means $2m \\\\geq n$ (wrapped), LSB=0 means $2m < n$ (didn't wrap). This is exactly a binary search: each LSB response halves the interval containing $m$. After $\\\\log_2 n$ queries, the interval width is less than 1, pinpointing $m$. The binary fraction formulation is more efficient for batch computation.

\\\\textbf{References:} S. Goldwasser, S. Micali, "Probabilistic Encryption", JCSS 1984; M. Ben-Or et al., "A Hard-Core Predicate for all One-Way Functions", STOC 1988\`,
  usageGuide: 'This attack requires oracle_responses \\u2014 a comma-separated list of LSB bits obtained by querying an oracle that reveals the least significant bit of the decrypted ciphertext.\\n\\nHow to use:\\n1. Set up an LSB oracle function that returns LSB(decrypt(c)) for any ciphertext c\\n2. For each query i: compute c\\' = c * 2^(i*e) mod n, call the oracle, record the bit\\n3. Provide n, e, c, and the full list of oracle bits (from query 0 to query log2(n))\\n4. The attack accumulates bits into a binary fraction to recover the message\\n\\nTip: You need roughly n.bit_length() oracle responses for full recovery. Each bit halves the uncertainty.',
  priority: 'medium',
  applicableCheck: rsaNeeds.nECOracleResponses,
};

export const generateTestcase = (): Record<string, string> => {
  // Use small primes (12-bit) so the attack completes in SageMathCell's 120s timeout.
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
      lower = mid + 1n;
    } else {
      responses.push('0');
      upper = mid;
    }
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
`;export{e as default};