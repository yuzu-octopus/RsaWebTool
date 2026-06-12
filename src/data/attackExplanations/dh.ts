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
  { value: 'general-dlp', label: 'General Discrete Log — SageCell' },
];

export const DH_ATTACK_EXPLANATIONS: Record<string, AttackExplanationData> = {
  'small-subgroup': {
    title: 'Small Subgroup Confinement',
    description: 'When the group order p-1 has small factors, an attacker can confine the shared secret to a small subgroup. The server doesn\'t validate that public keys lie in the large subgroup, allowing the attacker to learn the private key modulo each small factor.',
    whenToUse: 'When the DH parameters (p, g) are such that p-1 has known small factors and the server does not validate that received public keys are in the correct subgroup.',
    algorithm: [
      '1. Compute p-1 and find all small prime factors',
      '2. For each small prime r, project y into subgroup of order r:',
      '     g\' = g^{(p-1)/r} mod p',
      '     y\' = y^{(p-1)/r} mod p',
      '3. Solve DLP in subgroup via BSGS (O(sqrt(r)))',
      '4. CRT reconstruct the private key from (x_i mod r_i)',
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
    description: 'When p-1 is smooth (all prime factors are small), the Discrete Logarithm Problem can be solved efficiently by decomposing it into smaller subgroups. This is the classic Pohlig-Hellman algorithm.',
    whenToUse: 'When p-1 factors into small primes (smooth group order). Standard MODP groups using safe primes (p = 2q + 1) are resistant to this attack.',
    algorithm: [
      '1. Factor p-1 = prod q_i^{e_i}',
      '2. For each prime power q_i^{e_i}:',
      '     g_i = g^{(p-1)/q_i^{e_i}} mod p',
      '     y_i = y^{(p-1)/q_i^{e_i}} mod p',
      '     Solve DLP in subgroup: x_i = dlog(g_i, y_i) mod q_i^{e_i}',
      '3. CRT: x = CRT(x_1, x_2, ..., x_k)',
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
    description: 'When the group order is not smooth, generic DLP algorithms are required. SageMath\'s discrete_log function combines Pohlig-Hellman with Pollard\'s rho algorithm, falling back to BSGS for small subgroups.',
    whenToUse: 'When p-1 has at least one large prime factor, making small-subgroup attacks infeasible. Requires SageMath backend for the general-purpose discrete_log implementation.',
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
};
