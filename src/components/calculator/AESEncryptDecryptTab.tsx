import { useState, useCallback, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Banner } from '@astryxdesign/core/Banner';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import { decodeInput } from '../../utils/aesCrypto';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';
import { ecb, cbc, ctr, gcm, cfb } from '@noble/ciphers/aes.js';
import { ofbEncrypt } from '../../utils/aesCrypto';
import { AES_MODES, ENCODINGS } from '../../data/attackExplanations/aes';

export function AESEncryptDecryptTab() {
  const [mode, setMode] = useState<string>('CBC');
  const [keyHex, setKeyHex] = useState('');
  const [ivHex, setIvHex] = useState('');
  const [aadHex, setAadHex] = useState('');
  const [inputText, setInputText] = useState('');
  const [inputEnc, setInputEnc] = useState<string>('text');
  const [op, setOp] = useState<string>('encrypt');
  const out = useCalculatorOutput({ category: 'calculator-aes' });

  const needsIv = useMemo(() => ['CBC', 'CTR', 'GCM', 'OFB', 'CFB'].includes(mode), [mode]);
  const needsAad = mode === 'GCM';
  const keyLabel = useMemo(() => {
    const k = keyHex.replace(/\s/g, '');
    const len = k.length / 2;
    if (len === 16) return 'Key (hex) — AES-128';
    if (len === 24) return 'Key (hex) — AES-192';
    if (len === 32) return 'Key (hex) — AES-256';
    return 'Key (hex)';
  }, [keyHex]);

  const handleRun = useCallback(() => {
    out.clear();
    try {
      const key = hexToBytes(keyHex.replace(/\s/g, ''));
      if (![16, 24, 32].includes(key.length)) throw new Error('Key must be 16/24/32 hex bytes');
      const data = decodeInput(inputText, inputEnc);
      if (!data.length) throw new Error('Input is empty');
      let iv = new Uint8Array(0);
      if (needsIv) {
        iv = hexToBytes(ivHex.replace(/\s/g, ''));
        if (mode === 'GCM' && iv.length < 12) throw new Error('GCM nonce ≥ 12 bytes');
        if (!['CTR', 'GCM'].includes(mode) && iv.length !== 16) throw new Error(`${mode} requires 16-byte IV`);
        if (mode === 'CTR' && iv.length !== 16) throw new Error('CTR needs full 16-byte counter');
      }
      const aad = needsAad && aadHex.trim() ? hexToBytes(aadHex.replace(/\s/g, '')) : undefined;
      const enc = op === 'encrypt';
      let resultBytes: Uint8Array;
      switch (mode) {
        case 'ECB': { const c = ecb(key); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CBC': { const c = cbc(key, iv); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CTR': { const c = ctr(key, iv); resultBytes = c.encrypt(data); break; }
        case 'GCM': { const c = gcm(key, iv, aad); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'CFB': { const c = cfb(key, iv); resultBytes = enc ? c.encrypt(data) : c.decrypt(data); break; }
        case 'OFB': { if (iv.length !== 16) throw new Error('OFB needs 16-byte IV'); resultBytes = ofbEncrypt(key, iv, data); break; }
        default: throw new Error('Unknown mode');
      }
      const resultText = bytesToHex(resultBytes);
      out.dispatch(resultText, `AES ${op === 'encrypt' ? 'Encrypt' : 'Decrypt'} (${mode})`);
    } catch (e) {
      out.dispatchError(e instanceof Error ? e.message : String(e));
    }
  }, [mode, keyHex, ivHex, aadHex, inputText, inputEnc, op, needsIv, needsAad, out]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector label="Mode" options={[...AES_MODES]} value={mode} onChange={setMode} width="100%" />
      <TextInput
        label={keyLabel}
        value={keyHex}
        onChange={setKeyHex}
        placeholder="32/48/64 hex chars"
        width="100%"
      />
      {needsIv && (
        <TextInput
          label={`${mode === 'GCM' ? 'Nonce' : 'IV'} (hex)`}
          value={ivHex}
          onChange={setIvHex}
          placeholder={mode === 'GCM' ? '12+ byte nonce' : '32 hex chars'}
          width="100%"
        />
      )}
      {needsAad && (
        <TextInput
          label="AAD (hex, opt)"
          value={aadHex}
          onChange={setAadHex}
          placeholder="Additional authenticated data"
          width="100%"
        />
      )}
      <Stack direction="horizontal" gap={1} vAlign="start">
        <Selector
          label="Encoding"
          options={ENCODINGS.map(e => ({ value: e.value, label: e.label }))}
          value={inputEnc}
          onChange={setInputEnc}
        />
        <Stack direction="vertical" width="100%">
          <TextArea
            label="Input"
            value={inputText}
            onChange={setInputText}
            rows={3}
            placeholder={inputEnc === 'text' ? 'Plaintext...' : `${inputEnc.toUpperCase()} data...`}
          />
        </Stack>
      </Stack>
      <SegmentedControl label="Operation" value={op} onChange={setOp}>
        <SegmentedControlItem value="encrypt" label="Encrypt" />
        <SegmentedControlItem value="decrypt" label="Decrypt" />
      </SegmentedControl>
      <Button
        label={op === 'encrypt' ? 'Encrypt' : 'Decrypt'}
        variant="primary"
        width="100%"
        onClick={handleRun}
        isDisabled={!keyHex.trim() || !inputText.trim()}
      />
      {out.result && <ResultBox value={out.result} label={`Output (${mode})`} variant="default" />}
      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
