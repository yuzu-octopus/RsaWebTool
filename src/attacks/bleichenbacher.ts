import type { Attack } from '../types';
import { generateKeyPair, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'bleichenbacher',
  name: "Bleichenbacher PKCS#1 v1.5",
  category: 'Oracle',
  description: 'Decrypts via PKCS#1 v1.5 padding oracle. Use when server reveals padding validity.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated 0/1)', placeholder: '1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        # Bleichenbacher PKCS#1 v1.5 padding oracle attack
        if not "${vals.n}".strip():
            print("ERROR: n is required")
            print("BLEICHENBACHER=FAILED")
            return
        if not "${vals.e}".strip():
            print("ERROR: e is required")
            print("BLEICHENBACHER=FAILED")
            return
        if not "${vals.c}".strip():
            print("ERROR: c is required")
            print("BLEICHENBACHER=FAILED")
            return
        responses_raw = """${vals.oracle_responses || ''}""".strip()
        if not responses_raw:
            print("ERROR: oracle_responses is required")
            print("BLEICHENBACHER=FAILED")
            return
        try:
            n = Integer(${vals.n})
            e = Integer(${vals.e})
            c = Integer(${vals.c})
            orig_c = Integer(${vals.c})
            oracle_bits = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            print(f"Bleichenbacher PKCS#1 v1.5 Attack")
            print(f"n = {n} ({n.nbits()} bits)")
            print(f"e = {e}")
            print(f"c = {c}")
            print(f"Oracle responses: {len(oracle_bits)}")
            print()
            # PKCS#1 v1.5: EM = 0x00 || 0x02 || PS || 0x00 || M
            # Valid padding: 2B <= m < 3B where B = 2^(8*(k-2)), k = byte length
            k = (n.nbits() + 7) // 8
            B = Integer(2)**(8 * (k - 2))
            print(f"Block size: {k} bytes, B = 2^(8*{k-2})")
            print(f"Valid padding range: [2B, 3B) = [{2*B}, {3*B})")
            print()
            # Collect valid s values from oracle responses
            valid_s = [Integer(i + 1) for i, r in enumerate(oracle_bits) if r == 1]
            print(f"Valid padding responses: {len(valid_s)}")
            if len(valid_s) < 2:
                print("Need at least 2 valid responses for interval narrowing")
                print("BLEICHENBACHER=FAILED")
                return
            s1 = valid_s[0]
            print(f"s1 = {s1}")
            # Initial interval from s1
            if s1 == 1:
                a = 2 * B
                b = 3 * B - 1
            else:
                # Find r such that interval overlaps with [2B, 3B)
                for r in range(0, int(s1) + 1):
                    r_int = Integer(r)
                    ca = ceil((2 * B + r_int * n) / s1)
                    cb = floor((3 * B - 1 + r_int * n) / s1)
                    inter_a = max(2 * B, ca)
                    inter_b = min(3 * B - 1, cb)
                    if inter_a <= inter_b:
                        a = inter_a
                        b = inter_b
                        break
            print(f"Initial interval: [{a}, {b}], size={(b-a+1).nbits()} bits")
            print()
            # Narrow using remaining valid s values
            for idx in range(1, min(len(valid_s), 50)):
                s = valid_s[idx]
                # Find r range
                r_min = ceil((a * s - 3 * B + 1) / n)
                r_max = floor((b * s - 2 * B) / n)
                new_a = None
                new_b = None
                for r in range(int(r_min), int(r_max) + 1):
                    r_int = Integer(r)
                    ca = ceil((2 * B + r_int * n) / s)
                    cb = floor((3 * B - 1 + r_int * n) / s)
                    inter_a = max(a, ca)
                    inter_b = min(b, cb)
                    if inter_a <= inter_b:
                        if new_a is None or inter_a > new_a:
                            new_a = inter_a
                        if new_b is None or inter_b < new_b:
                            new_b = inter_b
                if new_a is not None and new_b is not None:
                    a = new_a
                    b = new_b
                    if idx < 5 or b - a < (B) // 10:
                        print(f"Step {idx}: s={s}, interval=[{a}, {b}], size={(b-a+1).nbits()} bits")
                else:
                    print(f"Step {idx}: s={s}, no valid interval intersection")
            print()
            if a == b:
                m = a
                print(f"Exact message recovered: m = {m}")
            else:
                m = (a + b) // 2
                print(f"Estimated message: m = {m}")
                print(f"Final interval: [{a}, {b}]")
                print(f"Uncertainty: {(b-a+1).nbits()} bits")
            # Verify
            v = power_mod(m, e, n)
            print(f"Verification: m^e mod n = {v}")
            print(f"Original c = {orig_c}")
            if v == orig_c:
                print("VERIFICATION PASSED!")
                print("BLEICHENBACHER=SUCCESS")
            else:
                print("Verification failed - may need more oracle responses")
                print("BLEICHENBACHER=FAILED")
        except Exception as ex:
            print(f"ERROR: {ex}")
            print("BLEICHENBACHER=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BLEICHENBACHER=FAILED")
_attack()`,
  proof: `\\textbf{Theorem:} A PKCS#1 v1.5 padding oracle decrypts any ciphertext in \\(\\approx 2^{17}\\) queries.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle O(c) = 1 iff valid PKCS#1 v1.5 padding
\\item $B = 2^{8(k-2)}$, $k = \\lceil \\log_{256} n \\rceil$
\\item $(c \\cdot s^e)^d \\equiv m \\cdot s \\pmod{n}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c &= m^e \\bmod n, \\quad 2B \\leq m < 3B \\\\
\\mathcal{O}(c \\cdot s^e) = 1 &\\implies 2B \\leq m \\cdot s - rn < 3B \\\\
\\frac{2B + rn}{s} &\\leq m < \\frac{3B + rn}{s} \\\\
M_i &= \\bigcup_r \\left[\\left\\lceil \\frac{2B+rn}{s_i}\\right\\rceil, \\left\\lfloor \\frac{3B-1+rn}{s_i}\\right\\rfloor\\right] \\\\
[a_{i+1}, b_{i+1}] &= [a_i, b_i] \\cap M_i \\\\
b - a = 0 &\\implies m = a \\qed
\\end{align*}

\\textbf{Explanation:} Each valid response constrains m to intervals. Intersecting across s values shrinks until m is isolated.

\\textbf{References:} D. Bleichenbacher, CRYPTO 1998`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
};

export const generateTestcase = (): Record<string, string> => {
  // Use small primes (10-bit → n ≈ 20 bits) so the oracle response array stays small
  // and the template converges within SageMathCell's 120s timeout.
  // B = 2^(8*(k-2)) where k = ceil(nbits/8). For n≈20 bits: k=3, B=256.
  const { n, e } = generateKeyPair(10, 10);
  const k = Math.ceil(n.toString(2).length / 8);
  const B = 256n ** BigInt(k - 2);
  const lower = 2n * B;
  const upper = 3n * B;
  const range = upper - lower;
  const m = lower + BigInt(Math.floor(Math.random() * Number(range)));
  const c = encrypt(m, n, e);

  // Compute valid s positions: m*s mod n ∈ [2B, 3B)
  // For wrapping round r: s ∈ [ceil((r·n+2B)/m), floor((r·n+3B-1)/m)]
  // maxS=8192 gives ~16KB response string, enough for 5-10 valid s values
  const maxS = 8192;
  const validPositions = new Set<number>();
  validPositions.add(1); // s=1 always valid

  const sStep = Number(n / m) || 256;
  const maxR = Math.min(maxS, Math.floor(maxS / Math.max(1, sStep)) + 10);

  for (let r = 1; r <= maxR; r++) {
    const rBig = BigInt(r);
    const sMin = Number((rBig * n + lower + m - 1n) / m);
    const sMax = Number((rBig * n + upper - 1n) / m);
    const lo = Math.max(2, sMin);
    const hi = Math.min(maxS, sMax);
    for (let s = lo; s <= hi; s++) {
      validPositions.add(s);
    }
  }

  // Build response string: "1,0,0,1,0,..."
  const parts: string[] = [];
  for (let s = 1; s <= maxS; s++) {
    parts.push(validPositions.has(s) ? '1' : '0');
  }

  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: parts.join(',') };
};
