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
    return vals.split('\n').filter(x => x.trim()).length >= 2;
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
 * @param f - Python expression for the polynomial (e.g., "nearp + x" or "(knownBits << k) + x")
 * @param n - Python expression for the modulus variable (default "n")
 * @param m - Lattice parameter m (default 5)
 * @param t - Lattice parameter t (default 5)
 */
export function coppersmithLatticePython(
  f: string,
  n = 'n',
  m = 5,
  t = 5,
): string {
  return `            # Coppersmith lattice: degree-1, checks ALL LLL rows (bypasses Sage Row-0 bug).
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
                for delta in range(-2, 3):
                    r = Integer(floor(r_approx)) + delta
                    if abs(r) < X:
                        candidate = ${f.replace(/\bx\b/g, 'r')}
                        if ${n} % candidate == 0:
                            found_p = candidate
                            break
                if found_p:
                    break`;
}
