import type { Attack, AttackCategory } from '../types';

// Import all attacks (single import per file)
import { attack as fermat, generateTestcase as genFermat } from './fermat';
import { attack as wiener, generateTestcase as genWiener } from './wiener';
import { attack as bonehDurfee, generateTestcase as genBonehDurfee } from './boneh-durfee';
import { attack as ecm, generateTestcase as genEcm } from './ecm';
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

import { attack as simpleLattice, generateTestcase as genSimpleLattice } from './simple-lattice';
import { attack as partialD, generateTestcase as genPartialD } from './partial-d';
import { attack as partialPqBits, generateTestcase as genPartialPqBits } from './partial-pq-bits';
import { attack as smallCrtExp, generateTestcase as genSmallCrtExp } from './small-crt-exp';
import { attack as dpDqLeak, generateTestcase as genDpDqLeak } from './dp-dq-leak';
import { attack as linearlyRelatedPrimes, generateTestcase as genLinearlyRelatedPrimes } from './linearly-related-primes';
import { attack as dependentPrime, generateTestcase as genDependentPrime } from './dependent-prime';

import { attack as commonModulus, generateTestcase as genCommonModulus } from './common-modulus';
import { attack as hastad, generateTestcase as genHastad } from './hastad';
import { attack as franklinReiter, generateTestcase as genFranklinReiter } from './franklin-reiter';
import { attack as coppersmithShortPad, generateTestcase as genCoppersmithShortPad } from './coppersmith-short-pad';
import { attack as hastadLinearPad, generateTestcase as genHastadLinearPad } from './hastad-linear-pad';
import { attack as lsbOracle, generateTestcase as genLsbOracle } from './lsb-oracle';
import { attack as rsaCrtFault, generateTestcase as genRsaCrtFault } from './rsa-crt-fault';
import { attack as nonCoprimeExp, generateTestcase as genNonCoprimeExp } from './non-coprime-exp';
import { attack as cubeRootCrt, generateTestcase as genCubeRootCrt } from './cube-root-crt';
import { attack as commonFactor, generateTestcase as genCommonFactor } from './common-factor';
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
import { attack as parityOracle, generateTestcase as genParityOracle } from './parity-oracle';

import { attack as partialKeyExposure, generateTestcase as genPartialKeyExposure } from './partial-key-exposure';
import { attack as implicitKeyExposure, generateTestcase as genImplicitKeyExposure } from './implicit-key-exposure';
import { attack as relatedMessage, generateTestcase as genRelatedMessage } from './related-message';
import { attack as commonPrimeRsa, generateTestcase as genCommonPrimeRsa } from './common-prime-rsa';
import { attack as hastadBroadcast, generateTestcase as genHastadBroadcast } from './hastad-broadcast';

// Public exports
export const attacks: Attack[] = [
  fermat, wiener, bonehDurfee, ecm, ecm2, pollardP1, pollardRho, williamsP1,
  quadraticSieve, squfof, binaryPolyFactor, smallFraction, batchGcd, multiPrime,
  gimmickyPrimes, closePrime, noveltyPrimes,
  simpleLattice, partialD, partialPqBits, smallCrtExp, dpDqLeak,
  linearlyRelatedPrimes, dependentPrime,
  commonModulus, hastad, franklinReiter, coppersmithShortPad, hastadLinearPad,
  lsbOracle, rsaCrtFault, nonCoprimeExp, cubeRootCrt, commonFactor,
  homomorphicForgery, bleichenbacherSig,
  bleichenbacher, manger, biasedLsb,
  roca, nitros, factordbLookup, knownPlaintext, smallPublicExp,
  multiPrimeGcd, phiLeak, parityOracle,
  partialKeyExposure, implicitKeyExposure, relatedMessage,
  commonPrimeRsa, hastadBroadcast,
];

export const testcaseGenerators: Record<string, () => Record<string, string>> = {
  fermat: genFermat,
  wiener: genWiener,
  'boneh-durfee': genBonehDurfee,
  ecm: genEcm,
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
  hastad: genHastad,
  'franklin-reiter': genFranklinReiter,
  'coppersmith-short-pad': genCoppersmithShortPad,
  'hastad-linear-pad': genHastadLinearPad,
  'lsb-oracle': genLsbOracle,
  'rsa-crt-fault': genRsaCrtFault,
  'non-coprime-exp': genNonCoprimeExp,
  'cube-root-crt': genCubeRootCrt,
  'common-factor': genCommonFactor,
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
  'parity-oracle': genParityOracle,
  'partial-key-exposure': genPartialKeyExposure,
  'implicit-key-exposure': genImplicitKeyExposure,
  'related-message': genRelatedMessage,
  'common-prime-rsa': genCommonPrimeRsa,
  'hastad-broadcast': genHastadBroadcast,
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
