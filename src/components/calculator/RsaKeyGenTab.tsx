import { useState } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { modInverse } from '../../utils/bigint';
import { isPrimeMR } from '../../utils/testcases/core';
import { parseBigInt } from '../../utils/rsaCalc';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';

export function RsaKeyGenTab() {
  const [p, setP] = useState('');
  const [q, setQ] = useState('');
  const [e, setE] = useState('65537');
  const out = useCalculatorOutput({ category: 'calculator-rsa' });

  const handleKeyGen = () => {
    out.clear();
    const pn = parseBigInt(p);
    const qn = parseBigInt(q);
    const en = parseBigInt(e) || 65537n;

    if (pn === null || qn === null) {
      out.dispatchError('p and q must be valid numbers');
      return;
    }
    if (pn <= 1n || qn <= 1n) {
      out.dispatchError('p and q must be > 1');
      return;
    }
    if (en <= 0n) {
      out.dispatchError('e must be positive');
      return;
    }

    const n = pn * qn;
    const phi = (pn - 1n) * (qn - 1n);
    const d = modInverse(en, phi);
    const warns: string[] = [];
    if (!isPrimeMR(pn)) warns.push('warning: p is not prime (Miller-Rabin)');
    if (!isPrimeMR(qn)) warns.push('warning: q is not prime (Miller-Rabin)');
    if (pn === qn) warns.push('warning: p == q, so n is a square (trivially factorable)');

    let outputText = `n  = ${n}\n`;
    outputText += `phi = ${phi}\n`;
    outputText += d !== null ? `d  = ${d}` : 'd  = undefined (e and phi not coprime)';
    if (warns.length > 0) outputText += '\n' + warns.join('\n');
    out.dispatch(outputText, 'RSA Key Gen');
  };

  return (
    <Stack direction="vertical" gap={2}>
      <TextInput label="p (prime)" value={p} onChange={setP} width="100%" />
      <TextInput label="q (prime)" value={q} onChange={setQ} width="100%" />
      <TextInput label="e (public exponent)" value={e} onChange={setE} width="100%" />
      <Button
        label="Compute"
        variant="primary"
        width="100%"
        onClick={handleKeyGen}
        isDisabled={!p.trim() || !q.trim()}
      />
      {out.result && <ResultBox value={out.result} label="Generated RSA key material" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
