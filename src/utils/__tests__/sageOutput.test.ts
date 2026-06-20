import { describe, test, expect } from 'bun:test';
import { isActualSuccess } from '../sageOutput';

describe('isActualSuccess', () => {
  test('returns true for string containing =SUCCESS', () => {
    expect(isActualSuccess('result =SUCCESS')).toBe(true);
    expect(isActualSuccess('some output\n=SUCCESS')).toBe(true);
  });

  test('returns false for string containing =FAILED', () => {
    expect(isActualSuccess('result =FAILED')).toBe(false);
    expect(isActualSuccess('some output\n=FAILED')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isActualSuccess('')).toBe(false);
  });

  test('returns false for string with no tokens', () => {
    expect(isActualSuccess('just some output')).toBe(false);
    expect(isActualSuccess('n = 12345')).toBe(false);
  });

  test('returns false for whitespace-only string', () => {
    expect(isActualSuccess('   ')).toBe(false);
    expect(isActualSuccess('\n\n')).toBe(false);
  });

  test('handles whitespace around tokens', () => {
    expect(isActualSuccess('  =SUCCESS  ')).toBe(true);
    expect(isActualSuccess('  =FAILED  ')).toBe(false);
    expect(isActualSuccess('\t=SUCCESS\n')).toBe(true);
  });

  test('uses last occurrence when both tokens present', () => {
    expect(isActualSuccess('=SUCCESS\n=FAILED')).toBe(false);
    expect(isActualSuccess('=FAILED\n=SUCCESS')).toBe(true);
  });
});
