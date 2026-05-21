import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'coppersmith-short-pad',
  name: 'Coppersmith Short Pad Attack',
  category: 'Message / Protocol',
  description: 'Recovers m from short random pads. Use when same message padded with short random values.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c1', label: 'c1 (first ciphertext)', placeholder: 'Enter ciphertext c1...', multiline: true, rows: 3 },
    { name: 'c2', label: 'c2 (second ciphertext)', placeholder: 'Enter ciphertext c2...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c1 || !vals.c2) {
      return 'print("ERROR: Missing required inputs (n, e, c1, c2)")\nprint("COPPERSMITH_SHORT_PAD=FAILED")';
    }
    return `def _attack():
    try:
        n = Integer(${vals.n})
        e = Integer(${vals.e})
        c1 = Integer(${vals.c1})
        c2 = Integer(${vals.c2})
        # Custom GCD for polynomials over Zmod(n) with composite n
        def composite_gcd(a, b):
            while b:
                a, b = b, a % b
            return a.monic()
        print("Coppersmith Short Pad Attack")
        print("n =", n, "e =", e)
        # Step 1: Compute resultant to find delta = m2 - m1
        # For e=3, the resultant h(y) has only y^0, y^3, y^6, y^9 terms
        # Substitute z = y^3 to get a cubic, then apply Coppersmith to find z
        P.<x, y> = PolynomialRing(Zmod(n))
        P2.<y_s> = PolynomialRing(Zmod(n))
        g1 = x**e - c1
        g2 = (x + y)**e - c2
        g1_p2 = g1.change_ring(P2)
        g2_p2 = g2.change_ring(P2)
        print("Computing resultant...")
        h = g1_p2.resultant(g2_p2, variable=x)
        h = h.univariate_polynomial().change_ring(Zmod(n))
        h = h.monic()
        print("Resultant degree:", h.degree())
        # Extract coefficients of h(y) = y^(e^2) + ... + C (only y^(i*e) terms)
        # For e=3: h(y) = y^9 + A*y^6 + B*y^3 + C
        # Substitute z = y^3 to get cubic H(z) = z^e + ... + C
        coeffs = [h[i] for i in range(h.degree() + 1)]
        PRz.<z> = PolynomialRing(Zmod(n))
        H = PRz(0)
        for i in range(int(e) + 1):
            deg = i * int(e)
            if deg <= h.degree():
                H += coeffs[deg] * z**i
        print("Looking for small root of degree-", H.degree(), "polynomial in z = y^e")
        # Bound for z = delta^e: |delta| < n^(beta/e^2) => |z| < n^(beta/e)
        # With beta=1.0: |z| < n^(1/e)
        kbits = n.nbits() // int(e)
        X_z = 2**kbits
        print("Small root bound for z (bits):", kbits)
        roots_z = H.small_roots(X=X_z)
        if roots_z:
            z0 = Integer(roots_z[0])
            # Take integer e-th root to recover delta = z0^(1/e)
            delta, exact = z0.nth_root(int(e), truncate_mode=True)
            if exact:
                print("Found padding difference: delta =", delta)
                # Step 2: Franklin-Reiter related message attack
                PRx.<xn> = PolynomialRing(Zmod(n))
                g1_fr = xn**e - c1
                g2_fr = (xn + delta)**e - c2
                g = composite_gcd(g1_fr, g2_fr)
                if g.degree() == 1:
                    m = -g[0] / g[1]
                    print("Recovered message: m =", m)
                    v1 = power_mod(Integer(m), e, n)
                    v2 = power_mod(Integer(m) + delta, e, n)
                    print("Verification: m^e mod n =", v1, "(c1 =", c1, ")")
                    print("Verification: (m+delta)^e mod n =", v2, "(c2 =", c2, ")")
                    if v1 == c1 and v2 == c2:
                        print("COPPERSMITH_SHORT_PAD=SUCCESS")
                    else:
                        print("COPPERSMITH_SHORT_PAD=FAILED")
                else:
                    print("GCD has degree", g.degree(), "- cannot extract unique solution.")
                    print("COPPERSMITH_SHORT_PAD=FAILED")
            else:
                print("Cube root was not exact. z0 =", z0, "may not be delta^e.")
                print("COPPERSMITH_SHORT_PAD=FAILED")
        else:
            print("No small roots found. Padding may be too large for exponent e =", e)
            print("COPPERSMITH_SHORT_PAD=FAILED")
    except Exception as e:
        print("ERROR:", e)
        print("COPPERSMITH_SHORT_PAD=FAILED")
    #
_attack()`;
  },
  proof: `\\textbf{Theorem:} Given $c_1 \\equiv (m + \\delta_1)^e \\pmod{n}$ and $c_2 \\equiv (m + \\delta_2)^e \\pmod{n}$ with $|\\delta_1 - \\delta_2| < n^{1/e^2}$, recover $m$ via resultant $+$ Coppersmith.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $n, e, c_1, c_2$ (modulus, exponent, two ciphertexts)
\\item $|\\delta_2 - \\delta_1| < n^{1/e^2}$ (short padding)
\\item Same base message $m$ under both encryptions
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(x) &= x^e - c_1 \\\\
f_2(x) &= (x + \\Delta)^e - c_2, \\quad \\Delta = \\delta_2 - \\delta_1 \\\\
r(\\Delta) &= \\text{Res}_x(f_1, f_2) \\equiv 0 \\pmod{n} \\\\
|\\Delta| < n^{1/e^2} &\\implies \\Delta \\text{ found via } small\\_roots \\\\
\\gcd(x^e - c_1, (x + \\Delta)^e - c_2) &= x - (m + \\delta_1) \\\\
m &= \\text{root} - \\delta_1 \\qed
\\end{align*}

\\textbf{Explanation:} Compute the resultant of two polynomials to eliminate $x$, yielding a polynomial in $\\Delta$. Use Coppersmith's $small\\_roots$ to find the small padding difference. Apply Franklin-Reiter with known $\\Delta$ to recover $m$.

\\textbf{References:} D. Coppersmith, "Small Solutions to Polynomial Equations and Low Exponent RSA Vulnerabilities", J. Cryptology, 1997; Boneh, "Twenty Years of Attacks on RSA", 1999`,

  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c1 && !!p.c2,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const maxPad = 2 ** 20;
  const r1 = BigInt(Math.floor(Math.random() * maxPad));
  const r2 = BigInt(Math.floor(Math.random() * maxPad));
  const m1 = (m << 20n) | r1;
  const m2 = (m << 20n) | r2;
  const c1 = modPow(m1, e, n);
  const c2 = modPow(m2, e, n);
  return { n: n.toString(), e: e.toString(), c1: c1.toString(), c2: c2.toString() };
};
