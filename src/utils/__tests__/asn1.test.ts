import { describe, test, expect } from 'bun:test';
import { decodeDer, decodeLength, parseInteger, parseOid, parseBitString, parseSequence, TAG } from '../asn1';

describe('decodeLength (short form)', () => {
  test('single byte < 0x80', () => {
    const data = new Uint8Array([0x05]); // length 5
    const [len, newOffset] = decodeLength(data, 0);
    expect(len).toBe(5);
    expect(newOffset).toBe(1);
  });
  test('zero', () => {
    const data = new Uint8Array([0x00]);
    const [len, newOffset] = decodeLength(data, 0);
    expect(len).toBe(0);
    expect(newOffset).toBe(1);
  });
});

describe('decodeLength (long form)', () => {
  test('two-byte length', () => {
    const data = new Uint8Array([0x81, 0x80]); // length 128
    const [len, newOffset] = decodeLength(data, 0);
    expect(len).toBe(128);
    expect(newOffset).toBe(2);
  });
  test('three-byte length', () => {
    const data = new Uint8Array([0x82, 0x01, 0x00]); // length 256
    const [len, newOffset] = decodeLength(data, 0);
    expect(len).toBe(256);
    expect(newOffset).toBe(3);
  });
});

describe('parseInteger', () => {
  test('zero', () => {
    const node = { tag: TAG.INTEGER, tagClass: 0, length: 0, value: new Uint8Array(0) };
    expect(parseInteger(node)).toBe(0n);
  });
  test('positive small', () => {
    const node = { tag: TAG.INTEGER, tagClass: 0, length: 1, value: new Uint8Array([42]) };
    expect(parseInteger(node)).toBe(42n);
  });
  test('positive multi-byte', () => {
    const node = { tag: TAG.INTEGER, tagClass: 0, length: 2, value: new Uint8Array([0x01, 0x00]) };
    expect(parseInteger(node)).toBe(256n);
  });
  test('negative (two’s complement)', () => {
    // 0xff as 1 byte = -1 in two's complement
    const node = { tag: TAG.INTEGER, tagClass: 0, length: 1, value: new Uint8Array([0xff]) };
    expect(parseInteger(node)).toBe(-1n);
  });
  test('throws on wrong tag', () => {
    const node = { tag: TAG.SEQUENCE, tagClass: 0, length: 0, value: new Uint8Array(0) };
    expect(() => parseInteger(node)).toThrow(/Expected INTEGER/);
  });
});

describe('parseOid', () => {
  test('rsaEncryption OID 1.2.840.113549.1.1.1', () => {
    // 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01
    const node = { tag: TAG.OID, tagClass: 0, length: 9, value: new Uint8Array([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]) };
    expect(parseOid(node)).toBe('1.2.840.113549.1.1.1');
  });
  test('sha256WithRSAEncryption OID 1.2.840.113549.1.1.11', () => {
    const node = { tag: TAG.OID, tagClass: 0, length: 9, value: new Uint8Array([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b]) };
    expect(parseOid(node)).toBe('1.2.840.113549.1.1.11');
  });
  test('short OID 1.2', () => {
    const node = { tag: TAG.OID, tagClass: 0, length: 1, value: new Uint8Array([0x2a]) };
    expect(parseOid(node)).toBe('1.2');
  });
});

describe('parseBitString', () => {
  test('strips leading unused-bits byte', () => {
    // BIT STRING with 0 unused bits, then 3 bytes
    const node = { tag: TAG.BIT_STRING, tagClass: 0, length: 4, value: new Uint8Array([0x00, 0x01, 0x02, 0x03]) };
    const result = parseBitString(node);
    expect(Array.from(result)).toEqual([0x01, 0x02, 0x03]);
  });
  test('throws on wrong tag', () => {
    const node = { tag: TAG.INTEGER, tagClass: 0, length: 1, value: new Uint8Array([0x00]) };
    expect(() => parseBitString(node)).toThrow(/Expected BIT STRING/);
  });
});

describe('decodeDer (full SEQUENCE)', () => {
  test('parses INTEGER inside SEQUENCE', () => {
    // SEQUENCE { INTEGER 5 }
    // 0x30 0x03 0x02 0x01 0x05
    const der = new Uint8Array([0x30, 0x03, 0x02, 0x01, 0x05]);
    const root = decodeDer(der);
    expect(root.tag).toBe(TAG.SEQUENCE);
    expect(root.length).toBe(3);
    const children = parseSequence(root);
    expect(children.length).toBe(1);
    expect(parseInteger(children[0])).toBe(5n);
  });
  test('parses nested SEQUENCE', () => {
    // SEQUENCE { SEQUENCE { INTEGER 1, INTEGER 2 } }
    // 0x30 0x06 0x30 0x04 0x02 0x01 0x01 0x02 0x01 0x02
    // Outer: 0x30 0x08 (length 8); Inner: 0x30 0x06 (length 6); two INTEGERs each 3 bytes
    const der = new Uint8Array([0x30, 0x08, 0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02]);
    const root = decodeDer(der);
    const outer = parseSequence(root);
    const inner = parseSequence(outer[0]);
    expect(inner.length).toBe(2);
    expect(parseInteger(inner[0])).toBe(1n);
    expect(parseInteger(inner[1])).toBe(2n);
  });
});
