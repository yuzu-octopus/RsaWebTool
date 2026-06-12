import { useState, useCallback } from 'react';
import { Lock } from '@mui/icons-material';
import { useAppContext } from '../../hooks/useAppContext';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { AESExplanationTab } from './AESExplanationTab';
import { AESEncryptDecryptTab } from './AESEncryptDecryptTab';
import { AESAttacksTab } from './AESAttacksTab';

const TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'encrypt-decrypt', label: 'Encrypt / Decrypt' },
  { id: 'attacks', label: 'Attacks' },
];

export default function AESCalculator() {
  const [tab, setTab] = useState('explanation');
  const { setOutputResult, setOutputError, setOutputSource } = useAppContext();

  const handleTabChange = useCallback((tabId: string) => {
    setTab(tabId);
    setOutputResult(null);
    setOutputError(null);
    setOutputSource(null);
  }, [setOutputResult, setOutputError, setOutputSource]);

  return (
    <CalculatorHeader
      icon={Lock}
      title="AES Calculator"
      subtitle="AES encryption, decryption, mode analysis, and attacks — powered by @noble/ciphers"
      tabs={TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'explanation' && <AESExplanationTab />}
      {tab === 'encrypt-decrypt' && <AESEncryptDecryptTab />}
      {tab === 'attacks' && <AESAttacksTab />}
    </CalculatorHeader>
  );
}
