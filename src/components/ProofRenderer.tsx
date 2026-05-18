import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Box } from '@mui/material';
import { draculaColors } from '../theme/dracula';

export function ProofRenderer({ latex }: { latex: string }) {
  const html = katex.renderToString(latex, { throwOnError: false, displayMode: true, output: 'html' });
  return (
    <Box
      sx={{
        p: 2,
        overflow: 'auto',
        maxHeight: '80vh',
        color: draculaColors.foreground,
        '& .katex': { fontSize: '1em' },
        '& .katex-display': { margin: '1em 0' },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
