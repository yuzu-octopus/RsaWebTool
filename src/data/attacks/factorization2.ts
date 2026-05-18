import type { Attack } from '../../types';
import { gcd } from '../../utils/bigint';

export const factorization2Attacks: Attack[] = [
  {
    id: 'squfof',
    name: 'SQUFOF',
    category: 'Factorization',
    description: 'Square Forms Factorization. Faster than Pollard rho for certain semiprimes.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Shanks' Square Forms Factorization (SQUFOF)
def squfof(n):
    if n.is_square():
        return isqrt(n), isqrt(n)

    # Find non-residue
    D = 0
    for k in [1, 3, 5, 7, -1, -3, -5, -7]:
        if kronecker(k, n) == -1:
            D = k * n
            break
    if D == 0:
        D = n

    sqrtD = isqrt(D)
    Po = isqrt(sqrtD)
    P = Po
    Q = 1
    Qprev = 1

    # Step 1: find square form
    limit = 2 * isqrt(isqrt(n)) + 2
    for i in range(limit):
        b = (sqrtD + P) // Q
        Pnew = b * Q - P
        Qnew = D - Pnew^2
        Qnew //= Q
        if i % 2 == 0 and Q.is_square():
            # Step 2: compute inverse root
            q = isqrt(Q)
            if (sqrtD - P) % q == 0:
                b = (sqrtD - P) // q
                P = b * q + P
                Qprev = q
                # Step 3: find factor
                for j in range(limit):
                    b = (sqrtD + P) // Qprev
                    Pnew = b * Qprev - P
                    Qnew = D - Pnew^2
                    Qnew //= Qprev
                    if P == Pnew:
                        g = gcd(Qprev, n)
                        if 1 < g < n:
                            return g, n // g
                        break
                    Qprev = Qnew
                    P = Pnew
                break
        Qprev = Q
        Q = Qnew
        P = Pnew
    return None

result = squfof(n)
if result:
    p, q = result
    print(f"p = {p}")
    print(f"q = {q}")
    print(f"Verification: p * q = {p * q}")
else:
    print("SQUFOF did not find a factor. Try a different method.")
`,
    proof: `\\textbf{Theorem:} SQUFOF factors a composite integer n by finding a square form in the cycle of reduced binary quadratic forms of discriminant D = kn.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n — composite integer to factor (semiprime works best)
\\item k — multiplier with \\left(\\frac{k}{n}\\right) = -1 (Kronecker symbol)
\\item D = kn — discriminant of the binary quadratic forms
\\item Reduction operator \\rho(a, b, c) = (c, b', (b'^2 - D)/(4c)) where b' \\equiv -b \\pmod{2c}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n = pq, \\quad \\left(\\frac{k}{n}\\right) &= -1, \\quad D = kn \\\\
f(x, y) = ax^2 + bxy + cy^2, \\quad D &= b^2 - 4ac \\\\
\\rho(a, b, c) &= \\left(c,\\; b' \\bmod 2c,\\; \\frac{b'^2 - D}{4c}\\right), \\quad |b'| \\leq \\sqrt{D} \\\\
(a_0, b_0, c_0) &\\xrightarrow{\\rho} (a_1, b_1, c_1) \\xrightarrow{\\rho} \\cdots \\xrightarrow{\\rho} (a_L, b_L, c_L) = (a_0, b_0, c_0) \\\\
\\exists i: c_i &= q^2 \\text{ (perfect square)} \\\\
\\text{Let } s = \\sqrt{c_i}, \\quad (a', b', s^2) &\\xrightarrow{\\rho^{\\text{inv}}} \\cdots \\xrightarrow{\\rho} (s, b^*, s) \\\\
\\gcd(s, n) &= p \\text{ or } q \\\\
\\text{Runtime: } O(n^{1/4}) &
\\end{align*}

\\textbf{Explanation:} SQUFOF traverses the cycle of reduced binary quadratic forms of discriminant D = kn. When a form with a square coefficient c is found, the inverse square root is computed and the cycle is continued until a factor emerges via GCD.

\\textbf{References:} D. Shanks, "SQUFOF: A Quadratic Form Factorization Algorithm", 1975; Gower & Wagstaff, "Square Form Factorization", Mathematics of Computation, 2008`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'binary-poly-factor',
    name: 'Binary Polynomial Factoring',
    category: 'Factorization',
    description: 'Converts n to binary polynomial, factors over ZZ, evaluates at x=2.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Binary polynomial factorization
# Convert n to polynomial: n = sum(b_i * 2^i) -> f(x) = sum(b_i * x^i)
bits = n.bits()
coeffs = n.digits(2)

R.<x> = PolynomialRing(ZZ)
f = sum(c * x^i for i, c in enumerate(coeffs))

print(f"Polynomial: f(x) = {f}")
print(f"Degree: {f.degree()}")
print(f"f(2) = {f(2)}")
print(f"f(2) == n: {f(2) == n}")
print()

# Factor the polynomial
factors = f.factor()
print(f"Factorization of f(x): {factors}")
print()

# Evaluate each factor at x=2
print("Evaluating factors at x=2:")
for factor, mult in factors:
    val = factor(2)
    print(f"  {factor}(2) = {val}")
    if mult > 1:
        print(f"    multiplicity: {mult}")

# Check if product of evaluations equals n
product = 1
for factor, mult in factors:
    product *= factor(2)^mult

print(f"\\nProduct of evaluations: {product}")
print(f"Original n: {n}")
print(f"Match: {product == n}")

if product == n:
    print("\\nPotential factors found:")
    for factor, mult in factors:
        val = factor(2)
        if val > 1:
            print(f"  {val} (is prime: {val.is_prime()})")
`,
    proof: `\\textbf{Theorem:} If n's binary polynomial f(x) factors over \\mathbb{Z}[x] as f(x) = g(x)h(x), then n = g(2)h(2).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n — integer to factor, with binary digits b_i \\in \\{0, 1\\}
\\item f(x) = \\sum b_i x^i \\in \\mathbb{Z}[x] — polynomial with f(2) = n
\\item Unique factorization in \\mathbb{Z}[x]
\\item Evaluation homomorphism \\text{ev}_2: \\mathbb{Z}[x] \\to \\mathbb{Z}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= \\sum_{i=0}^{k} b_i 2^i, \\quad b_i \\in \\{0, 1\\} \\\\
f(x) &= \\sum_{i=0}^{k} b_i x^i \\in \\mathbb{Z}[x], \\quad f(2) = n \\\\
f(x) &= g_1(x)^{e_1} g_2(x)^{e_2} \\cdots g_r(x)^{e_r} \\\\
n = f(2) &= g_1(2)^{e_1} g_2(2)^{e_2} \\cdots g_r(2)^{e_r} \\\\
\\exists i: g_i(2) &= p \\text{ or } q \\quad \\text{(when factorization aligns)} \\\\
\\text{Test each } g_i(2) &\\text{ for divisibility of } n
\\end{align*}

\\textbf{Explanation:} Convert n to a polynomial by treating its binary digits as coefficients. Factor this polynomial over the integers, then evaluate each factor at x=2. If the polynomial factorization aligns with the integer factorization, the evaluations reveal p and q. Works best when p and q have structured binary patterns.

\\textbf{References:} Coppersmith, "Finding a Small Root of a Univariate Modular Equation", 1996; von zur Gathen & Gerhard, "Modern Computer Algebra", Chapter 5`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'small-fraction',
    name: 'Small Fraction Attack',
    category: 'Factorization',
    description: 'When p/q is close to a small rational a/b. Uses Coppersmith to recover factors.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Small fraction attack: p/q ≈ a/b for small a, b
# Search over small denominators and use Coppersmith
print(f"Searching for small fraction approximation of p/q...")
print(f"n = {n}")
print()

found = False
max_den = 1000

for b in range(1, max_den + 1):
    for a in range(1, b + 1):
        if gcd(a, b) != 1:
            continue
        # p/q ≈ a/b => p ≈ a*q/b => n = p*q ≈ a*q²/b => q ≈ sqrt(n*b/a)
        q_approx = isqrt(n * b // a)
        if q_approx <= 1:
            continue
        # Use Coppersmith to find q near q_approx
        # q = q_approx + x where |x| is small
        P.<x> = PolynomialRing(Zmod(n))
        f = q_approx + x
        bound = ZZ(q_approx^0.3)
        try:
            roots = f.small_roots(X=bound, beta=0.5)
            for root in roots:
                q_candidate = q_approx + int(root)
                if q_candidate > 1 and n % q_candidate == 0:
                    q = Integer(q_candidate)
                    p = n // q
                    print(f"Found! a/b = {a}/{b}")
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print(f"p/q = {float(p)/float(q):.10f}")
                    print(f"a/b = {float(a)/float(b):.10f}")
                    print(f"Verification: p * q = {p * q}")
                    found = True
                    break
        except:
            pass
        if found:
            break
    if found:
        break

if not found:
    print(f"No small fraction found with denominator up to {max_den}.")
    print("p/q may not be close to a small rational.")
`,
    proof: `\\textbf{Theorem:} If p/q \\approx a/b for small a, b, then q \\approx \\sqrt{nb/a} and Coppersmith recovers q from the approximation.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq — RSA modulus with p \\leq q
\\item a, b — small integers such that p/q \\approx a/b
\\item q_0 = \\lfloor\\sqrt{nb/a}\\rfloor — initial approximation of q
\\item Coppersmith bound: |x| < n^{1/4} for modular root finding
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\frac{p}{q} &\\approx \\frac{a}{b}, \\quad \\gcd(a, b) = 1 \\\\
n = pq &\\approx \\frac{a}{b} q^2 \\\\
q &\\approx \\sqrt{\\frac{nb}{a}} = q_0 \\\\
q &= q_0 + x, \\quad |x| \\ll q_0 \\\\
f(x) = q_0 + x &\\equiv 0 \\pmod{q} \\\\
\\text{Coppersmith: } |x| &< q^{\\beta^2} = q^{0.25} \\approx n^{1/4} \\\\
\\text{Search: } 1 \\leq b &\\leq B, \\quad 1 \\leq a \\leq b \\\\
\\text{Complexity: } O(B^2 &\\cdot \\text{poly}(\\log n))
\\end{align*}

\\textbf{Explanation:} When the ratio p/q is close to a small rational a/b, we can approximate q as \\sqrt{nb/a}. Coppersmith's method then finds the small correction x such that q = q_0 + x. The search iterates over small denominators b up to a bound.

\\textbf{References:} Coppersmith, "Finding a Small Root of a Univariate Modular Equation", Eurocrypt 1996; May, "Using Coppersmith's Method to Attack RSA", 2009`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'batch-gcd',
    name: 'Batch GCD',
    category: 'Factorization',
    description: 'Compute pairwise GCD across multiple moduli. Finds shared primes.',
    inputs: [
      { name: 'n_values', label: 'Moduli (one per line or comma-separated)', placeholder: 'n1\\nn2\\nn3...', multiline: true, rows: 5 },
    ],
    sageTemplate: (vals: Record<string, string>) => `# Batch GCD: find shared prime factors across multiple moduli
n_list_str = """${vals.n_values}"""

# Parse input
import re
n_list = [Integer(x.strip()) for x in re.split(r'[\\n,]+', n_list_str.strip()) if x.strip()]

print(f"Processing {len(n_list)} moduli...")
print()

# Compute product of all moduli
product = prod(n_list)

# Batch GCD using product tree
for i, n in enumerate(n_list):
    if n <= 1:
        print(f"n[{i}] = {n}: invalid")
        continue

    # Compute product of all other moduli
    others_product = product // n

    # GCD of n with product of all others
    g = gcd(n, others_product)

    if g > 1 and g < n:
        p = g
        q = n // g
        print(f"n[{i}] = {n}")
        print(f"  Shared factor found: p = {p}")
        print(f"  q = {q}")
        print(f"  Verification: p * q = {p * q}")
        print()
    elif g == n:
        print(f"n[{i}] = {n}")
        print(f"  WARNING: n divides product of others (duplicate or fully shared)")
        print()
    else:
        print(f"n[{i}] = {n}: no shared factors detected")

print()
print("Batch GCD complete.")
`,
    frontendCheck: async (vals: Record<string, string>) => {
      try {
        const raw = (vals.n_values || '').trim();
        if (!raw) return null;

        const moduli = raw.split(/[\n,]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => BigInt(s));

        if (moduli.length < 2) {
          return 'Need at least 2 moduli for Batch GCD attack.';
        }

        let product = 1n;
        for (const n of moduli) {
          product *= n;
        }

        const lines: string[] = [
          `Batch GCD Attack (browser-side, BigInt)`,
          `Processing ${moduli.length} moduli...`,
          ``,
        ];

        let foundAny = false;

        for (let i = 0; i < moduli.length; i++) {
          const n = moduli[i];
          if (n <= 1n) continue;

          const others = product / n;
          const g = gcd(n, others);

          if (g > 1n && g < n) {
            foundAny = true;
            const p = g;
            const q = n / g;
            lines.push(`n[${i}] = ${n}`);
            lines.push(`  Shared factor found: p = ${p}`);
            lines.push(`  q = ${q}`);
            lines.push(`  Verification: p * q = ${p * q}`);
            lines.push('');
          } else if (g === n) {
            lines.push(`n[${i}] = ${n}`);
            lines.push(`  WARNING: n divides product of others (duplicate or fully shared)`);
            lines.push('');
          }
        }

        if (!foundAny) {
          lines.push('No shared factors found among the provided moduli.');
          lines.push('');
        }

        lines.push('Batch GCD complete.');
        return lines.join('\n');
      } catch {
        return null;
      }
    },
    proof: `\\textbf{Theorem:} Given moduli \\{n_1, \\ldots, n_k\\}, if any two share a prime, \\gcd(n_i, \\prod_{j \\neq i} n_j) reveals it.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item \\{n_1, \\ldots, n_k\\} — set of RSA moduli, n_i = p_i q_i
\\item Shared prime: p_i = p_j for some i \\neq j
\\item Product tree for efficient computation of \\prod_{j \\neq i} n_j \\bmod n_i
\\item Euclidean GCD: O(\\log^2(\\max(a, b)))
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n_i &= p_i q_i, \\quad i = 1, \\ldots, k \\\\
p_1 = p_2 = p &\\implies p \\mid n_1 \\land p \\mid n_2 \\\\
p &\\mid \\gcd(n_1, n_2) \\\\
g_i = \\gcd\\left(n_i, \\prod_{j \\neq i} n_j\\right) & \\\\
g_i > 1 &\\implies g_i \\text{ is a shared prime factor} \\\\
\\text{Product tree: } T &= \\text{tree}(n_1, \\ldots, n_k), \\quad \\text{depth } O(\\log k) \\\\
\\text{Time: } O(M(k \\log N) &\\log k) \\quad \\text{vs } O(k^2) \\text{ pairwise}
\\end{align*}

\\textbf{Explanation:} If two RSA moduli share a prime factor, computing the GCD of each modulus against the product of all others exposes the shared factor. A product tree makes this efficient — O(k \\log k) instead of O(k^2) pairwise comparisons.

\\textbf{References:} Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012; Bernstein, "How to Find Small Factors of Products", 2004`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => {
      const vals = (p.n_values || '').trim();
      if (!vals) return false;
      return vals.split(/[\n,]+/).filter(x => x.trim()).length >= 2;
    },
  },
  {
    id: 'multi-prime',
    name: 'Multi-Prime RSA',
    category: 'Factorization',
    description: 'When n = p_1 × p_2 × ... × p_r with more than 2 primes. Factors using built-in methods.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Multi-prime RSA factorization
print(f"Attempting multi-prime factorization of n = {n}")
print(f"Number of digits: {n.nbits() / 3.32:.0f}")
print()

# Use Sage's built-in factorization
factors = factor(n)
print(f"Factorization: {factors}")
print()

prime_factors = []
for p, mult in factors:
    p = Integer(p)
    for _ in range(mult):
        prime_factors.append(p)

prime_factors.sort()
print(f"Number of prime factors: {len(prime_factors)}")
print()

if len(prime_factors) > 2:
    print("Multi-prime RSA detected!")
    print(f"n = {' × '.join(str(p) for p in prime_factors)}")
    print()
    print("Individual primes:")
    for i, p in enumerate(prime_factors):
        print(f"  p[{i+1}] = {p} ({p.nbits()} bits, prime: {p.is_prime()})")
    print()

    # Compute phi(n) for multi-prime (handles repeated factors)
    from collections import Counter
    factor_counts = Counter(prime_factors)
    phi = 1
    for p, k in factor_counts.items():
        phi *= p^(k-1) * (p - 1)
    print(f"phi(n) = {phi}")
else:
    print("Standard 2-prime RSA.")
    if len(prime_factors) == 2:
        p, q = prime_factors
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"phi(n) = {(p-1)*(q-1)}")
`,
    proof: `\\textbf{Theorem:} Multi-prime RSA uses n = \\prod_{i=1}^{r} p_i with r > 2 primes and \\varphi(n) = \\prod (p_i - 1).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = p_1 p_2 \\cdots p_r — product of r \\geq 3 distinct primes
\\item Euler's totient: \\varphi(n) = \\prod_{i=1}^{r} (p_i - 1)
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}
\\item CRT decryption: m_i = c^d \\bmod p_i, then combine
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p_1 p_2 \\cdots p_r, \\quad r \\geq 3 \\\\
\\varphi(n) &= \\prod_{i=1}^{r} \\varphi(p_i) = \\prod_{i=1}^{r} (p_i - 1) \\\\
ed &\\equiv 1 \\pmod{\\varphi(n)} \\\\
m &= c^d \\bmod n \\\\
m_i &= c^d \\bmod p_i, \\quad i = 1, \\ldots, r \\\\
m &= \\text{CRT}(m_1, \\ldots, m_r; p_1, \\ldots, p_r) \\\\
p_i &\\approx n^{1/r} \\implies \\text{ECM, QS more effective}
\\end{align*}

\\textbf{Explanation:} Multi-prime RSA splits n into more than two primes for faster CRT-based decryption. However, each prime is smaller (n^{1/r} bits), making factorization easier. For a 2048-bit modulus with r=3, each prime is only ~683 bits.

\\textbf{References:} Simmons & Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", 1976; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'gimmicky-primes',
    name: 'Gimmicky Primes',
    category: 'Factorization',
    description: 'Checks for Mersenne, primorial, Fibonacci, and other special-form primes.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"Checking for gimmicky/special-form prime factors of n = {n}")
print()

found = False

# 1. Mersenne primes: 2^p - 1
print("Checking Mersenne primes (2^p - 1)...")
for p in [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]:
    mersenne = 2^p - 1
    if n % mersenne == 0:
        print(f"  Found Mersenne prime factor: 2^{p} - 1 = {mersenne}")
        print(f"  Cofactor: {n // mersenne}")
        found = True

# 2. Primorial primes: p# +/- 1
print("\\nChecking primorial primes (p# ± 1)...")
primes_list = list(prime_range(2, 200))
primorial = 1
for p in primes_list:
    primorial *= p
    for sign in [1, -1]:
        candidate = primorial + sign
        if candidate > 1 and n % candidate == 0:
            print(f"  Found primorial prime factor: {candidate} = {p}# {'+' if sign == 1 else '-'} 1")
            print(f"  Cofactor: {n // candidate}")
            found = True

# 3. Fermat primes: 2^(2^k) + 1
print("\\nChecking Fermat primes (2^(2^k) + 1)...")
for k in range(0, 5):
    fermat = 2^(2^k) + 1
    if n % fermat == 0:
        print(f"  Found Fermat prime factor: 2^(2^{k}) + 1 = {fermat}")
        print(f"  Cofactor: {n // fermat}")
        found = True

# 4. Fibonacci primes
print("\\nChecking Fibonacci primes...")
fib_primes = [2, 3, 5, 13, 89, 233, 1597, 28657, 514229, 433494437, 2971215073]
for fib in fib_primes:
    if n % fib == 0:
        print(f"  Found Fibonacci prime factor: {fib}")
        print(f"  Cofactor: {n // fib}")
        found = True

# 5. Repunit primes: (10^p - 1) / 9
print("\\nChecking repunit primes...")
for p in [2, 19, 23, 317, 1031]:
    try:
        repunit = (10^p - 1) // 9
        if n % repunit == 0:
            print(f"  Found repunit prime factor: R({p}) = {repunit}")
            print(f"  Cofactor: {n // repunit}")
            found = True
    except:
        pass

if not found:
    print("No gimmicky prime factors found.")
    print("The factors are likely standard randomly-generated primes.")
`,
    proof: `\\textbf{Theorem:} Special-form primes (Mersenne, primorial, Fermat, Fibonacci, repunit) appear in small known lists and can be tested by direct divisibility.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq — RSA modulus to test
\\item Mersenne: M_p = 2^p - 1 (51 known as of 2024)
\\item Primorial: p\\# \\pm 1 where p\\# = \\prod_{q \\leq p} q
\\item Fermat: F_k = 2^{2^k} + 1 (only 5 known: k = 0..4)
\\item Fibonacci: F_n prime (very few known)
\\item Repunit: R_n = (10^n - 1)/9
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p \\cdot q, \\quad p \\in \\mathcal{S} \\text{ (special-form set)} \\\\
\\mathcal{S} &= \\{M_{p_1}, \\ldots\\} \\cup \\{p\\# \\pm 1\\} \\cup \\{F_0, \\ldots, F_4\\} \\cup \\{\\text{Fib primes}\\} \\cup \\{R_n\\} \\\\
|\\mathcal{S}| &\\ll 100 \\quad \\text{(very small)} \\\\
n \\bmod s &= 0, \\quad s \\in \\mathcal{S} \\\\
\\text{If } n \\bmod s = 0 &\\implies s \\mid n, \\quad q = n/s \\\\
\\text{Cost: } O(|\\mathcal{S}| \\cdot \\log^2 n) &
\\end{align*}

\\textbf{Explanation:} Some CTF challenges use primes with recognizable mathematical structure. Since the total number of known special-form primes is very small, testing divisibility against all of them is fast. This exploits poor randomness in CTF key generation.

\\textbf{References:} Caldwell, "The Prime Pages" (primes.utm.edu); Ribenboim, "The New Book of Prime Number Records", 1996`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'close-prime',
    name: 'Close-Prime (Londahl)',
    category: 'Factorization',
    description: 'Optimized Fermat for primes with specific gap structure. Extended iteration limit.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Close-prime attack (Londahl variant of Fermat)
# Optimized for primes with structured gaps
print(f"Close-prime attack on n = {n}")
print()

a = isqrt(n) + 1
b2 = a^2 - n

# Extended iteration limit for larger prime gaps
max_iter = 10**7  # Much larger than standard Fermat
print(f"Max iterations: {max_iter}")

for i in range(max_iter):
    if b2.is_square():
        b = isqrt(b2)
        p = a - b
        q = a + b
        if p * q == n:
            print(f"Factor found after {i+1} iterations!")
            print(f"p = {p}")
            print(f"q = {q}")
            print(f"|p - q| = {q - p}")
            print(f"Verification: p * q = {p * q}")
            break
    a += 1
    b2 = a^2 - n
else:
    print(f"Close-prime attack failed after {max_iter} iterations.")
    print("The prime gap may be too large. Try a different method.")
`,
    proof: `\\textbf{Theorem:} Fermat factorization extended with larger iteration bounds handles structured prime gaps up to O(n^{1/3}).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq — RSA modulus with p \\leq q
\\item a = (p + q)/2, b = (q - p)/2
\\item a_0 = \\lceil\\sqrt{n}\\rceil — starting point
\\item Gap: |p - q| determines iterations needed
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= pq = (a - b)(a + b) = a^2 - b^2 \\\\
a &= \\frac{p + q}{2}, \\quad b = \\frac{q - p}{2} \\\\
a_0 &= \\lceil\\sqrt{n}\\rceil \\\\
a_{i+1} &= a_i + 1, \\quad b_i^2 = a_i^2 - n \\\\
b_i^2 &= \\square \\implies b = \\sqrt{b_i^2}, \\quad p = a - b, \\quad q = a + b \\\\
\\text{Iterations: } b &= \\frac{|q - p|}{2} \\\\
\\text{Standard: } b < n^{1/4}, \\quad \\text{Extended: } b &< n^{1/3} \\\\
\\text{Runtime: } O(|p - q|) &
\\end{align*}

\\textbf{Explanation:} The close-prime attack is Fermat factorization with an extended iteration limit. It works when |p - q| is small enough that iterating from \\sqrt{n} finds a perfect square within the bound. The Londahl variant increases the bound to handle larger gaps.

\\textbf{References:} Londahl, "Close-Prime Factorization", CTF writeup; Menezes et al., "Handbook of Applied Cryptography", Algorithm 3.21`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'novelty-primes',
    name: 'Novelty Primes',
    category: 'Factorization',
    description: 'Checks if n contains primes reused from previous CTF challenges.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Novelty primes: check against known CTF challenge primes
print(f"Checking n = {n} against known CTF primes...")
print()

# Known primes from popular CTF challenges
# These are primes that have been reused across multiple CTF problems
known_ctf_primes = [
    # Common weak primes used in CTFs
    # (In practice, these would be populated from a database of CTF challenges)
    # Example: primes from CSAW, DEF CON, Plaid CTF, etc.
    # The list below is illustrative
]

# Also check primes that are "almost" common values
# e.g., primes close to powers of 2
print("Checking primes near powers of 2...")
for bits in [64, 128, 256, 512, 1024, 2048]:
    target = 2^bits
    # Search in a small window
    for delta in range(-1000, 1000):
        candidate = target + delta
        if candidate > 1 and candidate.is_prime():
            if n % candidate == 0:
                print(f"  Found prime near 2^{bits}: {candidate}")
                print(f"  Cofactor: {n // candidate}")
                print(f"  Verification: {candidate} * {n // candidate} = {n}")

# Check primes near common constants
print("\\nChecking primes near common constants...")
# Use Sage's high-precision real field
RF = RealField(200)
constants = [
    ("pi", Integer(str(RF(pi()).str(digits=60)).replace('.', '')[:55])),
    ("e", Integer(str(RF(exp(1)).str(digits=60)).replace('.', '')[:55])),
    ("sqrt(2)", Integer(str(RF(2).sqrt().str(digits=60)).replace('.', '')[:55])),
]

for name, const in constants:
    for delta in range(-100, 100):
        candidate = const + delta
        if candidate > 1 and candidate.is_prime():
            if n % candidate == 0:
                print(f"  Found prime near {name}: {candidate}")
                print(f"  Cofactor: {n // candidate}")

# Check against known primes
if known_ctf_primes:
    print("\\nChecking against known CTF primes...")
    for kp in known_ctf_primes:
        kp = Integer(kp)
        if n % kp == 0:
            print(f"  Found known CTF prime: {kp}")
            print(f"  Cofactor: {n // kp}")

print("\\nNovelty prime check complete.")
`,
    proof: `\\textbf{Theorem:} CTF challenges may reuse primes from previous problems or use primes near structured values, enabling factorization by database lookup.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = pq — RSA modulus to test
\\item \\mathcal{P} = \\{p_1, \\ldots, p_m\\} — database of known CTF primes
\\item Structured candidates: 2^k + \\delta, \\text{constant} + \\delta for small |\\delta|
\\item Primality test (Miller-Rabin) for candidate verification
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\mathcal{P} &= \\{p_1, \\ldots, p_m\\} \\quad \\text{(known CTF primes)} \\\\
n \\bmod p_i &= 0 \\implies p_i \\mid n, \\quad q = n/p_i \\\\
p &\\approx 2^k + \\delta, \\quad |\\delta| \\leq W \\\\
p &\\approx C + \\delta, \\quad C \\in \\{\\pi, e, \\sqrt{2}, \\ldots\\} \\\\
\\text{Candidate } c &= C + \\delta, \\quad \\text{isPrime}(c) \\land (n \\bmod c = 0) \\\\
\\text{Cost: } O(m \\log^2 n + W \\cdot \\text{primality}) &
\\end{align*}

\\textbf{Explanation:} CTF challenges sometimes reuse primes or generate primes near recognizable values (powers of 2, mathematical constants). Checking divisibility against a database of known primes and searching small windows around structured values can quickly factor such moduli.

\\textbf{References:} Various CTF writeups; cryptohack.org challenges; RSA CTF problem databases`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
];
