import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'biased-lsb',
  name: 'Biased LSB Oracle',
  category: 'Oracle',
  description: 'Recovers m via noisy LSB oracle. Use when LSB oracle is correct with probability > 50%.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_runs', label: 'Oracle runs (multiple response strings, newline-separated)', placeholder: '0,1,0,1,1\\n1,0,1,1,0\\n0,1,1,1,0...', multiline: true, rows: 6 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        # Validate inputs
        if not "${vals.n}".strip():
            print("ERROR: n is required")
            print("BIASED_LSB=FAILED")
            return
        if not "${vals.e}".strip():
            print("ERROR: e is required")
            print("BIASED_LSB=FAILED")
            return
        if not "${vals.c}".strip():
            print("ERROR: c is required")
            print("BIASED_LSB=FAILED")
            return
        if not """${vals.oracle_runs}""".strip():
            print("ERROR: oracle_runs is required")
            print("BIASED_LSB=FAILED")
            return
        try:
            out = []
            n = Integer(${vals.n})
            e_val = "${vals.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            orig_c = Integer(${vals.c})
            two_e = pow(2, int(e), int(n))
            c = (Integer(${vals.c}) * Integer(two_e)) % n
            # Parse oracle runs (multiple response strings, newline-separated)
            runs_str = """${vals.oracle_runs}""".strip()
            runs = []
            for line in runs_str.split('\\n'):
                line = line.strip()
                if not line:
                    continue
                bits = [int(x.strip()) for x in line.split(',') if x.strip()]
                runs.append(bits)
            if not runs:
                print("ERROR: No valid oracle runs parsed")
                print("BIASED_LSB=FAILED")
                return
            out.append(f"Biased LSB Oracle Attack")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"c = {c}")
            out.append(f"Number of oracle runs: {len(runs)}")
            out.append("")
            # Per-bit majority voting, then binary search
            num_bits = min(len(r) for r in runs)
            n_bits = n.nbits()
            out.append(f"Using {num_bits} bit positions (n has {n_bits} bits)")
            # Majority voting
            voted_bits = []
            for i in range(num_bits):
                votes = sum(runs[j][i] for j in range(len(runs)))
                majority = 1 if votes > len(runs) / 2 else 0
                voted_bits.append(majority)
            out.append(f"Majority-voted bits: {voted_bits[:20]}{'...' if num_bits > 20 else ''}")
            out.append("")
            # Binary search with voted bits using exact rational division
            # NOTE: Must use /2 (Rational) not //2 (floor division) to avoid
            # accumulated truncation errors that exclude m from the interval.
            lower = Integer(0)
            upper = Integer(n)
            for i, bit in enumerate(voted_bits):
                mid = (lower + upper) / 2  # Rational — exact midpoint
                if bit == 0:
                    upper = mid
                else:
                    lower = mid
                c = Integer((int(c) * two_e) % int(n))
                if i < 5 or i >= len(voted_bits) - 3:
                    out.append(f"Step {i+1}: bit={bit}, lower={lower}, upper={upper}")
            # Scan candidates near the rational interval [lower, upper)
            # After log2(n) steps, interval should contain exactly one integer
            from math import ceil, floor
            candidate_start = Integer(ceil(lower))
            candidate_end = Integer(floor(upper)) + 1
            found_m = None
            for m_candidate in range(candidate_start, candidate_end + 1):
                m_test = Integer(m_candidate)
                if pow(int(m_test), int(e), int(n)) == int(orig_c):
                    found_m = m_test
                    break
            if found_m is None:
                # Fallback: wider scan around midpoint estimate (noisy oracle may have wrong bits)
                mid_est = Integer(floor((lower + upper) / 2))
                for m_candidate in range(max(0, mid_est - 500), mid_est + 501):
                    m_test = Integer(m_candidate)
                    if pow(int(m_test), int(e), int(n)) == int(orig_c):
                        found_m = m_test
                        break
            if found_m is not None:
                out.append(f"\\nRecovered message: m = {found_m}")
                v = Integer(pow(int(found_m), int(e), int(n)))
                out.append(f"Verification: m^e mod n = {v}")
                out.append(f"Original c = {orig_c}")
                out.append("VERIFICATION PASSED!")
                out.append("")
                out.append("BIASED_LSB=SUCCESS")
            else:
                out.append(f"\\nCandidate scan failed to find m in range [{candidate_start}, {candidate_end}]")
                out.append("Verification failed - may need more oracle runs or higher bias")
                out.append("")
                out.append("BIASED_LSB=FAILED")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("BIASED_LSB=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BIASED_LSB=FAILED")
_attack()`,
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
        votes.push(sum >= 0);
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

      for (let m = mCeil - 2n; m <= mCeil + 2n; m++) {
        if (m >= 0n && modPow(m, e, n) === c) return Promise.resolve(`Message recovered: m = ${m}\nBIASED_LSB=SUCCESS`);
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} A noisy LSB oracle with bias p > 1/2 recovers m via majority voting + binary search.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle correct with prob $p > 1/2$
\\item k runs per query for majority voting
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
b_i &= \\text{LSB}(2^i m \\bmod n) \\\\
\\hat{b}_i &= \\text{majority}(b_{i,1}, \\ldots, b_{i,k}) \\\\
\\Pr[\\hat{b}_i \\neq b_i] &\\leq \\exp(-2k(p-\\tfrac12)^2) \\\\
k = O\\!\\left(\\frac{\\log n}{(p-1/2)^2}\\right) &\\implies \\Pr[\\hat{b}_i \\neq b_i] = O(1/n) \\\\
b_i = 0 &\\implies \\text{lower half}, \\quad b_i = 1 \\implies \\text{upper half} \\\\
\\log_2 n \\text{ steps} &\\implies m = a \\qed
\\end{align*}

\\textbf{References:} Goldwasser, Micali, 1982; Håstad et al., 1989`,
  usageGuide: 'This attack is for when your LSB oracle is noisy \u2014 instead of a single correct bit per query, you have multiple responses and use majority voting.\n\nHow to use:\n1. Query the oracle N times per blinding value (oracle_runs defaults to 101)\n2. The attack uses majority voting to determine the correct LSB at each step\n3. Provide n, e, c, and oracle_responses \u2014 one per line, each line being comma-separated 0/1 bits\n4. The attack performs binary search with probabilistic bit recovery\n\nTip: More queries per position (oracle_runs) increases accuracy but takes more time. The default of 101 gives 99%+ confidence for each bit.',
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
