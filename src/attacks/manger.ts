import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'manger',
  name: "Manger's OAEP Attack",
  category: 'Oracle',
  description: 'Decrypts OAEP via first-byte oracle. Use when oracle reveals if decrypted OAEP starts with 0x00.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated 0/1)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        # Manger's OAEP padding oracle attack (3-step algorithm)
        # Reference: J. Manger, CRYPTO 2001
        if not "${vals.n}".strip():
            print("ERROR: n is required")
            print("MANGER=FAILED")
            return
        if not "${vals.e}".strip():
            print("ERROR: e is required")
            print("MANGER=FAILED")
            return
        if not "${vals.c}".strip():
            print("ERROR: c is required")
            print("MANGER=FAILED")
            return
        responses_raw = """${vals.oracle_responses || ''}""".strip()
        if not responses_raw:
            print("ERROR: oracle_responses is required")
            print("MANGER=FAILED")
            return
        try:
            n = Integer(${vals.n})
            e = Integer(${vals.e})
            c = Integer(${vals.c})
            orig_c = c
            # Parse oracle responses into a list
            oracle_list = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            oracle_idx = [0]
        #
            def oracle(query_c):
                """Simulate oracle using pre-computed responses.
                Returns True (1) if decrypted value >= B, False (0) if < B."""
                if oracle_idx[0] >= len(oracle_list):
                    print(f"WARNING: ran out of oracle responses at index {oracle_idx[0]}")
                    return False
                result = oracle_list[oracle_idx[0]] == 1
                oracle_idx[0] += 1
                return result
            def ceil_div(a, b):
                return (a + b - 1) // b
            def floor_div(a, b):
                return a // b
            print(f"Manger's OAEP Attack (3-step algorithm)")
            print(f"n = {n} ({n.nbits()} bits)")
            print(f"e = {e}")
            print(f"c = {c}")
            #
            # k = byte length of n, B = 2^(8*(k-1))
            k = ceil_div(n.nbits(), 8)
            B = Integer(2) ** (8 * (k - 1))
            print(f"k = {k}, B = 2^(8*{k-1}) = {B}")
            print(f"2*B = {2*B}, 2*B < n: {2*B < n}")
            print()
            #
            queries_used = [0]
            #
            # Step 1: Find f1 such that f1*m mod n >= B
            # Start with f1=2, double until oracle returns True (>= B)
            print("=== Step 1: Finding f1 ===")
            f1 = Integer(2)
            while not oracle((power_mod(f1, e, n) * c) % n):
                queries_used[0] += 1
                f1 *= 2
            queries_used[0] += 1
            print(f"f1 = {f1} (f1*m mod n >= B confirmed)")
            print()
            #
            # Step 2: Find f2 such that f2*m mod n < B (wrapped around)
            # Start: f2 = floor((n+B)/B) * f1/2
            # Increment by f1/2 until oracle returns False (< B)
            print("=== Step 2: Finding f2 ===")
            f1_half = f1 // 2
            f2 = floor_div(n + B, B) * f1_half
            while oracle((power_mod(f2, e, n) * c) % n):
                queries_used[0] += 1
                f2 += f1_half
            queries_used[0] += 1
            print(f"f2 = {f2} (f2*m mod n < B, wrapped to [n, n+B))")
            print()
            #
            # Step 3: Binary search to narrow [mmin, mmax] to single value
            print("=== Step 3: Binary search ===")
            mmin = ceil_div(n, f2)
            mmax = floor_div(n + B, f2)
            print(f"Initial: mmin={mmin}, mmax={mmax}")
            print(f"Range size: {(mmax - mmin).nbits()} bits")
            print()
            #
            step_count = 0
            twoB = Integer(2) * B
            while mmin < mmax:
                step_count += 1
                f_tmp = floor_div(twoB, mmax - mmin)
                i_val = floor_div(f_tmp * mmin, n)
                f3 = ceil_div(i_val * n, mmin)
                if f3 == 0:
                    f3 = Integer(1)
                # Query oracle with f3
                oracle_result = oracle((power_mod(f3, e, n) * c) % n)
                queries_used[0] += 1
                iNB = i_val * n + B
                if oracle_result:
                    # f3*m mod n >= B => mmin = ceil((i*n + B) / f3)
                    mmin = ceil_div(iNB, f3)
                else:
                    # f3*m mod n < B => mmax = floor((i*n + B) / f3)
                    mmax = floor_div(iNB, f3)
                if step_count <= 5 or (mmax - mmin) <= Integer(2):
                    print(f"Step {step_count}: f3={f3}, oracle={oracle_result}, mmin={mmin}, mmax={mmax}, range={(mmax-mmin).nbits()} bits")
        #
            #
            m = mmin
            print(f"Recovered message: m = {m}")
            print(f"Total oracle queries: {queries_used[0]}")
            print(f"Total binary search steps: {step_count}")
            #
            # Verify
            v = power_mod(m, e, n)
            print(f"Verification: m^e mod n = {v}")
            print(f"Original c = {orig_c}")
            if v == orig_c:
                print("VERIFICATION PASSED!")
                print()
                print("MANGER=SUCCESS")
            else:
                print("Verification failed - may need more oracle responses")
                print(f"m^e mod n = {v}")
                print(f"c = {orig_c}")
                print()
                print("MANGER=FAILED")
        #
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("MANGER=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("MANGER=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} An OAEP first-byte oracle allows decryption in O(\\log n) queries.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle O(c) = 1 iff first byte is 0x00
\\item First byte 0 $\\iff m < n/256$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\mathcal{O}(c) = 1 &\\iff m < n/256 \\\\
\\mathcal{O}(c \\cdot s^e) = 1 &\\implies m \\cdot s - rn < n/256 \\\\
m &\\in \\bigcup_{r=0}^{s-1} \\left[ \\frac{rn}{s}, \\frac{n(256r+1)}{256s} \\right) \\\\
[a_{i+1}, b_{i+1}] &= [a_i, b_i] \\cap \\{m : \\mathcal{O}(c \\cdot s_i^e) = 1\\} \\\\
\\lceil \\log_2 n \\rceil + 8 \\text{ queries} &\\implies b - a = 0 \\implies m = a \\qed
\\end{align*}

\\textbf{References:} J. Manger, CRYPTO 2001`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
};

export const generateTestcase = (): Record<string, string> => {
  // Use small primes (12-bit → n ≈ 24 bits) so the attack completes in SageMathCell's 35s timeout.
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
