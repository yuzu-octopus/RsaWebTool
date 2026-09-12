import { useState, useCallback, useRef} from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../../hooks/useSageMath';
import { ResultBox } from './_shared/ResultBox';
import { AttackExplanationPanel } from './AttackExplanationPanel';
import { SharedAttackPanel, type SharedAttackField } from '../attacks/SharedAttackPanel';
import { DH_ATTACKS, DH_ATTACK_EXPLANATIONS } from '../../data/attackExplanations/dh';
import {
  SMOOTH_BOUND,
  RFC2412_GROUP1,
  buildSageDlpCode,
  crt,
  dlogPrimePower,
  factorTrial,
  generatePrivateKey,
  isAllZeroX25519Peer,
  isProbablePrime,
  limLeeRecover,
  parseGenerator,
  parseHex,
  peerKeyIssues,
  pollardKangaroo,
  validateDsaParams,
} from '../../utils/dhCrypto';
import { isActualSuccess } from '../../utils/sageOutput';
import { modPow } from '../../utils/bigint';

/**
 * Recover x modulo each confirmed prime power of p-1 via digit lifting,
 * appending transcript lines. The unfactored remainder is reported (with a
 * Miller-Rabin label) and routed to Sage — never fed to BSGS as "prime".
 */
function recoverSmoothResidues(p: bigint, g: bigint, y: bigint, lines: string[]): {
  remainders: bigint[];
  moduli: bigint[];
} {
  const pMinus1 = p - 1n;
  const { factored, remainder } = factorTrial(pMinus1, SMOOTH_BOUND);
  lines.push(`Trial division of p-1 up to 10^5 (prime powers preserved):`);
  if (factored.length === 0) {
    lines.push('  No prime factors ≤ 10^5 found.');
  } else {
    for (const { prime: pr, exp: e } of factored) lines.push(`  ${pr.toString()}^${e}`);
  }
  if (remainder > 1n) {
    const kind = isProbablePrime(remainder) ? 'large prime factor' : 'composite with unknown factors';
    lines.push(`  Unfactored remainder: ${remainder} (${kind}) — p-1 is not smooth up to 10^5;`);
    lines.push('  full recovery needs the Sage general-dlp entry.');
  }
  const remainders: bigint[] = [];
  const moduli: bigint[] = [];
  for (const { prime: pr, exp: e } of factored) {
    const q = pr ** BigInt(e);
    const gPrime = modPow(g, pMinus1 / q, p);
    const yPrime = modPow(y, pMinus1 / q, p);
    if (gPrime === 1n) {
      lines.push(`  Subgroup order ${pr.toString()}^${e}: g' = 1, skipping`);
      continue;
    }
    const x = dlogPrimePower(gPrime, yPrime, p, pr, e);
    if (x !== null) {
      lines.push(`  Subgroup order ${pr.toString()}^${e}: x ≡ ${x.toString()} (mod ${q.toString()})`);
      remainders.push(x);
      moduli.push(q);
    } else {
      lines.push(
        `  Subgroup order ${pr.toString()}^${e}: DLP failed (no solution, or order exceeds the in-browser BSGS budget)`,
      );
    }
  }
  return { remainders, moduli };
}

/** CRT-combine transcript tail: hedged — partial key unless moduli cover p-1. */
function pushCrtTail(p: bigint, g: bigint, y: bigint, remainders: bigint[], moduli: bigint[], lines: string[]): void {
  lines.push('');
  if (remainders.length === 0) {
    lines.push('No residues recovered.');
    return;
  }
  const xReconstructed = crt(remainders, moduli);
  if (xReconstructed === null) {
    lines.push('CRT reconstruction failed');
    return;
  }
  lines.push(`CRT-combined key (mod smooth part): ${xReconstructed.toString()}`);
  const verify = modPow(g, xReconstructed, p);
  lines.push(`Verification: g^x mod p = ${verify.toString()}`);
  lines.push(`Target y: ${y.toString()}`);
  lines.push(`Match: ${verify === y ? '✓' : '✗ (partial recovery — key known only mod the smooth part)'}`);
}

/* ─── Per-attack sample generators (one-liners for the shared panel) ─── */

function generateSmoothTriple(): Record<string, string> {
  // p = 257 (Fermat prime, p-1 = 2^8), g = 3 is primitive mod 257.
  // x in [1,127] keeps y = 3^x clear of the rejected y = 1 / y = p-1 values.
  const x = 1n + BigInt(Math.floor(Math.random() * 127));
  return { p: '101', g: '3', y: modPow(3n, x, 257n).toString(16) };
}

function generateLimLeeDemo(): Record<string, string> {
  // The runner simulates a fresh static victim key; y is ignored.
  return { p: '101', g: '3' };
}

function generateBoundedDemo(): Record<string, string> {
  // Skip x with 3^x = 1 or p-1 mod 257 — peer validation rejects those.
  let x = 1 + Math.floor(Math.random() * ((1 << 20) - 1));
  if (x % 256 === 0 || x % 256 === 128) x += 1;
  return { p: '101', g: '3', y: modPow(3n, BigInt(x), 257n).toString(16) };
}

function generateX25519Demo(): Record<string, string> {
  return { y: '00'.repeat(32) };
}

function generateDsaDemo(): Record<string, string> {
  // p = 23, q = 11 divides p-1, g = 2 with 2^11 = 1 mod 23: fully VALID.
  return { p: '17', g: '2', y: 'b' };
}

/* ─── Shared-panel definitions: fields + generate + source (runs stay in place) ─── */

const DH_PGY_FIELDS: SharedAttackField[] = [
  { name: 'p', label: 'p (prime, hex)', placeholder: 'Prime modulus' },
  { name: 'g', label: 'g (decimal)', placeholder: 'Generator' },
  { name: 'y', label: 'y (Alice public, hex)', placeholder: 'y = g^a mod p' },
];

const DH_SMOOTH_SOURCE = `${recoverSmoothResidues.toString()}\n\n${pushCrtTail.toString()}`;

interface DHAttackDef {
  fields: SharedAttackField[];
  generate: () => Record<string, string>;
  source: string;
  sourceLanguage: string;
}

const DH_DEFS: Record<string, DHAttackDef> = {
  'small-subgroup': {
    fields: DH_PGY_FIELDS,
    generate: generateSmoothTriple,
    source: DH_SMOOTH_SOURCE,
    sourceLanguage: 'typescript',
  },
  'pohlig-hellman': {
    fields: DH_PGY_FIELDS,
    generate: generateSmoothTriple,
    source: DH_SMOOTH_SOURCE,
    sourceLanguage: 'typescript',
  },
  'lim-lee': {
    fields: [
      { name: 'p', label: 'p (prime, hex)', placeholder: 'Prime modulus' },
      { name: 'g', label: 'g (decimal)', placeholder: 'Generator' },
    ],
    generate: generateLimLeeDemo,
    source: DH_ATTACK_EXPLANATIONS['lim-lee'].python,
    sourceLanguage: 'python',
  },
  'bounded-dlp': {
    fields: DH_PGY_FIELDS,
    generate: generateBoundedDemo,
    source: DH_ATTACK_EXPLANATIONS['bounded-dlp'].python,
    sourceLanguage: 'python',
  },
  'x25519-weak-key': {
    fields: [
      { name: 'y', label: 'peer key u (32 bytes, hex)', placeholder: 'Peer u-coordinate' },
    ],
    generate: generateX25519Demo,
    source: DH_ATTACK_EXPLANATIONS['x25519-weak-key'].python,
    sourceLanguage: 'python',
  },
  'logjam-downgrade': {
    fields: [],
    generate: () => ({}),
    source: DH_ATTACK_EXPLANATIONS['logjam-downgrade'].python,
    sourceLanguage: 'python',
  },
  'dsa-params': {
    fields: [
      { name: 'p', label: 'p (prime, hex)', placeholder: 'Prime modulus' },
      { name: 'g', label: 'g (decimal)', placeholder: 'Generator' },
      { name: 'y', label: 'q (subgroup order, hex)', placeholder: 'Subgroup order' },
    ],
    generate: generateDsaDemo,
    source: DH_ATTACK_EXPLANATIONS['dsa-params'].python,
    sourceLanguage: 'python',
  },
  'general-dlp': {
    fields: DH_PGY_FIELDS,
    generate: generateSmoothTriple,
    source: DH_ATTACK_EXPLANATIONS['general-dlp'].python,
    sourceLanguage: 'python',
  },
};

export function DHAttacksTab({ selectedAttack }: { selectedAttack?: string } = {}) {
  const [attack, setAttack] = useState(selectedAttack ?? 'small-subgroup');
  const runningRef = useRef(false);
  const out = useCalculatorOutput({ category: 'calculator-dh' });
  const { execute } = useSageMath();
  const def = DH_DEFS[attack] ?? DH_DEFS['small-subgroup'];
  const explanation = DH_ATTACK_EXPLANATIONS[attack] ?? DH_ATTACK_EXPLANATIONS['small-subgroup'];

  const handleRun = useCallback(async (vals: Record<string, string>) => {
    if (runningRef.current) return;
    runningRef.current = true;
    out.clear();
    // Panel-owned field values, mapped onto the legacy input names the
    // per-attack runners below were written against.
    const pVal = vals.p ?? '';
    const gVal = vals.g ?? '';
    const yVal = vals.y ?? '';
    try {
      if (attack === 'x25519-weak-key') {
        const peer = yVal.trim().replace(/\s/g, '').replace(/^0x/i, '');
        if (isAllZeroX25519Peer(yVal)) {
          let reason = 'all-zero u-coordinate';
          if (!/^[0-9a-fA-F]*$/.test(peer)) reason = 'malformed peer key (not hex)';
          else if (peer.length !== 64) reason = `malformed peer key (need 32 bytes hex, got ${peer.length} hex chars)`;
          out.dispatch(
            `X25519 peer key: REJECT (${reason})\nRFC 7748 section 6.1 MAY-level minimum enforced; low-order-point checks (e.g. u = 1) are stricter SHOULD-level hygiene.\nMETHOD=TYPESCRIPT`,
            'DH Attack: x25519-weak-key',
          );
        } else {
          out.dispatch(
            'X25519 peer key: ACCEPT (passes the all-zero check)\nNote: full hygiene also rejects known low-order points (SHOULD-level, not checked here).\nMETHOD=TYPESCRIPT',
            'DH Attack: x25519-weak-key',
          );
        }
        return;
      }
      if (attack === 'logjam-downgrade') {
        const bits = RFC2412_GROUP1.p.toString(2).length;
        out.dispatch(
          [
            'Logjam / export downgrade (informational — no attack runs).',
            '',
            `Built-in breakable group: RFC 2412 Group 1 (${bits}-bit MODP, g = 2) — DEMO ONLY.`,
            `Prime head: 0x${RFC2412_GROUP1.p.toString(16).slice(0, 32)}…`,
            '',
            'How Logjam worked: force export-grade DHE, run one NFS precomputation',
            'per shared group, then cheap per-connection descent per session (amortised).',
            'Defence: reject groups below the NIST 112-bit floor (2048-bit MODP,',
            'SP 800-57); prefer ECDHE or fresh named groups.',
          ].join('\n') + '\nMETHOD=INFO',
          'DH Attack: logjam-downgrade',
        );
        return;
      }
      const p = parseHex(pVal);
      const g = parseGenerator(gVal);
      if (p <= 2n) throw new Error('Invalid group modulus p (need an integer > 2; p/y are hex, g is decimal)');
      if (!isProbablePrime(p)) {
        throw new Error(
          'p fails the Miller-Rabin primality check — this demo needs a prime modulus (see the composite-modulus note in the Explanation tab)',
        );
      }
      if (g <= 1n || g >= p) throw new Error('Generator g must satisfy 1 < g < p');
      const y = parseHex(yVal);
      if (attack !== 'lim-lee' && attack !== 'dsa-params') {
        const issues = peerKeyIssues(y, p);
        if (issues.length > 0) throw new Error(issues.join('; '));
      }

      switch (attack) {
        case 'small-subgroup': {
          const lines: string[] = [];
          lines.push(`p-1 = ${(p - 1n).toString()}`);
          lines.push('');
          const { remainders, moduli } = recoverSmoothResidues(p, g, y, lines);
          pushCrtTail(p, g, y, remainders, moduli, lines);
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: small-subgroup');
          break;
        }
        case 'pohlig-hellman': {
          const lines: string[] = [];
          lines.push(`p-1 = ${(p - 1n).toString()}`);
          lines.push('');
          const { remainders, moduli } = recoverSmoothResidues(p, g, y, lines);
          pushCrtTail(p, g, y, remainders, moduli, lines);
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: pohlig-hellman');
          break;
        }
        case 'lim-lee': {
          // Simulation: the y field is ignored — a fresh static key stands in
          // for the victim's long-term secret (preconditions in the panel).
          let xStatic = generatePrivateKey() % (p - 1n);
          if (xStatic === 0n) xStatic = 1n;
          const result = limLeeRecover(p, g, xStatic, SMOOTH_BOUND);
          const lines = [
            'Lim–Lee active recovery (simulated confirmation oracle).',
            'Preconditions: static victim key, chosen peer keys accepted, oracle present.',
            '',
            ...result.transcript,
          ];
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: lim-lee');
          break;
        }
        case 'bounded-dlp': {
          const a = 0n;
          const b = 1n << 20n;
          const lines = [
            `Pollard kangaroo demo: searching x in [0, 2^20) for g^x = y mod p.`,
            'Precondition: the key must actually lie in this interval.',
          ];
          const x = pollardKangaroo(g, y, p, a, b);
          if (x === null) {
            lines.push('Not found: x is outside the demo bound (or the walk budget missed it).');
          } else {
            lines.push(`Found x = ${x.toString()}`);
            lines.push(`Verification: g^x mod p = ${modPow(g, x, p).toString()} (target ${y.toString()})`);
          }
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: bounded-dlp');
          break;
        }
        case 'dsa-params': {
          // q is read from the y field (label switches for this attack).
          const q = parseHex(yVal);
          const issues = validateDsaParams(p, q, g);
          const qBits = q > 0n ? q.toString(2).length : 0;
          const lines = [
            `p (${p.toString(2).length}-bit, Miller-Rabin checked), q (${qBits}-bit, from the y field), g as entered.`,
            ...(issues.length === 0
              ? ['DSA parameters VALID: q prime, q divides p-1, g^q = 1 mod p.']
              : issues.map(issue => `Issue: ${issue}`)),
            `FIPS 186 subgroup floor: q ≥ 224 bits ${qBits >= 224 ? '(✓)' : `(✗ — ${qBits} bits)`}.`,
            'Never trust server-supplied or trapdoored parameters without these checks.',
          ];
          out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: dsa-params');
          break;
        }
        case 'general-dlp': {
          // p/y travel as canonical hex, g as decimal; the multiplicative
          // group operation is '*' (Sage names the operation, not pow).
          const code = buildSageDlpCode(p, g, y);
          const note = 'Pre-flight: discrete_log(y, g, operation=\'*\') over F_p^*; p/y as hex, g as decimal.';
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (!sageResult.success) {
            out.dispatchError(sageResult.error || 'SageCell execution failed');
          } else if (!isActualSuccess(sageResult.stdout)) {
            out.dispatchError(`Sage discrete_log reported failure (TOKEN=FAILED):\n${note}\n${sageResult.stdout}`);
          } else {
            out.dispatch(`${note}\n${sageResult.stdout}\nMETHOD=SAGEMATHCELL`, 'DH Attack: general-dlp');
          }
          break;
        }
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    } finally {
      runningRef.current = false;
    }
  }, [attack, execute, out]);

  return (
    <Stack direction="vertical" gap={2}>
      {!selectedAttack && (
        <Selector
          label="Attack"
          options={DH_ATTACKS.map(a => ({ value: a.value, label: a.label }))}
          value={attack}
          onChange={setAttack}
          width="100%"
        />
      )}
      <SharedAttackPanel
        key={attack}
        title={explanation.title}
        description={explanation.description}
        explanationNode={<AttackExplanationPanel data={explanation} />}
        fields={def.fields}
        generateLabel="Generate"
        onGenerate={def.generate}
        onRun={(vals) => { void handleRun(vals); }}
        sourceCode={def.source}
        sourceLanguage={def.sourceLanguage}
        resultNode={(
          <>
            {out.result && <ResultBox value={out.result} label="Result" variant="medium" />}
            {out.error && <Banner status="error" title={out.error} />}
          </>
        )}
      />
    </Stack>
  );
}
