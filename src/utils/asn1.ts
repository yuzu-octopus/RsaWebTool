/**
 * Minimal ASN.1 DER decoder for RSA key parsing.
 * Browser-only, zero dependencies — pure Uint8Array + BigInt.
 */

export interface Asn1Node {
  tag: number;
  tagClass: number; // 0 = universal
  length: number;
  value: Uint8Array;
  children?: Asn1Node[];
}

/** Universal tag constants */
export const TAG = {
  SEQUENCE: 0x30,
  INTEGER: 0x02,
  OCTET_STRING: 0x04,
  OID: 0x06,
  BIT_STRING: 0x03,
  NULL: 0x05,
  SET: 0x31,
} as const;

/**
 * Read DER length from offset.
 * Returns [length, newOffset].
 */
export function decodeLength(data: Uint8Array, offset: number): [number, number] {
  if (offset >= data.length) {
    throw new Error(`DER length: offset ${offset} out of range (data length ${data.length})`);
  }
  const first = data[offset];
  if (first < 0x80) {
    // Short form
    return [first, offset + 1];
  }
  // Long form
  const numBytes = first & 0x7f;
  if (numBytes === 0) {
    throw new Error('DER: indefinite length encoding not supported');
  }
  if (numBytes > 4) {
    throw new Error(`DER: length too large (${numBytes} bytes)`);
  }
  let length = 0;
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | data[offset + 1 + i];
  }
  return [length, offset + 1 + numBytes];
}

/**
 * Decode a top-level DER structure into an Asn1Node tree.
 */
export function decodeDer(data: Uint8Array): Asn1Node {
  return decodeNode(data, 0)[0];
}

function decodeNode(data: Uint8Array, offset: number): [Asn1Node, number] {
  if (offset >= data.length) {
    throw new Error(`DER: unexpected end at offset ${offset}`);
  }

  const tag = data[offset];
  const tagClass = (tag >> 6) & 0x03;
  const constructed = !!(tag & 0x20);
  offset++;

  const [length, newOffset] = decodeLength(data, offset);
  offset = newOffset;

  if (length < 0 || offset + length > data.length) {
    throw new Error(`DER: length ${length} exceeds data bounds (offset ${offset}, data length ${data.length})`);
  }

  const value = data.slice(offset, offset + length);
  offset += length;

  const node: Asn1Node = { tag, tagClass, length, value };

  // Recursively decode children for constructed tags
  if (constructed && tagClass === 0) {
    const children: Asn1Node[] = [];
    let childOffset = 0;
    while (childOffset < value.length) {
      const [child, nextOffset] = decodeNode(value, childOffset);
      children.push(child);
      childOffset = nextOffset;
    }
    if (children.length > 0) {
      node.children = children;
    }
  }

  return [node, offset];
}

/**
 * Decode a SEQUENCE node into its child nodes.
 */
export function parseSequence(node: Asn1Node): Asn1Node[] {
  if (!node.children || node.children.length === 0) {
    // If children weren't decoded, do it now
    if (node.value.length > 0) {
      const children: Asn1Node[] = [];
      let offset = 0;
      while (offset < node.value.length) {
        const [child, nextOffset] = decodeNode(node.value, offset);
        children.push(child);
        offset = nextOffset;
      }
      return children;
    }
    return [];
  }
  return node.children;
}

/**
 * Parse a DER INTEGER (two's complement) into a BigInt.
 */
export function parseInteger(node: Asn1Node): bigint {
  if (node.tag !== TAG.INTEGER) {
    throw new Error(`Expected INTEGER tag 0x02, got 0x${node.tag.toString(16)}`);
  }

  const bytes = node.value;
  if (bytes.length === 0) {
    return 0n;
  }

  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }

  // Two's complement for negative values
  if ((bytes[0] & 0x80) !== 0) {
    const bitLength = BigInt(bytes.length * 8);
    result = result - (1n << bitLength);
  }

  return result;
}

/**
 * Parse an OID node into dotted notation string.
 */
export function parseOid(node: Asn1Node): string {
  if (node.tag !== TAG.OID) {
    throw new Error(`Expected OID tag 0x06, got 0x${node.tag.toString(16)}`);
  }

  const bytes = node.value;
  if (bytes.length < 1) {
    throw new Error('OID value too short');
  }

  // First byte encodes first two components: 40*val1 + val2
  const parts: number[] = [];
  parts.push(Math.floor(bytes[0] / 40));
  parts.push(bytes[0] % 40);

  // Remaining bytes use base-128 encoding
  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i] & 0x7f);
    if ((bytes[i] & 0x80) === 0) {
      parts.push(value);
      value = 0;
    }
  }

  return parts.join('.');
}

/**
 * Parse a BIT STRING node, stripping the leading unused-bits byte.
 */
export function parseBitString(node: Asn1Node): Uint8Array {
  if (node.tag !== TAG.BIT_STRING) {
    throw new Error(`Expected BIT STRING tag 0x03, got 0x${node.tag.toString(16)}`);
  }

  const bytes = node.value;
  if (bytes.length < 1) {
    throw new Error('BIT STRING value too short');
  }

  // First byte is unused bits count — skip it
  return bytes.slice(1);
}
