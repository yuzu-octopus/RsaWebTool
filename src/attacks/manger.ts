import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';
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
  sageTemplate: (vals: Record<string, string>) => `# Manger's OAEP padding oracle attack
if not "${vals.n}".strip():
    print("ERROR: n is required")
    print("MANGER=FAILED")
    quit()
if not "${vals.e}".strip():
    print("ERROR: e is required")
    print("MANGER=FAILED")
    quit()
if not "${vals.c}".strip():
    print("ERROR: c is required")
    print("MANGER=FAILED")
    quit()
if not "${vals.oracle_responses}".strip():
    print("ERROR: oracle_responses is required")
    print("MANGER=FAILED")
    quit()

try:
    n = Integer(${vals.n})
    e = Integer(${vals.e})
    c = Integer(${vals.c})
    orig_c = Integer(${vals.c})

    # Parse oracle responses
    responses_str = """${vals.oracle_responses}""".strip()
    oracle_bits = [int(x.strip()) for x in responses_str.split(',') if x.strip()]

    print(f"Manger's OAEP Attack")
    print(f"n = {n} ({n.nbits()} bits)")
    print(f"e = {e}")
    print(f"c = {c}")
    print(f"Oracle responses: {len(oracle_bits)}")
    print()

    # RSA-OAEP: EM = 0x00 || maskedSeed || maskedDB
    # Oracle reveals whether first byte of decrypted message is 0x00
    # This means: m < n / 256
    threshold = n // 256
    print(f"OAEP constraint: first byte = 0x00 means m < n/256 = {threshold}")
    print()

    # The attack uses: (c * s^e)^d = m * s mod n
    # Oracle reveals whether m*s mod n < threshold
    # If yes: m in [rn/s, (rn+threshold)/s) for some r=0..s-1
    # If no: m NOT in those intervals

    # Start with full interval
    lower = Integer(0)
    upper = Integer(n)

    print(f"Initial interval: [0, {n})")
    print(f"Interval size: {n.nbits()} bits")
    print()

    # Process each oracle response
    # Response i corresponds to s = i + 1
    for i, response in enumerate(oracle_bits):
        s = Integer(i + 1)
        if s == 1:
            # First response confirms m < threshold
            if response == 1:
                upper = min(upper, threshold)
            continue

        # Update ciphertext: c = c * s^e mod n
        c = (c * power_mod(s, e, n)) % n

        if response == 1:
            # m*s mod n < threshold
            # m in [rn/s, (rn+threshold)/s) for r=0..s-1
            # Find the r whose interval intersects [lower, upper)
            new_lower = None
            new_upper = None
            for r in range(int(s)):
                r_int = Integer(r)
                ca = floor(r_int * n / s)
                cb = floor((r_int * n + threshold - 1) / s)
                inter_a = max(lower, ca)
                inter_b = min(upper, cb)
                if inter_a < inter_b:
                    if new_lower is None:
                        new_lower = inter_a
                        new_upper = inter_b
                    else:
                        # Merge overlapping intervals
                        if inter_a <= new_upper:
                            new_upper = max(new_upper, inter_b)
                        else:
                            # Non-overlapping: pick the one containing midpoint
                            mid = (lower + upper) // 2
                            if inter_a <= mid < inter_b:
                                new_lower = inter_a
                                new_upper = inter_b

            if new_lower is not None:
                lower = new_lower
                upper = new_upper
        else:
            # m*s mod n >= threshold
            # m NOT in [rn/s, (rn+threshold)/s) for any r
            # Simplified: shift lower bound past the first excluded interval
            first_excluded = floor((threshold - 1) / s) + 1
            lower = max(lower, first_excluded)

        if i < 5 or i >= len(oracle_bits) - 3:
            print(f"Step {i+1}: s={s}, response={response}, interval=[{lower}, {upper}], size={(upper-lower).nbits()} bits")

    print()
    m = (lower + upper) // 2
    print(f"Estimated message: m = {m}")
    print(f"Final interval: [{lower}, {upper}]")
    print(f"Uncertainty: {(upper-lower).nbits()} bits")

    # Verify
    v = power_mod(m, e, n)
    print(f"Verification: m^e mod n = {v}")
    print(f"Original c = {orig_c}")
    if v == orig_c:
        print("VERIFICATION PASSED!")
        print("MANGER=SUCCESS")
    else:
        print("Verification failed - may need more oracle responses")
        print("MANGER=FAILED")

except Exception as ex:
    print(f"ERROR: {ex}")
    print("MANGER=FAILED")
`,
  proof: `\\textbf{Theorem:} An OAEP first-byte-zero oracle allows decryption in O(\\log n) queries.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA-OAEP format: EM = 0x00 \\,\\|\\, maskedSeed \\,\\|\\, maskedDB
\\item Oracle \\mathcal{O}(c) returns 1 iff first byte of c^d \\bmod n is 0x00
\\item First byte zero \\iff c^d \\bmod n < n / 256
\\item RSA homomorphism: (c \\cdot s^e)^d \\equiv m \\cdot s \\pmod{n}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c &= m^e \\bmod n \\\\
\\mathcal{O}(c) = 1 &\\iff m < n / 256 \\\\
\\text{Query } \\mathcal{O}(c \\cdot s^e \\bmod n): & \\\\
\\mathcal{O} = 1 \\implies m \\cdot s \\bmod n &< n / 256 \\\\
m \\cdot s - r \\cdot n &< n / 256, \\quad r \\in \\mathbb{Z} \\\\
m &< \\frac{n(256r + 1)}{256s} \\\\
m &\\in \\bigcup_{r=0}^{s-1} \\left[ \\frac{rn}{s}, \\frac{n(256r + 1)}{256s} \\right) \\\\
[a_{i+1}, b_{i+1}] &= [a_i, b_i] \\cap \\{ m : \\mathcal{O}(c \\cdot s_i^e) = 1 \\} \\\\
\\text{After } \\lceil \\log_2 n \\rceil + 8 \\text{ queries: } b - a &= 0 \\implies m = a
\\end{align*}

\\textbf{Explanation:} Each oracle query on c·s^e reveals whether m·s mod n falls in [0, n/256). This constrains m to a union of narrow intervals. By choosing s strategically (doubling each step), the interval halves each round, converging to m in logarithmic queries.

\\textbf{References:} J. Manger, "A Chosen Ciphertext Attack on RSA Optimal Asymmetric Encryption Padding (OAEP) as Standardized in PKCS #1 v2.0", CRYPTO 2001`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const threshold = n / 256n;
  const m = BigInt(Math.floor(Math.random() * Number(threshold / 2n)));
  const c = encrypt(m, n, e);
  const responses: string[] = [];
  let curC = c;
  for (let s = 1; s <= 512; s++) {
    const dec = modPow(curC, d, n);
    responses.push(dec < threshold ? '1' : '0');
    curC = (curC * modPow(BigInt(s + 1), e, n)) % n;
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
