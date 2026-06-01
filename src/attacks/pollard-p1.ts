import type { Attack } from '../types';
import { wrapSageTemplate } from './guard';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';
import { gcd, modPow } from '../utils/bigint';

export const attack: Attack = {
  id: 'pollard-p1',
  name: "Pollard's p-1 Method",
  category: 'Factorization',
  description: 'Factors n when a prime factor p has p-1 that is B1-smooth, with Stage 2 extending to one larger factor. Use when small prime factors may be smooth.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'B', label: 'B1 (stage 1 bound, optional)', placeholder: '10000', required: false, multiline: false },
    { name: 'B2', label: 'B2 (stage 2 bound, optional)', placeholder: '0 (disabled)', required: false, multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => wrapSageTemplate({
    token: 'POLLARD_P1',
    n: vals.n,
    imports: ['import math'],
    body: `        B1 = int(Integer(${vals.B || '10000'}))
        if B1 < 2:
            B1 = 10000
        B2 = int(Integer(${vals.B2 || '0'}))
        if B2 < 0:
            B2 = 0
        out.append("Pollard's p-1 Method")
        out.append(f"n = {n}")
        out.append(f"B = {B1}")
        if B2 > B1:
            out.append(f"B2 = {B2}")
        out.append("")
        n_int = int(n)
        limit = B1
        sieve = [True] * (limit + 1)
        if limit >= 0:
            sieve[0] = False
        if limit >= 1:
            sieve[1] = False
        i = 2
        while i * i <= limit:
            if sieve[i]:
                for j in range(i * i, limit + 1, i):
                    sieve[j] = False
            i += 1
        primes = [i for i in range(limit + 1) if sieve[i]]
        a = 2
        for p in primes:
            pp = p
            while pp * p <= limit:
                pp *= p
            a = pow(a, pp, n_int)
        g = math.gcd(a - 1, n_int)
        found = False
        if 1 < g < n_int:
            g_sage = Integer(g)
            q_val = n // g_sage
            out.append("Results:")
            out.append(f"p = {g_sage}")
            out.append(f"q = {q_val}")
            out.append("")
            out.append(f"Verification: p * q = {g_sage * q_val}")
            out.append("")
            out.append("POLLARD_P1=SUCCESS")
            found = True
        if not found and B2 > B1:
            limit2 = B2
            sieve2 = [True] * (limit2 + 1)
            if limit2 >= 0:
                sieve2[0] = False
            if limit2 >= 1:
                sieve2[1] = False
            i = 2
            while i * i <= limit2:
                if sieve2[i]:
                    for j in range(i * i, limit2 + 1, i):
                        sieve2[j] = False
                i += 1
            big_primes = [i for i in range(limit + 1, limit2 + 1) if sieve2[i]]
            if big_primes:
                Q = 1
                Hq = pow(a, big_primes[0], n_int)
                Q = (Q * (Hq - 1)) % n_int
                for j in range(1, len(big_primes)):
                    d = big_primes[j] - big_primes[j - 1]
                    Hq = (Hq * pow(a, d, n_int)) % n_int
                    Q = (Q * (Hq - 1)) % n_int
                g = math.gcd(Q, n_int)
                if 1 < g < n_int:
                    g_sage = Integer(g)
                    q_val = n // g_sage
                    out.append("Results:")
                    out.append(f"p = {g_sage}")
                    out.append(f"q = {q_val}")
                    out.append("")
                    out.append(f"Verification: p * q = {g_sage * q_val}")
                    out.append("")
                    out.append("POLLARD_P1=SUCCESS")
                    found = True
        if not found:
            out.append("Results:")
            out.append("")
            out.append("POLLARD_P1=FAILED")`,
  }),
  proof: `\\textbf{Theorem:} If $p-1$ is $B_1$-smooth, compute $a^M \\bmod n$ with $M = \\operatorname{lcm}(1,\\ldots,B_1)$ to reveal $p$ via $\\gcd(a^M-1, n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item Fermat's Little Theorem: $a^{p-1} \\equiv 1 \\pmod{p}$ for $\\gcd(a,p)=1$
\\item $p-1$ is $B_1$-smooth: all prime factors of $p-1$ are $\\leq B_1$
\\item $M = \\operatorname{lcm}(1, 2, \\ldots, B_1)$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p-1 \\mid M &\\implies a^M \\equiv 1 \\pmod{p} \\\\
p &\\mid (a^M - 1) \\implies \\gcd(a^M - 1, n) = p \\\\
\\text{Stage 2: } p-1 &= q_0 \\cdot s,\\; s \\mid M,\\; q_0 \\in (B_1, B_2] \\\\
H &= a^M,\\; H^{q_0} \\equiv 1 \\pmod{p} \\\\
\\gcd\\left(\\prod_{q \\in (B_1, B_2]} (H^q - 1), n\\right) &= p \\qed
\\end{align*}

\\textbf{Explanation:} Pollard's $p-1$ method exploits Fermat's Little Theorem: if $p-1$ divides $M = \\operatorname{lcm}(1,\\ldots,B_1)$, then $a^M \\equiv 1 \\pmod{p}$, so $\\gcd(a^M-1, n)$ reveals $p$. Stage 1 computes $a^M$ by raising $a$ to each prime power $\\leq B_1$. Stage 2 handles the case where $p-1$ has one prime factor between $B_1$ and $B_2$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Python Eratosthenes sieve:} Generates prime lists up to $B_1$ and $B_2$ using a pure-Python bit sieve, avoiding Sage's $\\mathtt{prime\\_range}$ overhead in interactive mode and allowing direct control over the sieve size.
\\item \\textbf{Incremental Stage 2:} Updates $H_q$ incrementally as $H_q = H_q \\cdot a^{d} \\bmod n$ where $d = q_j - q_{j-1}$ is the gap between consecutive primes in $(B_1, B_2]$, then accumulates $\\prod (H_q - 1)$ for a single GCD per product batch.
\\end{itemize}

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974`,
  frontendCheck: (vals, onProgress) => {
    if (!vals.n) return Promise.resolve(null);
    try {
      const n = BigInt(vals.n);
      const B1 = parseInt(vals.B) || 10000;
      const B2 = parseInt(vals.B2) || 0;
      if (B1 < 2) return Promise.resolve(null);

      const limit = Math.max(B1, B2);
      const sieve = new Uint8Array(limit + 1);
      const primes: number[] = [];
      for (let i = 2; i <= limit; i++) {
        if (!sieve[i]) {
          primes.push(i);
          for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
        }
      }

      let stage1Count = 0;
      for (const p of primes) {
        if (p > B1) break;
        stage1Count++;
      }
      const stage2Count = B2 > B1 ? primes.length - stage1Count : 0;
      const totalOps = stage1Count + stage2Count;

      let output = `Pollard's p-1 Method\nn = ${n}\nB = ${B1}`;
      if (B2 > B1) output += `\nB2 = ${B2}`;
      output += `\n\n`;
      let opsDone = 0;

      let a = 2n;
      for (const p of primes) {
        if (p > B1) break;
        let pp = p;
        while (pp * p <= B1) pp *= p;
        a = modPow(a, BigInt(pp), n);
        opsDone++;
        if (onProgress && totalOps > 0 && opsDone % Math.max(1, Math.floor(totalOps / 10)) === 0) {
          const pct = Math.min(99, Math.round(opsDone * 100 / totalOps));
          onProgress(pct, `Stage 1: ${pct}%`);
        }
      }

      let g = gcd(a - 1n, n);
      if (g > 1n && g < n) {
        onProgress?.(100);
        return Promise.resolve(`${output}Results:\np = ${g}\nq = ${n / g}\n\nVerification: p * q = ${g * (n / g)}\n\nPOLLARD_P1=SUCCESS`);
      }

      if (B2 > B1) {
        for (const p of primes) {
          if (p <= B1) continue;
          a = modPow(a, BigInt(p), n);
          opsDone++;
        if (onProgress && totalOps > 0 && opsDone % Math.max(1, Math.floor(totalOps / 10)) === 0) {
          const pct = Math.min(99, Math.round(opsDone * 100 / totalOps));
          onProgress(pct, `Stage 2: ${pct}%`);
        }
          g = gcd(a - 1n, n);
          if (g > 1n && g < n) {
            onProgress?.(100);
            return Promise.resolve(`${output}Results:\np = ${g}\nq = ${n / g}\n\nVerification: p * q = ${g * (n / g)}\n\nPOLLARD_P1=SUCCESS`);
          }
        }
      }

      onProgress?.(100);
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  },
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  let p: bigint;
  while (true) {
    let pMinus1 = 2n;
    const primes = [];
    for (let i = 2; i <= 5000; i++) {
      if (isPrimeMR(BigInt(i))) primes.push(BigInt(i));
    }
    // Fisher-Yates shuffle for unbiased randomness
    for (let i = primes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [primes[i], primes[j]] = [primes[j], primes[i]];
    }
    let currentBits = 0n;
    let idx = 0;
    while (currentBits < 256n && idx < primes.length) {
      pMinus1 *= primes[idx];
      // Use BigInt bitLength for accurate bit counting
      currentBits += BigInt(primes[idx].toString(2).length);
      idx++;
    }
    // Stage 1 only: p = smoothProduct + 1
    p = pMinus1 + 1n;
    if (isPrimeMR(p)) break;
  }

  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  return { n: n.toString(), B: '10000', B2: '0' };
};