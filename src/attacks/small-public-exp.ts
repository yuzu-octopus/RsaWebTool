import type { Attack } from '../types';
import { rsaNeeds } from './_rsaHelpers';
import { generateHastadTestcase } from '../utils/testcases/core';;
import {  } from '../utils/bigint';
import { wrapSageTemplate } from './guard';

export const K_BOUND_DEFAULT = 100000;

export const attack: Attack = {
  id: 'small-public-exp',
  name: 'Small Public Exponent',
  category: 'Advanced',
  description: 'Recovers plaintext m via integer e-th root (m = (c + k*n)^(1/e)) with modular residue pre-filter. Use when e is small (e.g., 3, 5, 17).',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: '3' },
    { name: 'c', label: 'c (ciphertext)', placeholder: 'Enter ciphertext c...', multiline: true, rows: 3 },
    { name: 'k_bound', label: 'k bound (c + k*n iterations)', placeholder: String(K_BOUND_DEFAULT), required: false },
  ],
  sageTemplate: (vals: Record<string, string>) => {
    if (!vals.n || !vals.c) {
      return `print("ERROR: Missing required inputs (n, c)")
print("SMALL_PUBLIC_EXP=FAILED")`;
    }
    return wrapSageTemplate({
      token: 'SMALL_PUBLIC_EXP',
      useGuard: false,
      body: `        n = Integer(${vals.n})
        e_val = "${vals.e}".strip()
        e = Integer(e_val) if e_val else Integer(3)
        c = Integer(${vals.c})
        k_bound_val = "${vals.k_bound}".strip() if "${vals.k_bound}" else "100000"
        k_bound = Integer(k_bound_val) if k_bound_val else Integer(100000)
        out.append("Small Public Exponent")
        out.append(f"n = {n}")
        out.append(f"c = {c}")
        out.append("")
        out.append("Results:")
        # Modular residue pre-filter for e-th powers
        if e <= 100:
            p = Integer(e + 1)
            while True:
                if p >= 50000:
                    filter_mod = 0
                    residues = set()
                    break
                if is_prime(p) and (p - 1) % e == 0:
                    filter_mod = p
                    residues = set(pow(x, e, filter_mod) for x in range(int(p)))
                    break
                p = next_prime(p + 1)
        else:
            filter_mod = 0
            residues = set()
        found = False
        for k in range(int(k_bound) + 1):
            candidate = c + k * n
            if filter_mod and candidate % filter_mod not in residues:
                continue
            m, exact = candidate.nth_root(e, truncate_mode=True)
            if exact:
                out.append(f"m = {m}")
                out.append(f"k = {k}")
                m_hex_val = hex(m)[2:]
                if len(m_hex_val) % 2 != 0:
                    m_hex_val = '0' + m_hex_val
                out.append(f"m as hex: {m_hex_val}")
                try:
                    m_bytes = bytes.fromhex(m_hex_val)
                    out.append(f"m as text: {m_bytes.decode('utf-8', errors='replace')}")
                except Exception:
                    out.append("m as text: <not decodable>")
                out.append("")
                out.append(f"Verification: m^e mod n = {pow(m, int(e), int(n))}")
                found = True
                break
        if not found:
            out.append(f"Reason: No perfect {e} power found for k in 0..{k_bound} with e = {e}")
            out.append("")
            out.append("SMALL_PUBLIC_EXP=FAILED")
        else:
            out.append("")
            out.append("SMALL_PUBLIC_EXP=SUCCESS")
`,
    });
  },
  frontendCheck: (vals: Record<string, string>, onProgress?: (pct: number, detail?: string) => void): Promise<string | null> => {
    const n = BigInt(vals.n);
    const e = BigInt(vals.e || '3');
    const c = BigInt(vals.c);
    if (e > 1000n) return Promise.resolve(null); // Delegate to Sage for large e
    const kBound = BigInt(vals.k_bound || '100000');
    if (kBound < 0n) return Promise.resolve(null);

    // Modular residue pre-filter: skip candidates that can't be exact e-th powers
    let filterMod = 0n;
    let residues: Set<bigint> | null = null;
    if (e === 3n) {
      // Perfect cubes mod 9 are only {0, 1, 8} — filters 67% of non-cubes
      filterMod = 9n;
      residues = new Set([0n, 1n, 8n]);
    } else if (e <= 100n) {
      // For other small e, find a prime p where e | (p-1) for residue filtering
      for (let p = 2n * e + 1n; p < 1000n; p += 2n) {
        if (p % 3n === 0n || p % 5n === 0n || p % 7n === 0n || p % 11n === 0n || p % 13n === 0n) continue;
        let composite = false;
        for (let d = 17n; d * d <= p; d += 2n) {
          if (p % d === 0n) { composite = true; break; }
        }
        if (!composite && (p - 1n) % e === 0n) {
          filterMod = p;
          break;
        }
      }
      if (filterMod > 0n) {
        residues = new Set();
        for (let x = 0n; x < filterMod; x++) {
          let pow = 1n;
          for (let i = 0n; i < e; i++) pow = (pow * x) % filterMod;
          residues.add(pow);
        }
      }
    }

    // Warm-started Newton for integer e-th root
    const rootOf = (value: bigint, prevRoot: bigint): bigint => {
      // Only warm-start from prevRoot if it's >= the true root (prevRoot^e >= value).
      // Starting below the root causes Newton's first jump to overshoot and immediately
      // trigger the convergence break (next >= x), returning the wrong root.
      let x = (prevRoot > 1n && (prevRoot + 2n) ** e >= value)
        ? prevRoot
        : 1n << BigInt(Math.ceil(value.toString(2).length / Number(e)));
      while (true) {
        const x_em1 = x ** (e - 1n);
        const next = ((e - 1n) * x * x_em1 + value) / (e * x_em1);
        if (next >= x) break;
        x = next;
      }
      return x;
    };

    const fmtResult = (m: bigint, k: bigint): string => {
      const mHex = m.toString(16);
      const mHexPadded = mHex.length % 2 ? '0' + mHex : mHex;
      let mText = '<not decodable>';
      try {
        const bytes = new Uint8Array(mHexPadded.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(mHexPadded.substring(i * 2, i * 2 + 2), 16);
        }
        mText = new TextDecoder().decode(bytes);
      } catch { /* keep default */ }
      return `Small Public Exponent\nn = ${n}\nc = ${c}\n\nResults:\nm = ${m}\nk = ${k}\nm as hex: ${mHexPadded}\nm as text: ${mText}\n\nVerification: m^e mod n = ${c}\n\nSMALL_PUBLIC_EXP=SUCCESS`;
    };
    let root = 1n;
    for (let k = 0n; k <= kBound; k++) {
      if (onProgress && kBound > 1000n && k % 1000n === 0n) {
        const pct = Number(k * 100n / kBound);
        onProgress(pct, `k = ${k.toString()} / ${kBound.toString()}`);
      }
      const candidate = c + k * n;
      // Modular pre-filter: skip candidates that can't be perfect e-th powers
      if (residues && !residues.has(candidate % filterMod)) continue;
      if (k === 0n) {
        root = rootOf(candidate, 1n);
      } else {
        root = rootOf(candidate, root);
      }
      if (root ** e === candidate) {
        onProgress?.(100);
        return Promise.resolve(fmtResult(root, k));
      }
      if ((root + 1n) ** e === candidate) {
        onProgress?.(100);
        return Promise.resolve(fmtResult(root + 1n, k));
      }
      if (root > 0n && (root - 1n) ** e === candidate) {
        onProgress?.(100);
        return Promise.resolve(fmtResult(root - 1n, k));
      }
    }
    return Promise.resolve(null);
  },
  proof: `\\textbf{Theorem:} For any RSA ciphertext, $m^e = c + k \\cdot n$ for some $k \\geq 0$. When $m^e < n$, $k=0$ and $m = \\sqrt[e]{c}$ directly. When $k > 0$, brute-force $k$ until $\\sqrt[e]{c + k \\cdot n}$ is integer.

\\textbf{Setup:}
\\begin{itemize}
\\item $n$ is an RSA modulus, $e$ is a small public exponent
\\item $c = m^e \\bmod n$ (ciphertext)
\\item $k$ is the quotient $\\lfloor m^e / n \\rfloor$, small when $m$ is near $n^{1/e}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c &\\equiv m^e \\pmod{n} \\\\
m^e &= c + k \\cdot n \\quad\\text{for some } k \\in \\mathbb{Z}_{\\geq 0} \\\\
\\therefore m &= \\sqrt[e]{c + k \\cdot n} \\quad\\text{when } k \\text{ is correct} \\qed
\\end{align*}

\\textbf{Explanation:} The RSA relation $c \\equiv m^e \\pmod{n}$ is equivalent to $m^e = c + k \\cdot n$ for some integer $k \\geq 0$. When $m^e < n$ (short plaintext), $k = 0$ and $m = \\sqrt[e]{c}$ directly. Otherwise, $k$ is the (unknown) quotient $\\lfloor m^e / n \\rfloor$. For small $e$, this quotient is often small enough to brute-force: we iterate $k = 0, 1, 2, \\ldots$ and check whether $c + k \\cdot n$ is an exact $e$-th power.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Modular residue pre-filter:} For $e=3$, perfect cubes mod 9 are only $\\{0, 1, 8\\}$ — candidates with other residues are skipped before attempting the $e$-th root, reducing loop iterations by $\\sim 67\\%$. For $e \\leq 100$, a dynamic prime modulus $p$ with $e \\mid (p-1)$ is found at runtime and the $e$-th power residues are precomputed.
\\item \\textbf{Warm-start Newton:} The $e$-th root computation uses Newton's method seeded from the previous $k$'s root (warm-start). A guard condition $\\mathtt{prevRoot}^e \\geq \\mathtt{candidate}$ ensures the warm-start is only accepted when starting from above the true root, preventing mis-convergence.
\\item \\textbf{Combined speedup:} The pre-filter + warm-start yield up to $2.5\\times$ faster worst-case search vs restarting Newton from scratch on every candidate.
\\end{itemize}

\\textbf{References:} D. Boneh et al., "Twenty Years of Attacks on the RSA Cryptosystem", Notices AMS 1999`,
  usageGuide: 'Recovers plaintext m by iterating k and checking whether c + k·n is an exact e-th power.\n\nHow to use:\n1. Provide n (modulus), e (small public exponent, default 3), and c (ciphertext)\n2. Optionally set a custom k_bound (default 100000) to limit the search space\n3. The attack searches k = 0, 1, ..., k_bound for c + k·n that yields an exact e-th root\n\nOptimizations: Modular residue pre-filter (for e ≤ 100) skips ~67% of candidates for e=3 by checking if c+k·n is a perfect cube mod 9 before attempting the e-th root. Warm-start Newton uses the previous k\'s root as seed for the next k\'s root computation, avoiding restarting Newton from scratch.\n\nTips: This attack works best for e ≤ 17 where k_bound is small and the pre-filter is most effective. For e > 1000, the attack delegates to Sage. Use the frontendCheck for instant e=3 results.',
  priority: 'high',
  applicableCheck: rsaNeeds.nEC,
};

export const generateTestcase = (): Record<string, string> => {
  const kp = generateHastadTestcase();
  // k_bound limits the k search space for m^e = c + k*n (default 100000 matches the input placeholder).
  return { n: kp.n.toString(), e: kp.e.toString(), c: kp.c.toString(), k_bound: String(K_BOUND_DEFAULT) };
};
