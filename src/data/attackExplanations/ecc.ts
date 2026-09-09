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
\\item Compute $R = k \\cdot G$, $r = R_x \\bmod n$ (retry if $r = 0$)
\\item $s = k^{-1}(h + dr) \\bmod n$ (retry if $s = 0$)
\\item Signature: $(r, s)$, with $r, s \\in [1, n-1]$ and $h$ = leftmost bits of SHA256 (noble prehash:true = plain ECDSA-SHA256)
\\end{itemize}

\\textbf{ECDSA (Verify):} Given public key $Q = d \\cdot G$, message hash $h$:
\\begin{itemize}
\\item $u_1 = hs^{-1} \\bmod n$, $u_2 = rs^{-1} \\bmod n$
\\item $R' = u_1 \\cdot G + u_2 \\cdot Q$
\\item Valid if $R'_x \\equiv r \\pmod{n}$
\\item \\textit{Low-S policy:} many verifiers also reject $s > n/2$ (malleability guard, not curve math)
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
\\item \\textbf{Curve25519}: Montgomery form $y^2 = x^3 + 486662x^2 + x$, twist-secure, fast. Twist-secure means bogus $x$-coords land on the quadratic twist whose order $4\\cdot t'$ is also nearly prime, so only small-subgroup leakage escapes — the protection ends where contributory or authenticated use, unclamped scalars, or missing low-order checks begin
\\end{itemize}

\\textbf{Attacks:}
\\begin{itemize}
\\item \\textbf{Nonce Reuse}: Recovering $k$ from two signatures with same $k$
\\item \\textbf{Biased Nonce}: LLL recovers $d$ from many signatures with non-uniform $k$
\\item \\textbf{Invalid Curve}: Weierstrass addition ignores $b$, so an unvalidated point lands on a weak curve $E'$ (same $a$, new $b'$) with smooth order — DLP falls to Pohlig-Hellman + CRT
\\item \\textbf{MOV}: Small embedding degree $k$ transfers ECDLP to $\\mathbb{F}_{p^k}$
\\item \\textbf{Anomalous}: $\\#E(\\mathbb{F}_p) = p$ allows $\\mathbb{Z}_p$ lift attack
\\item \\textbf{Singular}: $\\Delta = 0$ degenerates the group law — cusp ($a=b=0$): additive group, trivial DLP; node: multiplicative group of $\\mathbb{F}_p$
\\end{itemize}`;

/* ───────── Attack list (for Select dropdown) ───────── */

export const ECC_ATTACKS = [
  { value: 'nonce-reuse', label: 'ECDSA Nonce Reuse' },
  { value: 'point-validation', label: 'Point Validation Checker' },
  { value: 'ec-ph', label: 'EC Pohlig-Hellman (Local)' },
  { value: 'sig-malleability', label: 'Signature Malleability Demo (Local)' },
  { value: 'x25519-twist', label: 'X25519 Twist / Low-Order Demo (Local)' },
  { value: 'biased-nonce', label: 'Biased Nonce / LLL — SageCell' },
  { value: 'invalid-curve', label: 'Invalid Curve (Weak-Curve Scan) — SageCell' },
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

# Offline SymPy version — same algebra as the live Nonce Reuse tab, which
# additionally recomputes k*G and checks its x-coordinate against r.
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
    description: 'Biased nonces turn ECDSA into a Hidden Number Problem: when each ephemeral key k holds only B bits of entropy (B << 256), LLL lattice reduction recovers the private key from a handful of signatures (typically 3-10 for strong bias, more for weaker bias).\n\nEach signature gives a relation: k_i = s_i^-1 * h_i + s_i^-1 * r_i * d (mod n). With k_i < 2^B this is a Closest Vector Problem instance that LLL solves via Kannan embedding. Known-prefix/suffix nonce bits (nonce-ladder variants, e.g. RFC 6979 faults leaking top bits) reduce to the same HNP with shifted targets — only the lattice offset changes.',
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
      'Query the oracle with points on each weak E-prime-power subgroup',
      'Solve each prime-power DLP (local EC Pohlig-Hellman mirrors this)',
      'Reconstruct the full secret via CRT across all subgroups',
    ],
    python: `# SageMath (local Sage or SageCell) — mirrors the live weak-curve scan.
# sympy has no GF/EllipticCurve; run this where GF/EllipticCurve exist.
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a = 0
b = 7

F = GF(p)
for db in range(1, 50):
    E2 = EllipticCurve(F, [a, F(b + db)])
    n2 = E2.order()
    fac = factor(n2)
    max_prime = max(e for _, e in fac)
    if max_prime < 2**16:
        print("b+%d: SMOOTH order=%s generator=%s" % (db, n2, E2.gens()[0]))
# Oracle + CRT finish: send each weak-curve point to the oracle, solve each
# prime-power DLP via discrete_log(Q, P, operation='+'), combine with CRT —
# or paste the generator into the local EC Pohlig-Hellman mode.`,
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
    python: `# SageMath (local Sage or SageCell) — mirrors the live MOV template.
# sympy has no GF/EllipticCurve; run this where GF/EllipticCurve exist.
p = 0x...
a = 0
b = 0x...

F = GF(p)
E = EllipticCurve(F, [a, b])
n = E.order()
print("Curve order: %s" % n)
print("Factorization: %s" % factor(n))

# Embedding degree: smallest k with p^k == 1 mod n.
for k in range(1, 13):
    if Mod(p, n)**k == 1:
        print("Embedding degree k = %d" % k)
        if k <= 6:
            print("MOV attack feasible via pairing to F_{p^%d}" % k)
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
    python: `# SageMath (local Sage or SageCell) — mirrors the live anomalous template.
# sympy has no GF/EllipticCurve; run this where GF/EllipticCurve exist.
p = 0x...
a = 0
b = 0x...

F = GF(p)
E = EllipticCurve(F, [a, b])
n = E.order()
print("p = %s" % p)
print("n = %s" % n)
print("n == p: %s" % (n == p))
if n == p:
    print("ANOMALOUS CURVE — Smart's attack applicable")
    # p-adic lift needs local Sage:
    # Qp = Qp(p, 10); Eqp = EllipticCurve(Qp, [a, b])
    # d = Eqp(Q).log() / Eqp(G).log()  (formal logarithm)
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
    python: `# SageMath (local Sage or SageCell) — mirrors the live singular template.
p = 0x...
a = 0
b = 0x...

F = GF(p)
disc = (-16 * (4*a^3 + 27*b^2)) % p
print("Discriminant: %x" % disc)
if disc == 0:
    print("SINGULAR CURVE")
    if a == 0 and b == 0:
        print("Cusp — ECDLP reduces to the additive group (trivial: d = Q/G in F_p)")
    else:
        print("Node — ECDLP reduces to the multiplicative group")
        R.<x> = F[]
        print("Singular x: %s" % (x^3 + a*x + b).roots())
        # Map the smooth points to F_p^* (or F_{p^2}^*) and solve there
else:
    print("Non-singular curve (standard)")
    E = EllipticCurve(F, [a, b])
    print("Order: %s Factors: %s" % (E.order(), factor(E.order())))`,
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

# Offline SymPy version — same check as the live Point Validation tab.
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
  'ec-ph': {
    title: 'EC Pohlig-Hellman (Local Solver)',
    description: 'The elliptic-curve twin of the DH Pohlig-Hellman attack: when the subgroup generated by G has smooth order (all prime factors small), the discrete log splits into one baby-step giant-step per prime-power subgroup, recombined with CRT. This is exactly how invalid-curve attacks finish — each weak related curve E\' has smooth order, so every oracle answer falls to this solver. Paste a weak-curve generator from the Invalid Curve scan into the local mode.\n\nScope: the tab enumerates #E(F_p) locally, so it covers toy/CTF curves (p under 10^5), not production sizes — the math is identical, only the enumeration bound differs.',
    whenToUse: 'You have a curve (a, b, p), a base point G and a target Q on it, with smooth subgroup order. Typical feed: generators found by the invalid-curve weak-curve scan.',
    algorithm: [
      'Validate G and Q lie on y^2 = x^3 + ax + b over F_p',
      'Enumerate the curve order n locally (Legendre symbols per x)',
      'Reduce G to its exact subgroup order via trial division',
      'For each prime power q = prime^exp dividing the order: project G_q = (ord/q)*G, Q_q = (ord/q)*Q and BSGS the log mod q',
      'Combine the per-subgroup logs with CRT and verify d*G == Q',
    ],
    python: `# Pure-Python EC Pohlig-Hellman — mirrors the local solver tab.
# Toy curve: y^2 = x^3 + 2x + 3 over F_97 (order 100 = 2^2 * 5^2).
p, a, b = 97, 2, 3
G = (0, 10)  # 10^2 % 97 == 3 == 0 + 0 + 3

def add(P, Q):
    if P is None: return Q
    if Q is None: return P
    x1, y1, x2, y2 = P[0], P[1], Q[0], Q[1]
    if x1 == x2:
        if (y1 + y2) % p == 0: return None
        lam = (3*x1*x1 + a) * pow(2*y1, -1, p) % p
    else:
        lam = (y2 - y1) * pow((x2 - x1) % p, -1, p) % p
    x3 = (lam*lam - x1 - x2) % p
    return (x3, (lam*(x1 - x3) - y1) % p)

def mul(P, k):
    R, B = None, P
    while k:
        if k & 1: R = add(R, B)
        B = add(B, B); k >>= 1
    return R

def bsgs(G, Q, q):
    import math
    m = math.isqrt(q) + 1
    baby, C = {}, None
    for j in range(m):
        baby.setdefault(C, j); C = add(C, G)
    step = mul(G, m)
    step = (step[0], (-step[1]) % p) if step else None
    gamma = Q
    for i in range(m):
        if gamma in baby:
            d = (i*m + baby[gamma]) % q
            if mul(G, d) == Q: return d
        gamma = add(gamma, step)
    return None

n, d_priv = 100, 37
Q = mul(G, d_priv)
rema, modu = [], []
for prime, exp in [(2, 2), (5, 2)]:
    q = prime**exp
    Gi, Qi = mul(G, n//q), mul(Q, n//q)
    Li = 0 if Qi is None else bsgs(Gi, Qi, q)
    rema.append(Li); modu.append(q)
    print("mod %d: log = %s" % (q, Li))
M = 1
for m in modu: M *= m
d = sum(r * (M//m) * pow(M//m, -1, m) for r, m in zip(rema, modu)) % M
print("recovered d =", d, "match:", mul(G, d) == Q)`,
    references: [
      'Pohlig & Hellman, "An Improved Algorithm for Computing Logarithms over GF(p)" (1978) — same CRT structure over EC groups',
      'Jager, Schwenk, Somorovsky, "Practical Invalid Curve Attacks on TLS-ECDH" (2015) — where this solver plugs in',
    ],
  },
  'sig-malleability': {
    title: 'Signature Malleability Demo',
    description: 'ECDSA signatures are inherently malleable: (r, s) and (r, n-s) satisfy the same verification equation, so anyone can forge a second valid signature without the key. Bitcoin learned this the expensive way (transaction-ID malleability, fixed by BIP-146 low-S relay rules). The demo signs once, then shows the high-S twin failing default (lowS:true) verification while passing with lowS:false — policy vs math, side by side.\n\nEd25519 analogue: S -> S+L malleations are accepted by ZIP-215-compatible verifiers but rejected by strict RFC 8032 verification (which noble enforces — S+L and S+2L both fail here). Deterministic nonces (RFC 6979 / RFC 8032) remove the k-reuse class but change nothing about malleability.',
    whenToUse: 'You want to show why protocols must pin down signature encoding (low-S, DER-canonical) instead of trusting "verifies" alone — or to produce a high-S twin for testing a verifier.',
    algorithm: [
      'Sign the message (any curve, any key)',
      'Compute the twin s2 = n - s',
      'Verify (r, s2) under the default low-S policy (expect INVALID)',
      'Verify (r, s2) with lowS:false (expect VALID — the math holds)',
    ],
    python: `# Pure-Python ECDSA malleability demo (secp256k1) — mirrors the local tab.
import hashlib
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
G = (Gx, Gy)

def add(P, Q):
    if P is None: return Q
    if Q is None: return P
    x1, y1, x2, y2 = P[0], P[1], Q[0], Q[1]
    if x1 == x2:
        if (y1 + y2) % p == 0: return None
        lam = (3*x1*x1) * pow(2*y1, -1, p) % p  # a = 0
    else:
        lam = (y2 - y1) * pow((x2 - x1) % p, -1, p) % p
    x3 = (lam*lam - x1 - x2) % p
    return (x3, (lam*(x1 - x3) - y1) % p)

def mul(P, k):
    R, B = None, P
    while k:
        if k & 1: R = add(R, B)
        B = add(B, B); k >>= 1
    return R

def verify(r, s, h, Q):
    if not (1 <= r < n and 1 <= s < n): return False
    w = pow(s, -1, n)
    R = add(mul(G, (h*w) % n), mul(Q, (r*w) % n))
    return R is not None and R[0] % n == r

d = 0x12345
Q = mul(G, d)
h = int.from_bytes(hashlib.sha256(b"malleability demo").digest(), "big") % n
k = 0x6789
r = mul(G, k)[0] % n
s = ((h + d*r) * pow(k, -1, n)) % n
lo, hi = (s, n-s) if s*2 < n else (n-s, s)
print("low-S verifies: ", verify(r, lo, h, Q))
print("high-S verifies:", verify(r, hi, h, Q), "(math accepts; lowS policy rejects)")`,
    references: [
      'BIP-146: Dealing with signature malleability (Bitcoin low-S relay rules)',
      'RFC 8032 §5.1.7 / ZIP-215: strict vs compatible Ed25519 verification',
    ],
  },
  'x25519-twist': {
    title: 'X25519 Twist / Low-Order Demo',
    description: 'Curve25519 is twist-secure: bogus x-coordinates land on the quadratic twist, whose order 4*t\u2032 (t\u2032 prime) is also nearly prime, so an attacker harvests at most a few bits (small-subgroup confinement) instead of a full break. Twist-security stops applying where use is contributory or authenticated, scalars skip clamping, or low-order outputs go unchecked (Lim-Lee style confinement across sessions). The demo checks curve-vs-twist membership with a Legendre symbol, runs ECDH against the entered peer (noble rejects low-order/torsion inputs), replays the bundled low-order keys, and closes with a legit Alice/Bob control.\n\nCofactor/KDF note: never use raw ECDH output as a key — feed it through a KDF (e.g. HKDF-SHA256), and treat all-zero output as abort, not as a session key.',
    whenToUse: 'You received an X25519 peer key of dubious origin and want to see whether it sits on the curve, the twist, or the torsion subgroup — or to demonstrate why low-order checks matter.',
    algorithm: [
      'Decode the 32-byte little-endian peer u',
      'Compute f(u) = u^3 + 486662u^2 + u mod p and its Legendre symbol (1: curve, -1: twist, 0: degenerate)',
      'Attempt ECDH and report accept (shared-secret prefix) vs reject (torsion message)',
      'Replay the bundled low-order peers (u=0 order-2, u=1 order-4) — both must reject',
      'Run a legit Alice/Bob exchange as the MATCH control',
    ],
    python: `# Pure-Python X25519 twist membership + low-order demo (RFC 7748 ladder).
P = 2**255 - 19
A = 486662

def x25519(k, u):
    x1 = u
    x2, z2, x3, z3 = 1, 0, u, 1
    swap = 0
    for t in range(254, -1, -1):
        kt = (k >> t) & 1
        swap ^= kt
        if swap: x2, x3, z2, z3 = x3, x2, z3, z2
        swap = kt
        a = (x2 + z2) % P; aa = a*a % P
        b = (x2 - z2) % P; bb = b*b % P
        e = (aa - bb) % P
        c = (x3 + z3) % P; d = (x3 - z3) % P
        da, cb = d*a % P, c*b % P
        x3 = pow((da + cb) % P, 2, P)
        z3 = pow((da - cb) % P, 2, P) * x1 % P
        x2 = aa*bb % P
        z2 = e * ((aa + 121665*e) % P) % P
    return x2 * pow(z2, P-2, P) % P

def legendre(u):
    f = (u*u*u + A*u*u + u) % P
    if f == 0: return 0
    return 1 if pow(f, (P-1)//2, P) == 1 else -1

print("u=9:", legendre(9), "(1 = on curve)")
ka = ((0x11*171) & ~(1 | 2 | 4 | (1 << 255))) | (1 << 254)  # clamped
kb = ((0x22*171) & ~(1 | 2 | 4 | (1 << 255))) | (1 << 254)
pa, pb = x25519(ka, 9), x25519(kb, 9)
print("alice/bob match:", x25519(ka, pb) == x25519(kb, pa))
print("low-order u=0 zeros:", x25519(ka, 0) == 0, "u=1 zeros:", x25519(ka, 1) == 0)`,
    references: [
      'Bernstein, "Curve25519: New Diffie-Hellman Speed Records" (2006) — twist-security rationale',
      'RFC 7748 §4-5: X25519 function, clamping, and contributory behaviour',
      'Lim & Lee, "A Key Recovery Attack on Discrete Log-based Schemes" (1997) — small-subgroup confinement',
    ],
  },
};
