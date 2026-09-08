import type { ReactNode, ElementType } from 'react';
import { EmptyState as AstryxEmptyState } from '@astryxdesign/core/EmptyState';
import { Stack } from '@astryxdesign/core/Stack';

/**
 * Props stay compatible with every existing call site (InputPanel,
 * OutputPanel): icon component type, string-or-rich hint, rich children,
 * and MUI-era numeric padding.
 */
export interface EmptyStateProps {
  /** Optional icon component to render above the title (e.g., `Calculate`, `HourglassEmpty`). */
  icon?: ElementType;
  /** The primary message (e.g., "Select an attack from the sidebar"). */
  title: string;
  /** Optional secondary hint text, shown below the title. */
  hint?: ReactNode;
  /**
   * Optional rich content rendered below the hint. Use for:
   *   - Format examples (MagicPanel)
   *   - "Try X" suggestions
   *   - Anything beyond a single line of text
   */
  children?: ReactNode;
  /** Compact rendering when 0 (embedded inline); comfortable otherwise. Defaults to 4. */
  padding?: number;
}

/**
 * Standard empty-state placeholder. Replaces the inconsistent
 * "italic body text" messages scattered across panels.
 *
 * @example
 *   // Simple:
 *   <EmptyState title="Select an attack from the sidebar" />
 *
 *   // With icon and hint:
 *   <EmptyState
 *     icon={HourglassEmpty}
 *     title="Run an attack to see results here"
 *     hint="Or try the Magic Panel to auto-detect parameters"
 *   />
 *
 *   // With rich example content (MagicPanel-style):
 *   <EmptyState title="Paste any of these formats:">
 *     <Text type="code">n = 0x1234...</Text>
 *     <Text type="code">e = 65537</Text>
 *   </EmptyState>
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
  padding = 4,
}: EmptyStateProps) {
  // Core description only accepts plain strings; rich hints render below.
  const description = typeof hint === 'string' ? hint : undefined;
  const richHint = typeof hint === 'string' ? undefined : hint;
  return (
    <Stack hAlign="center" vAlign="center" height="100%" gap={1} padding={2}>
      <AstryxEmptyState
        title={title}
        description={description}
        icon={Icon ? <Icon /> : undefined}
        isCompact={padding === 0}
      />
      {richHint}
      {children}
    </Stack>
  );
}
