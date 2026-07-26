import { describe, expect, test } from 'bun:test';
import { modPow } from '../bigint';
import { bsgsSubgroup } from '../dhCrypto';

describe('bsgsSubgroup', () => {
  test('finds an exponent in giant-step range', () => {
    const x = bsgsSubgroup(4n, 2n, 23n, 11n);

    expect(x).toBe(6n);
    expect(modPow(4n, x!, 23n)).toBe(2n);
  });
});
