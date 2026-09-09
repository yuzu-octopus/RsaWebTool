import { describe, expect, test } from 'bun:test';
import { ecb, gcm, cbc } from '@noble/ciphers/aes.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/ciphers/utils.js';
import {
  hex,
  ofbEncrypt,
  expandKey,
  invertKeySchedule,
  recoverKeystream,
  scoreEnglish,
  cribDrag,
  reorderBlocks,
  parseBlockOrder,
  gfMul,
  ghash,
  recoverGcmHSingleBlock,
  forgeGcmTag,
  ecbByteAtATimeRecover,
  paddingOracleDecrypt,
} from '../aesCrypto';

// FIPS-197 Appendix B vectors
const MASTER = '2b7e151628aed2a6abf7158809cf4f3c';
const LAST_ROUND = 'd014f9a8c9ee2589e13f0cc8b6630ca6';

describe('invertKeySchedule (AES-128)', () => {
  test('FIPS-197 round-trip: master -> last round -> master', () => {
    const w = expandKey(hexToBytes(MASTER));
    const last = new Uint8Array(16);
    for (let j = 0; j < 4; j++) {
      const v = w[40 + j];
      last[4 * j] = (v >>> 24) & 0xff;
      last[4 * j + 1] = (v >>> 16) & 0xff;
      last[4 * j + 2] = (v >>> 8) & 0xff;
      last[4 * j + 3] = v & 0xff;
    }
    expect(bytesToHex(last)).toBe(LAST_ROUND);
    expect(bytesToHex(invertKeySchedule(hexToBytes(LAST_ROUND)))).toBe(MASTER);
  });

  test('re-expansion verification: expand(invert(last)) ends at last', () => {
    const master = invertKeySchedule(hexToBytes(LAST_ROUND));
    const w = expandKey(master);
    const last = new Uint8Array(16);
    for (let j = 0; j < 4; j++) {
      const v = w[40 + j];
      last[4 * j] = (v >>> 24) & 0xff;
      last[4 * j + 1] = (v >>> 16) & 0xff;
      last[4 * j + 2] = (v >>> 8) & 0xff;
      last[4 * j + 3] = v & 0xff;
    }
    expect(bytesToHex(last)).toBe(LAST_ROUND);
  });

  test('gates AES-192/256 with a clear message', () => {
    expect(() => invertKeySchedule(new Uint8Array(24))).toThrow(/AES-128/i);
    expect(() => invertKeySchedule(new Uint8Array(32))).toThrow(/AES-128/i);
  });
});

describe('recoverKeystream', () => {
  test('operates on min length (partial known plaintext)', () => {
    const ks = recoverKeystream(new Uint8Array([1, 2]), new Uint8Array([10, 20, 30, 40]));
    expect(ks.length).toBe(2);
    expect([...ks]).toEqual([11, 22]);
  });
});

describe('crib dragging', () => {
  test('english scores above random bytes', () => {
    const eng = new TextEncoder().encode('the quick brown fox jumps over the lazy dog');
    expect(scoreEnglish(eng)).toBeGreaterThan(scoreEnglish(randomBytes(43)));
  });

  test('finds a planted crib at the right offset', () => {
    const pt1 = new TextEncoder().encode('attack at dawn, bring the cannons!');
    const pt2 = new TextEncoder().encode('retreat now!!! the enemy advances.');
    const x = new Uint8Array(Math.min(pt1.length, pt2.length));
    for (let i = 0; i < x.length; i++) x[i] = pt1[i] ^ pt2[i];
    const hits = cribDrag(x, ['xyzzy', 'attack at']);
    expect(hits[0].crib).toBe('attack at');
    expect(hits[0].offset).toBe(0);
  });
});

describe('ECB block helpers', () => {
  test('reorderBlocks permutes 16-byte blocks', () => {
    const ct = hexToBytes('00'.repeat(16) + '11'.repeat(16) + '22'.repeat(16));
    expect(bytesToHex(reorderBlocks(ct, [2, 0]))).toBe('22'.repeat(16) + '00'.repeat(16));
  });

  test('parseBlockOrder validates indices', () => {
    expect(parseBlockOrder('2,1,0', 3)).toEqual([2, 1, 0]);
    expect(() => parseBlockOrder('0,3', 3)).toThrow(/range/i);
    expect(() => parseBlockOrder('a,b', 2)).toThrow();
  });
});

describe('GHASH / GCM forgery', () => {
  test('gfMul identity and commutativity', () => {
    const one = new Uint8Array(16);
    one[0] = 0x80; // field element 1 in the GCM MSB-first layout
    const x = randomBytes(16);
    expect(gfMul(x, one)).toEqual(x);
    const a = randomBytes(16);
    const b = randomBytes(16);
    expect(gfMul(a, b)).toEqual(gfMul(b, a));
  });

  test('ghash reproduces noble GCM tags', () => {
    const key = randomBytes(16);
    const nonce = randomBytes(12);
    const aad = hexToBytes('aabbcc');
    const pt = randomBytes(40);
    const wire = gcm(key, nonce, aad).encrypt(pt);
    const ct = wire.subarray(0, 40);
    const tag = wire.subarray(40);
    const H = ecb(key, { disablePadding: true }).encrypt(new Uint8Array(16));
    const j0 = new Uint8Array(16);
    j0.set(nonce, 0);
    j0[15] = 1;
    const eJ0 = ecb(key, { disablePadding: true }).encrypt(j0);
    const expectTag = forgeGcmTag(H, eJ0, aad, ct);
    expect(bytesToHex(expectTag)).toBe(bytesToHex(tag));
  });

  test('ghash of empty inputs is zero', () => {
    expect(ghash(randomBytes(16), new Uint8Array(0), new Uint8Array(0))).toEqual(new Uint8Array(16));
  });

  test('nonce-reuse forgery verifies under noble GCM', () => {
    const key = randomBytes(16);
    const nonce = randomBytes(12);
    const c1p = hexToBytes('00'.repeat(16));
    const c2p = hexToBytes('ff'.repeat(16));
    const w1 = gcm(key, nonce).encrypt(c1p);
    const w2 = gcm(key, nonce).encrypt(c2p);
    const c1 = w1.subarray(0, 16);
    const t1 = w1.subarray(16);
    const c2 = w2.subarray(0, 16);
    const t2 = w2.subarray(16);
    const H = recoverGcmHSingleBlock(c1, t1, c2, t2);
    // Forge a tag for a fresh single-block message under the same nonce
    const pt3 = hexToBytes('ab'.repeat(16));
    const c3 = recoverKeystream(c1p, c1).length === 16
      ? (() => { const ks = recoverKeystream(c1p, c1); const o = new Uint8Array(16); for (let i = 0; i < 16; i++) o[i] = pt3[i] ^ ks[i]; return o; })()
      : pt3;
    const EJ0 = new Uint8Array(16);
    const g1 = ghash(H, new Uint8Array(0), c1);
    for (let i = 0; i < 16; i++) EJ0[i] = t1[i] ^ g1[i];
    const forged = forgeGcmTag(H, EJ0, new Uint8Array(0), c3);
    const wire = new Uint8Array(32);
    wire.set(c3, 0);
    wire.set(forged, 16);
    expect(bytesToHex(gcm(key, nonce).decrypt(wire))).toBe(bytesToHex(pt3));
  });
});

describe('offline oracle simulators', () => {
  test('byte-at-a-time recovers an embedded secret', () => {
    const secret = new TextEncoder().encode('flag{ecb_oracle_demo_123}');
    const { recovered, queries } = ecbByteAtATimeRecover(secret);
    expect(bytesToHex(recovered)).toBe(bytesToHex(secret));
    expect(queries).toBeGreaterThan(secret.length); // ~256 guesses per byte worst case
  });

  test('padding oracle decrypts a CBC ciphertext', () => {
    const key = randomBytes(16);
    const iv = randomBytes(16);
    const pt = new TextEncoder().encode('padding oracle test message!!'); // 28 bytes -> 2 blocks
    const ct = cbc(key, iv).encrypt(pt);
    const oracle = (ivQ: Uint8Array, ctQ: Uint8Array): boolean => {
      try {
        cbc(key, ivQ).decrypt(ctQ);
        return true;
      } catch {
        return false;
      }
    };
    const { plaintext } = paddingOracleDecrypt(iv, ct, oracle);
    expect(bytesToHex(plaintext)).toBe(bytesToHex(pt));
  });
});

describe('hex helper', () => {
  test('strips whitespace', () => {
    expect(bytesToHex(hex('aa bb\ncc'))).toBe('aabbcc');
  });
});

describe('ofbEncrypt (custom OFB, no noble export)', () => {
  test('keystream encrypt/decrypt round-trips', () => {
    const key = randomBytes(16);
    const iv = randomBytes(16);
    const pt = randomBytes(40);
    const ct = ofbEncrypt(key, iv, pt);
    expect(ct).not.toEqual(pt);
    expect(ofbEncrypt(key, iv, ct)).toEqual(pt);
  });
});
