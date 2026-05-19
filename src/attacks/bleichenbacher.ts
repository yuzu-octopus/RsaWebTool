import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'bleichenbacher',
  name: "Bleichenbacher PKCS#1 v1.5",
  category: 'Oracle',
  description: 'Decrypts via PKCS#1 v1.5 padding oracle. Use when server reveals padding validity.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated 0/1)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `# Simplified Bleichenbacher simulation — full attack requires ~2^17 queries
# Validate inputs
if not "${vals.n}".strip():
    print("ERROR: n is required")
    print("BLEICHENBACHER=FAILED")
    quit()
if not "${vals.e}".strip():
    print("ERROR: e is required")
    print("BLEICHENBACHER=FAILED")
    quit()
if not "${vals.c}".strip():
    print("ERROR: c is required")
    print("BLEICHENBACHER=FAILED")
    quit()
if not "${vals.oracle_responses}".strip():
    print("ERROR: oracle_responses is required")
    print("BLEICHENBACHER=FAILED")
    quit()

try:
    n = Integer(${vals.n})
    e = Integer(${vals.e})
    c = Integer(${vals.c})
    orig_c = Integer(${vals.c})

    # Parse oracle responses
    responses_str = """${vals.oracle_responses}""".strip()
    oracle_bits = [int(x.strip()) for x in responses_str.split(',') if x.strip()]

    print(f"Bleichenbacher PKCS#1 v1.5 Attack")
    print(f"n = {n} ({n.nbits()} bits)")
    print(f"e = {e}")
    print(f"c = {c}")
    print(f"Oracle responses: {len(oracle_bits)}")
    print()

    # PKCS#1 v1.5 padding: EM = 0x00 || 0x02 || PS || 0x00 || M
    # B = 2^(8*(k-2)) where k = byte length of n
    # Valid padding: 2B <= m < 3B

    k = (n.nbits() + 7) // 8  # byte length
    B = Integer(2)**(8 * (k - 2))

    print(f"Block size: {k} bytes")
    print(f"B = 2^(8*{k-2}) = {B}")
    print(f"Valid padding range: [{2*B}, {3*B})")
    print()

    # The real Bleichenbacher attack has 3 phases:
    # Phase 1: Find s1 such that (c * s1^e) mod n has valid padding
    # Phase 2: Narrow the interval containing m
    # Phase 3: Compute m from the final interval

    # For demonstration, we use the oracle responses to simulate interval narrowing
    # Each response indicates whether (c * s^e)^d mod n has valid PKCS#1 v1.5 padding

    # Initialize interval [a, b]
    a = Integer(2 * B)
    b = Integer(3 * B - 1)

    print(f"Initial interval: [{a}, {b}]")
    print(f"Interval size: {b - a + 1}")
    print()

    # For each oracle response, narrow the interval using proper Bleichenbacher logic
    # Each response indicates whether (c * s^e)^d mod n has valid PKCS#1 v1.5 padding
    # Valid: 2B <= m*s mod n < 3B

    s = Integer(1)
    for i, response in enumerate(oracle_bits):
        # Choose s = 2 for binary-style search
        s = Integer(2)

        # Compute m*s mod n bounds from oracle response
        # If valid: 2B <= m*s mod n < 3B
        # This means m*s - r*n is in [2B, 3B) for some integer r
        # So m is in [(2B + r*n)/s, (3B - 1 + r*n)/s] for some r

        if response == 1:
            # Valid padding: m*s mod n in [2B, 3B)
            # Narrow to intersection of [a, b] with valid intervals
            # For r=0: m in [ceil(2B/s), floor((3B-1)/s)]
            new_a = (2 * B + s - 1) // s
            new_b = (3 * B - 1) // s
            # Also consider r=1: m in [ceil((2B+n)/s), floor((3B-1+n)/s)]
            new_a2 = (2 * B + n + s - 1) // s
            new_b2 = (3 * B - 1 + n) // s
            # Intersect with current interval
            if new_b >= a and new_a <= b:
                a = max(a, new_a)
                b = min(b, new_b)
            elif new_b2 >= a and new_a2 <= b:
                a = max(a, new_a2)
                b = min(b, new_b2)
        else:
            # Invalid padding: m*s mod n NOT in [2B, 3B)
            # Shift interval to exclude the valid range
            mid = (a + b) // 2
            if (mid * s) % n >= 2 * B and (mid * s) % n < 3 * B:
                # Mid is in valid range but oracle says invalid, so m is elsewhere
                a = mid + 1
            else:
                a = a + (b - a + 1) // 4

        # Update c for next iteration
        c = (c * power_mod(s, e, n)) % n

        if i < 5 or i >= len(oracle_bits) - 3:
            print(f"Step {i+1}: response={response}, interval=[{a}, {b}], size bits={max(0, (b-a+1).nbits())}")

    # Final estimate
    if a == b:
        m = a
        print(f"\\nExact message recovered: m = {m}")
    else:
        m = (a + b) // 2
        print(f"\\nEstimated message: m = {m}")
        print(f"Final interval: [{a}, {b}]")
        print(f"Uncertainty: {b - a + 1} ({(b-a+1).nbits()} bits)")

    # Verify
    v = power_mod(m, e, n)
    print(f"Verification: m^e mod n = {v}")
    print(f"Original c = {orig_c}")
    if v == orig_c:
        print("VERIFICATION PASSED!")
        print("BLEICHENBACHER=SUCCESS")
    else:
        print("Verification failed - may need more oracle responses")
        print("BLEICHENBACHER=FAILED")

except Exception as ex:
    print(f"ERROR: {ex}")
    print("BLEICHENBACHER=FAILED")
`,
  proof: `\\textbf{Theorem:} A PKCS#1 v1.5 padding oracle allows decryption of any ciphertext in \\(\\approx 2^{17}\\) queries.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item PKCS#1 v1.5 format: EM = 0x00 \\,\\|\\, 0x02 \\,\\|\\, PS \\,\\|\\, 0x00 \\,\\|\\, M
\\item Oracle \\(\\mathcal{O}(c)\\) returns 1 iff \\(c^d \\bmod n\\) has valid padding
\\item \\(B = 2^{8(k-2)}\\) where \\(k = \\lceil \\log_{256} n \\rceil\\) (byte length of n)
\\item Valid padding range: \\(2B \\leq m < 3B\\)
\\item RSA homomorphism: \\((c \\cdot s^e)^d \\equiv m \\cdot s \\pmod{n}\\)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c &= m^e \\bmod n, \\quad 2B \\leq m < 3B \\\\
\\text{Choose } s, \\text{ query } \\mathcal{O}(c \\cdot s^e \\bmod n) & \\\\
\\mathcal{O} = 1 \\implies 2B \\leq (m \\cdot s \\bmod n) &< 3B \\\\
m \\cdot s \\bmod n = m \\cdot s - r \\cdot n, \\quad r \\in \\mathbb{Z} & \\\\
2B + r \\cdot n \\leq m \\cdot s &< 3B + r \\cdot n \\\\
\\frac{2B + r \\cdot n}{s} \\leq m &< \\frac{3B + r \\cdot n}{s} \\\\
M_i &= \\bigcup_r \\left[ \\left\\lceil \\frac{2B + r n}{s_i} \\right\\rceil, \\left\\lfloor \\frac{3B - 1 + r n}{s_i} \\right\\rfloor \\right] \\\\
[a_{i+1}, b_{i+1}] &= [a_i, b_i] \\cap M_i \\\\
\\text{Repeat until } b - a &= 0 \\implies m = a \\qed
\\end{align*}

\\textbf{Explanation:} The attack multiplies the ciphertext by \\(s^e\\) and queries the oracle. A valid response constrains \\(m \\cdot s \\bmod n\\) to \\([2B, 3B)\\), which maps back to a union of intervals for \\(m\\). Intersecting these intervals across multiple \\(s\\) values shrinks the candidate range until \\(m\\) is isolated.

\\textbf{References:} D. Bleichenbacher, "Chosen Ciphertext Attacks Against Protocols Based on the RSA Encryption Standard PKCS #1", CRYPTO 1998`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const k = Math.ceil(n.toString(2).length / 8);
  const B = 256n ** BigInt(k - 2);
  const lower = 2n * B;
  const upper = 3n * B;
  const m = lower + BigInt(Math.floor(Math.random() * Number(upper - lower)));
  const c = encrypt(m, n, e);
  const responses: string[] = [];
  let curC = c;
  for (let i = 0; i < 256; i++) {
    const dec = modPow(curC, d, n);
    responses.push(dec >= lower && dec < upper ? '1' : '0');
    curC = (curC * modPow(2n, e, n)) % n;
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
