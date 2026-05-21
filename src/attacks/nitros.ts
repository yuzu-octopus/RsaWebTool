import type { Attack } from '../types';
import { randomPrime, isPrimeMR, generateKeyPair } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'nitros',
  name: 'Nitros / ROCA Variant',
  category: 'Advanced',
  description: 'Factors generalized ROCA primes with arbitrary base. Use when p = k·M + (a^i mod M).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'base', label: 'Base (default 65537)', placeholder: '65537', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `# Validate inputs
if not "${vals.n}".strip():
    print("ERROR: n is required")
    print("NITROS=FAILED")
    quit()

try:
    n = Integer(${vals.n})
    base_val = "${vals.base}".strip()
    base = Integer(base_val) if base_val else Integer(65537)

    # Even check
    if n % 2 == 0:
        print(f"n is even. p = 2, q = {n // 2}")
        print("NITROS=SUCCESS")
        quit()

    # Prime check
    if is_prime(n):
        print("n is prime. Not a valid RSA modulus.")
        print("NITROS=FAILED")
        quit()

    print("Nitros / Extended ROCA attack")
    print(f"n = {n}")
    print(f"base = {base}")
    print()

    # Try multiple prime bases for M
    prime_sets = [
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53],
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59],
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61],
    ]

    found = False
    for primes_subset in prime_sets:
        M = prod(primes_subset)
        # Skip if base is not coprime to M — multiplicative_order would crash
        if gcd(base, M) != 1:
            print(f"M = {M}: gcd(base, M) = {gcd(base, M)} != 1, skipping...")
            continue

        # Compute remainders
        ord_val = Mod(base, M).multiplicative_order()
        remainders = set()
        for idx in range(ord_val):
            r = power_mod(base, idx, M)
            remainders.add(r)

        n_mod = n % M

        # Check if n_mod factors into two remainders
        for r1 in remainders:
            r2 = n_mod * inverse_mod(r1, M) % M
            if r2 in remainders:
                print(f"Match found with M = {M}")
                print(f"r1 = {r1}, r2 = {r2}")
                print(f"Verification: r1 * r2 mod M = {(r1 * r2) % M} (n mod M = {n_mod})")
                found = True

                # Try Coppersmith
                R.<x> = PolynomialRing(ZZ)
                f = M*x + r1
                bound = ceil(sqrt(n) / M)

                f_mod = f.change_ring(Zmod(n))
                roots = f_mod.small_roots(X=bound, beta=0.5, epsilon=0.05)

                if roots:
                    k = int(roots[0])
                    p = int(M * k + r1)
                    if n % p == 0:
                        q = n // p
                        print(f"SUCCESS! p = {p}, q = {q}")
                        print(f"Verification: p * q = {p * q}")
                        print("NITROS=SUCCESS")
                    else:
                        print(f"Root found but doesn't divide n. Trying r2...")
                        f2 = M*x + r2
                        roots2 = f2.change_ring(Zmod(n)).small_roots(X=bound, beta=0.5, epsilon=0.05)
                        if roots2:
                            k2 = int(roots2[0])
                            p2 = int(M * k2 + r2)
                            if n % p2 == 0:
                                print(f"SUCCESS! p = {p2}, q = {n // p2}")
                                print("NITROS=SUCCESS")
                            else:
                                print("NITROS=FAILED")
                        else:
                            print("NITROS=FAILED")
                else:
                    print("NITROS=FAILED")
                break
        if found:
            break

    if not found:
        print("No ROCA/Nitros pattern detected for tested M values.")
        print("NITROS=FAILED")

except Exception as ex:
    print(f"ERROR: {ex}")
    print("NITROS=FAILED")
`,
  proof: `\\textbf{Theorem:} The Nitros attack generalizes ROCA to primes of the form \\(p = k \\cdot M + (a^{i} \\bmod M)\\) for arbitrary base \\(a\\).

\\textbf{Prerequisites:}
\\begin{itemize}
\\item Modulus \\(n = pq\\) with at least one prime of the generalized form
\\item Base \\(a\\) with \\(\\gcd(a, M) = 1\\) (default: \\(a = 65537\\))
\\item \\(M\\) — product of a subset of small primes
\\item Remainder set \\(\\mathcal{R} = \\{a^i \\bmod M : i \\geq 0\\}\\) must be enumerable
\\item \\(M > n^{1/4}\\) for Coppersmith's method
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= k \\cdot M + r_1, \\quad r_1 \\in \\mathcal{R} \\\\
n &\\equiv r_1 \\cdot r_2 \\pmod{M}, \\quad r_2 \\in \\mathcal{R} \\\\
r_2 &\\equiv n \\cdot r_1^{-1} \\pmod{M} \\\\
f(x) &= M \\cdot x + r_1 \\equiv 0 \\pmod{p} \\\\
|x_0| = k &< \\frac{\\sqrt{n}}{M} < p^{1/\\delta} \\quad (\\delta = 1) \\\\
\\text{Coppersmith recovers } x_0 = k &\\implies p = M \\cdot k + r_1 \\qed
\\end{align*}

\\textbf{Explanation:} The algorithm tests multiple prime subsets for \\(M\\) and configurable base \\(a\\). Once a matching remainder pair \\((r_1, r_2)\\) is found, Coppersmith's method recovers \\(k\\). Both \\(r_1\\) and \\(r_2\\) are tried as candidate remainders.

\\textbf{References:} Nemec et al., CCS 2017; extended analysis in subsequent ROCA research`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const base = 65537n; // Must be coprime to ALL primes in M — 7 would fail since 7|M
  const primes_list = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n];
  let M = 1n;
  for (const p of primes_list) { M *= p; }
  // M ≈ 2^77, Coppersmith bound ~N^0.2 for degree-1 polynomial.
  // For 512-bit N: bound ≈ 2^102, but k ≈ 2^179 → won't work.
  // Use p ≈ 120 bits so k ≈ 44 bits < bound ≈ 2^48 for N ≈ 240 bits.
  const pBits = 120;
  const kBits = pBits - 77; // ≈ 43
  for (let attempt = 0; attempt < 5000; attempt++) {
    const i = BigInt(Math.floor(Math.random() * 10000));
    const r = modPow(base, i, M);
    // Generate random k of appropriate bit size
    const kBytes = Math.ceil(kBits / 8);
    const bytes = new Uint8Array(kBytes);
    crypto.getRandomValues(bytes);
    let k = 0n;
    for (let j = 0; j < kBytes; j++) { k = (k << 8n) | BigInt(bytes[j]); }
    k |= (1n << BigInt(kBits - 1));
    k |= 1n;
    k &= (1n << BigInt(kBits)) - 1n;
    const p = k * M + r;
    if (isPrimeMR(p)) {
      const q = randomPrime(120);
      return { n: (p * q).toString(), base: base.toString() };
    }
  }
  // Fallback: use regular random RSA keypair with 120-bit primes
  const pair = generateKeyPair(120, 120);
  return { n: pair.n.toString(), base: base.toString() };
};
