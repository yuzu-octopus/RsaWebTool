import { useState } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { modPow } from '../../utils/bigint';
import { parseBigInt, toHex, toAscii, isPrintableAscii } from '../../utils/rsaCalc';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';

export function RsaEncryptTab() {
  const [m, setM] = useState('');
  const [n, setN] = useState('');
  const [e, setE] = useState('');
  const out = useCalculatorOutput({ category: 'calculator-rsa' });

  const handleEncrypt = () => {
    out.clear();
    const mn = parseBigInt(m);
    const nn = parseBigInt(n);
    const en = parseBigInt(e) || 65537n;

    if (mn === null || nn === null) {
      out.dispatchError('m and n must be valid numbers (e defaults to 65537)');
      return;
    }
    if (nn <= 1n) {
      out.dispatchError('n must be > 1');
      return;
    }
    if (en <= 0n) {
      out.dispatchError('e must be positive');
      return;
    }
    if (mn < 0n || mn >= nn) {
      out.dispatchError('m must be >= 0 and < n');
      return;
    }

    const c = modPow(mn, en, nn);
    let outputText = `c = ${c}\n`;
    outputText += `c (hex) = ${toHex(c)}\n`;
    if (isPrintableAscii(c)) {
      outputText += `c (ascii) = ${toAscii(c)}`;
    }
    out.dispatch(outputText, 'RSA Encrypt');
  };

  return (
    <Stack direction="vertical" gap={2}>
      <TextInput label="m (message)" value={m} onChange={setM} width="100%" />
      <TextInput label="n (modulus)" value={n} onChange={setN} width="100%" />
      <TextInput label="e (public exponent)" value={e} onChange={setE} width="100%" />
      <Button
        label="Encrypt"
        variant="primary"
        width="100%"
        onClick={handleEncrypt}
        isDisabled={!m.trim() || !n.trim()}
      />
      {out.result && <ResultBox value={out.result} label="RSA ciphertext" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
