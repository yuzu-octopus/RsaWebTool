import { Box, Typography } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { ProofRenderer } from '../ProofRenderer';
import { ECC_PROOF } from '../../data/attackExplanations/ecc';

export function ECCExplanationTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>ECC Reference</Typography>
      <Box sx={{
        maxHeight: '60vh',
        overflow: 'auto',
        pr: 1,
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
      }}>
        <ProofRenderer latex={ECC_PROOF} />
      </Box>
    </Box>
  );
}
