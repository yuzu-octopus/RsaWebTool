import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'small-fraction',
  name: 'Small Fraction Attack',
  category: 'Factorization',
  description: 'Factors n when p/q ≈ a/b for small a,b. Uses trial division around isqrt(nb/a) for each candidate fraction.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        n = Integer(${vals.n})
        #
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
        if n.is_square():
            p = isqrt(n)
            print(f"n is a perfect square: {p}^2 = {n}")
            print(f"Verification: p * q = {p * p}")
            print(f"p = {p}")
            print(f"q = {p}")
            print()
            print("SMALL_FRACTION=SUCCESS")
            return
        #
        # Small fraction attack: p/q ≈ a/b for small a, b
        # For each coprime (a,b), approximate q ≈ sqrt(n*b/a), then trial-divide near q0
        # Trial division is orders of magnitude faster than Coppersmith small_roots per pair
        try:
            print(f"Searching for small fraction approximation of p/q...")
            print(f"n = {n}")
            print()
            found = False
            max_den = 50
            trial_window = 500
            pairs_tried = 0
            divs_tried = 0
            for b in range(1, max_den + 1):
                for a in range(1, b + 1):
                    if gcd(a, b) != 1:
                        continue
                    pairs_tried += 1
                    # q approx sqrt(n*b/a): p/q ≈ a/b => n = p*q ≈ a*q²/b
                    q0 = isqrt(n * b // a)
                    if q0 <= 1:
                        continue
                    # Exact rational match: q0 divides n
                    if n % q0 == 0:
                        q = Integer(q0)
                        p = n // q
                        if p > 1 and p * q == n:
                            print(f"Found! a/b = {a}/{b}")
                            print(f"Verification: p * q = {p * q}")
                            print(f"p = {p}")
                            print(f"q = {q}")
                            print(f"p/q = {float(p)/float(q):.10f}")
                            print(f"a/b = {float(a)/float(b):.10f}")
                            found = True
                            break
                    # Near-exact: try q0 ± delta
                    for delta in range(1, trial_window + 1):
                        divs_tried += 1
                        q_candidate = q0 + delta
                        if q_candidate > 1 and n % q_candidate == 0:
                            q = Integer(q_candidate)
                            p = n // q
                            if p > 1 and p * q == n:
                                print(f"Found! a/b = {a}/{b} (delta = +{delta})")
                                print(f"Verification: p * q = {p * q}")
                                print(f"p = {p}")
                                print(f"q = {q}")
                                print(f"p/q = {float(p)/float(q):.10f}")
                                print(f"a/b = {float(a)/float(b):.10f}")
                                found = True
                                break
                        q_candidate = q0 - delta
                        if q_candidate > 1 and n % q_candidate == 0:
                            q = Integer(q_candidate)
                            p = n // q
                            if p > 1 and p * q == n:
                                print(f"Found! a/b = {a}/{b} (delta = -{delta})")
                                print(f"Verification: p * q = {p * q}")
                                print(f"p = {p}")
                                print(f"q = {q}")
                                print(f"p/q = {float(p)/float(q):.10f}")
                                print(f"a/b = {float(a)/float(b):.10f}")
                                found = True
                                break
                    if found:
                        break
                if found:
                    break
            print()
            print(f"Pairs tested: {pairs_tried}, trial divisions: {divs_tried}")
            if found:
                print()
                print("SMALL_FRACTION=SUCCESS")
            else:
                print(f"No small fraction found with denominator up to {max_den}.")
                print("p/q may not be close to a small rational.")
                print()
                print("SMALL_FRACTION=FAILED")
        except Exception as e:
            print(f"Error in Small Fraction Attack: {e}")
            print("SMALL_FRACTION=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("SMALL_FRACTION=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} If $p/q \\approx a/b$ for small coprime $a, b$, then $q \\approx \\sqrt{nb/a}$ and trial division near $q_0$ recovers the factor.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$
\\item $p/q \\approx a/b$, $\\gcd(a,b) = 1$, small $a,b$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\frac{p}{q} &\\approx \\frac{a}{b} \\\\
n = pq &\\approx \\frac{a}{b} q^2 \\\\
q_0 &= \\left\\lfloor\\sqrt{\\frac{nb}{a}}\\right\\rfloor \\\\
\\text{Trial divide } q_0 \\pm k &\\text{ for small } k \\\\
\\text{Search: } 1 \\leq b &\\leq B, \\; 1 \\leq a \\leq b, \\; \\gcd(a,b) = 1 \\\\
\\text{Complexity: } O(B^2 \\cdot \\Delta) &\\text{ divisions} \\qed
\\end{align*}

\\textbf{References:} Menezes et al., "Handbook of Applied Cryptography"; Boneh, "Twenty Years of Attacks on the RSA Cryptosystem", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Need p/q close to a small rational a/b. Construct: pick small a, b, then generate q, set p ≈ q * a/b.
  const a = BigInt(3);
  const b = BigInt(5);
  const q = randomPrime(TESTCASE_BITS.q);
  const pTarget = (q * a) / b;
  let p = pTarget;
  for (let delta = 0n; delta < 500n; delta += 1n) {
    const candidate1 = pTarget + delta;
    if (candidate1 > 1n && isPrimeMR(candidate1)) { p = candidate1; break; }
    const candidate2 = pTarget - delta;
    if (candidate2 > 1n && isPrimeMR(candidate2)) { p = candidate2; break; }
  }
  return { n: (p * q).toString() };
};
