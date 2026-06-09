import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Fingerprint } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { colFlexSx, centeredPanelSx } from '../../styles/shared';
import { CalculatorSubTabs } from './CalculatorSubTabs';
import HashFunctionsTab from './hash/HashFunctionsTab';
import HMACTab from './hash/HMACTab';
import LengthExtensionTab from './hash/LengthExtensionTab';
import FormatConverterTab from './hash/FormatConverterTab';
import ExplanationTab from './hash/ExplanationTab';
import ProofOfWorkTab from './hash/ProofOfWorkTab';

const SUB_TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'hash-functions', label: 'Hash Functions' },
  { id: 'hmac', label: 'HMAC' },
  { id: 'length-ext', label: 'Length Ext.' },
  { id: 'format-conv', label: 'Format Conv.' },
  { id: 'pow', label: 'PoW' },
];

export default function HashCalculator() {
  const [activeTab, setActiveTab] = useState('explanation');

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h3"
            sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Fingerprint sx={{ fontSize: 'inherit' }} /> Hash Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            Pure JS hash computation — no SageCell needed
          </Typography>

          <CalculatorSubTabs tabs={SUB_TABS} activeTab={activeTab} onChange={setActiveTab} />

          <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pt: 1 }}>
            {activeTab === 'explanation' && <ExplanationTab />}
            {activeTab === 'hash-functions' && <HashFunctionsTab />}
            {activeTab === 'hmac' && <HMACTab />}
            {activeTab === 'length-ext' && <LengthExtensionTab />}
            {activeTab === 'format-conv' && <FormatConverterTab />}
            {activeTab === 'pow' && <ProofOfWorkTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
