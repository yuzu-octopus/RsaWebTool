import { describe, test, expect } from 'bun:test';
import { parseBigInt, toHex, toAscii, isPrintableAscii } from '../rsaCalc';

describe('parseBigInt', () => {
  test('hex with 0x prefix', () => {
    expect(parseBigInt('0xff')).toBe(255n);
    expect(parseBigInt('0xDEADBEEF')).toBe(3735928559n);
  });
  test('decimal', () => {
    expect(parseBigInt('255')).toBe(255n);
    expect(parseBigInt('0')).toBe(0n);
  });
  test('base64', () => {
    // "Hi" = 0x4869
    expect(parseBigInt('SGk=')).toBe(0x4869n);
  });
  test('ascii (short printable string)', () => {
    // "Hi" = 0x4869
    expect(parseBigInt('Hi')).toBe(0x4869n);
  });
  test('strips whitespace', () => {
    expect(parseBigInt('  255  ')).toBe(255n);
  });
  test('empty or invalid returns null', () => {
    expect(parseBigInt('')).toBeNull();
    expect(parseBigInt('   ')).toBeNull();
  });
  test('large values', () => {
    expect(parseBigInt('0x7fffffffffffffff')).toBe(9223372036854775807n);
  });
});

describe('toHex', () => {
  test('basic cases', () => {
    expect(toHex(0n)).toBe('0x00');
    expect(toHex(255n)).toBe('0xff');
    expect(toHex(256n)).toBe('0x0100'); // 256 = 0x100, padded to even length
  });
  test('pads odd-length hex', () => {
    expect(toHex(15n)).toBe('0x0f');
    expect(toHex(0xabcn)).toBe('0x0abc');
  });
  test('large values', () => {
    expect(toHex(0xdeadbeefn)).toBe('0xdeadbeef');
  });
});

describe('toAscii', () => {
  test('printable ASCII', () => {
    expect(toAscii(0x48656c6c6fn)).toBe('Hello');
  });
  test('non-printable replaced with .', () => {
    // 0x00 is non-printable, 0x48 is 'H', 0x65 is 'e'
    expect(toAscii(0x486500n)).toBe('He.');
  });
  test('single byte', () => {
    expect(toAscii(0x41n)).toBe('A');
  });
  test('empty', () => {
    expect(toAscii(0n)).toBe('.'); // 0x00 is non-printable, replaced with .
  });
});

describe('isPrintableAscii', () => {
  test('all printable', () => {
    expect(isPrintableAscii(0x48656c6c6fn)).toBe(true);
    // 0x00 is a NULL control character (not printable ASCII)
    expect(isPrintableAscii(0n)).toBe(false);
  });
  test('contains non-printable', () => {
    expect(isPrintableAscii(0x4865ffn)).toBe(false); // 0xff
  });
});
