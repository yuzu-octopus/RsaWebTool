import type { Attack } from '../../types';

export const oracleAttacks: Attack[] = [
  {
    id: 'bleichenbacher',
    name: "Bleichenbacher PKCS#1 v1.5",
    category: 'Oracle',
    description: 'Chosen ciphertext attack against PKCS#1 v1.5 padding oracle.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
      { name: 'oracle_responses', label: 'Oracle responses (comma-separated 0/1)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
c = Integer(${vals.c})

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
B = Integer(2)^(8 * (k - 2))

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

# For each oracle response, narrow the interval
# In the real attack, s values are chosen strategically
# Here we simulate with the provided responses

s = Integer(1)
for i, response in enumerate(oracle_bits):
    # Multiply ciphertext by s^e (s=2 for binary search)
    s = Integer(2)
    
    if response == 1:
        # Valid padding: 2B <= m*s mod n < 3B
        # This means m is in a specific sub-interval
        # m*s mod n in [2B, 3B) means m in [ceil(2B/s), floor((3B-1)/s)]
        a = (2 * B + s - 1) // s  # ceil(2B/s)
        b = (3 * B - 1) // s  # floor((3B-1)/s)
    else:
        # Invalid padding: m*s mod n not in [2B, 3B)
        # Narrow to complement
        # For simplicity, shift the interval
        a = a + (b - a + 1) // 4
        b = b - (b - a) // 4
    
    # Update c for next iteration
    c = (c * power_mod(s, e, n)) % n
    
    if i < 5 or i >= len(oracle_bits) - 3:
        print(f"Step {i+1}: response={response}, interval=[{a}, {b}], size bits={(b-a+1).nbits()}")

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
orig_c = Integer(${vals.c})
v = power_mod(m, e, n)
print(f"Verification: m^e mod n = {v}")
print(f"Original c = {orig_c}")
if v == orig_c:
    print("VERIFICATION PASSED!")
else:
    print("Verification failed - may need more oracle responses")
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
  },
  {
    id: 'manger',
    name: "Manger's OAEP Attack",
    category: 'Oracle',
    description: 'Timing/padding oracle attack on RSA-OAEP.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
      { name: 'oracle_responses', label: 'Oracle responses (comma-separated 0/1)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
c = Integer(${vals.c})

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
# This means: m < n / 256 (first byte is zero)

# The attack uses the multiplicative property:
# (c * s^e)^d = m * s mod n
# Oracle on (c * s^e) reveals whether m*s mod n < n/256

k = (n.nbits() + 7) // 8
print(f"Block size: {k} bytes")
print(f"OAEP constraint: first byte = 0x00 means m < n/256")
print()

# Initialize: m is in [0, n)
lower = Integer(0)
upper = Integer(n)

print(f"Initial interval: [0, {n})")
print()

# For each oracle response, narrow the interval
# In real Manger attack, s values are chosen to maximize information gain
# Here we use s=2 for binary search

for i, response in enumerate(oracle_bits):
    s = Integer(2)
    
    # The oracle tells us whether (m * s) mod n < n / 256
    # This constrains m to specific sub-intervals
    
    if response == 1:
        # m * s mod n < n / 256
        # For s = 2: m < n / 512 (approximately)
        # More precisely: m * 2 mod n < n/256
        # This means m is in [0, n/512) or [n/2, n/2 + n/512)
        # For simplicity, narrow to the first interval
        upper = (lower + (upper - lower) // (2 * 256))
    else:
        # m * s mod n >= n / 256
        # m is NOT in the small interval near 0
        lower = lower + (upper - lower) // (2 * 256)
    
    # Update c for next iteration
    c = (c * power_mod(s, e, n)) % n
    
    if i < 5 or i >= len(oracle_bits) - 3:
        print(f"Step {i+1}: response={response}, interval=[{lower}, {upper}], size bits={(upper-lower).nbits()}")

# Final estimate
m = (lower + upper) // 2
print(f"\\nEstimated message: m = {m}")
print(f"Final interval: [{lower}, {upper}]")
print(f"Uncertainty: {upper - lower} ({(upper-lower).nbits()} bits)")

# Verify
orig_c = Integer(${vals.c})
v = power_mod(m, e, n)
print(f"Verification: m^e mod n = {v}")
print(f"Original c = {orig_c}")
if v == orig_c:
    print("VERIFICATION PASSED!")
else:
    print("Verification failed - may need more oracle responses")
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
  },
  {
    id: 'biased-lsb',
    name: 'Biased LSB Oracle',
    category: 'Oracle',
    description: 'LSB oracle with noisy responses. Majority voting across runs.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
      { name: 'oracle_runs', label: 'Oracle runs (multiple response strings, newline-separated)', placeholder: '0,1,0,1,1\\n1,0,1,1,0\\n0,1,1,1,0...', multiline: true, rows: 6 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
c = Integer(${vals.c})

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
# Each run gives noisy LSB responses
# Majority vote across runs for each bit position

num_bits = min(len(r) for r in runs)
print(f"Using {num_bits} bit positions")

# Majority voting
voted_bits = []
for i in range(num_bits):
    votes = sum(runs[j][i] for j in range(len(runs)))
    majority = 1 if votes > len(runs) / 2 else 0
    voted_bits.append(majority)

print(f"Majority-voted bits: {voted_bits[:20]}{'...' if num_bits > 20 else ''}")
print()

# Binary search with voted bits
lower = 0
upper = n

for i, bit in enumerate(voted_bits):
    mid = (lower + upper) // 2
    if bit == 0:
        upper = mid
    else:
        lower = mid

    c = (c * power_mod(2, e, n)) % n

    if i < 5 or i >= len(voted_bits) - 3:
        print(f"Step {i+1}: bit={bit}, lower={lower}, upper={upper}")

m = (lower + upper) // 2
print(f"\\nRecovered message: m = {m}")

# Verify
v = power_mod(m, e, n)
print(f"Verification: m^e mod n = {v}")
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
  },
];
