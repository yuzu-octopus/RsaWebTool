import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';

export interface AttackExplanationData {
  title: string;
  description: string;
  whenToUse: string;
  algorithm: string[];
  python: string;
  references?: string[];
}

export function AttackExplanationPanel({ data }: { data: AttackExplanationData }) {
  return (
    <Stack direction="vertical" gap={2} isScrollable>
      <Heading level={4}>{data.title}</Heading>

      <Text>{data.description}</Text>

      <Stack direction="vertical" gap={1}>
        <Text type="label" weight="semibold">
          When to use
        </Text>
        <Text>{data.whenToUse}</Text>
      </Stack>

      <Stack direction="vertical" gap={1}>
        <Text type="label" weight="semibold">
          Algorithm
        </Text>
        <CodeBlock
          code={data.algorithm.join('\n')}
          language="plaintext"
          hasCopyButton={false}
          isWrapped
          width="100%"
        />
      </Stack>

      <Stack direction="vertical" gap={1}>
        <Text type="label" weight="semibold">
          Python Script
        </Text>
        <CodeBlock
          code={data.python}
          language="python"
          width="100%"
          maxHeight={400}
        />
      </Stack>
    </Stack>
  );
}
