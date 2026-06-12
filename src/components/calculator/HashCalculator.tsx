import { useState, useCallback } from 'react';
import { Tag, MenuBook, Functions, Key, LinearScale, Bolt } from '@mui/icons-material';
import { CalculatorHeader } from './_shared/CalculatorHeader';
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
    <CalculatorHeader
      icon={Tag}
      title="Hash Calculator"
      subtitle="Pure JS hash computation — no SageCell needed"
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {activeTab === 'explanation' && <ExplanationTab />}
      {activeTab === 'hash-functions' && <HashFunctionsTab />}
      {activeTab === 'hmac' && <HMACTab />}
      {activeTab === 'length-ext' && <LengthExtensionTab />}
      {activeTab === 'pow' && <ProofOfWorkTab />}
    </CalculatorHeader>
  );
}
