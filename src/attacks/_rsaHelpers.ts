import { bitLength, gcd } from '../utils/bigint';

// Exact bit length, re-exported here so attack files import helpers from one place.
export { bitLength };

/**
 * Trivial-factor fast path for even moduli. Returns 2n when n is even and
 * greater than 2, null otherwise. Replaces the copied even-n early returns
 * in the small-factor attacks.
 */
export function trivialFactor(n: bigint): bigint | null {
  if (n <= 2n || n % 2n !== 0n) return null;
  return 2n;
}

/**
 * Scan k in [kMin, kMax] for an exact integer e-th root of c + k*n.
 * Warm-start Newton (seeded from the previous candidate's root, guarded to
 * start above the true root) with a +-1 correction per candidate, plus an
 * optional residue pre-filter to skip hopeless candidates before rooting.
 * Returns { m, k } on the first exact hit, null when the window is exhausted.
 */
export function integerRootScan(
  c: bigint,
  n: bigint,
  e: bigint,
  kMax: bigint,
  opts?: {
    kMin?: bigint;
    accept?: (candidate: bigint) => boolean;
    onProgress?: (done: bigint, total: bigint) => void;
  },
): { m: bigint; k: bigint } | null {
  const kMin = opts?.kMin ?? 0n;
  const total = kMax - kMin + 1n;
  // Hoisted seed width: every candidate is <= c + kMax*n, so one bit-length
  // covers all Newton seeds (no per-candidate string conversion).
  const seedBits = Math.ceil(bitLength(c + kMax * n) / Number(e));
  let root = 1n;
  const rootOf = (value: bigint, prevRoot: bigint): bigint => {
    let x =
      prevRoot > 1n && (prevRoot + 2n) ** e >= value
        ? prevRoot
        : 1n << BigInt(seedBits);
    while (true) {
      const xEm1 = x ** (e - 1n);
      const next = ((e - 1n) * x * xEm1 + value) / (e * xEm1);
      if (next >= x) break;
      x = next;
    }
    return x;
  };
  for (let k = kMin; k <= kMax; k++) {
    if (opts?.onProgress && total > 1000n && (k - kMin) % 1000n === 0n) {
      opts.onProgress(k - kMin, total);
    }
    const candidate = c + k * n;
    if (opts?.accept && !opts.accept(candidate)) continue;
    root = rootOf(candidate, root);
    if (root ** e === candidate) return { m: root, k };
    if ((root + 1n) ** e === candidate) return { m: root + 1n, k };
    if (root > 0n && (root - 1n) ** e === candidate) return { m: root - 1n, k };
  }
  return null;
}

/**
 * First nontrivial gcd(guest, n) over a candidate list. Returns the factor
 * and its index, or null when every candidate is coprime to n (or a multiple
 * of n). Consolidates the per-base/per-candidate gcd loops in dp-dq-leak,
 * small-crt-exp's batch rescan, and rsa-crt-fault.
 */
export function gcdSetScan(n: bigint, candidates: bigint[]): { factor: bigint; index: number } | null {
  for (let i = 0; i < candidates.length; i++) {
    const g = gcd(candidates[i], n);
    if (g > 1n && g < n) return { factor: g, index: i };
  }
  return null;
}

/**
 * Common applicableCheck patterns for RSA attacks.
 * Centralized to avoid 20+ duplicate inline checks across attack files.
 */
export const rsaNeeds = {
  n: (p: Record<string, string>) => !!p.n,
  nE: (p: Record<string, string>) => !!p.n && !!p.e,
  nC: (p: Record<string, string>) => !!p.n && !!p.c,
  nEC: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c,
  nECPQ: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.p && !!p.q,
  nP: (p: Record<string, string>) => !!p.n && !!p.p,
  nQ: (p: Record<string, string>) => !!p.n && !!p.q,
  nPQ: (p: Record<string, string>) => !!p.n && !!p.p && !!p.q,
  nPhi: (p: Record<string, string>) => !!p.n && !!p.phi,
  nDP: (p: Record<string, string>) => !!p.n && !!p.dp,
  nDQ: (p: Record<string, string>) => !!p.n && !!p.dq,
  n1N2: (p: Record<string, string>) => !!p.n1 && !!p.n2,
  // ─── Multi-key patterns ──────────────────────────────────────────────────
  nE1E2C1C2: (p: Record<string, string>) => !!p.n && !!p.e1 && !!p.e2 && !!p.c1 && !!p.c2,
  nEC1C2: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c1 && !!p.c2,
  nC1C2: (p: Record<string, string>) => !!p.n && !!p.c1 && !!p.c2,
  // ─── Oracle-based patterns ──────────────────────────────────────────────
  nECOracleResponses: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_responses,
  nCOracleResponses: (p: Record<string, string>) => !!p.n && !!p.c && !!p.oracle_responses,
  nEOracleRuns: (p: Record<string, string>) => !!p.n && !!p.e && !!p.c && !!p.oracle_runs,
  nETargetMOraclePairs: (p: Record<string, string>) => !!p.n && !!p.e && !!p.target_m && !!p.oracle_pairs,
  // ─── Signature-based patterns ───────────────────────────────────────────
  nEMSigFaulty: (p: Record<string, string>) => !!p.n && !!p.e && !!p.m && !!p.sig_faulty,
  nHashHex: (p: Record<string, string>) => !!p.n && !!p.hash_hex,
  // ─── Partial-key patterns ───────────────────────────────────────────────
  nEDLow: (p: Record<string, string>) => !!p.n && !!p.e && !!p.dLow,
  nEK: (p: Record<string, string>) => !!p.n && !!p.k,
  nPmsb: (p: Record<string, string>) => !!p.n && !!p.p_msb,
  nNearp: (p: Record<string, string>) => !!p.n && !!p.nearp,
  nKnownBitsBitPos: (p: Record<string, string>) => !!p.n && !!p.knownBits && !!p.bitPosition,
  nDpDq: (p: Record<string, string>) => !!p.n && !!p.e && (!!p.dp || !!p.dq),
  // ─── Other patterns ─────────────────────────────────────────────────────
  nECiphertexts: (p: Record<string, string>) => !!p.e && !!p.ciphertexts,
  triplesE: (p: Record<string, string>) => !!p.triples && !!p.e,
  nValues: (p: Record<string, string>) => !!p.n_values,
  nValuesMulti: (p: Record<string, string>) => {
    const vals = (p.n_values || '').trim();
    if (!vals) return false;
    return vals.split(/[\n,]+/).filter(x => x.trim()).length >= 2;
  },
  nALeak: (p: Record<string, string>) => !!p.n && !!p.a && !!p.leak,
  moduliList: (p: Record<string, string>) => {
    const vals = (p.n_values || '').trim();
    if (!vals) return false;
    return vals.split(/[\n,]+/).filter(x => x.trim()).length >= 2;
  },
} as const;

/**
 * No-op sageTemplate for pure-TypeScript attacks (frontendCheck only).
 * Returns a clear message if ever triggered.
 * @param token Attack-specific token for the NOT_APPLICABLE marker
 */
export const noopSageTemplate = (token: string = 'ATTACK'): string =>
  `This attack runs entirely in the browser via frontendCheck. No SageMath execution is needed.\n\nSee the proof panel for the algorithm and the result panel for the computed output.\n\n${token}=NOT_APPLICABLE`;

/**
 * Generates Python code for Coppersmith lattice construction, LLL reduction,
 * row scanning for two-term polynomials, and root recovery.
 *
 * Used by simple-lattice, partial-key-exposure, and partial-pq-bits attacks.
 * @param f - Python expression for the monic polynomial (e.g., "nearp + x" or "p_msb + x")
 * @param n - Python expression for the modulus variable (default "n")
 * @param m - Lattice parameter m (default 5)
 * @param t - Lattice parameter t (default 5)
 * @param recover - Python expression for the factor candidate from root r.
 * LSB monic polynomials pass "(2**m) * r + knownBits" so the original
 * non-monic form is what gets divisibility-tested.
 * Scope: hardcoded X = n^1/4; callers need |x0| <= n^1/4.
 */
export function coppersmithLatticePython(
  f: string,
  n = 'n',
  m = 5,
  t = 5,
  recover?: string,
): string {
  const recoverExpr = recover ?? f.replace(/\bx\b/g, 'r');
  return `            # Coppersmith lattice: degree-1, checks ALL LLL rows (bypasses Sage Row-0 bug).
            # X = n^1/4 below: sound only when the unknown satisfies |x0| <= X.
            x = ZZ['x'].gen()
            f_ZZ = ${f}
            X = ${n}.nth_root(4, truncate_mode=True)[0] + 1
            dim = ${m} + ${t}
            shifts = []
            for i in range(${m}):
                shifts.append(${n}^(${m} - i) * f_ZZ^i)
            for kk in range(${t}):
                shifts.append(f_ZZ^${m} * x^kk)
            M_mat = matrix(ZZ, dim, dim)
            for i, shift in enumerate(shifts):
                for j, c in enumerate(shift.list()):
                    M_mat[i, j] = c * X^j
            B = M_mat.LLL()
            found_p = None
            for kk in range(dim):
                row = B[kk]
                a0 = Integer(row[0]); a1 = Integer(row[1])
                if a1 == 0:
                    continue
                r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                # +-2 window: LLL yields an approximation, so the true integer root
                # can sit ~2 away from the rounded estimate; each candidate is
                # divisibility-verified, so widening cannot cause a false positive.
                for delta in range(-2, 3):
                    r = Integer(floor(r_approx)) + delta
                    if abs(r) <= X:
                        candidate = ${recoverExpr}
                        if ${n} % candidate == 0:
                            found_p = candidate
                            break
                if found_p:
                    break`;
}
