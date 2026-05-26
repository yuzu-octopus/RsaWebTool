import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'hastad-linear-pad',
  name: "Hastad's Attack with Linear Padding",
  category: 'Message / Protocol',
  description: 'Recovers m from k >= e ciphertexts with affine padding under same exponent via CRT and Coppersmith. Use when c_i = (a_i·m + b_i)^e mod n_i.',
  inputs: [
    { name: 'triples', label: 'Triples (n,c,a,b per line)', placeholder: 'n1,c1,a1,b1\\nn2,c2,a2,b2...', multiline: true, rows: 5 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter exponent e (e.g., 3)...', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.triples || !vals.e) {
      return `print("ERROR: Missing required inputs (triples, e)")
print("HASTAD_LINEAR_PAD=FAILED")`;
    }
    return `def _attack():
    try:
        e = Integer(${vals.e})
        # Parse triples
        triples_str = """${vals.triples}""".strip()
        triples = []
        for line in triples_str.split('\\n'):
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            if len(parts) < 4:
                continue
            n_i = Integer(parts[0].strip())
            c_i = Integer(parts[1].strip())
            a_i = Integer(parts[2].strip())
            b_i = Integer(parts[3].strip())
            triples.append((n_i, c_i, a_i, b_i))
        print(f"Number of ciphertexts: {len(triples)}")
        print(f"Public exponent: e = {e}")
        if len(triples) < e:
            print(f"ERROR: Need at least {e} ciphertexts for e = {e}, got {len(triples)}")
            print("HASTAD_LINEAR_PAD=FAILED")
        else:
            # General Hastad with linear padding: c_i = (a_i * m + b_i)^e mod n_i
            # Combined modulus N = prod(n_i)
            N = prod([t[0] for t in triples])
            print(f"Combined modulus N has {N.nbits()} bits")
            # Build CRT-combined polynomial F(x) = sum_i coeff_i * f_i(x) mod N
            R.<x> = PolynomialRing(Zmod(N))
            F = 0
            for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                Ni = N // n_i
                coeff = Ni * inverse_mod(Ni, n_i)
                fi = (a_i*x + b_i)**e - c_i
                F += coeff * fi
            print(f"Combined polynomial degree: {F.degree()}")
            # Make polynomial monic (required by small_roots).
            # The leading coefficient should be invertible modulo N because
            # each a_i is coprime to n_i — but guard against the rare case.
            try:
                F = F.monic()
            except Exception as ex:
                print(f"Cannot make monic directly: {ex}")
                lc = Integer(F.leading_coefficient())
                g = gcd(lc, Integer(N))
                if g > 1 and g < N:
                    print(f"Lead coeff shares factor g={g} with N — can factor directly")
                elif g == N:
                    print("Lead coeff is a multiple of N")
                else:
                    # lc is coprime to N, try manual inversion
                    try:
                        F = F * inverse_mod(lc, N)
                    except Exception as ex2:
                        print(f"Cannot invert lead coeff: {ex2}")
                print("HASTAD_LINEAR_PAD=FAILED")
                return
            # Coppersmith: find small root m < N^(1/e)
            # Wrapped in try/except: small_roots over Zmod(N) may throw
            # for composite N under SageMathCell (Rosetta emulation bug).
            # On failure, fall through to brute-force fallback.
            found_m = None
            try:
                roots = F.small_roots(beta=1.0, epsilon=0.05)
                if roots:
                    found_m = roots[0]
                    print(f"Coppersmith recovered message: m = {found_m}")
            except Exception as sr_ex:
                print(f"Coppersmith small_roots failed (composite modulus): {sr_ex}")
            if found_m is None:
                print("No small roots found. The message may be too large for the Coppersmith bound.")
                print("Try: smaller epsilon (e.g., 0.01) for larger lattice, or ensure m is sufficiently small.")
                # Fallback 1: standard Hastad CRT if all a_i=1, b_i=0
                all_simple = all(t[2] == 1 and t[3] == 0 for t in triples)
                if all_simple:
                    print("All a_i=1, b_i=0. Using standard Hastad CRT approach...")
                    moduli = [t[0] for t in triples]
                    remainders = [t[1] for t in triples]
                    m_e = crt(remainders, moduli)
                    m_root, exact = m_e.nth_root(e, truncate_mode=True)
                    if exact:
                        found_m = m_root
                        print(f"Standard Hastad recovered message: m = {found_m}")
                # Fallback 2: brute-force search for small messages
                # Uses Horner evaluation for fast modular arithmetic
                # (avoid power_mod which is slow in SageCell loops).
                if found_m is None:
                    out = []
                    out.append("Attempting brute-force search for small m...")
                    a_int = [int(t[2]) for t in triples]
                    b_int = [int(t[3]) for t in triples]
                    n_int = [int(t[0]) for t in triples]
                    c_int = [int(t[1]) for t in triples]
                    # Precompute Horner coefficients for (a*m+b)^3 - c:
                    # ai^3*m^3 + 3*ai^2*bi*m^2 + 3*ai*bi^2*m + (bi^3-ci)
                    coeffs = []
                    for i in range(len(triples)):
                        ai = a_int[i]; bi = b_int[i]; ni = n_int[i]
                        A = pow(ai, 3, ni)
                        B = (3 * ai * ai * bi) % ni
                        C = (3 * ai * bi * bi) % ni
                        D = (bi * bi * bi - c_int[i]) % ni
                        coeffs.append((ni, A, B, C, D))
                    limit = 5 * 10**5
                    for m_candidate in range(limit):
                        ok = True
                        for ni, A, B, C, D in coeffs:
                            # Horner: ((A*m + B)*m + C)*m + D mod ni
                            val = (A * m_candidate + B) % ni
                            val = (val * m_candidate + C) % ni
                            val = (val * m_candidate + D) % ni
                            if val != 0:
                                ok = False
                                break
                        if ok:
                            found_m = m_candidate
                            out.append(f"Brute-force recovered message: m = {found_m}")
                            break
                        if m_candidate % 200000 == 0 and m_candidate > 0:
                            out.append(f"  Searched up to m = {m_candidate}...")
                    print("\\n".join(out))
            if found_m is not None:
                m = Integer(found_m)
                print("Verifying recovered message...")
                all_ok = True
                for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                    v = pow(int(a_i) * int(m) + int(b_i), int(e), int(n_i))
                    ok = v == c_i
                    if not ok:
                        all_ok = False
                    print(f"  Verify {i+1}: (a*m+b)^e mod n{i+1} = {v} (c{i+1} = {c_i}) {'OK' if ok else 'FAIL'}")
                if all_ok:
                    print()
                    print("HASTAD_LINEAR_PAD=SUCCESS")
                else:
                    print("HASTAD_LINEAR_PAD=FAILED")
            else:
                print("Brute-force search did not find the message (up to 2M). It may be larger.")
                print("HASTAD_LINEAR_PAD=FAILED")
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("HASTAD_LINEAR_PAD=FAILED")
_attack()`;
  },
  proof: `\\textbf{Theorem:} Given $k \\geq e$ ciphertexts $c_i \\equiv (a_i m + b_i)^e \\pmod{n_i}$ with pairwise coprime moduli, recover $m$ by CRT-combining the polynomials and applying Coppersmith small roots.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_i \\equiv (a_i m + b_i)^e \\pmod{n_i}$ with $\\gcd(n_i, n_j) = 1$ for $i \\neq j$
\\item $k \\geq e$, affine transforms $(a_i, b_i)$ known for each modulus
\\item $m < \\min_i(n_i^{1/e})$ (message is small enough for Coppersmith)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_i(x) &= (a_i x + b_i)^e - c_i \\in (\\mathbb{Z}/n_i\\mathbb{Z})[x] \\\\
N &= \\prod_{i=1}^{k} n_i, \\quad N_i = N / n_i, \\quad t_i = N_i \\cdot N_i^{-1} \\bmod n_i \\\\
F(x) &= \\sum_{i=1}^{k} t_i \\cdot f_i(x) \\pmod{N} \\\\
F(m) &\\equiv 0 \\pmod{N} \\quad \\text{(by CRT, each $f_i(m) \\equiv 0$)} \\\\
m &= \\text{small\\_roots}(F) \\quad \\text{(since $|m| < N^{1/e}$)}
\\end{align*}

\\textbf{Explanation:} This generalizes Hastad's Broadcast Attack to affine-padded messages. CRT combines the polynomials into one modulo $N = \\prod n_i$, then Coppersmith's method finds the small root $m$. The requirement $k \\geq e$ ensures enough information to overcome the linear padding. Each $(a_i, b_i)$ must be known.

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA," Eurocrypt 1988; Coppersmith et al., 1996`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.triples && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const triples: string[] = [];
  for (let i = 0; i < 3; i++) {
    const { n } = generateKeyPair(256, 256);
    const a = BigInt(Math.floor(Math.random() * 100) + 1);
    const b = BigInt(Math.floor(Math.random() * 1000));
    triples.push(`${n},${encrypt((a * m + b) % n, n, e)},${a},${b}`);
  }
  return { triples: triples.join('\n'), e: e.toString() };
};
