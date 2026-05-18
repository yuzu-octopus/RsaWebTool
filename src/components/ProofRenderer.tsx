import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Box, Typography } from '@mui/material';
import { draculaColors } from '../theme/dracula';

function renderInlineMath(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false, displayMode: false });
    } catch {
      return `$${math}$`;
    }
  });
}

function formatTextBlock(text: string): string {
  let html = text;
  // LaTeX bold
  html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  // LaTeX italic
  html = html.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  // LaTeX text
  html = html.replace(/\\text\{([^}]*)\}/g, '$1');
  // LaTeX commands that appear in text
  html = html.replace(/\\cdot/g, '·');
  html = html.replace(/\\times/g, '×');
  html = html.replace(/\\leq/g, '≤');
  html = html.replace(/\\geq/g, '≥');
  html = html.replace(/\\neq/g, '≠');
  html = html.replace(/\\approx/g, '≈');
  html = html.replace(/\\infty/g, '∞');
  html = html.replace(/\\quad/g, '    ');
  html = html.replace(/\\,/g, ' ');
  // Inline math
  html = renderInlineMath(html);
  return html;
}

function parseProof(latex: string): React.ReactNode[] {
  const lines = latex.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Math environments: align*, equation*, gather*
    const mathEnvMatch = line.match(/^\\begin\{(align\*|equation\*|gather\*|aligned)\}/);
    if (mathEnvMatch) {
      const envName = mathEnvMatch[1];
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].includes(`\\end{${envName}}`)) {
        mathLines.push(lines[i]);
        i++;
      }
      i++; // skip \end
      const mathContent = mathLines.join('\n').trim();
      try {
        const html = katex.renderToString(mathContent, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        });
        elements.push(
          <Box key={`math-${elements.length}`} sx={{ my: 2, overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: html }} />
        );
      } catch {
        elements.push(
          <Box key={`math-${elements.length}`} sx={{ my: 2, fontFamily: 'monospace', color: draculaColors.comment, whiteSpace: 'pre-wrap' }}>
            {mathContent}
          </Box>
        );
      }
      continue;
    }

    // Itemize/Enumerate environments
    const listMatch = line.match(/^\\begin\{(itemize|enumerate)\}/);
    if (listMatch) {
      const listType = listMatch[1];
      const items: string[] = [];
      i++;
      while (i < lines.length && !lines[i].includes(`\\end{${listType}}`)) {
        const itemLine = lines[i].trim();
        if (itemLine.startsWith('\\item')) {
          items.push(itemLine.replace(/^\\item\s*/, ''));
        }
        i++;
      }
      i++; // skip \end
      const Tag = listType === 'enumerate' ? 'ol' : 'ul';
      elements.push(
        <Tag key={`list-${elements.length}`} style={{ margin: '0.5em 0', paddingLeft: '1.5em', color: draculaColors.foreground }}>
          {items.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatTextBlock(item) }} style={{ marginBottom: '0.25em' }} />
          ))}
        </Tag>
      );
      continue;
    }

    // Regular text line (may contain \textbf, inline math, etc.)
    elements.push(
      <Typography key={`text-${elements.length}`} sx={{ my: 0.5, color: draculaColors.foreground, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formatTextBlock(line) }} />
    );
    i++;
  }

  return elements;
}

export function ProofRenderer({ latex }: { latex: string }) {
  return (
    <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {parseProof(latex)}
      </Box>
    </Box>
  );
}
