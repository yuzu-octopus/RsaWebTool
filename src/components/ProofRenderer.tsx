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

// Module-level regex constants (compiled once, not per parseProof call)
const displayMathRegex = /\\begin\{(align\*|equation\*|gather\*|aligned)\}([\s\S]*?)\\end\{\1\}/g;
const itemizeRegex = /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g;
const inlineMathRegex = /\$([^$]+)\$|\\\(([^)]+)\\\)/g;

/**
 * Parses a LaTeX proof string into segments.
 */
function parseProof(latex: string): ProofSegment[] {
  const segments: ProofSegment[] = [];
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
 * Heuristically wraps math-like expressions in text with $...$ delimiters.
 */
function autoWrapMathInParagraph(text: string): string {
  // Split by existing math blocks to avoid double wrapping
  const parts = text.split(/([$][^$]+[$]|\\\(.*?[^\\]\\\))/);
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue; // Already math
    
    const current = parts[i];
    const tokens = current.split(/(\s+|[.,;:!]+)/).filter(t => t !== '');
    let inMath = false;
    let mathSegment: string[] = [];
    const newWords: string[] = [];
    
    const mathFunctionNames = ['log', 'gcd', 'mod', 'div', 'lcm', 'max', 'min', 'sin', 'cos', 'tan', 'det', 'res', 'ln', 'exp', 'deg'];
    
    const isMathToken = (token: string, canStart: boolean): boolean => {
      const t = token.trim();
      if (!t) return false;
      
      if (t.includes('\\') || t.includes('_') || t.includes('^') || /[=<>+\-*|~]/.test(t) || t.includes('/')) {
        return true;
      }
      
      if (/^[a-zA-Z]$/.test(t)) {
        return true;
      }
      
      if (/^[0-9]+(\.[0-9]+)?$/.test(t)) {
        return true;
      }
      
      // Case-sensitive check for math functions
      if (mathFunctionNames.includes(t)) {
        return true;
      }
      
      if (new RegExp('^[()\\[\\]{}]+$').test(t)) {
        return true;
      }
      
      if (/^[.,;:!]+$/.test(t)) {
        return !canStart;
      }
      
      if (/^[a-zA-Z]{2,}$/.test(t)) {
        return false;
      }
      
      if (/^[\]a-zA-Z0-9()[{},.:;!+=<>*/|\\_-]+$/.test(t)) {
        return /[^a-zA-Z]/.test(t);
      }
      
      return false;
    };
    
    const hasStrongMathIndicator = (segment: string[]): boolean => {
      const combined = segment.join('');
      return combined.includes('\\') || combined.includes('_') || combined.includes('^') || /[=<>+\-*/|]/.test(combined);
    };
    
    const flushMath = () => {
      if (mathSegment.length > 0) {
        const segmentToWrap = [...mathSegment];
        let trailingPunc = '';
        
        while (segmentToWrap.length > 0) {
          const lastToken = segmentToWrap[segmentToWrap.length - 1];
          if (/^[.,;:!]+$/.test(lastToken.trim())) {
            trailingPunc = lastToken + trailingPunc;
            segmentToWrap.pop();
          } else {
            break;
          }
        }
        
        if (segmentToWrap.length > 0 && hasStrongMathIndicator(segmentToWrap)) {
          newWords.push('$' + segmentToWrap.join('') + '$' + trailingPunc);
        } else {
          newWords.push(mathSegment.join(''));
        }
        mathSegment = [];
      }
      inMath = false;
    };
    
    for (const w of tokens) {
      if (/^\s+$/.test(w)) {
        if (inMath) {
          mathSegment.push(w);
        } else {
          newWords.push(w);
        }
        continue;
      }
      
      if (isMathToken(w, !inMath)) {
        inMath = true;
        mathSegment.push(w);
      } else {
        flushMath();
        newWords.push(w);
      }
    }
    flushMath();
    
    parts[i] = newWords.join('');
  }
  
  return parts.join('');
}

/**
 * Renders text that may contain inline math ($...$).
 */
function InlineMath({ text }: { text: string }) {
  const processedText = useMemo(() => autoWrapMathInParagraph(text), [text]);

  const parts = useMemo(() => {
    const result: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;

    // Reset lastIndex as regex is stateful (global flag)
    inlineMathRegex.lastIndex = 0;
    while ((match = inlineMathRegex.exec(processedText)) !== null) {
      if (match.index > lastIdx) {
        const textContent = processedText.slice(lastIdx, match.index);
        result.push(
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
        html !== undefined
          ? <span key={"math-" + result.length} dangerouslySetInnerHTML={{ __html: html }} />
          : <span key={"math-" + result.length}>{`$${mathContent}$`}</span>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < processedText.length) {
      const textContent = processedText.slice(lastIdx);
      result.push(
        <span key={"txt-" + result.length} dangerouslySetInnerHTML={{ __html: renderInlineText(textContent) }} />
      );
    }

    return result;
  }, [processedText]);

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
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
                  <Box key={i} sx={{ my: 2, color: draculaColors.red, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>
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
              return skipRest && rendered.length === 0 ? null : <Box key={i}>{rendered}</Box>;
            }

            return null;
          })}
        </Box>
      </Box>
    </Box>
  );
}
