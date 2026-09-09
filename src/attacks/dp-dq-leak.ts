import type { Attack } from '../types';
import { gcdSetScan, rsaNeeds } from './_rsaHelpers';
import { generateKeyPair, TESTCASE_BITS } from '../utils/testcases/core';
import { modInverse, modPow } from '../utils/bigint';
import { wrapSageTemplate, validateNumeric} from './guard';

export const attack: Attack = {
  id: 'dp-dq-leak',
  name: 'dp/dq Leak',
  category: 'Partial Key / Lattice',
  description: 'Recovers p from leaked d_p (or q from leaked d_q) via FLT-based GCD. Use when CRT exponents d_p or d_q are known.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'e', label: 'e (public exponent)', placeholder: 'Enter public exponent e...', multiline: true, rows: 3 },
    { name: 'dp', label: 'dp (d mod p-1)', placeholder: 'Enter dp value...', multiline: true, rows: 3 },
    { name: 'dq', label: 'dq (d mod q-1, optional)', placeholder: 'Enter dq value...', required: false, multiline: true, rows: 3 },
    { name: 'qinv', label: 'qinv (q^-1 mod p, optional)', placeholder: 'Enter qinv value...', required: false, multiline: true, rows: 3 },
  ],
  frontendCheck: (vals: Record<string, string>) => {
    try {
      const n = BigInt(vals.n);
      const e = BigInt(vals.e);
      if (n <= 0n || e <= 0n) return null;
      // One base can yield the trivial gcd n (both primes divide base^exp - 1);
      // retrying with another base usually splits n instead.
      const bases = [2n, 3n, 5n];

      if (vals.dp) {
        const dp = BigInt(vals.dp);
        if (dp > 0n) {
          const exp = e * dp - 1n;
          if (exp > 0n) {
            const split = gcdSetScan(n, bases.map((base) => modPow(base, exp, n) - 1n));
            if (split) return dpDqSuccess(n, e, vals, split.factor, n / split.factor);
          }
        }
      }

      if (vals.dq) {
        const dq = BigInt(vals.dq);
        if (dq > 0n) {
          const exp = e * dq - 1n;
          if (exp > 0n) {
            const split = gcdSetScan(n, bases.map((base) => modPow(base, exp, n) - 1n));
            if (split) return dpDqSuccess(n, e, vals, n / split.factor, split.factor);
          }
        }
      }

      // Partial-dp k-iteration primality mode: when every FLT base gives the
      // trivial gcd, e*dp - 1 = k*(p-1) still yields p = (e*dp-1)/k + 1 for the
      // true k. Scan k = 1..min(e, 10^6), testing primality-divisibility.
      const kCap = e < 1000000n ? e : 1000000n;
      for (const key of ['dp', 'dq']) {
        if (!vals[key]) continue;
        const dval = BigInt(vals[key]);
        if (dval <= 0n) continue;
        const num = e * dval - 1n;
        for (let k = 1n; k <= kCap; k++) {
          if (num % k !== 0n) continue;
          const pCand = num / k + 1n;
          if (pCand > 1n && pCand < n && n % pCand === 0n) {
            return dpDqSuccess(n, e, vals, pCand, n / pCand);
          }
        }
      }

      return null;
    } catch (e) {
      console.warn('[dp-dq-leak] frontendCheck error:', e);
      return null;
    }
  },
  sageTemplate: (vals: Record<string, string>) => {
    // FLT-based GCD: p | base^(e*dp - 1) - 1 in a single modPow, ~10^4x faster
    // than the k-iteration approach. Tries bases 2, 3, 5 since one base can
    // give the trivial gcd n. Mirrors the frontendCheck logic.
    const dpBlock = vals.dp ? `
        dp_val = int(Integer(${validateNumeric(vals.dp, 'dp')}))
        if dp_val > 0:
            exp = dp_val * e_int - 1
            if exp > 0:
                for base in [2, 3, 5]:
                    if found:
                        break
                    x = pow(base, exp, n_int)
                    p_candidate = gcd(x - 1, n_int)
                    if 1 < p_candidate < n_int:
                        p_sage = Integer(p_candidate)
                        q_val = n // p_sage
                        out.append("DP-DQ Leak")
                        out.append(f"n = {n}")
                        out.append(f"e = {e}")
                        out.append(f"dp = {dp_val}")
                        out.append("")
                        out.append("Results:")
                        out.append(f"p = {p_sage}")
                        out.append(f"q = {q_val}")
                        out.append("")
                        out.append(f"Verification: p * q = {p_sage * q_val}")
                        out.append("")
                        out.append("DP_DQ_LEAK=SUCCESS")
                        found = True` : '';

    const dqBlock = vals.dq ? `
        if not found:
            dq_val = int(Integer(${validateNumeric(vals.dq, 'dq')}))
            if dq_val > 0:
                exp = dq_val * e_int - 1
                if exp > 0:
                    for base in [2, 3, 5]:
                        if found:
                            break
                        x = pow(base, exp, n_int)
                        q_candidate = gcd(x - 1, n_int)
                        if 1 < q_candidate < n_int:
                            p_val = n // Integer(q_candidate)
                            q_sage = Integer(q_candidate)
                            p_sage = p_val
                            q_val = q_sage
                            out.append("DP-DQ Leak")
                            out.append(f"n = {n}")
                            out.append(f"e = {e}")
                            out.append(f"dq = {dq_val}")
                            out.append("")
                            out.append("Results:")
                            out.append(f"p = {p_val}")
                            out.append(f"q = {q_sage}")
                            out.append("")
                            out.append(f"Verification: p * q = {p_val * q_sage}")
                            out.append("")
                            out.append("DP_DQ_LEAK=SUCCESS")
                            found = True` : '';

    return wrapSageTemplate({
      token: 'DP_DQ_LEAK',
      n: validateNumeric(vals.n, 'n'),
      body: `        e = Integer(${validateNumeric(vals.e, 'e')})
        if n <= 0 or e <= 0:
            out.append("DP_DQ_LEAK=FAILED: invalid input values")
            out.append("DP_DQ_LEAK=FAILED")
        else:
            n_int = int(n)
            e_int = int(e)
            found = False${dpBlock}${dqBlock}
            if not found:
                # Partial-dp k-iteration primality mode: e*dval - 1 = k*(p-1).
                k_cap = min(e_int, 1000000)
                for key in ('dp', 'dq'):
                    if found:
                        break
                    d_str = "${validateNumeric(vals.dp || '', 'dp')}" if key == 'dp' else "${validateNumeric(vals.dq || '', 'dq')}"
                    if not d_str.strip():
                        continue
                    d_val = int(Integer(d_str))
                    if d_val <= 0:
                        continue
                    num = e_int * d_val - 1
                    for k_cand in range(1, k_cap + 1):
                        if num % k_cand != 0:
                            continue
                        p_cand = num // k_cand + 1
                        if 1 < p_cand < n_int and n_int % p_cand == 0:
                            p_sage = Integer(p_cand)
                            q_val = n // p_sage
                            out.append("DP-DQ Leak (k-iteration fallback)")
                            out.append(f"n = {n}")
                            out.append(f"e = {e}")
                            out.append(f"{key} = {d_val}")
                            out.append("")
                            out.append("Results:")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {q_val}")
                            out.append("")
                            out.append(f"Verification: p * q = {p_sage * q_val}")
                            out.append("")
                            out.append("DP_DQ_LEAK=SUCCESS")
                            found = True
                            break
            qinv_str = "${validateNumeric(vals.qinv || '', 'qinv')}".strip()
            if found and qinv_str:
                try:
                    qinv_chk = Integer(qinv_str)
                    out.append(f"qinv cross-check: {(q_val * qinv_chk) % p_sage}")
                except Exception:
                    pass
        if not found:
            out.append("DP_DQ_LEAK=FAILED")`,
      useGuard: true,
    });
  },
  proof: `\\textbf{Theorem:} Given $d_p = d \\bmod (p-1)$, factor $n$ via Fermat's Little Theorem: $p \\mid b^{e \\cdot d_p - 1} - 1$ for $b \\in \\{2, 3, 5\\}$, so $\\gcd(b^{e \\cdot d_p - 1} - 1, n) = p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed_p \\equiv 1 \\pmod{p-1}$, so $e \\cdot d_p - 1 = k(p-1)$ for some integer $k$
\\item FLT: $b^{p-1} \\equiv 1 \\pmod{p}$ for $b \\in \\{2, 3, 5\\}$ (as $\\gcd(b, p) = 1$), so $b^{e \\cdot d_p - 1} = (b^{p-1})^k \\equiv 1 \\pmod{p}$
\\item Symmetrically, $q \\mid 2^{e \\cdot d_q - 1} - 1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &\\mid b^{e d_p - 1} - 1 \\quad \\text{(FLT, per base $b$)} \\\\
q &\\nmid b^{e d_p - 1} - 1 \\quad \\text{(in general, with high probability)} \\\\
\\gcd(b^{e d_p - 1} - 1, n) &= p,\\quad b \\in \\{2,3,5\\} \\qed
\\end{align*}

\\textbf{Explanation:} A single modular exponentiation recovers the prime factor directly, replacing the k-iteration approach. By Fermat's Little Theorem, $2^{e d_p} \\equiv 2 \\pmod{p}$, so $b^{e d_p - 1} - 1$ is divisible by $p$ but (with high probability) not by $q$. The GCD with $n$ extracts $p$ in one operation. If one base yields the trivial gcd $n$ (both primes divide $b^{ed_p-1}-1$), the attack retries with the next base until the gcd splits $n$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{FLT-based direct GCD:} Both the browser frontendCheck and the Sage template compute $\\gcd(b^{e \\cdot d_p - 1} - 1, n)$ for $b \\in \\{2, 3, 5\\}$ in a single modular exponentiation and GCD per base, replacing the $O(e)$ k-iteration approach. A base yielding the trivial gcd $n$ is skipped in favour of the next base. $\\sim 10^4\\times$ faster for $e = 65537$.
\\end{itemize}

\\textbf{References:} Standard RSA-CRT analysis; M. Campagna, A. Sethi, "Key Recovery Method for CRT Implementation of RSA"`,
  usageGuide: 'This attack factors n using leaked CRT parameters dp and dq.\n\nHow to use:\n1. You have modulus n, public exponent e, and the CRT exponent dp (= d mod p-1)\n2. Optionally provide dq (= d mod q-1) as well\n3. The attack computes p from dp via gcd(pow(base, e*dp - 1, n) - 1, n), trying base = 2, 3, 5 until the gcd splits n (one base can yield the trivial gcd n). If every base is trivial, a bounded k-iteration fallback (k <= min(e, 10^6)) tests p = (e*dp-1)/k + 1 for divisibility (partial-dp primality mode). Optional qinv is cross-checked as (q*qinv) mod p = 1\n4. q = n / p gives the factorization\n\nTip: dp and dq are often stored alongside the private key. This attack runs entirely in your browser — no server computation needed.',
  priority: 'high',
  applicableCheck: rsaNeeds.nDpDq,
};

/** Shared SUCCESS renderer; cross-checks optional qinv (q*qinv = 1 mod p). */
function dpDqSuccess(
  n: bigint,
  e: bigint,
  vals: Record<string, string>,
  p: bigint,
  q: bigint,
): string {
  const leaked = vals.dp ? `dp = ${vals.dp}` : `dq = ${vals.dq}`;
  let qinvLine = '';
  if (vals.qinv) {
    try {
      const qinv = BigInt(vals.qinv);
      qinvLine = (q * qinv) % p === 1n ? `\nqinv cross-check: (q*qinv) mod p = 1 OK` : `\nWARNING: (q*qinv) mod p != 1 (qinv inconsistent)`;
    } catch {
      qinvLine = '\nWARNING: qinv unparsable';
    }
  }
  return `DP-DQ Leak\nn = ${n.toString()}\ne = ${e.toString()}\n${leaked}\n\nResults:\np = ${p.toString()}\nq = ${q.toString()}${qinvLine}\n\nVerification: p * q = ${(p * q).toString()}\n\nDP_DQ_LEAK=SUCCESS`;
}

export const generateTestcase = (): Record<string, string> => {
  const { p, q, n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
  const dp = d % (p - 1n);
  const dq = d % (q - 1n);
  const qinv = modInverse(q % p, p)!;
  return { n: n.toString(), e: e.toString(), dp: dp.toString(), dq: dq.toString(), qinv: qinv.toString() };
};
