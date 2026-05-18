import type { Attack } from '../../types';

export const factorizationAttacks: Attack[] = [
  {
    id: 'fermat',
    name: 'Fermat Factorization',
    category: 'Factorization',
    description: 'Factors n = p×q when |p - q| is small. Searches for a where a² - n is a perfect square.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
a = isqrt(n) + 1
b2 = a^2 - n
while not b2.is_square():
    a += 1
    b2 = a^2 - n
b = isqrt(b2)
p = a - b
q = a + b
print(f"p = {p}")
print(f"q = {q}")
print(f"Verification: p * q = {p * q}")
`,
    proof: `\\textbf{Theorem:} Let n = p \\cdot q be a composite number with p \\leq q. If |p - q| is small, then n can be factored efficiently by finding a such that a^2 - n = b^2 for some integer b.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = p \\cdot q where p, q are odd primes
\\item |p - q| < 2n^{1/4}
\\item Difference of squares: a^2 - b^2 = (a - b)(a + b)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } a &= \\frac{p + q}{2}, \\quad b = \\frac{q - p}{2} \\\\
\\text{Then } a^2 - b^2 &= \\left(\\frac{p + q}{2}\\right)^2 - \\left(\\frac{q - p}{2}\\right)^2 \\\\
&= \\frac{(p + q)^2 - (q - p)^2}{4} \\\\
&= \\frac{4pq}{4} = pq = n \\\\
\\text{Since } |p - q| \\text{ is small, } b \\text{ is small,} & \\\\
\\text{so } a = \\sqrt{n + b^2} \\approx \\sqrt{n}. & \\\\
\\text{Starting from } a_0 = \\lceil\\sqrt{n}\\rceil, \\text{ iterate } a &\\text{ until } a^2 - n \\text{ is a perfect square.} \\\\
\\text{Once found, } p = a - b, \\quad q &= a + b. \\qed
\\end{align*}

\\textbf{References:} Hardy & Wright, "An Introduction to the Theory of Numbers", Section 10.2; Menezes et al., "Handbook of Applied Cryptography", Algorithm 3.21`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'wiener',
    name: "Wiener's Attack",
    category: 'Factorization',
    description: 'Recovers d when d < N^0.25 using continued fraction expansion of e/n.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})

def wiener_attack(n, e):
    cf = e.continued_fraction()
    convergents = cf.convergents()
    for conv in convergents:
        k = conv.numerator()
        d = conv.denominator()
        if k == 0:
            continue
        if (e * d - 1) % k == 0:
            phi = (e * d - 1) // k
            s = n - phi + 1
            disc = s^2 - 4 * n
            if disc >= 0 and disc.is_square():
                sqrt_disc = isqrt(disc)
                p = (s + sqrt_disc) // 2
                q = (s - sqrt_disc) // 2
                if p * q == n:
                    print(f"d = {d}")
                    print(f"p = {p}")
                    print(f"q = {q}")
                    print(f"phi = {phi}")
                    return d, p, q
    print("Wiener's attack failed: private exponent d not found")
    return None

wiener_attack(n, e)
`,
    proof: `\\textbf{Theorem: (Wiener, 1990)} Let (n, e) be an RSA public key with n = pq and q < p < 2q. If the private exponent d < n^{1/4}/3, then d can be efficiently recovered from the continued fraction expansion of e/n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}, \\text{ so } ed - 1 = k\\varphi(n)
\\item \\varphi(n) = (p-1)(q-1) = n - (p+q) + 1
\\item Legendre's theorem on continued fractions
\\item q < p < 2q \\implies |p - q| < \\sqrt{n}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{From } ed - 1 &= k\\varphi(n), \\text{ we have } \\frac{e}{\\varphi(n)} = \\frac{k}{d} + \\frac{1}{d\\varphi(n)} \\\\
\\left|\\frac{e}{n} - \\frac{k}{d}\\right| &= \\left|\\frac{e}{n} - \\frac{e}{\\varphi(n)} + \\frac{e}{\\varphi(n)} - \\frac{k}{d}\\right| \\\\
&= \\left|\\frac{e(\\varphi(n) - n)}{n\\varphi(n)} + \\frac{1}{d\\varphi(n)}\\right| \\\\
&= \\left|\\frac{e(p + q - 1)}{n\\varphi(n)} - \\frac{1}{d\\varphi(n)}\\right| \\\\
&< \\frac{e(p + q)}{n\\varphi(n)} < \\frac{3e}{2\\sqrt{n} \\cdot \\varphi(n)} \\\\
\\text{Since } d < n^{1/4}/3, \\text{ we get } \\left|\\frac{e}{n} - \\frac{k}{d}\\right| &< \\frac{1}{2d^2} \\\\
\\text{By Legendre's theorem, } k/d \\text{ appears as a convergent of } &e/n. \\\\
\\text{Test each convergent } k/d: \\text{ compute } \\varphi &= (ed - 1)/k, \\text{ solve } x^2 - (n - \\varphi + 1)x + n = 0. \\qed
\\end{align*}

\\textbf{References:} M. Wiener, "Cryptanalysis of Short RSA Secret Exponents", IEEE Trans. Info. Theory, 1990; Boneh, "Twenty Years of Attacks on RSA", 1999`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
  },
  {
    id: 'boneh-durfee',
    name: 'Boneh-Durfee Attack',
    category: 'Factorization',
    description: 'Extends Wiener using lattice reduction. Recovers d when d < N^0.292.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
e = Integer(${vals.e})

# Extended Wiener + lattice-based Boneh-Durfee approach
# First try Wiener's attack
def wiener_attack(n, e):
    cf = e.continued_fraction()
    for conv in cf.convergents():
        k, d = conv.numerator(), conv.denominator()
        if k == 0:
            continue
        if (e * d - 1) % k == 0:
            phi = (e * d - 1) // k
            s = n - phi + 1
            disc = s^2 - 4 * n
            if disc >= 0 and disc.is_square():
                p = (s + isqrt(disc)) // 2
                q = (s - isqrt(disc)) // 2
                if p * q == n:
                    return d, p, q
    return None

result = wiener_attack(n, e)
if result:
    d, p, q = result
    print(f"Wiener's attack succeeded:")
    print(f"d = {d}, p = {p}, q = {q}")
else:
    print("Wiener's attack failed. Attempting lattice-based approach...")
    # Lattice construction for Boneh-Durfee
    # f(x, y) = x(A + y) - 1 \\equiv 0 (mod e), A = (n+1)/2
    # Small root finding via Coppersmith's method
    A = (n + 1) // 2
    P.<x, y> = PolynomialRing(Zmod(e))
    f = x * (A + y) - 1
    # Use Coppersmith's method for small roots
    # Bound: d < n^0.292
    bound = ZZ(n^0.292)
    try:
        roots = f.small_roots(X=bound, Y=bound, m=3)
        if roots:
            k, yp = roots[0]
            d = int(k)
            phi = int(A + yp)
            s = n - phi + 1
            disc = s^2 - 4 * n
            if disc >= 0 and disc.is_square():
                p = (s + isqrt(disc)) // 2
                q = (s - isqrt(disc)) // 2
                if p * q == n:
                    print(f"Boneh-Durfee succeeded:")
                    print(f"d = {d}, p = {p}, q = {q}")
                else:
                    print("Root found but factorization failed")
            else:
                print("Root found but discriminant is not a perfect square")
        else:
            print("No small roots found. d may be too large for Boneh-Durfee.")
    except:
        print("Lattice reduction failed. Try increasing parameters or use a different attack.")
`,
    proof: `\\textbf{Theorem: (Boneh & Durfee, 1999)} Let (n, e) be an RSA public key. The private exponent d can be recovered in polynomial time when d < n^{0.292} using lattice reduction techniques.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}, \\text{ so } ed - 1 = k\\varphi(n)
\\item \\varphi(n) = n - (p + q) + 1 \\approx n - 2\\sqrt{n}
\\item Coppersmith's method for finding small roots of modular equations
\\item LLL lattice basis reduction algorithm
\\item Multivariate polynomial small root finding
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{From } ed - 1 &= k\\varphi(n), \\text{ let } A = \\frac{n + 1}{2} \\approx \\frac{p + q}{2} \\\\
\\text{Define } f(x, y) &= x(A + y) - 1 \\pmod{e} \\\\
\\text{Then } f(k, -(p+q)/2) &\\equiv 0 \\pmod{e} \\\\
\\text{We seek small roots } (x_0, y_0) = (k, -(p+q)/2) &\\text{ of } f(x, y) \\equiv 0 \\pmod{e} \\\\
\\text{Construct a lattice } L \\text{ from shifts } x^i y^j f(x, y)^m &\\cdot e^{m-i} \\\\
\\text{Apply LLL reduction to find short vectors in } L & \\\\
\\text{Recover polynomials } g_1, g_2 \\text{ vanishing at } (x_0, y_0) &\\text{ over } \\mathbb{Z} \\\\
\\text{Compute } \\gcd(g_1, g_2) \\text{ to extract } (x_0, y_0) &= (k, -(p+q)/2) \\\\
\\text{Recover } \\varphi(n) = n + 1 + 2y_0, \\text{ then factor } n &\\text{ from } \\varphi(n). \\qed
\\end{align*}

\\textbf{References:} D. Boneh & G. Durfee, "Cryptanalysis of RSA with Private Key d Less than n^0.292", IEEE Trans. Info. Theory, 1999; May, "New RSA Vulnerabilities Using Lattice Reduction Methods", 2003`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e,
  },
  {
    id: 'ecm',
    name: 'ECM Factorization',
    category: 'Factorization',
    description: 'Elliptic Curve Method. Effective for factors up to ~60 digits.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

# Elliptic Curve Method (ECM)
print(f"Running ECM on n = {n}")
print(f"Number of digits: {n.nbits() / 3.32:.0f}")

# Use Sage's built-in ECM
try:
    factor = ecm.find_factor(n)
    if factor:
        p = Integer(factor)
        q = n // p
        print(f"Factor found: p = {p}")
        print(f"           q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print(f"q is prime: {q.is_prime()}")
    else:
        print("ECM did not find a factor. Try increasing B1/B2 bounds or use a different method.")
except Exception as ex:
    print(f"ECM failed: {ex}")
    print("Trying alternative factorization...")
    factors = factor(n)
    print(f"Factors: {factors}")
`,
    proof: `\\textbf{Theorem: (Lenstra, 1987)} The Elliptic Curve Method (ECM) can find a prime factor p of n in expected time O(\\exp(\\sqrt{2 \\ln p \\ln \\ln p})) using elliptic curve group operations.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Elliptic curves over \\mathbb{Z}/n\\mathbb{Z}: y^2 = x^3 + ax + b
\\item Group law on elliptic curves: point addition and scalar multiplication
\\item Hasse's theorem: |\\#E(\\mathbb{F}_p) - (p + 1)| \\leq 2\\sqrt{p}
\\item Smooth numbers and the B-smooth concept
\\item Pollard's p-1 method as a precursor
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Choose random elliptic curve } E: y^2 &= x^3 + ax + b \\pmod{n} \\\\
\\text{Choose random point } P &\\in E(\\mathbb{Z}/n\\mathbb{Z}) \\\\
\\text{Compute } Q = M \\cdot P \\text{ where } M &= \\prod_{q \\leq B_1} q^{\\lfloor \\log_q B_1 \\rfloor} \\\\
\\text{If } \\#E(\\mathbb{F}_p) \\text{ is } B_1\\text{-smooth, then } M &\\equiv 0 \\pmod{\\#E(\\mathbb{F}_p)} \\\\
\\text{The scalar multiplication } M \\cdot P \\text{ will encounter} & \\\\
\\text{a non-invertible element modulo } n, \\text{ revealing } \\gcd(&\\cdot, n) = p \\\\
\\text{By Hasse's theorem, } \\#E(\\mathbb{F}_p) &\\in [p + 1 - 2\\sqrt{p}, p + 1 + 2\\sqrt{p}] \\\\
\\text{Varying curve parameters gives different group orders,} & \\\\
\\text{increasing the probability that one is } B_1\\text{-smooth.} & \\\\
\\text{Expected runtime: } O(&\\exp(\\sqrt{2 \\ln p \\ln \\ln p})) \\text{ for finding factor } p. \\qed
\\end{align*}

\\textbf{References:} H. W. Lenstra Jr., "Factoring Integers with Elliptic Curves", Annals of Mathematics, 1987; Cohen, "A Course in Computational Algebraic Number Theory", Section 10.4`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'ecm2',
    name: 'ECM Full Factorization',
    category: 'Factorization',
    description: 'Full factorization using repeated ECM. Finds all prime factors.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"Full factorization of n = {n}")
print(f"Number of digits: {n.nbits() / 3.32:.0f}")
print()

# Iterative ECM with factor removal
remaining = n
factors = []

while remaining > 1:
    if remaining.is_prime():
        factors.append(remaining)
        print(f"Remaining {remaining} is prime.")
        break

    print(f"Attempting ECM on {remaining}...")
    try:
        f = ecm.find_factor(remaining)
        if f:
            f = Integer(f)
            factors.append(f)
            print(f"Found factor: {f}")
            remaining = remaining // f
            print(f"Remaining: {remaining}")
            print()
        else:
            print("ECM failed on current remainder. Trying built-in factorization...")
            break
    except:
        print("ECM error. Falling back to built-in factorization.")
        break

if remaining > 1 and not remaining.is_prime():
    print("Completing factorization with built-in method...")
    partial_factors = factor(remaining)
    for f, mult in partial_factors:
        for _ in range(mult):
            factors.append(Integer(f))

factors.sort()
print()
print("=" * 50)
print("Complete factorization:")
from collections import Counter
factor_counts = Counter(factors)
for f in sorted(factor_counts.keys()):
    mult = factor_counts[f]
    if mult == 1:
        print(f"  {f}")
    else:
        print(f"  {f}^{mult}")
print(f"Verification: product = {prod(factors)}")
print(f"Original n:     {n}")
`,
    proof: `\\textbf{Theorem:} Repeated application of ECM with factor removal yields the complete prime factorization of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item ECM finds one prime factor p of n at a time
\\item Fundamental Theorem of Arithmetic: unique prime factorization
\\item If n = p_1^{e_1} \\cdots p_k^{e_k}, removing factors reduces the problem size
\\item Primality testing (Miller-Rabin or deterministic) for termination
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Given } n = p_1^{e_1} p_2^{e_2} \\cdots p_k^{e_k} &\\text{ with } p_1 < p_2 < \\cdots < p_k \\\\
\\text{ECM finds some prime factor } p_i &\\text{ with probability depending on smoothness of } \\#E(\\mathbb{F}_{p_i}) \\\\
\\text{After finding } p_i, \\text{ compute } n' &= n / p_i \\\\
\\text{Repeat ECM on } n' \\text{ until } n' &= 1 \\text{ or } n' \\text{ is prime} \\\\
\\text{Each iteration reduces the problem size:} & \\\\
n > n/p_{i_1} > n/(p_{i_1}p_{i_2}) > \\cdots &> 1 \\\\
\\text{The process terminates because each step} & \\\\
\\text{reduces the number of prime factors (counting multiplicity).} & \\\\
\\text{By the Fundamental Theorem of Arithmetic, the factorization is unique.} & \\\\
\\text{Total expected time: } \\sum_{i=1}^{k} O(\\exp(\\sqrt{2 \\ln p_i \\ln \\ln p_i})) & \\\\
\\text{Dominant term is the largest prime factor.} & \\qed
\\end{align*}

\\textbf{References:} Lenstra, "Factoring Integers with Elliptic Curves", 1987; Brent, "The ECM Method", 2005`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'pollard-p1',
    name: "Pollard's p-1 Method",
    category: 'Factorization',
    description: 'Factors n when p-1 is B-smooth.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'B', label: 'B (smoothness bound, optional)', placeholder: '10000', multiline: false },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
B = Integer(${vals.B || '10000'})

print(f"Pollard's p-1 method on n = {n}")
print(f"Smoothness bound B = {B}")
print()

# Compute M = lcm(1, 2, ..., B)
M = 1
for i in range(2, B + 1):
    M = lcm(M, i)

# Stage 1: compute a^M mod n
a = 2
aM = power_mod(a, M, n)
g = gcd(aM - 1, n)

if 1 < g < n:
    p = g
    q = n // g
    print(f"Factor found in Stage 1!")
    print(f"p = {p}")
    print(f"q = {q}")
    print(f"Verification: p * q = {p * q}")
elif g == n:
    print("gcd = n. Try a different base 'a' or reduce B.")
    # Try with different base
    for a in [3, 5, 7, 11]:
        aM = power_mod(a, M, n)
        g = gcd(aM - 1, n)
        if 1 < g < n:
            print(f"Factor found with base a = {a}!")
            print(f"p = {g}")
            print(f"q = {n // g}")
            break
    else:
        print("Failed with all bases. p-1 may not be B-smooth.")
else:
    print("Stage 1 failed. Attempting Stage 2...")
    # Stage 2: extend to B2 = 100*B
    B2 = 100 * B
    print(f"Stage 2 bound B2 = {B2}")
    q_val = aM  # q = a^M mod n
    for j in range(B + 1, B2 + 1):
        if is_prime(j):
            q_val = power_mod(q_val, j, n)
    g = gcd(q_val - 1, n)
    if 1 < g < n:
        print(f"Factor found in Stage 2!")
        print(f"p = {g}")
        print(f"q = {n // g}")
    else:
        print("Pollard's p-1 failed. p-1 is not B2-smooth. Try ECM or another method.")
`,
    proof: `\\textbf{Theorem: (Pollard, 1974)} If n has a prime factor p such that p-1 is B-smooth (all prime factors of p-1 are \\leq B), then p can be found in time O(B \\log B \\log^2 n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Fermat's Little Theorem: a^{p-1} \\equiv 1 \\pmod{p} for \\gcd(a, p) = 1
\\item B-smooth numbers: all prime factors \\leq B
\\item M = \\text{lcm}(1, 2, \\ldots, B) is divisible by all B-smooth numbers
\\item \\gcd(a^M - 1, n) reveals p when (p-1) | M
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } p \\text{ be a prime factor of } n \\text{ such that } p-1 &\\text{ is B-smooth.} \\\\
\\text{Then } p-1 = q_1^{e_1} q_2^{e_2} \\cdots q_r^{e_r} &\\text{ with all } q_i \\leq B. \\\\
\\text{Let } M = \\text{lcm}(1, 2, \\ldots, B). \\text{ Then } (p-1) &| M. \\\\
\\text{By Fermat's Little Theorem: } a^{p-1} &\\equiv 1 \\pmod{p} \\\\
\\text{Since } (p-1) | M, \\text{ we have } a^M &\\equiv 1 \\pmod{p} \\\\
\\text{Thus } p | (a^M - 1), \\text{ so } p | \\gcd(a^M - 1, n). & \\\\
\\text{If } \\gcd(a^M - 1, n) < n, \\text{ we have found a nontrivial factor.} & \\\\
\\text{Stage 2 extends the search: for primes } B < q \\leq B_2, & \\\\
\\text{check if } p-1 = q \\cdot s \\text{ where } s \\text{ is B-smooth.} & \\\\
\\text{Runtime: } O(B \\log B \\log^2 n) \\text{ for Stage 1.} & \\qed
\\end{align*}

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974; Menezes et al., "Handbook of Applied Cryptography", Algorithm 3.23`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'pollard-rho',
    name: "Pollard's Rho Method",
    category: 'Factorization',
    description: 'General-purpose factorization using cycle detection. O(n^{1/4}).',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"Pollard's rho method on n = {n}")
print()

def pollard_rho(n, f=None):
    if f is None:
        f = lambda x: (x^2 + 1) % n

    # Floyd's cycle detection
    x = 2
    y = 2
    d = 1

    while d == 1:
        x = f(x)          # tortoise: one step
        y = f(f(y))       # hare: two steps
        d = gcd(abs(x - y), n)

    return d

# Try with different constants if needed
for c in range(1, 20):
    f = lambda x, c=c: (x^2 + c) % n
    factor = pollard_rho(n, f)
    if factor != n and factor != 1:
        p = Integer(factor)
        q = n // p
        print(f"Factor found with c = {c}!")
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print(f"q is prime: {q.is_prime()}")
        break
else:
    print("Pollard's rho failed. Try a different method.")
`,
    proof: `\\textbf{Theorem: (Pollard, 1975)} Pollard's rho algorithm finds a nontrivial factor of n in expected time O(n^{1/4}) = O(\\sqrt{p}) where p is the smallest prime factor of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Birthday paradox: among \\sqrt{N} random elements, collision probability is \\approx 1/2
\\item Floyd's cycle detection algorithm (tortoise and hare)
\\item Pseudorandom sequence: x_{i+1} = f(x_i) \\pmod{n}
\\item The sequence modulo p repeats with period O(\\sqrt{p})
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Define } x_{i+1} &= f(x_i) = x_i^2 + c \\pmod{n} \\\\
\\text{Consider the sequence modulo } p: x_i &\\pmod{p} \\\\
\\text{By the birthday paradox, the sequence repeats after} & \\\\
O(\\sqrt{p}) \\text{ steps with high probability.} & \\\\
\\text{Let } i \\neq j \\text{ such that } x_i &\\equiv x_j \\pmod{p} \\\\
\\text{Then } p | (x_i - x_j), \\text{ so } p | \\gcd(x_i - x_j, n). & \\\\
\\text{Floyd's cycle detection: maintain } x \\text{ (tortoise) and } y &\\text{ (hare)} \\\\
\\text{At each step: } x \\leftarrow f(x), \\quad y &\\leftarrow f(f(y)) \\\\
\\text{When } x \\equiv y \\pmod{p}, \\text{ we have } \\gcd(x - y, n) &= p \\\\
\\text{Expected number of iterations: } O(\\sqrt{p}) &= O(n^{1/4}) \\\\
\\text{Each iteration: one modular squaring and one gcd.} & \\\\
\\text{Total expected time: } O(n^{1/4} \\log^2 n). & \\qed
\\end{align*}

\\textbf{References:} J. M. Pollard, "A Monte Carlo Method for Factorization", BIT Numerical Mathematics, 1975; Crandall & Pomerance, "Prime Numbers: A Computational Perspective", Section 5.2.1`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'williams-p1',
    name: "Williams' p+1 Method",
    category: 'Factorization',
    description: 'Factors n when p+1 is B-smooth using Lucas sequences.',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
      { name: 'B', label: 'B (smoothness bound, optional)', placeholder: '10000', multiline: false },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})
B = Integer(${vals.B || '10000'})

print(f"Williams' p+1 method on n = {n}")
print(f"Smoothness bound B = {B}")
print()

# Williams' p+1 using Lucas sequences
# V_k(P, Q) where Q = 1, V_0 = 2, V_1 = P, V_k = P*V_{k-1} - V_{k-2}
def williams_p1(n, B, P):
    # Compute M = lcm(1, 2, ..., B)
    M = 1
    for i in range(2, B + 1):
        M = lcm(M, i)

    # Lucas sequence V_M(P, 1) mod n
    # Using doubling formulas
    V_k = P % n
    V_k1 = (P^2 - 2) % n  # V_2

    # Binary exponentiation approach for V_M
    k = M
    # Compute V_M using the recurrence
    # Use matrix form: [V_k, V_{k+1}]^T = [[0,1],[-1,P]]^k * [2, P]^T
    def lucas_V(k, P, n):
        if k == 0:
            return 2 % n
        if k == 1:
            return P % n
        # Doubling: V_{2k} = V_k^2 - 2
        # V_{2k+1} = V_k * V_{k+1} - P
        a, b = P % n, (P^2 - 2) % n  # V_1, V_2
        result = 2 % n  # V_0
        bits = k.bits()
        for bit in reversed(bits):
            # Double
            result = (result^2 - 2) % n
            if bit == 1:
                # Add one
                result = (result * a - P) % n
        return result

    VM = lucas_V(M, P, n)
    return gcd(VM - 2, n)

# Try different P values
found = False
for P in range(3, 30):
    g = williams_p1(n, B, P)
    if 1 < g < n:
        p = Integer(g)
        q = n // g
        print(f"Factor found with P = {P}!")
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        found = True
        break

if not found:
    print("Williams' p+1 failed. p+1 may not be B-smooth for tested P values.")
    print("Try increasing B or using a different method.")
`,
    proof: `\\textbf{Theorem: (Williams, 1982)} If n has a prime factor p such that p+1 is B-smooth, then p can be found using Lucas sequences in time O(B \\log B \\log^2 n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Lucas sequences: V_k(P, Q) with V_0 = 2, V_1 = P, V_k = PV_{k-1} - QV_{k-2}
\\item For Q = 1: V_k(\\alpha + \\alpha^{-1}, 1) = \\alpha^k + \\alpha^{-k}
\\item In \\mathbb{F}_p, if (D/p) = -1 (D = P^2 - 4Q), then \\alpha^{p+1} = 1
\\item The order of \\alpha in \\mathbb{F}_{p^2}^* divides p+1
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } p \\text{ be a prime factor of } n \\text{ with } p+1 &\\text{ B-smooth.} \\\\
\\text{Choose } P \\text{ such that the discriminant } D = P^2 - 4 &\\text{ has } (D/p) = -1. \\\\
\\text{Let } \\alpha, \\beta \\text{ be roots of } x^2 - Px + 1 &= 0 \\text{ in } \\mathbb{F}_{p^2}. \\\\
\\text{Then } \\alpha \\cdot \\beta = 1, \\text{ so } \\beta = \\alpha^{-1}. & \\\\
\\text{The Lucas sequence } V_k &= \\alpha^k + \\alpha^{-k} = \\alpha^k + \\beta^k. \\\\
\\text{Since } (D/p) = -1, \\text{ we have } \\alpha^{p+1} &= 1 \\text{ in } \\mathbb{F}_{p^2}^*. \\\\
\\text{Let } M = \\text{lcm}(1, 2, \\ldots, B). \\text{ Since } (p+1) &| M, \\text{ we get } \\alpha^M = 1. \\\\
\\text{Then } V_M = \\alpha^M + \\alpha^{-M} = 1 + 1 &= 2 \\pmod{p}. \\\\
\\text{Thus } p | (V_M - 2), \\text{ so } p | \\gcd(V_M - 2, n). & \\\\
\\text{If } \\gcd(V_M - 2, n) < n, \\text{ we found a nontrivial factor.} & \\\\
\\text{Try different } P \\text{ values to ensure } (D/p) &= -1. \\qed
\\end{align*}

\\textbf{References:} H. C. Williams, "A p+1 Method of Factoring", Mathematics of Computation, 1982; Crandall & Pomerance, "Prime Numbers: A Computational Perspective", Section 5.2.3`,
    priority: 'medium',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
  {
    id: 'quadratic-sieve',
    name: 'Quadratic Sieve',
    category: 'Factorization',
    description: 'General-purpose factorization. Sage built-in qsieve().',
    inputs: [
      { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    ],
    sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"Quadratic Sieve on n = {n}")
print(f"Number of digits: {n.nbits() / 3.32:.0f}")
print()

# Use Sage's built-in quadratic sieve
try:
    print("Running qsieve()...")
    factors = n.qsieve()
    print(f"Factors found: {factors}")

    if len(factors) == 2:
        p, q = factors
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print(f"q is prime: {q.is_prime()}")
    else:
        print(f"Found {len(factors)} factors:")
        for i, f in enumerate(factors):
            print(f"  factor[{i}] = {f}")
except Exception as ex:
    print(f"qsieve() failed: {ex}")
    print("Falling back to built-in factorization...")
    try:
        factors = factor(n)
        print(f"Factors: {factors}")
    except:
        print("Factorization failed. n may be too large for available methods.")
`,
    proof: `\\textbf{Theorem: (Pomerance, 1981)} The Quadratic Sieve factors a composite integer n in expected time O(\\exp(\\sqrt{\\ln n \\ln \\ln n})).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Congruent squares: if x^2 \\equiv y^2 \\pmod{n} with x \\not\\equiv \\pm y \\pmod{n}, then \\gcd(x - y, n) is a factor
\\item Smooth numbers: B-smooth relative to a factor base of primes
\\item Sieving: efficiently finding smooth values of Q(x) = (x + \\lfloor\\sqrt{n}\\rfloor)^2 - n
\\item Linear algebra over \\mathbb{F}_2: finding dependencies in exponent vectors
\\item The smoothness bound B = \\exp(\\frac{1}{2}\\sqrt{\\ln n \\ln \\ln n})
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } m = \\lfloor\\sqrt{n}\\rfloor. \\text{ Define } Q(x) &= (x + m)^2 - n \\equiv (x + m)^2 \\pmod{n}. \\\\
\\text{Choose a factor base } \\mathcal{F} = \\{-1\\} \\cup \\{p : p \\leq B, (n/p) &= 1\\}. \\\\
\\text{Find many x such that } Q(x) &\\text{ is B-smooth over } \\mathcal{F}. \\\\
\\text{For each smooth Q(x), record its exponent vector } \\vec{v}_x &\\in \\mathbb{F}_2^{|\\mathcal{F}|}. \\\\
\\text{Collect } |\\mathcal{F}| + 1 \\text{ such vectors. By linear algebra over } \\mathbb{F}_2, & \\\\
\\text{find a nontrivial dependency: } \\sum_{i \\in S} \\vec{v}_{x_i} &= \\vec{0} \\pmod{2}. \\\\
\\text{Then } \\prod_{i \\in S} Q(x_i) &= y^2 \\text{ for some integer } y. \\\\
\\text{Let } X = \\prod_{i \\in S} (x_i + m). \\text{ Then } X^2 &\\equiv y^2 \\pmod{n}. \\\\
\\text{If } X \\not\\equiv \\pm y \\pmod{n}, \\text{ compute } \\gcd(X - y, n) &\\text{ to find a factor.} \\\\
\\text{Probability of success: } \\geq 1/2 \\text{ per dependency.} & \\\\
\\text{Expected runtime: } O(\\exp(\\sqrt{\\ln n \\ln \\ln n})). & \\qed
\\end{align*}

\\textbf{References:} C. Pomerance, "The Quadratic Sieve Factoring Algorithm", Eurocrypt 1984; Crandall & Pomerance, "Prime Numbers: A Computational Perspective", Chapter 6`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
];
