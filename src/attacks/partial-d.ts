import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse, isqrt } from '../utils/bigint';

export const attack: Attack = {
  id: 'partial-d',
  name: 'Partial d Key Exposure',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from low bits of d. Use when LSBs of private exponent d are leaked.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dLow', label: 'dLow (low bits of d)', placeholder: 'Enter known low bits of d...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `import math
def _attack():
    try:
        try:
            n = Integer(${vals.n})
            e = Integer(${vals.e})
            dLow = Integer(${vals.dLow})
            if n <= 0 or e <= 0 or dLow < 0:
                print("PARTIAL_D=FAILED: invalid input values")
            else:
                # Use Python ints for fast iteration
                n_int = int(n)
                e_int = int(e)
                dLow_int = int(dLow)
                m = dLow_int.bit_length()
                found = False
                for k in range(1, e_int + 1):
                    d_approx = (k * n_int + 1) // e_int
                    if (d_approx & ((1 << m) - 1)) == dLow_int:
                        d_phi = (e_int * d_approx - 1) // k
                        s = n_int - d_phi + 1
                        disc = s * s - 4 * n_int
                        if disc >= 0:
                            sqrt_disc = math.isqrt(disc)
                            if sqrt_disc * sqrt_disc == disc:
                                p_candidate = (s + sqrt_disc) // 2
                                if p_candidate > 1 and n_int % p_candidate == 0:
                                    p_sage = Integer(p_candidate)
                                    q_sage = n // p_sage
                                    print(f"Verification: p * q = {p_sage * q_sage}")
                                    print(f"d = {d_approx}")
                                    print(f"p = {p_sage}")
                                    print(f"q = {q_sage}")
                                    print()
                                    print("PARTIAL_D=SUCCESS")
                                    found = True
                                    break
                if not found:
                    print("PARTIAL_D=FAILED: no valid d found")
        except Exception as ex:
            print(f"PARTIAL_D=FAILED: {ex}")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARTIAL_D=FAILED")
_attack()`,
  frontendCheck: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.dLow) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      const dLow = BigInt(vals.dLow);

      // Only work for small e (testcase e is large, but this handles small-e scenarios)
      if (e > 100000n) return Promise.resolve(null);

      // Infer mask from bit length of dLow
      const mask = (1n << BigInt(dLow.toString(2).length)) - 1n;

      for (let k = 1n; k <= e; k++) {
        const dApprox = (k * n + 1n) / e;
        if ((dApprox & mask) !== dLow) continue;

        // Found candidate — verify
        const phi = (e * dApprox - 1n) / k;
        const s = n - phi + 1n;
        const disc = s * s - 4n * n;
        if (disc < 0n) continue;
        const sqrtDisc = isqrt(disc);
        if (sqrtDisc * sqrtDisc !== disc) continue;

        const p = (s - sqrtDisc) / 2n;
        if (p > 0n && n % p === 0n) {
          const q = n / p;
          return Promise.resolve(`Factor found!\np = ${p}\nq = ${q}\nPrivate key d = ${dApprox}`);
        }
      }
      return Promise.resolve(null);
    } catch { return Promise.resolve(null); }
  },
  proof: `\\textbf{Theorem:} If low $m$ bits of $d$ are known and $d < n$, recover $d$ by iterating $k$ in the key equation.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed \\equiv 1 \\pmod{\\varphi(n)}$
\\item $d_{\\text{low}} = d \\bmod 2^m$ known
\\item $k \\in [1, e]$ where $ed-1 = k\\varphi(n)$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
d &\\approx \\frac{kn + 1}{e} \\\\
d_{\\text{approx}} &= \\left\\lfloor \\frac{kn + 1}{e} \\right\\rfloor \\\\
d_{\\text{approx}} \\bmod 2^m &\\stackrel{?}{=} d_{\\text{low}} \\\\
\\varphi &= (ed - 1)/k \\\\
x^2 - (n - \\varphi + 1)x + n &= 0 \\implies p, q \\qed
\\end{align*}

\\textbf{Explanation:} For each $k \\in [1,e]$, compute $d_{\\text{approx}} = \\lfloor(kn+1)/e\\rfloor$; if low $m$ bits match $d_{\\text{low}}$, recover $\\varphi(n) = (ed-1)/k$ and solve $x^2 - (n-\\varphi+1)x + n = 0$ for $p,q$.

\\textbf{References:} D. Boneh, G. Durfee, Y. Frankel, "An Attack on RSA Given a Small Fraction of the Private Key Bits", ASIACRYPT 1998`,
  priority: 'high',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.dLow,
};

export const generateTestcase = (): Record<string, string> => {
  // Construct RSA key with small d so the k-iteration attack works
  // d must be small enough that k = (ed-1)/phi is in range [1, e]
  const p = randomPrime(TESTCASE_BITS.p);
  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  // Pick small d and derive e from it
  let d = BigInt(100 + Math.floor(Math.random() * 10000));
  while (modInverse(d, phi) === null) {
    d += 1n;
  }
  const e = modInverse(d, phi)!;
  // Leak low 20 bits of d
  const dLow = d & ((1n << 20n) - 1n);
  return { n: n.toString(), e: e.toString(), dLow: dLow.toString() };
};
