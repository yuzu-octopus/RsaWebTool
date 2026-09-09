import { useState, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { useAppContext } from '../hooks/useAppContext';
import { convertFormat } from '../utils/converters';
import type { Format } from '../utils/converters';

const FORMATS: { value: Format; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'dec', label: 'Dec' },
  { value: 'base64', label: 'Base64' },
  { value: 'text', label: 'Text' },
];

export function FormatConverter() {
  const { viewMode } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [inputFormat, setInputFormat] = useState<Format>('hex');
  const [outputFormat, setOutputFormat] = useState<Format>('text');

  const outputText = useMemo(() => {
    if (!inputText.trim()) return '';
    try {
      return convertFormat(inputText, inputFormat, outputFormat);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : 'Conversion failed'}`;
    }
  }, [inputText, inputFormat, outputFormat]);

  if (viewMode !== 'format-converter') return null;

  return (
    <Stack>
      <Stack hAlign="center" padding={2}>
        <Stack width="100%" maxWidth={640} gap={2}>
          <Heading level={3} color="accent">Format Converter</Heading>

          <Text type="supporting">
            Convert between Hex, Dec, Base64, and Text
          </Text>

          <SegmentedControl
            label="Input format"
            value={inputFormat}
            onChange={(value) => setInputFormat(value as Format)}
            layout="fill"
          >
            {FORMATS.map((f) => (
              <SegmentedControlItem key={f.value} value={f.value} label={f.label} />
            ))}
          </SegmentedControl>

          <TextArea
            label="Converter input"
            isLabelHidden
            rows={6}
            value={inputText}
            onChange={(value) => setInputText(value)}
            placeholder="Paste input here..."
          />

          <SegmentedControl
            label="Output format"
            value={outputFormat}
            onChange={(value) => setOutputFormat(value as Format)}
            layout="fill"
          >
            {FORMATS.map((f) => (
              <SegmentedControlItem key={f.value} value={f.value} label={f.label} />
            ))}
          </SegmentedControl>

          <TextArea
            label="Converted output"
            isLabelHidden
            rows={6}
            value={outputText}
            onChange={() => {}}
            placeholder="Output appears here..."
            isReadOnly
          />
        </Stack>
      </Stack>
    </Stack>
  );
}

export default FormatConverter;
