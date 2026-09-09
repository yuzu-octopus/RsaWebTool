import { useState, useEffect } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { modPow, modInverse } from '../../utils/bigint';
import { parseBigInt, toHex, toAscii, isPrintableAscii } from '../../utils/rsaCalc';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';

export function RsaDecryptTab() {
  const [form, setForm] = useState({ c: '', n: '', d: '', p: '', q: '', e: '', dp: '', dq: '', qinv: '' });
  const out = useCalculatorOutput({ category: 'calculator-rsa' });

  useEffect(() => {
    const handler = (event: Event) => {
      const { n, e } = (event as CustomEvent<{ n?: string; e?: string }>).detail ?? {};
      if (n) setForm(prev => ({ ...prev, n }));
      if (e) setForm(prev => ({ ...prev, e }));
    };
    window.addEventListener('calculator-prefill', handler);
    return () => window.removeEventListener('calculator-prefill', handler);
  }, []);

  const handleDecrypt = () => {
    out.clear();
    const cn = parseBigInt(form.c);
    let nn = parseBigInt(form.n);
    let pn = parseBigInt(form.p);
    let qn = parseBigInt(form.q);
    const dpn = parseBigInt(form.dp);
    const dqn = parseBigInt(form.dq);
    const qinvn = parseBigInt(form.qinv);
    const en = parseBigInt(form.e);
    const dn = parseBigInt(form.d);

    if (cn === null) {
      out.dispatchError('c must be a valid number');
      return;
    }

    // Derive missing n, p, or q from the other two (any 2 of p, q, n)
    if (nn === null && pn !== null && qn !== null) {
      nn = pn * qn;
    } else if (qn === null && nn !== null && pn !== null) {
      if (pn === 0n || nn % pn !== 0n) {
        out.dispatchError('p does not divide n (p·q != n)');
        return;
      }
      qn = nn / pn;
    } else if (pn === null && nn !== null && qn !== null) {
      if (qn === 0n || nn % qn !== 0n) {
        out.dispatchError('q does not divide n (p·q != n)');
        return;
      }
      pn = nn / qn;
    }
    // Triple validation: when all three are present they must agree.
    if (nn !== null && pn !== null && qn !== null && pn * qn !== nn) {
      out.dispatchError('p·q != n: the provided factors disagree with the modulus');
      return;
    }

    if (nn === null) {
      out.dispatchError('Provide n, or p+q (any 2 of p, q, n)');
      return;
    }
    if (nn <= 1n) {
      out.dispatchError('n must be > 1');
      return;
    }
    if (cn < 0n || cn >= nn) {
      out.dispatchError('c must be >= 0 and < n');
      return;
    }

    let m: bigint | null = null;

    if (dn !== null) {
      if (dn <= 0n) {
        out.dispatchError('d must be positive (got d <= 0)');
        return;
      }
      m = modPow(cn, dn, nn);
    }

    // CRT path: dp/dq/qinv with p, q (Garner: m = mq + q·(qinv·(mp − mq) mod p)).
    if (m === null && pn !== null && qn !== null && dpn !== null && dqn !== null && qinvn !== null) {
      if (dpn <= 0n || dqn <= 0n) {
        out.dispatchError('dp and dq must be positive');
        return;
      }
      const mp = modPow(cn % pn, dpn, pn);
      const mq = modPow(cn % qn, dqn, qn);
      m = (mq + qn * (((qinvn * (mp - mq)) % pn + pn) % pn)) % nn;
    }

    if (m === null && pn !== null && qn !== null && en !== null && en > 0n) {
      const phi = (pn - 1n) * (qn - 1n);
      const dComputed = modInverse(en, phi);
      if (dComputed !== null) {
        m = modPow(cn, dComputed, nn);
      }
    }

    if (m === null) {
      out.dispatchError('Provide d, or at least 2 of (p, q, n) + e');
      return;
    }

    let outputText = `m = ${m}\n`;
    outputText += `m (hex) = ${toHex(m)}\n`;
    if (isPrintableAscii(m)) {
      outputText += `m (ascii) = ${toAscii(m)}`;
    }
    out.dispatch(outputText, 'RSA Decrypt');
  };

  return (
    <Stack direction="vertical" gap={2}>
      <Text type="body" color="secondary">Enter every value as decimal or with a 0x hexadecimal prefix.</Text>
      <Stack direction="vertical" gap={2}>
        <Text type="label" weight="semibold">
          Ciphertext and modulus
        </Text>
        <TextInput
          label="c (ciphertext)"
          description="Ciphertext to decrypt, in decimal or 0x hexadecimal."
          value={form.c}
          onChange={v => setForm(prev => ({ ...prev, c: v }))}
          width="100%"
        />
        <TextInput
          label="n (modulus)"
          description="Required unless both p and q are supplied."
          value={form.n}
          onChange={v => setForm(prev => ({ ...prev, n: v }))}
          width="100%"
        />
      </Stack>
      <Stack direction="vertical" gap={2}>
        <Text type="label" weight="semibold">
          Private exponent or key factors
        </Text>
        <Text type="body" color="secondary">Provide d directly, or provide p, q, and e so d can be derived.</Text>
        <TextInput
          label="d (private exponent)"
          description="Optional when p, q, and e are provided."
          value={form.d}
          onChange={v => setForm(prev => ({ ...prev, d: v }))}
          width="100%"
        />
        <Stack direction="horizontal" gap={1}>
          <TextInput
            label="p (prime factor)"
            value={form.p}
            onChange={v => setForm(prev => ({ ...prev, p: v }))}
            width="100%"
          />
          <TextInput
            label="q (prime factor)"
            value={form.q}
            onChange={v => setForm(prev => ({ ...prev, q: v }))}
            width="100%"
          />
        </Stack>
        <TextInput
          label="e (public exponent)"
          value={form.e}
          onChange={v => setForm(prev => ({ ...prev, e: v }))}
          width="100%"
        />
        <Text type="body" color="secondary">Optional CRT parameters (dp, dq, qinv) decrypt via Garner instead of d.</Text>
        <Stack direction="horizontal" gap={1}>
          <TextInput
            label="dp (d mod p-1)"
            value={form.dp}
            onChange={v => setForm(prev => ({ ...prev, dp: v }))}
            width="100%"
          />
          <TextInput
            label="dq (d mod q-1)"
            value={form.dq}
            onChange={v => setForm(prev => ({ ...prev, dq: v }))}
            width="100%"
          />
          <TextInput
            label="qinv (q^-1 mod p)"
            value={form.qinv}
            onChange={v => setForm(prev => ({ ...prev, qinv: v }))}
            width="100%"
          />
        </Stack>
      </Stack>
      <Button
        label="Decrypt"
        variant="primary"
        width="100%"
        onClick={handleDecrypt}
        isDisabled={!form.c.trim() || (!form.n.trim() && (!form.p.trim() || !form.q.trim()))}
      />
      {out.result && <ResultBox value={out.result} label="Decrypted RSA plaintext" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
