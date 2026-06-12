import type { AttackExplanationData } from '../../components/calculator/AttackExplanationPanel';

/* ───────── Proof (rendered in Explanation tab) ───────── */

export const ECC_PROOF = `\\textbf{Elliptic Curve Cryptography (ECC)}: Public-key cryptography based on the algebraic structure of elliptic curves over finite fields.

\\textbf{Weierstrass form:}
$y^2 = x^3 + ax + b \\quad (4a^3 + 27b^2 \\neq 0)$

\\textbf{Group Law:} Points on the curve form an additive group:
\\begin{itemize}
\\item \\textbf{Addition:} $P + Q = R$ — line through $P,Q$ reflects over $x$-axis
\\item \\textbf{Doubling:} $2P = R$ — tangent at $P$ reflects over $x$-axis
\\item \\textbf{Identity:} Point at infinity $\\mathcal{O}$
\\end{itemize}

\\textbf{Scalar Multiplication:} $k \\cdot P = P + P + \\cdots + P$ ($k$ times). The elliptic curve discrete logarithm problem (ECDLP) — finding $k$ given $P$ and $kP$ — is believed to be hard.

\\textbf{ECDSA (Sign):} Given private key $d$, message hash $h$:
\\begin{itemize}
\\item Choose random $k \\leftarrow [1, n-1]$
\\item Compute $R = k \\cdot G$, $r = R_x \\bmod n$
\\item $s = k^{-1}(h + dr) \\bmod n$
\\item Signature: $(r, s)$
\\end{itemize}

\\textbf{ECDSA (Verify):} Given public key $Q = d \\cdot G$, message hash $h$:
\\begin{itemize}
\\item $u_1 = hs^{-1} \\bmod n$, $u_2 = rs^{-1} \\bmod n$
\\item $R' = u_1 \\cdot G + u_2 \\cdot Q$
\\item Valid if $R'_x \\equiv r \\pmod{n}$
\\end{itemize}

\\textbf{Nonce Importance:} Reusing $k$ across two signatures immediately leaks $d$:
$k = \\frac{h_1 - h_2}{s_1 - s_2} \\bmod n, \\quad d = \\frac{s_1 \\cdot k - h_1}{r} \\bmod n$

\\textbf{ECDH Key Exchange:} Alice ($a, A = aG$), Bob ($b, B = bG$):
$\\text{Shared} = a \\cdot B = b \\cdot A = ab \\cdot G$

\\textbf{Standard Curves:}
\\begin{itemize}
\\item \\textbf{secp256k1}: $p = 2^{256} - 2^{32} - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1$, Bitcoin/ETH
\\item \\textbf{P-256}: NIST prime256v1, $a = -3$, widely used in TLS
\\item \\textbf{P-384}: 384-bit, higher security margin
\\item \\textbf{Curve25519}: Montgomery form $y^2 = x^3 + 486662x^2 + x$, twist-secure, fast
\\end{itemize}

\\textbf{Attacks:}
\\begin{itemize}
\\item \\textbf{Nonce Reuse}: Recovering $k$ from two signatures with same $k$
\\item \\textbf{Biased Nonce}: LLL recovers $d$ from many signatures with non-uniform $k$
\\item \\textbf{Invalid Curve}: Point not on curve skips cofactor validation
\\item \\textbf{MOV}: Small embedding degree $k$ transfers ECDLP to $\\mathbb{F}_{p^k}$
\\item \\textbf{Anomalous}: $\\#E(\\mathbb{F}_p) = p$ allows $\\mathbb{Z}_p$ lift attack
\\item \\textbf{Singular}: $\\Delta = 0$ reduces to multiplicative group
\\end{itemize}`;

/* ───────── Attack list (for Select dropdown) ───────── */

export const ECC_ATTACKS = [
  { value: 'nonce-reuse', label: 'ECDSA Nonce Reuse' },
  { value: 'point-validation', label: 'Point Validation Checker' },
  { value: 'biased-nonce', label: 'Biased Nonce / LLL — SageCell' },
  { value: 'invalid-curve', label: 'Invalid Curve Attack — SageCell' },
  { value: 'mov', label: 'MOV / Embedding Degree — SageCell' },
  { value: 'anomalous', label: "Smart's Attack (Anomalous) — SageCell" },
  { value: 'singular', label: 'Singular Curve — SageCell' },
];

/* ───────── Attack explanations ───────── */

export const ECC_ATTACK_EXPLANATIONS: Record<string, AttackExplanationData> = {
  'nonce-reuse': {
    title: 'ECDSA Nonce Reuse',
    description: 'When the same ephemeral key k is reused to sign two different messages, the private key d is immediately recoverable. Given two signatures (r, s1) on hash h1 and (r, s2) on hash h2 — sharing the same r means the same k was used — the private key falls out from basic algebra:\n\nk = (h1 - h2) * (s1 - s2)^-1 mod n\nd = (s1 * k - h1) * r^-1 mod n\n\nThis is the single most common ECDSA implementation bug, responsible for the PlayStation 3 ECDSA private key leak (2010) and multiple cryptocurrency thefts where biased or duplicated nonces leaked wallet private keys.',
    whenToUse: 'Two or more ECDSA signatures sharing the same r value (confirmed same nonce). The curve order n must be known.',
    algorithm: [
      'Confirm both signatures have identical r (non-repeating r means different k — this attack does not apply)',
      'Compute k = ((h1 - h2) mod n) * modinv((s1 - s2) mod n, n) mod n',
      'Compute d = ((s1 * k - h1) mod n) * modinv(r, n) mod n',
      'Verify: compute kG and confirm its x-coordinate equals r',
    ],
    python: `import sympy

n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

h1 = 0x0123456789abcdef...
h2 = 0xfedcba9876543210...
r  = 0x...
s1 = 0x...
s2 = 0x...

k = ((h1 - h2) * sympy.mod_inverse((s1 - s2) % n, n)) % n
d = ((s1 * k - h1) * sympy.mod_inverse(r, n)) % n

print(f"Recovered k: 0x{k:064x}")
print(f"Recovered d: 0x{d:064x}")

# Verify with pycryptodome
# from Cryptodome.PublicKey import ECC
# key = ECC.construct(curve='secp256k1', d=d)`,
    references: [
      'Wikipedia: Elliptic Curve Digital Signature Algorithm — security page',
      'SEC 2: Recommended Elliptic Curve Domain Parameters (Certicom)',
      'HD Wallet Cryptography / BIP32 — nonce misuse case studies',
    ],
  },
  'biased-nonce': {
    title: 'Biased Nonce / LLL Attack',
    description: 'When the ephemeral key k in ECDSA has known bias — e.g., only 64 bits of entropy instead of the full 256-bit curve order — the Hidden Number Problem (HNP) formulation applies. Given enough signatures (typically 3-10 for strong bias, more for weaker bias), the LLL lattice reduction algorithm recovers the private key.\n\nEach signature gives a relation: k_i = s_i^-1 * h_i + s_i^-1 * r_i * d (mod n). With k_i < 2^B for known bit-bound B, this is a Closest Vector Problem instance that LLL solves via Kannan embedding.',
    whenToUse: 'Multiple ECDSA signatures where the nonce k is known to be small (e.g., k < 2^B with B << 256). Common in embedded systems, smart cards, and RFC 6979 fallback failures.',
    algorithm: [
      'Collect m signatures (r_i, s_i, h_i) on distinct messages',
      'Compute a_i = r_i / s_i mod n and b_i = h_i / s_i mod n for each',
      'Build (m+2) by (m+2) Kannan embedding lattice matrix',
      'Run LLL reduction — the short vector contains d and k_i candidates',
      'Verify candidate d by checking k_0 = a_0 * d + b_0 mod n < 2^B',
    ],
    python: `import sympy
from fpylll import IntegerMatrix, LLL

n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

# (r_i, s_i, h_i) hex tuples from collected signatures
sigs = [
    ("0x...", "0x...", "0x..."),
    ("0x...", "0x...", "0x..."),
]
B = 64  # nonce bit-length bound

m = len(sigs)
M = [[0]*(m+2) for _ in range(m+2)]
for i, (r, s, h) in enumerate(sigs):
    r_i = int(r, 16); s_i = int(s, 16); h_i = int(h, 16)
    a_i = (r_i * sympy.mod_inverse(s_i, n)) % n
    b_i = (h_i * sympy.mod_inverse(s_i, n)) % n
    M[i][i] = n
    M[m][i] = a_i
    M[m+1][i] = b_i
M[m][m] = 1
M[m+1][m+1] = 2**B

L = IntegerMatrix.from_matrix(M)
L = LLL.reduction(L)
# Search short vectors for d candidate`,
    references: [
      'Howgrave-Graham & Smart, "Lattice Attacks on Digital Signature Schemes" (2001)',
      'Nguyen & Shparlinski, "The Insecurity of DSA with Biased Nonces" (2002)',
      'fpylll documentation — LLL implementation for Python',
    ],
  },
  'invalid-curve': {
    title: 'Invalid Curve Attack',
    description: 'In Weierstrass-form ECC, the curve addition formulas do not depend on the b parameter — only on the x,y coordinates and a. If an implementation skips full curve validation (checking b is correct), an attacker can send points on a weak curve E\': y^2 = x^3 + ax + b\' (same a, same field F_p, different b) where the group order has only small prime factors.\n\nSince the scalar multiplication operation still works (it only uses a), the computation proceeds on the weak curve where discrete_log is tractable via Pohlig-Hellman + CRT. This recovers the scalar multiplier, leaking the private key.',
    whenToUse: 'An ECC implementation that accepts foreign public keys without validating they belong to the intended curve. Especially relevant for Diffie-Hellman and ECDH protocols.',
    algorithm: [
      'Fix a target curve E: y^2 = x^3 + ax + b over F_p',
      'Search for b\' values where E\': y^2 = x^3 + ax + b\' has smooth order (small largest prime factor)',
      'Send a point on E\' to the target and observe the result',
      'Compute discrete_log on each weak E\' prime-power subgroup',
      'Reconstruct the full secret via CRT across all subgroups',
    ],
    python: `import sympy

# Target curve: y^2 = x^3 + ax + b over F_p
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a = 0
b = 7

# Search for weak related curves (same a, p)
for db in range(1, 50):
    bp = (b + db) % p
    F = sympy.GF(p)
    E = sympy.EllipticCurve(F, [a, int(bp)])
    order = E.order()
    factors = sympy.factorint(order)
    max_prime = max(factors.keys())
    if max_prime < 2**20:
        print(f"b'={bp:x} order={order} smooth! max_prime={max_prime}")
        G = E.gens()[0]
        # discrete_log(Q, G, operation='+') recovers key`,
    references: [
      'Ciet et al., "Elliptic Curve Cryptography: Serpentine Path of a Breakthrough" (2004)',
      'Jager, Schwenk, Somorovsky, "Practical Invalid Curve Attacks on TLS-ECDH" (2015)',
      'NIST SP 800-56A Rev. 3 — key agreement validation requirements',
    ],
  },
  'mov': {
    title: 'MOV / Embedding Degree Attack',
    description: 'The Menezes-Okamoto-Vanstone (MOV) attack uses the Weil or Tate pairing to transfer the elliptic curve discrete logarithm problem (ECDLP) from an elliptic curve E(F_p) to the multiplicative group of an extension field F_{p^k}. The embedding degree k is the smallest positive integer such that p^k = 1 mod n where n = #E(F_p).\n\nWhen k <= 6, the pairing-friendly embedding makes the DLP vulnerable to index calculus in F_{p^k} — much faster than Pollard rho on the curve. Curves with small embedding degree (pairing-friendly curves like BN254, BLS12-381 for k=12) are designed for pairing-based cryptography but must have k large enough for general security.',
    whenToUse: 'A curve where the order n divides p^k - 1 for small k (k <= 6). Verify by checking whether pow(p, k, n) == 1.',
    algorithm: [
      'Compute curve order n = #E(F_p)',
      'For k = 1 to 12: check if p^k = 1 mod n',
      'If found k <= 6: MOV attack feasible via pairing to F_{p^k}',
      'Use Weil/Tate pairing: e(P, Q) maps the ECDLP to F_{p^k}',
      'Apply index calculus or discrete_log in the extension field',
    ],
    python: `import sympy

# Curve E: y^2 = x^3 + ax + b over F_p
p = 0x...
a = 0
b = ...

F = sympy.GF(p)
E = sympy.EllipticCurve(F, [a, b])
n = E.order()

print(f"Curve order: {n}")
print(f"Factorization: {sympy.factorint(n)}")

# Find embedding degree k
for k in range(1, 13):
    if sympy.Mod(p**k, n) == 0:
        print(f"Embedding degree k = {k}")
        if k <= 6:
            print("MOV attack feasible via pairing")
        else:
            print("k > 6 — attack impractical")
        break
else:
    print("k > 12 — MOV not feasible")`,
    references: [
      'Menezes, Okamoto, Vanstone, "Reducing ECDLP to DLP in a Finite Field" (1993)',
      'Frey & Ruck, "A Remark on the MOV Attack" (1994)',
      'Galbraith & Smart, "Pairings and the MOV Attack" (2010 survey)',
    ],
  },
  'anomalous': {
    title: "Smart's Attack (Anomalous Curve)",
    description: 'An elliptic curve E over F_p is anomalous when #E(F_p) = p, i.e., the trace of Frobenius is 1. For such curves, the ECDLP can be solved in polynomial time using p-adic elliptic logarithms (Smart\'s attack, independently by Semaev and Satoh-Araki).\n\nThe attack lifts the curve to Q_p (p-adic numbers) via Hensel\'s lemma, computes the p-adic elliptic logarithm, and recovers the discrete logarithm in Z_p. This is a polynomial-time attack — no subexponential or exponential effort needed — making anomalous curves completely unsafe for cryptographic use.',
    whenToUse: 'A curve where #E(F_p) = p (trace = 1). Check: compare curve order to field prime p. If equal, Smart\'s attack applies.',
    algorithm: [
      'Compute curve order n = #E(F_p) and verify n === p',
      'Lift the curve E(F_p) to E(Q_p) via Hensel lifting (p-adic)',
      'Compute the formal logarithm: log_E maps E(Q_p) to Q_p',
      'Apply the logarithm to both generator G and target Q',
      'Recover d = log_E(Q) / log_E(G) mod p (the private key)',
    ],
    python: `import sympy

# Check if curve is anomalous
p = 0x...
a = 0
b = ...

F = sympy.GF(p)
E = sympy.EllipticCurve(F, [a, b])
n = E.order()

print(f"p = {p}")
print(f"n = {n}")
print(f"n == p: {n == p}")

if n == p:
    print("ANOMALOUS CURVE — Smart's attack applicable")
    # SageMath required for p-adic lift:
    # Qp = pAdicField(p, 10)
    # E_qp = EllipticCurve(Qp, [a, b])
    # Formal logarithm recovers d
    # d = log_e(Q) / log_e(G)
else:
    print("Not anomalous — Smart's attack does not apply")`,
    references: [
      'Smart, "The Discrete Logarithm Problem on Elliptic Curves of Trace One" (1999)',
      'Semaev, "Evaluation of Discrete Logarithms on Some Elliptic Curves" (1998)',
      'Satoh & Araki, "Fermat Quotients and the Discrete Log on Anomalous Curves" (1998)',
    ],
  },
  'singular': {
    title: 'Singular Curve Attack',
    description: 'An elliptic curve E: y^2 = x^3 + ax + b over F_p has discriminant Delta = -16(4a^3 + 27b^2). When Delta = 0 mod p, the curve is singular — it has a cusp or a node. The group law degenerates:\n\n- Cusp (a = 0, b = 0): ECDLP reduces to the additive group of F_p — completely trivial (discrete log is just division).\n- Node (Delta = 0 but not cusp): ECDLP reduces to the multiplicative group of F_p or F_{p^2} — solvable via index calculus or baby-step giant-step.\n\nSingular curves should never appear in practice (validation rejects Delta = 0), but CTF challenges and bad implementations may use them.',
    whenToUse: 'A curve where discriminant Delta = 0 mod p. Check: compute (-16 * (4a^3 + 27b^2)) mod p. If zero, the curve is singular.',
    algorithm: [
      'Compute discriminant Delta = -16(4a^3 + 27b^2) mod p',
      'If Delta != 0: curve is non-singular (standard crypto-grade)',
      'If Delta = 0 and a = 0, b = 0: cusp — additive group, ECDLP is trivial',
      'If Delta = 0 with non-zero a,b: node — multiplicative group, solve via discrete_log',
    ],
    python: `import sympy

p = 0x...
a = 0
b = ...

disc = sympy.Mod(-16 * (4*a**3 + 27*b**2), p)
print(f"Discriminant: {disc:x}")

if disc == 0:
    print("SINGULAR CURVE")
    if a == 0 and b == 0:
        print("Cusp — ECDLP reduces to additive group")
        print("Trivial: d = Q_target / G (in F_p)")
    else:
        print("Node — ECDLP reduces to multiplicative group")
        F = sympy.GF(p)
        E = sympy.EllipticCurve(F, [a, b])
        print(f"Order: {E.order()}")
        # Map to multiplicative group and solve
else:
    print("Non-singular curve (standard)")`,
    references: [
      'Silverman, "The Arithmetic of Elliptic Curves" (GTM 106) — singular curve classification',
      'Washington, "Elliptic Curves: Number Theory and Cryptography" — singular reduction',
      'Certicom ECC Standards — discriminant validation requirement',
    ],
  },
  'point-validation': {
    title: 'Point Validation Checker',
    description: 'Many ECC implementations fail to validate that public key points actually lie on the expected curve. The attacker supplies a point (x, y) and the curve equation y^2 = x^3 + ax + b (mod p) is checked or not. If validation is missing, the attacker can choose points on a different (weaker) curve where the discrete log is easy, then observe how the protocol responds differently.\n\nThis is a reconnaissance / sanity-check attack: feed a candidate point and learn whether the target validates curve membership. Once a non-validating point is accepted, stronger attacks (invalid curve, twist) become possible.',
    whenToUse: 'You have an ECC implementation that accepts a point (x, y) plus curve parameters (a, b, p). You want to test whether it validates curve membership before using the point.',
    algorithm: [
      'Parse curve parameters a, b, field prime p, and candidate point (x, y)',
      'Compute LHS = y^2 mod p',
      'Compute RHS = (x^3 + ax + b) mod p',
      'Compare: LHS === RHS means the point is on the curve',
      'Try points with modified b (same a, p) — these are on related curves',
    ],
    python: `import sympy

# Curve parameters (secp256k1)
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a = 0
b = 7

# Candidate point
x = 0x...
y = 0x...

lhs = sympy.Mod(y**2, p)
rhs = sympy.Mod(x**3 + a*x + b, p)

if lhs == rhs:
    print("Point IS on the curve")
else:
    print("Point NOT on the curve")

# gmpy2 alternative
# import gmpy2
# lhs = gmpy2.powmod(y, 2, p)`,
    references: [
      'NIST SP 800-186: Recommendations for Discrete Logarithm-based Cryptography',
      'Antipa et al. "Validation of Elliptic Curve Public Keys" (2003)',
      'Invalid-curve attacks in TLS (Jager, Schwenk, Somorovsky 2015)',
    ],
  },
};
