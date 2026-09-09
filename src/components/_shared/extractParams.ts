import { detectFormat, parsePEM } from '../../utils/converters';

// Categorized parameter names for key=value extraction
const kvParamNames = [
  // Core RSA parameters
  'n', 'e', 'c', 'd', 'p', 'q', 'dp', 'dq', 'qinv',
  // Lattice / partial key
  'dLow', 'nearp', 'bound', 'B2', 'B', 'a', 'b', 'e1', 'e2', 'c1', 'c2',
  // Broadcast / related messages
  'ciphertexts', 'hash_hex', 'target_m', 'sig_valid', 'sig_faulty', 'k_phi', 'n1', 'n2', 'k',
  // Advanced / Coppersmith
  'base', 'bitOffset', 'bitLength', 'num_primes', 'knownBits', 'bitPosition',
  // Oracle / protocol
  'oracle_responses', 'oracle_runs', 'phi', 'moduli_list', 'n_values',
  'pairs', 'triples', 'oracle_pairs', 'known_prefix', 'p_msb', 'leak', 'unknown_bits',
];
const kvRegex = new RegExp(`(?<name>${kvParamNames.join('|')})\\s*=\\s*(?<value>[0-9a-fA-FxX,\\-]+(?:[ \\t]*\\r?\\n[ \\t]*(?![A-Za-z_][A-Za-z0-9_]*\\s*=)[0-9a-fA-FxX,\\-]+)*)`, 'g');

// Common JSON key aliases for structured input
const KEY_ALIASES: Record<string, string> = {
  ct: 'c', ciphertext: 'c', cipher: 'c', cipher_text: 'c',
  modulus: 'n', mod: 'n', exponent: 'e', exp: 'e',
  plaintext: 'm', plain: 'm', message: 'm', msg: 'm',
};

export function extractParams(input: string): Record<string, string> {
  const trimmed = input.trim();
  const params: Record<string, string> = {};
  let match;
  while ((match = kvRegex.exec(input)) !== null) {
    if (match.groups?.name && match.groups?.value) {
      params[match.groups.name] = match.groups.value.replace(/[ \t\r]/g, '');
    }
  }
  // JSON structured input support ({ "n": "0x...", "e": "65537", "ct": "..." })
  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof json === 'object' && !Array.isArray(json) && json !== null) {
      for (const [key, value] of Object.entries(json)) {
        const mapped = KEY_ALIASES[key.toLowerCase()] || key;
        if (typeof value === 'string' && !params[mapped]) {
          params[mapped] = value.replace(/\s/g, '');
        } else if (typeof value === 'number' && !params[mapped]) {
          params[mapped] = value.toString();
        }
      }
    }
  } catch { /* not JSON */ }
  const detectedFmt = detectFormat(trimmed);
  if (detectedFmt === 'hex' && !params.n) {
    let hex = trimmed.replace(/\s/g, '');
    if (!/^0x/i.test(hex)) hex = '0x' + hex;
    params.n = hex;
  } else if (detectedFmt === 'decimal' && !params.n) {
    params.n = trimmed;
  }
  const pemResult = parsePEM(input);
  if (pemResult) {
    params.n = pemResult.n;
    if (!params.e) params.e = pemResult.e;
  }
  return params;
}
