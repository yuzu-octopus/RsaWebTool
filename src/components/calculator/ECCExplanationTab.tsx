import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { ProofRenderer } from '../ProofRenderer';
import { ECC_PROOF } from '../../data/attackExplanations/ecc';

export function ECCExplanationTab() {
  return (
    <Stack direction="vertical" gap={1}>
      <Heading level={4} style={{ color: 'var(--dracula-cyan)' }}>ECC Reference</Heading>
      <Stack direction="vertical" isScrollable>
        <ProofRenderer latex={ECC_PROOF} />
      </Stack>
    </Stack>
  );
}
