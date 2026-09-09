import { modPow, modInverse, isqrt } from './bigint';
import { parseHex } from './bigint';

/** Trial-division smoothness bound used by the in-browser DH attacks. */
export const SMOOTH_BOUND = 100_000;

/**
 * Upper bound on BSGS baby steps. Orders with ceil(sqrt(r)) above this
 * return null instead of hanging/OOMing the tab (route those to Sage).
 */
export const BSGS_ITERATION_BUDGET = 200_000n;

/* ───────── RFC 3526 MODP Groups ───────── */

export interface RFCGroupEntry {
  name: string;
  p: bigint;
  g: bigint;
}

export const RFC3526_GROUPS: RFCGroupEntry[] = [
  {
    name: 'Group 5 (1536-bit)',
    p: 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFFFFn,
    g: 2n,
  },
  {
    name: 'Group 14 (2048-bit)',
    p: 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFFn,
    g: 2n,
  },
  {
    name: 'Group 16 (4096-bit)',
    p: 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFFn,
    g: 2n,
  },
];

/* ───────── RFC 2412 Group 1 (Oakley, 768-bit) ─────────
 * BREAKABLE — demo only. 768-bit MODP is far below the NIST 112-bit
 * security floor (2048-bit minimum, SP 800-57). Included so the
 * Logjam/export-downgrade entry can show a concrete breakable group.
 * This is the correct 768-bit prime (192 hex digits), NOT a 512-bit group.
 */
export const RFC2412_GROUP1: RFCGroupEntry = {
  name: 'Group 1 (768-bit, BREAKABLE — demo only)',
  p: 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A63A3620FFFFFFFFFFFFFFFFn,
  g: 2n,
};

/** Trial division factorisation returning small prime factors (up to limit). */
export function factorSmall(n: bigint, limit: number): bigint[] {
  return factorTrial(n, limit).factored.map(f => f.prime);
}

export interface TrialFactor {
  prime: bigint;
  exp: number;
}

export interface TrialFactorisation {
  /** Prime powers confirmed by trial division up to the bound. */
  factored: TrialFactor[];
  /**
   * Unfactored remainder. When > 1, p-1 is NOT smooth up to the bound:
   * never treat it as prime without a Miller-Rabin check — route to Sage.
   */
  remainder: bigint;
}

/**
 * Trial division that keeps the unfactored remainder separate instead of
 * misreporting it as a prime factor. Handles 0/1 without hanging.
 */
export function factorTrial(n: bigint, limit: number): TrialFactorisation {
  if (n <= 1n) return { factored: [], remainder: n };
  const factored: TrialFactor[] = [];
  let m = n;
  // Handle factor 2 separately, then iterate odd candidates only.
  if (m % 2n === 0n) {
    let exp = 0;
    while (m % 2n === 0n) {
      m /= 2n;
      exp++;
    }
    factored.push({ prime: 2n, exp });
  }
  for (let p = 3; p <= limit && m > 1n; p += 2) {
    const bp = BigInt(p);
    if (bp * bp > m) break;
    if (m % bp === 0n) {
      let exp = 0;
      while (m % bp === 0n) {
        m /= bp;
        exp++;
      }
      factored.push({ prime: bp, exp });
    }
  }
  return { factored, remainder: m };
}

/**
 * Factor n by trial division, returning { prime, exponent } pairs.
 *
 * LEGACY contract (kept for eccCurves.ts): a remainder > 1 that survives
 * trial division is appended as { prime: remainder, exp: 1 } WITHOUT a
 * primality check. That is exact for ECC's enumerated toy-curve orders
 * (≈1e5, where any surviving remainder is provably prime) but it is NOT
 * safe for DH-size p-1, where the remainder can be composite. DH paths
 * MUST use factorTrial (separate remainder + Miller-Rabin) instead.
 */
export function factorPowers(n: bigint, limit: number): { prime: bigint; exp: number }[] {
  const { factored, remainder } = factorTrial(n, limit);
  if (remainder > 1n) factored.push({ prime: remainder, exp: 1 });
  return factored;
}

/**
 * Baby-step Giant-step for a subgroup of prime order r.
 * Uses integer isqrt (exact for r > 2^53, where float sqrt loses precision).
 * Returns null for r <= 0 and when ceil(sqrt(r)) exceeds
 * BSGS_ITERATION_BUDGET — callers surface that as "route to Sage".
 */
export function bsgsSubgroup(g: bigint, y: bigint, p: bigint, r: bigint): bigint | null {
  if (r <= 0n) return null;
  const sqrtR = isqrt(r) + 1n;
  if (sqrtR > BSGS_ITERATION_BUDGET) return null;
  const baby: Map<string, bigint> = new Map();
  let cur = 1n;
  for (let j = 0n; j < sqrtR; j++) {
    if (!baby.has(cur.toString())) baby.set(cur.toString(), j);
    cur = (cur * g) % p;
  }
  const inv = modInverse(modPow(g, sqrtR, p), p);
  if (inv === null) return null;
  let gamma = ((y % p) + p) % p;
  for (let i = 0n; i < sqrtR; i++) {
    const key = gamma.toString();
    if (baby.has(key)) {
      const x = i * sqrtR + baby.get(key)!;
      if (x < r) return x;
    }
    gamma = (gamma * inv) % p;
  }
  return null;
}

/**
 * Pohlig-Hellman digit lifting: recover x mod prime^exp given the projected
 * pair (gQ, yQ) = (g^((p-1)/q), y^((p-1)/q)) of order dividing q = prime^exp.
 * Each base-`prime` digit is solved with BSGS in the order-`prime` subgroup,
 * so cost is O(exp * sqrt(prime)) instead of O(sqrt(prime^exp)).
 * Returns null when gQ does not generate the full order-q subgroup or a
 * digit DLP fails.
 */
export function dlogPrimePower(
  gQ: bigint,
  yQ: bigint,
  p: bigint,
  prime: bigint,
  exp: number,
): bigint | null {
  if (exp < 1 || prime < 2n) return null;
  const q = prime ** BigInt(exp);
  const base = modPow(gQ, q / prime, p);
  if (base === 1n) return null;
  let prefix = 0n;
  let primePow = 1n;
  for (let k = 0; k < exp; k++) {
    const cofactor = q / (primePow * prime);
    const gPrefix = modPow(gQ, prefix, p);
    const inv = modInverse(gPrefix, p);
    if (inv === null) return null;
    const target = modPow(((yQ % p) * inv) % p, cofactor, p);
    const digit = bsgsSubgroup(base, target, p, prime);
    if (digit === null) return null;
    prefix += digit * primePow;
    primePow *= prime;
  }
  return prefix;
}

/**
 * Chinese Remainder Theorem: find x ≡ a_i (mod m_i) for pairwise coprime m_i.
 * Same convention as crtRSA: the result is normalised to [0, M) and
 * residue-verified against every input before returning.
 */
export function crt(remainders: bigint[], moduli: bigint[]): bigint | null {
  if (remainders.length === 0 || remainders.length !== moduli.length) return null;
  let M = 1n;
  for (const m of moduli) M *= m;
  let x = 0n;
  for (let i = 0; i < remainders.length; i++) {
    const Mi = M / moduli[i];
    const inv = modInverse(Mi % moduli[i], moduli[i]);
    if (inv === null) return null;
    x = (x + remainders[i] * Mi * inv) % M;
  }
  x = ((x % M) + M) % M;
  for (let i = 0; i < remainders.length; i++) {
    const want = ((remainders[i] % moduli[i]) + moduli[i]) % moduli[i];
    if (x % moduli[i] !== want) return null;
  }
  return x;
}

/**
 * Miller-Rabin primality test. Small factors are trial-divided first, then
 * the first 12 prime bases are used: deterministic for n < 2^64
 * (and < 3.3e23 unconditionally per Sorenson–Webster), probabilistic with
 * error ≤ 4^-12 above that. Used to honesty-check p and to label the
 * unfactored remainder of p-1 before anything treats it as prime.
 */
export function isProbablePrime(n: bigint, rounds = 12): boolean {
  if (n < 2n) return false;
  const small = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const p of small) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s++;
  }
  const bases = small.slice(0, rounds);
  for (const a of bases) {
    let x = modPow(a % n, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

/**
 * Parse a DH generator: decimal by default, with optional 0x hex accepted.
 * (p and y stay hex-only via parseHex; only g is decimal per the tab labels.)
 */
export function parseGenerator(s: string): bigint {
  const clean = s.trim().replace(/\s/g, '');
  if (!clean) return 0n;
  if (/^0x/i.test(clean)) return parseHex(clean);
  if (!/^[+-]?\d+$/.test(clean)) throw new Error(`Invalid generator g: "${s}" (expected decimal or 0x hex)`);
  return BigInt(clean);
}

/**
 * Peer-key validation for a received DH public value y mod p.
 * Returns a list of issues (empty = acceptable). Rejects the degenerate
 * values y = 1 (order 1) and y = p-1 (order ≤ 2), which pin or confine the
 * shared secret, plus any out-of-range input.
 */
export function peerKeyIssues(y: bigint, p: bigint): string[] {
  if (p <= 2n) return ['Invalid group modulus p (need an odd prime > 2)'];
  if (y <= 0n || y >= p) return [`Peer key y out of range: require 1 < y < p, got y = ${y}`];
  if (y === 1n) return ['Peer key y = 1 has order 1 (degenerate): reject — the shared secret would pin to 1'];
  if (y === p - 1n) return ['Peer key y = p-1 has order ≤ 2 (confined subgroup): reject as a peer key'];
  return [];
}

/**
 * Confirmation-oracle stub for the Lim–Lee simulation: models a peer that
 * reveals whether a guessed shared secret is correct (e.g. via a MAC
 * verify / key-confirmation message). The real attack needs this oracle
 * plus a static victim key; here it backs the in-browser transcript.
 */
export function confirmationOracleStub(serverSecret: bigint, guess: bigint): boolean {
  return serverSecret === guess;
}

export interface LimLeeResidue {
  prime: bigint;
  exp: number;
  order: bigint;
  residue: bigint;
}

export interface LimLeeResult {
  residues: LimLeeResidue[];
  /** x mod the smooth part of p-1, or null when a subgroup DLP failed. */
  combined: bigint | null;
  smoothModulus: bigint;
  remainder: bigint;
  transcript: string[];
}

/**
 * Lim–Lee style active recovery against a static private key xStatic.
 * For each prime power q = prime^exp dividing p-1 (up to `bound`), builds
 * the malicious generator g' = g^((p-1)/q), takes the server's secret
 * s = g'^x as the oracle target, and recovers x mod q with digit lifting.
 * Preconditions (also stated in the UI): static victim key, attacker-chosen
 * peer keys accepted without subgroup validation, and a confirmation oracle.
 */
export function limLeeRecover(p: bigint, g: bigint, xStatic: bigint, bound: number): LimLeeResult {
  const transcript: string[] = [];
  const pMinus1 = p - 1n;
  const { factored, remainder } = factorTrial(pMinus1, bound);
  transcript.push(`Lim–Lee simulation: static key held by victim, attacker sends chosen keys + confirmation oracle.`);
  transcript.push(`p-1 = ${pMinus1}`);
  const residues: LimLeeResidue[] = [];
  const moduli: bigint[] = [];
  for (const { prime, exp } of factored) {
    const order = prime ** BigInt(exp);
    const gPrime = modPow(g, pMinus1 / order, p);
    if (gPrime === 1n) {
      transcript.push(`  r=${prime}^${exp}: malicious g' = 1, skipping`);
      continue;
    }
    const serverSecret = modPow(gPrime, xStatic, p);
    const residue = dlogPrimePower(gPrime, serverSecret, p, prime, exp);
    if (residue === null) {
      transcript.push(`  r=${prime}^${exp}: subgroup DLP failed`);
      continue;
    }
    const confirmed = confirmationOracleStub(serverSecret, modPow(gPrime, residue, p));
    transcript.push(
      `  r=${prime}^${exp}: g' = g^((p-1)/${order}), oracle confirms s = g'^x; x ≡ ${residue} (mod ${order}) [oracle=${confirmed}]`,
    );
    residues.push({ prime, exp, order, residue });
    moduli.push(order);
  }
  const combined = residues.length > 0 ? crt(residues.map(r => r.residue), moduli) : null;
  const smoothModulus = moduli.reduce((a, b) => a * b, 1n);
  if (combined !== null) {
    const verify = modPow(g, combined, p);
    const target = modPow(g, ((xStatic % pMinus1) + pMinus1) % pMinus1, p);
    transcript.push(`CRT combine: x ≡ ${combined} (mod ${smoothModulus})`);
    transcript.push(`Matches static key mod smooth part: ${verify === target ? '✓ (full key when remainder = 1)' : '✗'}`);
  }
  if (remainder > 1n) {
    transcript.push(`Unfactored remainder ${remainder} — key known only mod ${smoothModulus}; needs Sage general-dlp.`);
  }
  return { residues, combined, smoothModulus, remainder, transcript };
}

/** Demo cap for Pollard kangaroo: intervals wider than 2^24 are refused. */
export const KANGAROO_RANGE_CAP = 1n << 24n;

/**
 * Pollard kangaroo (tame/wild) for bounded DLP: finds x in [a, b) with
 * g^x = y mod p. For the demo the tame herd's points are stored (fine for
 * small intervals); production use needs distinguished points. Returns null
 * for empty/inverted or over-cap intervals, or when the walk budget
 * (8·sqrt(N) + 1000 per herd) finds no collision.
 */
export function pollardKangaroo(g: bigint, y: bigint, p: bigint, a: bigint, b: bigint): bigint | null {
  if (a >= b) return null;
  const range = b - a;
  if (range > KANGAROO_RANGE_CAP) return null;
  const HERD = 32;
  const mean = isqrt(range) / 2n + 1n;
  const steps: bigint[] = [];
  const jumps: bigint[] = [];
  for (let k = 0; k < HERD; k++) {
    const s = 1n + (BigInt(k) * 7919n % mean);
    steps.push(s);
    jumps.push(modPow(g, s, p));
  }
  const lane = (v: bigint): number => Number(v % BigInt(HERD));
  const budget = Number(8n * isqrt(range) + 1000n);
  const tame = new Map<string, bigint>();
  let tVal = modPow(g, b, p);
  let tDist = 0n;
  for (let i = 0; i < budget; i++) {
    if (!tame.has(tVal.toString())) tame.set(tVal.toString(), tDist);
    const k = lane(tVal);
    tVal = (tVal * jumps[k]) % p;
    tDist += steps[k];
  }
  const yNorm = ((y % p) + p) % p;
  let wVal = yNorm;
  let wDist = 0n;
  for (let i = 0; i < budget; i++) {
    const tDistHit = tame.get(wVal.toString());
    if (tDistHit !== undefined) {
      const x = b + tDistHit - wDist;
      if (x >= a && x < b && modPow(g, x, p) === yNorm) return x;
    }
    const k = lane(wVal);
    wVal = (wVal * jumps[k]) % p;
    wDist += steps[k];
  }
  return null;
}

/**
 * Validate DSA-style parameters (p, q, g): q prime dividing p-1 and
 * g of order exactly q. Returns issues (empty = valid). q's bit length is
 * reported so the UI can cite the FIPS 186 size floor (N ≥ 224).
 */
export function validateDsaParams(p: bigint, q: bigint, g: bigint): string[] {
  const issues: string[] = [];
  if (p <= 2n) issues.push('Invalid p (need an odd prime > 2)');
  else if (!isProbablePrime(p)) issues.push('p fails the Miller-Rabin primality check');
  if (q <= 1n) issues.push('Invalid q (need a prime > 1)');
  else {
    if (!isProbablePrime(q)) issues.push('q fails the Miller-Rabin primality check');
    if ((p - 1n) % q !== 0n) issues.push('q does not divide p-1');
  }
  if (g <= 1n || g >= p) issues.push('g out of range: require 1 < g < p');
  else if (q > 1n && modPow(g, q, p) !== 1n) issues.push('g^q ≠ 1 mod p (g is not in the order-q subgroup)');
  return issues;
}

/**
 * Minimum RFC 7748 §6.1 peer-key hygiene for X25519: reject the all-zero
 * u-coordinate (contributory-behaviour failure). Malformed (non-32-byte)
 * input is also rejected. Low-order-point checks are SHOULD-level and
 * noted in the UI; this all-zero check is the MAY-level minimum.
 */
export function isAllZeroX25519Peer(hex: string): boolean {
  const clean = hex.trim().replace(/\s/g, '').replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length !== 64) return true;
  return /^[0]+$/.test(clean);
}

/**
 * Build the SageCell script for general DLP. Encodings are canonical:
 * p and y as 0x hex Integers, g as a decimal Mod base, with the
 * multiplicative operation '*' (Sage discrete_log names the group
 * operation, not the power function). Newlines are a real '\n' join —
 * never a literal backslash-n.
 */
export function buildSageDlpCode(p: bigint, g: bigint, y: bigint): string {
  const pHex = `0x${p.toString(16)}`;
  const yHex = `0x${y.toString(16)}`;
  const gDec = g.toString(10);
  return `p = Integer(${pHex})
g = Mod(${gDec}, p)
y = Mod(${yHex}, p)
out = []
out.append(f"p = {p}")
out.append(f"g = {g}")
out.append(f"y = {y}")
out.append("")
try:
    x = discrete_log(y, g, operation='*')
    out.append(f"Private key x = {x}")
    verify = power_mod(Integer(${gDec}), x, p)
    out.append(f"Verification: g^x mod p = {verify}")
    out.append(f"Match: {verify == Integer(${yHex})}")
    print('\\n'.join(out)); print('TOKEN=SUCCESS')
except Exception as e:
    out.append(f"discrete_log failed: {e}")
    print('\\n'.join(out)); print('TOKEN=FAILED')`;
}

/** Generate random 256-bit private key. */
export function generatePrivateKey(): bigint {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  let key = 0n;
  for (const b of buf) key = (key << 8n) + BigInt(b);
  return key;
}

export { parseHex };
