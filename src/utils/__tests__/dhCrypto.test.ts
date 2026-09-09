import { describe, expect, test } from 'bun:test';
import { modPow } from '../bigint';
import {
  BSGS_ITERATION_BUDGET,
  RFC2412_GROUP1,
  bsgsSubgroup,
  buildSageDlpCode,
  crt,
  dlogPrimePower,
  factorPowers,
  factorSmall,
  factorTrial,
  isAllZeroX25519Peer,
  isProbablePrime,
  limLeeRecover,
  parseGenerator,
  peerKeyIssues,
  pollardKangaroo,
  validateDsaParams,
} from '../dhCrypto';

describe('bsgsSubgroup', () => {
  test('finds an exponent in giant-step range', () => {
    const x = bsgsSubgroup(4n, 2n, 23n, 11n);

    expect(x).toBe(6n);
    expect(modPow(4n, x!, 23n)).toBe(2n);
  });

  test('returns null for non-positive subgroup order (no throw)', () => {
    expect(bsgsSubgroup(4n, 2n, 23n, 0n)).toBeNull();
    expect(bsgsSubgroup(4n, 2n, 23n, -3n)).toBeNull();
  });
});

describe('factorPowers legacy contract vs factorTrial honesty', () => {
  test('factorPowers keeps the ECC-compatible residual entry; DH uses factorTrial', () => {
    // 22 = 2 * 11 with bound 10: legacy callers (eccCurves toy orders, where
    // any survivor is provably prime) still get the remainder appended.
    expect(factorPowers(22n, 10)).toEqual([
      { prime: 2n, exp: 1 },
      { prime: 11n, exp: 1 },
    ]);
    // DH paths use factorTrial, which keeps the remainder separate.
    expect(factorSmall(22n, 10)).toEqual([2n]);
  });
});

describe('crt residue normalisation', () => {
  test('normalises negative remainders like crtRSA (x in [0, M))', () => {
    expect(crt([-1n], [5n])).toBe(4n);
    expect(crt([2n, 3n], [3n, 5n])).toBe(8n);
  });
});

describe('bsgsSubgroup iteration budget', () => {
  test('huge orders return null fast instead of hanging', () => {
    const r = (1n << 64n) + 13n;
    expect(BSGS_ITERATION_BUDGET).toBeLessThan(1000000n);
    const start = Date.now();
    expect(bsgsSubgroup(2n, 8n, 18446744073709551629n, r)).toBeNull();
    expect(Date.now() - start).toBeLessThan(2000);
  });
});

describe('isProbablePrime', () => {
  test('accepts primes, rejects composites and non-positive input', () => {
    expect(isProbablePrime(2n)).toBe(true);
    expect(isProbablePrime(3n)).toBe(true);
    expect(isProbablePrime(23n)).toBe(true);
    expect(isProbablePrime((1n << 127n) - 1n)).toBe(true);
    expect(isProbablePrime(0n)).toBe(false);
    expect(isProbablePrime(1n)).toBe(false);
    expect(isProbablePrime(-7n)).toBe(false);
    expect(isProbablePrime(4n)).toBe(false);
    expect(isProbablePrime(9n)).toBe(false);
    expect(isProbablePrime(561n)).toBe(false);
  });
});

describe('factorTrial remainder tracking', () => {
  test('separates confirmed factors from the unfactored remainder', () => {
    expect(factorTrial(22n, 10)).toEqual({ factored: [{ prime: 2n, exp: 1 }], remainder: 11n });
    expect(factorTrial(72n, 100)).toEqual({
      factored: [
        { prime: 2n, exp: 3 },
        { prime: 3n, exp: 2 },
      ],
      remainder: 1n,
    });
  });

  test('guards 0/1 without hanging', () => {
    expect(factorTrial(0n, 10)).toEqual({ factored: [], remainder: 0n });
    expect(factorTrial(1n, 10)).toEqual({ factored: [], remainder: 1n });
    expect(factorSmall(0n, 10)).toEqual([]);
  });

  test('safe-prime p-1 leaves a prime remainder for Sage routing', () => {
    // p = 23 is a safe prime: p-1 = 2 * 11, remainder 11 stays separate.
    const { factored, remainder } = factorTrial(22n, 100_000);
    expect(factored).toEqual([{ prime: 2n, exp: 1 }]);
    expect(remainder).toBe(11n);
    expect(isProbablePrime(remainder)).toBe(true);
  });
});

describe('parseGenerator', () => {
  test('parses decimal, accepts optional 0x hex', () => {
    expect(parseGenerator('10')).toBe(10n);
    expect(parseGenerator('0x10')).toBe(16n);
    expect(parseGenerator('  42 ')).toBe(42n);
    expect(parseGenerator('')).toBe(0n);
  });
});

describe('dlogPrimePower digit lifting', () => {
  test('recovers x mod 3^2 where rad-only CRT would stop at mod 6', () => {
    // p = 19, p-1 = 2 * 3^2, g = 2 primitive, x = 7, y = 14.
    const gQ = modPow(2n, 18n / 9n, 19n);
    const yQ = modPow(14n, 18n / 9n, 19n);
    expect(dlogPrimePower(gQ, yQ, 19n, 3n, 2)).toBe(7n);
  });

  test('full key recovery via prime powers + crt', () => {
    const p = 19n;
    const g = 2n;
    const x = 7n;
    const y = modPow(g, x, p);
    const { factored } = factorTrial(p - 1n, 100);
    const remainders: bigint[] = [];
    const moduli: bigint[] = [];
    for (const { prime, exp } of factored) {
      const order = prime ** BigInt(exp);
      const gQ = modPow(g, (p - 1n) / order, p);
      const yQ = modPow(y, (p - 1n) / order, p);
      const residue = dlogPrimePower(gQ, yQ, p, prime, exp);
      expect(residue).not.toBeNull();
      remainders.push(residue!);
      moduli.push(order);
    }
    expect(crt(remainders, moduli)).toBe(7n);
  });
});

describe('peerKeyIssues', () => {
  test('rejects degenerate and out-of-range peer keys', () => {
    expect(peerKeyIssues(1n, 23n)).not.toEqual([]);
    expect(peerKeyIssues(22n, 23n)).not.toEqual([]);
    expect(peerKeyIssues(0n, 23n)).not.toEqual([]);
    expect(peerKeyIssues(23n, 23n)).not.toEqual([]);
    expect(peerKeyIssues(5n, 23n)).toEqual([]);
  });
});

describe('limLeeRecover', () => {
  test('recovers a static key with an oracle transcript', () => {
    const result = limLeeRecover(19n, 2n, 7n, 100);
    expect(result.combined).toBe(7n);
    expect(result.remainder).toBe(1n);
    expect(result.transcript.join('\n')).toContain('oracle');
  });
});

describe('pollardKangaroo', () => {
  test('finds a bounded discrete log', () => {
    const y = modPow(5n, 123n, 23n);
    const x = pollardKangaroo(5n, y, 23n, 100n, 200n);
    expect(x).not.toBeNull();
    expect(x! >= 100n && x! < 200n).toBe(true);
    expect(modPow(5n, x!, 23n)).toBe(y);
  });

  test('refuses empty and over-cap intervals', () => {
    expect(pollardKangaroo(5n, 8n, 23n, 50n, 50n)).toBeNull();
    expect(pollardKangaroo(2n, 8n, 23n, 0n, 1n << 30n)).toBeNull();
  });
});

describe('validateDsaParams', () => {
  test('accepts a consistent (p, q, g) triple and rejects bad g', () => {
    expect(validateDsaParams(23n, 11n, 4n)).toEqual([]);
    // 5^11 = 22 mod 23, so 5 is outside the order-11 subgroup.
    expect(validateDsaParams(23n, 11n, 5n)).not.toEqual([]);
    expect(validateDsaParams(23n, 7n, 4n)).not.toEqual([]);
  });
});

describe('isAllZeroX25519Peer', () => {
  test('rejects the all-zero u-coordinate, accepts nonzero keys', () => {
    expect(isAllZeroX25519Peer('00'.repeat(32))).toBe(true);
    expect(isAllZeroX25519Peer(`01${'00'.repeat(31)}`)).toBe(false);
    expect(isAllZeroX25519Peer('short')).toBe(true);
  });
});

describe('RFC2412_GROUP1', () => {
  test('is the 768-bit breakable demo group (not 512-bit)', () => {
    expect(RFC2412_GROUP1.p.toString(2).length).toBe(768);
    expect(RFC2412_GROUP1.g).toBe(2n);
    expect(RFC2412_GROUP1.name).toContain('BREAKABLE');
  });
});

describe('buildSageDlpCode', () => {
  test('uses multiplicative operation and real newline join', () => {
    const code = buildSageDlpCode(23n, 5n, 10n);
    expect(code).toContain("operation='*'");
    expect(code).not.toContain("operation='pow'");
    expect(code).toContain("Mod(5, p)");
    expect(code).toContain("'\\n'.join(out)");
    expect(code).not.toContain("'\\\\n'");
    expect(code).toContain('TOKEN=SUCCESS');
    expect(code).toContain('TOKEN=FAILED');
  });
});
