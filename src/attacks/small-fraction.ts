import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'small-fraction',
  name: 'Small Fraction Attack',
  category: 'Factorization',
  description: 'Factors n when p/q ≈ a/b for small a,b. Use when prime ratio is close to a small rational.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

if n < 2:
    print(f"n = {n} is too small to factor")
    print("SMALL_FRACTION=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2")
    print(f"q = {n // 2}")
    print(f"Verification: 2 * {n // 2} = {n}")
    print("SMALL_FRACTION=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("No factorization possible")
    print("SMALL_FRACTION=FAILED")
    return

# Small fraction attack: p/q ≈ a/b for small a, b
# Search over small denominators and use Coppersmith
try:
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
            bound = ZZ(q_approx**0.3)
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

    if found:
        print("SMALL_FRACTION=SUCCESS")
    else:
        print(f"No small fraction found with denominator up to {max_den}.")
        print("p/q may not be close to a small rational.")
        print("SMALL_FRACTION=FAILED")
except Exception as e:
    print(f"Error in Small Fraction Attack: {e}")
    print("SMALL_FRACTION=FAILED")
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
};

export const generateTestcase = (): Record<string, string> => {
  // Need p/q close to a small rational a/b. Construct: pick small a, b, then generate q, set p ≈ q * a/b.
  const a = BigInt(3);
  const b = BigInt(5);
  const q = randomPrime(TESTCASE_BITS.q);
  let pTarget = (q * a) / b;
  let p = pTarget;
  for (let delta = 0n; delta < 500n; delta += 1n) {
    const candidate1 = pTarget + delta;
    if (candidate1 > 1n && isPrimeMR(candidate1)) { p = candidate1; break; }
    const candidate2 = pTarget - delta;
    if (candidate2 > 1n && isPrimeMR(candidate2)) { p = candidate2; break; }
  }
  return { n: (p * q).toString() };
};
