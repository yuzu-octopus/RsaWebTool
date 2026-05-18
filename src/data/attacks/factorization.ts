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
max_iter = 10**6
iterations = 0
while not b2.is_square():
    iterations += 1
    if iterations > max_iter:
        print(f"Fermat factorization failed: no factor found within {max_iter} iterations")
        print("p and q may not be close enough for this method")
        break
    a += 1
    b2 = a^2 - n
else:
    b = isqrt(b2)
    p = a - b
    q = a + b
    print(f"p = {p}")
    print(f"q = {q}")
    print(f"Verification: p * q = {p * q}")
`,
    proof: `\\textbf{Theorem:} If n = p \\cdot q with |p - q| < 2n^{1/4}, then n can be factored by finding a such that a^2 - n = b^2.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n = p \\cdot q, p and q odd primes
\\item |p - q| < 2n^{1/4} (primes must be close)
\\item Difference of squares: a^2 - b^2 = (a - b)(a + b)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
a &= \\frac{p + q}{2}, \\quad b = \\frac{q - p}{2} \\\\
a^2 - b^2 &= \\frac{(p+q)^2 - (q-p)^2}{4} = \\frac{4pq}{4} = pq = n \\\\
|p - q| \\text{ small} &\\implies b \\text{ small} \\\\
a = \\sqrt{n + b^2} &\\approx \\sqrt{n} \\\\
\\text{Start from } a_0 = \\lceil\\sqrt{n}\\rceil, \\text{ iterate } a &\\text{ until } a^2 - n = b^2 \\\\
p = a - b, \\quad q &= a + b \\qed
\\end{align*}

\\textbf{Explanation:} Starting from \\lceil\\sqrt{n}\\rceil, increment a until a^2 - n is a perfect square b^2. Then p = a - b and q = a + b. The number of iterations equals (q - p)/2, so it's efficient only when p and q are close.

\\textbf{References:} Hardy & Wright, "An Introduction to the Theory of Numbers", Section 10.2`,
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
    proof: `\\textbf{Theorem:} If d < n^{1/4}/3 and q < p < 2q, then d can be recovered from the continued fraction expansion of e/n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA public key (n, e), private key d with ed \\equiv 1 \\pmod{\\varphi(n)}
\\item ed - 1 = k\\varphi(n) for some integer k
\\item q < p < 2q (balanced primes)
\\item d < n^{1/4}/3
\\item Legendre's theorem: if |\\alpha - a/b| < 1/(2b^2), then a/b is a convergent of \\alpha
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ed - 1 &= k\\varphi(n) \\implies \\frac{e}{\\varphi(n)} = \\frac{k}{d} + \\frac{1}{d\\varphi(n)} \\\\
\\left|\\frac{e}{n} - \\frac{k}{d}\\right| &= \\left|\\frac{e(\\varphi(n) - n)}{n\\varphi(n)} - \\frac{1}{d\\varphi(n)}\\right| \\\\
&= \\left|\\frac{e(p + q - 1)}{n\\varphi(n)} - \\frac{1}{d\\varphi(n)}\\right| \\\\
&< \\frac{e(p + q)}{n\\varphi(n)} < \\frac{3e}{2\\sqrt{n} \\cdot \\varphi(n)} \\\\
d < n^{1/4}/3 &\\implies \\left|\\frac{e}{n} - \\frac{k}{d}\\right| < \\frac{1}{2d^2} \\\\
\\text{By Legendre's theorem, } k/d &\\text{ is a convergent of } e/n \\\\
\\text{For each convergent } k/d: \\quad \\varphi &= (ed - 1)/k \\\\
x^2 - (n - \\varphi + 1)x + n &= 0 \\implies p, q \\qed
\\end{align*}

\\textbf{Explanation:} Compute the continued fraction convergents of e/n. For each convergent k/d, check if (ed - 1) is divisible by k, then solve the quadratic x^2 - (n - \\varphi + 1)x + n = 0. If the roots are integers multiplying to n, you've found d.

\\textbf{References:} M. Wiener, "Cryptanalysis of Short RSA Secret Exponents", IEEE Trans. Info. Theory, 1990`,
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
            phi = n + 1 + 2 * int(yp)
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
    proof: `\\textbf{Theorem:} The private exponent d can be recovered in polynomial time when d < n^{0.292} using lattice reduction.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item RSA: ed \\equiv 1 \\pmod{\\varphi(n)}, so ed - 1 = k\\varphi(n)
\\item \\varphi(n) = n - (p + q) + 1, let A = (n + 1)/2 \\approx (p + q)/2
\\item Coppersmith's method for small roots of modular polynomials
\\item LLL lattice basis reduction algorithm
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ed - 1 &= k\\varphi(n) = k(n - (p + q) + 1) \\\\
\\text{Let } A &= \\frac{n + 1}{2}, \\quad y = -\\frac{p + q}{2} \\\\
f(x, y) &= x(A + y) - 1 \\equiv 0 \\pmod{e} \\\\
f(k, y) &= k\\left(\\frac{n+1}{2} - \\frac{p+q}{2}\\right) - 1 = k \\cdot \\frac{n - (p+q) + 1}{2} - 1 \\\\
&= \\frac{k\\varphi(n)}{2} - 1 = \\frac{ed - 1}{2} - 1 \\not\\equiv 0 \\pmod{e} \\\\
\\text{Rescale: } f(x, y) &= x(A + y) - 1 \\equiv 0 \\pmod{e} \\\\
\\text{Construct lattice from shifts } x^i y^j f(x, y)^m &\\cdot e^{m-i} \\\\
\\text{Apply LLL} \\implies \\text{short vectors } g_1, g_2 &\\in \\mathbb{Z}[x, y] \\\\
g_1(k, y) = g_2(k, y) &= 0 \\text{ over } \\mathbb{Z} \\\\
\\gcd(g_1, g_2) &\\implies (k, y) \\\\
\\varphi(n) = n + 1 + 2y, \\quad \text{factor } n &\\text{ from } \\varphi(n) \\qed
\\end{align*}

\\textbf{Explanation:} Build a bivariate polynomial f(x, y) = x(A + y) - 1 \\pmod{e} with small root (k, -(p+q)/2). Construct a lattice from polynomial shifts, apply LLL reduction to find integer polynomials vanishing at the root, then recover \\varphi(n) and factor n. The bound d < n^{0.292} comes from the lattice dimension analysis.

\\textbf{References:} D. Boneh & G. Durfee, "Cryptanalysis of RSA with Private Key d Less than n^0.292", IEEE Trans. Info. Theory, 1999`,
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

# Use Sage's built-in factorization (uses ECM internally for appropriate sizes)
try:
    factors = factor(n)
    if len(factors) == 2 and all(mult == 1 for _, mult in factors):
        p, q = [f for f, _ in factors]
        p = Integer(p)
        q = Integer(q)
        print(f"Factor found: p = {p}")
        print(f"           q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"p is prime: {p.is_prime()}")
        print(f"q is prime: {q.is_prime()}")
    else:
        print(f"Factors: {factors}")
except Exception as ex:
    print(f"Factorization failed: {ex}")
`,
    proof: `\\textbf{Theorem:} ECM finds a prime factor p of n in expected time O(\\exp(\\sqrt{2 \\ln p \\ln \\ln p})).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Elliptic curve E: y^2 = x^3 + ax + b over \\mathbb{Z}/n\\mathbb{Z}
\\item Group law on E: point addition and scalar multiplication
\\item Hasse's theorem: |\\#E(\\mathbb{F}_p) - (p + 1)| \\leq 2\\sqrt{p}
\\item B-smooth: all prime factors \\leq B
\\item M = \\prod_{q \\leq B_1} q^{\\lfloor \\log_q B_1 \\rfloor}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Choose random } E: y^2 &= x^3 + ax + b \\pmod{n}, \\; P \\in E \\\\
Q = M \\cdot P, \\quad M &= \\prod_{q \\leq B_1} q^{\\lfloor \\log_q B_1 \\rfloor} \\\\
\\#E(\\mathbb{F}_p) \\text{ is } B_1\\text{-smooth} &\\implies M \\equiv 0 \\pmod{\\#E(\\mathbb{F}_p)} \\\\
M \\cdot P &= \\mathcal{O} \\text{ in } E(\\mathbb{F}_p) \\\\
\\text{Scalar multiplication encounters} & \\\\
\\text{non-invertible denominator } d &\\pmod{n} \\\\
\\gcd(d, n) &= p \\\\
\\#E(\\mathbb{F}_p) &\\in [p + 1 - 2\\sqrt{p}, \\; p + 1 + 2\\sqrt{p}] \\\\
\\text{Vary curve } (a, b) \\implies \\text{different } \\#E &\\implies \\text{one is smooth} \\\\
\\text{Expected time: } O(&\\exp(\\sqrt{2 \\ln p \\ln \\ln p})) \\qed
\\end{align*}

\\textbf{Explanation:} Pick a random elliptic curve and point. Compute M \\cdot P where M is the product of all prime powers up to B_1. If the curve order modulo p is B_1-smooth, the computation fails modulo p but not modulo other factors, revealing p via gcd. Try different curves until one succeeds.

\\textbf{References:} H. W. Lenstra Jr., "Factoring Integers with Elliptic Curves", Annals of Mathematics, 1987`,
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

# Use Sage's built-in factorization
try:
    factors = factor(n)
    print("Complete factorization:")
    for f, mult in factors:
        if mult == 1:
            print(f"  {f}")
        else:
            print(f"  {f}^{mult}")
    print(f"Verification: product = {prod(f for f, _ in factors)}")
    print(f"Original n:     {n}")
except Exception as ex:
    print(f"Factorization failed: {ex}")
`,
    proof: `\\textbf{Theorem:} Repeated ECM with factor removal yields the complete prime factorization of n.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item ECM finds one prime factor p of n at a time
\\item Fundamental Theorem of Arithmetic: n = p_1^{e_1} \\cdots p_k^{e_k} uniquely
\\item After finding p, reduce to n' = n / p and recurse
\\item Primality test (Miller-Rabin) for termination
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p_1^{e_1} p_2^{e_2} \\cdots p_k^{e_k}, \\quad p_1 < p_2 < \\cdots < p_k \\\\
\\text{ECM finds } p_i &\\text{ with prob. depending on smoothness of } \\#E(\\mathbb{F}_{p_i}) \\\\
n' &= n / p_i \\\\
\\text{Repeat until } n' = 1 &\\text{ or } n' \\text{ is prime} \\\\
n > n/p_{i_1} > n/(p_{i_1}p_{i_2}) > \\cdots &> 1 \\\\
\\text{Each step reduces } \\Omega(n) &\\text{ (total prime factors with multiplicity)} \\\\
\\text{Terminates in } \\Omega(n) &\\text{ iterations} \\\\
\\text{Total time: } \\sum_{i=1}^{k} O(\\exp(\\sqrt{2 \\ln p_i \\ln \\ln p_i})) & \\\\
\\text{Dominated by the largest prime factor.} & \\qed
\\end{align*}

\\textbf{Explanation:} Run ECM to find one factor, divide it out, and repeat on the quotient. The process terminates when the remainder is 1 or prime. Each iteration strictly reduces the number of prime factors, guaranteeing termination. The total cost is dominated by finding the largest prime factor.

\\textbf{References:} Lenstra, "Factoring Integers with Elliptic Curves", 1987`,
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
    # For each prime q in (B, B2], check gcd(a^(M*q) - 1, n)
    # This catches p-1 = q * s where s is B-smooth but q is not
    found_stage2 = False
    for q in prime_range(B + 1, B2 + 1):
            aMq = power_mod(aM, q, n)
            g = gcd(aMq - 1, n)
            if 1 < g < n:
                print(f"Factor found in Stage 2 with prime q = {q}!")
                print(f"p = {g}")
                print(f"q = {n // g}")
                found_stage2 = True
                break
    if not found_stage2:
        print("Pollard's p-1 failed. p-1 is not B2-smooth. Try ECM or another method.")
`,
    proof: `\\textbf{Theorem:} If p-1 is B-smooth, then p can be found in time O(B \\log B \\log^2 n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Fermat's Little Theorem: a^{p-1} \\equiv 1 \\pmod{p} for \\gcd(a, p) = 1
\\item p-1 is B-smooth: all prime factors of p-1 are \\leq B
\\item M = \\text{lcm}(1, 2, \\ldots, B) is divisible by every B-smooth number
\\item (p-1) | M \\implies a^M \\equiv 1 \\pmod{p}
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p-1 &= q_1^{e_1} q_2^{e_2} \\cdots q_r^{e_r}, \\quad q_i \\leq B \\\\
M &= \\text{lcm}(1, 2, \\ldots, B) \\\\
(p-1) &\\mid M \\\\
a^{p-1} &\\equiv 1 \\pmod{p} \\\\
a^M &\\equiv 1 \\pmod{p} \\\\
p &\\mid (a^M - 1) \\\\
p &\\mid \\gcd(a^M - 1, n) \\\\
1 < \\gcd(a^M - 1, n) < n &\\implies \\text{nontrivial factor found} \\\\
\\text{Stage 2: check } B < q \\leq B_2, \\; p-1 &= q \\cdot s, \\; s \\text{ is B-smooth} \\\\
\\text{Runtime: } O(B \\log B \\log^2 n) & \\qed
\\end{align*}

\\textbf{Explanation:} Compute M = lcm(1, ..., B) and then a^M mod n. If p-1 is B-smooth, then a^M \\equiv 1 \\pmod{p}, so gcd(a^M - 1, n) reveals p. Stage 2 extends the search to catch p-1 with one large prime factor between B and B_2.

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974`,
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

def pollard_rho(n, f=None, max_iter=100000):
    if f is None:
        f = lambda x: (x^2 + 1) % n

    # Floyd's cycle detection
    x = 2
    y = 2
    d = 1
    iterations = 0

    while d == 1:
        iterations += 1
        if iterations > max_iter:
            return None
        x = f(x)          # tortoise: one step
        y = f(f(y))       # hare: two steps
        d = gcd(abs(x - y), n)

    return d

# Try with different constants if needed
for c in range(1, 20):
    f = lambda x, c=c: (x^2 + c) % n
    factor = pollard_rho(n, f)
    if factor and factor != n and factor != 1:
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
    proof: `\\textbf{Theorem:} Pollard's rho finds a nontrivial factor of n in expected time O(n^{1/4}) = O(\\sqrt{p}).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Birthday paradox: collision among \\sqrt{N} random elements with prob \\approx 1/2
\\item Floyd's cycle detection: x (tortoise) advances 1 step, y (hare) advances 2 steps
\\item Pseudorandom sequence: x_{i+1} = x_i^2 + c \\pmod{n}
\\item Sequence modulo p repeats with period O(\\sqrt{p})
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
x_{i+1} &= x_i^2 + c \\pmod{n} \\\\
x_i \\pmod{p} &\\text{ lives in a set of size } p \\\\
\\text{Birthday paradox: collision after } &O(\\sqrt{p}) \\text{ steps} \\\\
\\exists i \\neq j: \\; x_i &\\equiv x_j \\pmod{p} \\\\
p &\\mid (x_i - x_j) \\\\
p &\\mid \\gcd(x_i - x_j, n) \\\\
x \\leftarrow f(x), \\quad y &\\leftarrow f(f(y)) \\\\
x \\equiv y \\pmod{p} &\\implies \\gcd(x - y, n) = p \\\\
\\text{Expected iterations: } O(\\sqrt{p}) &= O(n^{1/4}) \\\\
\\text{Total time: } O(n^{1/4} \\log^2 n) & \\qed
\\end{align*}

\\textbf{Explanation:} Generate a pseudorandom sequence x_{i+1} = x_i^2 + c mod n. The sequence modulo p must eventually cycle. Floyd's cycle detection finds when x \\equiv y \\pmod{p} by advancing tortoise 1 step and hare 2 steps. Then gcd(x - y, n) = p. Expected O(\\sqrt{p}) iterations.

\\textbf{References:} J. M. Pollard, "A Monte Carlo Method for Factorization", BIT Numerical Mathematics, 1975`,
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
    # Using binary exponentiation with dual tracking (V_j, V_{j+1})
    def lucas_V(k, P, n):
        if k == 0:
            return 2 % n
        if k == 1:
            return P % n
        result = 2 % n   # V_0
        result1 = P % n  # V_1
        bits = k.bits()
        for bit in reversed(bits):
            # Double: from (V_j, V_{j+1}) compute (V_{2j}, V_{2j+1})
            V2j = (result^2 - 2) % n
            V2j1 = (result * result1 - P) % n
            result, result1 = V2j, V2j1
            if bit == 1:
                # Add one: from (V_{2j}, V_{2j+1}) compute (V_{2j+1}, V_{2j+2})
                V2j2 = (result1^2 - 2) % n
                result, result1 = result1, V2j2
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
    proof: `\\textbf{Theorem:} If p+1 is B-smooth, then p can be found using Lucas sequences in time O(B \\log B \\log^2 n).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Lucas sequences: V_k(P, 1) with V_0 = 2, V_1 = P, V_k = P \\cdot V_{k-1} - V_{k-2}
\\item V_k(\\alpha + \\alpha^{-1}, 1) = \\alpha^k + \\alpha^{-k} where \\alpha, \\alpha^{-1} are roots of x^2 - Px + 1 = 0
\\item For (D/p) = -1 with D = P^2 - 4: \\alpha^{p+1} = 1 in \\mathbb{F}_{p^2}^*
\\item M = \\text{lcm}(1, 2, \\ldots, B)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p+1 &= q_1^{e_1} q_2^{e_2} \\cdots q_r^{e_r}, \\quad q_i \\leq B \\\\
\\text{Choose } P: \\; D = P^2 - 4, \\quad (D/p) &= -1 \\\\
x^2 - Px + 1 &= 0 \\text{ has roots } \\alpha, \\beta = \\alpha^{-1} \\text{ in } \\mathbb{F}_{p^2} \\\\
V_k &= \\alpha^k + \\alpha^{-k} \\\\
\\alpha^{p+1} &= 1 \\text{ in } \\mathbb{F}_{p^2}^* \\\\
M &= \\text{lcm}(1, 2, \\ldots, B), \\quad (p+1) \\mid M \\\\
\\alpha^M &= 1 \\\\
V_M &= \\alpha^M + \\alpha^{-M} = 1 + 1 = 2 \\pmod{p} \\\\
p &\\mid (V_M - 2) \\\\
p &\\mid \\gcd(V_M - 2, n) \\\\
\\text{Try different } P &\\text{ until } (D/p) = -1 \\qed
\\end{align*}

\\textbf{Explanation:} Choose P and compute V_M(P, 1) mod n using Lucas sequences. If p+1 is B-smooth and (P^2-4/p) = -1, then V_M \\equiv 2 \\pmod{p}, so gcd(V_M - 2, n) reveals p. Try different P values to find one with the right Legendre symbol.

\\textbf{References:} H. C. Williams, "A p+1 Method of Factoring", Mathematics of Computation, 1982`,
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
    proof: `\\textbf{Theorem:} Quadratic Sieve factors n in expected time O(\\exp(\\sqrt{\\ln n \\ln \\ln n})).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Congruent squares: x^2 \\equiv y^2 \\pmod{n}, x \\not\\equiv \\pm y \\implies \\gcd(x - y, n) is a factor
\\item Factor base \\mathcal{F} = \\{-1\\} \\cup \\{p : p \\leq B, (n/p) = 1\\}
\\item Q(x) = (x + \\lfloor\\sqrt{n}\\rfloor)^2 - n, sieved for B-smooth values
\\item Linear algebra over \\mathbb{F}_2 on exponent vectors
\\item Smoothness bound B = \\exp(\\frac{1}{2}\\sqrt{\\ln n \\ln \\ln n})
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= \\lfloor\\sqrt{n}\\rfloor, \\quad Q(x) = (x + m)^2 - n \\\\
Q(x) &\\equiv (x + m)^2 \\pmod{n} \\\\
\\mathcal{F} &= \\{-1\\} \\cup \\{p \\leq B : (n/p) = 1\\} \\\\
\\text{Find } x \\text{ such that } Q(x) &\\text{ is B-smooth over } \\mathcal{F} \\\\
Q(x) &= \\prod_{p \\in \\mathcal{F}} p^{e_p} \\\\
\\vec{v}_x &= (e_p \\bmod 2)_{p \\in \\mathcal{F}} \\in \\mathbb{F}_2^{|\\mathcal{F}|} \\\\
\\text{Collect } |\\mathcal{F}| + 1 \\text{ vectors, find dependency: } & \\\\
\\sum_{i \\in S} \\vec{v}_{x_i} &= \\vec{0} \\pmod{2} \\\\
\\prod_{i \\in S} Q(x_i) &= y^2 \\\\
X &= \\prod_{i \\in S} (x_i + m), \\quad X^2 \\equiv y^2 \\pmod{n} \\\\
X \\not\\equiv \\pm y \\pmod{n} &\\implies \\gcd(X - y, n) \\text{ is a factor} \\\\
\\text{Success prob: } \\geq 1/2, \\quad \\text{time: } O(&\\exp(\\sqrt{\\ln n \\ln \\ln n})) \\qed
\\end{align*}

\\textbf{Explanation:} Sieve values of Q(x) = (x + \\sqrt{n})^2 - n for smoothness over a factor base. Each smooth value gives an exponent vector mod 2. Find a linear dependency over \\mathbb{F}_2 to get a congruence of squares X^2 \\equiv y^2 \\pmod{n}. Then gcd(X - y, n) yields a factor with probability \\geq 1/2.

\\textbf{References:} C. Pomerance, "The Quadratic Sieve Factoring Algorithm", Eurocrypt 1984`,
    priority: 'high',
    applicableCheck: (p: Record<string, string>) => !!p.n,
  },
];
