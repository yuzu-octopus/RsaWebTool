import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const attack: Attack = {
  id: 'biased-lsb',
  name: 'Biased LSB Oracle',
  category: 'Oracle',
  description: 'Recovers plaintext m using a noisy LSB oracle with bias > 50% via majority voting and binary fraction accumulation. Use for error-prone side-channel LSB leaks.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_runs', label: 'Oracle runs (multiple response strings, newline-separated)', placeholder: '0,1,0,1,1\\n1,0,1,1,0\\n0,1,1,1,0...', multiline: true, rows: 6 },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
      token: 'BIASED_LSB',
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
        if not """${vals.oracle_runs}""".strip():
            out.append("ERROR: oracle_runs is required")
            valid = False
        if valid:
            n = Integer(${vals.n})
            e_val = "${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            orig_c = Integer(${vals.c})
            two_e = pow(2, int(e), int(n))
            two_e_sage = Integer(two_e)
            c = (Integer(${vals.c}) * Integer(two_e)) % n
            runs_str = """${vals.oracle_runs}""".strip()
            runs = []
            for line in runs_str.split('\\n'):
                line = line.strip()
                if not line:
                    continue
                bits = [int(x.strip()) for x in line.split(',') if x.strip()]
                runs.append(bits)
            if not runs:
                out.append("ERROR: No valid oracle runs parsed")
                out.append("BIASED_LSB=FAILED")
            else:
                out.append("Biased LSB Oracle")
                out.append(f"n = {n}")
                out.append(f"e = {e}")
                out.append(f"c = {c}")
                out.append(f"oracle_runs = {len(runs)}")
                num_bits = min(len(r) for r in runs)
                n_bits = n.nbits()
                out.append(f"Using {num_bits} bit positions (n has {n_bits} bits)")
                voted_bits = []
                for i in range(num_bits):
                    votes = sum(runs[j][i] for j in range(len(runs)))
                    majority = 1 if votes > len(runs) / 2 else 0
                    voted_bits.append(majority)

                lower = Integer(0)
                upper = Integer(n)
                for i, bit in enumerate(voted_bits):
                    mid = (lower + upper) / 2
                    if bit == 0:
                        upper = mid
                    else:
                        lower = mid
                    c = (c * two_e_sage) % n

                candidate_start = Integer(ceil(lower))
                candidate_end = Integer(floor(upper)) + 1
                found_m = None
                for m_candidate in range(candidate_start, candidate_end + 1):
                    m_test = Integer(m_candidate)
                    if pow(int(m_test), int(e), int(n)) == int(orig_c):
                        found_m = m_test
                        break
                if found_m is None:
                    mid_est = Integer(floor((lower + upper) / 2))
                    for m_candidate in range(max(0, mid_est - 500), mid_est + 501):
                        m_test = Integer(m_candidate)
                        if pow(int(m_test), int(e), int(n)) == int(orig_c):
                            found_m = m_test
                            break
                if found_m is not None:
                    v = Integer(pow(int(found_m), int(e), int(n)))
                    out.append("")
                    out.append("Results:")
                    out.append(f"m = {found_m}")
                    out.append("")
                    out.append(f"Verification: m^e mod n = {v}")
                    out.append("")
                    out.append("BIASED_LSB=SUCCESS")
                else:
                    out.append("")
                    out.append("BIASED_LSB=FAILED")
        else:
            out.append("BIASED_LSB=FAILED")`,
    }),
  frontendCheck: (vals) => {
    if (!vals.n || !vals.e || !vals.c || !vals.oracle_runs) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const c = BigInt(vals.c);
      const runs = vals.oracle_runs.split('\n').filter(l => l.trim()).map(l =>
        l.split(',').map(x => x.trim() === '1')
      );
      if (runs.length === 0) return Promise.resolve(null);
      const numBits = runs[0].length;
      const votes: boolean[] = [];
      for (let i = 0; i < numBits; i++) {
        let sum = 0;
        for (const run of runs) { if (i < run.length) sum += run[i] ? 1 : -1; }
        votes.push(sum > 0);
      }

      // Accumulate majority-voted bits into quotient q (binary fraction m/n)
      const k = BigInt(votes.length);
      let q = 0n;
      for (const bit of votes) {
        q = (q << 1n) | (bit ? 1n : 0n);
      }

      // After k bits: m = ceil(q * n / 2^k). When k >= n.bit_length(), width < 1.
      const divisor = 1n << k;
      const mCeil = divisor > n ? (q * n + divisor - 1n) / divisor : q * n / divisor;

      for (let mVal = mCeil - 2n; mVal <= mCeil + 2n; mVal++) {
        if (mVal >= 0n && modPow(mVal, e, n) === c) {
          return Promise.resolve(`Biased LSB Oracle\nn = ${n}\ne = ${e}\nc = ${c}\noracle_runs = ${runs.length}\n\nResults:\nm = ${mVal}\n\nVerification: m^e mod n = ${modPow(mVal, e, n)}\n\nBIASED_LSB=SUCCESS`);
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} A noisy LSB oracle with bias $p > 1/2$ recovers $m$ via majority voting and binary fraction accumulation.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle $\\mathcal{O}(c) = \\text{LSB}(\\text{decrypt}(c))$ but correct only with probability $p > 1/2$
\\item $k$ independent oracle runs per query position for majority voting
\\item Each blinding step: $c_i = c \\cdot 2^{i \\cdot e} \\bmod n$ decrypts to $2^i m \\bmod n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
b_i &= \\text{LSB}(2^i m \\bmod n) \\quad \\text{(true bit)} \\\\
\\hat{b}_i &= \\text{majority}(b_{i,1}, \\ldots, b_{i,k}) \\quad \\text{(voted estimate)} \\\\
\\Pr[\\hat{b}_i \\neq b_i] &\\leq \\exp(-2k(p-\\tfrac12)^2) \\quad \\text{(Hoeffding bound)} \\\\
k = O\\!\\left(\\frac{\\log n}{(p-1/2)^2}\\right) &\\implies \\Pr[\\hat{b}_i \\neq b_i] = O(1/n) \\\\
q &= \\sum_{i=0}^{k-1} \\hat{b}_i \\cdot 2^{k-1-i} \\quad \\text{(binary fraction)} \\\\
m &= \\left\\lceil \\frac{q \\cdot n}{2^k} \\right\\rceil \\quad \\text{(verify via } m^e \\equiv c \\pmod{n}) \\qed
\\end{align*}

\\textbf{Explanation:} The LSB of $2^i m \\bmod n$ equals the $i$-th bit of the binary fraction $m/n$. Each oracle call is noisy (correct with probability $p$), but by taking $k$ repeated queries per position and majority-voting, we amplify the effective accuracy. The Hoeffding bound shows that error decays exponentially in $k(p-1/2)^2$. Once we have $k > \\log_2 n$ reliable bits, the binary fraction $q/2^k$ approximates $m/n$ within $1/2^k$, so $m = \\lceil q \\cdot n / 2^k \\rceil$ uniquely.

\\textbf{References:} S. Goldwasser, S. Micali, "Probabilistic Encryption", JCSS 1984; J. Håstad et al., "A Pseudorandom Generator from any One-Way Function", SIAM J. Comp. 1999`,
  usageGuide: 'This attack is for when your LSB oracle is noisy \u2014 instead of a single correct bit per query, you have multiple responses and use majority voting.\n\nHow to use:\n1. Query the oracle multiple times per blinding value to get multiple response strings\n2. Provide n, e, c, and oracle_runs \u2014 one response per line, each line being comma-separated 0/1 bits\n3. The attack uses majority voting per bit position, then accumulates voted bits into binary fraction m/n\n4. The final m is computed as ceil(q * n / 2^k) where q is the accumulated voted bits\n\nTip: More runs per position increases accuracy. With 31 runs and 90% accuracy per bit, majority voting gives >99.9% confidence per bit position after 31 runs.',
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_runs,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(32, 32);
  const nBits = n.toString(2).length;
  const m = BigInt('0x' + Array.from(crypto.getRandomValues(new Uint8Array(Math.ceil(nBits / 8))))
    .map(b => b.toString(16).padStart(2, '0')).join('')) % (n / 2n);
  const c = encrypt(m, n, e);
  const runs: string[] = [];
  const numRuns = 31;
  for (let run = 0; run < numRuns; run++) {
    const bits: string[] = [];
    let curC = (c * modPow(2n, e, n)) % n;
    for (let i = 0; i < nBits; i++) {
      const dec = modPow(curC, d, n);
      const trueBit = (dec % 2n).toString();
      const noisy = Math.random() < 0.90 ? trueBit : (trueBit === '0' ? '1' : '0');
      bits.push(noisy);
      curC = (curC * modPow(2n, e, n)) % n;
    }
    runs.push(bits.join(','));
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_runs: runs.join('\n') };
};
