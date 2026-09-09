import { useState, useEffect, useEffectEvent, useMemo, useCallback, useRef } from 'react';
import type { Attack } from '../types';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Spinner } from '@astryxdesign/core/Spinner';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { dracula } from '@astryxdesign/core/theme/syntax';
import { Dices, ChevronRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { useSageMath } from '../hooks/useSageMath';
import { useWorkerPool } from '../hooks/useWorkerPool';
import { useAttackExecution } from '../hooks/useAttackExecution';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { ProofRenderer } from './ProofRenderer';
import { useIsMobile } from './Sidebar';
import { EmptyState } from './_shared/EmptyState';
import { getAttackSource, extractFrontendCheck, dedent } from '../attacks/rawSources';

// Dracula brand token (verbatim kit name — never raw hex). Kept for the live
// run-status lines, which use the orange attention vocabulary; all other text
// resolves through the theme `color` prop.
const c = {
  orange: 'var(--dracula-orange)',
};

const flexFill = { flex: 1, minWidth: 0, minHeight: 0 } as const;

export function InputPanel() {
  const { selectedAttack, viewMode, setViewMode, setCalculatorMode, setSelectedAttack, setMobileNavOpen } = useAppContext();
  const isMobile = useIsMobile();

  if (viewMode !== 'attack') return null;

  if (!selectedAttack) {
    return (
      <Stack direction="vertical" hAlign="center" vAlign="center" style={flexFill}>
        <EmptyState
          title={isMobile ? 'Tap the menu above to choose an attack' : 'Start cracking'}
          hint={isMobile ? undefined : 'Pick a path — no setup needed.'}
        >
          {isMobile
            ? <Button label="Choose an attack" variant="primary" onClick={() => setMobileNavOpen(true)} />
            : (
              <Stack direction="vertical" gap={2} style={{ marginTop: 'var(--space-gap)' }}>
                <Button label="Open Magic Cracker" variant="primary" onClick={() => setViewMode('magic')} />
                <Button label="Try Hastad Broadcast" variant="secondary" onClick={() => {
                  const hb = attacks.find(a => a.id === 'hastad-broadcast');
                  if (hb) setSelectedAttack(hb);
                  setViewMode('attack');
                }} />
                <Button label="Open RSA Calculator" variant="secondary" onClick={() => {
                  setCalculatorMode('rsa');
                  setViewMode('calculator');
                }} />
              </Stack>
            )}
        </EmptyState>
      </Stack>
    );
  }

  return <AttackPanel key={selectedAttack.id} attack={selectedAttack} />;
}

function AttackPanel({ attack }: { attack: Attack }) {
  const { viewMode, outputResult, setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification } = useAppContext();
  const { execute } = useSageMath();
  const [tab, setTab] = useState(0);
  const [sourceMode, setSourceMode] = useState<'sage' | 'frontend'>('sage');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const [frontendCode, setFrontendCode] = useState('');
  const { copied, copy } = useCopyToClipboard();
  const { runAttack, cancelCurrentRun } = useWorkerPool();
  const { handleRun, handleStop, handleGenerateTestcase, testcaseMsg, isRunning, progress, progressDetail, timer, eta } = useAttackExecution(
    execute, runAttack, cancelCurrentRun,
    { setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification, setInputValues },
  );
  const handleCopy = useCallback(async (text: string) => {
    if (!await copy(text)) showNotification('Could not copy to clipboard.', 'error');
  }, [copy, showNotification]);


  // Keyboard shortcut: ⌘/Ctrl+1/2/3 switches tabs within the attack view
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number' && detail >= 0 && detail <= 2) {
        setTab(detail);
      }
    };
    window.addEventListener('rsa-switch-tab', handler);
    return () => window.removeEventListener('rsa-switch-tab', handler);
  }, []);

  const handleValidatedRun = useCallback((values: Record<string, string>) => {
    const missingFields = attack.inputs.filter(field => field.required !== false && !values[field.name]?.trim());
    if (missingFields.length === 0) {
      void handleRun(attack, values);
      return;
    }

    setFieldErrors(Object.fromEntries(missingFields.map(field => [field.name, `${field.label} is required.`])));
    setOutputError('Complete the highlighted required fields before running this attack.');
    requestAnimationFrame(() => inputRefs.current[missingFields[0].name]?.focus());
  }, [attack, handleRun, setOutputError]);

  // Keyboard shortcut: ⌘+Enter to run attack, ⌘+Shift+C to copy output
  const runShortcut = useEffectEvent(() => {
    if (viewMode === 'attack' && !isRunning) {
      handleValidatedRun(inputValues);
    }
  });
  const copyShortcut = useEffectEvent(() => {
    if (viewMode === 'attack' && outputResult) {
      void handleCopy(outputResult);
    }
  });
  useEffect(() => {
    window.addEventListener('rsa-run-attack', runShortcut);
    window.addEventListener('rsa-copy-output', copyShortcut);
    return () => {
      window.removeEventListener('rsa-run-attack', runShortcut);
      window.removeEventListener('rsa-copy-output', copyShortcut);
    };
  }, []);

  // Load raw source for the Source tab, extracting only the frontendCheck function.
  // All setState calls happen inside .then()/.catch() — never synchronously in the effect body.
  useEffect(() => {
    const frontendCheck = attack.frontendCheck;
    if (!frontendCheck) return;
    let cancelled = false;
    getAttackSource(attack.id)
      .then(src => {
        if (cancelled) return;
        if (src) {
          const extracted = extractFrontendCheck(src);
          if (extracted) {
            setFrontendCode(extracted);
          } else {
            // Fallback: use toString if extraction fails
            setFrontendCode(dedent(frontendCheck.toString()));
          }
        } else {
          // Fallback: use toString if raw source unavailable
            setFrontendCode(dedent(frontendCheck.toString()));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFrontendCode(dedent(frontendCheck.toString()));
      });
    return () => { cancelled = true; };
  }, [attack]);

  const hasSage = !!attack.sageTemplate;
  const hasFrontend = !!attack.frontendCheck;
  const pythonCode = useMemo(() => {
    if (!attack.sageTemplate) return '';
    // Placeholder values keep strict numeric templates syntactically valid before form entry.
    const sourceValues = Object.fromEntries(attack.inputs.map(field => [field.name, inputValues[field.name]?.trim() || '1']));
    try {
      return attack.sageTemplate(sourceValues);
    } catch {
      return '# Enter valid inputs to preview generated SageMath code.';
    }
  }, [attack, inputValues]);

  const effectiveSourceMode = !hasSage ? 'frontend' : !hasFrontend ? 'sage' : sourceMode;
  // handleCopySource is a useCallback — must be defined before any early returns (Rules of Hooks)
  const handleCopySource = useCallback(() => {
    const code = effectiveSourceMode === 'sage' ? pythonCode : frontendCode;
    void handleCopy(code);
  }, [effectiveSourceMode, frontendCode, handleCopy, pythonCode]);


  const handleInputChange = (name: string, value: string, multiline: boolean) => {
    const normalizedValue = multiline ? value : value.replace(/\s/g, '');
    setInputValues(prev => ({ ...prev, [name]: normalizedValue }));
    if (normalizedValue.trim()) {
      setFieldErrors(({ [name]: _error, ...rest }) => rest);
    }
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
        <Tab value="0" label="Explanation" id="attack-tab-0" panelId="attack-tabpanel-0" />
        <Tab value="1" label="Input" id="attack-tab-1" panelId="attack-tabpanel-1" data-testid="input-tab" />
        <Tab value="2" label="Source" id="attack-tab-2" panelId="attack-tabpanel-2" data-testid="source-tab" />
      </TabList>

      {/* Explanation tab - left aligned */}
      {tab === 0 && (
        <Stack direction="vertical" gap={2} padding={2} isScrollable role="tabpanel" id="attack-tabpanel-0" aria-labelledby="attack-tab-0" style={flexFill}>
          {attack.proof ? (
            <ProofRenderer latex={attack.proof} />
          ) : (
            <Text type="body" color="secondary" style={{ fontStyle: 'italic' }}>
              No proof available.
            </Text>
          )}

          {attack.usageGuide && (
            <Stack hAlign="center" width="100%">
              <Stack width="100%" maxWidth="72ch" gap={2} padding={2}>
                <Text type="code" style={{ whiteSpace: 'pre-wrap' }}>
                  {attack.usageGuide}
                </Text>
              </Stack>
            </Stack>
          )}
          <Stack hAlign="center" width="100%">
            <Stack width="100%" maxWidth="72ch" padding={2}>
              <Stack direction="horizontal" hAlign="start">
                <Button
                  label="Continue to Input"
                  variant="ghost"
                  onClick={() => setTab(1)}
                  endContent={<Icon icon={ChevronRight} size="sm" />}
                />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      )}

      {/* Input tab - center aligned */}
      {tab === 1 && (
        <Stack direction="vertical" hAlign="center" padding={2} isScrollable role="tabpanel" id="attack-tabpanel-1" aria-labelledby="attack-tab-1" style={flexFill}>
          <Stack direction="vertical" gap={2} width="100%" style={{ maxWidth: '40rem' }}>
            <Heading level={3} color="accent">
              {attack.name}
            </Heading>
            <Text type="supporting" color="secondary">
              {attack.frontendCheck ? 'Runs locally in browser' : 'Executed via SageMathCell'}
            </Text>
            <Text type="body" color="secondary">
              {attack.description}
            </Text>

            {attack.inputs.map(field => {
              const error = fieldErrors[field.name];
              const label = field.required === false ? `${field.label} (optional)` : field.label;
              const status = error ? { type: 'error' as const, message: error } : undefined;
              const description = error ? undefined : field.tooltip;
              if (field.multiline === true) {
                return (
                  <TextArea
                    key={field.name}
                    label={label}
                    placeholder={field.placeholder}
                    value={inputValues[field.name] || ''}
                    onChange={(value) => handleInputChange(field.name, value, true)}
                    ref={(node) => { inputRefs.current[field.name] = node; }}
                    rows={field.rows ?? 3}
                    isRequired={field.required !== false}
                    status={status}
                    description={description}
                    width="100%"
                  />
                );
              }
              return (
                <TextInput
                  key={field.name}
                  size="sm"
                  label={label}
                  placeholder={field.placeholder}
                  value={inputValues[field.name] || ''}
                  onChange={(value) => handleInputChange(field.name, value, false)}
                  ref={(node) => { inputRefs.current[field.name] = node; }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isRunning) {
                      e.preventDefault();
                      handleValidatedRun(inputValues);
                    }
                  }}
                  isRequired={field.required !== false}
                  status={status}
                  description={description}
                  width="100%"
                />
              );
            })}

            <Stack direction="horizontal" gap={1} width="100%">
              <Button
                label="Generate"
                variant="ghost"
                width="100%"
                onClick={handleGenerateTestcase}
                data-testid="generate-testcase"
                icon={<Icon icon={Dices} size="sm" />}
              />
              <Button
                label={isRunning ? 'Stop' : 'Run'}
                variant={isRunning ? 'destructive' : 'primary'}
                width="100%"
                onClick={isRunning ? handleStop : () => handleValidatedRun(inputValues)}
                data-testid={isRunning ? 'stop-attack' : 'run-attack'}
                isLoading={isRunning}
                isInterruptible
                icon={isRunning ? <Icon icon="stop" size="sm" /> : undefined}
              />
            </Stack>

            {isRunning ? (
              <Stack direction="horizontal" gap={1} hAlign="center" vAlign="center">
                <Spinner size="sm" data-testid="loading-spinner" aria-label="Attack running" />
                <Text type="body" hasTabularNumbers style={{ color: c.orange }}>
                  Running… {timer.formatted}
                </Text>
              </Stack>
            ) : testcaseMsg ? (
              <Text type="body" justify="center" style={{ color: c.orange }}>
                {testcaseMsg}
              </Text>
            ) : null}

            {isRunning && progress > 0 && (
              <Stack direction="vertical" gap={1} width="100%" style={{ maxWidth: '19rem', marginInline: 'auto' }}>
                <ProgressBar
                  label="Attack progress"
                  value={progress}
                  variant="warning"
                  hasValueLabel
                  formatValueLabel={(v) => `${v}%${progressDetail ? ` — ${progressDetail}` : ''}`}
                />
                {eta && (
                  <Text type="supporting" justify="center" style={{ color: c.orange }}>
                    {eta} remaining
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      )}

      {/* Source tab */}
      {tab === 2 && (
        <Stack direction="vertical" gap={2} padding={2} isScrollable role="tabpanel" id="attack-tabpanel-2" aria-labelledby="attack-tab-2" style={flexFill}>
          <Stack direction="horizontal" gap={1}>
            {hasSage && (
              <Button
                label="SageMath (Python)"
                size="sm"
                variant={effectiveSourceMode === 'sage' ? 'secondary' : 'ghost'}
                onClick={() => setSourceMode('sage')}
              />
            )}
            {hasFrontend && (
              <Button
                label="Frontend (TypeScript)"
                size="sm"
                variant={effectiveSourceMode === 'frontend' ? 'secondary' : 'ghost'}
                onClick={() => setSourceMode('frontend')}
              />
            )}
          </Stack>
          <CodeBlock
            code={effectiveSourceMode === 'sage' ? pythonCode : frontendCode}
            language={effectiveSourceMode === 'sage' ? 'python' : 'typescript'}
            syntaxTheme={dracula}
            width="100%"
            isWrapped
            maxHeight="50vh"
            hasCopyButton={false}
          />

          <Stack direction="horizontal">
            <IconButton
              label={copied ? 'Copied' : 'Copy source'}
              tooltip={copied ? 'Copied!' : 'Copy source'}
              variant="ghost"
              size="sm"
              onClick={handleCopySource}
              icon={<Icon icon={copied ? 'check' : 'copy'} size="sm" />}
            />
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
