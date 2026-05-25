import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'novelty-primes',
  name: 'Novelty Primes',
  category: 'Factorization',
  description: 'Detects primes near powers of 2 or math constants. Use when p ≈ 2^k or similar.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
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
            for bits in [64, 128, 256, 512]:
                target = 2**bits
                for delta in range(-1000, 1000):
                    candidate = target + delta
                    if candidate > 1 and candidate.is_prime():
                        if n % candidate == 0:
                            print(f"  Found prime near 2^{bits}: {candidate}")
                            print(f"  Cofactor: {n // candidate}")
                            print(f"  Verification: {candidate} * {n // candidate} = {n}")
                            found = True
            print("\\nChecking primes near common constants...")
            RF = RealField(300)
            constants = [
                ("pi", Integer(str(RF(pi()).n(digits=60).str()).replace('.', '')[:55])),
                ("e", Integer(str(RF(exp(1)).n(digits=60).str()).replace('.', '')[:55])),
                ("sqrt(2)", Integer(str(RF(2).sqrt().n(digits=60).str()).replace('.', '')[:55])),
            ]
            for name, const in constants:
                for delta in range(-100, 100):
                    candidate = const + delta
                    if candidate > 1 and candidate.is_prime():
                        if n % candidate == 0:
                            print(f"  Found prime near {name}: {candidate}")
                            print(f"  Cofactor: {n // candidate}")
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
  proof: `\\textbf{Theorem:} CTF primes may be reused or near structured values; check via database lookup and window search.

\\textbf{Setup:}
\\begin{itemize}
\\item n = pq
\\item Known prime database \\mathcal{P}
\\item Structured windows around 2^k, constants
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\mathcal{P} &= \\{p_1, \\ldots, p_m\\} \\\\
n \\bmod p_i &= 0 \\implies p_i \\mid n,\\; q = n/p_i \\\\
p &\\approx 2^k + \\delta,\\; |\\delta| \\leq W \\\\
p &\\approx C + \\delta,\\; C \\in \\{\\pi, e, \\sqrt{2}, \\ldots\\} \\\\
\\text{isPrime}(C + \\delta) \\land (n \\bmod (C + \\delta) = 0) &\\implies \\text{factor} \\qed
\\end{align*}

\\textbf{References:} Various CTF writeups; cryptohack.org`,
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
