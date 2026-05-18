import type { Attack } from '../../types';
import { gcd } from '../../utils/bigint';

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
    proof: `\\textbf{Theorem:} Let n be an RSA modulus and e_1, e_2 be coprime exponents. Given c_1 \\equiv m^{e_1} \\pmod{n} and c_2 \\equiv m^{e_2} \\pmod{n}, recover m via Bezout coefficients.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e_1, e_2, c_1, c_2 (modulus, two exponents, two ciphertexts)
\\item \\gcd(e_1, e_2) = 1
\\item Same m encrypted under both exponents
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\gcd(e_1, e_2) = 1 \\implies \\exists a, b \\in \\mathbb{Z} &: \\\\
a \\cdot e_1 + b \\cdot e_2 &= 1 \\\\
c_1^a \\cdot c_2^b &\\equiv (m^{e_1})^a \\cdot (m^{e_2})^b \\pmod{n} \\\\
&\\equiv m^{a e_1 + b e_2} \\pmod{n} \\\\
&\\equiv m \\\\
a < 0 \\implies c_1^a &= (c_1^{-1})^{|a|} \\pmod{n} \\\\
b < 0 \\implies c_2^b &= (c_2^{-1})^{|b|} \\pmod{n} \\\\
m &= c_1^a \\cdot c_2^b \\pmod{n} \\qed
\\end{align*}

\\textbf{Explanation:} Find Bezout coefficients a, b such that a·e₁ + b·e₂ = 1. Compute c₁ᵃ · c₂ᵇ mod n, using modular inverses for negative coefficients. The exponents cancel to leave m.

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
    proof: `\\textbf{Theorem:} Let c_i \\equiv m^e \\pmod{n_i} for i = 1, \\ldots, k with \\gcd(n_i, n_j) = 1. If m^e < \\prod n_i and k \\geq e, recover m via CRT + e-th root.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item k pairs of (n_i, c_i) with pairwise coprime moduli
\\item Same exponent e for all, same message m
\\item k \\geq e, m^e < \\prod_{i=1}^{k} n_i
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_i &\\equiv m^e \\pmod{n_i}, \\quad i = 1, \\ldots, k \\\\
N &= \\prod_{i=1}^{k} n_i \\\\
C &\\equiv c_i \\pmod{n_i} \\quad \\text{(CRT)} \\\\
C &\\equiv m^e \\pmod{N} \\\\
m^e < N \\implies C &= m^e \\quad \\text{(over } \\mathbb{Z}\\text{)} \\\\
m &= \\sqrt[e]{C} \\qed
\\end{align*}

\\textbf{Explanation:} Combine ciphertexts via CRT to get C ≡ mᵉ (mod N). When mᵉ < N, the congruence becomes an exact equality over integers. Take the integer e-th root to recover m.

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
    proof: `\\textbf{Theorem:} Given c_1 \\equiv m^e \\pmod{n} and c_2 \\equiv (am + b)^e \\pmod{n} with known a, b, recover m via polynomial GCD over \\mathbb{Z}/n\\mathbb{Z}.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, c_1, c_2, a, b (modulus, exponent, two ciphertexts, linear relation)
\\item m_2 = a \\cdot m_1 + b (known affine relation)
\\item \\gcd(a, n) = 1
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(x) &= x^e - c_1 \\in (\\mathbb{Z}/n\\mathbb{Z})[x] \\\\
f_2(x) &= (ax + b)^e - c_2 \\in (\\mathbb{Z}/n\\mathbb{Z})[x] \\\\
f_1(m) &= m^e - c_1 \\equiv 0 \\pmod{n} \\\\
f_2(m) &= (am + b)^e - c_2 \\equiv 0 \\pmod{n} \\\\
(x - m) \\mid \\gcd(f_1, f_2) & \\\\
g(x) = \\gcd(f_1, f_2), \\quad \\deg(g) = 1 &\\implies g(x) = x - m \\\\
m &= -g[0] / g[1] \\qed
\\end{align*}

\\textbf{Explanation:} Build two polynomials that both have m as a root. Their GCD is (x − m) for generic a, b. Extract m from the linear GCD's coefficients.

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

print(f"Coppersmith Short Pad Attack")
print(f"n = {n}, e = {e}")
print()

# The attack: c1 = m^e mod n, c2 = (m + delta)^e mod n
# We want to find delta, then use Franklin-Reiter

# Method: Compute resultant of x^e - c1 and (x+y)^e - c2 as polynomials in x over Zmod(n)[y]
# The resultant eliminates x and gives a polynomial in delta

# Build proper polynomial ring hierarchy
Q.<y> = PolynomialRing(Zmod(n))
R2.<x2> = PolynomialRing(Q)
f1_x = x2^e - c1
f2_x = (x2 + y)^e - c2

print("Computing resultant...")
res = f1_x.resultant(f2_x, x2)
print(f"Resultant degree: {res.degree()}")

# Find small roots of the resultant polynomial
bound = ZZ(n^(1/e^2))
print(f"Small root bound: {bound}")

roots = res.small_roots(X=bound, beta=0.5)
if roots:
    delta = roots[0]
    print(f"Found padding difference: delta = {delta}")

    # Franklin-Reiter with a=1, b=delta
    P.<x> = PolynomialRing(Zmod(n))
    f1 = x^e - c1
    g = gcd(f1, (x + delta)^e - c2)
    if g.degree() == 1:
        m = -g[0] / g[1]
        print(f"Recovered message: m = {m}")

        # Verify
        v1 = power_mod(Integer(m), e, n)
        v2 = power_mod(Integer(m) + delta, e, n)
        print(f"Verification: m^e mod n = {v1} (c1 = {c1})")
        print(f"Verification: (m+delta)^e mod n = {v2} (c2 = {c2})")
    else:
        print(f"GCD has degree {g.degree()}, cannot extract unique solution.")
else:
    print("No small roots found. Padding may be too large.")
`,
    proof: `\\textbf{Theorem:} Given c_1 \\equiv (m + \\delta_1)^e \\pmod{n} and c_2 \\equiv (m + \\delta_2)^e \\pmod{n} with |\\delta_1 - \\delta_2| < n^{1/e^2}, recover m via resultant + Coppersmith.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, c_1, c_2 (modulus, exponent, two ciphertexts)
\\item |\\delta_2 - \\delta_1| < n^{1/e^2} (short padding)
\\item Same base message m under both encryptions
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(x) &= x^e - c_1 \\\\
f_2(x) &= (x + \\Delta)^e - c_2, \\quad \\Delta = \\delta_2 - \\delta_1 \\\\
r(\\Delta) &= \\text{Res}_x(f_1, f_2) \\equiv 0 \\pmod{n} \\\\
|\\Delta| < n^{1/e^2} &\\implies \\Delta \\text{ found via } small\\_roots \\\\
\\gcd(x^e - c_1, (x + \\Delta)^e - c_2) &= x - (m + \\delta_1) \\\\
m &= \\text{root} - \\delta_1 \\qed
\\end{align*}

\\textbf{Explanation:} Compute the resultant of two polynomials to eliminate x, yielding a polynomial in Δ. Use Coppersmith's small_roots to find the small padding difference. Apply Franklin-Reiter with known Δ to recover m.

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
    # General Hastad with linear padding:
    # c_i = (a_i * m + b_i)^e mod n_i
    #
    # Strategy: For each i, we have (a_i * m + b_i)^e = c_i mod n_i
    # Use CRT to combine, then solve for m

    # Step 1: Compute combined modulus N = prod(n_i)
    N = prod([t[0] for t in triples])
    print(f"Combined modulus N has {N.nbits()} bits")

    # Step 2: For each triple, define polynomial f_i(x) = (a_i*x + b_i)^e - c_i mod n_i
    # We want x = m such that f_i(m) = 0 mod n_i for all i

    # Step 3: Use CRT to combine the polynomial system
    # Build polynomial over Zmod(N): F(x) such that F(x) = 0 mod n_i for all i
    # This is done by: F(x) = sum_i [ CRT_coeff_i * f_i(x) ] mod N
    # where CRT_coeff_i = (N/n_i) * inverse(N/n_i, n_i)

    R.<x> = PolynomialRing(Zmod(N))

    # Build the combined polynomial
    F = 0
    for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
        # CRT coefficient for this modulus
        Ni = N // n_i
        coeff = Ni * inverse_mod(Ni, n_i)
        # f_i(x) = (a_i*x + b_i)^e - c_i
        fi = (a_i*x + b_i)^e - c_i
        F += coeff * fi

    F = F % N
    print(f"Combined polynomial degree: {F.degree()}")

    # Step 4: Find small roots of F(x) = 0 mod N
    # m is small compared to N (since N = prod(n_i) and m < min(n_i))
    bound = ZZ(min(t[0] for t in triples))
    print(f"Small root bound: {bound}")

    roots = F.small_roots(X=bound, beta=1.0, epsilon=0.05)
    if roots:
        m = roots[0]
        print(f"Recovered message: m = {m}")

        # Verify against all triples
        for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
            v = power_mod(a_i * Integer(m) + b_i, e, n_i)
            status = "OK" if v == c_i else "FAIL"
            print(f"  Verify {i+1}: (a*m+b)^e mod n{i+1} = {v} (c{i+1} = {c_i}) [{status}]")
    else:
        print("No small roots found. Try increasing epsilon or check inputs.")
        print("Fallback: try standard Hastad if all a_i=1, b_i=0.")

        # Fallback for standard case
        all_simple = all(t[2] == 1 and t[3] == 0 for t in triples)
        if all_simple:
            print("All a_i=1, b_i=0. Using standard Hastad CRT approach...")
            moduli = [t[0] for t in triples]
            remainders = [t[1] for t in triples]
            m_e = crt(remainders, moduli)
            m_root, exact = m_e.nth_root(e, truncate_mode=True)
            if exact:
                print(f"Recovered message: m = {m_root}")
            else:
                print(f"Approximate root: m = {m_root}")
`,
    proof: `\\textbf{Theorem:} Given c_i \\equiv (a_i m + b_i)^e \\pmod{n_i} for i = 1, \\ldots, k with known a_i, b_i and k \\geq e, recover m via CRT + Coppersmith.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item k triples (n_i, c_i, a_i, b_i) with pairwise coprime moduli
\\item k \\geq e, known affine transforms
\\item m < \\min(n_i)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_i(x) &= (a_i x + b_i)^e - c_i \\in (\\mathbb{Z}/n_i\\mathbb{Z})[x] \\\\
N &= \\prod_{i=1}^{k} n_i \\\\
N_i &= N / n_i, \\quad t_i = N_i \\cdot N_i^{-1} \\bmod n_i \\\\
F(x) &= \\sum_{i=1}^{k} t_i \\cdot f_i(x) \\pmod{N} \\\\
F(m) &\\equiv 0 \\pmod{N} \\\\
m &= small\\_roots(F, X = \\min(n_i)) \\qed
\\end{align*}

\\textbf{Explanation:} Build a polynomial per ciphertext, combine via CRT coefficients into F(x) over Zmod(N). The message m is a small root of F. Use Coppersmith's small_roots to extract it.

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
    proof: `\\textbf{Theorem:} An oracle \\mathcal{O}(c) = \\text{LSB}(c^d \\bmod n) recovers m in O(\\log n) queries via binary search.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, c (modulus, exponent, ciphertext)
\\item Oracle returning LSB(c^d mod n) per query
\\item c_i = c \\cdot (2^i)^e \\bmod n for iteration i
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= c^d \\bmod n \\\\
\\mathcal{O}(c \\cdot 2^e \\bmod n) &= \\text{LSB}((2m) \\bmod n) \\\\
2m < n &\\implies \\text{LSB} = 0 \\implies m \\in [0, n/2) \\\\
2m \\geq n &\\implies \\text{LSB} = 1 \\implies m \\in [n/2, n) \\\\
[\\ell_0, u_0) &= [0, n) \\\\
[\\ell_{i+1}, u_{i+1}) &= \\begin{cases}
[\\ell_i, \\tfrac{\\ell_i + u_i}{2}) & \\text{if bit}_i = 0 \\\\
[\\tfrac{\\ell_i + u_i}{2}, u_i) & \\text{if bit}_i = 1
\\end{cases} \\\\
u_k - \\ell_k &= n / 2^k \\xrightarrow{k = \\lceil \\log_2 n \\rceil} 1 \\\\
m &= \\ell_k \\qed
\\end{align*}

\\textbf{Explanation:} Each oracle query on c·(2ⁱ)ᵉ reveals whether 2ⁱ·m mod n is even or odd, halving the interval containing m. After log₂(n) queries the interval shrinks to a single value.

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
    proof: `\\textbf{Theorem:} A single faulty RSA-CRT signature s' on known message m factors n via \\gcd(s'^e - m, n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, m, s_{valid}, s_{faulty} (modulus, exponent, message, valid and faulty signatures)
\\item n = pq, fault in one CRT component only
\\item s' \\equiv s \\pmod{p} but s' \\not\\equiv s \\pmod{q}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s &\\equiv m^d \\pmod{n} \\\\
s' &\\equiv s \\pmod{p}, \\quad s' \\not\\equiv s \\pmod{q} \\\\
s'^e &\\equiv s^e \\equiv m \\pmod{p} \\\\
s'^e &\\not\\equiv m \\pmod{q} \\\\
p \\mid (s'^e - m), \\quad q &\\nmid (s'^e - m) \\\\
\\gcd(s'^e - m, n) &= p \\\\
q &= n / p \\qed
\\end{align*}

\\textbf{Explanation:} A CRT fault makes the signature correct mod one prime but wrong mod the other. Raising the faulty signature to e and subtracting m yields a value divisible by exactly one prime factor. GCD with n extracts it.

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
        roots_p = cp.nth_root(e, all=True)
    print(f"e-th roots mod p: {[Integer(r) for r in roots_p]}")

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
        roots_q = cq.nth_root(e, all=True)
    print(f"e-th roots mod q: {[Integer(r) for r in roots_q]}")

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
    proof: `\\textbf{Theorem:} When \\gcd(e, \\varphi(n)) = g > 1, each ciphertext has g preimages found via e-th roots mod p, mod q + CRT.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, c, p, q (modulus, exponent, ciphertext, both prime factors)
\\item \\gcd(e, \\varphi(n)) = g > 1
\\item g_p = \\gcd(e, p-1), g_q = \\gcd(e, q-1)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
g_p &= \\gcd(e, p-1), \\quad g_q = \\gcd(e, q-1) \\\\
x \\mapsto x^e \\text{ in } \\mathbb{F}_p^* &: g_p\\text{-to-1} \\\\
x \\mapsto x^e \\text{ in } \\mathbb{F}_q^* &: g_q\\text{-to-1} \\\\
\\{r_{p,1}, \\ldots, r_{p,g_p}\\} &= \\{x \\in \\mathbb{F}_p : x^e = c\\} \\\\
\\{r_{q,1}, \\ldots, r_{q,g_q}\\} &= \\{x \\in \\mathbb{F}_q : x^e = c\\} \\\\
m_{i,j} &= \\text{CRT}(r_{p,i}, r_{q,j}; p, q) \\\\
m_{i,j}^e &\\equiv c \\pmod{n}, \\quad \\#\\text{solutions} = g_p \\cdot g_q = g \\qed
\\end{align*}

\\textbf{Explanation:} The map x ↦ xᵉ is g-to-1 when gcd(e, φ(n)) > 1. Find all e-th roots in each field separately, then CRT-combine every pair to get all g preimages.

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
roots_p = cp.nth_root(3, all=True)
print(f"Cube roots mod p: {[Integer(r) for r in roots_p]}")

# Cube roots mod q
print(f"Finding cube roots mod q...")
Fq = GF(q)
cq = Fq(c)
roots_q = cq.nth_root(3, all=True)
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
    proof: `\\textbf{Theorem:} When e = 3 and p \\equiv q \\equiv 1 \\pmod{3}, the map x ↦ x³ mod n has 9 preimages via cube roots mod p, mod q + CRT.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, c, p, q (modulus, ciphertext, both prime factors)
\\item e = 3, p \\equiv q \\equiv 1 \\pmod{3}
\\item 3 \\mid (p-1) and 3 \\mid (q-1)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p \\equiv 1 \\pmod{3} &\\implies 3 \\mid (p-1) \\\\
x \\mapsto x^3 \\text{ in } \\mathbb{F}_p^* &: \\text{3-to-1} \\\\
\\{r_{p,1}, r_{p,2}, r_{p,3}\\} &= \\{x \\in \\mathbb{F}_p : x^3 = c\\} \\\\
\\{r_{q,1}, r_{q,2}, r_{q,3}\\} &= \\{x \\in \\mathbb{F}_q : x^3 = c\\} \\\\
m_{i,j} &= \\text{CRT}(r_{p,i}, r_{q,j}; p, q) \\\\
\\#\\text{solutions} &= 3 \\times 3 = 9 \\qed
\\end{align*}

\\textbf{Explanation:} When p ≡ q ≡ 1 (mod 3), each field has exactly 3 cube roots of c. CRT-combine all 9 pairs to get all preimages. The correct m is identified by padding or format constraints.

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
    frontendCheck: async (vals: Record<string, string>) => {
      try {
        const n = BigInt(vals.n);
        const c = BigInt(vals.c);
        const g = gcd(c, n);

        if (g === 1n) {
          return "gcd(c, n) = 1. No common factor. Message is not a multiple of p or q.\nThis attack does not apply.";
        }
        if (g === n) {
          return "gcd(c, n) = n. c is a multiple of n (c = 0 mod n).\nThe message m was 0 or a multiple of n.";
        }

        const p = g;
        const q = n / g;
        return [
          `Common Factor Attack (browser-side, BigInt)`,
          `n = ${n}`,
          `c = ${c}`,
          `gcd(c, n) = ${g}`,
          ``,
          `Common factor found!`,
          `p = ${p}`,
          `q = ${q}`,
          `Verification: p * q = ${p * q}`,
        ].join('\n');
      } catch {
        return null;
      }
    },
    proof: `\\textbf{Theorem:} If \\gcd(c, n) > 1 where c = m^e \\bmod n, then \\gcd(c, n) reveals a factor of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, c (modulus, ciphertext)
\\item \\gcd(m, n) > 1 (message is a multiple of p or q)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p \\mid m &\\implies m \\equiv 0 \\pmod{p} \\\\
c = m^e &\\equiv 0 \\pmod{p} \\\\
p \\mid c, \\quad p \\mid n &\\implies p \\mid \\gcd(c, n) \\\\
\\gcd(c, n) < n &\\implies \\gcd(c, n) = p \\text{ (or } q\\text{)} \\\\
q &= n / \\gcd(c, n) \\qed
\\end{align*}

\\textbf{Explanation:} If the message shares a factor with n, the ciphertext does too. GCD(c, n) extracts that prime factor directly, factoring n. This is a degenerate case — proper RSA padding prevents it.

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
    proof: `\\textbf{Theorem:} Textbook RSA is multiplicatively homomorphic: s_1 \\cdot s_2 \\bmod n is a valid signature for m_1 \\cdot m_2 \\bmod n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e (modulus, public exponent)
\\item Oracle pairs (m_i, s_i) where s_i = m_i^d \\bmod n
\\item Target m^* factors as m^* = \\prod m_i \\pmod{n}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s_1 &= m_1^d \\bmod n, \\quad s_2 = m_2^d \\bmod n \\\\
s &= s_1 \\cdot s_2 \\bmod n \\\\
s^e &= (s_1 \\cdot s_2)^e \\bmod n \\\\
&= s_1^e \\cdot s_2^e \\bmod n \\\\
&= m_1 \\cdot m_2 \\bmod n \\\\
m^* &= \\prod_{i=1}^{k} m_i \\pmod{n} \\\\
s^* &= \\prod_{i=1}^{k} s_i \\bmod n \\\\
(s^*)^e &= m^* \\bmod n \\qed
\\end{align*}

\\textbf{Explanation:} Factor the target message into a product of oracle-signed messages. Multiply the corresponding signatures to forge a valid signature on the target. This works because (ab)ᵈ ≡ aᵈ·bᵈ (mod n).

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
    proof: `\\textbf{Theorem:} PKCS#1 v1.5 verification with e = 3 is forgeable: construct S such that S³ mod n has valid format without the private key.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n (modulus), e = 3
\\item Target hash H (hex)
\\item Verifier does not strictly check all padding bytes
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
EM &= \\text{0x00} || \\text{0x01} || \\text{FF} \\cdots \\text{FF} || \\text{0x00} || \\text{DER} || H \\\\
S &= \\lfloor n^{1/3} \\rfloor + \\delta \\\\
S^3 &\\equiv EM \\pmod{n} \\\\
EM < n &\\implies S^3 = EM \\quad \\text{(exact, no mod reduction)} \\\\
\\text{Adjust } \\delta &\\text{ so } S^3 \\text{ ends with } H \\\\
\\text{Verifier checks hash suffix only} &\\implies \\text{forgery accepted} \\qed
\\end{align*}

\\textbf{Explanation:} Construct S ≈ ∛n and adjust lower bits so S³ ends with the target hash. If the verifier only checks that the hash appears at the correct position (not full padding), the forged signature passes. Requires e = 3 and lax verification.

\\textbf{References:} D. Bleichenbacher, "Forging PKCS#1 v1.5 Signatures", Crypto 2006 rump session; Halderman et al., "Low-Exponent RSA Signatures", 2006`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.hash_hex,
  },
];
