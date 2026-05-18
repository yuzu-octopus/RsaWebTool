import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Box, Typography } from '@mui/material';
import { draculaColors } from '../theme/dracula';

/**
 * Applies Unicode replacements to text-only content.
 */
function applyTextReplacements(text: string): string {
  let result = text;
  result = result.replace(/\\cdot/g, '·');
  result = result.replace(/\\times/g, '×');
  result = result.replace(/\\leq/g, '≤');
  result = result.replace(/\\geq/g, '≥');
  result = result.replace(/\\neq/g, '≠');
  result = result.replace(/\\approx/g, '≈');
  result = result.replace(/\\infty/g, '∞');
  result = result.replace(/\\quad/g, '    ');
  result = result.replace(/\\,/g, ' ');
  result = result.replace(/\\qed/g, '∎');
  return result;
}

interface ProofSegment {
  type: 'text' | 'displayMath' | 'list';
  content: string;
  env?: string; // LaTeX environment name for displayMath
}

/**
 * Parses a LaTeX proof string into segments.
 */
function parseProof(latex: string): ProofSegment[] {
  const segments: ProofSegment[] = [];
  const displayMathRegex = /\\begin\{(align\*|equation\*|gather\*|aligned)\}([\s\S]*?)\\end\{\1\}/g;
  let lastEnd = 0;
  let m;

  while ((m = displayMathRegex.exec(latex)) !== null) {
    // Text before this math block
    if (m.index > lastEnd) {
      const textBefore = latex.slice(lastEnd, m.index);
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
  if (lastEnd < latex.length) {
    const textAfter = latex.slice(lastEnd);
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
  const itemizeRegex = /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g;
  let lastEnd = 0;
  let m;

  while ((m = itemizeRegex.exec(text)) !== null) {
    if (m.index > lastEnd) {
      const before = text.slice(lastEnd, m.index).trim();
      if (before) segments.push({ type: 'text', content: applyTextReplacements(before) });
    }
    segments.push({ type: 'list', content: m[1] });
    lastEnd = m.index + m[0].length;
  }

  if (lastEnd < text.length) {
    const after = text.slice(lastEnd).trim();
    if (after) segments.push({ type: 'text', content: applyTextReplacements(after) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: applyTextReplacements(text) }];
}

/**
 * Renders text that may contain inline math ($...$).
 */
function InlineMath({ text }: { text: string }) {
  const parts = useMemo(() => {
    const result: React.ReactNode[] = [];
    const inlineRegex = /\$([^$]+)\$|\\\(([^)]+)\\\)/g;
    let lastIdx = 0;
    let match;
    let key = 0;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        result.push(
          <span key={key} dangerouslySetInnerHTML={{ __html: renderInlineText(text.slice(lastIdx, match.index)) }} />
        );
        key++;
      }
      const mathContent = match[1] ?? match[2];
      try {
        const html = katex.renderToString(mathContent, { throwOnError: false, displayMode: false });
        result.push(<span key={key} dangerouslySetInnerHTML={{ __html: html }} />);
        key++;
      } catch {
        result.push(<span key={key}>{`$${mathContent}$`}</span>);
        key++;
      }
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      result.push(
        <span key={key} dangerouslySetInnerHTML={{ __html: renderInlineText(text.slice(lastIdx)) }} />
      );
    }

    return result;
  }, [text]);

  return <>{parts}</>;
}

/**
 * Converts LaTeX text commands to HTML for rendering.
 */
function renderInlineText(text: string): string {
  let html = text;
  html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\text\{([^}]*)\}/g, '$1');
  html = html.replace(/\\newline/g, '<br/>');
  return html;
}

/**
 * Renders a LaTeX proof string using KaTeX directly.
 */
export function ProofRenderer({ latex }: { latex: string }) {
  const segments = useMemo(() => parseProof(latex), [latex]);

  return (
    <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            color: draculaColors.foreground,
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
          {segments.map((segment, i) => {
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
                  <Box key={i} sx={{ my: 2 }}>
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
                  <Box key={i} sx={{ my: 2, color: draculaColors.red, fontFamily: 'monospace', fontSize: '0.8rem' }}>
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
                  let cleaned = item.trim().replace(/\\$/g, '');
                  // Apply text replacements for common LaTeX commands
                  cleaned = applyTextReplacements(cleaned);
                  return cleaned;
                });
              return (
                <Box key={i} component="ul" sx={{ my: 1, pl: 2 }}>
                  {items.map((item, j) => (
                    <Box key={j} component="li" sx={{ mb: 0.5, color: draculaColors.foreground }}>
                      <InlineMath text={item} />
                    </Box>
                  ))}
                </Box>
              );
            }

            if (segment.type === 'text') {
              // Split by paragraphs (double newlines)
              const paragraphs = segment.content.split(/\n\n+/).filter(p => p.trim());
              return (
                <Box key={i}>
                  {paragraphs.map((para, j) => {
                    // Detect heading patterns like "Theorem:", "Proof:", "References:"
                    const headingMatch = para.match(/^(Theorem|Prerequisites|Proof|References):\s*(.*)/s);
                    if (headingMatch) {
                      return (
                        <Typography key={j} variant="body1" sx={{ my: 1 }}>
                          <strong>{headingMatch[1]}:</strong>{' '}
                          <InlineMath text={headingMatch[2]} />
                        </Typography>
                      );
                    }
                    return (
                      <Typography key={j} variant="body1" sx={{ my: 1 }}>
                        <InlineMath text={para} />
                      </Typography>
                    );
                  })}
                </Box>
              );
            }

            return null;
          })}
        </Box>
      </Box>
    </Box>
  );
}
