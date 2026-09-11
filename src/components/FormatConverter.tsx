import { useState, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TextArea } from '@astryxdesign/core/TextArea';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { convertFormat } from '../utils/converters';
import type { Format } from '../utils/converters';

const FORMATS: { value: Format; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'dec', label: 'Dec' },
  { value: 'base64', label: 'Base64' },
  { value: 'text', label: 'Text' },
];

export function FormatConverterDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
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

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={560}>
      <DialogHeader title="Format Converter" subtitle="Convert between Hex, Dec, Base64, and Text" onOpenChange={onOpenChange} />
      <Stack padding={3}>
        <Stack width="100%" gap={2}>

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
    </Dialog>
  );
}

export default FormatConverterDialog;
