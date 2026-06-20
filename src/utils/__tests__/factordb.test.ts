import { describe, test, expect } from 'bun:test';
import { extractPQ } from '../factordb';

describe('extractPQ', () => {
  test('extracts p and q from standard format', () => {
    const result = extractPQ('p = 123\nq = 456');
    expect(result).toEqual({ p: '123', q: '456' });
  });

  test('returns null when p is missing', () => {
    expect(extractPQ('q = 456')).toBeNull();
  });

  test('returns null when q is missing', () => {
    expect(extractPQ('p = 123')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(extractPQ('')).toBeNull();
  });

  test('returns null for arbitrary output with no p or q', () => {
    expect(extractPQ('some random output\nnothing here')).toBeNull();
  });

  test('handles large numbers', () => {
    const bigP = '13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084096';
    const bigQ = '340282366920938463463374607431768211537';
    const output = `p = ${bigP}\nq = ${bigQ}`;
    const result = extractPQ(output);
    expect(result).toEqual({ p: bigP, q: bigQ });
  });

  test('handles extra whitespace around equals sign', () => {
    const result = extractPQ('p =   123\nq  =  456');
    expect(result).toEqual({ p: '123', q: '456' });
  });

  test('ignores non-matching lines', () => {
    const output = 'some info\nn = 999\np = 123\nextra line\nq = 456\ndone';
    const result = extractPQ(output);
    expect(result).toEqual({ p: '123', q: '456' });
  });
});
