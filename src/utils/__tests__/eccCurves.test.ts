import { describe, expect, test } from 'bun:test';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';
import {
  cleanHex,
  parseHexField,
  hexToBytesStrict,
  sageHex,
  sageHexNonZero,
  curveOrder,
  ecPointOrder,
  validateSigRange,
  isHighS,
  recoverNonce,
  recoverPrivKey,
  ecdsaSignWithK,
  ecPohligHellman,
  ecMul,
  ecCurveOrder,
  X25519_LOW_ORDER_PEERS,
  x25519Legendre,
} from '../eccCurves';

const SECP_N = secp256k1.Point.Fn.ORDER;

describe('cleanHex / parseHexField (#1, #7)', () => {
  test("'ff' parses as hex 255", () => {
    expect(parseHexField('ff', 'r')).toBe(255n);
  });
  test("'10' parses as hex 16, not decimal 10", () => {
    expect(parseHexField('10', 'r')).toBe(16n);
  });
  test('0x prefix and whitespace are normalized', () => {
    expect(parseHexField('  0x10 ', 'r')).toBe(16n);
    expect(cleanHex('0xAB cd')).toBe('ABcd');
  });
  test('non-hex is rejected loudly with the field name', () => {
    expect(() => parseHexField('zz', 'r')).toThrow(/r/);
    expect(() => parseHexField('', 's')).toThrow();
  });
  test('0x-prefixed keys feed noble without opaque throw (#7)', () => {
    const raw = '0x' + '03'.repeat(32);
    const bytes = hexToBytesStrict(raw, 'private key');
    expect(bytes.length).toBe(32);
    expect(() => hexToBytesStrict('0xzz', 'private key')).toThrow(/private key/);
  });
});

describe('sageHex (#9) and anomalous target guard (#2)', () => {
  test('strips a pasted 0x prefix instead of emitting 0x0x', () => {
    expect(sageHex('0xab', 'p')).toBe('0xab');
    expect(sageHex('ab', 'p')).toBe('0xab');
  });
  test('empty / zero anomalous target throws instead of defaulting to G', () => {
    expect(() => sageHexNonZero('', 'Qx')).toThrow();
    expect(() => sageHexNonZero('0x0', 'Qx')).toThrow();
    expect(() => sageHexNonZero('0', 'Qy')).toThrow();
  });
});

describe('signature range + low-S (#3)', () => {
  test('r,s outside [1,n-1] are rejected', () => {
    expect(() => validateSigRange(0n, 1n, SECP_N)).toThrow();
    expect(() => validateSigRange(1n, SECP_N, SECP_N)).toThrow();
    expect(() => validateSigRange(1n, 1n, SECP_N)).not.toThrow();
  });
  test('high-S verifies INVALID under default lowS, VALID with lowS:false', () => {
    const priv = hexToBytes('03'.repeat(32));
    const msg = new TextEncoder().encode('low-s probe');
    const sig = secp256k1.sign(msg, priv);
    const pub = secp256k1.getPublicKey(priv);
    const s = secp256k1.Signature.fromBytes(sig);
    expect(secp256k1.verify(sig, msg, pub)).toBe(true);
    const hiS = SECP_N - s.s;
    expect(isHighS(s.s, SECP_N) || isHighS(hiS, SECP_N)).toBe(true);
    const hi = new secp256k1.Signature(s.r, hiS);
    // Exactly one of (s, n-s) is low; the high one must fail default verify.
    const highSig = isHighS(s.s, SECP_N) ? sig : hi.toBytes();
    expect(secp256k1.verify(highSig, msg, pub)).toBe(false);
    expect(secp256k1.verify(highSig, msg, pub, { lowS: false })).toBe(true);
  });
});

describe('sign/verify round-trips (#6, #8, #10)', () => {
  test('curveOrder exposes the secp256k1 group order', () => {
    expect(curveOrder(secp256k1).toString(16)).toBe(
      'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
    );
  });
  test('noble sign -> verify MATCH, and DER handoff verifies', () => {
    const priv = hexToBytes('07'.repeat(32));
    const msg = new TextEncoder().encode('der handoff');
    const sig = secp256k1.sign(msg, priv);
    const pub = secp256k1.getPublicKey(priv);
    expect(secp256k1.verify(sig, msg, pub)).toBe(true);
    const s = secp256k1.Signature.fromBytes(sig);
    const der = s.toBytes('der');
    const parsed = secp256k1.Signature.fromBytes(der, 'der');
    expect(parsed.r).toBe(s.r);
    expect(parsed.s).toBe(s.s);
    expect(secp256k1.verify(parsed.toBytes(), msg, pub)).toBe(true);
  });
  test('manual ECDSA with explicit k verifies and exposes h (#10)', () => {
    const dBytes = hexToBytes('11'.repeat(32));
    const d = parseHexField('11'.repeat(32), 'd');
    const msgBytes = new TextEncoder().encode('explicit-k demo');
    const h = BigInt('0x' + bytesToHex(sha256(msgBytes)));
    const k = 0x123456789abcdefn % SECP_N;
    const { r, s } = ecdsaSignWithK(secp256k1, h, d, k);
    expect(r).toBeGreaterThan(0n);
    const sig = new secp256k1.Signature(r, s);
    const pub = secp256k1.getPublicKey(dBytes);
    // Raw ECDSA math verifies; default lowS verify additionally rejects high-S.
    expect(secp256k1.verify(sig.toBytes(), msgBytes, pub, { lowS: false })).toBe(true);
    expect(secp256k1.verify(sig.toBytes(), msgBytes, pub)).toBe(!isHighS(s, SECP_N));
  });
  test('nonce-reuse fixture: recover k and d, k·G x-coord MATCHES r (#6)', () => {
    const d = 0xbeef1234n;
    const h1 = BigInt('0x' + bytesToHex(sha256(new TextEncoder().encode('msg one'))));
    const h2 = BigInt('0x' + bytesToHex(sha256(new TextEncoder().encode('msg two'))));
    const k = 0x42424242n;
    const sig1 = ecdsaSignWithK(secp256k1, h1, d, k);
    const sig2 = ecdsaSignWithK(secp256k1, h2, d, k);
    expect(sig1.r).toBe(sig2.r);
    const kRec = recoverNonce(h1, h2, sig1.s, sig2.s, SECP_N);
    expect(kRec).toBe(k);
    const dRec = recoverPrivKey(sig1.s, kRec, h1, sig1.r, SECP_N);
    expect(dRec).toBe(d);
    // Real k·G verification, not a print-only claim.
    const R = secp256k1.Point.BASE.multiply(kRec);
    expect(R.toAffine().x % SECP_N).toBe(sig1.r);
  });
});

describe('EC Pohlig-Hellman on a toy curve (#11)', () => {
  // y^2 = x^3 + 2x + 3 over F_97, group order 100 = 2^2 * 5^2.
  const a = 2n;
  const b = 3n;
  const p = 97n;
  test('enumeration finds order 100', () => {
    expect(ecCurveOrder(a, b, p)).toBe(100n);
  });
  test('recovers d across prime-power subgroups + CRT', () => {
    // Max-order base point, found deterministically via exact orders.
    let G: { x: bigint; y: bigint } = { x: 0n, y: 0n };
    let gOrd = 0n;
    for (let x = 0n; x < p; x++) {
      const rhs = (x * x * x + a * x + b) % p;
      for (let y = 0n; y < p; y++) {
        if ((y * y) % p !== rhs) continue;
        const o = ecPointOrder({ x, y }, 100n, a, p);
        if (o > gOrd) {
          gOrd = o;
          G = { x, y };
        }
        break;
      }
    }
    expect(gOrd).toBeGreaterThan(10n);
    const d = 37n % gOrd;
    const Q = ecMul(G, d, a, p)!;
    const res = ecPohligHellman(G, Q, gOrd, a, p);
    expect(res.d).toBe(d);
    // Every prime-power factor solved individually, product covers gOrd.
    expect(res.subgroups.reduce((acc, s) => acc * s.mod, 1n)).toBe(gOrd);
    expect(ecMul(G, res.d, a, p)).toEqual(Q);
  });
});

describe('X25519 twist/low-order demo (#12)', () => {
  test('known low-order peers are rejected by noble', () => {
    expect(X25519_LOW_ORDER_PEERS.length).toBeGreaterThanOrEqual(2);
    const priv = x25519.keygen().secretKey;
    for (const peerHex of X25519_LOW_ORDER_PEERS) {
      const peer = hexToBytes(peerHex);
      expect(() => x25519.getSharedSecret(priv, peer)).toThrow();
    }
  });
  test('legit keypair exchange succeeds (control)', () => {
    const alice = x25519.keygen();
    const bob = x25519.keygen();
    const sa = x25519.getSharedSecret(alice.secretKey, bob.publicKey);
    const sb = x25519.getSharedSecret(bob.secretKey, alice.publicKey);
    expect(bytesToHex(sa)).toBe(bytesToHex(sb));
  });
  test('Legendre symbol separates curve from twist', () => {
    // Base point u=9 is on the curve; u=0 gives f=0.
    expect(x25519Legendre(9n)).toBe(1n);
    expect(x25519Legendre(0n)).toBe(0n);
  });
});

describe('Ed25519 path (#13)', () => {
  test('sign -> verify round-trip', () => {
    const kp = ed25519.keygen();
    const msg = new TextEncoder().encode('ed25519 demo');
    const sig = ed25519.sign(msg, kp.secretKey);
    expect(ed25519.verify(sig, msg, kp.publicKey)).toBe(true);
    expect(sig.length).toBe(64);
    expect(kp.publicKey.length).toBe(32);
  });
});

describe('signature malleability (#15)', () => {
  test('(r, n-s) flips default-verdict but passes lowS:false', () => {
    const priv = hexToBytes('09'.repeat(32));
    const msg = new TextEncoder().encode('malleability');
    const sig = secp256k1.sign(msg, priv);
    const pub = secp256k1.getPublicKey(priv);
    const s = secp256k1.Signature.fromBytes(sig);
    const low = s.s * 2n < SECP_N ? s.s : SECP_N - s.s;
    const hi = SECP_N - low;
    const hiSig = new secp256k1.Signature(s.r, hi).toBytes();
    expect(secp256k1.verify(hiSig, msg, pub)).toBe(false);
    expect(secp256k1.verify(hiSig, msg, pub, { lowS: false })).toBe(true);
  });
});
