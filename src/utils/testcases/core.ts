import { modPow, gcd, modInverse } from '../bigint';

export function isPrimeMR(n: bigint): boolean {
  if (n < 2n) return false;
  if (n < 4n) return true;
  if (n % 2n === 0n || n % 3n === 0n) return false;
  const smallPrimes = [5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];
  for (const p of smallPrimes) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) { d /= 2n; s++; }
  const bases = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const a of bases) {
    if (a >= n) break;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) { composite = false; break; }
    }
    if (composite) return false;
  }
  return true;
}

export function randomPrime(bits: number): bigint {
  while (true) {
    const numBytes = Math.ceil(bits / 8);
    const bytes = new Uint8Array(numBytes);
    crypto.getRandomValues(bytes);

    // Build bigint from bytes
    let n = 0n;
    for (let i = 0; i < numBytes; i++) {
      n = (n << 8n) | BigInt(bytes[i]);
    }

    // Set top bit to ensure correct bit length
    n |= (1n << BigInt(bits - 1));
    // Ensure odd
    n |= 1n;
    // Mask to exact bit length
    n &= (1n << BigInt(bits)) - 1n;

    if (isPrimeMR(n)) return n;
  }
}

export interface RSAKeyPair {
  p: bigint;
  q: bigint;
  n: bigint;
  e: bigint;
  d: bigint;
  phi: bigint;
}

export function generateKeyPair(pBits: number, qBits: number, e: bigint = 65537n): RSAKeyPair {
  let p: bigint, q: bigint;
  do {
    p = randomPrime(pBits);
    q = randomPrime(qBits);
  } while (p === q);
  if (p > q) [p, q] = [q, p];
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  let eAdj = e;
  while (gcd(eAdj, phi) !== 1n) eAdj += 2n;
  const d = modInverse(eAdj, phi);
  if (d === null) throw new Error("modInverse failed");
  return { p, q, n, e: eAdj, d, phi };
}

export function encrypt(m: bigint, n: bigint, e: bigint): bigint {
  return modPow(m, e, n);
}

// Testcase generation defaults — change here to affect ALL attacks
export const TESTCASE_BITS = { p: 128, q: 128 }; // n ≈ 256-bit
