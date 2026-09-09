import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { ProofRenderer } from '../ProofRenderer';
import { AES_PROOF } from '../../data/attackExplanations/aes';

export function AESExplanationTab() {
  return (
    <Stack direction="vertical" gap={1}>
      <Heading level={4} style={{ color: 'var(--dracula-cyan)' }}>AES Block Cipher Reference</Heading>
      <Stack direction="vertical">
        <ProofRenderer latex={AES_PROOF} />
      </Stack>
    </Stack>
  );
}
