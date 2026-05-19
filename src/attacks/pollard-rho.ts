import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'pollard-rho',
  name: "Pollard's Rho Method",
  category: 'Factorization',
  description: 'Factors n via birthday paradox. Use for general factorization of small factors.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `n = Integer(${vals.n})

print(f"Pollard's Rho on n = {n}")
print()

if n < 2:
    print(f"n = {n} is too small to factor")
    print("POLLARD_RHO=FAILED")
    return
if n % 2 == 0:
    print(f"n is even: {n}")
    print(f"p = 2, q = {n // 2}")
    print("POLLARD_RHO=SUCCESS")
    return
if n.is_prime():
    print(f"n is prime: {n}")
    print("POLLARD_RHO=FAILED")
    return

# Floyd's cycle detection
def g(x):
    return (x * x + 1) % n

found = False
for c_val in range(1, 20):
    def g_c(x, c=c_val):
        return (x * x + c) % n

    x, y, d = 2, 2, 1
    while d == 1:
        x = g_c(x)
        y = g_c(g_c(y))
        d = gcd(abs(y - x), n)

    if 1 < d < n:
        p = d
        q = n // p
        print(f"p = {p}")
        print(f"q = {q}")
        print(f"Verification: p * q = {p * q}")
        print(f"c value: {c_val}")
        print("POLLARD_RHO=SUCCESS")
        found = True
        break

if not found:
    print("Pollard's rho failed: no factor found")
    print("Try ECM or other methods")
    print("POLLARD_RHO=FAILED")
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
};

export const generateTestcase = (): Record<string, string> => {
  const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  return { n: n.toString() };
};
