import { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { Calculate } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { colFlexSx, centeredPanelSx, tabSx } from '../styles/shared';
import { RsaKeyGenTab } from './RsaKeyGenTab';
import { RsaEncryptTab } from './RsaEncryptTab';
import { RsaDecryptTab } from './RsaDecryptTab';

export function RsaCalculator() {
  const { viewMode } = useAppContext();
  const [tab, setTab] = useState(0);

  if (viewMode !== 'calculator') return null;

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h3"
            sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Calculate sx={{ fontSize: 'inherit' }} /> RSA Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            Pure BigInt computation -- no SageCell needed
          </Typography>

          <Tabs
            value={tab}
            onChange={(_e, v) => setTab(v as number)}
            sx={{
              mb: 2,
              borderBottom: `1px solid ${draculaColors.comment}`,
              '& .MuiTabs-indicator': { backgroundColor: draculaColors.purple },
            }}
          >
            <Tab label="Key Gen" sx={tabSx} />
            <Tab label="Encrypt" sx={tabSx} />
            <Tab label="Decrypt" sx={tabSx} />
          </Tabs>

          {tab === 0 && <RsaKeyGenTab />}
          {tab === 1 && <RsaEncryptTab />}
          {tab === 2 && <RsaDecryptTab />}
        </Box>
      </Box>
    </Box>
  );
}
