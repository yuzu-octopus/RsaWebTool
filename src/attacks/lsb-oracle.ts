import type { Attack } from '../types';
import { generateKeyPair, TESTCASE_BITS, encrypt } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'lsb-oracle',
  name: 'LSB Oracle Attack',
  category: 'Message / Protocol',
  description: 'Recovers m via LSB oracle. Use when an oracle reveals LSB(decrypt(c·s^e mod n)).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'oracle_responses', label: 'Oracle responses (comma-separated bits)', placeholder: '0,1,0,1,1,0,...', multiline: true, rows: 3 },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.e || !vals.c || !vals.oracle_responses) {
      return `print("ERROR: Missing required inputs (n, e, c, oracle_responses)")
print("LSB_ORACLE=FAILED")`;
    }
    return `try:
    n = Integer(${vals.n})
    e = Integer(${vals.e})
    c = Integer(${vals.c})

    # Parse oracle responses
    responses_str = """${vals.oracle_responses}""".strip()
    oracle_bits = [int(x.strip()) for x in responses_str.split(',') if x.strip()]

    print(f"Number of oracle responses: {len(oracle_bits)}")
    print(f"Target ciphertext: c = {c}")
    print()

    # Binary search on the message space
    # Each oracle response tells us whether m is in the upper or lower half
    # of the current interval [lower, upper)
    lower = 0
    upper = n

    for i, bit in enumerate(oracle_bits):
        mid = (lower + upper) // 2
        if bit == 0:
            # m is in lower half
            upper = mid
        else:
            # m is in upper half
            lower = mid

        if i < 5 or i >= len(oracle_bits) - 3:
            print(f"Step {i+1}: bit={bit}, lower={lower}, upper={upper}")

    m = (lower + upper) // 2
    print(f"\\nRecovered message: m = {m}")

    # Verify against original ciphertext
    v = power_mod(m, e, n)
    print(f"Verification: m^e mod n = {v}")
    print(f"Original c = {c}")

    if v == c:
        print("LSB_ORACLE=SUCCESS")
    else:
        print("LSB_ORACLE=FAILED")
except Exception as e:
    print(f"ERROR: {e}")
    print("LSB_ORACLE=FAILED")
`;
  },
  proof: `\\textbf{Theorem:} An oracle \\mathcal{O}(c) = \\text{LSB}(c^d \\bmod n) recovers m in O(\\log n) queries via binary search.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item n, e, c (modulus, exponent, ciphertext)
\\item Oracle returning LSB(c^d mod n) per query
\\item c_i = c \\cdot (2^i)^e \\bmod n for iteration i
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= c^d \\bmod n \\\\
\\mathcal{O}(c \\cdot 2^e \\bmod n) &= \\text{LSB}((2m) \\bmod n) \\\\
2m < n &\\implies \\text{LSB} = 0 \\implies m \\in [0, n/2) \\\\
2m \\geq n &\\implies \\text{LSB} = 1 \\implies m \\in [n/2, n) \\\\
[\\ell_0, u_0) &= [0, n) \\\\
[\\ell_{i+1}, u_{i+1}) &= \\begin{cases}
[\\ell_i, \\tfrac{\\ell_i + u_i}{2}) & \\text{if bit}_i = 0 \\\\
[\\tfrac{\\ell_i + u_i}{2}, u_i) & \\text{if bit}_i = 1
\\end{cases} \\\\
u_k - \\ell_k &= n / 2^k \\xrightarrow{k = \\lceil \\log_2 n \\rceil} 1 \\\\
m &= \\ell_k \\qed
\\end{align*}

\\textbf{Explanation:} Each oracle query on c·(2ⁱ)ᵉ reveals whether 2ⁱ·m mod n is even or odd, halving the interval containing m. After log₂(n) queries the interval shrinks to a single value.

\\textbf{References:} Goldwasser, Micali, "Probabilistic Encryption", 1982; Boneh, "Twenty Years of Attacks on RSA", 1999`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
};

export const generateTestcase = (): Record<string, string> => {
  const { n, e } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const m = BigInt(Math.floor(Math.random() * 1000000) + 42);
  const c = encrypt(m, n, e);
  // Oracle responses: binary search bits (is m in upper half of current interval?)
  const responses: string[] = [];
  let lower = 0n, upper = n;
  const nBits = n.toString(2).length;
  for (let i = 0; i < nBits; i++) {
    const mid = (lower + upper) / 2n;
    if (m >= mid) {
      responses.push('1');
      lower = mid;
    } else {
      responses.push('0');
      upper = mid;
    }
  }
  return { n: n.toString(), e: e.toString(), c: c.toString(), oracle_responses: responses.join(',') };
};
