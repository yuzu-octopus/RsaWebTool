import { useState, useCallback, useRef } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, Button, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { inputSx } from '../../styles/shared';
import { primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../../hooks/useSageMath';
import { ResultBox } from './_shared/ResultBox';
import { AttackExplanationPanel } from './AttackExplanationPanel';
import { DH_ATTACKS, DH_ATTACK_EXPLANATIONS } from '../../data/attackExplanations/dh';
import { factorSmall, factorPowers, bsgsSubgroup, crt, parseHex } from '../../utils/dhCrypto';
import { modPow } from '../../utils/bigint';

export function DHAttacksTab() {
  const [attack, setAttack] = useState('small-subgroup');
  const [pVal, setPVal] = useState('');
  const [gVal, setGVal] = useState('');
  const [yVal, setYVal] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const runningRef = useRef(false);
  const out = useCalculatorOutput({ category: 'calculator-dh' });
  const { execute } = useSageMath();

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    out.clear();
    try {
      const p = parseHex(pVal);
      const g = parseHex(gVal);
      const y = parseHex(yVal);
      if (p <= 1n) throw new Error('Invalid prime p');
      if (g <= 0n || g >= p) throw new Error('Generator g must be in (1, p-1)');
      if (y <= 0n || y >= p) throw new Error('Public key y must be in (1, p-1)');

      switch (attack) {
        case 'small-subgroup': {
          const lines: string[] = [];
          const pMinus1 = p - 1n;
          lines.push(`p-1 = ${pMinus1.toString()}`);
          lines.push('');

          const factors = factorSmall(pMinus1, 100_000);
          lines.push(`Small factors of p-1 (trial division up to 10^5):`);
          if (factors.length === 0) {
            lines.push('  No small factors found (p-1 has no smooth component < 10^5)');
          } else {
            lines.push(`  Found: [${factors.join(', ')}]`);
          }
          lines.push('');

          const remainders: bigint[] = [];
          const moduli: bigint[] = [];
          for (const r of factors) {
            const gPrime = modPow(g, pMinus1 / r, p);
            const yPrime = modPow(y, pMinus1 / r, p);
            if (gPrime === 1n) {
              lines.push(`  Subgroup order r=${r}: g' = 1, skipping`);
              continue;
            }
            const x = bsgsSubgroup(gPrime, yPrime, p, r);
            if (x !== null) {
              lines.push(`  Subgroup order r=${r}: log = ${x}`);
              remainders.push(x);
              moduli.push(r);
            } else {
              lines.push(`  Subgroup order r=${r}: DLP failed (x >= r?)`);
            }
          }
          lines.push('');

          if (remainders.length > 0) {
            const xReconstructed = crt(remainders, moduli);
            if (xReconstructed !== null) {
              lines.push(`CRT-reconstructed private key: ${xReconstructed}`);
              const verify = modPow(g, xReconstructed, p);
              lines.push(`Verification: g^x mod p = ${verify}`);
              lines.push(`Target y: ${y}`);
              lines.push(`Match: ${verify === y ? '✓' : '✗ (key may need more factors)'}`);
              out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: small-subgroup');
            } else {
              throw new Error('CRT reconstruction failed');
            }
          } else {
            out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: small-subgroup');
          }
          break;
        }
        case 'pohlig-hellman': {
          const lines: string[] = [];
          const pMinus1 = p - 1n;
          lines.push(`p-1 = ${pMinus1.toString()}`);
          lines.push('');

          const primePowers = factorPowers(pMinus1, 100_000);
          lines.push('Factorisation of p-1 (trial division up to 10^5):');
          for (const { prime: pr, exp: e } of primePowers) {
            lines.push(`  ${pr.toString()}^${e}`);
          }
          lines.push('');

          const remainders: bigint[] = [];
          const moduli: bigint[] = [];
          for (const { prime: pr, exp: e } of primePowers) {
            const q = pr ** BigInt(e);
            const gQ = modPow(g, pMinus1 / q, p);
            const yQ = modPow(y, pMinus1 / q, p);
            if (gQ === 1n) {
              lines.push(`  Prime power ${pr}^${e}: g' = 1, skipping`);
              continue;
            }
            // Precompute powers for BSGS in subgroup of order q
            const x = bsgsSubgroup(gQ, yQ, p, q);
            if (x !== null) {
              lines.push(`  Prime power ${pr}^${e}: x ≡ ${x} (mod ${q})`);
              remainders.push(x);
              moduli.push(q);
            } else {
              lines.push(`  Prime power ${pr}^${e}: DLP failed`);
            }
          }
          lines.push('');

          if (remainders.length > 0) {
            const xReconstructed = crt(remainders, moduli);
            if (xReconstructed !== null) {
              lines.push(`CRT-reconstructed private key: ${xReconstructed}`);
              const verify = modPow(g, xReconstructed, p);
              lines.push(`Verification: g^x mod p = ${verify}`);
              lines.push(`Target y: ${y}`);
              lines.push(`Match: ${verify === y ? '✓' : '✗ (key may need more factors)'}`);
              out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: pohlig-hellman');
            } else {
              throw new Error('CRT reconstruction failed');
            }
          } else {
            out.dispatch(lines.join('\n') + '\nMETHOD=TYPESCRIPT', 'DH Attack: pohlig-hellman');
          }
          break;
        }
        case 'general-dlp': {
          const pClean = pVal.trim().replace(/\s/g, '');
          const pHex = pClean.startsWith('0x') ? pClean : '0x' + pClean;
          const gDec = gVal.trim().replace(/\s/g, '');
          const yClean = yVal.trim().replace(/\s/g, '');
          const yHex = yClean.startsWith('0x') ? yClean : '0x' + yClean;

          const code = `p = Integer(${pHex})
g = Mod(${gDec}, p)
y = Mod(${yHex}, p)
out = []
out.append(f"p = {p}")
out.append(f"g = {g}")
out.append(f"y = {y}")
out.append("")
try:
    x = discrete_log(y, g, operation='pow')
    out.append(f"Private key x = {x}")
    verify = power_mod(Integer(${gDec}), x, p)
    out.append(f"Verification: g^x mod p = {verify}")
    out.append(f"Match: {verify == Integer(${yHex})}")
    print('\\\\n'.join(out)); print('TOKEN=SUCCESS')
except Exception as e:
    out.append(f"discrete_log failed: {e}")
    print('\\\\n'.join(out)); print('TOKEN=FAILED')`;
          const sageResult = await execute(code, DEFAULT_SAGE_TIMEOUT);
          if (sageResult.success) {
            out.dispatch(sageResult.stdout + '\nMETHOD=SAGEMATHCELL', 'DH Attack: general-dlp');
          } else {
            out.dispatchError(sageResult.error || 'SageCell execution failed');
          }
          break;
        }
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, [attack, pVal, gVal, yVal, execute, out]);

  return (
    <Box>
      <FormControl fullWidth disabled={isRunning} sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>Attack</InputLabel>
        <Select value={attack} label="Attack" onChange={e => setAttack(e.target.value)}>
          {DH_ATTACKS.map(a => (<MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>))}
        </Select>
      </FormControl>

      <Box component="fieldset" disabled={isRunning} sx={{ border: 0, m: 0, p: 0, minWidth: 0, pointerEvents: isRunning ? 'none' : 'auto' }}>
        {DH_ATTACK_EXPLANATIONS[attack] && <AttackExplanationPanel data={DH_ATTACK_EXPLANATIONS[attack]} />}

        <TextField fullWidth label="p (prime, hex)" value={pVal} onChange={e => setPVal(e.target.value)}
          variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Prime modulus" spellCheck={false} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField fullWidth label="g (decimal)" value={gVal} onChange={e => setGVal(e.target.value)}
            variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="Generator" spellCheck={false} />
          <TextField fullWidth label="y (Alice public, hex)" value={yVal} onChange={e => setYVal(e.target.value)}
            variant="outlined" sx={{ ...inputSx, mb: 2 }} placeholder="y = g^a mod p" spellCheck={false} />
        </Box>
      </Box>

      <Button variant="contained" startIcon={<PlayArrow />} onClick={() => { void run(); }} disabled={isRunning} fullWidth sx={primaryBtnSx}>
        {isRunning ? 'Running attack…' : 'Run Attack'}
      </Button>
      {isRunning && (
        <Typography role="status" aria-live="polite" sx={{ color: draculaColors.comment, mt: 1, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>
          Running attack…
        </Typography>
      )}

      {out.result && <Box sx={{ mt: 2 }}><ResultBox value={out.result} label="Result" variant="medium" /></Box>}
      {out.error && (
        <Typography sx={{ color: draculaColors.red, mt: 2, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>
          {out.error}
        </Typography>
      )}
    </Box>
  );
}
