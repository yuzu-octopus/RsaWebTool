import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { isqrt } from '../utils/bigint';

const numGcd = (a: number, b: number): number => {
  while (b) { [a, b] = [b, a % b]; }
  return a;
};

export const attack: Attack = {
  id: 'small-fraction',
  name: 'Small Fraction Attack',
  category: 'Factorization',
  description: "Factors n when p/q approximates a small rational a/b by solving for q and testing candidates via trial division. Use when p/q is close to a simple fraction.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `import math
def _attack():
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
        # Use Python ints for fast trial division
        try:
            print(f"Searching for small fraction approximation of p/q...")
            print(f"n = {n}")
            print()
            found = False
            max_den = 50
            trial_window = 500
            pairs_tried = 0
            divs_tried = 0
            n_int = int(n)
            for b in range(1, max_den + 1):
                for a in range(1, b + 1):
                    if math.gcd(a, b) != 1:
                        continue
                    pairs_tried += 1
                    # q approx sqrt(n*b/a): p/q ≈ a/b => n = p*q ≈ a*q²/b
                    q0 = math.isqrt(n_int * b // a)
                    if q0 <= 1:
                        continue
                    # Exact rational match: q0 divides n
                    if n_int % q0 == 0:
                        q_sage = Integer(q0)
                        p_sage = n // q_sage
                        if p_sage > 1 and p_sage * q_sage == n:
                            print(f"Found! a/b = {a}/{b}")
                            print(f"Verification: p * q = {p_sage * q_sage}")
                            print(f"p = {p_sage}")
                            print(f"q = {q_sage}")
                            print(f"p/q = {float(p_sage)/float(q_sage):.10f}")
                            print(f"a/b = {float(a)/float(b):.10f}")
                            found = True
                            break
                    # Near-exact: try q0 ± delta
                    for delta in range(1, trial_window + 1):
                        divs_tried += 1
                        q_candidate = q0 + delta
                        if q_candidate > 1 and n_int % q_candidate == 0:
                            q_sage = Integer(q_candidate)
                            p_sage = n // q_sage
                            if p_sage > 1 and p_sage * q_sage == n:
                                print(f"Found! a/b = {a}/{b} (delta = +{delta})")
                                print(f"Verification: p * q = {p_sage * q_sage}")
                                print(f"p = {p_sage}")
                                print(f"q = {q_sage}")
                                print(f"p/q = {float(p_sage)/float(q_sage):.10f}")
                                print(f"a/b = {float(a)/float(b):.10f}")
                                found = True
                                break
                        q_candidate = q0 - delta
                        if q_candidate > 1 and n_int % q_candidate == 0:
                            q_sage = Integer(q_candidate)
                            p_sage = n // q_sage
                            if p_sage > 1 and p_sage * q_sage == n:
                                print(f"Found! a/b = {a}/{b} (delta = -{delta})")
                                print(f"Verification: p * q = {p_sage * q_sage}")
                                print(f"p = {p_sage}")
                                print(f"q = {q_sage}")
                                print(f"p/q = {float(p_sage)/float(q_sage):.10f}")
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
  frontendCheck: (vals) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n % 2n === 0n) return Promise.resolve(`Factor found!\np = 2\nq = ${n / 2n}\nSMALL_FRACTION=SUCCESS`);

      for (let b = 1; b <= 50; b++) {
        for (let a = 1; a <= b; a++) {
          if (numGcd(a, b) !== 1) continue;
          const q0 = isqrt(n * BigInt(b) / BigInt(a));
          for (let delta = -500; delta <= 500; delta++) {
            const q = q0 + BigInt(delta);
            if (q > 1n && n % q === 0n) {
              const p = n / q;
              if (p > 1n) {
                return Promise.resolve(`Factor found!\np = ${p}\nq = ${q}\nUsing a=${a}, b=${b}\nSMALL_FRACTION=SUCCESS`);
              }
            }
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If $p/q \\approx a/b$ for small coprime $a, b$, then $q \\approx \\sqrt{nb/a}$ and trial division near $q_0$ recovers the factor.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$
\\item $p/q \\approx a/b$, with $\\gcd(a,b) = 1$ and $a,b$ small
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\frac{p}{q} &\\approx \\frac{a}{b} \\\\
n = pq &\\approx \\frac{a}{b} q^2 \\\\
q_0 &= \\left\\lfloor\\sqrt{\\frac{nb}{a}}\\right\\rfloor \\\\
\\text{Trial divide } q_0 \\pm k &\\text{ for small } k \\\\
\\text{Search space: } 1 \\leq b &\\leq B, \\; 1 \\leq a \\leq b, \\; \\gcd(a,b) = 1 \\\\
\\text{Complexity: } O(B^2 \\cdot \\Delta) &\\text{ divisions}
\\end{align*}

\\textbf{Explanation:} When $p \\approx (a/b) \\cdot q$, substituting into $n = pq$ gives $q^2 \\approx nb/a$. We compute $q_0 = \\lfloor\\sqrt{nb/a}\\rfloor$ for each candidate fraction $a/b$ and test the surrounding window for an exact divisor of $n$. Because $a, b$ are constrained to be small (denominator $\\leq 50$), the search is efficient.

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
