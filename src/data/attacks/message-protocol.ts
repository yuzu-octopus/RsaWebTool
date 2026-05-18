import type { Attack } from '../../types';

export const messageProtocolAttacks: Attack[] = [
  {
    id: 'common-modulus',
    name: 'Common Modulus Attack',
    category: 'Message / Protocol',
    description: 'Same message encrypted under same n with different coprime exponents. Uses Bezout identity.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e1', label: 'e1 (first exponent)', placeholder: 'Enter first exponent e1...', multiline: true, rows: 3 },
      { name: 'e2', label: 'e2 (second exponent)', placeholder: 'Enter second exponent e2...', multiline: true, rows: 3 },
      { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
      { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e1 = Integer(${vals.e1})
e2 = Integer(${vals.e2})
c1 = Integer(${vals.c1})
c2 = Integer(${vals.c2})

# Extended GCD to find a, b such that a*e1 + b*e2 = gcd(e1, e2) = 1
g, a, b = xgcd(e1, e2)
print(f"Bezout coefficients: a = {a}, b = {b}")
print(f"Verification: a*e1 + b*e2 = {a*e1 + b*e2}")

# Compute m = c1^a * c2^b mod n
if a >= 0:
    part1 = power_mod(c1, a, n)
else:
    c1_inv = power_mod(c1, -1, n)
    part1 = power_mod(c1_inv, -a, n)

if b >= 0:
    part2 = power_mod(c2, b, n)
else:
    c2_inv = power_mod(c2, -1, n)
    part2 = power_mod(c2_inv, -b, n)

m = (part1 * part2) % n
print(f"Recovered message: m = {m}")

# Verify
v1 = power_mod(m, e1, n)
v2 = power_mod(m, e2, n)
print(f"Verification: m^e1 mod n = {v1} (should equal c1 = {c1})")
print(f"Verification: m^e2 mod n = {v2} (should equal c2 = {c2})")
`,
    proof: `\\textbf{Theorem:} Let n be an RSA modulus and let e_1, e_2 be coprime public exponents. If the same message m is encrypted as c_1 \\equiv m^{e_1} \\pmod{n} and c_2 \\equiv m^{e_2} \\pmod{n}, then m can be recovered without factoring n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item \\gcd(e_1, e_2) = 1 (coprime exponents)
\\item Extended Euclidean algorithm (Bezout's identity)
\\item Same message m encrypted under both exponents
\\item m \\in \\mathbb{Z}_n^*
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Since } \\gcd(e_1, e_2) = 1, \\text{ by Bezout's identity } \\exists a, b \\in \\mathbb{Z} &: \\\\
a \\cdot e_1 + b \\cdot e_2 &= 1 \\\\
\\text{Compute: } c_1^a \\cdot c_2^b &\\equiv (m^{e_1})^a \\cdot (m^{e_2})^b \\pmod{n} \\\\
&\\equiv m^{a \\cdot e_1 + b \\cdot e_2} \\pmod{n} \\\\
&\\equiv m^1 \\equiv m \\pmod{n} \\\\
\\text{If } a < 0, \\text{ compute } c_1^{-1} \\pmod{n} \\text{ and use } |a|. & \\\\
\\text{Similarly for } b < 0. & \\\\
\\text{Thus } m = c_1^a \\cdot c_2^b \\pmod{n}. & \\qed
\\end{align*}

\\textbf{References:} Simmons & Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", 1977; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e1 && !!p.e2 && !!p.c1 && !!p.c2,
  },
  {
    id: 'hastad',
    name: "Hastad's Broadcast Attack",
    category: 'Message / Protocol',
    description: 'Same plaintext encrypted with e different keys and small exponent e. CRT recovers m^e.',
    inputs: [
      { name: 'pairs', label: 'Pairs (n1,c1 per line)', placeholder: 'n1,c1\\nn2,c2\\nn3,c3...', multiline: true, rows: 5 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter exponent e (e.g., 3)...', multiline: false },
    ],
    sageTemplate: (vals: Record<string, string>) => `e = Integer(${vals.e})

# Parse pairs
pairs_str = """${vals.pairs}""".strip()
pairs = []
for line in pairs_str.split('\\n'):
    line = line.strip()
    if not line:
        continue
    parts = line.split(',')
    n_i = Integer(parts[0].strip())
    c_i = Integer(parts[1].strip())
    pairs.append((n_i, c_i))

print(f"Number of ciphertexts: {len(pairs)}")
print(f"Public exponent: e = {e}")

if len(pairs) < e:
    print(f"ERROR: Need at least {e} ciphertexts for e = {e}")
else:
    # Chinese Remainder Theorem
    moduli = [p[0] for p in pairs]
    remainders = [p[1] for p in pairs]

    print("Applying CRT...")
    m_e = crt(remainders, moduli)
    print(f"m^e = {m_e}")

    # Integer e-th root
    print(f"Computing integer {e}-th root...")
    m, exact = m_e.nth_root(e, truncate_mode=True)

    if exact:
        print(f"Recovered message: m = {m}")
        # Verify
        for i, (n_i, c_i) in enumerate(pairs):
            v = power_mod(m, e, n_i)
            print(f"  Verify {i+1}: m^e mod n{i+1} = {v} (c{i+1} = {c_i})")
    else:
        print(f"Approximate root: m = {m}")
        print("Warning: m^e was not a perfect e-th power. Message may be padded.")
`,
    proof: `\\textbf{Theorem: (Hastad, 1988)} Let m be a message encrypted with e different RSA public keys (n_i, e) using the same small exponent e. If e \\leq k (number of ciphertexts) and m^e < \\prod_{i=1}^{k} n_i, then m can be recovered by computing the integer e-th root of the CRT result.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Same message m encrypted: c_i \\equiv m^e \\pmod{n_i} for i = 1, \\ldots, k
\\item Same public exponent e for all keys (typically e = 3)
\\item Moduli n_i are pairwise coprime
\\item m^e < \\prod_{i=1}^{k} n_i (message not padded)
\\item Chinese Remainder Theorem
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Given } c_i &\\equiv m^e \\pmod{n_i} \\text{ for } i = 1, \\ldots, k \\\\
\\text{By CRT, } \\exists! C \\in \\mathbb{Z}_N \\text{ where } N = \\prod_{i=1}^{k} n_i &: \\\\
C &\\equiv c_i \\pmod{n_i} \\text{ for all } i \\\\
\\text{Since } c_i \\equiv m^e \\pmod{n_i}, \\text{ we have } C &\\equiv m^e \\pmod{N} \\\\
\\text{If } m^e < N, \\text{ then } C &= m^e \\text{ over } \\mathbb{Z} \\text{ (not just modulo)} \\\\
\\text{Compute integer } e\\text{-th root: } m &= \\sqrt[e]{C} \\\\
\\text{This recovers m exactly.} & \\\\
\\text{Requirement: } k \\geq e \\text{ ciphertexts to ensure } N > m^e. & \\qed
\\end{align*}

\\textbf{References:} J. Hastad, "Solving Linear Equations Modulo Divisors: On Factoring Given Any Bits", Eurocrypt 1988; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.pairs && !!p.e,
  },
  {
    id: 'franklin-reiter',
    name: 'Franklin-Reiter Related Message Attack',
    category: 'Message / Protocol',
    description: 'Two ciphertexts of algebraically related messages. Polynomial GCD over Zmod(n).',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
      { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
      { name: 'a', label: 'a (linear coefficient)', placeholder: '1', multiline: false, defaultValue: '1' },
      { name: 'b', label: 'b (constant offset)', placeholder: 'Enter offset b...', multiline: true, rows: 2 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
c1 = Integer(${vals.c1})
c2 = Integer(${vals.c2})
a = Integer(${vals.a})
b = Integer(${vals.b})

R.<x> = PolynomialRing(Zmod(n))

# f1(x) = x^e - c1
# f2(x) = (a*x + b)^e - c2
f1 = x^e - c1
f2 = (a*x + b)^e - c2

print(f"f1(x) = x^{e} - c1")
print(f"f2(x) = ({a}*x + {b})^{e} - c2")
print()

# Compute GCD
g = gcd(f1, f2)
print(f"GCD degree: {g.degree()}")

if g.degree() == 1:
    # g(x) = x - m, so m = -constant_term / leading_coefficient
    m = -g[0] / g[1]
    print(f"Recovered message: m = {m}")

    # Verify
    v1 = power_mod(Integer(m), e, n)
    v2 = power_mod(Integer(a * m + b), e, n)
    print(f"Verification: m^e mod n = {v1} (c1 = {c1})")
    print(f"Verification: (a*m+b)^e mod n = {v2} (c2 = {c2})")
else:
    print(f"GCD has degree {g.degree()}, cannot extract unique solution.")
    print(f"GCD: {g}")
`,
    proof: `\\textbf{Theorem: (Franklin & Reiter, 1996)} Let (n, e) be an RSA public key. Given c_1 \\equiv m^e \\pmod{n} and c_2 \\equiv (am + b)^e \\pmod{n} where a, b are known, the message m can be recovered in time O(e^2 \\log^2 n) by computing the GCD of two polynomials over \\mathbb{Z}/n\\mathbb{Z}.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Two ciphertexts of related messages: c_1 = m^e \\bmod n, c_2 = (am + b)^e \\bmod n
\\item Known linear relation f(m) = am + b between the messages
\\item Polynomial ring over \\mathbb{Z}/n\\mathbb{Z}
\\item Euclidean algorithm for polynomial GCD
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Define polynomials over } \\mathbb{Z}/n\\mathbb{Z}[x]: & \\\\
f_1(x) &= x^e - c_1 \\\\
f_2(x) &= (ax + b)^e - c_2 \\\\
\\text{Both } f_1 \\text{ and } f_2 \\text{ have } x = m \\text{ as a root:} & \\\\
f_1(m) &= m^e - c_1 \\equiv 0 \\pmod{n} \\\\
f_2(m) &= (am + b)^e - c_2 \\equiv 0 \\pmod{n} \\\\
\\text{Thus } (x - m) \\text{ divides } \\gcd(f_1, f_2). & \\\\
\\text{For generic } a, b, \\text{ the GCD is exactly } (x - m). & \\\\
\\text{Compute } g(x) = \\gcd(f_1, f_2) \\text{ via Euclidean algorithm.} & \\\\
\\text{If } \\deg(g) = 1, \\text{ then } g(x) = x - m, \\text{ so } m = -g[0]/g[1]. & \\qed
\\end{align*}

\\textbf{References:} M. Franklin & M. Reiter, "On the Security of RSA Padding", 1996; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c1 && !!p.c2,
  },
  {
    id: 'coppersmith-short-pad',
    name: 'Coppersmith Short Pad Attack',
    category: 'Message / Protocol',
    description: 'Same message encrypted twice with different random pads. Resultant + small_roots.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
      { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
c1 = Integer(${vals.c1})
c2 = Integer(${vals.c2})

R.<x, y> = PolynomialRing(Zmod(n))

# f(x, y) = (x + y)^e - c2  (c2 encrypts m + delta)
# g(x) = x^e - c1           (c1 encrypts m)
# We eliminate x using resultant

# f1(x) = x^e - c1
# f2(x) = (x + delta)^e - c2 where delta is unknown but small
# Resultant of f1 and f2 w.r.t. x gives polynomial in delta

f1 = x^e - c1
f2 = (x + y)^e - c2

# Compute resultant w.r.t. x
print("Computing resultant...")
res = f1.resultant(f2, x)
print(f"Resultant degree in y: {res.degree(y)}")

# Find small roots of resultant
# delta is typically small (short padding)
R2.<z> = PolynomialRing(Zmod(n))
res_z = res(z)

# Bound for short pad: typically < n^(1/e^2)
bound = ZZ(n^(1 / (e^2)))
print(f"Small root bound: {bound}")

roots = res_z.small_roots(X=bound, beta=0.5)
if roots:
    delta = roots[0]
    print(f"Found padding difference: delta = {delta}")

    # Now use Franklin-Reiter with a=1, b=delta
    f1_fr = x^e - c1
    f2_fr = (x + delta)^e - c2
    g = gcd(f1_fr, f2_fr)
    if g.degree() == 1:
        m = -g[0] / g[1]
        print(f"Recovered message: m = {m}")
    else:
        print(f"GCD has degree {g.degree()}, cannot extract unique solution.")
else:
    print("No small roots found. Padding may be too large.")
`,
    proof: `\\textbf{Theorem: (Coppersmith, 1997)} Let m be encrypted twice with RSA using the same public key (n, e) but with different random pads \\delta_1, \\delta_2. If |\\delta_1 - \\delta_2| < n^{1/e^2}, the message m can be recovered in polynomial time.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item c_1 \\equiv (m + \\delta_1)^e \\pmod{n} and c_2 \\equiv (m + \\delta_2)^e \\pmod{n}
\\item \\Delta = \\delta_2 - \\delta_1 is small (short padding)
\\item Resultant of polynomials to eliminate m
\\item Coppersmith's small_roots method
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Define: } f_1(x) &= x^e - c_1 \\equiv 0 \\pmod{n} \\\\
f_2(x) &= (x + \\Delta)^e - c_2 \\equiv 0 \\pmod{n} \\\\
\\text{where } x = m + \\delta_1 \\text{ and } \\Delta = \\delta_2 - \\delta_1. & \\\\
\\text{Compute resultant } r(\\Delta) = \\text{Res}_x(f_1, f_2) &\\equiv 0 \\pmod{n} \\\\
\\text{This eliminates } x \\text{ and gives a polynomial in } \\Delta. & \\\\
\\text{Since } \\Delta \\text{ is small, use Coppersmith's } small\\_roots &\\text{ to find } \\Delta. \\\\
\\text{Once } \\Delta \\text{ is known, apply Franklin-Reiter:} & \\\\
\\gcd(x^e - c_1, (x + \\Delta)^e - c_2) &= x - (m + \\delta_1) \\\\
\\text{Recover } m + \\delta_1, \\text{ then } m. & \\qed
\\end{align*}

\\textbf{References:} D. Coppersmith, "Small Solutions to Polynomial Equations and Low Exponent RSA Vulnerabilities", J. Cryptology, 1997; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c1 && !!p.c2,
  },
  {
    id: 'hastad-linear-pad',
    name: "Hastad's Attack with Linear Padding",
    category: 'Message / Protocol',
    description: 'Hastad extension with known affine transforms per recipient.',
    inputs: [
      { name: 'triples', label: 'Triples (n,c,a,b per line)', placeholder: 'n1,c1,a1,b1\\nn2,c2,a2,b2...', multiline: true, rows: 5 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter exponent e (e.g., 3)...', multiline: false },
    ],
    sageTemplate: (vals: Record<string, string>) => `e = Integer(${vals.e})

# Parse triples
triples_str = """${vals.triples}""".strip()
triples = []
for line in triples_str.split('\\n'):
    line = line.strip()
    if not line:
        continue
    parts = line.split(',')
    n_i = Integer(parts[0].strip())
    c_i = Integer(parts[1].strip())
    a_i = Integer(parts[2].strip())
    b_i = Integer(parts[3].strip())
    triples.append((n_i, c_i, a_i, b_i))

print(f"Number of ciphertexts: {len(triples)}")
print(f"Public exponent: e = {e}")

if len(triples) < e:
    print(f"ERROR: Need at least {e} ciphertexts for e = {e}")
else:
    # CRT with linear padding
    # c_i = (a_i * m + b_i)^e mod n_i
    # Need to find m using Coppersmith

    # First, compute N = product of all n_i
    N = prod([t[0] for t in triples])
    print(f"Combined modulus N has {N.nbits()} bits")

    # For each triple, we have (a_i * m + b_i)^e = c_i mod n_i
    # Use polynomial approach
    R.<x> = PolynomialRing(Zmod(N))

    # Build polynomial system and use CRT
    # For simplicity, use the approach:
    # Find C such that C = c_i mod n_i, then C = (a*m + b)^e mod N
    # This requires all a_i = 1, b_i = 0 for standard CRT

    # General approach: use Coppersmith on the system
    # For e = 3 with 3 triples, solve directly
    if e == 3 and len(triples) >= 3:
        # Use the specific construction for e=3
        n1, c1, a1, b1 = triples[0]
        n2, c2, a2, b2 = triples[1]
        n3, c3, a3, b3 = triples[2]

        # CRT on c_i values
        C = crt([c1, c2, c3], [n1, n2, n3])
        print(f"CRT result: C = {C}")

        # C = (a*m + b)^e mod N for some combined a, b
        # For a_i = 1, b_i = 0: C = m^e
        # Compute e-th root
        m, exact = C.nth_root(e, truncate_mode=True)
        if exact:
            print(f"Recovered message: m = {m}")
        else:
            print(f"Approximate root: m = {m}")
            print("Message may have padding. Try Coppersmith small_roots.")
    else:
        print("General case requires more complex polynomial solving.")
        print("Consider reducing to standard Hastad if a_i=1, b_i=0.")
`,
    proof: `\\textbf{Theorem: (Hastad, extended)} Let m be encrypted with e different RSA public keys where each ciphertext uses a known affine transform: c_i \\equiv (a_i m + b_i)^e \\pmod{n_i}. If e \\leq k and the transforms are known, m can be recovered.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item c_i \\equiv (a_i m + b_i)^e \\pmod{n_i} for i = 1, \\ldots, k
\\item Known coefficients a_i, b_i for each recipient
\\item e \\leq k (enough ciphertexts)
\\item Moduli n_i are pairwise coprime
\\item Chinese Remainder Theorem and Coppersmith's method
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Given } c_i &\\equiv (a_i m + b_i)^e \\pmod{n_i} \\\\
\\text{For } a_i = 1, b_i = 0, \\text{ this reduces to standard Hastad.} & \\\\
\\text{For general } a_i, b_i: \\text{ define } y_i &= a_i m + b_i \\\\
\\text{Then } c_i &\\equiv y_i^e \\pmod{n_i} \\\\
\\text{Apply CRT: } C &\\equiv c_i \\pmod{n_i} \\implies C = Y^e \\text{ over } \\mathbb{Z} \\\\
\\text{where } Y \\equiv y_i \\pmod{n_i}. & \\\\
\\text{Recover } Y = \\sqrt[e]{C}, \\text{ then solve the linear system:} & \\\\
Y &\\equiv a_i m + b_i \\pmod{n_i} \\\\
\\text{For multiple equations, recover } m \\text{ via CRT.} & \\qed
\\end{align*}

\\textbf{References:} J. Hastad, "Solving Linear Equations Modulo Divisors", Eurocrypt 1988; Coppersmith et al., "Cryptanalysis of RSA with Related Messages", 1996`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.triples && !!p.e,
  },
  {
    id: 'lsb-oracle',
    name: 'LSB Oracle Attack',
    category: 'Message / Protocol',
    description: 'Server leaks LSB of decrypted ciphertext. Binary search recovers m.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
      { name: 'oracle_responses', label: 'Oracle responses (comma-separated bits)', placeholder: '0,1,0,1,1,0,...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
c = Integer(${vals.c})

# Parse oracle responses
responses_str = """${vals.oracle_responses}""".strip()
oracle_bits = [int(x.strip()) for x in responses_str.split(',') if x.strip()]

print(f"Number of oracle responses: {len(oracle_bits)}")
print(f"Target ciphertext: c = {c}")

# Binary search on the message space
# LSB(c^d mod n) = 0 means m < n/2, LSB = 1 means m >= n/2
lower = 0
upper = n

for i, bit in enumerate(oracle_bits):
    mid = (lower + upper) // 2
    if bit == 0:
        # m is in lower half
        upper = mid
    else:
        # m is in upper half
        lower = mid

    # Multiply c by 2^e mod n for next iteration
    c = (c * power_mod(2, e, n)) % n

    if i < 5 or i >= len(oracle_bits) - 3:
        print(f"Step {i+1}: bit={bit}, lower={lower}, upper={upper}")

m = (lower + upper) // 2
print(f"\\nRecovered message: m = {m}")

# Verify
v = power_mod(m, e, n)
print(f"Verification: m^e mod n = {v}")
print(f"Original c = {c}")
`,
    proof: `\\textbf{Theorem: (Bit Security of RSA)} If an oracle reveals the least significant bit of RSA decryption, the entire message m can be recovered using O(\\log n) oracle queries via binary search.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Oracle: \\mathcal{O}(c) = \\text{LSB}(c^d \\bmod n) = c^d \\bmod 2
\\item RSA homomorphic property: (c_1 \\cdot c_2)^d \\equiv m_1 \\cdot m_2 \\pmod{n}
\\item Multiplication by 2^e in ciphertext space corresponds to doubling in plaintext
\\item Binary search on interval [0, n)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } m &= c^d \\bmod n. \\text{ We want to recover } m. \\\\
\\text{Query } \\mathcal{O}(c): \\text{ if LSB}(m) = 0, \\text{ then } m &\\text{ is even, so } m < n \\text{ (since } n \\text{ is odd)} \\\\
\\text{if LSB}(m) = 1, \\text{ then } m &\\text{ is odd.} \\\\
\\text{Key insight: } \\mathcal{O}(c \\cdot 2^e \\bmod n) &= \\text{LSB}((2m) \\bmod n) \\\\
\\text{If } 2m < n, \\text{ then } (2m) \\bmod n = 2m &\\text{ (even, LSB = 0)} \\\\
\\text{If } 2m \\geq n, \\text{ then } (2m) \\bmod n = 2m - n &\\text{ (odd, LSB = 1)} \\\\
\\text{Each query halves the interval containing } m: & \\\\
\\text{Start: } m \\in [0, n) & \\\\
\\text{After query } i: m \\in [\\ell_i, u_i) &\\text{ where } u_i - \\ell_i = n/2^i \\\\
\\text{After } \\log_2 n \\text{ queries, the interval has size 1,} & \\\\
\\text{uniquely determining } m. & \\qed
\\end{align*}

\\textbf{References:} Goldwasser, Micali, "Probabilistic Encryption", 1982; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
  },
  {
    id: 'rsa-crt-fault',
    name: 'RSA-CRT Fault Attack (Bellcore)',
    category: 'Message / Protocol',
    description: 'Single faulty CRT signature reveals factorization via GCD.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'm', label: 'm (message)', placeholder: 'Enter message m...', multiline: true, rows: 3 },
      { name: 'sig_valid', label: 'Valid signature', placeholder: 'Enter valid signature...', multiline: true, rows: 3 },
      { name: 'sig_faulty', label: 'Faulty signature', placeholder: 'Enter faulty signature...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
m = Integer(${vals.m})
sig_valid = Integer(${vals.sig_valid})
sig_faulty = Integer(${vals.sig_faulty})

print(f"RSA-CRT Fault Attack (Bellcore Attack)")
print(f"n = {n}")
print()

# Verify the valid signature
v_valid = power_mod(sig_valid, e, n)
print(f"Valid signature verification: sig_valid^e mod n = {v_valid}")
print(f"Expected (m): {m}")
print(f"Valid: {v_valid == m}")
print()

# The faulty signature is correct mod one prime but wrong mod the other
# gcd(sig_faulty^e - m, n) reveals one factor

sig_faulty_e = power_mod(sig_faulty, e, n)
print(f"Faulty signature verification: sig_faulty^e mod n = {sig_faulty_e}")
print()

# Compute GCD
g = gcd(sig_faulty_e - m, n)
print(f"gcd(sig_faulty^e - m, n) = {g}")

if 1 < g < n:
    p = g
    q = n // g
    print(f"\\nFactorization found!")
    print(f"p = {p}")
    print(f"q = {q}")
    print(f"Verification: p * q = {p * q}")
    print(f"p is prime: {p.is_prime()}")
    print(f"q is prime: {q.is_prime()}")

    # Compute private key
    phi = (p - 1) * (q - 1)
    d = power_mod(e, -1, phi)
    print(f"\\nPrivate exponent: d = {d}")

    # Verify with valid signature
    sig_recovered = power_mod(m, d, n)
    print(f"Recovered signature: {sig_recovered}")
    print(f"Matches valid signature: {sig_recovered == sig_valid}")
else:
    print("GCD did not reveal a factor. The fault may not be a CRT fault.")
`,
    proof: `\\textbf{Theorem: (Bellcore, 1997)} A single faulty RSA-CRT signature on a known message is sufficient to factor the modulus n = pq. If s' is the faulty signature, then \\gcd(s'^e - m, n) reveals one of the prime factors.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA-CRT: signature computed as s_p = m^d \\bmod p, s_q = m^d \\bmod q
\\item Fault occurs in one component (say s_q is computed incorrectly as s_q')
\\item Final signature s' reconstructed via CRT from (s_p, s_q')
\\item s' \\equiv s \\pmod{p} but s' \\not\\equiv s \\pmod{q}
\\item Known message m (or can be recovered from valid signature)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Correct signature: } s &\\equiv m^d \\pmod{n} \\\\
\\text{Faulty signature: } s' &\\equiv s \\pmod{p} \\text{ (correct mod p)} \\\\
s' &\\not\\equiv s \\pmod{q} \\text{ (faulty mod q)} \\\\
\\text{Then } s'^e &\\equiv s^e \\equiv m \\pmod{p} \\\\
s'^e &\\not\\equiv m \\pmod{q} \\\\
\\text{Thus } p | (s'^e - m) \\text{ but } q &\\nmid (s'^e - m) \\\\
\\gcd(s'^e - m, n) &= p \\\\
\\text{Recover } q = n/p. &\\text{ Full factorization achieved with one fault.} \\qed
\\end{align*}

\\textbf{References:} Boneh, DeMillo, Lipton, "On the Importance of Checking Cryptographic Protocols for Faults", Eurocrypt 1997; Joye, "Fault Injection Attacks on CRT-RSA", 2012`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.sig_valid && !!p.sig_faulty,
  },
  {
    id: 'non-coprime-exp',
    name: 'Non-Coprime Exponent Attack',
    category: 'Message / Protocol',
    description: 'When gcd(e, φ(n)) > 1. Multiple plaintexts map to same ciphertext.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
      { name: 'p', label: 'p (prime factor)', placeholder: 'Enter prime factor p...', multiline: true, rows: 3 },
      { name: 'q', label: 'q (prime factor)', placeholder: 'Enter prime factor q...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
c = Integer(${vals.c})
p = Integer(${vals.p})
q = Integer(${vals.q})

print(f"Non-Coprime Exponent Attack")
print(f"n = {n}, e = {e}")
print(f"p = {p}, q = {q}")
print()

phi = (p - 1) * (q - 1)
g = gcd(e, phi)
print(f"gcd(e, phi(n)) = gcd({e}, {phi}) = {g}")

if g == 1:
    print("gcd(e, phi) = 1. Standard RSA applies. Use extended Euclidean algorithm.")
    d = power_mod(e, -1, phi)
    m = power_mod(c, d, n)
    print(f"Private exponent: d = {d}")
    print(f"Recovered message: m = {m}")
else:
    print(f"gcd(e, phi) = {g} > 1. Multiple plaintexts map to same ciphertext.")
    print(f"Number of preimages: {g}")
    print()

    # Find e-th roots mod p and mod q
    # mod p
    gp = gcd(e, p - 1)
    print(f"gcd(e, p-1) = {gp}")
    roots_p = []
    if gp == 1:
        dp = power_mod(e, -1, p - 1)
        mp = power_mod(c, dp, p)
        roots_p = [mp]
    else:
        # Find all e-th roots mod p
        Fp = GF(p)
        cp = Fp(c)
        roots_p = [r for r in Fp if r^e == cp]
    print(f"e-th roots mod p: {roots_p}")

    # mod q
    gq = gcd(e, q - 1)
    print(f"gcd(e, q-1) = {gq}")
    roots_q = []
    if gq == 1:
        dq = power_mod(e, -1, q - 1)
        mq = power_mod(c, dq, q)
        roots_q = [mq]
    else:
        Fq = GF(q)
        cq = Fq(c)
        roots_q = [r for r in Fq if r^e == cq]
    print(f"e-th roots mod q: {roots_q}")

    # CRT combine all pairs
    print(f"\\nAll possible plaintexts ({len(roots_p) * len(roots_q)} total):")
    for rp in roots_p:
        for rq in roots_q:
            m = crt([Integer(rp), Integer(rq)], [p, q])
            print(f"  m = {m}")
            # Verify
            v = power_mod(m, e, n)
            print(f"    m^e mod n = {v} (c = {c})")
`,
    proof: `\\textbf{Theorem:} When \\gcd(e, \\varphi(n)) = g > 1, the RSA encryption function x \\mapsto x^e \\bmod n is not injective. Each ciphertext has exactly g preimages, which can be found by computing e-th roots modulo p and q separately.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq with known factorization
\\item \\gcd(e, \\varphi(n)) = g > 1
\\item Structure of (\\mathbb{Z}/n\\mathbb{Z})^* \\cong (\\mathbb{Z}/p\\mathbb{Z})^* \\times (\\mathbb{Z}/q\\mathbb{Z})^*
\\item e-th roots in finite fields
\\item Chinese Remainder Theorem
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } g_p = \\gcd(e, p-1), \\quad g_q &= \\gcd(e, q-1) \\\\
\\text{In } \\mathbb{F}_p^*, \\text{ the map } x \\mapsto x^e \\text{ has } g_p &\\text{-to-1 mapping} \\\\
\\text{In } \\mathbb{F}_q^*, \\text{ the map } x \\mapsto x^e \\text{ has } g_q &\\text{-to-1 mapping} \\\\
\\text{By CRT, total preimages: } g_p \\cdot g_q &= \\gcd(e, \\varphi(n)) = g \\\\
\\text{Algorithm:} & \\\\
1. \\text{ Find all } e\\text{-th roots of } c \\bmod p &: \\{r_{p,1}, \\ldots, r_{p,g_p}\\} \\\\
2. \\text{ Find all } e\\text{-th roots of } c \\bmod q &: \\{r_{q,1}, \\ldots, r_{q,g_q}\\} \\\\
3. \\text{ CRT combine each pair } (r_{p,i}, r_{q,j}) &\\text{ to get } m_{i,j} \\\\
4. \\text{ All } g \\text{ values satisfy } m_{i,j}^e &\\equiv c \\pmod{n} \\qed
\\end{align*}

\\textbf{References:} Williams, "Modification of the RSA Public-Key Encryption Procedure", 1980; May, "New RSA Vulnerabilities Using Lattice Reduction Methods", 2003`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.p && !!p.q,
  },
  {
    id: 'cube-root-crt',
    name: 'Cube Root CRT Attack',
    category: 'Message / Protocol',
    description: 'When e=3 and gcd(3,φ(n))=3. Find cube roots in each CRT component.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
      { name: 'p', label: 'p (prime factor)', placeholder: 'Enter prime factor p...', multiline: true, rows: 3 },
      { name: 'q', label: 'q (prime factor)', placeholder: 'Enter prime factor q...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
c = Integer(${vals.c})
p = Integer(${vals.p})
q = Integer(${vals.q})

print(f"Cube Root CRT Attack (e = 3)")
print(f"n = {n}")
print(f"p = {p}, q = {q}")
print()

# Check conditions
phi = (p - 1) * (q - 1)
g = gcd(3, phi)
print(f"gcd(3, phi(n)) = {g}")

if g != 3:
    print("WARNING: gcd(3, phi) != 3. Standard cube root may apply.")

# Cube roots mod p
print(f"\\nFinding cube roots mod p...")
Fp = GF(p)
cp = Fp(c)
roots_p = [r for r in Fp if r^3 == cp]
print(f"Cube roots mod p: {[Integer(r) for r in roots_p]}")

# Cube roots mod q
print(f"Finding cube roots mod q...")
Fq = GF(q)
cq = Fq(c)
roots_q = [r for r in Fq if r^3 == cq]
print(f"Cube roots mod q: {[Integer(r) for r in roots_q]}")

# CRT combine
print(f"\\nAll possible plaintexts ({len(roots_p) * len(roots_q)} total):")
for rp in roots_p:
    for rq in roots_q:
        m = crt([Integer(rp), Integer(rq)], [p, q])
        print(f"  m = {m}")
        v = power_mod(m, 3, n)
        print(f"    m^3 mod n = {v} (c = {c})")

if len(roots_p) * len(roots_q) == 1:
    print("\\nUnique solution found!")
elif len(roots_p) * len(roots_q) == 9:
    print("\\n9 solutions (3 mod p × 3 mod q). Additional context needed to identify correct m.")
`,
    proof: `\\textbf{Theorem:} When e = 3 and \\gcd(3, \\varphi(n)) = 3, the cubic map x \\mapsto x^3 \\bmod n has exactly 9 preimages. These are found by computing cube roots in \\mathbb{F}_p and \\mathbb{F}_q separately and combining via CRT.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item e = 3 and p \\equiv q \\equiv 1 \\pmod{3} (so 3 | (p-1) and 3 | (q-1))
\\item n = pq with known factorization
\\item Cube roots in finite fields \\mathbb{F}_p, \\mathbb{F}_q
\\item Each field has exactly 3 cube roots when p \\equiv 1 \\pmod{3}
\\item Chinese Remainder Theorem
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Since } p \\equiv 1 \\pmod{3}, \\text{ the group } \\mathbb{F}_p^* &\\text{ has order } p-1 \\text{ divisible by 3.} \\\\
\\text{The map } x \\mapsto x^3 \\text{ in } \\mathbb{F}_p^* \\text{ is 3-to-1.} & \\\\
\\text{Similarly for } \\mathbb{F}_q^*. & \\\\
\\text{Given } c, \\text{ find cube roots:} & \\\\
\\{r_{p,1}, r_{p,2}, r_{p,3}\\} &= \\{x \\in \\mathbb{F}_p : x^3 = c\\} \\\\
\\{r_{q,1}, r_{q,2}, r_{q,3}\\} &= \\{x \\in \\mathbb{F}_q : x^3 = c\\} \\\\
\\text{By CRT, each pair } (r_{p,i}, r_{q,j}) &\\text{ gives a unique } m_{i,j} \\bmod n \\\\
\\text{Total: } 3 \\times 3 = 9 \\text{ solutions.} & \\\\
\\text{In practice, additional constraints (padding, format) identify the correct } m. & \\qed
\\end{align*}

\\textbf{References:} Williams, "Modification of the RSA Public-Key Encryption Procedure", 1980; Rabin, "Digitalized Signatures and Public-Key Functions as Intractable as Factorization", 1979`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.c && !!p.p && !!p.q,
  },
  {
    id: 'common-factor',
    name: 'Common Factor Attack',
    category: 'Message / Protocol',
    description: 'If gcd(c, n) > 1, message was a multiple of a prime factor.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
c = Integer(${vals.c})

print(f"Common Factor Attack")
print(f"n = {n}")
print(f"c = {c}")
print()

g = gcd(c, n)
print(f"gcd(c, n) = {g}")

if g == 1:
    print("gcd(c, n) = 1. No common factor. Message is not a multiple of p or q.")
    print("This attack does not apply.")
elif g == n:
    print("gcd(c, n) = n. c is a multiple of n (c = 0 mod n).")
    print("The message m was 0 or a multiple of n.")
else:
    p = g
    q = n // g
    print(f"\\nCommon factor found!")
    print(f"p = {p}")
    print(f"q = {q}")
    print(f"Verification: p * q = {p * q}")
    print(f"p is prime: {p.is_prime()}")
    print(f"q is prime: {q.is_prime()}")

    # The message m was a multiple of p (or q)
    # m = k * p for some k
    # c = m^e mod n = (k*p)^e mod n
    # Since p | m, we have m = 0 mod p
    print(f"\\nThe message m is a multiple of p = {p}")
    print(f"m = k * {p} for some integer k")

    # If we know e, we can try to recover k
    # c = (k*p)^e mod (p*q)
    # c/p^e = k^e mod q (if p^e | c)
    # This requires knowing e
`,
    proof: `\\textbf{Theorem:} If \\gcd(c, n) > 1 where c = m^e \\bmod n, then the message m shares a common factor with n. This immediately reveals the factorization of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq is an RSA modulus
\\item c \\equiv m^e \\pmod{n}
\\item \\gcd(m, n) > 1 (message is a multiple of p or q)
\\item Euclidean algorithm for GCD computation
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{If } p | m, \\text{ then } m &\\equiv 0 \\pmod{p} \\\\
c = m^e &\\equiv 0^e \\equiv 0 \\pmod{p} \\\\
\\text{Thus } p | c. \\text{ Since also } p | n, & \\\\
p | \\gcd(c, n). & \\\\
\\text{If } \\gcd(c, n) < n, \\text{ then } \\gcd(c, n) &= p \\text{ (or } q\\text{).} \\\\
\\text{Recover the other factor: } q &= n / \\gcd(c, n). \\\\
\\text{This is a degenerate case: the message should never be} & \\\\
\\text{a multiple of a prime factor in proper RSA usage.} & \\qed
\\end{align*}

\\textbf{References:} Menezes et al., "Handbook of Applied Cryptography", Section 8.2.2; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.c,
  },
  {
    id: 'homomorphic-forgery',
    name: 'Homomorphic Forgery Attack',
    category: 'Message / Protocol',
    description: 'Textbook RSA is multiplicatively homomorphic. Forge signatures by factoring target.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
      { name: 'target_m', label: 'Target message to forge', placeholder: 'Enter target message...', multiline: true, rows: 3 },
      { name: 'oracle_pairs', label: 'Oracle pairs (m,s semicolon-separated)', placeholder: 'm1,s1;m2,s2;m3,s3...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})
target_m = Integer(${vals.target_m})

# Parse oracle pairs
pairs_str = """${vals.oracle_pairs}""".strip()
oracle_pairs = []
for pair in pairs_str.split(';'):
    pair = pair.strip()
    if not pair:
        continue
    parts = pair.split(',')
    m_i = Integer(parts[0].strip())
    s_i = Integer(parts[1].strip())
    oracle_pairs.append((m_i, s_i))

print(f"Homomorphic Forgery Attack")
print(f"Target message: {target_m}")
print(f"Oracle pairs: {len(oracle_pairs)}")
print()

# Verify oracle pairs
print("Verifying oracle pairs:")
for i, (m_i, s_i) in enumerate(oracle_pairs):
    v = power_mod(s_i, e, n)
    valid = "✓" if v == m_i else "✗"
    print(f"  Pair {i+1}: s_i^e mod n = {v}, m_i = {m_i} {valid}")
print()

# Try to factor target_m into oracle messages
# target_m = m_1 * m_2 * ... * m_k (mod n)
# Then sig = s_1 * s_2 * ... * s_k (mod n)

# Simple approach: try all subsets
from itertools import combinations

found = False
for r in range(1, len(oracle_pairs) + 1):
    for combo in combinations(range(len(oracle_pairs)), r):
        product_m = 1
        product_s = 1
        for idx in combo:
            m_i, s_i = oracle_pairs[idx]
            product_m = (product_m * m_i) % n
            product_s = (product_s * s_i) % n

        if product_m == target_m % n:
            print(f"Found factorization using pairs: {[i+1 for i in combo]}")
            print(f"Product of messages: {product_m}")
            print(f"Forged signature: {product_s}")

            # Verify
            v = power_mod(product_s, e, n)
            print(f"Verification: sig^e mod n = {v}")
            print(f"Target message: {target_m % n}")
            print(f"Valid: {v == target_m % n}")
            found = True
            break
    if found:
        break

if not found:
    print("Could not factor target_m from oracle pairs using simple multiplication.")
    print("Try more complex factorizations or additional oracle queries.")
`,
    proof: `\\textbf{Theorem:} Textbook RSA signatures are multiplicatively homomorphic: if s_1 = m_1^d \\bmod n and s_2 = m_2^d \\bmod n, then s_1 \\cdot s_2 \\bmod n is a valid signature for m_1 \\cdot m_2 \\bmod n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Textbook RSA (no padding): s = m^d \\bmod n
\\item Verification: s^e \\equiv m \\pmod{n}
\\item Multiplicative homomorphism: (m_1 \\cdot m_2)^d \\equiv m_1^d \\cdot m_2^d \\pmod{n}
\\item Oracle providing signatures on chosen messages
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Given: } s_1 &= m_1^d \\bmod n, \\quad s_2 = m_2^d \\bmod n \\\\
\\text{Compute: } s &= s_1 \\cdot s_2 \\bmod n \\\\
\\text{Verify: } s^e &= (s_1 \\cdot s_2)^e \\bmod n \\\\
&= s_1^e \\cdot s_2^e \\bmod n \\\\
&= m_1 \\cdot m_2 \\bmod n \\\\
\\text{Thus } s \\text{ is a valid signature for } m_1 \\cdot m_2. & \\\\
\\text{To forge a signature on } m^*: & \\\\
1. \\text{ Factor } m^* = m_1 \\cdot m_2 \\cdots m_k \\pmod{n} & \\\\
2. \\text{ Query oracle for } s_i = m_i^d \\bmod n & \\\\
3. \\text{ Compute } s^* = \\prod_{i=1}^{k} s_i \\bmod n & \\\\
4. \\text{ Then } (s^*)^e &= m^* \\bmod n \\qed
\\end{align*}

\\textbf{References:} Rivest, Shamir, Adleman, "A Method for Obtaining Digital Signatures", 1978; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.target_m && !!p.oracle_pairs,
  },
  {
    id: 'bleichenbacher-sig',
    name: 'Bleichenbacher Signature Forgery (e=3)',
    category: 'Message / Protocol',
    description: 'Forge PKCS#1 v1.5 signatures with e=3 via cube root of crafted value.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'hash_hex', label: 'Hash (hex)', placeholder: 'Enter hash in hex (e.g., SHA256)...', multiline: false },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
hash_hex = "${vals.hash_hex}".strip()
hash_val = Integer("0x" + hash_hex)

print(f"Bleichenbacher Signature Forgery (e = 3)")
print(f"n = {n} ({n.nbits()} bits)")
print(f"Hash: {hash_hex}")
print(f"Hash value: {hash_val}")
print()

# PKCS#1 v1.5 signature format:
# 0x00 || 0x01 || PS || 0x00 || DER(HASH) || HASH
# PS = 0xFF bytes (padding)

# For e = 3, we can forge by computing cube root of a crafted value
# The key insight: if we can make the signature S such that S^3 mod n
# has the right format, the verification will pass

# Simplified approach: construct EM (encoded message) and take cube root
# EM = 0x0001 || FF...FF || 0x00 || DER || hash

# For the attack, we construct:
# S = round(n^(1/3)) + adjustment
# such that S^3 mod n has the correct format

# Step 1: compute approximate cube root of n
n_cbrt = ZZ(n^(1/3))
print(f"Cube root of n: {n_cbrt}")

# Step 2: construct the target format
# The signature S should satisfy: S^3 = 0x00 || 0x01 || ... || hash (mod n)
# For large n, S^3 < n, so S^3 mod n = S^3 (exact cube root)

# Construct EM with hash at the rightmost position
# EM = 0x0001FFFF...00[DER][hash]
# For simplicity, we construct a value that when cubed gives the right format

# The attack: find S such that S^3 has the PKCS#1 format
# S ≈ n^(1/3), adjust to get correct hash at the end

# This is a simplified demonstration
# Full attack requires careful construction of the padding

# For e=3, the signature is approximately n^(1/3)
# We need S^3 to end with the hash value

# Use Coppersmith-like approach:
# S = a * 2^k + b where b encodes the hash
# Find a such that S^3 has the right format

k = hash_val.nbits()
print(f"Hash bit length: {k}")

# Simplified: just show the cube root approach
# In practice, the full attack is more complex
print("\\nThis attack requires careful construction of the PKCS#1 padding.")
print("The key idea: for e=3, compute S = ∛(EM) where EM has the right format.")
print("\\nFor a complete implementation, see:")
print("  - Bleichenbacher's original paper (Crypto 2006)")
print("  - 'Forging PKCS#1 v1.5 Signatures with e=3'")
`,
    proof: `\\textbf{Theorem: (Bleichenbacher, 2006)} PKCS#1 v1.5 signature verification with e = 3 is vulnerable to forgery. An attacker can construct a signature S such that S^3 \\bmod n has the correct PKCS#1 format without knowing the private key.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item e = 3 (small public exponent)
\\item PKCS#1 v1.5 signature format: 0x00 || 0x01 || PS || 0x00 || DER(HASH) || HASH
\\item Some implementations do not verify padding bytes strictly
\\item Integer cube root computation
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{PKCS#1 v1.5 encoded message: } EM &= \\text{0x00} || \\text{0x01} || \\underbrace{\\text{0xFF} \\cdots \\text{0xFF}}_{\\text{padding}} || \\text{0x00} || \\text{DER} || H \\\\
\\text{For } e = 3, \\text{ the signature } S &= \\sqrt[3]{EM} \\text{ (approximately)} \\\\
\\text{If } EM < n, \\text{ then } S^3 &= EM \\text{ exactly (no modular reduction)} \\\\
\\text{The attack constructs } S \\text{ such that:} & \\\\
S^3 &= \\text{0x0001FFFF} \\cdots \\text{00[DER][HASH]} \\pmod{n} \\\\
\\text{Key insight: if the verifier only checks that the hash} & \\\\
\\text{appears at the right position (not full padding),} & \\\\
\\text{we can set the high bits of } S^3 \\text{ arbitrarily.} & \\\\
\\text{Set } S = \\lfloor n^{1/3} \\rfloor + \\delta \\text{ and adjust } \\delta &\\text{ to get correct hash suffix.} \\\\
\\text{This produces a valid-looking signature.} & \\qed
\\end{align*}

\\textbf{References:} D. Bleichenbacher, "Forging PKCS#1 v1.5 Signatures", Crypto 2006 rump session; Halderman et al., "Low-Exponent RSA Signatures", 2006`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.hash_hex,
  },
];
