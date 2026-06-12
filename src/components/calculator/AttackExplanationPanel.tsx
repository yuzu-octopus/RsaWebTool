import { Box, Typography } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { MONO_FAMILY } from '../../styles/shared';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import '../../styles/draculaPrism.css';

export interface AttackExplanationData {
  title: string;
  description: string;
  whenToUse: string;
  algorithm: string[];
  python: string;
  references?: string[];
}

export function AttackExplanationPanel({ data }: { data: AttackExplanationData }) {
  return (
    <Box
      sx={{
        mb: 2,
        maxHeight: '40vh',
        overflow: 'auto',
        pr: 1,
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': {
          background: draculaColors.currentLine,
          borderRadius: '4px',
        },
      }}
    >
      <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mb: 1 }}>
        {data.title}
      </Typography>

      <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
        {data.description}
      </Typography>

      <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mt: 1.5, mb: 0.5 }}>
        When to use
      </Typography>

      <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
        {data.whenToUse}
      </Typography>

      <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mt: 1.5, mb: 0.5 }}>
        Algorithm
      </Typography>

      <Box
        sx={{
          backgroundColor: draculaColors.background,
          border: `1px solid ${draculaColors.currentLine}`,
          borderRadius: '4px',
          p: 1.5,
          fontFamily: MONO_FAMILY,
          fontSize: '0.75rem',
          lineHeight: 1.6,
          color: draculaColors.foreground,
          whiteSpace: 'pre',
          overflow: 'auto',
          mb: 1.5,
        }}
      >
        {data.algorithm.join('\n')}
      </Box>

      <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mt: 1.5, mb: 0.5 }}>
        Python Script
      </Typography>

      <Box
        sx={{
          backgroundColor: draculaColors.background,
          border: `1px solid ${draculaColors.currentLine}`,
          borderRadius: '4px',
          p: 1.5,
          fontFamily: MONO_FAMILY,
          fontSize: '0.75rem',
          lineHeight: 1.6,
          whiteSpace: 'pre',
          overflow: 'auto',
          maxHeight: '400px',
          mb: 1.5,
        }}
        dangerouslySetInnerHTML={{
          __html: Prism.highlight(data.python, Prism.languages.python, 'python'),
        }}
      />
    </Box>
  );
}
