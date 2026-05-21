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
  sageTemplate: (vals: Record<string, string>) => `try:
    n = Integer(${vals.n})
    if n < 2:
        print(f"n = {n} is too small to factor")
        print("NOVELTY_PRIMES=FAILED")
        quit()
    if n % 2 == 0:
        print(f"n is even: {n}")
        print(f"p = 2")
        print(f"q = {n // 2}")
        print(f"Verification: 2 * {n // 2} = {n}")
        print("NOVELTY_PRIMES=SUCCESS")
        quit()
    if n.is_prime():
        print(f"n is prime: {n}")
        print("No factorization possible")
        print("NOVELTY_PRIMES=FAILED")
        quit()
    if n.is_square():
        p = isqrt(n)
        print(f"n is a perfect square: {p}^2 = {n}")
        print(f"p = q = {p}")
        print("NOVELTY_PRIMES=SUCCESS")
        quit()
    print(f"Checking n = {n} against known CTF primes...")
    print()
    known_ctf_primes = [
        # Common weak primes used in CTFs
        # (In practice, these would be populated from a database of CTF challenges)
        # Example: primes from CSAW, DEF CON, Plaid CTF, etc.
        # The list below is illustrative
    ]
    found = False
    print("Checking primes near powers of 2...")
    for bits in [64, 128, 256]:
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
    RF = RealField(200)
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
    if known_ctf_primes:
        print("\\nChecking against known CTF primes...")
        for kp in known_ctf_primes:
            kp = Integer(kp)
            if n % kp == 0:
                print(f"  Found known CTF prime: {kp}")
                print(f"  Cofactor: {n // kp}")
                found = True
    if found:
        print("NOVELTY_PRIMES=SUCCESS")
    else:
        print("\\nNo novelty primes found.")
        print("NOVELTY_PRIMES=FAILED")
    print("\\nNovelty prime check complete.")
except Exception as e:
    print(f"Error in Novelty Primes check: {e}")
    print("NOVELTY_PRIMES=FAILED")
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
\\text{Cost: } O(m \\log^2 n + W \\cdot \\text{primality}) & \\qed
\\end{align*}

\\textbf{Explanation:} CTF challenges sometimes reuse primes or generate primes near recognizable values (powers of 2, mathematical constants). Checking divisibility against a database of known primes and searching small windows around structured values can quickly factor such moduli.

\\textbf{References:} Various CTF writeups; cryptohack.org challenges; RSA CTF problem databases`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate a prime near a power of 2
  const bits = TESTCASE_BITS.p;
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
