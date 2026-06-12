import { keyframes } from '@mui/material/styles';
import { draculaColors } from '../theme/dracula';

// ─── Re-export for convenience ──────────────────────────────────────────
// Allows consumers to import draculaColors from one place (styles/shared.ts)
// instead of needing the ../../theme/dracula path from deeply nested files.
export { draculaColors };

// ─── Font families ──────────────────────────────────────────────────────
/** Monospace family used for code, numbers, key values, and most UI text. */
export const MONO_FAMILY = "'JetBrains Mono', monospace" as const;

/** Mixed family for prose-heavy areas: falls back through the OS font stack. */
export const PROSE_FAMILY = `${MONO_FAMILY}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` as const;

// ─── Animations ─────────────────────────────────────────────────────────
/** Spinning hourglass keyframe used for "running" status indicators. */
export const hourglassSpin = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(180deg); }
  50% { transform: rotate(180deg); }
  75% { transform: rotate(360deg); }
  100% { transform: rotate(360deg); }
`;

/** Pulse keyframe for indeterminate status (e.g., service health checks). */
export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

// ─── Layout ─────────────────────────────────────────────────────────────
/**
 * Shared MUI sx style objects for consistent layout and theming across components.
 */
export const flexPanelSx = {
  flex: 1,
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden',
} as const;

export const colFlexSx = {
  ...flexPanelSx,
  flexDirection: 'column' as const,
};

export const centeredPanelSx = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  pb: '20vh',
};

// ─── Output boxes ───────────────────────────────────────────────────────
export const outputBoxSx = {
  mt: 2,
  p: 1,
  borderRadius: 1,
  backgroundColor: draculaColors.currentLine,
  border: `1px solid ${draculaColors.purple}`,
  fontFamily: MONO_FAMILY,
  fontSize: '0.8rem',
  color: draculaColors.foreground,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-all' as const,
  maxHeight: '150px',
  overflow: 'auto',
};

/** Compact output box (small inline results). maxHeight: 200px */
export const compactOutputSx = {
  ...outputBoxSx,
  maxHeight: '200px',
};

/** Medium output box (single-algorithm results). maxHeight: 300px */
export const mediumOutputSx = {
  ...outputBoxSx,
  maxHeight: '300px',
};

/** Tall output box (verbose results with multiple steps). maxHeight: 50vh */
export const tallOutputSx = {
  ...outputBoxSx,
  maxHeight: '50vh',
};

// ─── Tabs ───────────────────────────────────────────────────────────────
export const tabSx = {
  color: draculaColors.comment,
  fontFamily: MONO_FAMILY,
  fontSize: '0.85rem',
  minHeight: 40,
  '&.Mui-selected': {
    color: draculaColors.foreground,
  },
};

// ─── Buttons ────────────────────────────────────────────────────────────
/** Outlined "ghost" button with purple border. */
export const ghostBtnSx = {
  borderColor: draculaColors.purple,
  color: draculaColors.purple,
  fontFamily: MONO_FAMILY,
  fontSize: '0.7rem',
  '&:hover': { backgroundColor: draculaColors.purple, color: draculaColors.background },
  '&:focus-visible': {
    outline: `2px solid ${draculaColors.cyan}`,
    outlineOffset: 2,
  },
} as const;

/** Outlined "ghost" button parameterized by color. */
export function colorGhostBtn(color: string) {
  return {
    borderColor: color,
    color,
    fontFamily: MONO_FAMILY,
    fontSize: '0.8rem',
    '&:hover': { backgroundColor: color, color: draculaColors.background },
    '&:focus-visible': {
      outline: `2px solid ${draculaColors.cyan}`,
      outlineOffset: 2,
    },
  } as const;
}

/** Contained primary action button (purple, monospace). */
export const primaryBtnSx = {
  backgroundColor: draculaColors.purple,
  fontFamily: MONO_FAMILY,
  // Text color intentionally not set — let MUI pick the default
  // primary.contrastText so the disabled state stays readable
  // (light text on draculaColors.comment background).
  '&:hover': { backgroundColor: draculaColors.purpleHover },
  '&:active': { backgroundColor: draculaColors.purpleActive },
  '&:disabled': { backgroundColor: draculaColors.comment },
  '&:focus-visible': {
    outline: `2px solid ${draculaColors.cyan}`,
    outlineOffset: 2,
  },
} as const;

// ─── Headings ───────────────────────────────────────────────────────────
/** Page title (h3) — used at the top of major panels. */
export const pageTitleSx = {
  color: draculaColors.purple,
  mb: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  fontWeight: 700,
} as const;

/** Sub-section title — quieter, used for tertiary headings. */
export const subTitleSx = {
  color: draculaColors.comment,
  fontFamily: MONO_FAMILY,
  fontSize: '0.85rem',
  mb: 1,
} as const;
