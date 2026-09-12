import { useState, type ReactNode } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Selector } from '@astryxdesign/core/Selector';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';

export interface SharedAttackField {
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  /** text (default) | textarea | select. `multiline: true` still maps to textarea. */
  kind?: 'text' | 'textarea' | 'select';
  /** Required when kind === 'select'. The first option is the default value. */
  options?: { value: string; label: string }[];
}

export interface SharedAttackPanelProps {
  title: string;
  description: string;
  explanationNode: ReactNode;
  fields: SharedAttackField[];
  generateLabel: string;
  onGenerate: () => Record<string, string>;
  onRun: (values: Record<string, string>) => void;
  resultNode: ReactNode;
  /** Source-tab content: TS runner source or the Sage/reference builder string. */
  sourceCode?: string;
  sourceLanguage?: string;
}

const flexFill = { flex: 1, minWidth: 0, minHeight: 0 } as const;

/**
 * Phase-0 static mock of the unified attack panel: Explanation / Input /
 * Source tabs cloned from the InputPanel AttackPanel skeleton. The panel owns
 * its tab + field values; parents supply content and the Generate/Run
 * behaviours. The production registry (Phase 1) replaces the per-tab
 * hand-wiring, not this layout.
 */
export function SharedAttackPanel({
  title,
  description,
  explanationNode,
  fields,
  generateLabel,
  onGenerate,
  onRun,
  resultNode,
  sourceCode,
  sourceLanguage,
}: SharedAttackPanelProps) {
  const [tab, setTab] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleGenerate = () => {
    setValues(prev => ({ ...prev, ...onGenerate() }));
  };

  const selectValue = (field: SharedAttackField): string =>
    values[field.name] ?? field.options?.[0]?.value ?? '';

  const handleRun = () => {
    const effective = { ...values };
    for (const field of fields) {
      if (field.kind === 'select' && effective[field.name] === undefined) {
        effective[field.name] = field.options?.[0]?.value ?? '';
      }
    }
    onRun(effective);
  };

  return (
    <Stack direction="vertical" style={flexFill}>
      {/* Tabs at top-left */}
      <TabList
        value={String(tab)}
        onChange={(v) => setTab(Number(v))}
        role="tablist"
        hasDivider
      >
        <Tab value="0" label="Explanation" id="mock-attack-tab-0" panelId="mock-attack-tabpanel-0" />
        <Tab value="1" label="Input" id="mock-attack-tab-1" panelId="mock-attack-tabpanel-1" data-testid="input-tab" />
        <Tab value="2" label="Source" id="mock-attack-tab-2" panelId="mock-attack-tabpanel-2" data-testid="source-tab" />
      </TabList>

      {/* Explanation tab - left aligned */}
      {tab === 0 && (
        <Stack direction="vertical" gap={2} padding={4} isScrollable role="tabpanel" id="mock-attack-tabpanel-0" aria-labelledby="mock-attack-tab-0" style={flexFill}>
          {explanationNode}
        </Stack>
      )}

      {/* Input tab - center aligned */}
      {tab === 1 && (
        <Stack direction="vertical" hAlign="center" padding={4} isScrollable role="tabpanel" id="mock-attack-tabpanel-1" aria-labelledby="mock-attack-tab-1" style={flexFill}>
          <Stack direction="vertical" gap={2} width="100%" style={{ maxWidth: '40rem' }}>
            <Heading level={3} color="accent">
              {title}
            </Heading>
            <Text type="body" color="secondary">
              {description}
            </Text>

            {fields.map(field => {
              if (field.kind === 'select') {
                return (
                  <Selector
                    key={field.name}
                    label={field.label}
                    options={field.options ?? []}
                    value={selectValue(field)}
                    onChange={(value) => setValues(prev => ({ ...prev, [field.name]: value }))}
                    width="100%"
                  />
                );
              }
              if (field.kind === 'textarea' || field.multiline === true) {
                return (
                  <TextArea
                    key={field.name}
                    label={field.label}
                    placeholder={field.placeholder}
                    value={values[field.name] ?? ''}
                    onChange={(value) => setValues(prev => ({ ...prev, [field.name]: value }))}
                    rows={3}
                    width="100%"
                  />
                );
              }
              return (
                <TextInput
                  key={field.name}
                  size="sm"
                  label={field.label}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ''}
                  onChange={(value) => setValues(prev => ({ ...prev, [field.name]: value.replace(/\s/g, '') }))}
                  width="100%"
                />
              );
            })}

            <Stack direction="horizontal" gap={1} width="100%">
              <Button
                label={generateLabel}
                variant="primary"
                width="100%"
                onClick={handleGenerate}
                data-testid="generate-testcase"
              />
              <Button
                label="Run"
                variant="primary"
                width="100%"
                onClick={handleRun}
                data-testid="run-attack"
              />
            </Stack>

            {resultNode}
          </Stack>
        </Stack>
      )}

      {/* Source tab - per-attack runner source or reference script */}
      {tab === 2 && (
        <Stack direction="vertical" gap={2} padding={4} isScrollable role="tabpanel" id="mock-attack-tabpanel-2" aria-labelledby="mock-attack-tab-2" style={flexFill}>
          <CodeBlock
            code={sourceCode ?? '# No source preview for this attack yet.'}
            language={sourceLanguage ?? 'python'}
            width="100%"
            isWrapped
            hasCopyButton={false}
          />
        </Stack>
      )}
    </Stack>
  );
}
