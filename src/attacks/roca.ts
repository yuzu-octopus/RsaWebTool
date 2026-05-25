import type { Attack } from '../types';
import { modPow } from '../utils/bigint';
import { generateKeyPair } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'roca',
  name: 'ROCA Vulnerability',
  category: 'Advanced',
  description: 'Factors ROCA-vulnerable primes. Use when p = k·M + (65537^i mod M).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    out = []
    try:
        try:
            if not "${vals.n}".strip():
                out.append("ERROR: n is required")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            n = Integer(${vals.n})
            if n % 2 == 0:
                out.append("n is even. p = 2, q = " + str(n // 2))
                out.append("ROCA=SUCCESS")
                print("\\n".join(out))
                return
            if is_prime(n):
                out.append("n is prime. Not a valid RSA modulus.")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            out.append("ROCA vulnerability check")
            out.append("n = " + str(n))
            primes_list = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]
            best_M = None
            best_r = 0
            for num_primes in range(4, len(primes_list) + 1):
                M = prod(primes_list[:num_primes])
                if M > 2**50:
                    break
                ord_val = Mod(65537, M).multiplicative_order()
                remainders = set()
                for idx in range(ord_val):
                    r = power_mod(65537, idx, M)
                    remainders.add(r)
                n_mod = n % M
                for r in remainders:
                    if n_mod * inverse_mod(r, M) % M in remainders:
                        best_M = M
                        best_r = r
                        break
            if best_M is not None:
                r = best_r
                M = best_M
                bound = ceil(sqrt(n) / M * 2)
                found_k = None
                try:
                    R.<x> = PolynomialRing(ZZ)
                    f = M*x + r
                    f_mod = f.change_ring(Zmod(n))
                    f_monic = f_mod.monic()
                    roots = f_monic.small_roots(X=bound, beta=0.5, epsilon=0.05)
                    if roots:
                        k = int(roots[0])
                        p = int(M * k + r)
                        if n % p == 0:
                            found_k = k
                except Exception:
                    pass
                if found_k is None:
                    for k in range(bound):
                        if n % (M * k + r) == 0:
                            found_k = k
                            break
                if found_k is not None:
                    k = found_k
                    p = int(M * k + r)
                    q = n // p
                    out.append("VULNERABLE: n uses ROCA-generated primes.")
                    out.append("Verification: p * q = " + str(p * q))
                    out.append("p = " + str(p))
                    out.append("q = " + str(q))
                    out.append("")
                    out.append("ROCA=SUCCESS")
                else:
                    out.append("No root found with M = " + str(M))
                    out.append("ROCA=FAILED")
            else:
                out.append("n does NOT appear to be ROCA-vulnerable.")
                out.append("ROCA=FAILED")
        except Exception as ex:
            out.append("ERROR: " + str(ex))
            out.append("ROCA=FAILED")
        #
    except BaseException as ex:
        out.append("ERROR: " + str(ex))
        out.append("ROCA=FAILED")
    print("\\n".join(out))
_attack()`,
  proof: `\\textbf{Theorem:} ROCA primes have form \\(p = k \\cdot M + (65537^i \\bmod M)\\), factorable via Coppersmith.

\\textbf{Setup:}
\\begin{itemize}
\\item n = pq
\\item $M > n^{1/4}$, $\\mathcal{R} = \\{65537^i \\bmod M : i \\geq 0\\}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= kM + r_1, \\quad r_1 \\in \\mathcal{R} \\\\
n &\\equiv r_1 \\cdot r_2 \\pmod{M} \\\\
f(x) &= Mx + r_1 \\equiv 0 \\pmod{p} \\\\
|k| &< \\sqrt{n}/M < p \\\\
\\text{Coppersmith} &\\implies p = Mk + r_1 \\qed
\\end{align*}

\\textbf{References:} Nemec et al., CCS 2017`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  const rocaPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n];
  let M = 1n;
  for (const p of rocaPrimes) { M *= p; }
  const kBits = 8;
  for (let attempt = 0; attempt < 5000; attempt++) {
    const i1 = BigInt(Math.floor(Math.random() * 10000));
    const i2 = BigInt(Math.floor(Math.random() * 10000));
    let r1 = modPow(65537n, i1, M);
    let r2 = modPow(65537n, i2, M);
    const kBytes = Math.ceil(kBits / 8);
    const bytes1 = new Uint8Array(kBytes);
    const bytes2 = new Uint8Array(kBytes);
    crypto.getRandomValues(bytes1);
    crypto.getRandomValues(bytes2);
    let k1 = 0n, k2 = 0n;
    for (let j = 0; j < kBytes; j++) {
      k1 = (k1 << 8n) | BigInt(bytes1[j]);
      k2 = (k2 << 8n) | BigInt(bytes2[j]);
    }
    k1 |= (1n << BigInt(kBits - 1)) | 1n;
    k2 |= (1n << BigInt(kBits - 1)) | 1n;
    if (k1 > k2) { [k1, k2] = [k2, k1]; [r1, r2] = [r2, r1]; }
    const p = k1 * M + r1;
    const q = k2 * M + r2;
    if (p > 1 && q > 1 && p !== q) {
      return { n: (p * q).toString() };
    }
  }
  const pair = generateKeyPair(256, 256);
  return { n: pair.n.toString() };
};
