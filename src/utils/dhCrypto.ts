import { modPow, modInverse } from './bigint';
import { parseHex } from './bigint';

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

/** Trial division factorisation returning small prime factors (up to limit). */
export function factorSmall(n: bigint, limit: number): bigint[] {
  const factors: bigint[] = [];
  let m = n;
  // Handle factor 2 separately, then iterate odd candidates only.
  // (The previous `for p; p++ { if (p===2) p=1; }` pattern oscillated 1→2 forever.)
  if (m % 2n === 0n) {
    factors.push(2n);
    while (m % 2n === 0n) m /= 2n;
  }
  for (let p = 3; p <= limit && m > 1n; p += 2) {
    const bp = BigInt(p);
    if (m % bp === 0n) {
      factors.push(bp);
      while (m % bp === 0n) m /= bp;
    }
  }
  return factors;
}

/** Factor n by trial division, returning { prime, exponent } array. */
export function factorPowers(n: bigint, limit: number): { prime: bigint; exp: number }[] {
  const result: { prime: bigint; exp: number }[] = [];
  let m = n;
  // Handle factor 2 separately, then iterate odd candidates only.
  if (m % 2n === 0n) {
    let exp = 0;
    while (m % 2n === 0n) {
      m /= 2n;
      exp++;
    }
    result.push({ prime: 2n, exp });
  }
  for (let p = 3; p <= limit && m > 1n; p += 2) {
    const bp = BigInt(p);
    if (m % bp === 0n) {
      let exp = 0;
      while (m % bp === 0n) {
        m /= bp;
        exp++;
      }
      result.push({ prime: bp, exp });
    }
  }
  if (m > 1n) result.push({ prime: m, exp: 1 });
  return result;
}

/** Baby-step Giant-step for prime order subgroup r. */
export function bsgsSubgroup(g: bigint, y: bigint, p: bigint, r: bigint): bigint | null {
  const sqrtR = BigInt(Math.ceil(Math.sqrt(Number(r))));
  const baby: Map<string, bigint> = new Map();
  let cur = 1n;
  for (let j = 0n; j < sqrtR; j++) {
    if (!baby.has(cur.toString())) baby.set(cur.toString(), j);
    cur = (cur * g) % p;
  }
  const factor = modPow(g, (r - 1n - sqrtR + r) % r, p);
  if (factor === null) return null;
  let gamma = y;
  for (let i = 0n; i < sqrtR; i++) {
    const key = gamma.toString();
    if (baby.has(key)) {
      const x = i * sqrtR + baby.get(key)!;
      if (x < r) return x;
    }
    gamma = (gamma * factor) % p;
  }
  return null;
}

/** Chinese Remainder Theorem: find x ≡ a_i (mod m_i) for pairwise coprime m_i. */
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
  return x;
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
