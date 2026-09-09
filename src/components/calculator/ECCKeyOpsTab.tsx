import { useState, useCallback, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Banner } from '@astryxdesign/core/Banner';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import { CURVES, KEY_OPS, curveForOp, edForOp, hexToBytesStrict, type KeyOp } from '../../utils/eccCurves';
import { x25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '@noble/curves/utils.js';

const OP_LABELS: Record<KeyOp, string> = {
  generate: 'Generate Keypair',
  pubkey: 'Public from Private',
  ecdh: 'ECDH Shared Secret',
};

function availOpsFor(curve: string): KeyOp[] {
  // Ed25519 is signing-only (no ECDH); everything else supports all three.
  if (curve === 'ed25519') return KEY_OPS.filter(o => o !== 'ecdh');
  return [...KEY_OPS];
}

export function ECCKeyOpsTab() {
  const [curve, setCurve] = useState('secp256k1');
  const [op, setOp] = useState<KeyOp>('generate');
  const [privHex, setPrivHex] = useState('');
  const [peerPubHex, setPeerPubHex] = useState('');
  const out = useCalculatorOutput({ category: 'calculator-ecc' });

  const isX25519 = curve === 'curve25519';

  const handleRun = useCallback(() => {
    out.clear();
    try {
      if (op === 'generate') {
        if (isX25519) {
          const kp = x25519.keygen();
          const result = `Private key (hex): ${bytesToHex(kp.secretKey)}\nPublic key (hex): ${bytesToHex(kp.publicKey)}`;
          out.dispatch(result, 'ECC Key Ops');
        } else {
          const ed = edForOp(curve);
          if (ed) {
            const kp = ed.keygen();
            const result = `Private key (hex): ${bytesToHex(kp.secretKey)}\nPublic key (hex): ${bytesToHex(kp.publicKey)}\n\nNote: Ed25519 is signing-only — no ECDH (use Curve25519/X25519 for key exchange).`;
            out.dispatch(result, 'ECC Key Ops');
          } else {
            const ci = curveForOp(curve);
            if (!ci) throw new Error('Unknown curve');
            const kp = ci.keygen();
            const pubComp = ci.getPublicKey(kp.secretKey, true);
            const pubUnc = ci.getPublicKey(kp.secretKey, false);
            const result = `Private key (hex): ${bytesToHex(kp.secretKey)}\n\nPublic key (compressed): ${bytesToHex(pubComp)}\nPublic key (uncompressed): ${bytesToHex(pubUnc)}`;
            out.dispatch(result, 'ECC Key Ops');
          }
        }
        return;
      }

      if (op === 'pubkey') {
        if (!privHex.trim()) throw new Error('Private key is required');
        const priv = hexToBytesStrict(privHex, 'private key');
        if (isX25519) {
          const pub = x25519.getPublicKey(priv);
          out.dispatch(`Public key (hex): ${bytesToHex(pub)}`, 'ECC Key Ops');
          return;
        }
        const ed = edForOp(curve);
        if (ed) {
          const pub = ed.getPublicKey(priv);
          out.dispatch(`Public key (hex): ${bytesToHex(pub)}`, 'ECC Key Ops');
          return;
        }
        const ci = curveForOp(curve);
        if (!ci) throw new Error('Unknown curve');
        const pubComp = ci.getPublicKey(priv, true);
        const pubUnc = ci.getPublicKey(priv, false);
        const result = `Public key (compressed): ${bytesToHex(pubComp)}\nPublic key (uncompressed): ${bytesToHex(pubUnc)}`;
        out.dispatch(result, 'ECC Key Ops');
        return;
      }

      if (op === 'ecdh') {
        if (edForOp(curve)) throw new Error('Ed25519 is signing-only — switch to Curve25519 (X25519) or a Weierstrass curve for ECDH');
        if (!privHex.trim() || !peerPubHex.trim()) throw new Error('Private key and peer public key required');
        const priv = hexToBytesStrict(privHex, 'private key');
        const peer = hexToBytesStrict(peerPubHex, 'peer public key');
        let shared: Uint8Array;
        if (isX25519) {
          // Noble rejects low-order peer points here (see the X25519 twist demo
          // in Attacks); feed the raw output through a KDF before using it as a key.
          shared = x25519.getSharedSecret(priv, peer);
        } else {
          const ci = curveForOp(curve);
          if (!ci) throw new Error('Unknown curve');
          shared = ci.getSharedSecret(priv, peer);
        }
        const result = `Shared secret (hex): ${bytesToHex(shared)}`;
        out.dispatch(result, 'ECC Key Ops');
      }
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [curve, op, privHex, peerPubHex, isX25519, out]);

  const availOps = useMemo(() => availOpsFor(curve), [curve]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector
        label="Curve"
        options={CURVES.map(c => ({ value: c.id, label: c.label }))}
        value={curve}
        onChange={v => {
          setCurve(v);
          // Reset a now-unavailable operation (e.g. ECDH -> Ed25519) so the
          // control and the executed op can never desync on curve switch.
          if (!availOpsFor(v).includes(op)) setOp('generate');
          out.clear();
        }}
        width="100%"
      />
      <SegmentedControl label="Key operation" value={op} onChange={v => setOp(v as KeyOp)}>
        {availOps.map(o => (
          <SegmentedControlItem key={o} value={o} label={OP_LABELS[o]} />
        ))}
      </SegmentedControl>
      {(op === 'pubkey' || op === 'ecdh') && (
        <TextInput label="Private key (hex, 0x allowed)" value={privHex} onChange={setPrivHex} placeholder="Hex private key" width="100%" />
      )}
      {op === 'ecdh' && (
        <TextInput label="Peer public key (hex, 0x allowed)" value={peerPubHex} onChange={setPeerPubHex} placeholder="Hex public key" width="100%" />
      )}
      <Button label="Run" variant="primary" width="100%" onClick={handleRun} />
      {out.result && <ResultBox value={out.result} label="Output" variant="compact" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
