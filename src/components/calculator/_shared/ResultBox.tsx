import { useCallback } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

export type ResultBoxVariant = 'compact' | 'medium' | 'tall' | 'default';

const VARIANT_MAX_HEIGHT: Record<ResultBoxVariant, number | string> = {
  compact: 200,
  medium: 300,
  tall: '50vh',
  default: 150,
};

export interface ResultBoxProps {
  /** The text to display in the output box. */
  value: string;
  /** Label shown above the box (defaults to "Output"). */
  label?: string;
  /** Height variant. `default` caps at 150px. */
  variant?: ResultBoxVariant;
  /** Override maxHeight (string or number). When set, takes precedence over `variant`. */
  maxHeight?: string | number;
  /** Whether to show the copy button (defaults to true). */
  showCopy?: boolean;
}

/**
 * Standard output display with optional copy-to-clipboard.
 * Replaces the 6x-duplicated label + copy button + output box pattern.
 *
 * Uses `useCopyToClipboard` internally, so the copy button automatically
 * gets a "Copied!" feedback (default 2s reset).
 */
export function ResultBox({
  value,
  label = 'Output',
  variant = 'default',
  maxHeight,
  showCopy = true,
}: ResultBoxProps) {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = useCallback(() => {
    void copy(value);
  }, [copy, value]);

  return (
    <Stack direction="vertical" gap={1}>
      {(label || showCopy) && (
        <Stack direction="horizontal" gap={1} vAlign="center">
          <Text type="label" style={{ color: 'var(--dracula-green)' }}>{label}</Text>
          {copied && showCopy && (
            <Text type="body" role="status" aria-live="polite" aria-atomic="true" style={{ color: 'var(--dracula-green)' }}>
              Copied!
            </Text>
          )}
          {showCopy && (
            <IconButton
              label={`Copy ${label}`}
              icon={<Icon icon="copy" />}
              tooltip={`Copy ${label}`}
              onClick={handleCopy}
            />
          )}
        </Stack>
      )}
      <Stack
        direction="vertical"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <CodeBlock
          code={value}
          language="plaintext"
          hasCopyButton={false}
          isWrapped
          width="100%"
          maxHeight={maxHeight ?? VARIANT_MAX_HEIGHT[variant]}
        />
      </Stack>
    </Stack>
  );
}
