import { useState, useCallback, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Banner } from '@astryxdesign/core/Banner';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import {
  CURVES,
  parseMsg,
  hexToBytesStrict,
  parseHexField,
  curveOrder,
  validateSigRange,
  isHighS,
  ecdsaSignWithK,
} from '../../utils/eccCurves';
import { bytesToHex } from '@noble/curves/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';

export function ECCSignVerifyTab() {
  const [curve, setCurve] = useState('secp256k1');
  const [op, setOp] = useState<'sign' | 'verify'>('sign');
  const [msg, setMsg] = useState('');
  const [privHex, setPrivHex] = useState('');
  const [pubHex, setPubHex] = useState('');
  const [sigR, setSigR] = useState('');
  const [sigS, setSigS] = useState('');
  const [sigDer, setSigDer] = useState('');
  const [nonceK, setNonceK] = useState('');
  const out = useCalculatorOutput({ category: 'calculator-ecc' });

  const entry = useMemo(() => CURVES.find(c => c.id === curve), [curve]);
  const ci = entry?.instance;
  const ed = entry?.edInstance;
  const isEd = ed !== undefined;

  const handleRun = useCallback(() => {
    out.clear();
    try {
      if (!msg.trim()) throw new Error('Message is required');
      const mbytes = parseMsg(msg);
      // Noble signs/verifies with prehash:true, i.e. plain ECDSA-SHA256
      // over the encoded message bytes (hex input decodes to raw bytes).
      const h = BigInt('0x' + bytesToHex(sha256(mbytes)));

      if (op === 'sign') {
        if (!privHex.trim()) throw new Error('Private key is required');
        const priv = hexToBytesStrict(privHex, 'private key');
        if (ed) {
          const pub = ed.getPublicKey(priv);
          const sig = ed.sign(mbytes, priv);
          const valid = ed.verify(sig, mbytes, pub);
          // Ed25519 nonces are deterministic (RFC 8032) — there is no
          // random-k reuse class, and S is verified strictly (S+L rejected).
          const result = `h = int(SHA256(msg)) = 0x${h.toString(16)}\n`
            + `Signature (64-byte hex): ${bytesToHex(sig)}\n\nPublic key: ${bytesToHex(pub)}\n`
            + `Verify: ${valid ? 'MATCH' : 'MISMATCH'}\n\nNote: Ed25519 enforces strict verification — non-canonical S >= L (e.g. S+L malleations accepted by ZIP-215 verifiers) is rejected here.`;
          out.dispatch(result, 'ECC Sign/Verify');
          return;
        }
        if (!ci) throw new Error('Curve does not support signing');
        const n = curveOrder(ci);
        const d = BigInt('0x' + bytesToHex(priv));
        if (d < 1n || d >= n) throw new Error('Private key out of range [1, n-1]');
        const pub = ci.getPublicKey(priv);
        if (nonceK.trim()) {
          const k = parseHexField(nonceK, 'nonce k');
          const { r, s } = ecdsaSignWithK(ci, h, d, k);
          const sigObj = new ci.Signature(r, s);
          const valid = ci.verify(sigObj.toBytes(), mbytes, pub);
          const high = isHighS(s, n);
          const result = `h = int(SHA256(msg)) = 0x${h.toString(16)}\nk = 0x${k.toString(16)} (explicit — feed h,k into the Nonce Reuse tab)\n\n`
            + `Signature r: 0x${r.toString(16)}\nSignature s: 0x${s.toString(16)}${high ? ' (high-S)' : ' (low-S)'}\n\n`
            + `DER hex: ${sigObj.toHex('der')}\nCompact hex: ${sigObj.toHex('compact')}\n\nPublic key: ${bytesToHex(pub)}\n`
            + `Verify (default low-S policy): ${valid ? 'MATCH' : 'MISMATCH'}`
            + (high && !valid ? '\nNote: high-S signature — mathematically valid but rejected by noble default lowS:true (BIP-146 style); verifies with lowS:false.' : '');
          out.dispatch(result, 'ECC Sign/Verify');
        } else {
          const sigBytes = ci.sign(mbytes, priv);
          const sig = ci.Signature.fromBytes(sigBytes);
          const valid = ci.verify(sigBytes, mbytes, pub);
          const high = isHighS(sig.s, n);
          const result = `h = int(SHA256(msg)) = 0x${h.toString(16)}\n`
            + `k: deterministic per RFC 6979 (not exposed — enter an explicit k below for reproducible nonce demos)\n\n`
            + `Signature r: 0x${sig.r.toString(16)}\nSignature s: 0x${sig.s.toString(16)}${high ? ' (high-S)' : ' (low-S)'}\n\n`
            + `DER hex: ${sig.toHex('der')}\nCompact hex: ${sig.toHex('compact')}\n\nPublic key: ${bytesToHex(pub)}\n`
            + `Verify: ${valid ? 'MATCH' : 'MISMATCH'}`
            + '\n\nTo verify: paste the DER hex into the verify-side DER field, or r/s into the r/s fields.';
          out.dispatch(result, 'ECC Sign/Verify');
        }
      } else {
        if (!pubHex.trim()) throw new Error('Public key is required');
        const pub = hexToBytesStrict(pubHex, 'public key');
        if (ed) {
          if (!sigDer.trim()) throw new Error('Signature is required (64-byte hex)');
          const sig = hexToBytesStrict(sigDer, 'signature');
          if (sig.length !== 64) throw new Error(`Ed25519 signatures are 64 bytes (got ${sig.length})`);
          const valid = ed.verify(sig, mbytes, pub);
          const result = `Verification: ${valid ? '✓ VALID' : '✗ INVALID'}\nSignature: ${bytesToHex(sig)}`;
          out.dispatch(result, 'ECC Sign/Verify');
          return;
        }
        if (!ci) throw new Error('Curve does not support signing');
        const n = curveOrder(ci);
        let r: bigint;
        let s: bigint;
        let via: string;
        if (sigDer.trim()) {
          const sigObj = ci.Signature.fromBytes(hexToBytesStrict(sigDer, 'DER signature'), 'der');
          r = sigObj.r;
          s = sigObj.s;
          via = 'DER';
        } else {
          r = parseHexField(sigR, 'r');
          s = parseHexField(sigS, 's');
          via = 'r/s';
        }
        validateSigRange(r, s, n);
        const sigObj = new ci.Signature(r, s);
        const valid = ci.verify(sigObj.toBytes(), mbytes, pub);
        const high = isHighS(s, n);
        const result = `Verification (${via}): ${valid ? '✓ VALID' : '✗ INVALID'}\nr: 0x${r.toString(16)}\ns: 0x${s.toString(16)}${high ? ' (high-S)' : ''}`
          + (high && !valid ? '\nNote: high-S signature — rejected by the default low-S policy, not by the curve math. The malleated twin (r, n-s) is low-S and verifies.' : '');
        out.dispatch(result, 'ECC Sign/Verify');
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [ci, ed, op, msg, privHex, pubHex, sigR, sigS, sigDer, nonceK, out]);

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
      <TextInput label="Message (text or even-length hex)" value={msg} onChange={setMsg} placeholder="Message to sign / verify" width="100%" />
      {op === 'sign' && (
        <>
          <TextInput label="Private key (hex, 0x allowed)" value={privHex} onChange={setPrivHex} placeholder="Hex private key" width="100%" />
          {!isEd && (
            <TextInput label="Nonce k (hex, optional — explicit k exposes h,k for attack demos)" value={nonceK} onChange={setNonceK} placeholder="Leave empty for RFC 6979 deterministic k" width="100%" />
          )}
        </>
      )}
      {op === 'verify' && (
        <>
          <TextInput label="Public key (hex, 0x allowed)" value={pubHex} onChange={setPubHex} placeholder="Hex public key" width="100%" />
          {isEd ? (
            <TextInput label="Signature (64-byte hex)" value={sigDer} onChange={setSigDer} placeholder="Ed25519 signature" width="100%" />
          ) : (
            <>
              <TextInput label="DER signature (hex, optional — takes precedence over r/s)" value={sigDer} onChange={setSigDer} placeholder="Paste DER hex from the sign output" width="100%" />
              <Stack direction="horizontal" gap={1}>
                <TextInput label="r (hex)" value={sigR} onChange={setSigR} placeholder="Signature r" width="100%" />
                <TextInput label="s (hex)" value={sigS} onChange={setSigS} placeholder="Signature s" width="100%" />
              </Stack>
            </>
          )}
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
