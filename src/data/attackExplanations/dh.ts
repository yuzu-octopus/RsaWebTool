import type { AttackExplanationData } from '../../components/calculator/AttackExplanationPanel';

/* ───────── Proof (rendered in Explanation tab) ─────────
 * NOTE: The Explanation tab is rich JSX (protocol diagram, MODP table)
 * rather than a LaTeX string — the data file exports the tab content shape
 * indirectly via the DHExplanationTab component, which lives in
 * components/calculator/DHExplanationTab.tsx. This file is for the
 * Attacks tab data only.
 */

export const DH_ATTACKS = [
  { value: 'small-subgroup', label: 'Small Subgroup Confinement' },
  { value: 'pohlig-hellman', label: 'Pohlig-Hellman DLP' },
  { value: 'lim-lee', label: 'Lim–Lee Active Recovery (simulated)' },
  { value: 'bounded-dlp', label: 'Bounded DLP — Kangaroo (demo)' },
  { value: 'x25519-weak-key', label: 'X25519 Weak Peer Key Check' },
  { value: 'logjam-downgrade', label: 'Logjam / Export Downgrade (info)' },
  { value: 'dsa-params', label: 'DSA-Style (p, q, g) Validation' },
  { value: 'general-dlp', label: 'General Discrete Log — SageCell' },
];

export const DH_ATTACK_EXPLANATIONS: Record<string, AttackExplanationData> = {
  'small-subgroup': {
    title: 'Small Subgroup Confinement',
    description: 'When the group order p-1 has small factors, an attacker can confine the shared secret to a small subgroup. The server doesn\'t validate that public keys lie in the large subgroup, allowing the attacker to learn the private key modulo each small prime power. Reference script below is sympy; the Run button executes the equivalent in-browser TypeScript port.',
    whenToUse: 'When the DH parameters (p, g) are such that p-1 has known small factors and the server does not validate that received public keys are in the correct subgroup. Needs the victim key to be static across probes for full recovery.',
    algorithm: [
      '1. Trial-divide p-1 up to 10^5 into prime powers q_i = r_i^{e_i}',
      '2. For each prime power q, project into the order-q subgroup:',
      '     g\' = g^{(p-1)/q} mod p',
      '     y\' = y^{(p-1)/q} mod p',
      '3. Recover x mod q by Pohlig-Hellman digit lifting (BSGS per digit, O(e*sqrt(r)))',
      '4. CRT combines residues into x modulo the smooth part M; this equals the full',
      '   private key only when M covers p-1, otherwise it is a partial recovery',
    ],
    python: `from sympy import factorint
from gmpy2 import isqrt, mpz

def subgroup_confinement(p, g, y):
    """Recover DH private key via small subgroup confinement."""
    factors = factorint(p - 1)
    residues = []
    moduli = []

    for prime, exp in factors.items():
        order = prime ** exp
        exp_factor = (p - 1) // order
        g_sub = pow(g, exp_factor, p)
        y_sub = pow(y, exp_factor, p)

        # BSGS in subgroup
        m = isqrt(order) + 1
        table = {}
        power = 1
        for j in range(m):
            table[power] = j
            power = (power * g_sub) % p

        factor = pow(g_sub, -m, p)
        gamma = y_sub
        for i in range(m):
            if gamma in table:
                x_sub = i * m + table[gamma]
                residues.append(x_sub % order)
                moduli.append(order)
                break
            gamma = (gamma * factor) % p

    from sympy.ntheory.modular import crt
    result, _ = crt(moduli, residues)
    return result`,
    references: [
      '• Lim & Lee, "A key recovery attack on discrete log-based schemes using a prime order subgroup" (1997)',
      '• Handbook of Applied Cryptography, §3.6.4',
    ],
  },
  'pohlig-hellman': {
    title: 'Pohlig-Hellman DLP',
    description: 'When p-1 is smooth (all prime factors are small), the Discrete Logarithm Problem can be solved efficiently by decomposing it into smaller subgroups. This is the classic Pohlig-Hellman algorithm. Reference script below is sympy; the Run button executes the equivalent in-browser TypeScript port.',
    whenToUse: 'When p-1 factors into small primes (smooth group order). Pohlig-Hellman applies whenever p-1 is smooth; safe primes (p = 2q + 1) only remove the easy smooth case, so the large subgroup order q must still be big enough on its own.',
    algorithm: [
      '1. Trial-divide p-1 = prod q_i^{e_i} x R (R = unfactored remainder)',
      '2. For each prime power q_i^{e_i}:',
      '     g_i = g^{(p-1)/q_i^{e_i}} mod p',
      '     y_i = y^{(p-1)/q_i^{e_i}} mod p',
      '     Solve DLP in subgroup by digit lifting: x_i = dlog(g_i, y_i) mod q_i^{e_i}',
      '3. CRT combines x_i into x modulo the smooth part M (partial key when R > 1;',
      '   route the remainder to the Sage general-DLP entry)',
      'Complexity: O(sum e_i (sqrt(q_i) + log p)) vs O(sqrt(p))',
    ],
    python: `from sympy import factorint, discrete_log

def pohlig_hellman(p, g, y):
    """Recover DH private key via Pohlig-Hellman."""
    factors = factorint(p - 1)
    residues = []
    moduli = []

    for prime, exp in factors.items():
        order = prime ** exp
        exp_factor = (p - 1) // order
        g_sub = pow(g, exp_factor, p)
        y_sub = pow(y, exp_factor, p)

        x_sub = discrete_log(p, y_sub, g_sub)
        residues.append(x_sub)
        moduli.append(order)

    from sympy.ntheory.modular import crt
    result, _ = crt(moduli, residues)
    return result`,
    references: [
      '• Pohlig & Hellman, "An improved algorithm for computing logarithms over GF(p) and its cryptographic significance" (1978)',
      '• Handbook of Applied Cryptography, §3.6.3',
    ],
  },
  'general-dlp': {
    title: 'General Discrete Log - SageCell',
    description: 'When the group order is not smooth, generic DLP algorithms are required. SageMath\'s discrete_log function combines Pohlig-Hellman with Pollard\'s rho algorithm, falling back to BSGS for small subgroups. Reference script below is the sympy equivalent; the Run button executes the SageMath version (multiplicative operation \'*\', real-newline join) on SageCell.',
    whenToUse: 'When p-1 has at least one large prime factor, making small-subgroup attacks infeasible. Requires SageMath backend for the general-purpose discrete_log implementation. Enter p/y as hex, g as decimal — the builder converts each to the encoding Sage expects.',
    algorithm: [
      'SageMath\'s discrete_log uses:',
      '',
      '1. Factor p-1 via PARI\'s factorint',
      '2. For each prime power q^e, project to subgroup',
      '3. Use Pollard rho (O(sqrt(q))) for DLP in each subgroup',
      '4. Hensel lifting for higher exponents',
      '5. CRT to combine results',
      '',
      'SageMath is recommended over pure Python for general DLP',
      'because its PARI/GP backend is significantly faster.',
    ],
    python: `from sympy import discrete_log, isprime

def general_dlp(p, g, y):
    """Solve discrete log - uses Pohlig-Hellman
    + Pollard rho internally."""
    if not isprime(p):
        raise ValueError("p must be prime")

    x = discrete_log(p, y, g)
    # Verify
    assert pow(g, x, p) == y, "Verification failed"
    return x`,
    references: [
      '• Pollard, "Monte Carlo methods for index computation (mod p)" (1978)',
      '• SageMath documentation: discrete_log',
    ],
  },
  'lim-lee': {
    title: 'Lim–Lee Active Recovery (simulated)',
    description: 'An active attacker sends small-order generators g\' = g^((p-1)/r) and uses a key-confirmation oracle (e.g. a MAC verify) to test guesses for the confined secret, learning the static private key modulo each small prime power. This entry simulates the attack in-browser against a fresh static key. Reference script below is illustrative; the Run button executes the TypeScript simulation.',
    whenToUse: 'Preconditions: the victim key is static across probes, the peer accepts attacker-chosen public keys without subgroup validation, and a confirmation oracle exists. Ephemeral keys and validated subgroups both stop it.',
    algorithm: [
      '1. For each prime power q = r^e dividing p-1: send g\' = g^((p-1)/q)',
      '2. Victim computes s = g\'^x (confined to the order-q subgroup)',
      '3. Oracle-test guesses until s is confirmed → x mod q (digit lifting in-browser)',
      '4. CRT combines residues; full key only when the smooth part covers p-1',
    ],
    python: `def lim_lee(p, g, x_static, oracle):
    """Active small-subgroup recovery (needs static key + oracle)."""
    from sympy import factorint
    residues, moduli = [], []
    for prime, exp in factorint(p - 1).items():
        order = prime ** exp
        g_mal = pow(g, (p - 1) // order, p)
        s = pow(g_mal, x_static, p)
        # ... oracle-test guesses for s, lift digits, append x mod order
    from sympy.ntheory.modular import crt
    return crt(moduli, residues)`,
    references: [
      '• Lim & Lee, "A key recovery attack on discrete log-based schemes using a prime order subgroup" (1997)',
    ],
  },
  'bounded-dlp': {
    title: 'Bounded DLP — Pollard Kangaroo (demo)',
    description: 'When the private key is known to lie in an interval [a, b) — e.g. a biased RNG or a small nonce — the tame/wild kangaroo finds it in O(sqrt(b-a)) jumps. This demo searches [0, 2^20) in-browser; wider intervals are refused rather than hung. Reference script below is illustrative; the Run button executes the TypeScript kangaroo.',
    whenToUse: 'Precondition: a known narrow interval for x. Without an interval bound, generic DLP (Sage entry) is the tool.',
    algorithm: [
      '1. Tame herd walks from g^b with pseudorandom jumps, recording points',
      '2. Wild herd walks from y = g^x with the same jumps',
      '3. A collision g^{b+d_t} = g^{x+d_w} gives x = b + d_t - d_w',
      '4. Candidate verified by g^x = y before reporting',
    ],
    python: `def kangaroo(g, y, p, a, b):
    """Pollard kangaroo sketch (demo stores tame points)."""
    jumps = [pow(g, s, p) for s in steps(a, b)]
    tame = walk(pow(g, b, p), jumps)   # value -> distance
    x = collide(walk(y, jumps), tame, b)
    assert pow(g, x, p) == y
    return x`,
    references: [
      '• Pollard, "Monte Carlo methods for index computation (mod p)" (1978)',
      '• Teske, "Speeding up Pollard\'s rho method for computing discrete logarithms" (1998)',
    ],
  },
  'x25519-weak-key': {
    title: 'X25519 Weak Peer Key Check',
    description: 'RFC 7748 §6.1 lets implementations (MAY-level) reject weak peer public keys. The minimum this demo enforces: reject the all-zero u-coordinate, which would otherwise force a predictable shared secret. Low-order-point rejection is SHOULD-level and noted but not implemented here. Enter a 32-byte hex peer key in the y field.',
    whenToUse: 'Whenever accepting an X25519 peer key: always run the all-zero check; consider the full low-order-point list for strict contributory behaviour.',
    algorithm: [
      '1. Decode the hex peer key (must be exactly 32 bytes)',
      '2. Reject when every byte is zero (RFC 7748 §6.1 minimum)',
      '3. Otherwise accept, with a note that low-order checks are stricter',
    ],
    python: `def check_x25519_peer(u: bytes) -> None:
    """RFC 7748 section 6.1 minimum hygiene."""
    assert len(u) == 32, "peer key must be 32 bytes"
    if all(b == 0 for b in u):
        raise ValueError("reject: all-zero peer key")
    # Stricter: also reject known low-order points (SHOULD-level).`,
    references: [
      '• RFC 7748, §6.1 (X25519 security considerations)',
    ],
  },
  'logjam-downgrade': {
    title: 'Logjam / Export Downgrade (info)',
    description: 'Logjam downgraded TLS connections to 512-bit export DHE, then broke the DLP once per group and reused the precomputation against every connection sharing that group — amortising one expensive NFS sieving step over millions of sessions. This entry is informational: it shows the built-in 768-bit RFC 2412 Group 1 (labelled BREAKABLE, demo only) and explains why precomputation amortisation makes shared small groups fatal.',
    whenToUse: 'When auditing negotiated groups: reject export-grade and shared small MODP groups; prefer ECDHE or ≥ 2048-bit named groups (NIST 112-bit floor, SP 800-57).',
    algorithm: [
      '1. Attacker forces export-grade DHE (downgrade to a small shared group)',
      '2. One NFS precomputation per group (expensive once)',
      '3. Cheap per-connection descent breaks each session key (amortised)',
      'Lesson: group reuse turns one break into many; size + freshness both matter',
    ],
    python: `# Informational entry — no attack code runs.
# The 768-bit RFC 2412 Group 1 in this calculator exists so the
# transcript can show a concrete BREAKABLE group and its bit length.
print("reject groups below the NIST 112-bit floor (2048-bit MODP)")`,
    references: [
      '• Adrian et al., "Imperfect Forward Secrecy: How Diffie-Hellman Fails in Practice" (2015)',
      '• RFC 2412 (Oakley groups), RFC 3526 (MODP groups)',
      '• NIST SP 800-57 Part 1 (112-bit floor = 2048-bit finite-field)',
    ],
  },
  'dsa-params': {
    title: 'DSA-Style (p, q, g) Validation',
    description: 'Finite-field DSA (FIPS 186) works in a prime-order subgroup: q divides p-1 and g has order exactly q. Validating the triple blocks small-subgroup confinement at the parameter level. Enter p (hex), g (decimal), and q in the y field; both primality checks are Miller-Rabin in-browser.',
    whenToUse: 'Preconditions for safe use: q prime (FIPS 186: N ≥ 224 bits), q | (p-1), g^q = 1 mod p. Server-supplied or trapdoored parameters that skip these checks are a known attack direction — never trust group parameters you did not validate.',
    algorithm: [
      '1. Miller-Rabin primality check on p and q',
      '2. Check q divides p-1',
      '3. Check 1 < g < p and g^q = 1 mod p',
      '4. Report q bit length against the FIPS 186 N ≥ 224 floor',
    ],
    python: `def validate_dsa(p, q, g):
    """FIPS 186 style parameter validation."""
    assert isprime(q) and (p - 1) % q == 0
    assert 1 < g < p and pow(g, q, p) == 1
    return True`,
    references: [
      '• FIPS 186-5 (Digital Signature Standard)',
    ],
  },
};
