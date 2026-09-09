import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { ChevronRight } from 'lucide-react';
import { ProofRenderer } from '../ProofRenderer';
import { AES_PROOF } from '../../data/attackExplanations/aes';

export function AESExplanationTab({ onContinue }: { onContinue: () => void }) {
  return (
    <Stack direction="vertical" gap={1}>
      <Heading level={4} style={{ color: 'var(--dracula-cyan)' }}>AES Block Cipher Reference</Heading>
      <Stack direction="vertical">
        <ProofRenderer latex={AES_PROOF} />
      </Stack>
      <Stack direction="horizontal" hAlign="start">
        <Button
          label="Continue to Encrypt/Decrypt"
          variant="ghost"
          onClick={onContinue}
          endContent={<Icon icon={ChevronRight} size="sm" />}
        />
      </Stack>
    </Stack>
  );
}
