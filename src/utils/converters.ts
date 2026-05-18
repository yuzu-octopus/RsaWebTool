export function hexToBytes(hex: string): string {
  try {
    hex = hex.replace(/^0x/, '').replace(/\s/g, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const bytes: string[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push('0x' + hex.slice(i, i + 2));
    }
    return bytes.join(' ');
  } catch {
    return 'Error: Invalid hex string';
  }
}

export function hexToAscii(hex: string): string {
  try {
    hex = hex.replace(/^0x/, '').replace(/\s/g, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.slice(i, i + 2), 16);
      result += String.fromCharCode(code);
    }
    return result;
  } catch {
    return 'Error: Invalid hex string';
  }
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
