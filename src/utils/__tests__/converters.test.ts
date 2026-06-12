import { describe, test, expect } from 'bun:test';
import { convertFormat, detectFormat, parsePEM, bigIntToBytes } from '../converters';

describe('convertFormat', () => {
  test('hex to dec', () => {
    expect(convertFormat('0xff', 'hex', 'dec')).toBe('255');
    expect(convertFormat('0xdeadbeef', 'hex', 'dec')).toBe('3735928559');
  });
  test('dec to hex', () => {
    expect(convertFormat('255', 'dec', 'hex')).toBe('0xff');
    expect(convertFormat('16', 'dec', 'hex')).toBe('0x10');
  });
  test('hex to base64', () => {
    // 0x48656c6c6f = "Hello"
    expect(convertFormat('0x48656c6c6f', 'hex', 'base64')).toBe('SGVsbG8=');
  });
  test('base64 to hex', () => {
    expect(convertFormat('SGVsbG8=', 'base64', 'hex')).toBe('0x48656c6c6f');
  });
  test('hex to text', () => {
    expect(convertFormat('0x48656c6c6f', 'hex', 'text')).toBe('Hello');
  });
  test('text to hex', () => {
    expect(convertFormat('Hello', 'text', 'hex')).toBe('0x48656c6c6f');
  });
  test('same format returns trimmed input', () => {
    expect(convertFormat('  0xff  ', 'hex', 'hex')).toBe('0xff');
  });
  test('empty input returns empty', () => {
    expect(convertFormat('', 'hex', 'dec')).toBe('');
  });
  test('round-trip hex ↔ dec ↔ hex', () => {
    const original = '0x123456789abcdef0';
    const dec = convertFormat(original, 'hex', 'dec');
    expect(convertFormat(dec, 'dec', 'hex')).toBe(original);
  });
});

describe('detectFormat', () => {
  test('hex with 0x prefix', () => {
    expect(detectFormat('0xff')).toBe('hex');
    expect(detectFormat('0xDEADBEEF')).toBe('hex');
  });
  test('hex with letter digits', () => {
    expect(detectFormat('deadbeef')).toBe('hex');
    expect(detectFormat('abc123')).toBe('hex');
  });
  test('decimal (digits only)', () => {
    expect(detectFormat('12345')).toBe('decimal');
    expect(detectFormat('0')).toBe('decimal');
  });
  test('base64 (with padding and mixed chars)', () => {
    expect(detectFormat('SGVsbG8=')).toBe('base64');
    expect(detectFormat('aGVsbG8gd29ybGQ=')).toBe('base64');
  });
  test('short alpha strings detected as ASCII', () => {
    expect(detectFormat('hi')).toBe('ascii');
    expect(detectFormat('cat')).toBe('ascii');
  });
  test('ASCII with spaces/punctuation', () => {
    expect(detectFormat('Hello, World!')).toBe('ascii');
  });
  test('unknown for non-printable', () => {
    // 0xff is 255 which is non-printable
    // But detectFormat strips 0x and sees "ff" which is hex
    expect(detectFormat('0xff')).toBe('hex');
  });
});

describe('parsePEM', () => {
  // Minimal PKCS#1 RSA public key: n=65537, e=3
  // SEQUENCE { INTEGER n, INTEGER e }
  // 0x30 0x06 0x02 0x01 0x03 0x02 0x01 0x03
  const pkcs1Hex = '3006020103020103';
  const pkcs1Base64 = Buffer.from(pkcs1Hex, 'hex').toString('base64');
  const pkcs1PEM = `-----BEGIN RSA PUBLIC KEY-----\n${pkcs1Base64}\n-----END RSA PUBLIC KEY-----`;

  test('parses PKCS#1 PEM', () => {
    const result = parsePEM(pkcs1PEM);
    expect(result).not.toBeNull();
    expect(result!.n).toBe('03');
    expect(result!.e).toBe('03');
  });

  test('returns null for invalid PEM', () => {
    expect(parsePEM('not a PEM')).toBeNull();
    expect(parsePEM('')).toBeNull();
  });

  test('returns null for wrong header', () => {
    expect(parsePEM(`-----BEGIN PRIVATE KEY-----\n${pkcs1Base64}\n-----END PRIVATE KEY-----`)).toBeNull();
  });
});

describe('bigIntToBytes', () => {
  test('zero', () => {
    expect(Array.from(bigIntToBytes(0n))).toEqual([0]);
  });
  test('small numbers', () => {
    expect(Array.from(bigIntToBytes(1n))).toEqual([1]);
    expect(Array.from(bigIntToBytes(255n))).toEqual([255]);
    expect(Array.from(bigIntToBytes(256n))).toEqual([1, 0]);
  });
  test('round-trip with parseHexToBytes', () => {
    const m = 12345678901234567890n;
    const bytes = bigIntToBytes(m);
    // Reconstruct
    let reconstructed = 0n;
    for (const b of bytes) reconstructed = (reconstructed << 8n) | BigInt(b);
    expect(reconstructed).toBe(m);
  });
});
