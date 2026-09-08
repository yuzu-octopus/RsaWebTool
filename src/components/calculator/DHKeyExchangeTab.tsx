import { useState, useCallback, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading } from '@astryxdesign/core/Heading';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { RFC3526_GROUPS, generatePrivateKey, parseHex } from '../../utils/dhCrypto';
import { modPow } from '../../utils/bigint';

export function DHKeyExchangeTab() {
  const [group, setGroup] = useState('group5');
  const [customP, setCustomP] = useState('');
  const [customG, setCustomG] = useState('2');
  const [alicePriv, setAlicePriv] = useState<bigint | null>(null);
  const [alicePub, setAlicePub] = useState<bigint | null>(null);
  const [bobPriv, setBobPriv] = useState<bigint | null>(null);
  const [bobPub, setBobPub] = useState<bigint | null>(null);
  const [sharedAlice, setSharedAlice] = useState<bigint | null>(null);
  const [sharedBob, setSharedBob] = useState<bigint | null>(null);
  const out = useCalculatorOutput({ category: 'calculator-dh' });
  const { copy, copied } = useCopyToClipboard(1500);

  const currentGroup = useMemo(() => {
    if (group === 'custom') return null;
    const idx = group === 'group5' ? 0 : group === 'group14' ? 1 : 2;
    return RFC3526_GROUPS[idx];
  }, [group]);

  const p = useMemo(() => currentGroup?.p ?? (parseHex(customP) || 0n), [currentGroup, customP]);
  const g = useMemo(() => currentGroup?.g ?? (parseHex(customG) || 0n), [currentGroup, customG]);

  const genAlice = useCallback(() => {
    out.clear();
    setSharedAlice(null);
    setSharedBob(null);
    if (p <= 1n || g <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const a = generatePrivateKey();
    const A = modPow(g, a, p);
    setAlicePriv(a);
    setAlicePub(A);
  }, [p, g, out]);

  const genBob = useCallback(() => {
    out.clear();
    setSharedAlice(null);
    setSharedBob(null);
    if (p <= 1n || g <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const b = generatePrivateKey();
    const B = modPow(g, b, p);
    setBobPriv(b);
    setBobPub(B);
  }, [p, g, out]);

  const computeAlice = useCallback(() => {
    out.clear();
    if (alicePriv === null || bobPub === null) { out.dispatchError('Alice private key or Bob public key missing'); return; }
    if (p <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const s = modPow(bobPub, alicePriv, p);
    setSharedAlice(s);
    out.dispatch(`Shared secret (Alice): 0x${s.toString(16)}\nMETHOD=TYPESCRIPT`, 'DH Key Exchange');
  }, [alicePriv, bobPub, p, out]);

  const computeBob = useCallback(() => {
    out.clear();
    if (bobPriv === null || alicePub === null) { out.dispatchError('Bob private key or Alice public key missing'); return; }
    if (p <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const s = modPow(alicePub, bobPriv, p);
    setSharedBob(s);
    out.dispatch(`Shared secret (Bob): 0x${s.toString(16)}\nMETHOD=TYPESCRIPT`, 'DH Key Exchange');
  }, [bobPriv, alicePub, p, out]);

  return (
    <Stack direction="vertical" gap={2}>
      <Selector
        label="DH Group"
        options={[
          { value: 'group5', label: 'RFC 3526 Group 5 (1536-bit)' },
          { value: 'group14', label: 'RFC 3526 Group 14 (2048-bit)' },
          { value: 'group16', label: 'RFC 3526 Group 16 (4096-bit)' },
          { value: 'custom', label: 'Custom' },
        ]}
        value={group}
        onChange={v => { setGroup(v); out.clear(); }}
        width="100%"
      />

      {group === 'custom' && (
        <Stack direction="horizontal" gap={1}>
          <TextInput label="p (hex)" value={customP} onChange={setCustomP} placeholder="Prime modulus" width="100%" />
          <TextInput label="g (decimal)" value={customG} onChange={setCustomG} placeholder="Generator" width="100%" />
        </Stack>
      )}

      <Grid columns={{ minWidth: 280 }} gap={2}>
        {/* Alice panel */}
        <Card>
          <Stack direction="vertical" gap={1}>
            <Heading level={5}>Alice</Heading>
            <Button label="Generate" variant="primary" width="100%" onClick={genAlice} />
            {alicePriv !== null && (
              <Stack direction="horizontal" gap={1} vAlign="start">
                <Text type="supporting" wordBreak="break-all">
                  Private: 0x{alicePriv.toString(16)}
                </Text>
                <IconButton
                  label="Copy Alice private key"
                  icon={<Icon icon="copy" />}
                  tooltip={copied ? 'Copied!' : 'Copy'}
                  onClick={() => { void copy(`0x${alicePriv.toString(16)}`); }}
                />
              </Stack>
            )}
            {alicePub !== null && (
              <Stack direction="horizontal" gap={1} vAlign="start">
                <Text type="supporting" wordBreak="break-all">
                  Public: 0x{alicePub.toString(16)}
                </Text>
                <IconButton
                  label="Copy Alice public key"
                  icon={<Icon icon="copy" />}
                  tooltip={copied ? 'Copied!' : 'Copy'}
                  onClick={() => { void copy(`0x${alicePub.toString(16)}`); }}
                />
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Bob panel */}
        <Card>
          <Stack direction="vertical" gap={1}>
            <Heading level={5}>Bob</Heading>
            <Button label="Generate" variant="primary" width="100%" onClick={genBob} />
            {bobPriv !== null && (
              <Stack direction="horizontal" gap={1} vAlign="start">
                <Text type="supporting" wordBreak="break-all">
                  Private: 0x{bobPriv.toString(16)}
                </Text>
                <IconButton
                  label="Copy Bob private key"
                  icon={<Icon icon="copy" />}
                  tooltip={copied ? 'Copied!' : 'Copy'}
                  onClick={() => { void copy(`0x${bobPriv.toString(16)}`); }}
                />
              </Stack>
            )}
            {bobPub !== null && (
              <Stack direction="horizontal" gap={1} vAlign="start">
                <Text type="supporting" wordBreak="break-all">
                  Public: 0x{bobPub.toString(16)}
                </Text>
                <IconButton
                  label="Copy Bob public key"
                  icon={<Icon icon="copy" />}
                  tooltip={copied ? 'Copied!' : 'Copy'}
                  onClick={() => { void copy(`0x${bobPub.toString(16)}`); }}
                />
              </Stack>
            )}
          </Stack>
        </Card>
      </Grid>

      {/* Shared Secret panel */}
      <Card>
        <Stack direction="vertical" gap={1}>
          <Heading level={5}>Shared Secret</Heading>
          <Stack direction="horizontal" gap={1}>
            <Button label="Alice computes" variant="primary" width="100%" onClick={computeAlice} />
            <Button label="Bob computes" variant="primary" width="100%" onClick={computeBob} />
          </Stack>
          {sharedAlice !== null && (
            <Stack direction="horizontal" gap={1} vAlign="start">
              <Text type="supporting" wordBreak="break-all">
                Alice shared: 0x{sharedAlice.toString(16)}
              </Text>
              <IconButton
                label="Copy Alice shared secret"
                icon={<Icon icon="copy" />}
                tooltip={copied ? 'Copied!' : 'Copy'}
                onClick={() => { void copy(`0x${sharedAlice.toString(16)}`); }}
              />
            </Stack>
          )}
          {sharedBob !== null && (
            <Stack direction="horizontal" gap={1} vAlign="start">
              <Text type="supporting" wordBreak="break-all">
                Bob shared: 0x{sharedBob.toString(16)}
              </Text>
              <IconButton
                label="Copy Bob shared secret"
                icon={<Icon icon="copy" />}
                tooltip={copied ? 'Copied!' : 'Copy'}
                onClick={() => { void copy(`0x${sharedBob.toString(16)}`); }}
              />
            </Stack>
          )}
          {sharedAlice !== null && sharedBob !== null && (
            <Text>{sharedAlice === sharedBob ? '✓ Shared secrets match!' : '✗ Shared secrets differ!'}</Text>
          )}
        </Stack>
      </Card>

      {out.error && <Banner status="error" title={out.error} />}
    </Stack>
  );
}
