import type { Attack } from '../types';
import { randomPrime } from '../utils/testcases/core';
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
            try:
                return a.monic()
            except Exception:
                # Lead coeff not invertible mod composite n; return as-is
                return a
        print("Coppersmith Short Pad Attack")
        print("n =", n, "e =", e)
        # Step 1: Compute resultant to find delta = m2 - m1
        # Compute resultant over ZZ first, then reduce mod n
        # (Zmod(n) for composite n does not support resultant)
        print("Computing resultant...")
        ZZxy.<x, y> = PolynomialRing(ZZ)
        g1_zz = x**Integer(e) - Integer(c1)
        g2_zz = (x + y)**Integer(e) - Integer(c2)
        h_zz = g1_zz.resultant(g2_zz, variable=x)
        print("Resultant degree (in y):", h_zz.degree(y))
        # h_zz is multivariate (ZZ[x,y]) but only has y terms after resultant
        # Convert to univariate polynomial in y over ZZ
        ZZ_y = ZZ['y']
        yv = ZZ_y.gen()
        h_y = ZZ_y(0)
        for (exp_x, exp_y), coeff_val in h_zz.dict().items():
            h_y += ZZ(coeff_val) * yv**int(exp_y)
        # For e=3, h(y) has only y^0, y^3, y^6, y^9 terms
        # Reduce mod n and substitute z = y^e to get H(z) of degree e
        Zn = Zmod(n)
        PRz.<z> = PolynomialRing(Zn)
        H = PRz(0)
        coeffs_list = h_y.list()
        for i in range(int(e) + 1):
            deg = i * int(e)
            if deg < len(coeffs_list):
                H += Zn(coeffs_list[deg]) * z**i
        print("Looking for small root of degree-", H.degree(), "polynomial in z = y^e")
        # Howgrave-Graham bound for z = delta^e with beta=1.0, epsilon=0.05:
        # |z| < n^(1/e - 0.05)
        kbits = max(int(n.nbits() * (1/int(e) - 0.06)), 8)
        X_z = 2**kbits
        print("Small root bound for z (bits):", kbits)
        roots_z = H.small_roots(X=X_z, epsilon=0.05)
        if roots_z:
            z0 = Integer(roots_z[0])
            # Recover delta from z0 = delta^e
            # nth_root may not be exact if z0 is delta^e + k*n (small_roots over Zmod(n))
            # Try integer e-th root and nearby values
            try:
                delta, exact = z0.nth_root(int(e), truncate_mode=True)
            except Exception:
                delta = Integer(z0.nth_root(int(e)))
                exact = False
            if not exact:
                print(f"z0={z0} is not a perfect {e}th power; trying nearby values...")
                # Try delta-10..delta+10 to handle the composite-modulus offset
                for delta_try in range(max(0, delta - 10), delta + 11):
                    if delta_try == 0:
                        continue
                    # Test with Franklin-Reiter GCD
                    PRx.<xn> = PolynomialRing(Zmod(n))
                    g1_fr = xn**e - c1
                    g2_fr = (xn + Integer(delta_try))**e - c2
                    g = composite_gcd(g1_fr, g2_fr)
                    if g.degree() == 1:
                        m = -g[0] / g[1]
                        v1 = power_mod(Integer(m), e, n)
                        v2 = power_mod(Integer(m) + Integer(delta_try), e, n)
                        if v1 == c1 and v2 == c2:
                            print("Found padding difference: delta =", delta_try)
                            print("Recovered message: m =", m)
                            print("COPPERSMITH_SHORT_PAD=SUCCESS")
                            return
                print("Could not recover delta from nearby values.")
                print("COPPERSMITH_SHORT_PAD=FAILED")
            else:
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
            print("No small roots found. Padding may be too large for exponent e =", e)
            print("COPPERSMITH_SHORT_PAD=FAILED")
    except Exception as e:
        print("ERROR:", e)
        print("COPPERSMITH_SHORT_PAD=FAILED")
        #
    except BaseException as e:
        print("ERROR:", e)
        print("COPPERSMITH_SHORT_PAD=FAILED")
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
  const p = randomPrime(64);
  const q = randomPrime(64);
  const n = p * q;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const maxPad = 2 ** 10;
  const r1 = BigInt(Math.floor(Math.random() * maxPad));
  const r2 = BigInt(Math.floor(Math.random() * maxPad));
  const m1 = (m << 20n) | r1;
  const m2 = (m << 20n) | r2;
  const c1 = modPow(m1, e, n);
  const c2 = modPow(m2, e, n);
  return { n: n.toString(), e: e.toString(), c1: c1.toString(), c2: c2.toString() };
};
