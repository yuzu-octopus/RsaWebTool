import { useState, useCallback, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Banner } from '@astryxdesign/core/Banner';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import { CURVES, parseMsg } from '../../utils/eccCurves';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';

export function ECCSignVerifyTab() {
  const [curve, setCurve] = useState('secp256k1');
  const [op, setOp] = useState<'sign' | 'verify'>('sign');
  const [msg, setMsg] = useState('');
  const [privHex, setPrivHex] = useState('');
  const [pubHex, setPubHex] = useState('');
  const [sigR, setSigR] = useState('');
  const [sigS, setSigS] = useState('');
  const out = useCalculatorOutput({ category: 'calculator-ecc' });

  const ci = useMemo(() => CURVES.find(c => c.id === curve && c.hasSign)?.instance, [curve]);

  const handleRun = useCallback(() => {
    out.clear();
    try {
      if (!ci) throw new Error('Curve does not support signing');
      if (!msg.trim()) throw new Error('Message is required');
      const mbytes = parseMsg(msg);

      if (op === 'sign') {
        if (!privHex.trim()) throw new Error('Private key is required');
        const priv = hexToBytes(privHex.replace(/\s/g, ''));
        const sigBytes = ci.sign(mbytes, priv);
        const sig = ci.Signature.fromBytes(sigBytes);
        const pub = ci.getPublicKey(priv);
        const result = `Signature r: 0x${sig.r.toString(16)}\nSignature s: 0x${sig.s.toString(16)}\n\nDER hex: ${sig.toHex('der')}\nCompact hex: ${sig.toHex('compact')}\n\nPublic key: ${bytesToHex(pub)}\nValid: signature verified internally ✓`;
        out.dispatch(result, 'ECC Sign/Verify');
      } else {
        if (!pubHex.trim()) throw new Error('Public key is required');
        const pub = hexToBytes(pubHex.replace(/\s/g, ''));
        const r = BigInt(sigR.trim() || '0');
        const s = BigInt(sigS.trim() || '0');
        if (r === 0n || s === 0n) throw new Error('r and s are required (hex)');
        const sigObj = new ci.Signature(r, s);
        const valid = ci.verify(sigObj.toBytes(), mbytes, pub);
        const result = `Verification: ${valid ? '✓ VALID' : '✗ INVALID'}\nr: 0x${r.toString(16)}\ns: 0x${s.toString(16)}`;
        out.dispatch(result, 'ECC Sign/Verify');
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [ci, op, msg, privHex, pubHex, sigR, sigS, out]);

  const signCurves = CURVES.filter(c => c.hasSign);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector
        label="Curve"
        options={signCurves.map(c => ({ value: c.id, label: c.label }))}
        value={curve}
        onChange={v => { setCurve(v); out.clear(); }}
        width="100%"
      />
      <SegmentedControl label="Operation" value={op} onChange={v => setOp(v as 'sign' | 'verify')}>
        <SegmentedControlItem value="sign" label="Sign" />
        <SegmentedControlItem value="verify" label="Verify" />
      </SegmentedControl>
      <TextInput label="Message (text or hex)" value={msg} onChange={setMsg} placeholder="Message to sign / verify" width="100%" />
      {op === 'sign' && (
        <TextInput label="Private key (hex)" value={privHex} onChange={setPrivHex} placeholder="Hex private key" width="100%" />
      )}
      {op === 'verify' && (
        <>
          <TextInput label="Public key (hex)" value={pubHex} onChange={setPubHex} placeholder="Hex public key" width="100%" />
          <Stack direction="horizontal" gap={1}>
            <TextInput label="r (hex)" value={sigR} onChange={setSigR} placeholder="Signature r" width="100%" />
            <TextInput label="s (hex)" value={sigS} onChange={setSigS} placeholder="Signature s" width="100%" />
          </Stack>
        </>
      )}
      <Button
        label={op === 'sign' ? 'Sign' : 'Verify'}
        variant="primary"
        width="100%"
        onClick={handleRun}
      />
      {out.result && <ResultBox value={out.result} label="Output" variant="compact" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
