import type { Attack, AttackCategory } from '../types';
import { extractPQ, reportFactor } from '../utils/factordb';
import { modInverse, modPow } from '../utils/bigint';
import { bigIntToBytes } from '../utils/converters';

// Import all attacks (single import per file)
import { attack as bonehDurfee, generateTestcase as genBonehDurfee } from './boneh-durfee';
import { attack as ecm2, generateTestcase as genEcm2 } from './ecm2';
import { attack as pollardP1, generateTestcase as genPollardP1 } from './pollard-p1';
import { attack as pollardRho, generateTestcase as genPollardRho } from './pollard-rho';
import { attack as williamsP1, generateTestcase as genWilliamsP1 } from './williams-p1';
import { attack as quadraticSieve, generateTestcase as genQuadraticSieve } from './quadratic-sieve';
import { attack as squfof, generateTestcase as genSqufof } from './squfof';
import { attack as binaryPolyFactor, generateTestcase as genBinaryPolyFactor } from './binary-poly-factor';
import { attack as smallFraction, generateTestcase as genSmallFraction } from './small-fraction';
import { attack as batchGcd, generateTestcase as genBatchGcd } from './batch-gcd';
import { attack as multiPrime, generateTestcase as genMultiPrime } from './multi-prime';
import { attack as gimmickyPrimes, generateTestcase as genGimmickyPrimes } from './gimmicky-primes';
import { attack as closePrime, generateTestcase as genClosePrime } from './close-prime';
import { attack as noveltyPrimes, generateTestcase as genNoveltyPrimes } from './novelty-primes';
import { attack as franklinReiterRelatedMessage, generateTestcase as genFranklinReiterRelatedMessage } from './related-message';

import { attack as simpleLattice, generateTestcase as genSimpleLattice } from './simple-lattice';
import { attack as partialD, generateTestcase as genPartialD } from './partial-d';
import { attack as partialPqBits, generateTestcase as genPartialPqBits } from './partial-pq-bits';
import { attack as smallCrtExp, generateTestcase as genSmallCrtExp } from './small-crt-exp';
import { attack as dpDqLeak, generateTestcase as genDpDqLeak } from './dp-dq-leak';
import { attack as linearlyRelatedPrimes, generateTestcase as genLinearlyRelatedPrimes } from './linearly-related-primes';
import { attack as dependentPrime, generateTestcase as genDependentPrime } from './dependent-prime';

import { attack as commonModulus, generateTestcase as genCommonModulus } from './common-modulus';

import { attack as coppersmithShortPad, generateTestcase as genCoppersmithShortPad } from './coppersmith-short-pad';
import { attack as hastadLinearPad, generateTestcase as genHastadLinearPad } from './hastad-linear-pad';
import { attack as lsbOracle, generateTestcase as genLsbOracle } from './lsb-oracle';
import { attack as rsaCrtFault, generateTestcase as genRsaCrtFault } from './rsa-crt-fault';
import { attack as nonCoprimeExp, generateTestcase as genNonCoprimeExp } from './non-coprime-exp';

import { attack as homomorphicForgery, generateTestcase as genHomomorphicForgery } from './homomorphic-forgery';
import { attack as bleichenbacherSig, generateTestcase as genBleichenbacherSig } from './bleichenbacher-sig';

import { attack as bleichenbacher, generateTestcase as genBleichenbacher } from './bleichenbacher';
import { attack as manger, generateTestcase as genManger } from './manger';
import { attack as biasedLsb, generateTestcase as genBiasedLsb } from './biased-lsb';

import { attack as roca, generateTestcase as genRoca } from './roca';
import { attack as nitros, generateTestcase as genNitros } from './nitros';
import { attack as factordbLookup, generateTestcase as genFactordbLookup } from './factordb-lookup';
import { attack as knownPlaintext, generateTestcase as genKnownPlaintext } from './known-plaintext';
import { attack as smallPublicExp, generateTestcase as genSmallPublicExp } from './small-public-exp';
import { attack as multiPrimeGcd, generateTestcase as genMultiPrimeGcd } from './multi-prime-gcd';
import { attack as phiLeak, generateTestcase as genPhiLeak } from './phi-leak';


import { attack as partialKeyExposure, generateTestcase as genPartialKeyExposure } from './partial-key-exposure';
import { attack as implicitKeyExposure, generateTestcase as genImplicitKeyExposure } from './implicit-key-exposure';

import { attack as commonPrimeRsa, generateTestcase as genCommonPrimeRsa } from './common-prime-rsa';
import { attack as hastadBroadcast, generateTestcase as genHastadBroadcast } from './hastad-broadcast';
import { attack as euler, generateTestcase as genEuler } from './euler';
import { attack as pollardStrassen, generateTestcase as genPollardStrassen } from './pollard-strassen';
import { attack as pisanoPeriod, generateTestcase as genPisanoPeriod } from './pisano-period';

// Public exports
export const attacks: Attack[] = [
  bonehDurfee, ecm2, pollardP1, pollardRho, williamsP1,
  quadraticSieve, squfof, binaryPolyFactor, smallFraction, batchGcd, multiPrime,
  gimmickyPrimes, closePrime, noveltyPrimes, euler, pollardStrassen, pisanoPeriod,
  simpleLattice, partialD, partialPqBits, smallCrtExp, dpDqLeak,
  linearlyRelatedPrimes, dependentPrime,
  commonModulus, coppersmithShortPad, hastadLinearPad,
  lsbOracle, rsaCrtFault, nonCoprimeExp,
  homomorphicForgery, bleichenbacherSig,
  bleichenbacher, manger, biasedLsb,
  roca, nitros, factordbLookup, knownPlaintext, smallPublicExp,
  multiPrimeGcd, phiLeak,
  partialKeyExposure,   implicitKeyExposure, franklinReiterRelatedMessage,
  commonPrimeRsa, hastadBroadcast,
];

export const testcaseGenerators: Record<string, () => Record<string, string>> = {
  'boneh-durfee': genBonehDurfee,
  ecm2: genEcm2,
  'pollard-p1': genPollardP1,
  'pollard-rho': genPollardRho,
  'williams-p1': genWilliamsP1,
  'quadratic-sieve': genQuadraticSieve,
  squfof: genSqufof,
  'binary-poly-factor': genBinaryPolyFactor,
  'small-fraction': genSmallFraction,
  'batch-gcd': genBatchGcd,
  'multi-prime': genMultiPrime,
  'gimmicky-primes': genGimmickyPrimes,
  'close-prime': genClosePrime,
  'novelty-primes': genNoveltyPrimes,
  'simple-lattice': genSimpleLattice,
  'partial-d': genPartialD,
  'partial-pq-bits': genPartialPqBits,
  'small-crt-exp': genSmallCrtExp,
  'dp-dq-leak': genDpDqLeak,
  'linearly-related-primes': genLinearlyRelatedPrimes,
  'dependent-prime': genDependentPrime,
  'common-modulus': genCommonModulus,
  'coppersmith-short-pad': genCoppersmithShortPad,
  'hastad-linear-pad': genHastadLinearPad,
  'lsb-oracle': genLsbOracle,
  'rsa-crt-fault': genRsaCrtFault,
  'non-coprime-exp': genNonCoprimeExp,
  'franklin-reiter-related-message': genFranklinReiterRelatedMessage,
  'homomorphic-forgery': genHomomorphicForgery,
  'bleichenbacher-sig': genBleichenbacherSig,
  bleichenbacher: genBleichenbacher,
  manger: genManger,
  'biased-lsb': genBiasedLsb,
  roca: genRoca,
  nitros: genNitros,
  'factordb-lookup': genFactordbLookup,
  'known-plaintext': genKnownPlaintext,
  'small-public-exp': genSmallPublicExp,
  'multi-prime-gcd': genMultiPrimeGcd,
  'phi-leak': genPhiLeak,
  'partial-key-exposure': genPartialKeyExposure,
  'implicit-key-exposure': genImplicitKeyExposure,

  'common-prime-rsa': genCommonPrimeRsa,
  'hastad-broadcast': genHastadBroadcast,
  euler: genEuler,
  'pollard-strassen': genPollardStrassen,
  'pisano-period': genPisanoPeriod,
};

export const CATEGORIES = [
  'Factorization',
  'Partial Key / Lattice',
  'Message / Protocol',
  'Oracle',
  'Advanced',
] as const satisfies readonly AttackCategory[];

export const attacksByCategory = new Map<string, Attack[]>();
for (const cat of CATEGORIES) {
  attacksByCategory.set(cat, attacks.filter(a => a.category === cat));
}

/**
 * Submit p,q to FactorDB if the result contains extractable p,q values.
 * Works for any attack that factors n (Factorization, Lattice, Advanced, etc.)
 * as long as n is provided in the input params.
 */
export function submitToFactorDB(
  _attack: Attack,
  result: string,
  n: string | undefined,
  notify: (msg: string, severity?: 'success' | 'error' | 'info') => void,
) {
  const pq = extractPQ(result);
  if (pq && n) {
    reportFactor(n, [pq.p, pq.q]).then(
      resp => notify(resp === 'Already fully factored' ? 'Already known to FactorDB' : 'Submitted to FactorDB', 'info'),
      () => notify('Failed to submit to FactorDB', 'error'),
    );
  }
}

/**
 * If a factorization attack found p,q and the user provided e and c,
 * compute the decrypted message and return a human-readable string.
 * Returns null if decryption isn't possible.
 */
export function autoDecrypt(
  attack: Attack,
  params: Record<string, string>,
  resultStdout: string,
): string | null {
  if (!attacksByCategory.get('Factorization')?.includes(attack)) return null;
  const pq = extractPQ(resultStdout);
  if (!pq || !params.e || !params.c || !params.n) return null;
  try {
    const e = BigInt(params.e);
    const c = BigInt(params.c);
    const n = BigInt(params.n);
    const p = BigInt(pq.p);
    const q = BigInt(pq.q);
    const phi = (p - 1n) * (q - 1n);
    const d = modInverse(e, phi);
    if (!d) return null;
    const m = modPow(c, d, n);
    const bytes = bigIntToBytes(m);
    try {
      const text = new TextDecoder().decode(bytes);
      return text;
    } catch {
      // Not valid UTF-8 — return hex
      return m.toString(16);
    }
  } catch {
    return null;
  }
}
