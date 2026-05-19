import type { Attack } from '../types';
import { randomPrime, TESTCASE_BITS } from '../utils/testcases/core';
import { modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'hastad-broadcast',
  name: "Hastad's Broadcast Attack",
  category: 'Message / Protocol',
  description: 'Recovers m from e broadcasts with small e. Use when same m sent to e recipients with exponent e.',
  inputs: [
    { name: 'e', label: 'e (public exponent / number of ciphertexts)', placeholder: '3', multiline: false },
    { name: 'ciphertexts', label: 'ciphertexts (one per line: c, n)', placeholder: 'c1, n1\nc2, n2\nc3, n3', multiline: true, rows: 6 },
  ],
  sageTemplate: (v) => `e = Integer(${v.e})
lines = """${v.ciphertexts}""".strip().split('\\n')

if e < 2:
    print("e must be >= 2 for broadcast attack")
    print("HASTAD_BROADCAST=FAILED")
    return

print(f"Hastad's Broadcast Attack")
print(f"e = {e}")
print(f"Number of ciphertexts: {len(lines)}")
print()

if len(lines) < e:
    print(f"Need at least {e} ciphertexts for e = {e}.")
    print(f"Got {len(lines)}.")
    print("HASTAD_BROADCAST=FAILED")
    return

pairs = []
for i, line in enumerate(lines[:e]):
    parts = line.strip().split(',')
    if len(parts) != 2:
        print(f"Line {i+1}: expected 'c, n', got '{line}'")
        print("HASTAD_BROADCAST=FAILED")
        return
    c, n = Integer(parts[0].strip()), Integer(parts[1].strip())
    pairs.append((c, n))
    print(f"c{i+1} = {c}")
    print(f"n{i+1} = {n}")
print()

# Chinese Remainder Theorem
# Find M such that M ≡ c_i (mod n_i) for all i
N = 1
for _, n in pairs:
    N *= n

print(f"Product of all moduli: N has {N.nbits()} bits")
print()

M = 0
for c_i, n_i in pairs:
    N_i = N // n_i
    inv = inverse_mod(N_i, n_i)
    M += c_i * N_i * inv
    M = M % N

print(f"m^e (over integers) = {M}")
print()

# Take e-th root
root, exact = M.integer_nth_root(e)
if exact:
    m = root
    print(f"m = {m}")
    for i, (c_i, n_i) in enumerate(pairs):
        check = power_mod(m, e, n_i)
        print(f"Verification {i+1}: m^{e} mod n = {check} == c? {check == c_i}")
    print("HASTAD_BROADCAST=SUCCESS")
else:
    print(f"m^e is not a perfect {e}-th root.")
    print("Messages may differ or ciphertexts are malformed.")
    print("HASTAD_BROADCAST=FAILED")
`,
  proof: `\\textbf{Theorem:} If $m$ is encrypted with the same $e$ to $e$ different moduli, CRT recovers $m^e$ over $\\mathbb{Z}$, then $m = \\sqrt[e]{m^e}$.

\\textbf{Prerequisites:}
\\begin{itemize}
\\item $c_i = m^e \\bmod n_i$ for $i = 1, \\ldots, e$
\\item All $n_i$ are pairwise coprime
\\item $m^e < \\prod_{i=1}^{e} n_i$ (guaranteed when $m < \\min(n_i)$)
\\item Chinese Remainder Theorem
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_i &\\equiv m^e \\pmod{n_i} \\\\
\\text{CRT} \\implies M &\\equiv m^e \\pmod{\\prod n_i} \\\\
m^e &< \\prod n_i \\implies M = m^e \\text{ (over } \\mathbb{Z}\\text{)} \\\\
m &= \\sqrt[e]{M} \\qed
\\end{align*}

\\textbf{Explanation:} The same message encrypted with exponent $e$ across $e$ different moduli. CRT reconstructs $m^e$ as an integer (not modulo anything). Since $m^e < \\prod n_i$, no modular reduction occurred — just take the integer $e$-th root.

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA", 1988`,
  priority: 'high',
  applicableCheck: (p) => !!p.e && !!p.ciphertexts,
};

export const generateTestcase = (): Record<string, string> => {
  const e = 3n;
  const m = BigInt(Math.floor(Math.random() * 10000) + 42);
  const lines: string[] = [];
  for (let i = 0; i < Number(e); i++) {
    const p = randomPrime(TESTCASE_BITS.p);
    const q = randomPrime(TESTCASE_BITS.q);
    const n = p * q;
    const c = modPow(m, e, n);
    lines.push(`${c}, ${n}`);
  }
  return { e: e.toString(), ciphertexts: lines.join('\n') };
};
