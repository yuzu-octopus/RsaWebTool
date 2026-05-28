import { detectFormat } from './converters';

export function parseBigInt(input: string): bigint | null {
  const trimmed = input.replace(/\s/g, '');
  if (!trimmed) return null;
  try {
    const fmt = detectFormat(trimmed);
    if (fmt === 'hex') return BigInt('0x' + trimmed.replace(/^0x/, ''));
    if (fmt === 'base64') {
      const raw = atob(trimmed);
      const hex = Array.from(raw).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return BigInt('0x' + hex);
    }
    if (fmt === 'ascii') {
      const hex = Array.from(trimmed).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return BigInt('0x' + hex);
    }
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

export function toHex(n: bigint): string {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  return '0x' + hex;
}

export function toAscii(n: bigint): string {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    result += code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
  }
  return result;
}

export function isPrintableAscii(n: bigint): boolean {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code < 32 || code > 126) return false;
  }
  return true;
}
