import { useState, useCallback } from 'react';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import HashFunctionsTab from './hash/HashFunctionsTab';
import HMACTab from './hash/HMACTab';
import LengthExtensionTab from './hash/LengthExtensionTab';
import ExplanationTab from './hash/ExplanationTab';
import ProofOfWorkTab from './hash/ProofOfWorkTab';
import { useAppContext } from '../../hooks/useAppContext';

const SUB_TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'hash-functions', label: 'Hash Functions' },
  { id: 'hmac', label: 'HMAC' },
  { id: 'length-ext', label: 'Length Ext.' },
  { id: 'pow', label: 'PoW' },
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
      title="Hash Calculator"
      subtitle="Pure JS hash computation — no SageCell needed"
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {activeTab === 'explanation' && <ExplanationTab onContinue={() => handleTabChange('hash-functions')} />}
      {activeTab === 'hash-functions' && <HashFunctionsTab />}
      {activeTab === 'hmac' && <HMACTab />}
      {activeTab === 'length-ext' && <LengthExtensionTab />}
      {activeTab === 'pow' && <ProofOfWorkTab />}
    </CalculatorHeader>
  );
}
