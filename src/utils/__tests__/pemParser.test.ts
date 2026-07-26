import { describe, test, expect } from 'bun:test';
import { generateKeyPairSync } from 'node:crypto';
import { decryptPEM, parsePEM } from '../pemParser';

describe('parsePEM', () => {
  // Generate a real PKCS#1 RSA private key using Node's crypto API.
  // This avoids fragile hand-crafted hex fixtures and exercises the full
  // DER length-octet encoding, INTEGER leading-zero handling, and SEQUENCE nesting.
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 512 });
  const realKeyPEM = privateKey.export({ type: 'pkcs1', format: 'pem' });

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

describe('decryptPEM', () => {
  test('rejects PBES2 DES-CBC before attempting AES decryption', () => {
    const der = Buffer.from(
      '3041303506092a864886f70d01050d3028301306092a864886f70d01050c3006040100020101301106052b0e0302070408000000000000000004080000000000000000',
      'hex',
    );
    const pem = `-----BEGIN ENCRYPTED PRIVATE KEY-----\n${der.toString('base64')}\n-----END ENCRYPTED PRIVATE KEY-----`;

    return expect(decryptPEM(parsePEM(pem), 'passphrase')).rejects.toThrow(/unsupported.*DES-CBC/i);
  });
});
