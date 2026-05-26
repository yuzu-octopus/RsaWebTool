export type Format = 'hex' | 'dec' | 'base64' | 'text';

function parseHexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/i, '').replace(/\s/g, '');
  if (cleaned.length === 0) return new Uint8Array(0);
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) throw new Error('Invalid hex string');
  const padded = cleaned.length % 2 === 0 ? cleaned : '0' + cleaned;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
  return bytes;
}

function parseDecToBytes(dec: string): Uint8Array {
  const cleaned = dec.replace(/\s/g, '');
  if (cleaned.length === 0) return new Uint8Array(0);
  const hex = BigInt(cleaned).toString(16);
  const padded = hex.length % 2 === 0 ? hex : '0' + hex;
  return parseHexToBytes(padded);
}

function parseBase64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/\s/g, '');
  if (cleaned.length === 0) return new Uint8Array(0);
  const binaryStr = atob(cleaned);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes;
}

function parseTextToBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}

function formatBytesAsHex(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (const b of bytes) parts.push(b.toString(16).padStart(2, '0'));
  return '0x' + parts.join('');
}

function formatBytesAsDec(bytes: Uint8Array): string {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex ? BigInt('0x' + hex).toString() : '0';
}

function formatBytesAsBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function formatBytesAsText(bytes: Uint8Array): string {
  let text = '';
  for (const b of bytes) text += String.fromCharCode(b);
  return text;
}

export function convertFormat(input: string, from: Format, to: Format): string {
  if (!input) return '';
  if (from === to) return input.trim();
  const bytes = (() => {
    switch (from) {
      case 'hex': return parseHexToBytes(input);
      case 'dec': return parseDecToBytes(input);
      case 'base64': return parseBase64ToBytes(input);
      case 'text': return parseTextToBytes(input);
    }
  })();
  switch (to) {
    case 'hex': return formatBytesAsHex(bytes);
    case 'dec': return formatBytesAsDec(bytes);
    case 'base64': return formatBytesAsBase64(bytes);
    case 'text': return formatBytesAsText(bytes);
  }
}

export type DetectedFormat = 'hex' | 'decimal' | 'base64' | 'ascii' | 'unknown';

export function detectFormat(input: string): DetectedFormat {
  const raw = input.trim();
  // Explicit 0x prefix → always hex
  if (/^0x[0-9a-fA-F]+$/i.test(raw)) return 'hex';

  const trimmed = raw.replace(/^0x/i, '');
  if (/^[0-9a-fA-F]+$/.test(trimmed) && /[a-fA-F]/.test(trimmed)) {
    return 'hex';
  }
  if (/^[0-9]+$/.test(trimmed)) {
    return 'decimal';
  }
  // Short pure-alpha strings are likely ASCII, not base64
  if (trimmed.length <= 3 && /^[A-Za-z]+$/.test(trimmed)) {
    return 'ascii';
  }
  if (/^[A-Za-z0-9+/]+=*$/.test(trimmed)) {
    try {
      atob(trimmed);
      return 'base64';
    } catch {
      // fall through
    }
  }
  if (/^[\x20-\x7E]+$/.test(trimmed)) {
    return 'ascii';
  }
  return 'unknown';
}

function skipDerLength(bytes: number[], offset: number): number {
  if (offset >= bytes.length) return offset;
  if (bytes[offset] < 0x80) return offset + 1;
  const numBytes = bytes[offset] & 0x7f;
  const newOffset = offset + 1 + numBytes;
  return newOffset > bytes.length ? bytes.length : newOffset;
}

function parseDerInteger(
  bytes: number[],
  offset: number,
): { value: number[]; newOffset: number } {
  if (offset >= bytes.length) {
    return { value: [], newOffset: offset };
  }
  const length =
    bytes[offset] < 0x80
      ? bytes[offset]
      : (() => {
          const numBytes = bytes[offset] & 0x7f;
          let len = 0;
          for (let i = 0; i < numBytes; i++) {
            if (offset + 1 + i >= bytes.length) break;
            len = (len << 8) | bytes[offset + 1 + i];
          }
          return len;
        })();
  const valueStart =
    bytes[offset] < 0x80
      ? offset + 1
      : offset + 1 + (bytes[offset] & 0x7f);
  const value = bytes.slice(valueStart, valueStart + length);
  const newOffset = valueStart + length;
  return { value, newOffset };
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function tryParsePkcs1(bytes: number[]): { n: string; e: string } | null {
  try {
    let offset = 0;
    if (bytes[offset++] !== 0x30) return null;
    offset = skipDerLength(bytes, offset);

    if (bytes[offset++] !== 0x02) return null;
    const { value: nBytes, newOffset: nEnd } = parseDerInteger(bytes, offset);
    const n = bytesToHex(nBytes);
    offset = nEnd;

    if (bytes[offset++] !== 0x02) return null;
    const { value: eBytes } = parseDerInteger(bytes, offset);
    const e = bytesToHex(eBytes);

    return { n, e };
  } catch {
    return null;
  }
}

function tryParseSpki(bytes: number[]): { n: string; e: string } | null {
  try {
    let offset = 0;
    // SPKI: SEQUENCE { AlgorithmIdentifier, BIT STRING { SEQUENCE { INTEGER n, INTEGER e } } }
    if (bytes[offset++] !== 0x30) return null;
    offset = skipDerLength(bytes, offset);

    // Skip AlgorithmIdentifier (SEQUENCE + OID + NULL)
    if (bytes[offset++] !== 0x30) return null;
    offset = skipDerLength(bytes, offset);

    // Skip BIT STRING wrapper
    if (bytes[offset++] !== 0x03) return null;
    offset = skipDerLength(bytes, offset);
    const unusedBits = bytes[offset++];
    if (unusedBits !== 0x00) {
      console.warn(`parsePEM: unexpected BIT STRING unused bits 0x${unusedBits.toString(16)}, expected 0x00`);
      return null;
    }

    // Now at inner SEQUENCE { n, e }
    if (bytes[offset++] !== 0x30) return null;
    offset = skipDerLength(bytes, offset);

    if (bytes[offset++] !== 0x02) return null;
    const { value: nBytes, newOffset: nEnd } = parseDerInteger(bytes, offset);
    const n = bytesToHex(nBytes);
    offset = nEnd;

    if (bytes[offset++] !== 0x02) return null;
    const { value: eBytes } = parseDerInteger(bytes, offset);
    const e = bytesToHex(eBytes);

    return { n, e };
  } catch {
    return null;
  }
}

export function parsePEM(input: string): { n: string; e: string } | null {
  const spkiRegex =
    /-----BEGIN PUBLIC KEY-----(.+?)-----END PUBLIC KEY-----/s;
  const pkcs1Regex =
    /-----BEGIN RSA PUBLIC KEY-----(.+?)-----END RSA PUBLIC KEY-----/s;

  const spkiMatch = spkiRegex.exec(input);
  const pkcs1Match = pkcs1Regex.exec(input);

  if (pkcs1Match) {
    const b64 = pkcs1Match[1].replace(/\s/g, '');
    const der = atob(b64);
    const bytes = Array.from(der).map((c) => c.charCodeAt(0));
    // Try PKCS#1 first, fall back to SPKI in case of header mismatch
    const result = tryParsePkcs1(bytes);
    if (result) return result;
    return tryParseSpki(bytes);
  }

  if (spkiMatch) {
    const b64 = spkiMatch[1].replace(/\s/g, '');
    const der = atob(b64);
    const bytes = Array.from(der).map((c) => c.charCodeAt(0));
    return tryParseSpki(bytes);
  }

  return null;
}

/** Converts a BigInt to a Uint8Array (big-endian, minimal encoding) */
export function bigIntToBytes(m: bigint): Uint8Array {
  if (m === 0n) return new Uint8Array([0]);
  const hex = m.toString(16);
  const padded = hex.length % 2 === 0 ? hex : '0' + hex;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
