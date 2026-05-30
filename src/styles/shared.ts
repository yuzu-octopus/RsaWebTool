import { draculaColors } from '../theme/dracula';

export const FONT_FAMILY = "'JetBrains Mono', monospace" as const;

/**
 * Custom Dracula syntax theme for react-syntax-highlighter (Prism).
 * Based on the official Dracula spec: https://spec.draculatheme.com/
 * Covers all core + recommended Prism token selectors for Python/SageMath + TypeScript.
 */
export const draculaSourceTheme: Record<string, React.CSSProperties> = {
  // === Base styles ===
  'code[class*="language-"]': {
    color: draculaColors.foreground,
    background: 'none',
    fontFamily: FONT_FAMILY,
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: draculaColors.foreground,
    background: draculaColors.background,
    fontFamily: FONT_FAMILY,
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
    padding: '1em',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0',
  },
  ':not(pre) > code[class*="language-"]': {
    background: draculaColors.background,
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal',
  },

  // === Comments ===
  comment: { color: draculaColors.comment },
  prolog: { color: draculaColors.comment },
  doctype: { color: draculaColors.comment },
  cdata: { color: draculaColors.comment },

  // === Punctuation & structure ===
  punctuation: { color: draculaColors.foreground },
  namespace: { opacity: '.7' },

  // === Properties & tags (HTML) ===
  property: { color: draculaColors.pink },
  tag: { color: draculaColors.pink },

  // === Booleans, numbers, constants ===
  boolean: { color: draculaColors.purple },
  number: { color: draculaColors.purple },
  constant: { color: draculaColors.purple },
  symbol: { color: draculaColors.purple },

  // === Selectors, attributes (CSS/HTML) ===
  selector: { color: draculaColors.green },
  'attr-name': { color: draculaColors.yellow },

  // === Strings & chars ===
  string: { color: draculaColors.green },
  char: { color: draculaColors.green },
  builtin: { color: draculaColors.green },
  inserted: { color: draculaColors.green },

  // === Operators & entities ===
  operator: { color: draculaColors.purple },
  entity: { color: draculaColors.foreground, cursor: 'help' },
  url: { color: draculaColors.foreground },
  '.language-css .token.string': { color: draculaColors.foreground },
  '.style .token.string': { color: draculaColors.foreground },

  // === Variables ===
  variable: { color: draculaColors.foreground },

  // === Keywords, functions, classes ===
  atrule: { color: draculaColors.yellow },
  'attr-value': { color: draculaColors.yellow },
  function: { color: draculaColors.cyan },
  'class-name': { color: draculaColors.cyan },
  keyword: { color: draculaColors.pink },

  // === Regex & importance ===
  regex: { color: draculaColors.orange },
  important: { color: draculaColors.orange, fontWeight: 'bold' },

  // === Text formatting ===
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },

  // === Diffs ===
  deleted: { color: draculaColors.red },
  changed: { color: draculaColors.orange, fontStyle: 'italic' },

  // === Escape sequences (Python \n, JS \\, TS template) ===
  escape: { color: draculaColors.pink },

  // === Function parameters ===
  parameter: { color: draculaColors.foreground },

  // === Heuristic class references (Prism 1.24+) ===
  'maybe-class-name': { color: draculaColors.cyan },

  // === Template strings (JS/TS backticks) ===
  'template-string': { color: draculaColors.green },
  'template-punctuation': { color: draculaColors.green },
};

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
};

export const outputBoxSx = {
  mt: 2,
  p: 1,
  borderRadius: 1,
  backgroundColor: draculaColors.currentLine,
  border: `1px solid ${draculaColors.purple}`,
  fontFamily: FONT_FAMILY,
  fontSize: '0.8rem',
  color: draculaColors.foreground,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-all' as const,
  maxHeight: '150px',
  overflow: 'auto',
};

export const tabSx = {
  color: draculaColors.comment,
  fontFamily: FONT_FAMILY,
  fontSize: '0.85rem',
  minHeight: 40,
  '&.Mui-selected': {
    color: draculaColors.foreground,
  },
};

export const ghostBtnSx = {
  borderColor: draculaColors.purple,
  color: draculaColors.purple,
  fontFamily: FONT_FAMILY,
  fontSize: '0.7rem',
  '&:hover': { backgroundColor: draculaColors.purple, color: draculaColors.background },
} as const;

export function colorGhostBtn(color: string) {
  return {
    borderColor: color,
    color,
    fontFamily: FONT_FAMILY,
    fontSize: '0.8rem',
    '&:hover': { backgroundColor: color, color: draculaColors.background },
  } as const;
}
