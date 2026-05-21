import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';
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
  sageTemplate: (vals: Record<string, string>) => `# Validate inputs
if not "${vals.n}".strip():
    print("ERROR: n is required")
    print("BIASED_LSB=FAILED")
    quit()
if not "${vals.e}".strip():
    print("ERROR: e is required")
    print("BIASED_LSB=FAILED")
    quit()
if not "${vals.c}".strip():
    print("ERROR: c is required")
    print("BIASED_LSB=FAILED")
    quit()
if not """${vals.oracle_runs}""".strip():
    print("ERROR: oracle_runs is required")
    print("BIASED_LSB=FAILED")
    quit()
try:
    n = Integer(${vals.n})
    e = Integer(${vals.e})
    orig_c = Integer(${vals.c})
    c = (Integer(${vals.c}) * power_mod(Integer(2), e, n)) % n
    # Parse oracle runs (multiple response strings, newline-separated)
    runs_str = """${vals.oracle_runs}""".strip()
    runs = []
    for line in runs_str.split('\\n'):
        line = line.strip()
        if not line:
            continue
        bits = [int(x.strip()) for x in line.split(',') if x.strip()]
        runs.append(bits)
    print(f"Biased LSB Oracle Attack")
    print(f"n = {n}")
    print(f"e = {e}")
    print(f"c = {c}")
    print(f"Number of oracle runs: {len(runs)}")
    print()
    # Per-bit majority voting, then binary search
    num_bits = min(len(r) for r in runs)
    n_bits = n.nbits()
    print(f"Using {num_bits} bit positions (n has {n_bits} bits)")
    # Majority voting
    voted_bits = []
    for i in range(num_bits):
        votes = sum(runs[j][i] for j in range(len(runs)))
        majority = 1 if votes > len(runs) / 2 else 0
        voted_bits.append(majority)
    print(f"Majority-voted bits: {voted_bits[:20]}{'...' if num_bits > 20 else ''}")
    print()
    # Binary search with voted bits
    lower = Integer(0)
    upper = Integer(n)
    for i, bit in enumerate(voted_bits):
        mid = (lower + upper) // 2
        if bit == 0:
            upper = mid
        else:
            lower = mid
        c = (c * power_mod(Integer(2), e, n)) % n
        if i < 5 or i >= len(voted_bits) - 3:
            print(f"Step {i+1}: bit={bit}, lower={lower}, upper={upper}")
    m = (lower + upper) // 2
    print(f"\\nRecovered message: m = {m}")
    # Verify
    v = power_mod(m, e, n)
    print(f"Verification: m^e mod n = {v}")
    print(f"Original c = {orig_c}")
    if v == orig_c:
        print("VERIFICATION PASSED!")
        print("BIASED_LSB=SUCCESS")
    else:
        print("Verification failed - may need more oracle runs or higher bias")
        print("BIASED_LSB=FAILED")
except Exception as ex:
    print(f"ERROR: {ex}")
    print("BIASED_LSB=FAILED")
`,
  proof: `\\textbf{Theorem:} An LSB oracle with bias p > 1/2 recovers m with high probability via majority voting + binary search.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Noisy oracle \\mathcal{O}_j(c) = \\text{LSB}(c^d \\bmod n) with \\Pr[\\text{correct}] = p > 1/2
\\item k independent oracle runs available per query
\\item RSA homomorphism: \\text{LSB}((c \\cdot 2^e)^d) = \\text{LSB}(2m \\bmod n)
\\item Binary search: \\text{LSB}(2^i m \\bmod n) halves the interval each step
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
b_i &= \\text{LSB}(2^i m \\bmod n), \\quad i = 0, 1, \\ldots, \\lfloor \\log_2 n \\rfloor \\\\
\\text{Collect } k \\text{ responses per position: } & b_{i,1}, \\ldots, b_{i,k} \\\\
\\hat{b}_i &= \\text{majority}(b_{i,1}, \\ldots, b_{i,k}) \\\\
\\Pr[\\hat{b}_i \\neq b_i] &\\leq \\exp\\!\\bigl(-2k(p - 1/2)^2\\bigr) \\\\
k &= O\\!\\left(\\frac{\\log n}{(p - 1/2)^2}\\right) \\implies \\Pr[\\hat{b}_i \\neq b_i] = O(1/n) \\\\
[a_0, b_0] &= [0, n) \\\\
b_i = 0 \\implies [a_{i+1}, b_{i+1}] &= [a_i, (a_i + b_i)/2) \\\\
b_i = 1 \\implies [a_{i+1}, b_{i+1}] &= [(a_i + b_i)/2, b_i) \\\\
\\text{After } \\log_2 n \\text{ steps: } b - a &= 0 \\implies m = a
\\end{align*}

\\textbf{Explanation:} Each LSB query on 2^i·m mod n reveals whether m falls in the upper or lower half of the current interval. With noisy oracles, majority voting across k independent runs amplifies the signal. The error drops exponentially with k, so O(log n / (p-1/2)²) runs per bit suffice.

\\textbf{References:} Goldwasser, Micali, "Probabilistic Encryption", 1982; Håstad et al., "Bit Security of RSA", 1989`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_runs,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const nBits = n.toString(2).length;
  const m = BigInt('0x' + Array.from(crypto.getRandomValues(new Uint8Array(Math.ceil(nBits / 8))))
    .map(b => b.toString(16).padStart(2, '0')).join('')) % (n / 2n);
  const c = encrypt(m, n, e);
  const runs: string[] = [];
  const numRuns = 21;
  for (let run = 0; run < numRuns; run++) {
    const bits: string[] = [];
    let curC = (c * modPow(2n, e, n)) % n;
    for (let i = 0; i < nBits; i++) {
      const dec = modPow(curC, d, n);
      const trueBit = (dec % 2n).toString();
      const noisy = Math.random() < 0.75 ? trueBit : (trueBit === '0' ? '1' : '0');
      bits.push(noisy);
      curC = (curC * modPow(2n, e, n)) % n;
    }
    runs.push(bits.join(','));
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_runs: runs.join('\n') };
};
