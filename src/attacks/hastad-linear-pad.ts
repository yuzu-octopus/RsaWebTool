import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'hastad-linear-pad',
  name: "Hastad's Attack with Linear Padding",
  category: 'Message / Protocol',
  description: 'Recovers m from linearly padded encryptions. Use when c_i = (a_i·m + b_i)^e mod n_i.',
  inputs: [
    { name: 'triples', label: 'Triples (n,c,a,b per line)', placeholder: 'n1,c1,a1,b1\\nn2,c2,a2,b2...', multiline: true, rows: 5 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter exponent e (e.g., 3)...', multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.triples || !vals.e) {
      return `print("ERROR: Missing required inputs (triples, e)")
print("HASTAD_LINEAR_PAD=FAILED")`;
    }
    return `try:
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
        # General Hastad with linear padding:
        # c_i = (a_i * m + b_i)^e mod n_i
        #
        # Strategy: For each i, we have (a_i * m + b_i)^e = c_i mod n_i
        # Use CRT to combine, then solve for m

        # Step 1: Compute combined modulus N = prod(n_i)
        N = prod([t[0] for t in triples])
        print(f"Combined modulus N has {N.nbits()} bits")

        # Step 2: For each triple, define polynomial f_i(x) = (a_i*x + b_i)^e - c_i mod n_i
        # We want x = m such that f_i(m) = 0 mod n_i for all i

        # Step 3: Use CRT to combine the polynomial system
        # Build polynomial over Zmod(N): F(x) such that F(x) = 0 mod n_i for all i
        # This is done by: F(x) = sum_i [ CRT_coeff_i * f_i(x) ] mod N
        # where CRT_coeff_i = (N/n_i) * inverse(N/n_i, n_i)

        R.<x> = PolynomialRing(Zmod(N))

        # Build the combined polynomial
        F = 0
        for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
            # CRT coefficient for this modulus
            Ni = N // n_i
            coeff = Ni * inverse_mod(Ni, n_i)
            # f_i(x) = (a_i*x + b_i)^e - c_i
            fi = (a_i*x + b_i)**e - c_i
            F += coeff * fi

        F = F % N
        print(f"Combined polynomial degree: {F.degree()}")

        # Step 4: Find small roots of F(x) = 0 mod N
        # m is small compared to N (since N = prod(n_i) and m < min(n_i))
        bound = ZZ(min(t[0] for t in triples))
        print(f"Small root bound: {bound}")

        roots = F.small_roots(X=bound, beta=1.0, epsilon=0.05)
        if roots:
            m = roots[0]
            print(f"Recovered message: m = {m}")

            # Verify against all triples
            all_ok = True
            for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                v = power_mod(a_i * Integer(m) + b_i, e, n_i)
                ok = v == c_i
                if not ok:
                    all_ok = False
                print(f"  Verify {i+1}: (a*m+b)^e mod n{i+1} = {v} (c{i+1} = {c_i}) {'OK' if ok else 'FAIL'}")
            if all_ok:
                print("HASTAD_LINEAR_PAD=SUCCESS")
            else:
                print("HASTAD_LINEAR_PAD=FAILED")
        else:
            print("No small roots found. Try increasing epsilon or check inputs.")
            print("Fallback: try standard Hastad if all a_i=1, b_i=0.")

            # Fallback for standard case
            all_simple = all(t[2] == 1 and t[3] == 0 for t in triples)
            if all_simple:
                print("All a_i=1, b_i=0. Using standard Hastad CRT approach...")
                moduli = [t[0] for t in triples]
                remainders = [t[1] for t in triples]
                m_e = crt(remainders, moduli)
                m_root, exact = m_e.nth_root(e, truncate_mode=True)
                if exact:
                    print(f"Recovered message: m = {m_root}")
                    all_ok = True
                    for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                        v = power_mod(m_root, e, n_i)
                        if v != c_i:
                            all_ok = False
                    if all_ok:
                        print("HASTAD_LINEAR_PAD=SUCCESS")
                    else:
                        print("HASTAD_LINEAR_PAD=FAILED")
                else:
                    print(f"Approximate root: m = {m_root}")
                    print("HASTAD_LINEAR_PAD=FAILED")
            else:
                print("HASTAD_LINEAR_PAD=FAILED")
except Exception as e:
    print(f"ERROR: {e}")
    print("HASTAD_LINEAR_PAD=FAILED")
`;
  },
  proof: `\\textbf{Theorem:} Given c_i \\equiv (a_i m + b_i)^e \\pmod{n_i} for i = 1, \\ldots, k with known a_i, b_i and k \\geq e, recover m via CRT + Coppersmith.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item k triples (n_i, c_i, a_i, b_i) with pairwise coprime moduli
\\item k \\geq e, known affine transforms
\\item m < \\min(n_i)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_i(x) &= (a_i x + b_i)^e - c_i \\in (\\mathbb{Z}/n_i\\mathbb{Z})[x] \\\\
N &= \\prod_{i=1}^{k} n_i \\\\
N_i &= N / n_i, \\quad t_i = N_i \\cdot N_i^{-1} \\bmod n_i \\\\
F(x) &= \\sum_{i=1}^{k} t_i \\cdot f_i(x) \\pmod{N} \\\\
F(m) &\\equiv 0 \\pmod{N} \\\\
m &= small\\_roots(F, X = \\min(n_i)) \\qed
\\end{align*}

\\textbf{Explanation:} Build a polynomial per ciphertext, combine via CRT coefficients into F(x) over Zmod(N). The message m is a small root of F. Use Coppersmith's small_roots to extract it.

\\textbf{References:} J. Hastad, "Solving Linear Equations Modulo Divisors", Eurocrypt 1988; Coppersmith et al., "Cryptanalysis of RSA with Related Messages", 1996`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.triples && !!p.e,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const triples: string[] = [];
  for (let i = 0; i < 3; i++) {
    const { n } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
    const a = BigInt(Math.floor(Math.random() * 100) + 1);
    const b = BigInt(Math.floor(Math.random() * 1000));
    triples.push(`${n},${encrypt((a * m + b) % n, n, e)},${a},${b}`);
  }
  return { triples: triples.join('\n'), e: e.toString() };
};
