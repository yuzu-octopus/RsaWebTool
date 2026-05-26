import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'novelty-primes',
  name: 'Novelty Primes',
  category: 'Factorization',
  description: 'Detects primes near powers of two or mathematical constants via windowed trial division. Use for CTF moduli with novelty-crafted primes.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `import math
def _attack():
    try:
        try:
            n = Integer(${vals.n})
            if n < 2:
                print(f"n = {n} is too small to factor")
                print("NOVELTY_PRIMES=FAILED")
                return
            if n % 2 == 0:
                print(f"n is even: {n}")
                print(f"p = 2")
                print(f"q = {n // 2}")
                print(f"Verification: 2 * {n // 2} = {n}")
                print("NOVELTY_PRIMES=SUCCESS")
                return
            if n.is_prime():
                print(f"n is prime: {n}")
                print("No factorization possible")
                print("NOVELTY_PRIMES=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                print(f"n is a perfect square: {p}^2 = {n}")
                print(f"p = q = {p}")
                print("NOVELTY_PRIMES=SUCCESS")
                return
            print(f"Checking n = {n} against known CTF primes...")
            found = False
            print("Checking primes near powers of 2...")
            n_int = int(n)
            for bits in [64, 128, 256, 512]:
                target = 1 << bits
                for delta in range(-1000, 1000):
                    candidate = target + delta
                    if candidate > 1 and n_int % candidate == 0:
                        if is_prime(candidate):
                            p_sage = Integer(candidate)
                            print(f"  Found prime near 2^{bits}: {p_sage}")
                            print(f"  Cofactor: {n // p_sage}")
                            print(f"  Verification: {p_sage} * {n // p_sage} = {n}")
                            print(f"p = {p_sage}")
                            print(f"q = {n // p_sage}")
                            found = True
            print("\\nChecking primes near common constants...")
            constants = [
                ("pi", 3141592653589793238462643383279502884197169399375105820974),
                ("e", 2718281828459045235360287471352662497757247093699959574966),
                ("sqrt(2)", 1414213562373095048801688724209698078569671875376948073176),
            ]
            for name, const in constants:
                const_int = int(const)
                for delta in range(-100, 100):
                    candidate = const_int + delta
                    if candidate > 1 and n_int % candidate == 0:
                        if is_prime(candidate):
                            p_sage = Integer(candidate)
                            print(f"  Found prime near {name}: {p_sage}")
                            print(f"  Cofactor: {n // p_sage}")
                            print(f"p = {p_sage}")
                            print(f"q = {n // p_sage}")
                            found = True
            if found:
                print("NOVELTY_PRIMES=SUCCESS")
            else:
                print("\\nNo novelty primes found.")
                print("NOVELTY_PRIMES=FAILED")
        except Exception as e:
            print(f"Error in Novelty Primes check: {e}")
            print("NOVELTY_PRIMES=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("NOVELTY_PRIMES=FAILED")
_attack()`,
  frontendCheck: (vals) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      if (n < 2n) return Promise.resolve(null);
      if (n % 2n === 0n) return Promise.resolve(`n is even: ${n}\np = 2\nq = ${n / 2n}\nNOVELTY_PRIMES=SUCCESS`);
      // Check primes near powers of 2
      for (const bits of [64, 128, 256, 512]) {
        const target = 1n << BigInt(bits);
        for (let delta = -1000n; delta <= 1000n; delta++) {
          const candidate = target + delta;
          if (candidate > 1n && n % candidate === 0n) {
            return Promise.resolve(`Found prime near 2^${bits}: ${candidate}\nCofactor: ${n / candidate}\nVerification: ${candidate} * ${n / candidate} = ${n}\nNOVELTY_PRIMES=SUCCESS`);
          }
        }
      }
      // Check primes near math constants (first 55 decimal digits)
      const constants: [string, bigint][] = [
        ['pi', 3141592653589793238462643383279502884197169399375105820974n],
        ['e', 2718281828459045235360287471352662497757247093699959574966n],
        ['sqrt(2)', 1414213562373095048801688724209698078569671875376948073176n],
      ];
      for (const [name, digits] of constants) {
        for (let delta = -100n; delta <= 100n; delta++) {
          const candidate = digits + delta;
          if (candidate > 1n && n % candidate === 0n) {
            return Promise.resolve(`Found prime near ${name}: ${candidate}\nCofactor: ${n / candidate}\nNOVELTY_PRIMES=SUCCESS`);
          }
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If $p$ is a prime near a power of two or a mathematical constant, a windowed trial division search finds it.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$ where $p$ is near a known structured value
\\item Search windows around powers of two $2^k$ ($k \\in \\{64, 128, 256, 512\\}$) and constants $\\pi, e, \\sqrt{2}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &\\approx 2^k + \\delta,\\; |\\delta| \\leq W \\text{ (window size)} \\\\
p &\\approx C + \\delta,\\; C \\in \\{\\pi, e, \\sqrt{2}, \\ldots\\} \\\\
n \\bmod (2^k + \\delta) = 0 &\\implies p = 2^k + \\delta,\\; q = n/p \\\\
\\text{Cost: } &O(W \\cdot \\log^2 n) \\qed
\\end{align*}

\\textbf{Explanation:} CTF challenge authors sometimes construct primes from well-known numbers — $p = 2^k \\pm \\delta$ (near powers of two) or $p = \\lfloor \\pi \\times 10^m \\rfloor \\pm \\delta$ (from mathematical constants). This attack checks candidates in a window around each known value, testing divisibility of $n$.

\\textbf{References:} Cryptopals; Cryptohack.org; various CTF writeups`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate a prime near a power of 2 (512-bit — fast primality check)
  const bits = 512;
  const target = 1n << BigInt(bits);
  let p = 0n;
  for (let delta = 0n; delta < 1000n; delta += 1n) {
    const candidate1 = target + delta;
    if (isPrimeMR(candidate1)) { p = candidate1; break; }
    const candidate2 = target - delta;
    if (candidate2 > 1n && isPrimeMR(candidate2)) { p = candidate2; break; }
  }
  const q = randomPrime(TESTCASE_BITS.q);
  return { n: (p * q).toString() };
};
