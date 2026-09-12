import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { dracula } from '@astryxdesign/core/theme/syntax';
import { History } from 'lucide-react';
import type { HistoryEntry } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { useRunVerdict } from '../hooks/useAttackExecution';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { EmptyState } from './_shared/EmptyState';

// Dracula brand tokens (verbatim kit names — never raw hex).
const c = {
  green: 'var(--dracula-green)',
  red: 'var(--dracula-red)',
  purple: 'var(--dracula-purple)',
  cyan: 'var(--dracula-cyan)',
  currentLine: 'var(--dracula-current-line)',
};

/**
 * Verdict for an attack result: prefers the structured verdict threaded
 * through from the run (non-null only when keyed to this exact string),
 * falls back to the trailing TOKEN=SUCCESS / TOKEN=FAILED marker
 * (bare =SUCCESS /=FAILED completion markers included). Last marker wins;
 * prose without a marker yields null (no banner).
 */
function parseVerdict(result: string | null | undefined, structuredVerdict?: 'success' | 'failed' | null): 'success' | 'error' | null {
  if (structuredVerdict === 'success') return 'success';
  if (structuredVerdict === 'failed') return 'error';
  if (!result) return null;
  const tokenMarks = [...result.matchAll(/[A-Z][A-Z0-9_]*=(SUCCESS|FAILED)\b/g)];
  const marks = tokenMarks.length > 0 ? tokenMarks : [...result.matchAll(/=(SUCCESS|FAILED)\b/g)];
  if (marks.length === 0) return null;
  return marks[marks.length - 1][1] === 'SUCCESS' ? 'success' : 'error';
}

export type SageStatus = 'ready' | 'unreachable' | 'unknown';

export const SAGE_META: Record<SageStatus, { variant: 'success' | 'error' | 'neutral'; label: string; text: string; tooltip: string }> = {
  ready: {
    variant: 'success',
    label: 'SageMath ready',
    text: 'Sage ready',
    tooltip: 'SageMathCell is reachable — Sage-dependent attacks can run.',
  },
  unreachable: {
    variant: 'error',
    label: 'SageMath unreachable',
    text: 'Sage unreachable',
    tooltip: 'SageMathCell is unreachable — Sage-dependent attacks will fail.',
  },
  unknown: {
    variant: 'neutral',
    label: 'SageMath status unknown',
    text: 'Sage unknown',
    tooltip: 'Still checking whether SageMathCell is reachable.',
  },
};

// Module-level cache: the reachability probe runs once per session, never per
// mount, so the CDN sees a single lightweight HEAD request at most.
let cachedSageStatus: SageStatus | null = null;

const SAGECELL_SCRIPT_URL = 'https://sagecell.sagemath.org/static/embedded_sagecell.js';

function isSageCellLoaded(): boolean {
  // `sagecell` is declared on Window by useSageMath; the `in` guard keeps the
  // read checked for the window before the deferred CDN script has run.
  return typeof window !== 'undefined' && 'sagecell' in window && Boolean(window.sagecell);
}

// Single-flight CDN reachability ping. An opaque no-cors success means the
// path is alive but says nothing about the script itself (callers keep polling
// `window.sagecell`); a rejection means the CDN is unreachable.
let sageProbePromise: Promise<boolean> | null = null;
function probeSageCellOnce(): Promise<boolean> {
  if (!sageProbePromise) {
    sageProbePromise = fetch(SAGECELL_SCRIPT_URL, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' }).then(
      () => true,
      () => false,
    );
  }
  return sageProbePromise;
}

/**
 * Three-state SageMathCell reachability without hammering the CDN: the
 * deferred script flag is polled locally (no network traffic), a single cached
 * ping detects an unreachable CDN, and errors from the existing Sage
 * session/stall state (useSageMath) surface here via outputError.
 */
export function useSageStatus(outputError: string | null): SageStatus {
  const [probed, setProbed] = useState<SageStatus>(() => {
    if (cachedSageStatus) return cachedSageStatus;
    if (isSageCellLoaded()) {
      cachedSageStatus = 'ready';
      return 'ready';
    }
    return 'unknown';
  });

  useEffect(() => {
    if (cachedSageStatus === 'ready') return;
    let cancelled = false;
    const poll = window.setInterval(() => {
      if (cancelled) return;
      if (isSageCellLoaded()) {
        cachedSageStatus = 'ready';
        setProbed('ready');
        window.clearInterval(poll);
      }
    }, 1000);
    void probeSageCellOnce().then((reachable) => {
      if (cancelled) return;
      if (isSageCellLoaded()) {
        cachedSageStatus = 'ready';
        setProbed('ready');
      } else if (!reachable && !cachedSageStatus) {
        cachedSageStatus = 'unreachable';
        setProbed((prev) => (prev === 'ready' ? prev : 'unreachable'));
      }
    });
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  // Derived during render (no cascading render): an error from the existing
  // Sage session/stall state forces unreachable without extra probing.
  if (outputError && /sagecell|\bsage\b|kernel|stall/i.test(outputError)) return 'unreachable';
  return probed;
}

function HistoryListItem({ entry, isSelected, onClick }: { entry: HistoryEntry; isSelected: boolean; onClick: () => void }) {
  return (
    <ListItem
      isSelected={isSelected}
      onClick={onClick}
      startContent={<Icon icon={entry.success ? 'success' : 'error'} color={entry.success ? 'success' : 'error'} size="sm" />}
      label={
        <Text type="body" style={{ color: entry.success ? c.green : c.red }}>
          {entry.attackName}
        </Text>
      }
      description={
        <Text type="supporting" hasTabularNumbers>
          Preview · {entry.timestamp.toLocaleTimeString()}
        </Text>
      }
    />
  );
}

export function OutputPanel({ onCollapseResults }: { onCollapseResults?: () => void } = {}) {
  const { outputResult, outputError, history, clearHistory, showNotification } = useAppContext();
  const [ui, setUi] = useState({ historySelectedKey: null as string | null, historyOpen: false, confirmOpen: false });
  const { copied, copy } = useCopyToClipboard();

  const displayResult = useMemo(() => {
    if (!ui.historySelectedKey) return outputResult;
    return history.find(h => h.id === ui.historySelectedKey)?.result ?? null;
  }, [ui.historySelectedKey, history, outputResult]);

  const runVerdict = useRunVerdict();
  const structuredVerdict = runVerdict && displayResult !== null && runVerdict.result === displayResult ? runVerdict.verdict : null;
  const verdict = useMemo(() => parseVerdict(displayResult, structuredVerdict), [displayResult, structuredVerdict]);
  const sageStatus = useSageStatus(outputError);

  const handleHistoryClick = useCallback((key: string) => {
    setUi(prev => ({ ...prev, historySelectedKey: key }));
  }, []);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth <= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopy = async () => {
    if (!displayResult) return;
    if (!await copy(displayResult)) showNotification('Could not copy to clipboard.', 'error');
  };

  return (
    <Stack
      direction="vertical"
      isScrollable
      style={isNarrow ? { width: '100%' } : { width: '100%', height: '100%', minHeight: 0 }}
    >
      <Stack direction="vertical" gap={2} padding={4} isScrollable style={isNarrow ? {} : { flex: 1, minHeight: 0 }}>
        <Stack direction="horizontal" gap={1} vAlign="center">
          <Heading level={3} color="accent">
            Results
          </Heading>
          {onCollapseResults && (
            <IconButton
              label="Collapse results"
              variant="ghost"
              size="sm"
              icon={<Icon icon="chevronRight" size="sm" />}
              onClick={onCollapseResults}
            />
          )}
        </Stack>

        {ui.historySelectedKey && (
          <Stack direction="horizontal" gap={1} vAlign="center">
            <Icon icon={History} size="sm" color="accent" />
            <Text type="body" style={{ color: c.cyan }}>
              Preview: {history.find(h => h.id === ui.historySelectedKey)?.attackName ?? ''}
            </Text>
            <Button
              label="Back"
              size="sm"
              variant="ghost"
              onClick={() => { setUi(prev => ({ ...prev, historySelectedKey: null })); }}
              icon={<Icon icon="chevronLeft" size="sm" />}
            />
          </Stack>
        )}

        {displayResult && (
          <>
            {verdict && (
              <Banner
                status={verdict}
                title={verdict === 'success' ? 'Attack succeeded' : 'Attack failed'}
                data-testid="verdict-banner"
              />
            )}
            <CodeBlock
              code={displayResult}
              language="plaintext"
              syntaxTheme={dracula}
              width="100%"
              isWrapped
              maxHeight="50vh"
              data-testid="output-result"
              aria-describedby={ui.historySelectedKey ? 'history-preview-guidance' : undefined}
            />

            {ui.historySelectedKey && (
              <Text id="history-preview-guidance" type="body" color="secondary">
                Preview only. Select original inputs and rerun this attack to view complete output.
              </Text>
            )}
            <Stack direction="horizontal" gap={1} vAlign="center">
              <IconButton
                label="Copy result"
                tooltip="Copy result"
                variant="ghost"
                size="sm"
                onClick={() => { void handleCopy(); }}
                icon={<Icon icon="copy" size="sm" />}
              />
              {copied && (
                <Text type="body" aria-live="polite" style={{ color: c.green }}>
                  Copied to clipboard!
                </Text>
              )}
            </Stack>
          </>
        )}

        {outputError && (
          <Text type="code" data-testid="output-error" style={{ color: c.red, whiteSpace: 'pre-wrap' }}>
            {outputError}
          </Text>
        )}

        {!displayResult && !outputError && !ui.historySelectedKey && (
          sageStatus === 'unreachable' ? (
            <EmptyState
              title="SageMath is unreachable — Sage-dependent attacks will fail"
              hint="Check your network connection, then reload. Attacks with a local check still work."
            />
          ) : (
            <EmptyState title="Run an attack to see results here" />
          )
        )}
      </Stack>

      <Stack direction="vertical" padding={4} paddingBlockStart={0}>
        <Button
          label={`History (${history.length})`}
          variant="ghost"
          width="100%"
          onClick={() => setUi(prev => ({ ...prev, historyOpen: !prev.historyOpen }))}
          endContent={<Icon icon={ui.historyOpen ? 'arrowUp' : 'chevronDown'} size="sm" />}
        />

        {ui.historyOpen && (
          <>
            <List density="compact">
              {history.map((entry) => {
                const key = entry.id;
                const selected = ui.historySelectedKey === key;
                return (
                  <HistoryListItem
                    key={key}
                    entry={entry}
                    isSelected={selected}
                    onClick={() => handleHistoryClick(key)}
                  />
                );
              })}
            </List>
            <Stack direction="horizontal" hAlign="center">
              <Button
                label="Clear All"
                size="sm"
                variant="destructive"
                onClick={() => setUi(prev => ({ ...prev, confirmOpen: true }))}
                isDisabled={history.length === 0}
              />
            </Stack>
          </>
        )}
      </Stack>

      <Dialog
        isOpen={ui.confirmOpen}
        onOpenChange={(open) => setUi(prev => ({ ...prev, confirmOpen: open }))}
      >
        <DialogHeader
          title="Clear History?"
          onOpenChange={(open) => setUi(prev => ({ ...prev, confirmOpen: open }))}
        />
        <Stack direction="vertical" gap={2} padding={3}>
          <Text type="body" color="secondary" hasTabularNumbers>
            This will permanently delete all {history.length} history entries.
          </Text>
          <Stack direction="horizontal" gap={1} hAlign="end">
            <Button
              label="Cancel"
              variant="ghost"
              onClick={() => setUi(prev => ({ ...prev, confirmOpen: false }))}
            />
            <Button
              label="Clear All"
              variant="destructive"
              onClick={() => {
                clearHistory();
                setUi(prev => ({ ...prev, confirmOpen: false, historySelectedKey: null }));
              }}
            />
          </Stack>
        </Stack>
      </Dialog>
    </Stack>
  );
}
