import { describe, test, expect } from 'bun:test';
import { generateKeyPairSync } from 'node:crypto';
import { parsePEM } from '../pemParser';

describe('parsePEM', () => {
  // Generate a real PKCS#1 RSA private key using Node's crypto API.
  // This avoids fragile hand-crafted hex fixtures and exercises the full
  // DER length-octet encoding, INTEGER leading-zero handling, and SEQUENCE nesting.
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 512 });
  const realKeyPEM = privateKey.export({ type: 'pkcs1', format: 'pem' }) as string;

  test('parses PKCS#1 private key header (real crypto-generated key)', () => {
    const result = parsePEM(realKeyPEM);
    expect(result.type).toBe('pkcs1');
    expect(result.format).toBe('PKCS#1 RSA Private Key');
    expect(result.keyParams).toBeDefined();
  });

  test('extracts n, e, d from real PKCS#1 private key', () => {
    const result = parsePEM(realKeyPEM);
    expect(result.keyParams!.n.length).toBeGreaterThan(0);
    expect(result.keyParams!.e.length).toBeGreaterThan(0);
    expect(result.keyParams!.d.length).toBeGreaterThan(0);
    // e should be 65537 (0x10001)
    expect(result.keyParams!.e).toBe('10001');
  });

  test('PKCS#1 public key', () => {
    // SEQUENCE { INTEGER n=7, INTEGER e=65537 }
    const pubHex = '300802010702030100010100';
    const pubBase64 = Buffer.from(pubHex, 'hex').toString('base64');
    const pubPEM = `-----BEGIN RSA PUBLIC KEY-----\n${pubBase64}\n-----END RSA PUBLIC KEY-----`;
    const result = parsePEM(pubPEM);
    expect(result.type).toBe('pkcs1');
    expect(result.keyParams!.n).toBe('7');
    expect(result.keyParams!.e).toBe('10001');
    // Public key has no d, p, q
    expect(result.keyParams!.d).toBe('');
    expect(result.keyParams!.p).toBe('');
  });

  test('throws on missing PEM header', () => {
    expect(() => parsePEM('not a PEM')).toThrow(/No PEM header/);
  });

  test('throws on empty body', () => {
    expect(() => parsePEM('-----BEGIN RSA PRIVATE KEY-----\n-----END RSA PRIVATE KEY-----')).toThrow(/No PEM body/);
  });

  test('throws on unsupported header', () => {
    expect(() => parsePEM('-----BEGIN MYSTERY KEY-----\nAAAA\n-----END MYSTERY KEY-----')).toThrow(/Unsupported PEM header/);
  });
});
