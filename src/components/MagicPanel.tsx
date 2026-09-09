import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Divider } from '@astryxdesign/core';
import { Card } from '@astryxdesign/core/Card';
import { TextArea } from '@astryxdesign/core/TextArea';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Spinner } from '@astryxdesign/core/Spinner';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { dracula } from '@astryxdesign/core/theme/syntax';
import { Dices, FlaskConical, Sparkles, SkipForward } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { useMagicExecution, type MagicJob } from '../hooks/useMagicExecution';
import { attacks } from '../attacks';
import { extractParams } from './_shared/extractParams';
import type { Attack } from '../types';

// Dracula brand tokens (verbatim kit names — never raw hex). Purple is absent
// on purpose: nothing here is tappable, so nothing may be purple.
const c = {
  green: 'var(--dracula-green)',
  red: 'var(--dracula-red)',
  orange: 'var(--dracula-orange)',
  cyan: 'var(--dracula-cyan)',
  comment: 'var(--dracula-comment)',
};

const flexFill = { flex: 1, minWidth: 0, minHeight: 0 } as const;

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

// Status icon render function extracted outside component
function statusIcon(status: MagicJob['status']) {
  if (status === 'success') return <Icon icon="success" color="success" size="sm" />;
  if (status === 'error') return <Icon icon="error" color="error" size="sm" />;
  if (status === 'cancelled') return <Icon icon="stop" color="warning" size="sm" />;
  if (status === 'aborted') return <Icon icon={SkipForward} color="disabled" size="sm" />;
  return <Spinner size="sm" aria-label="Attack running" />;
}

function statusColor(status: MagicJob['status']) {
  if (status === 'success') return c.green;
  if (status === 'error') return c.red;
  if (status === 'cancelled') return c.orange;
  if (status === 'aborted') return c.comment;
  return c.orange;
}



// --- Extracted memoized components ---

const JobListItem = memo(function JobListItem({
  job,
  attackId,
  expanded,
  onToggle,
  onCopy,
}: {
  job: MagicJob;
  expanded: boolean;
  onToggle: (id: string) => void;
  onCopy: (value: string) => void;
  attackId: string;
}) {
  const completed = Boolean(job.result || job.error);
  const contentId = `magic-job-${attackId}`;

  return (
    <>
      <ListItem
        label={
          <Text type="body" style={{ color: statusColor(job.status) }}>
            {job.attackName}
          </Text>
        }
        description={
          job.error && !expanded ? (
            <Text type="code" maxLines={1} style={{ color: c.comment }}>
              {job.error}
            </Text>
          ) : undefined
        }
        startContent={statusIcon(job.status)}
        endContent={completed ? <Icon icon={expanded ? 'arrowUp' : 'chevronDown'} size="sm" /> : undefined}
        onClick={completed ? () => onToggle(attackId) : undefined}
        aria-expanded={completed ? expanded : undefined}
        aria-controls={completed ? contentId : undefined}
      />
      {completed && (
        <ListItem
          id={contentId}
          label={
            <CodeBlock
              code={job.result || job.error || ''}
              language="plaintext"
              syntaxTheme={dracula}
              width="100%"
              isWrapped
              maxHeight="12.5rem"
              onCopy={() => onCopy(job.result || job.error || '')}
            />
          }
          style={expanded ? undefined : { display: 'none' }}
        />
      )}
    </>
  );
});

const ExtractedParams = memo(function ExtractedParams({
  params,
  onCopy,
}: {
  params: Record<string, string>;
  onCopy: (value: string) => void;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <Card variant="muted" padding={3}>
      <Stack direction="vertical" gap={1}>
        <Text type="label" color="secondary">
          Extracted parameters
        </Text>
        {Object.entries(params).map(([key, value]) => {
          const isPreview = value.length > 50;
          const isExpanded = expandedKey === key;
          const contentId = `magic-param-${key}`;
          return (
            <Stack key={key} direction="vertical" gap={0}>
              <Stack direction="horizontal" gap={1} vAlign="center">
                <Text type="code">{key}</Text>
                <Text type="code">=</Text>
                <Text type="code" maxLines={1} style={{ flex: 1, minWidth: 0 }}>
                  {value}
                </Text>
                {isPreview && (
                  <Button
                    label={isExpanded ? 'Hide' : 'Preview'}
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    aria-expanded={isExpanded}
                    aria-controls={contentId}
                  />
                )}
                <IconButton
                  label={`Copy full ${key}`}
                  tooltip={`Copy full ${key}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(value)}
                  icon={<Icon icon="copy" size="sm" />}
                />
              </Stack>
              {isPreview && (
                <Text type="supporting" color="secondary"> preview</Text>
              )}
              {isPreview && isExpanded && (
                <Text id={contentId} type="code" textWrap="wrap" wordBreak="break-all">
                  {value}
                </Text>
              )}
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
});

const ApplicableList = memo(function ApplicableList({ byCategory }: { byCategory: Record<string, Attack[]> }) {
  return (
    <Stack direction="vertical" gap={1}>
      {Object.entries(byCategory).map(([cat, catAttacks]) => (
        <Stack key={cat} direction="vertical" gap={0}>
          <Text type="body" weight="semibold">
            {cat}
          </Text>
          {catAttacks.map(a => (
            <Text key={a.id} type="body">
              {a.name} <Text type="body" color="secondary">({a.priority})</Text>
            </Text>
          ))}
        </Stack>
      ))}
    </Stack>
  );
});

const ErrorInsightBox = memo(function ErrorInsightBox({ insights }: { insights: string }) {
  return (
    <Card variant="muted" padding={3}>
      <Stack direction="vertical" gap={1}>
        <Text type="body" style={{ color: c.orange }}>
          No attack succeeded: {insights}
        </Text>
        <Text type="body" color="secondary">
          Try checking parameter names, using a PEM key, or selecting a specific attack from the sidebar
        </Text>
      </Stack>
    </Card>
  );
});


export function MagicPanel() {
  const { viewMode, showNotification } = useAppContext();
  const [rawInput, setRawInput] = useState('');
  const [showApplicable, setShowApplicable] = useState(false);

  // Compute raw params once, share between applicablePreview and extractedParams
  const paramsFromInput = useMemo(() => {
    if (!rawInput.trim()) return null;
    return extractParams(rawInput);
  }, [rawInput]);

  const applicablePreview = useMemo(() => {
    if (!paramsFromInput) return [];
    return attacks.filter(a => {
      if (a.category === 'Oracle') return false;
      try { return a.applicableCheck(paramsFromInput); } catch { return false; }
    });
  }, [paramsFromInput]);

  const sortedApplicable = useMemo(() =>
    applicablePreview.toSorted((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [applicablePreview],
  );

  const extractedParams = useMemo(() => {
    if (!paramsFromInput) return null;
    return Object.keys(paramsFromInput).length > 0 ? paramsFromInput : null;
  }, [paramsFromInput]);

  const applicableByCategory = useMemo(() => {
    const grouped: Record<string, typeof applicablePreview> = {};
    for (const a of applicablePreview) {
      const cat = a.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(a);
    }
    return grouped;
  }, [applicablePreview]);

  const canCrack = Boolean(extractedParams && applicablePreview.length > 0);
  const handleCopy = useCallback((value: string) => {
    navigator.clipboard.writeText(value).then(
      () => showNotification('Copied to clipboard', 'success'),
      () => showNotification('Failed to copy to clipboard', 'error'),
    );
  }, [showNotification]);

  const {
    running, earlyStop, errorInsights,
    jobs,
    displayedPct,
    testcaseMsg,
    expandedJob, handleToggleJob,
    timer,
    handleCrack, handleStop, handleGenerateTestcase,
  } = useMagicExecution(sortedApplicable, paramsFromInput, setRawInput);

  // NOTE: This listener must stay registered even when MagicPanel is hidden
  // (it is placed before the viewMode early-return below). It depends on
  // MagicPanel being always-mounted in App.tsx — if you ever switch to
  // conditional panel mounting, move the prefill payload into AppContext
  // instead, otherwise events dispatched before mount will be lost.
  useEffect(() => {
    const handler = (event: Event) => {
      const { n, e } = (event as CustomEvent<{ n: string; e?: string }>).detail ?? {};
      if (!n) return;
      const lines = [`n = ${n}`];
      if (e) lines.push(`e = ${e}`);
      setRawInput(lines.join('\n'));
    };
    window.addEventListener('magic-prefill', handler);
    return () => window.removeEventListener('magic-prefill', handler);
  }, []);

  if (viewMode !== 'magic') return null;

  return (
    <Stack direction="vertical" style={flexFill}>
      <Stack direction="vertical" hAlign="center" padding={4} isScrollable style={flexFill}>
        <Stack direction="vertical" gap={2} width="100%" style={{ maxWidth: '40rem' }}>
          <Heading level={3} color="accent">
            <Icon icon={Sparkles} size="sm" /> Magic Cracker
          </Heading>
          <Text type="body" color="secondary">
            Paste everything you have: we&apos;ll figure out which attacks to try
          </Text>

          <TextArea
            label="Raw input (PEM, hex, decimal, key=value pairs…)"
            value={rawInput}
            onChange={setRawInput}
            rows={8}
            width="100%"
          />

          {/* Empty state — show format examples */}
          {!rawInput.trim() && !running && jobs.length === 0 && (
            <Card variant="muted" padding={3}>
              <Stack direction="vertical" gap={1}>
                <Text type="label" color="secondary">
                  Paste any of these formats:
                </Text>
                <Stack direction="vertical" gap={0}>
                  <Text type="code">n = <Text style={{ color: c.cyan }}>1234567890abcdef…</Text></Text>
                  <Text type="code">e = <Text style={{ color: c.cyan }}>65537</Text></Text>
                  <Text type="code" style={{ color: c.comment }}>/ or PEM public key /</Text>
                  <Text type="code" style={{ color: c.comment }}>-----BEGIN RSA PUBLIC KEY-----</Text>
                  <Text type="code" style={{ color: c.comment }}>/ or just hex/decimal n /</Text>
                  <Text type="code" style={{ color: c.comment }}>00c3a7…</Text>
                  <Text type="code" style={{ color: c.comment }}>/ or JSON /</Text>
                  <Text type="code" style={{ color: c.cyan }}>{`{"n": "0x…", "e": 65537, "ct": "…"}`}</Text>
                </Stack>
              </Stack>
            </Card>
          )}

          {/* Extracted params preview */}
          {extractedParams && !running && (
            <ExtractedParams params={extractedParams} onCopy={handleCopy} />
          )}

          {rawInput.trim() && !running && (
            <Text role="status" aria-live="polite" type="body" hasTabularNumbers style={{ color: canCrack ? c.green : c.comment }}>
              {!extractedParams
                ? 'No supported parameters found. Use n = …, a PEM RSA key, hex/decimal n, or JSON such as {"n":"…","e":65537}.'
                : applicablePreview.length === 0
                  ? `Recognized ${Object.keys(extractedParams).join(', ')}. No supported attacks for these values; add relevant RSA parameters.`
                  : `Recognized ${Object.keys(extractedParams).join(', ')}. ${applicablePreview.length} attacks available.`}
            </Text>
          )}

          {/* Applicable preview */}
          {rawInput.trim() && !running && (
            <Stack direction="vertical" gap={0}>
              <Button
                label={`${applicablePreview.length} attacks applicable`}
                variant="ghost"
                width="100%"
                onClick={() => setShowApplicable(!showApplicable)}
                endContent={<Icon icon={showApplicable ? 'arrowUp' : 'chevronDown'} size="sm" />}
              />
              {showApplicable && (
                <ApplicableList byCategory={applicableByCategory} />
              )}
            </Stack>
          )}

          {/* Generate Testcase + Run/Stop buttons */}
          <Stack direction="horizontal" gap={1} width="100%">
            <Button
              label="Generate Testcase"
              variant="ghost"
              width="100%"
              onClick={handleGenerateTestcase}
              icon={<Icon icon={Dices} size="sm" />}
            />

            {running ? (
              <Button
                label="Stop"
                variant="destructive"
                width="100%"
                onClick={handleStop}
                icon={<Icon icon="stop" size="sm" />}
              />
            ) : (
              <Button
                label="Crack It"
                variant="primary"
                width="100%"
                onClick={() => { void handleCrack(); }}
                isDisabled={!canCrack}
                icon={<Icon icon={FlaskConical} size="sm" />}
              />
            )}
          </Stack>

          {testcaseMsg && (
            <Text type="body" justify="center" style={{ color: c.orange }}>
              {testcaseMsg}
            </Text>
          )}

          {/* Progress bar and status */}
          {running && (
            <Stack direction="vertical" gap={1} width="100%">
              <ProgressBar
                label="Magic cracker progress"
                value={displayedPct}
                variant="accent"
              />
              <Stack direction="horizontal" gap={1} hAlign="center" vAlign="center" role="status" aria-live="polite">
                <Spinner size="sm" aria-label="Cracking in progress" />
                <Text type="body" hasTabularNumbers>
                  Elapsed: {timer.formatted} / {jobs.filter(j => j.status !== 'running').length}/{jobs.length} completed
                </Text>
              </Stack>
            </Stack>
          )}

          {earlyStop && (
            <Text type="body" justify="center" style={{ color: c.green }}>
              Found result: stopping early
            </Text>
          )}

          {/* Results summary */}
          {!running && jobs.length > 0 && (
            <Text type="body" justify="center" color="secondary" hasTabularNumbers>
              <Text style={{ color: c.green }}>{jobs.filter(j => j.status === 'success').length} succeeded</Text>
              {', '}
              <Text style={{ color: c.red }}>{jobs.filter(j => j.status === 'error').length} failed</Text>
              {jobs.filter(j => j.status === 'aborted').length > 0 && (
                <>, <Text style={{ color: c.comment }}>{jobs.filter(j => j.status === 'aborted').length} skipped</Text></>
              )}
              {jobs.filter(j => j.status === 'cancelled').length > 0 && (
                <>, <Text style={{ color: c.orange }}>{jobs.filter(j => j.status === 'cancelled').length} cancelled</Text></>
              )}
            </Text>
          )}

          {/* Error insights */}
          {errorInsights && !running && (
            <ErrorInsightBox insights={errorInsights} />
          )}

          {jobs.length > 0 && (
            <>
              <Divider />
              <List density="compact">
                {jobs.map(job => (
                  <JobListItem
                    key={job.attackId}
                    job={job}
                    expanded={expandedJob === job.attackId}
                    onToggle={handleToggleJob}
                    onCopy={handleCopy}
                    attackId={job.attackId}
                  />
                ))}
              </List>
            </>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

export default MagicPanel;
