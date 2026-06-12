import { Box, Typography } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { ProofRenderer } from '../ProofRenderer';
import { AES_PROOF } from '../../data/attackExplanations/aes';

export function AESExplanationTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>
        AES Block Cipher Reference
      </Typography>
      <Box
        sx={{
          maxHeight: '60vh',
          overflow: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
        }}
      >
        <ProofRenderer latex={AES_PROOF} />
      </Box>
    </Box>
  );
}
