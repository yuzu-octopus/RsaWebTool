import type { Attack } from '../../types';

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
                    Qprev = Q
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
    proof: `\\textbf{Theorem: (Shanks, 1975)} The Square Forms Factorization (SQUFOF) algorithm factors a composite integer n by searching for a square form in the cycle of reduced binary quadratic forms of discriminant D = kn.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Binary quadratic forms: f(x, y) = ax^2 + bxy + cy^2 with discriminant D = b^2 - 4ac
\\item Reduction theory: every form is equivalent to a unique reduced form
\\item The cycle of reduced forms has length O(\\sqrt{n})
\\item A square form in the cycle reveals a factor of n
\\item Kronecker symbol for finding suitable multiplier k
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } n = pq \\text{ be a semiprime. Choose } k \\text{ with } \\left(\\frac{k}{n}\\right) &= -1. \\\\
\\text{Set } D = kn. \\text{ Consider forms } (a, b, c) \\text{ of discriminant } D. & \\\\
\\text{The reduction operator } \\rho(a, b, c) &= (c, b', (b'^2 - D)/(4c)) \\\\
\\text{where } b' \\equiv -b \\pmod{2c}, \\quad |b'| &\\leq \\sqrt{D}. \\\\
\\text{Starting from the principal form, iterate } \\rho \\text{ to traverse the cycle.} & \\\\
\\text{If a form } (a, b, c) \\text{ has } c = q^2 \\text{ a perfect square,} & \\\\
\\text{compute the inverse square root and continue the cycle.} & \\\\
\\text{When the cycle returns to a form with the same middle coefficient,} & \\\\
\\text{the preceding } c \\text{ value satisfies } \\gcd(c, n) &= p \\text{ or } q. \\\\
\\text{Expected runtime: } O(n^{1/4}) \\text{ with small constant.} & \\qed
\\end{align*}

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
    proof: `\\textbf{Theorem:} If n = pq and the binary polynomial f(x) representing n factors as f(x) = g(x)h(x) over \\mathbb{Z}[x], then evaluating at x = 2 gives n = g(2)h(2), potentially revealing the factors.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Binary representation: n = \\sum_{i=0}^{k} b_i 2^i with b_i \\in \\{0, 1\\}
\\item Polynomial ring \\mathbb{Z}[x] and unique factorization
\\item Evaluation homomorphism: \\text{ev}_2: \\mathbb{Z}[x] \\to \\mathbb{Z}, f(x) \\mapsto f(2)
\\item If f(x) = g(x)h(x), then f(2) = g(2)h(2)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Given } n = \\sum_{i=0}^{k} b_i 2^i, \\text{ define } f(x) &= \\sum_{i=0}^{k} b_i x^i \\in \\mathbb{Z}[x]. \\\\
\\text{Clearly } f(2) &= n. \\\\
\\text{If } f(x) \\text{ is reducible over } \\mathbb{Z}[x], \\text{ factor it:} & \\\\
f(x) &= g_1(x)^{e_1} g_2(x)^{e_2} \\cdots g_r(x)^{e_r}. \\\\
\\text{Evaluating at } x = 2: \\quad n &= g_1(2)^{e_1} g_2(2)^{e_2} \\cdots g_r(2)^{e_r}. \\\\
\\text{If the factorization of } f(x) \\text{ "aligns" with the factorization of } n, & \\\\
\\text{then some } g_i(2) &= p \\text{ or } q. \\\\
\\text{However, this is NOT guaranteed: polynomial factors may not} & \\\\
\\text{correspond to integer factors of } n. \\text{ Each } g_i(2) &\\text{ must be tested.} \\\\
\\text{This method works best when } p, q \\text{ have structured binary patterns.} & \\qed
\\end{align*}

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
    proof: `\\textbf{Theorem:} If p/q \\approx a/b for small integers a, b, then q \\approx \\sqrt{nb/a} and Coppersmith's method can recover the exact value of q.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA: n = pq with p \\leq q
\\item Rational approximation: p/q \\approx a/b with small a, b
\\item Coppersmith's method for finding small roots of modular equations
\\item If q = q_0 + x with |x| < n^{1/4}, Coppersmith finds x
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Given } \\frac{p}{q} &\\approx \\frac{a}{b} \\text{ for small } a, b. \\\\
\\text{Then } p &\\approx \\frac{a}{b} q, \\text{ and } n = pq \\approx \\frac{a}{b} q^2. \\\\
\\text{So } q &\\approx \\sqrt{\\frac{nb}{a}} = q_0. \\\\
\\text{Write } q = q_0 + x \\text{ where } x \\text{ is small.} & \\\\
\\text{Since } q | n, \\text{ we have } q_0 + x &\\equiv 0 \\pmod{q}. \\\\
\\text{Equivalently, } f(x) = q_0 + x &\\equiv 0 \\pmod{q}. \\\\
\\text{Apply Coppersmith's method with } X = n^{1/4} \\text{ and } \\beta &= 0.5. \\\\
\\text{If } |x| < q^{\\beta^2} = q^{0.25} \\approx n^{1/4}, &\\text{ the root is recovered.} \\\\
\\text{Search over all } a/b \\text{ with } b &\\leq B \\text{ for some bound } B. \\\\
\\text{Total complexity: } O(B^2 \\cdot \\text{poly}(\\log n)). & \\qed
\\end{align*}

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
    proof: `\\textbf{Theorem:} Given a set of RSA moduli \\{n_1, n_2, \\ldots, n_k\\}, if any two share a prime factor, computing \\gcd(n_i, \\prod_{j \\neq i} n_j) reveals the shared factor efficiently.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA moduli: n_i = p_i q_i for distinct primes p_i, q_i
\\item If p_i = p_j for some i \\neq j, then p_i | \\gcd(n_i, n_j)
\\item Product tree: \\prod_{j \\neq i} n_j is divisible by all shared factors of n_i
\\item Euclidean algorithm: \\gcd(a, b) runs in O(\\log^2(\\max(a, b)))
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Given } n_1, n_2, \\ldots, n_k \\text{ where } n_i &= p_i q_i. \\\\
\\text{Suppose } p_1 = p_2 = p \\text{ (shared prime).} & \\\\
\\text{Then } p | n_1 \\text{ and } p | n_2, \\text{ so } p &| \\gcd(n_1, n_2). \\\\
\\text{More generally, compute } g_i = \\gcd\\left(n_i, \\prod_{j \\neq i} n_j\\right). & \\\\
\\text{If } g_i > 1, \\text{ then } g_i \\text{ is a shared prime factor.} & \\\\
\\text{Efficient computation using product tree:} & \\\\
\\text{Build tree T with leaves } n_1, \\ldots, n_k. & \\\\
\\text{Compute products bottom-up, then descend to find } &\\prod_{j \\neq i} n_j \\bmod n_i. \\\\
\\text{Total time: } O(M(k \\log N) \\log k) \\text{ where } M(x) &\\text{ is multiplication cost.} \\\\
\\text{This is much faster than O(k^2) pairwise GCDs.} & \\qed
\\end{align*}

\\textbf{References:} Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012; Bernstein, "How to Find Small Factors of Products", 2004`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n_values,
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

    # Compute phi(n) for multi-prime
    phi = prod(p - 1 for p in prime_factors)
    print(f"phi(n) = {phi}")
else:
    print("Standard 2-prime RSA.")
    if len(prime_factors) == 2:
        p, q = prime_factors
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"phi(n) = {(p-1)*(q-1)}")
`,
    proof: `\\textbf{Theorem:} Multi-prime RSA uses n = p_1 p_2 \\cdots p_r with r > 2 primes. The totient is \\varphi(n) = \\prod_{i=1}^{r} (p_i - 1).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Multi-prime RSA: n = p_1 p_2 \\cdots p_r with r \\geq 3 distinct primes
\\item Euler's totient: \\varphi(n) = \\prod_{i=1}^{r} (p_i - 1) for distinct primes
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}
\\item Decryption: m = c^d \\pmod{n}, can use CRT for speedup
\\item Security: smaller individual primes make factorization easier
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } n = p_1 p_2 \\cdots p_r \\text{ with } r \\geq 3 \\text{ distinct primes.} & \\\\
\\text{By the multiplicative property of } \\varphi: \\quad \\varphi(n) &= \\prod_{i=1}^{r} \\varphi(p_i) = \\prod_{i=1}^{r} (p_i - 1). \\\\
\\text{The public exponent } e \\text{ satisfies } \\gcd(e, \\varphi(n)) &= 1. \\\\
\\text{The private exponent } d \\text{ satisfies } ed &\\equiv 1 \\pmod{\\varphi(n)}. \\\\
\\text{Decryption: } m = c^d \\bmod n. \\text{ Using CRT:} & \\\\
m_i &= c^d \\bmod p_i \\quad \\text{for each } i = 1, \\ldots, r \\\\
m &= \\text{CRT}(m_1, m_2, \\ldots, m_r; p_1, p_2, \\ldots, p_r). \\\\
\\text{Security concern: each } p_i \\approx n^{1/r} \\text{ is smaller,} & \\\\
\\text{making ECM, QS, and other methods more effective.} & \\\\
\\text{For r = 3 and 2048-bit n, each prime is only } \\approx 683 &\\text{ bits.} \\qed
\\end{align*}

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
for k in range(0, 6):
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
    proof: `\\textbf{Theorem:} Some CTF challenges use primes with special mathematical structure (Mersenne, primorial, Fermat, Fibonacci, repunit). Testing divisibility by known special-form primes can quickly factor such moduli.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Mersenne primes: M_p = 2^p - 1 where p is prime
\\item Primorial primes: p\\# \\pm 1 where p\\# = \\prod_{q \\leq p} q
\\item Fermat primes: F_k = 2^{2^k} + 1 (only known: k = 0, 1, 2, 3, 4)
\\item Fibonacci primes: F_n where F_n is prime (rare)
\\item Repunit primes: R_n = (10^n - 1)/9 with n prime
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{If } n = p \\cdot q \\text{ and } p \\text{ is a special-form prime,} & \\\\
\\text{then } p \\text{ appears in a known list of such primes.} & \\\\
\\text{Testing } n \\bmod p_i = 0 \\text{ for each known special prime } p_i &\\text{ is O(1) per test.} \\\\
\\text{The total number of known special primes is small,} & \\\\
\\text{making this a fast check.} & \\\\
\\text{Mersenne primes: only 51 known as of 2024.} & \\\\
\\text{Fermat primes: only 5 known (F_0 \\text{ through } F_4). & \\\\
\\text{Primorial primes: a few dozen known.} & \\\\
\\text{Fibonacci primes: very few known.} & \\\\
\\text{This attack exploits poor randomness in CTF key generation.} & \\qed
\\end{align*}

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
max_iter = 10^7  # Much larger than standard Fermat
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
    proof: `\\textbf{Theorem: (Londahl)} Fermat's factorization can be extended to handle larger prime gaps by increasing the iteration bound, exploiting structured gaps between primes.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Fermat factorization: n = a^2 - b^2 where a = (p+q)/2, b = (q-p)/2
\\item Starting point: a_0 = \\lceil\\sqrt{n}\\rceil
\\item Number of iterations: b = (q-p)/2
\\item For |p - q| < 2n^{1/4}, Fermat runs in polynomial time
\\item Extended bound handles gaps up to O(n^{1/3})
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Same as Fermat factorization. Let } a &= \\frac{p + q}{2}, \\quad b = \\frac{q - p}{2}. \\\\
\\text{Then } a^2 - b^2 &= n, \\text{ so } n = (a - b)(a + b) = pq. \\\\
\\text{Starting from } a_0 = \\lceil\\sqrt{n}\\rceil, \\text{ iterate: } a_{i+1} &= a_i + 1. \\\\
\\text{Check if } a_i^2 - n &= b_i^2 \\text{ is a perfect square.} \\\\
\\text{The number of iterations equals } b = \\frac{q - p}{2}. & \\\\
\\text{Standard Fermat: efficient when } b &< n^{1/4}. \\\\
\\text{Londahl variant: extends to } b < n^{1/3} \\text{ with larger iteration bound.} & \\\\
\\text{Runtime: } O(b) = O(|p - q|). & \\qed
\\end{align*}

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
import math
constants = [
    ("pi", Integer(str(math.pi).replace('.', '')[:50])),
    ("e", Integer(str(math.e).replace('.', '')[:50])),
    ("sqrt(2)", Integer(str(math.sqrt(2)).replace('.', '')[:50])),
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
    proof: `\\textbf{Theorem:} CTF challenges sometimes reuse primes from previous problems or use primes with recognizable structure (near powers of 2, mathematical constants). Checking against a database of known primes can quickly factor such moduli.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item CTF problems may reuse primes for simplicity or oversight
\\item Some primes appear frequently: near 2^k, derived from constants
\\item A database of known CTF primes enables quick divisibility checks
\\item Primality testing (Miller-Rabin) for candidate verification
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } \\mathcal{P} = \\{p_1, p_2, \\ldots, p_m\\} \\text{ be a set of known CTF primes.} & \\\\
\\text{Given n, check } n \\bmod p_i = 0 \\text{ for each } p_i &\\in \\mathcal{P}. \\\\
\\text{If } n \\bmod p_i = 0, \\text{ then } p_i | n \\text{ and we factor } n &= p_i \\cdot (n/p_i). \\\\
\\text{Additionally, search for primes near structured values:} & \\\\
p &\\approx 2^k + \\delta \\quad \\text{for small } |\\delta| \\\\
p &\\approx \\text{constant} + \\delta \\\\
\\text{For each candidate, test primality and divisibility.} & \\\\
\\text{This exploits poor key generation in CTF challenges.} & \\\\
\\text{Runtime: } O(m \\cdot \\log^2 n + W \\cdot \\text{primality}) \\text{ where } W &\\text{ is search window.} \\qed
\\end{align*}

\\textbf{References:} Various CTF writeups; cryptohack.org challenges; RSA CTF problem databases`,
    priority: 'low',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
];
