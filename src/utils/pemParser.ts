/**
 * PEM parser and decryptor for RSA private keys.
 * Supports PKCS#1, PKCS#8, encrypted PKCS#8, and PKCS#8 public keys.
 * Browser-only — uses Web Crypto API for decryption.
 */

import { decodeDer, parseSequence, parseInteger, parseOid, parseBitString, TAG } from './asn1';
import type { Asn1Node } from './asn1';

export interface ParsedPEM {
  type: 'pkcs1' | 'pkcs8' | 'pkcs8-encrypted' | 'pkcs8-public';
  format: string;
  keyParams?: {
    n: string;
    e: string;
    d: string;
    p: string;
    q: string;
    dp: string;
    dq: string;
    qInv: string;
  };
  encrypted?: boolean;
  encryptionAlgorithm?: string;
  rawPem: string;
}

/** OID to name mapping */
const OID_NAMES: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.113549.1.5.12': 'PBKDF2',
  '1.2.840.113549.1.5.13': 'PBES2',
  '1.2.840.113549.2.5': 'HMAC-SHA1',
  '1.2.840.113549.2.7': 'HMAC-SHA256',
  '1.2.840.113549.2.9': 'HMAC-SHA384',
  '1.2.840.113549.2.11': 'HMAC-SHA512',
  '2.16.840.1.101.3.4.2.1': 'SHA-256',
  '2.16.840.1.101.3.4.2.2': 'SHA-384',
  '2.16.840.1.101.3.4.2.3': 'SHA-512',
  '2.16.840.1.101.3.4.1.2': 'AES-128-CBC',
  '2.16.840.1.101.3.4.1.22': 'AES-192-CBC',
  '2.16.840.1.101.3.4.1.42': 'AES-256-CBC',
  '1.2.840.113549.3.7': 'DES-EDE3-CBC',
  '1.3.14.3.2.7': 'DES-CBC',
};

/** PRF OID to Web Crypto hash algorithm */
const PRF_HASH: Record<string, string> = {
  '1.2.840.113549.2.5': 'SHA-1',
  '1.2.840.113549.2.7': 'SHA-256',
  '1.2.840.113549.2.9': 'SHA-384',
  '1.2.840.113549.2.11': 'SHA-512',
};

/**
 * Parse PKCS#1 RSAPrivateKey SEQUENCE into key params.
 * Structure: SEQUENCE { version, n, e, d, p, q, dp, dq, qInv }
 */
function parsePkcs1Sequence(children: Asn1Node[]): ParsedPEM['keyParams'] {
  if (children.length < 9) {
    throw new Error(`PKCS#1: expected at least 9 integers, got ${children.length}`);
  }

  // Skip version (index 0)
  const n = parseInteger(children[1]).toString(16);
  const e = parseInteger(children[2]).toString(16);
  const d = parseInteger(children[3]).toString(16);
  const p = parseInteger(children[4]).toString(16);
  const q = parseInteger(children[5]).toString(16);
  const dp = parseInteger(children[6]).toString(16);
  const dq = parseInteger(children[7]).toString(16);
  const qInv = parseInteger(children[8]).toString(16);

  return { n, e, d, p, q, dp, dq, qInv };
}

/**
 * Base64-decode a string to Uint8Array.
 */
function base64Decode(b64: string): Uint8Array {
  const binary = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parse a PEM string into structured key data.
 */
export function parsePEM(pemText: string): ParsedPEM {
  const headerMatch = pemText.match(/-----BEGIN\s+(.*?)-----/);
  if (!headerMatch) {
    throw new Error('No PEM header found');
  }

  const headerLabel = headerMatch[1].trim();
  const b64Content = pemText
    .replace(/-----BEGIN\s+.*?-----/s, '')
    .replace(/-----END\s+.*?-----/s, '')
    .replace(/\s/g, '');

  if (!b64Content) {
    throw new Error('No PEM body found');
  }

  const derBytes = base64Decode(b64Content);
  const root = decodeDer(derBytes);

  // Detect format from header
  if (headerLabel === 'RSA PRIVATE KEY') {
    // PKCS#1
    const children = parseSequence(root);
    const keyParams = parsePkcs1Sequence(children);
    return {
      type: 'pkcs1',
      format: 'PKCS#1 RSA Private Key',
      keyParams,
      rawPem: pemText,
    };
  }

  if (headerLabel === 'RSA PUBLIC KEY') {
    // PKCS#1 public key
    const children = parseSequence(root);
    if (children.length < 2) {
      throw new Error('PKCS#1 public key: expected n and e');
    }
    const n = parseInteger(children[0]).toString(16);
    const e = parseInteger(children[1]).toString(16);
    return {
      type: 'pkcs1',
      format: 'PKCS#1 RSA Public Key',
      keyParams: { n, e, d: '', p: '', q: '', dp: '', dq: '', qInv: '' },
      rawPem: pemText,
    };
  }

  if (headerLabel === 'PRIVATE KEY') {
    // PKCS#8
    return parsePkcs8(root, pemText);
  }

  if (headerLabel === 'ENCRYPTED PRIVATE KEY') {
    // Encrypted PKCS#8
    return parseEncryptedPkcs8(root, pemText);
  }

  if (headerLabel === 'PUBLIC KEY') {
    // PKCS#8 SubjectPublicKeyInfo
    return parsePkcs8Public(root, pemText);
  }

  throw new Error(`Unsupported PEM header: "${headerLabel}"`);
}

/**
 * Parse PKCS#8 PrivateKeyInfo.
 * Structure: SEQUENCE { version, AlgorithmIdentifier, OCTET STRING { PKCS#1 } }
 */
function parsePkcs8(root: Asn1Node, rawPem: string): ParsedPEM {
  const children = parseSequence(root);

  // children[0] = version, children[1] = AlgorithmIdentifier, children[2] = privateKey OCTET STRING
  if (children.length < 3) {
    throw new Error(`PKCS#8: expected at least 3 elements, got ${children.length}`);
  }

  // Parse AlgorithmIdentifier
  const algId = parseSequence(children[1]);
  const algOid = parseOid(algId[0]);

  if (OID_NAMES[algOid] !== 'RSA') {
    throw new Error(`PKCS#8: expected RSA OID, got ${algOid} (${OID_NAMES[algOid] || 'unknown'})`);
  }

  // The private key is an OCTET STRING containing a PKCS#1 SEQUENCE
  const privateKeyNode = children[2];
  if (privateKeyNode.tag !== TAG.OCTET_STRING) {
    throw new Error(`PKCS#8: expected OCTET STRING for private key, got 0x${privateKeyNode.tag.toString(16)}`);
  }

  const innerRoot = decodeDer(privateKeyNode.value);
  const innerChildren = parseSequence(innerRoot);
  const keyParams = parsePkcs1Sequence(innerChildren);

  return {
    type: 'pkcs8',
    format: 'PKCS#8 RSA Private Key',
    keyParams,
    rawPem,
  };
}

/**
 * Parse PKCS#8 SubjectPublicKeyInfo.
 * Structure: SEQUENCE { AlgorithmIdentifier, BIT STRING { SEQUENCE { n, e } } }
 */
function parsePkcs8Public(root: Asn1Node, rawPem: string): ParsedPEM {
  const children = parseSequence(root);

  if (children.length < 2) {
    throw new Error(`PKCS#8 public key: expected 2 elements, got ${children.length}`);
  }

  // Skip AlgorithmIdentifier (children[0]), parse BIT STRING (children[1])
  const bitString = children[1];
  const innerBytes = parseBitString(bitString);
  const innerRoot = decodeDer(innerBytes);
  const innerChildren = parseSequence(innerRoot);

  if (innerChildren.length < 2) {
    throw new Error('PKCS#8 public key: expected n and e in inner SEQUENCE');
  }

  const n = parseInteger(innerChildren[0]).toString(16);
  const e = parseInteger(innerChildren[1]).toString(16);

  return {
    type: 'pkcs8-public',
    format: 'PKCS#8 RSA Public Key',
    keyParams: { n, e, d: '', p: '', q: '', dp: '', dq: '', qInv: '' },
    rawPem,
  };
}

/**
 * Parse EncryptedPrivateKeyInfo.
 * Structure: SEQUENCE { EncryptionAlgorithmIdentifier, OCTET STRING (encryptedData) }
 */
function parseEncryptedPkcs8(root: Asn1Node, rawPem: string): ParsedPEM {
  const children = parseSequence(root);

  if (children.length < 2) {
    throw new Error(`Encrypted PKCS#8: expected 2 elements, got ${children.length}`);
  }

  // Parse EncryptionAlgorithmIdentifier
  const algId = parseSequence(children[0]);
  const algOid = parseOid(algId[0]);

  let encryptionAlgorithm = OID_NAMES[algOid] || algOid;

  // Build description from OID chain
  if (algOid === '1.2.840.113549.1.5.13') {
    // PBES2 — parse params to identify cipher
    const pbes2Params = parseSequence(algId[1]);
    if (pbes2Params.length >= 2) {
      const keyDerivationFunc = parseSequence(pbes2Params[0]);
      const encryptionScheme = parseSequence(pbes2Params[1]);

      if (keyDerivationFunc.length >= 1) {
        const kdfOid = parseOid(keyDerivationFunc[0]);
        encryptionAlgorithm = (OID_NAMES[kdfOid] || kdfOid) + ' → ';
      }

      if (encryptionScheme.length >= 1) {
        const cipherOid = parseOid(encryptionScheme[0]);
        encryptionAlgorithm += OID_NAMES[cipherOid] || cipherOid;
      }
    }
  }

  return {
    type: 'pkcs8-encrypted',
    format: `Encrypted PKCS#8 Private Key`,
    encrypted: true,
    encryptionAlgorithm,
    rawPem,
  };
}

/**
 * Parse the key derivation parameters from PBES2-params.
 * Returns salt, iterations, keyLength, prfHash.
 */
interface Pbes2Params {
  salt: Uint8Array;
  iterations: number;
  keyLength: number;
  prfHash: string;
  cipherName: string;
  iv: Uint8Array;
  encryptedData: Uint8Array;
  keyLengthBits: number;
}

function parsePbes2Params(root: Asn1Node, encryptedData: Uint8Array): Pbes2Params {
  const children = parseSequence(root);

  if (children.length < 2) {
    throw new Error(`PBES2: expected 2 elements, got ${children.length}`);
  }

  // keyDerivationFunc: SEQUENCE { OID (PBKDF2), SEQUENCE { PBKDF2-params } }
  const kdf = parseSequence(children[0]);
  const kdfOid = parseOid(kdf[0]);
  if (kdfOid !== '1.2.840.113549.1.5.12') {
    throw new Error(`PBES2: expected PBKDF2 OID, got ${kdfOid}`);
  }

  // PBKDF2-params: SEQUENCE { OCTET STRING (salt), INTEGER (iterations), [INTEGER (keyLength)], [SEQUENCE { OID (prf) }] }
  const pbkdf2Params = parseSequence(kdf[1]);
  if (pbkdf2Params.length < 2) {
    throw new Error('PBKDF2: expected salt and iterations');
  }

  const salt = pbkdf2Params[0].value;
  const iterations = Number(parseInteger(pbkdf2Params[1]));

  let keyLength = 32; // default AES-256
  let prfHash = 'SHA-1'; // default PRF

  if (pbkdf2Params.length >= 3) {
    if (pbkdf2Params[2].tag === TAG.INTEGER) {
      keyLength = Number(parseInteger(pbkdf2Params[2]));
      if (pbkdf2Params.length >= 4) {
        const prfSeq = parseSequence(pbkdf2Params[3]);
        const prfOid = parseOid(prfSeq[0]);
        prfHash = PRF_HASH[prfOid] || 'SHA-1';
      }
    } else if (pbkdf2Params[2].tag === TAG.SEQUENCE || pbkdf2Params[2].tag === 0x30) {
      // PRF is at index 2, no explicit key length
      const prfSeq = parseSequence(pbkdf2Params[2]);
      const prfOid = parseOid(prfSeq[0]);
      prfHash = PRF_HASH[prfOid] || 'SHA-1';
    }
  }

  // encryptionScheme: SEQUENCE { OID (cipher), OCTET STRING (IV) }
  const encScheme = parseSequence(children[1]);
  const cipherOid = parseOid(encScheme[0]);

  const cipherName = OID_NAMES[cipherOid];
  if (cipherName !== 'AES-128-CBC' && cipherName !== 'AES-192-CBC' && cipherName !== 'AES-256-CBC') {
    throw new Error(`PBES2: unsupported cipher ${cipherName || cipherOid}`);
  }
  const keyLengthBits = cipherName === 'AES-128-CBC' ? 128 : cipherName === 'AES-192-CBC' ? 192 : 256;

  // Get IV
  const iv = encScheme[1].value;

  // If keyLength wasn't explicitly set, derive from cipher
  if (pbkdf2Params.length < 3 || pbkdf2Params[2].tag !== TAG.INTEGER) {
    keyLength = keyLengthBits / 8;
  }

  return {
    salt,
    iterations,
    keyLength,
    prfHash,
    cipherName,
    iv,
    encryptedData,
    keyLengthBits,
  };
}

/**
 * Decrypt an encrypted PEM key using a passphrase.
 * Uses Web Crypto API (PBKDF2 + symmetric decryption).
 */
export async function decryptPEM(parsed: ParsedPEM, passphrase: string): Promise<ParsedPEM> {
  if (!parsed.encrypted) {
    return parsed;
  }

  const derBytes = base64Decode(
    parsed.rawPem
      .replace(/-----BEGIN\s+.*?-----/s, '')
      .replace(/-----END\s+.*?-----/s, '')
      .replace(/\s/g, '')
  );

  const root = decodeDer(derBytes);
  const children = parseSequence(root);

  if (children.length < 2) {
    throw new Error('Encrypted PKCS#8: expected 2 top-level elements');
  }

  const encryptedData = children[1].value;
  const params = parsePbes2Params(parseSequence(children[0])[1], encryptedData);

  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: params.salt as BufferSource,
      iterations: params.iterations,
      hash: params.prfHash,
    },
    keyMaterial,
    {
      name: 'AES-CBC',
      length: params.keyLengthBits,
    },
    false,
    ['decrypt']
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: params.iv as BufferSource,
    },
    key,
    params.encryptedData as BufferSource
  );

  // Parse decrypted bytes as PKCS#8 PrivateKeyInfo
  const decryptedBytes = new Uint8Array(decrypted);
  const innerRoot = decodeDer(decryptedBytes);
  const pkcs8Result = parsePkcs8(innerRoot, parsed.rawPem);

  // Override type to pkcs8 (no longer encrypted)
  return {
    ...pkcs8Result,
    type: 'pkcs8',
    format: 'PKCS#8 RSA Private Key (decrypted)',
    rawPem: parsed.rawPem,
  };
}
