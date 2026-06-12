import type { ReactNode, ElementType } from 'react';
import { Box, Typography } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { MONO_FAMILY } from '../../styles/shared';

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
  /** Vertical padding. Defaults to 4. Set 0 when embedded inline in another container. */
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
 *     <Box sx={{ fontFamily: MONO_FAMILY, fontSize: '0.7rem' }}>
 *       <div>n = 0x1234...</div>
 *       <div>e = 65537</div>
 *     </Box>
 *   </EmptyState>
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
  padding = 4,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: padding,
        color: draculaColors.comment,
      }}
    >
      {Icon && (
        <Icon
          sx={{
            fontSize: '2.5rem',
            mb: 1.5,
            color: draculaColors.comment,
            opacity: 0.5,
          }}
        />
      )}
      <Typography
        variant="body1"
        sx={{
          color: draculaColors.comment,
          fontStyle: 'italic',
          fontFamily: MONO_FAMILY,
          mb: hint || children ? 1 : 0,
        }}
      >
        {title}
      </Typography>
      {hint && (
        <Typography
          variant="body2"
          sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, mb: 1 }}
        >
          {hint}
        </Typography>
      )}
      {children}
    </Box>
  );
}
