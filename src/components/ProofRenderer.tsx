import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Box, Typography } from '@mui/material';
import { draculaColors } from '../theme/dracula';
import { MONO_FAMILY, PROSE_FAMILY } from '../styles/shared';
interface ProofSegment {
  type: 'text' | 'displayMath' | 'list';
  content: string;
  env?: string; // LaTeX environment name for displayMath
}

// Module-level regex constants (compiled once, not per parseProof call)
const displayMathRegex = /\\begin\{(align\*|equation\*|gather\*|aligned)\}([\s\S]*?)\\end\{\1\}/g;
const itemizeRegex = /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g;
const inlineMathRegex = /\$([^$]+)\$|\\\(([^)]+)\\\)/g;

/**
 * Parses a LaTeX proof string into segments.
 */
function parseProof(latex: string): ProofSegment[] {
  // Normalize $$...$$ display math blocks to \begin{equation*}...\end{equation*}
  // for consistent handling by the existing displayMathRegex
  const text = latex.replace(/\$\$((?:\\.|[^$])+)\$\$/g, (_match, inner) => `\\begin{equation*}${inner}\\end{equation*}`);

  const segments: ProofSegment[] = [];
  let lastEnd = 0;
  let m;

  while ((m = displayMathRegex.exec(text)) !== null) {
    // Text before this math block
    if (m.index > lastEnd) {
      const textBefore = text.slice(lastEnd, m.index);
      const textSegments = parseTextBlock(textBefore);
      segments.push(...textSegments);
    }
    // Display math block - keep env name for re-wrapping
    segments.push({
      type: 'displayMath',
      content: m[2].trim().replace(/\\\\\s*$/, ''),
      env: m[1],
    });
    lastEnd = m.index + m[0].length;
  }

  // Remaining text after last math block
  if (lastEnd < text.length) {
    const textAfter = text.slice(lastEnd);
    const textSegments = parseTextBlock(textAfter);
    segments.push(...textSegments);
  }

  return segments;
}

/**
 * Parses a text block into smaller segments (lists, plain text).
 */
function parseTextBlock(text: string): ProofSegment[] {
  const segments: ProofSegment[] = [];
  let lastEnd = 0;
  let m;

  while ((m = itemizeRegex.exec(text)) !== null) {
    if (m.index > lastEnd) {
      const before = text.slice(lastEnd, m.index).trim();
      if (before) segments.push({ type: 'text', content: before });
    }
    segments.push({ type: 'list', content: m[1] });
    lastEnd = m.index + m[0].length;
  }

  if (lastEnd < text.length) {
    const after = text.slice(lastEnd).trim();
    if (after) segments.push({ type: 'text', content: after });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/**
 * Renders text that may contain inline math ($...$).
 */
function InlineMath({ text }: { text: string }) {
  const parts = useMemo(() => {
    const result: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;

    // Reset lastIndex as regex is stateful (global flag)
    inlineMathRegex.lastIndex = 0;
    while ((match = inlineMathRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        const textContent = text.slice(lastIdx, match.index);
        result.push(
          // SAFE: renderInlineText only emits a fixed set of HTML wrappers
          // (<code>, <span>, <em>, <u>, <strong>) around captured groups.
          // Input is bundled LaTeX proof text (not user input).
          <span key={"txt-" + result.length} dangerouslySetInnerHTML={{ __html: renderInlineText(textContent) }} />
        );
      }
      const mathContent = match[1] ?? match[2];
      let html: string | undefined;
      try {
        html = katex.renderToString(mathContent, { throwOnError: false, displayMode: false });
      } catch {
        /* fall through — html stays undefined, render raw fallback below */
      }
      result.push(
        // SAFE: katex.renderToString produces sanitized HTML (KaTeX escapes
        // user input internally) — no executable script, no event handlers.
        html !== undefined
          ? <span key={"math-" + result.length} dangerouslySetInnerHTML={{ __html: html }} />
          : <span key={"math-" + result.length}>{`$${mathContent}$`}</span>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      const textContent = text.slice(lastIdx);
      result.push(
        <span key={"txt-" + result.length} dangerouslySetInnerHTML={{ __html: renderInlineText(textContent) }} />
      );
    }

    return result;
  }, [text]);

  return <>{parts}</>;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converts LaTeX text commands to HTML for rendering.
 */
function renderInlineText(text: string): string {
  let html = escapeHtml(text);
  // Process LaTeX command wrappers before escape sequences
  html = html.replace(/\\texttt\{([^}]*)\}/g, '<code>$1</code>');
  html = html.replace(/\\text\{([^}]*)\}/g, '<span>$1</span>');
  html = html.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>');
  html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\&/g, '&');
  html = html.replace(/\\#/g, '#');
  html = html.replace(/\\%/g, '%');
  html = html.replace(/\\'/g, "'");
  return html;
}

/**
 * Renders a LaTeX proof string using KaTeX directly.
 */
export function ProofRenderer({ latex }: { latex: string }) {
  const segments = useMemo(() => parseProof(latex), [latex]);

  return (
    <Box sx={{ overflow: 'auto', flex: 1 }}>
        <Box
          sx={{
            color: draculaColors.foreground,
            fontFamily: PROSE_FAMILY,
            lineHeight: 1.8,
            '& .katex-display': {
              margin: '1.2em 0',
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '0.5em 0',
            },
            '& .katex': {
              fontSize: '1.1em',
            },
            '& ul, & ol': {
              margin: '0.75em 0',
              paddingLeft: '1.5em',
            },
            '& li': {
              marginBottom: '0.35em',
            },
            '& p': {
              margin: '0.75em 0',
            },
          }}
        >
          {segments.map((segment) => {
            if (segment.type === 'displayMath') {
              // Re-wrap content in the original environment for proper alignment parsing
              // Track if \qed was present to append tombstone symbol
              const hasQed = segment.content.includes('\\qed');
              const content = segment.content.replace(/\\qed/g, '');
              const wrappedContent = segment.env
                ? `\\begin{${segment.env}}${content}\\end{${segment.env}}`
                : content;
              try {
                const html = katex.renderToString(wrappedContent, {
                  throwOnError: false,
                  displayMode: true,
                });
                return (
                  <Box key={'dm-' + segment.content.slice(0, 20)} sx={{ my: 2 }}>
                    {/* SAFE: katex.renderToString produces sanitized HTML (KaTeX
                        escapes user input internally). Input is bundled proof
                        LaTeX. */}
                    <Box component="div" dangerouslySetInnerHTML={{ __html: html }} />
                    {hasQed && (
                      <Box component="span" sx={{ float: 'right', mr: 2, fontSize: '1.2em' }}>
                        ∎
                      </Box>
                    )}
                  </Box>
                );
              } catch {
                return (
                  <Box key={'dm-err-' + segment.content.slice(0, 20)} sx={{ my: 2, color: draculaColors.red, fontFamily: MONO_FAMILY, fontSize: '0.8rem' }}>
                    Math render error
                  </Box>
                );
              }
            }

            if (segment.type === 'list') {
              const items = segment.content
                .split(/\\item\s*/)
                .filter(item => item.trim().length > 0)
                .map(item => {
                  const cleaned = item.trim().replace(/\\$/g, '');
                  return cleaned;
                });
              return (
                <Box key={'list-' + segment.content.slice(0, 20)} component="ul" sx={{ my: 1, pl: 2 }}>
                  {items.map((item) => (
                    <Box key={'li-' + item.slice(0, 20).replace(/\s+/g, '_')} component="li" sx={{ mb: 0.5, color: draculaColors.foreground }}>
                      <InlineMath text={item} />
                    </Box>
                  ))}
                </Box>
              );
            }

            if (segment.type === 'text') {
              // Split by paragraphs (double newlines)
              const paragraphs = segment.content.split(/\n\n+/).filter(p => p.trim());
              let skipRest = false;
              const rendered: React.ReactNode[] = [];
              for (let j = 0; j < paragraphs.length; j++) {
                const para = paragraphs[j];
                // Detect heading patterns like \textbf{Theorem}: or Theorem:
                // Generic: captures any \textbf{...}: or CapitalWord: pattern
                const headingMatch = para.match(/^\\textbf\{([^:]+):\}\s*(.*)/s) || para.match(/^([A-Z][a-zA-Z\s]+):\s*(.*)/s);
                if (headingMatch && headingMatch[1] === 'References') {
                  skipRest = true;
                  break;
                }
                if (headingMatch) {
                  rendered.push(
                    <Typography key={j} variant="body1" sx={{ my: 1 }}>
                      <strong>{headingMatch[1]}:</strong>{' '}
                      <InlineMath text={headingMatch[2]} />
                    </Typography>
                  );
                } else {
                  rendered.push(
                    <Typography key={j} variant="body1" sx={{ my: 1 }}>
                      <InlineMath text={para} />
                    </Typography>
                  );
                }
              }
              return skipRest && rendered.length === 0 ? null : <Box key={'text-' + segment.content.slice(0, 20)}>{rendered}</Box>;
            }

            return null;
          })}
        </Box>
    </Box>
  );
}
