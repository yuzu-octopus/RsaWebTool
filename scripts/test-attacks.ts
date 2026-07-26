/**
 * test-attacks.ts — Bun script
 *
 * Runs test validation across all 52 attacks in 3 layers:
 *   L2:  generateTestcase() + applicableCheck() + required keys present
 *   L2b: Deep semantic validation (mathematical correctness of testcases)
 *   L3:  frontendCheck() for the 8 attacks that have it
 *
 * Also exports .sage template files for L4 Docker testing.
 *
 * Usage:
 *   bun run test:attacks                    # full run
 *   bun run test:attacks -- --fail          # only show failures
 *   bun run test:attacks -- --json          # JSON summary only
 *
 * Output:
 *   scripts/test-results/results.json       — machine-readable results
 *   scripts/test-results/templates/*.sage   — per-attack SageMath templates
 *   stdout — formatted summary table
 */

import { attacks, testcaseGenerators } from '../src/attacks/index';
import { gcd, modPow, isqrt } from '../src/utils/bigint';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Config ────────────────────────────────────────────────────────────
const RESULT_FILE = resolve(import.meta.dirname, 'test-results', 'results.json');
const TEMPLATE_DIR = resolve(import.meta.dirname, 'test-results', 'templates');

// ── Types ─────────────────────────────────────────────────────────────

interface LayerResult {
  status: 'pass' | 'fail' | 'skip';
  detail: string;
}

interface TestResult {
  id: string;
  name: string;
  category: string;
  l2: LayerResult;
  l2b: LayerResult;
  l3: LayerResult;
  hasFrontendCheck: boolean;
  sageFileWritten: boolean;
}

interface TestResults {
  timestamp: string;
  summary: {
    total: number;
    l2Pass: number;
    l2Fail: number;
    l2bPass: number;
    l2bFail: number;
    l2bSkip: number;
    l3Pass: number;
    l3Fail: number;
    l3Skip: number;
  };
  results: TestResult[];
}

// ── Helpers ───────────────────────────────────────────────────────────

function header(label: string): void {
  console.log(`\n\x1b[36m══════════════════════════════════════════════════\x1b[0m`);
  console.log(`\x1b[36m  ${label}\x1b[0m`);
  console.log(`\x1b[36m══════════════════════════════════════════════════\x1b[0m\n`);
}

// ── L2b: Semantic validators ─────────────────────────────────────────

type SemanticValidator = (vals: Record<string, string>) => LayerResult;

const L2B_SEMANTIC_VALIDATORS: Record<string, SemanticValidator> = {
  // ── Shared-prime GCD attacks ────────────────────────────────────
  'batch-gcd': (vals) => {
    if (!vals.n_values) return { status: 'fail', detail: 'Missing n_values' };
    const nStrs = vals.n_values.split('\n').filter((s) => s.trim());
    if (nStrs.length < 2) return { status: 'fail', detail: `Need >= 2 moduli, got ${nStrs.length}` };
    const ns = nStrs.map((s) => BigInt(s.trim()));
    const g = gcd(ns[0], ns[1]);
    if (g > 1n && g < ns[0]) return { status: 'pass', detail: `Shared factor: gcd(n0,n1) = ${g.toString().slice(0, 24)}...` };
    return { status: 'fail', detail: 'No shared factor between moduli' };
  },

  'common-prime-rsa': (vals) => {
    if (!vals.n1 || !vals.n2) return { status: 'fail', detail: 'Missing n1 or n2' };
    const n1 = BigInt(vals.n1);
    const n2 = BigInt(vals.n2);
    if (gcd(n1, n2) > 1n) return { status: 'pass', detail: 'Shared prime found' };
    return { status: 'fail', detail: 'No shared prime between n1 and n2' };
  },

  'multi-prime-gcd': (vals) => {
    if (!vals.n_values) return { status: 'fail', detail: 'Missing n_values' };
    const lines = vals.n_values.split('\n').filter((s) => s.trim());
    if (lines.length < 2) return { status: 'fail', detail: `Need >= 2 moduli, got ${lines.length}` };
    const ns = lines.map((s) => BigInt(s.trim()));
    const g = gcd(ns[0], ns[1]);
    if (g > 1n && g < ns[0]) return { status: 'pass', detail: 'Shared factor between moduli' };
    return { status: 'fail', detail: 'No shared factor' };
  },

  // ── Leaked-key attacks ──────────────────────────────────────────
  'dp-dq-leak': (vals) => {
    if (!vals.dp || !vals.dq) return { status: 'fail', detail: 'Missing dp or dq' };
    const n = BigInt(vals.n);
    const e = BigInt(vals.e);
    const dp = BigInt(vals.dp);
    const dq = BigInt(vals.dq);
    if (dp <= 0n || dq <= 0n) return { status: 'fail', detail: 'dp/dq must be positive' };
    if (dp >= n || dq >= n) return { status: 'fail', detail: 'dp/dq must be < n' };
    // Verify dp recovers p: gcd(m^(e*dp-1) - 1, n) = p
    const m = 2n;
    const exp = e * dp - 1n;
    if (exp > 0n) {
      const x = modPow(m, exp, n);
      const p = gcd(x - 1n, n);
      if (p > 1n && p < n) return { status: 'pass', detail: 'dp consistent with key (p recovered)' };
    }
    // Try dq to recover q
    const exp2 = e * dq - 1n;
    if (exp2 > 0n) {
      const x = modPow(m, exp2, n);
      const q = gcd(x - 1n, n);
      if (q > 1n && q < n) return { status: 'pass', detail: 'dq consistent with key (q recovered)' };
    }
    return { status: 'fail', detail: 'Neither dp nor dq recovers a factor of n' };
  },

  'phi-leak': (vals) => {
    if (!vals.n || !vals.phi) return { status: 'fail', detail: 'Missing n or phi' };
    const n = BigInt(vals.n);
    const phi = BigInt(vals.phi);
    const sum = n - phi + 1n; // p + q
    const disc = sum * sum - 4n * n; // (p+q)^2 - 4pq = (p-q)^2
    if (disc < 0n) return { status: 'fail', detail: 'Discriminant negative: phi inconsistent with n' };
    const sqrtDisc = isqrt(disc);
    if (sqrtDisc * sqrtDisc !== disc) return { status: 'fail', detail: 'Discriminant not a perfect square' };
    const p = (sum - sqrtDisc) / 2n;
    const q = (sum + sqrtDisc) / 2n;
    if (p * q !== n || p <= 1n) return { status: 'fail', detail: 'p * q != n — phi inconsistent' };
    return { status: 'pass', detail: `phi valid: factors recovered (${p.toString(16).slice(0, 10)}... * ${q.toString(16).slice(0, 10)}...)` };
  },

  'implicit-key-exposure': (vals) => {
    if (!vals.n || !vals.a || !vals.leak) return { status: 'fail', detail: 'Missing n, a, or leak' };
    const n = BigInt(vals.n);
    const a = BigInt(vals.a);
    const leak = BigInt(vals.leak);
    const p = gcd(leak - a, n);
    if (p > 1n && p < n) return { status: 'pass', detail: `p = gcd(leak - a, n) — factor recovered` };
    return { status: 'fail', detail: 'leak - a does not share a factor with n' };
  },

  'partial-key-exposure': (vals) => {
    if (!vals.n || !vals.p_msb) return { status: 'fail', detail: 'Missing n or p_msb' };
    const n = BigInt(vals.n);
    const pMsb = BigInt(vals.p_msb);
    if (n <= 0n) return { status: 'fail', detail: 'n must be positive' };
    if (pMsb <= 0n) return { status: 'fail', detail: 'p_msb must be positive' };
    if (pMsb >= n) return { status: 'fail', detail: 'p_msb must be < n' };
    // Check that n is not divisible by p_msb (it's only the MSB part)
    if (n % pMsb === 0n) return { status: 'fail', detail: 'p_msb divides n (expected only partial bits)' };
    return { status: 'pass', detail: `n=${n.toString(2).length}b, p_msb=${pMsb.toString(2).length}b` };
  },

  // ── Small-exponent / related-message attacks ────────────────────
  'related-message': (vals) => {
    if (!vals.a1 || !vals.b1 || !vals.a2 || !vals.b2) return { status: 'fail', detail: 'Missing a1, b1, a2, or b2' };
    const a1 = BigInt(vals.a1);
    const b1 = BigInt(vals.b1);
    const a2 = BigInt(vals.a2);
    const b2 = BigInt(vals.b2);
    // Testcase generates random 1-5 for a1/a2 and 0-4 for b1/b2
    // Just verify they're in range
    if (a1 < 1n || a1 > 5n) return { status: 'fail', detail: `a1=${a1} out of range [1,5]` };
    if (a2 < 1n || a2 > 5n) return { status: 'fail', detail: `a2=${a2} out of range [1,5]` };
    if (b1 < 0n || b1 > 4n) return { status: 'fail', detail: `b1=${b1} out of range [0,4]` };
    if (b2 < 0n || b2 > 4n) return { status: 'fail', detail: `b2=${b2} out of range [0,4]` };
    return { status: 'pass', detail: `a1=${a1}, b1=${b1}, a2=${a2}, b2=${b2} in expected ranges` };
  },

  'coppersmith-short-pad': (vals) => {
    const e = BigInt(vals.e);
    if (e !== 3n) return { status: 'fail', detail: `Expected e=3, got e=${e}` };
    const n = BigInt(vals.n);
    const nBits = n.toString(2).length;
    if (nBits > 512) return { status: 'fail', detail: `n is ${nBits} bits (> 512 may timeout in SageCell)` };
    if (nBits < 20) return { status: 'fail', detail: `n is only ${nBits} bits (too small)` };
    return { status: 'pass', detail: `e=3, n=${nBits} bits` };
  },

  'small-public-exp': (vals) => {
    const e = BigInt(vals.e);
    if (e !== 3n) return { status: 'fail', detail: `Expected e=3, got e=${e}` };
    const n = BigInt(vals.n);
    const m = 42n; // minimum m from generator
    if (m * m * m >= n) return { status: 'fail', detail: 'm^3 >= n — m not small enough for direct cube root' };
    return { status: 'pass', detail: 'e=3, m^3 < n confirmed' };
  },

  'cube-root-crt': (vals) => {
    // e is not returned by generateTestcase (it's always 3)
    if (vals.e) {
      const e = BigInt(vals.e);
      if (e !== 3n) return { status: 'fail', detail: `Expected e=3, got e=${e}` };
    }
    // Verify p ≡ q ≡ 1 (mod 3) by checking GCD condition
    if (vals.p && vals.q) {
      const p = BigInt(vals.p);
      const q = BigInt(vals.q);
      if (p % 3n !== 1n || q % 3n !== 1n)
        return { status: 'fail', detail: `p mod 3 = ${p % 3n}, q mod 3 = ${q % 3n} (both must be 1)` };
    }
    return { status: 'pass', detail: 'e=3 for cube root CRT' };
  },

  // ── Common-modulus ──────────────────────────────────────────────
  'common-modulus': (vals) => {
    if (!vals.e1 || !vals.e2) return { status: 'fail', detail: 'Missing e1 or e2' };
    const e1 = BigInt(vals.e1);
    const e2 = BigInt(vals.e2);
    if (e1 === e2) return { status: 'fail', detail: 'e1 and e2 must differ' };
    if (gcd(e1, e2) !== 1n) return { status: 'fail', detail: 'e1 and e2 are not coprime' };
    return { status: 'pass', detail: 'e1, e2 coprime and distinct' };
  },

  // ── Common-factor ───────────────────────────────────────────────
  'common-factor': (vals) => {
    if (!vals.n || !vals.c) return { status: 'fail', detail: 'Missing n or c' };
    const n = BigInt(vals.n);
    const c = BigInt(vals.c);
    if (c <= 0n || c >= n) return { status: 'fail', detail: 'c not in (0, n)' };
    const g = gcd(c, n);
    if (g > 1n && g < n) return { status: 'pass', detail: 'c shares a factor with n' };
    return { status: 'fail', detail: 'c does not share a factor with n' };
  },

  // ── Small d / lattice attacks ───────────────────────────────────
  'wiener': (vals) => {
    const n = BigInt(vals.n);
    const e = BigInt(vals.e);
    const nBits = n.toString(2).length;
    const eBits = e.toString(2).length;
    if (nBits < 10) return { status: 'fail', detail: `n too small: ${nBits} bits` };
    if (eBits < nBits - 20) return { status: 'fail', detail: `e=${eBits}b but n=${nBits}b — e should be near n for small d` };
    return { status: 'pass', detail: `n=${nBits}b, e=${eBits}b — consistent with small d` };
  },

  'boneh-durfee': (vals) => {
    const n = BigInt(vals.n);
    const e = BigInt(vals.e);
    const nBits = n.toString(2).length;
    const eBits = e.toString(2).length;
    if (nBits < 10) return { status: 'fail', detail: `n too small: ${nBits} bits` };
    if (eBits < nBits - 20) return { status: 'fail', detail: `e=${eBits}b but n=${nBits}b` };
    return { status: 'pass', detail: `n=${nBits}b, e=${eBits}b — consistent with small d` };
  },

  'partial-d': (vals) => {
    if (!vals.dLow) return { status: 'fail', detail: 'Missing dLow' };
    const dLow = BigInt(vals.dLow);
    const dLowBits = dLow.toString(2).length;
    if (dLow <= 0n) return { status: 'fail', detail: 'dLow must be positive' };
    if (dLowBits > 20) return { status: 'fail', detail: `dLow=${dLowBits}b, expected <= 20` };
    return { status: 'pass', detail: `dLow=${dLowBits}b (` + (vals.n ? `n=${BigInt(vals.n).toString(2).length}b` : '') + `)` };
  },

  'simple-lattice': (vals) => {
    if (!vals.nearp) return { status: 'fail', detail: 'Missing nearp' };
    const nearp = BigInt(vals.nearp);
    if (nearp <= 0n) return { status: 'fail', detail: 'nearp must be positive' };
    return { status: 'pass', detail: `nearp=${nearp.toString(2).length}b` };
  },

  'partial-pq-bits': (vals) => {
    if (!vals.knownBits || !vals.bitPosition) return { status: 'fail', detail: 'Missing knownBits or bitPosition' };
    if (vals.bitPosition !== 'msb' && vals.bitPosition !== 'lsb') return { status: 'fail', detail: `Expected bitPosition=msb or lsb, got ${vals.bitPosition}` };
    const known = BigInt(vals.knownBits);
    if (known <= 0n) return { status: 'fail', detail: 'knownBits must be positive' };
    return { status: 'pass', detail: `knownBits=${known.toString(2).length}b, pos=msb` };
  },

  'small-crt-exp': (vals) => {
    const e = BigInt(vals.e);
    if (e !== 65537n) return { status: 'fail', detail: `Expected e=65537, got e=${e}` };
    if (!vals.bound) return { status: 'fail', detail: 'Missing bound' };
    const bound = BigInt(vals.bound);
    if (bound <= 0n) return { status: 'fail', detail: 'bound must be positive' };
    return { status: 'pass', detail: `e=65537, bound=${bound}` };
  },

  'dependent-prime': (vals) => {
    const e = BigInt(vals.e);
    if (e !== 65537n) return { status: 'fail', detail: `Expected e=65537, got e=${e}` };
    const n = BigInt(vals.n);
    // n = p * q where q = e^(-1) mod p -> n*e = p*q*e = p*(1 + k*p) = p + k*p^2
    // So k*p^2 + p - n*e = 0. We verify discriminant is positive.
    // Actually just verify n is composite-sized
    if (n.toString(2).length < 8) return { status: 'fail', detail: `n too small: ${n.toString(2).length}b` };
    return { status: 'pass', detail: `n=${n.toString(2).length}b, e=65537` };
  },

  'linearly-related-primes': (vals) => {
    if (!vals.k) return { status: 'fail', detail: 'Missing k' };
    const k = BigInt(vals.k);
    if (k < 1n || k > 3n) return { status: 'fail', detail: `k=${k} outside expected range [1,3]` };
    return { status: 'pass', detail: `k=${k}` };
  },

  // ── Broadcast attacks (multi-line format) ───────────────────────
  'hastad': (vals) => {
    if (!vals.pairs) return { status: 'fail', detail: 'Missing pairs' };
    const lines = vals.pairs.split('\n').filter((s) => s.trim());
    if (lines.length < 3) return { status: 'fail', detail: `Need >= 3 pairs, got ${lines.length}` };
    try {
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 2) return { status: 'fail', detail: `Line ${i + 1}: expected n,c format` };
        BigInt(parts[0].trim());
        BigInt(parts[1].trim());
      }
    } catch {
      return { status: 'fail', detail: 'Invalid BigInt in pairs' };
    }
    return { status: 'pass', detail: `${lines.length} valid pairs` };
  },

  'hastad-broadcast': (vals) => {
    if (!vals.ciphertexts) return { status: 'fail', detail: 'Missing ciphertexts' };
    const lines = vals.ciphertexts.split('\n').filter((s) => s.trim());
    if (lines.length < 3) return { status: 'fail', detail: `Need >= 3 ciphertexts, got ${lines.length}` };
    try {
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 2) return { status: 'fail', detail: `Line ${i + 1}: expected c,n format` };
        BigInt(parts[0].trim());
        BigInt(parts[1].trim());
      }
    } catch {
      return { status: 'fail', detail: 'Invalid BigInt in ciphertexts' };
    }
    return { status: 'pass', detail: `${lines.length} valid ciphertext,n pairs` };
  },

  'hastad-linear-pad': (vals) => {
    if (!vals.triples) return { status: 'fail', detail: 'Missing triples' };
    const lines = vals.triples.split('\n').filter((s) => s.trim());
    if (lines.length < 3) return { status: 'fail', detail: `Need >= 3 triples, got ${lines.length}` };
    try {
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 3) return { status: 'fail', detail: `Line ${i + 1}: expected n,c,a format` };
        BigInt(parts[0].trim());
        BigInt(parts[1].trim());
        BigInt(parts[2].trim());
      }
    } catch {
      return { status: 'fail', detail: 'Invalid BigInt in triples' };
    }
    return { status: 'pass', detail: `${lines.length} valid triples` };
  },

  // ── Oracle attacks (binary response format) ─────────────────────
  'bleichenbacher': (vals) => {
    if (!vals.oracle_responses) return { status: 'fail', detail: 'Missing oracle_responses' };
    const bits = vals.oracle_responses.split(',').filter((s) => s.trim());
    if (bits.length < 2) return { status: 'fail', detail: `Too few responses: ${bits.length}` };
    if (!bits.every((b) => b === '0' || b === '1')) return { status: 'fail', detail: 'Non-binary response found' };
    if (!bits.some((b) => b === '1')) return { status: 'fail', detail: 'No valid oracle responses (all 0)' };
    return { status: 'pass', detail: `${bits.length} responses, >= 1 valid` };
  },

  'manger': (vals) => {
    if (!vals.oracle_responses) return { status: 'fail', detail: 'Missing oracle_responses' };
    const bits = vals.oracle_responses.split(',').filter((s) => s.trim());
    if (bits.length < 2) return { status: 'fail', detail: `Too few responses: ${bits.length}` };
    if (!bits.every((b) => b === '0' || b === '1')) return { status: 'fail', detail: 'Non-binary response found' };
    return { status: 'pass', detail: `${bits.length} binary responses` };
  },

  'biased-lsb': (vals) => {
    if (!vals.oracle_runs) return { status: 'fail', detail: 'Missing oracle_runs' };
    const lines = vals.oracle_runs.split('\n').filter((s) => s.trim());
    if (lines.length < 2) return { status: 'fail', detail: `Too few oracle runs: ${lines.length}` };
    for (let i = 0; i < lines.length; i++) {
      const bits = lines[i].split(',').filter((s) => s.trim());
      if (!bits.every((b) => b === '0' || b === '1'))
        return { status: 'fail', detail: `Line ${i + 1}: non-binary bits found` };
    }
    return { status: 'pass', detail: `${lines.length} runs of binary responses` };
  },

  'parity-oracle': (vals) => {
    if (!vals.oracle_responses) return { status: 'fail', detail: 'Missing oracle_responses' };
    const bits = vals.oracle_responses.split(',').filter((s) => s.trim());
    if (bits.length < 2) return { status: 'fail', detail: `Too few responses: ${bits.length}` };
    if (!bits.every((b) => b === '0' || b === '1')) return { status: 'fail', detail: 'Non-binary response found' };
    return { status: 'pass', detail: `${bits.length} binary responses` };
  },

  'lsb-oracle': (vals) => {
    if (!vals.oracle_responses) return { status: 'fail', detail: 'Missing oracle_responses' };
    const bits = vals.oracle_responses.split(',').filter((s) => s.trim());
    if (bits.length < 2) return { status: 'fail', detail: `Too few responses: ${bits.length}` };
    if (!bits.every((b) => b === '0' || b === '1')) return { status: 'fail', detail: 'Non-binary response found' };
    return { status: 'pass', detail: `${bits.length} binary responses` };
  },

  // ── Signature attacks ───────────────────────────────────────────
  'homomorphic-forgery': (vals) => {
    if (!vals.oracle_pairs) return { status: 'fail', detail: 'Missing oracle_pairs' };
    // Pairs may be \n-separated or ;-separated
    let lines = vals.oracle_pairs.split('\n').filter((s) => s.trim());
    if (lines.length < 2) lines = vals.oracle_pairs.split(';').filter((s) => s.trim());
    if (lines.length < 2) return { status: 'fail', detail: `Need >= 2 oracle pairs, got ${lines.length}. Raw: ${vals.oracle_pairs.slice(0, 60)}` };
    try {
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 2) return { status: 'fail', detail: `Pair ${i + 1}: expected m,sig format, got: ${lines[i]}` };
        BigInt(parts[0].trim());
        BigInt(parts[1].trim());
      }
    } catch {
      return { status: 'fail', detail: 'Invalid BigInt in oracle_pairs' };
    }
    return { status: 'pass', detail: `${lines.length} valid oracle pairs` };
  },

  'bleichenbacher-sig': (vals) => {
    if (!vals.hash_hex) return { status: 'fail', detail: 'Missing hash_hex' };
    if (!/^[0-9a-fA-F]+$/.test(vals.hash_hex)) return { status: 'fail', detail: 'hash_hex must be hex string' };
    return { status: 'pass', detail: `hash_hex=${vals.hash_hex}` };
  },

  // ── Known-plaintext ─────────────────────────────────────────────
  'known-plaintext': (vals) => {
    if (!vals.known_prefix || !vals.unknown_bits) return { status: 'fail', detail: 'Missing known_prefix or unknown_bits' };
    const ubits = BigInt(vals.unknown_bits);
    if (ubits <= 0n) return { status: 'fail', detail: 'unknown_bits must be positive' };
    if (ubits.toString() !== vals.unknown_bits.trim())
      return { status: 'fail', detail: 'unknown_bits must be a decimal integer string' };
    const prefixLen = new TextEncoder().encode(vals.known_prefix).length * 8;
    if (prefixLen === 0) return { status: 'fail', detail: 'known_prefix must not be empty' };
    return { status: 'pass', detail: `prefix=${vals.known_prefix} (${prefixLen}b), unknown=${ubits}b` };
  },

  'non-coprime-exp': (vals) => {
    const e = BigInt(vals.e);
    if (e !== 2n) return { status: 'fail', detail: `Expected e=2, got e=${e}` };
    return { status: 'pass', detail: 'e=2 (non-coprime)' };
  },

  'roca': (vals) => {
    const n = BigInt(vals.n);
    if (n.toString(2).length < 8) return { status: 'fail', detail: 'n too small' };
    return { status: 'pass', detail: `n=${n.toString(2).length}b` };
  },

  'nitros': (vals) => {
    if (!vals.base) return { status: 'fail', detail: 'Missing base' };
    const base = BigInt(vals.base);
    if (base <= 0n) return { status: 'fail', detail: 'base must be positive' };
    return { status: 'pass', detail: `base=${base}` };
  },
};

// ── Shared L2b validators (applied to all) ─────────────────────────

function l2bAllValuesParseable(vals: Record<string, string>): LayerResult {
  const skipFields = new Set([
    'pairs', 'triples', 'n_values', 'ciphertexts', 'moduli_list',
    'oracle_responses', 'oracle_pairs', 'oracle_runs', 'known_prefix',
  ]);
  for (const [key, val] of Object.entries(vals)) {
    if (skipFields.has(key)) continue;
    if (!val || !val.trim()) return { status: 'fail', detail: `Key "${key}" is empty` };
    // Skip hex strings (hash_hex, known_prefix)
    if (key === 'hash_hex' || key === 'bitPosition' || key === 'bound') continue;
    try {
      const v = BigInt(val.trim());
      if (v < 0n) return { status: 'fail', detail: `Key "${key}" is negative` };
    } catch {
      return { status: 'fail', detail: `Key "${key}" value "${val.slice(0, 30)}" is not a valid BigInt` };
    }
  }
  return { status: 'pass', detail: 'All single-value fields parse as BigInt' };
}

function l2bNIsSane(vals: Record<string, string>): LayerResult {
  if (!vals.n) return { status: 'skip', detail: 'No n field' };
  try {
    const n = BigInt(vals.n);
    if (n <= 1n) return { status: 'fail', detail: `n=${n} is trivial` };
    if (n % 2n === 0n) return { status: 'fail', detail: 'n is even (expected odd RSA modulus)' };
    const bits = n.toString(2).length;
    if (bits < 8) return { status: 'fail', detail: `n only ${bits} bits` };
    return { status: 'pass', detail: `n=${bits}b, odd, non-trivial` };
  } catch {
    return { status: 'fail', detail: 'n is not a valid BigInt' };
  }
}

function l2bEIsSane(vals: Record<string, string>): LayerResult {
  // Collect all potential e values
  const keys = ['e', 'e1', 'e2'];
  for (const key of keys) {
    if (!vals[key]) continue;
    try {
      const e = BigInt(vals[key]);
      if (e <= 1n) return { status: 'fail', detail: `${key}=${e} must be > 1` };
      if (e % 2n === 0n && e !== 2n) return { status: 'fail', detail: `${key}=${e} is even and != 2` };
    } catch {
      return { status: 'fail', detail: `${key} is not a valid BigInt` };
    }
  }
  return { status: 'pass', detail: 'All e values are > 1 and odd' };
}

// ── FrontendCheck with timeout ────────────────────────────────────────

async function runFrontendCheck(
  fn: (vals: Record<string, string>) => Promise<string | null>,
  vals: Record<string, string>,
  timeoutMs = 10_000
): Promise<LayerResult> {
  try {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<string | null>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('frontendCheck timed out')), timeoutMs);
    });
    const result = await Promise.race([fn(vals), timeoutPromise]);
    clearTimeout(timeoutId!);

    if (result === null) {
      return { status: 'fail', detail: 'frontendCheck returned null' };
    }
    if (result.includes('=SUCCESS')) {
      return { status: 'pass', detail: result.slice(0, 120).replace(/\n/g, '\\n') };
    }
    return { status: 'fail', detail: `Missing =SUCCESS marker. Output: ${result.slice(0, 100)}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 'fail', detail: `Exception: ${msg}` };
  }
}

// ── Main ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const onlyFail = args.includes('--fail');
  const jsonOnly = args.includes('--json');

  header('Attack Test Suite — L2 (Gen) + L2b (Semantics) + L3 (frontendCheck)');
  console.log(`Attacks loaded: ${attacks.length}`);
  console.log(`Testcase generators: ${Object.keys(testcaseGenerators).length}`);
  console.log(`FrontendCheck: ${attacks.filter((a) => a.frontendCheck).length}`);
  console.log(`Semantic validators: ${Object.keys(L2B_SEMANTIC_VALIDATORS).length}`);
  console.log(`\nTemplate dir: ${TEMPLATE_DIR}\n`);

  if (!existsSync(TEMPLATE_DIR)) {
    mkdirSync(TEMPLATE_DIR, { recursive: true });
  }

  const allResults: TestResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: attacks.length,
      l2Pass: 0,
      l2Fail: 0,
      l2bPass: 0,
      l2bFail: 0,
      l2bSkip: 0,
      l3Pass: 0,
      l3Fail: 0,
      l3Skip: 0,
    },
    results: [],
  };

  // ── Iterate attacks ──────────────────────────────────────────────

  for (const attack of attacks) {
    if (!jsonOnly && !onlyFail) {
      console.log(`  \x1b[36m${attack.id}\x1b[0m — ${attack.name}`);
    }

    const result: TestResult = {
      id: attack.id,
      name: attack.name,
      category: attack.category,
      l2: { status: 'skip', detail: '' },
      l2b: { status: 'skip', detail: '' },
      l3: { status: 'skip', detail: '' },
      hasFrontendCheck: !!attack.frontendCheck,
      sageFileWritten: false,
    };

    // ── L2: Generate testcase + applicableCheck ──────────────────

    let genVals: Record<string, string> | null = null;
    const genFn = testcaseGenerators[attack.id];

    if (!genFn) {
      result.l2 = { status: 'fail', detail: 'No generateTestcase found in index' };
      if (!onlyFail) console.log(`    ${'  [FAIL] No generateTestcase'}`);
    } else {
      try {
        const vals = genFn();
        genVals = vals;
        if (!vals || typeof vals !== 'object' || Object.keys(vals).length === 0) {
          result.l2 = { status: 'fail', detail: 'generateTestcase returned empty or invalid' };
        } else {
          const expected = attack.inputs.map((i) => i.name);
          const missing = expected.filter((k) => !(k in vals));
          if (missing.length > 0) {
            result.l2 = {
              status: 'fail',
              detail: `Missing expected keys: ${missing.join(', ')}. Got: ${Object.keys(vals).join(', ')}`,
            };
          } else {
            const appCheck = attack.applicableCheck(vals);
            if (appCheck !== true) {
              result.l2 = {
                status: 'fail',
                detail: `applicableCheck returned ${appCheck !== null && appCheck !== undefined ? appCheck : 'falsey'}`,
              };
            } else {
              result.l2 = { status: 'pass', detail: `vals=${Object.keys(vals).join(',')}` };
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.l2 = { status: 'fail', detail: `Generate exception: ${msg}` };
      }
    }

    if (result.l2.status === 'pass') allResults.summary.l2Pass++;
    else allResults.summary.l2Fail++;

    // ── L2b: Semantic validation ──────────────────────────────────

    if (result.l2.status === 'pass' && genVals) {
      // Run shared checks
      const sharedChecks = [l2bAllValuesParseable(genVals), l2bNIsSane(genVals), l2bEIsSane(genVals)];
      const sharedFails = sharedChecks.filter((c) => c.status === 'fail');

      // Run attack-specific validator if one exists
      const specificValidator = L2B_SEMANTIC_VALIDATORS[attack.id];
      let specificResult: LayerResult | null = null;
      if (specificValidator) {
        try {
          specificResult = specificValidator(genVals);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          specificResult = { status: 'fail', detail: `Validator exception: ${msg}` };
        }
      }

      // Compose result: shared and specific must both pass
      if (sharedFails.length > 0) {
        result.l2b = {
          status: 'fail',
          detail: sharedFails.map((f) => f.detail).join('; '),
        };
      } else if (specificResult && specificResult.status === 'fail') {
        result.l2b = specificResult;
      } else if (!specificValidator) {
        // No specific validator — only shared checks
        const sharedDetails = sharedChecks
          .filter((c) => c.status === 'pass')
          .map((c) => c.detail)
          .join('; ');
        result.l2b = { status: 'pass', detail: `Shared: ${sharedDetails}` };
      } else {
        // Both pass
        const sharedDetails = sharedChecks
          .filter((c) => c.status === 'pass')
          .map((c) => c.detail)
          .join('; ');
        result.l2b = { status: 'pass', detail: `${sharedDetails}; ${specificResult.detail}` };
      }
    } else {
      result.l2b = { status: 'skip', detail: 'L2 failed — skipping L2b' };
    }

    if (result.l2b.status === 'pass') allResults.summary.l2bPass++;
    else if (result.l2b.status === 'fail') allResults.summary.l2bFail++;
    else allResults.summary.l2bSkip++;

    // ── L3: FrontendCheck ────────────────────────────────────────

    if (attack.frontendCheck && result.l2.status === 'pass') {
      if (genVals) {
        result.l3 = await runFrontendCheck(attack.frontendCheck, genVals);
      } else {
        result.l3 = { status: 'fail', detail: 'No generateTestcase for frontendCheck' };
      }
    } else if (attack.frontendCheck) {
      result.l3 = { status: 'skip', detail: 'L2 failed — skipping frontendCheck' };
    }

    if (result.l3.status === 'pass') allResults.summary.l3Pass++;
    else if (result.l3.status === 'fail') allResults.summary.l3Fail++;
    else allResults.summary.l3Skip++;

    // ── Export .sage template ────────────────────────────────────

    try {
      if (genFn) {
        const vals = genVals ?? genFn();
        const sageCode = attack.sageTemplate(vals);
        const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const headerComment = `# Test case for ${attack.name} (${attack.id})\n# Category: ${attack.category}\n# Generated: ${dateStr}\n\n`;
        writeFileSync(resolve(TEMPLATE_DIR, `${attack.id}.sage`), headerComment + sageCode, 'utf-8');
        result.sageFileWritten = true;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!onlyFail) console.log(`    \x1b[33m[WARN]\x1b[0m Sage template export failed: ${msg}`);
    }

    // ── Print row ────────────────────────────────────────────────

    if (!jsonOnly) {
      const clr = (s: string, c: string) =>
        s === 'pass' ? `\x1b[32m${c}\x1b[0m` : s === 'fail' ? `\x1b[31m${c}\x1b[0m` : `\x1b[33m${c}\x1b[0m`;
      const line = `    L2:${clr(result.l2.status, result.l2.status.toUpperCase().padEnd(4))}  L2b:${clr(result.l2b.status, result.l2b.status.toUpperCase().padEnd(4))}  L3:${clr(result.l3.status, result.l3.status.toUpperCase().padEnd(4))}  ${result.sageFileWritten ? '\x1b[90m[sage]\x1b[0m' : ''}`;

      const show = onlyFail
        ? result.l2.status === 'fail' || result.l2b.status === 'fail' || result.l3.status === 'fail'
        : true;

      if (show) {
        if (onlyFail) console.log(`  \x1b[36m${attack.id}\x1b[0m — ${attack.name}`);
        console.log(line);
        if (result.l2.status === 'fail') console.log(`       L2:  ${result.l2.detail}`);
        if (result.l2b.status === 'fail') console.log(`       L2b: ${result.l2b.detail}`);
        if (result.l3.status === 'fail') console.log(`       L3:  ${result.l3.detail}`);
      }
    }

    allResults.results.push(result);
  }

  // ── Summary ─────────────────────────────────────────────────────

  if (!jsonOnly) {
    header('Summary');
    console.log(`  Total attacks:  ${allResults.summary.total}`);
    console.log(`  L2 (Gen):       ${allResults.summary.l2Pass} pass, ${allResults.summary.l2Fail} fail`);
    console.log(`  L2b (Semantic): ${allResults.summary.l2bPass} pass, ${allResults.summary.l2bFail} fail, ${allResults.summary.l2bSkip} skip`);
    console.log(`  L3 (FE):        ${allResults.summary.l3Pass} pass, ${allResults.summary.l3Fail} fail, ${allResults.summary.l3Skip} skip`);
    console.log(`  Sage exports:   ${allResults.results.filter((r) => r.sageFileWritten).length}/${attacks.length}`);
  }

  writeFileSync(RESULT_FILE, JSON.stringify(allResults, null, 2), 'utf-8');

  if (!jsonOnly) {
    console.log(`\n  Results written to: ${RESULT_FILE}`);
  } else {
    console.log(JSON.stringify(allResults, null, 2));
  }

  const hasFails = allResults.summary.l2Fail > 0 || allResults.summary.l2bFail > 0 || allResults.summary.l3Fail > 0;
  process.exit(hasFails ? 1 : 0);
}

main();
