export function hexToBytes(hex: string): string {
  hex = hex.replace(/^0x/, '').replace(/\s/g, '');
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const bytes: string[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push('0x' + hex.slice(i, i + 2));
  }
  return bytes.join(' ');
}

export function hexToAscii(hex: string): string {
  hex = hex.replace(/^0x/, '').replace(/\s/g, '');
  if (hex.length % 2 !== 0) hex = '0' + hex;
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    result += String.fromCharCode(code);
  }
  return result;
}

export function decToHex(dec: string): string {
  try {
    const big = BigInt(dec.trim());
    let hex = big.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    return '0x' + hex;
  } catch {
    return 'Error: Invalid decimal number';
  }
}

export function decToAscii(dec: string): string {
  try {
    const hex = BigInt(dec.trim()).toString(16);
    return hexToAscii(hex);
  } catch {
    return 'Error: Invalid decimal number';
  }
}

export function base64ToText(b64: string): string {
  try {
    return atob(b64.trim());
  } catch {
    return 'Error: Invalid base64 string';
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

export function parsePEM(input: string): { n: string; e: string } | null {
  const spkiRegex =
    /-----BEGIN PUBLIC KEY-----(.+?)-----END PUBLIC KEY-----/s;
  const pkcs1Regex =
    /-----BEGIN RSA PUBLIC KEY-----(.+?)-----END RSA PUBLIC KEY-----/s;

  let bytes: number[];
  let isPkcs1 = false;

  const spkiMatch = spkiRegex.exec(input);
  const pkcs1Match = pkcs1Regex.exec(input);

  if (pkcs1Match) {
    isPkcs1 = true;
    const b64 = pkcs1Match[1].replace(/\s/g, '');
    const der = atob(b64);
    bytes = Array.from(der).map((c) => c.charCodeAt(0));
  } else if (spkiMatch) {
    const b64 = spkiMatch[1].replace(/\s/g, '');
    const der = atob(b64);
    bytes = Array.from(der).map((c) => c.charCodeAt(0));
  } else {
    return null;
  }

  try {
    let offset = 0;

    if (bytes[offset++] !== 0x30) return null;
    offset = skipDerLength(bytes, offset);

    if (isPkcs1) {
      // PKCS#1: SEQUENCE { INTEGER n, INTEGER e } — n and e directly
      if (bytes[offset++] !== 0x02) return null;
      const { value: nBytes, newOffset: nEnd } = parseDerInteger(bytes, offset);
      const n = bytesToHex(nBytes);
      offset = nEnd;

      if (bytes[offset++] !== 0x02) return null;
      const { value: eBytes } = parseDerInteger(bytes, offset);
      const e = bytesToHex(eBytes);

      return { n, e };
    } else {
      // SPKI: SEQUENCE { AlgorithmIdentifier, BIT STRING { SEQUENCE { INTEGER n, INTEGER e } } }
      // Skip AlgorithmIdentifier (SEQUENCE + OID + NULL)
      if (bytes[offset++] !== 0x30) return null;
      offset = skipDerLength(bytes, offset);

      // Skip BIT STRING wrapper
      if (bytes[offset++] !== 0x03) return null;
      offset = skipDerLength(bytes, offset);
      const unusedBits = bytes[offset++]; // skip unused bits byte
      // DER requires unused bits to be 0 for octet-aligned data
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
    }
  } catch {
    return null;
  }
}
