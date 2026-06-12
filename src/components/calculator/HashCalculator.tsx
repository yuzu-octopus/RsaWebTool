import { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { Tag, MenuBook, Functions, Key, LinearScale, Bolt } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { colFlexSx, centeredPanelSx } from '../../styles/shared';
import { CalculatorSubTabs } from './CalculatorSubTabs';
import HashFunctionsTab from './hash/HashFunctionsTab';
import HMACTab from './hash/HMACTab';
import LengthExtensionTab from './hash/LengthExtensionTab';
import ExplanationTab from './hash/ExplanationTab';
import ProofOfWorkTab from './hash/ProofOfWorkTab';
import { useAppContext } from '../../hooks/useAppContext';

const SUB_TABS = [
  { id: 'explanation', label: 'Explanation', icon: <MenuBook fontSize="small" /> },
  { id: 'hash-functions', label: 'Hash Functions', icon: <Functions fontSize="small" /> },
  { id: 'hmac', label: 'HMAC', icon: <Key fontSize="small" /> },
  { id: 'length-ext', label: 'Length Ext.', icon: <LinearScale fontSize="small" /> },
  { id: 'pow', label: 'PoW', icon: <Bolt fontSize="small" /> },
];

export default function HashCalculator() {
  const [activeTab, setActiveTab] = useState('explanation');
  const { setOutputResult, setOutputError, setOutputSource } = useAppContext();

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setOutputResult(null);
    setOutputError(null);
    setOutputSource(null);
  }, [setOutputResult, setOutputError, setOutputSource]);

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, pt: 2, px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h3"
            sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Tag sx={{ fontSize: 'inherit' }} /> Hash Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            Pure JS hash computation — no SageCell needed
          </Typography>

          <CalculatorSubTabs tabs={SUB_TABS} activeTab={activeTab} onChange={handleTabChange} />

          <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pt: 1 }}>
            {activeTab === 'explanation' && <ExplanationTab />}
            {activeTab === 'hash-functions' && <HashFunctionsTab />}
            {activeTab === 'hmac' && <HMACTab />}
            {activeTab === 'length-ext' && <LengthExtensionTab />}
            {activeTab === 'pow' && <ProofOfWorkTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
