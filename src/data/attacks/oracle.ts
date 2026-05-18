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
print(f"n = {n}")
print(f"e = {e}")
print(f"c = {c}")
print(f"Oracle responses: {len(oracle_bits)}")
print()

# Interval narrowing via padding oracle
# Simplified implementation: binary search on message space
# In the real attack, intervals [a, b] are narrowed using
# the structure of PKCS#1 v1.5 padding

# The ciphertext c encrypts m with PKCS#1 v1.5 padding:
# EM = 0x00 || 0x02 || PS || 0x00 || M
# where PS is non-zero padding bytes

# For each oracle response, we narrow the interval containing m
# by multiplying c by s^e mod n for chosen s

lower = 0
upper = n

for i, response in enumerate(oracle_bits):
    mid = (lower + upper) // 2
    if response == 1:
        # Valid padding: m is in upper portion of current interval
        lower = mid
    else:
        # Invalid padding: m is in lower portion
        upper = mid

    # In full attack: multiply by s^e for next query
    # s = 2 for standard binary search
    c = (c * power_mod(2, e, n)) % n

    if i < 5 or i >= len(oracle_bits) - 3:
        print(f"Step {i+1}: response={response}, lower={lower}, upper={upper}")

m = (lower + upper) // 2
print(f"\\nRecovered message: m = {m}")

# Verify
v = power_mod(m, e, n)
print(f"Verification: m^e mod n = {v}")
`,
    proof: `\\textbf{Theorem: (Bleichenbacher, 1998)} Given an oracle that reveals whether a ciphertext decrypts to a valid PKCS#1 v1.5 padded message, any ciphertext can be decrypted using approximately 2^{17} oracle queries.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item PKCS#1 v1.5 padding: EM = 0x00 || 0x02 || PS || 0x00 || M
\\item Oracle: \\mathcal{O}(c) = 1 if decryption has valid padding, 0 otherwise
\\item RSA multiplicative property: (c \\cdot s^e)^d \\equiv m \\cdot s \\pmod{n}
\\item Interval arithmetic for narrowing possible values of m
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } c &= m^e \\bmod n \\text{ be the target ciphertext.} \\\\
\\text{The oracle tells us whether } c^d \\bmod n &\\text{ has valid PKCS#1 v1.5 padding.} \\\\
\\text{Key idea: multiply } c \\text{ by } s^e \\bmod n \\text{ for chosen } s. & \\\\
\\text{Then } (c \\cdot s^e)^d &\\equiv m \\cdot s \\pmod{n}. \\\\
\\text{The oracle response on } c \\cdot s^e \\text{ reveals whether } m \\cdot s &\\bmod n \\text{ has valid padding.} \\\\
\\text{Valid padding requires: } 2B &\\leq m \\cdot s \\bmod n < 3B \\\\
\\text{where } B = 2^{8(k-1)} \\text{ for k-byte modulus.} & \\\\
\\text{This constrains } m \\text{ to an interval } [a, b]. & \\\\
\\text{By choosing different } s \\text{ values, we narrow the interval:} & \\\\
\\text{Step 1: Find } s_1 \\text{ such that } \\mathcal{O}(c \\cdot s_1^e) = 1. & \\\\
\\text{Step 2: Find next valid interval using binary search on } s. & \\\\
\\text{Step 3: Repeat until interval size = 1, revealing } m. & \\\\
\\text{Expected queries: } O(2^{17}) \\text{ for 1024-bit RSA.} & \\qed
\\end{align*}

\\textbf{References:} D. Bleichenbacher, "Chosen Ciphertext Attacks Against Protocols Based on the RSA Encryption Standard PKCS #1", CRYPTO 1998; Bardou et al., "The Million Message Attack Revisited", 2012`,
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
print(f"n = {n}")
print(f"e = {e}")
print(f"c = {c}")
print(f"Oracle responses: {len(oracle_bits)}")
print()

# Binary search via OAEP oracle
# OAEP padding: EM = 0x00 || maskedSeed || maskedDB
# Oracle reveals whether first byte is 0x00 after decryption

# Similar to Bleichenbacher but adapted for OAEP structure
# The oracle checks if the decrypted message starts with 0x00

lower = 0
upper = n

for i, response in enumerate(oracle_bits):
    mid = (lower + upper) // 2
    if response == 1:
        # First byte is 0x00: m < n / 256
        upper = mid
    else:
        # First byte is not 0x00
        lower = mid

    # Multiply by s^e for next iteration
    c = (c * power_mod(2, e, n)) % n

    if i < 5 or i >= len(oracle_bits) - 3:
        print(f"Step {i+1}: response={response}, lower={lower}, upper={upper}")

m = (lower + upper) // 2
print(f"\\nRecovered message: m = {m}")

# Verify
v = power_mod(m, e, n)
print(f"Verification: m^e mod n = {v}")
`,
    proof: `\\textbf{Theorem: (Manger, 2001)} Given an oracle that reveals whether the first byte of RSA-OAEP decryption is zero, any ciphertext can be decrypted using O(\\log n) oracle queries.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA-OAEP padding: EM = 0x00 || maskedSeed || maskedDB
\\item Oracle: \\mathcal{O}(c) = 1 if first byte of c^d \\bmod n is 0x00
\\item RSA multiplicative property
\\item Binary search on the message space
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } c &= m^e \\bmod n \\text{ be the target ciphertext.} \\\\
\\text{OAEP requires the first byte of EM to be } 0x00. & \\\\
\\text{The oracle reveals whether } c^d \\bmod n < n/256. & \\\\
\\text{Multiply } c \\text{ by } s^e \\bmod n: \\quad (c \\cdot s^e)^d &\\equiv m \\cdot s \\pmod{n}. \\\\
\\text{The oracle on } c \\cdot s^e \\text{ reveals whether } m \\cdot s &\\bmod n < n/256. \\\\
\\text{This constrains } m \\text{ to an interval of size } n/(256 \\cdot s). & \\\\
\\text{By binary search on } s, \\text{ we narrow the interval:} & \\\\
\\text{Step 1: Find } s_1 \\text{ such that } m \\cdot s_1 &\\bmod n < n/256. \\\\
\\text{Step 2: This gives } m \\in [0, n/(256 \\cdot s_1)) \\cup \\cdots & \\\\
\\text{Step 3: Repeat with different } s \\text{ to narrow further.} & \\\\
\\text{After } O(\\log n) \\text{ queries, the interval size is 1.} & \\\\
\\text{Total queries: } \\lceil \\log_2 n \\rceil + 8. & \\qed
\\end{align*}

\\textbf{References:} J. Manger, "A Chosen Ciphertext Attack on RSA Optimal Asymmetric Encryption Padding (OAEP) as Standardized in PKCS #1 v2.0", CRYPTO 2001; RFC 8017, Section 4`,
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
    proof: `\\textbf{Theorem:} Given an LSB oracle with bias p > 1/2 (correct with probability p), the message m can be recovered with high probability using majority voting across multiple independent runs, followed by binary search.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Noisy LSB oracle: \\mathcal{O}(c) = \\text{LSB}(c^d \\bmod n) with probability p > 1/2
\\item Multiple independent oracle runs available
\\item Majority voting reduces error exponentially in number of runs
\\item Binary search on interval [0, n)
\\item Chernoff bound for error probability analysis
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } \\mathcal{O}_j(c) \\text{ be the } j\\text{-th oracle run on ciphertext } c. & \\\\
\\text{Each run gives } \\text{LSB}(c^d \\bmod n) \\text{ with probability } p > 1/2. & \\\\
\\text{For bit position } i, \\text{ collect } k \\text{ independent responses:} & \\\\
b_{i,1}, b_{i,2}, \\ldots, b_{i,k} &\\in \\{0, 1\\}. \\\\
\\text{Majority vote: } \\hat{b}_i = \\text{mode}(b_{i,1}, \\ldots, b_{i,k}). & \\\\
\\text{By Chernoff bound: } \\Pr[\\hat{b}_i \\neq \\text{LSB}_i] &\\leq e^{-2k(p - 1/2)^2}. \\\\
\\text{For } k = O(\\log n / (p - 1/2)^2), \\text{ error per bit is } O(1/n). & \\\\
\\text{After majority voting, apply binary search:} & \\\\
\\text{Start: } m \\in [0, n). & \\\\
\\text{Each voted bit halves the interval.} & \\\\
\\text{After } \\log_2 n \\text{ bits, interval size is 1.} & \\\\
\\text{Total error probability: } O(\\log n \\cdot e^{-2k(p - 1/2)^2}). & \\qed
\\end{align*}

\\textbf{References:} Goldwasser, Micali, "Probabilistic Encryption", 1982; Håstad et al., "Bit Security of RSA", 1989`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_runs,
  },
];
