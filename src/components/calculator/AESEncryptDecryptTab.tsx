import { useCallback, useMemo, useReducer } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Banner } from '@astryxdesign/core/Banner';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { ResultBox } from './_shared/ResultBox';
import { decodeInput, hex } from '../../utils/aesCrypto';
import { bytesToHex } from '@noble/ciphers/utils.js';
import { ecb, cbc, ctr, gcm, cfb } from '@noble/ciphers/aes.js';
import { ofbEncrypt } from '../../utils/aesCrypto';
import { AES_MODES, ENCODINGS } from '../../data/attackExplanations/aes';

/** Per-mode wire rules: what IV/nonce each mode needs and whether padding applies. */
const MODE_SPECS: Record<string, { iv: 'none' | 'block16' | 'nonce8' | 'ctr-parts'; note: string }> = {
  ECB: { iv: 'none', note: 'No IV. PKCS#7 padding unless Padding=None (then input must be block-aligned).' },
  CBC: { iv: 'block16', note: '16-byte IV. PKCS#7 padding unless Padding=None (decrypt shows raw blocks).' },
  CTR: { iv: 'ctr-parts', note: 'Streaming — no padding ever. 16-byte counter block = nonce prefix || big-endian counter.' },
  GCM: { iv: 'nonce8', note: 'Streaming + auth — no padding. Nonce ≥8 bytes (12 typical). Wire format is CT || 16-byte TAG.' },
  OFB: { iv: 'block16', note: 'Streaming — no padding ever. 16-byte IV.' },
  CFB: { iv: 'block16', note: 'Streaming — no padding ever. 16-byte IV.' },
};

function mapNobleError(e: unknown, mode: string, padding: string): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/tag|auth|mac/i.test(msg)) return `${msg} — authentication failed: wrong key, nonce, AAD, or corrupted ciphertext/tag.`;
  if (/pad/i.test(msg)) {
    return padding === 'none'
      ? `${msg} — Padding=None requires block-aligned input and shows raw blocks on decrypt.`
      : `${msg} — wrong key/IV, corrupted ciphertext, or non-PKCS#7 data.`;
  }
  if (/nonce|iv|length|block/i.test(msg) && mode === 'GCM') return `${msg} — GCM needs a ≥8-byte nonce (12 typical); decrypt input is CT || 16-byte TAG.`;
  return msg;
}

/** Build the 16-byte counter block / nonce / IV each mode needs. */
function buildModeIv(
  spec: { iv: 'none' | 'block16' | 'nonce8' | 'ctr-parts' },
  mode: string,
  ivHex: string,
  ctrPrefix: string,
  ctrCounter: string,
): Uint8Array {
  if (spec.iv === 'block16') {
    const iv = hex(ivHex);
    if (iv.length !== 16) throw new Error(`${mode} requires a 16-byte IV (got ${iv.length} bytes)`);
    return iv;
  }
  if (spec.iv === 'nonce8') {
    const iv = hex(ivHex);
    if (iv.length < 8) throw new Error('GCM nonce must be ≥8 bytes (12 typical)');
    return iv;
  }
  if (spec.iv === 'ctr-parts') {
    const prefix = ctrPrefix.trim() ? hex(ctrPrefix) : new Uint8Array(0);
    const counter = ctrCounter.trim() ? hex(ctrCounter) : new Uint8Array(0);
    if (prefix.length + counter.length !== 16) {
      throw new Error(`CTR counter block must total 16 bytes (prefix ${prefix.length}B + counter ${counter.length}B = ${prefix.length + counter.length}B)`);
    }
    const iv = new Uint8Array(16);
    iv.set(prefix, 0);
    iv.set(counter, prefix.length);
    return iv;
  }
  return new Uint8Array(0);
}

/** Run one encrypt/decrypt op; GCM encrypt returns the split CT/TAG/wire view. */
function executeMode(
  mode: string,
  key: Uint8Array,
  data: Uint8Array,
  iv: Uint8Array,
  aad: Uint8Array | undefined,
  enc: boolean,
  noPad: boolean,
): string {
  switch (mode) {
    case 'ECB': {
      const r = ecb(key, noPad ? { disablePadding: true } : undefined)[enc ? 'encrypt' : 'decrypt'](data);
      return bytesToHex(r) + (!enc && noPad ? '\n\n(Padding=None: raw blocks, no unpadding applied.)' : '');
    }
    case 'CBC': {
      const r = cbc(key, iv, noPad ? { disablePadding: true } : undefined)[enc ? 'encrypt' : 'decrypt'](data);
      return bytesToHex(r) + (!enc && noPad ? '\n\n(Padding=None: raw blocks, no unpadding applied.)' : '');
    }
    case 'CTR': return bytesToHex(ctr(key, iv).encrypt(data));
    case 'GCM': {
      const c = gcm(key, iv, aad);
      if (enc) {
        const wire = c.encrypt(data);
        const ctOnly = wire.subarray(0, wire.length - 16);
        return `CT (${ctOnly.length} bytes): ${bytesToHex(ctOnly)}\nTAG (16 bytes): ${bytesToHex(wire.subarray(wire.length - 16))}\n\nWire (CT||TAG, paste this to decrypt): ${bytesToHex(wire)}`;
      }
      if (data.length < 17) throw new Error(`Decrypt input is CT || 16-byte TAG (got ${data.length} bytes total)`);
      return bytesToHex(c.decrypt(data));
    }
    case 'CFB': {
      const c = cfb(key, iv);
      return bytesToHex(enc ? c.encrypt(data) : c.decrypt(data));
    }
    case 'OFB': {
      if (iv.length !== 16) throw new Error('OFB needs 16-byte IV');
      return bytesToHex(ofbEncrypt(key, iv, data));
    }
    default: throw new Error('Unknown mode');
  }
}

interface ModeFieldsProps {
  mode: string;
  op: string;
  ivHex: string;
  ctrPrefix: string;
  ctrCounter: string;
  aadHex: string;
  padding: string;
  onIvHex: (v: string) => void;
  onCtrPrefix: (v: string) => void;
  onCtrCounter: (v: string) => void;
  onAadHex: (v: string) => void;
  onPadding: (v: string) => void;
}

/** IV/nonce/AAD/padding inputs — only the current mode's fields render. */
function ModeFields(p: ModeFieldsProps) {
  const spec = MODE_SPECS[p.mode] ?? MODE_SPECS.CBC;
  return (
    <>
      {(spec.iv === 'block16' || spec.iv === 'nonce8') && (
        <TextInput
          label={`${p.mode === 'GCM' ? 'Nonce' : 'IV'} (hex)`}
          value={p.ivHex}
          onChange={p.onIvHex}
          placeholder={p.mode === 'GCM' ? '12-byte nonce typical (≥8 bytes)' : '32 hex chars'}
          width="100%"
        />
      )}
      {spec.iv === 'ctr-parts' && (
        <>
          <TextInput
            label="Nonce prefix (hex)"
            value={p.ctrPrefix}
            onChange={p.onCtrPrefix}
            placeholder="e.g. 24 hex chars (12 bytes)"
            width="100%"
          />
          <TextInput
            label="Initial counter (hex, big-endian)"
            value={p.ctrCounter}
            onChange={p.onCtrCounter}
            placeholder="e.g. 00000001 — fills the block to 16 bytes total"
            width="100%"
          />
        </>
      )}
      {p.mode === 'GCM' && (
        <TextInput
          label="AAD (hex, opt)"
          value={p.aadHex}
          onChange={p.onAadHex}
          placeholder="Additional authenticated data"
          width="100%"
        />
      )}
      {(p.mode === 'ECB' || p.mode === 'CBC') && (
        <Selector
          label="Padding"
          options={[{ value: 'pkcs7', label: 'PKCS#7' }, { value: 'none', label: 'None' }]}
          value={p.padding}
          onChange={p.onPadding}
          width="100%"
        />
      )}
      {p.mode === 'GCM' && p.op === 'decrypt' && (
        <Text type="supporting">Paste the full CT||TAG wire value to decrypt.</Text>
      )}
    </>
  );
}

/** Form fields in one object — one useState per field tripped prefer-useReducer. */
interface EncryptForm {
  mode: string;
  keyHex: string;
  ivHex: string;
  ctrPrefix: string;
  ctrCounter: string;
  aadHex: string;
  inputText: string;
  inputEnc: string;
  op: string;
  padding: string;
}

const INITIAL_FORM: EncryptForm = {
  mode: 'CBC',
  keyHex: '',
  ivHex: '',
  ctrPrefix: '',
  ctrCounter: '',
  aadHex: '',
  inputText: '',
  inputEnc: 'text',
  op: 'encrypt',
  padding: 'pkcs7',
};

function formReducer(state: EncryptForm, action: { key: keyof EncryptForm; value: string }): EncryptForm {
  return state[action.key] === action.value ? state : { ...state, [action.key]: action.value };
}

export function AESEncryptDecryptTab() {
  const [form, dispatchForm] = useReducer(formReducer, INITIAL_FORM);
  const set = useCallback(
    (key: keyof EncryptForm) => (value: string) => dispatchForm({ key, value }),
    [],
  );
  const { mode, keyHex, ivHex, ctrPrefix, ctrCounter, aadHex, inputText, inputEnc, op, padding } = form;
  const out = useCalculatorOutput({ category: 'calculator-aes' });

  const spec = MODE_SPECS[mode] ?? MODE_SPECS.CBC;
  const needsAad = mode === 'GCM';
  const needsPaddingOpt = mode === 'ECB' || mode === 'CBC';
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
      const key = hex(keyHex);
      if (![16, 24, 32].includes(key.length)) throw new Error('Key must be 16/24/32 hex bytes');
      const data = decodeInput(inputText, inputEnc);
      if (!data.length) throw new Error('Input is empty');
      const iv = buildModeIv(spec, mode, ivHex, ctrPrefix, ctrCounter);
      const aad = needsAad && aadHex.trim() ? hex(aadHex) : undefined;
      const enc = op === 'encrypt';
      const noPad = needsPaddingOpt && padding === 'none';
      out.dispatch(executeMode(mode, key, data, iv, aad, enc, noPad), `AES ${op === 'encrypt' ? 'Encrypt' : 'Decrypt'} (${mode})`);
    } catch (e) {
      out.dispatchError(mapNobleError(e, mode, padding));
    }
  }, [mode, keyHex, ivHex, ctrPrefix, ctrCounter, aadHex, inputText, inputEnc, op, padding, spec, needsAad, needsPaddingOpt, out]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector label="Mode" options={[...AES_MODES]} value={mode} onChange={set('mode')} width="100%" />
      <Text type="supporting">{spec.note}</Text>
      <TextInput
        label={keyLabel}
        value={keyHex}
        onChange={set('keyHex')}
        placeholder="32/48/64 hex chars"
        width="100%"
      />
      <ModeFields
        mode={mode}
        op={op}
        ivHex={ivHex}
        ctrPrefix={ctrPrefix}
        ctrCounter={ctrCounter}
        aadHex={aadHex}
        padding={padding}
        onIvHex={set('ivHex')}
        onCtrPrefix={set('ctrPrefix')}
        onCtrCounter={set('ctrCounter')}
        onAadHex={set('aadHex')}
        onPadding={set('padding')}
      />
      <Stack direction="horizontal" gap={1} vAlign="start">
        <Selector
          label="Encoding"
          options={ENCODINGS.map(e => ({ value: e.value, label: e.label }))}
          value={inputEnc}
          onChange={set('inputEnc')}
        />
        <Stack direction="vertical" width="100%">
          <TextArea
            label="Input"
            value={inputText}
            onChange={set('inputText')}
            rows={3}
            placeholder={inputEnc === 'text' ? 'Plaintext...' : `${inputEnc.toUpperCase()} data...`}
          />
        </Stack>
      </Stack>
      <SegmentedControl label="Operation" value={op} onChange={set('op')}>
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
