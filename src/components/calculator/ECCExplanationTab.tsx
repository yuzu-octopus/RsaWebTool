import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { ChevronRight } from 'lucide-react';
import { ProofRenderer } from '../ProofRenderer';
import { ECC_PROOF } from '../../data/attackExplanations/ecc';

export function ECCExplanationTab({ onContinue }: { onContinue: () => void }) {
  return (
    <Stack direction="vertical" gap={1}>
      <Heading level={4} style={{ color: 'var(--dracula-cyan)' }}>ECC Reference</Heading>
      <Stack direction="vertical">
        <ProofRenderer latex={ECC_PROOF} />
      </Stack>
      <Stack direction="horizontal" hAlign="start">
        <Button
          label="Continue to Key Operations"
          variant="ghost"
          onClick={onContinue}
          endContent={<Icon icon={ChevronRight} size="sm" />}
        />
      </Stack>
    </Stack>
  );
}
