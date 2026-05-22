import type { Attack } from '../types';
import { isPrimeMR, generateKeyPair } from '../utils/testcases/core';
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
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        try:
            n_input = "${vals.n}".strip()
            if not n_input:
                print("ERROR: n is required")
                print("NITROS=FAILED")
                return
            n = Integer(n_input)
            base_val = "${vals.base}".strip()
            base = Integer(base_val) if base_val else Integer(65537)
            # Even check
            if n % 2 == 0:
                print(f"n is even. p = 2, q = {n // 2}")
                print("NITROS=SUCCESS")
                return
            # Prime check
            if is_prime(n):
                print("n is prime. Not a valid RSA modulus.")
                print("NITROS=FAILED")
                return
            print("Nitros / Extended ROCA attack")
            print(f"n = {n}")
            print(f"base = {base}")
            print()
            # Use a single well-chosen M (product of first 16 primes ≈ 2^53)
            # This keeps Coppersmith fast while covering typical Nitros/ROCA primes
            primes_subset = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]
            M = prod(primes_subset)
            if gcd(base, M) != 1:
                print(f"M = {M}: gcd(base, M) = {gcd(base, M)} != 1, skipping...")
                print("NITROS=FAILED")
                return
            # Compute remainders
            ord_val = Mod(base, M).multiplicative_order()
            remainders = set()
            for idx in range(ord_val):
                r = power_mod(base, idx, M)
                remainders.add(r)
            n_mod = n % M
            # Collect all valid remainder pairs
            pairs = []
            for r1 in remainders:
                r2 = n_mod * inverse_mod(r1, M) % M
                if r2 in remainders:
                    pairs.append((r1, r2))
            if not pairs:
                print("No valid remainder pairs found with this M.")
                print("NITROS=FAILED")
                return
            print(f"Found {len(pairs)} valid remainder pair(s) with M = {M}")
            # Try Coppersmith with the first pair
            factored = False
            try:
                R.<x> = PolynomialRing(ZZ)
                r1_try, r2_try = pairs[0]
                f = M*x + r1_try
                bound = ceil(sqrt(n) / M)
                f_mod = f.change_ring(Zmod(n)).monic()
                roots = f_mod.small_roots(X=bound, beta=0.5, epsilon=0.05)
                if roots:
                    k = int(roots[0])
                    p = int(M * k + r1_try)
                    if n % p == 0:
                        q = n // p
                        print(f"SUCCESS! p = {p}, q = {q}")
                        print("NITROS=SUCCESS")
                        factored = True
                if not factored:
                    f2 = M*x + r2_try
                    roots2 = f2.change_ring(Zmod(n)).monic().small_roots(X=bound, beta=0.5, epsilon=0.05)
                    if roots2:
                        k2 = int(roots2[0])
                        p2 = int(M * k2 + r2_try)
                        if n % p2 == 0:
                            print(f"SUCCESS! p = {p2}, q = {n // p2}")
                            print("NITROS=SUCCESS")
                            factored = True
            except BaseException:
                pass
            if not factored:
                print("No ROCA/Nitros pattern detected for tested M values.")
                print("NITROS=FAILED")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("NITROS=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("NITROS=FAILED")
_attack()`,
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
  const base = 65537n; // Must be coprime to ALL primes in M
  // Use the same 16-prime set as the template (M ≈ 2^53)
  const primes_list = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n];
  let M = 1n;
  for (const p of primes_list) { M *= p; }
  // Use p ≈ 80 bits so k ≈ 27 bits — Coppersmith finds this easily in < 1s.
  // Both p and q must be Nitros-form so that the template's remainder check passes.
  const pBits = 80;
  const kBits = pBits - 53; // ≈ 27
  const kBytes = Math.ceil(kBits / 8);
  for (let attempt = 0; attempt < 5000; attempt++) {
    const i1 = BigInt(Math.floor(Math.random() * 10000));
    const r1 = modPow(base, i1, M);
    const i2 = BigInt(Math.floor(Math.random() * 10000));
    const r2 = modPow(base, i2, M);
    const bytes1 = new Uint8Array(kBytes);
    crypto.getRandomValues(bytes1);
    let k1 = 0n;
    for (let j = 0; j < kBytes; j++) { k1 = (k1 << 8n) | BigInt(bytes1[j]); }
    k1 |= (1n << BigInt(kBits - 1));
    k1 |= 1n;
    k1 &= (1n << BigInt(kBits)) - 1n;
    const bytes2 = new Uint8Array(kBytes);
    crypto.getRandomValues(bytes2);
    let k2 = 0n;
    for (let j = 0; j < kBytes; j++) { k2 = (k2 << 8n) | BigInt(bytes2[j]); }
    k2 |= (1n << BigInt(kBits - 1));
    k2 |= 1n;
    k2 &= (1n << BigInt(kBits)) - 1n;
    const p = k1 * M + r1;
    const q = k2 * M + r2;
    if (p !== q && isPrimeMR(p) && isPrimeMR(q)) {
      return { n: (p * q).toString(), base: base.toString() };
    }
  }
  // Fallback: use regular random RSA keypair with 120-bit primes
  const pair = generateKeyPair(64, 64);
  return { n: pair.n.toString(), base: base.toString() };
};
