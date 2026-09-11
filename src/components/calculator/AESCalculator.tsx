import { use, useState, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { AESExplanationTab } from './AESExplanationTab';
import { AESEncryptDecryptTab } from './AESEncryptDecryptTab';
import { AESAttacksTab } from './AESAttacksTab';
import { CipherWorkspaceTabContext } from '../cipher/CipherWorkspace';

const OPERATION_TABS = [
  { id: 'encrypt-decrypt', label: 'Encrypt / Decrypt' },
];

function LearnExplanation() {
  const switchWorkspaceTab = use(CipherWorkspaceTabContext);
  return <AESExplanationTab onContinue={() => switchWorkspaceTab('operations')} />;
}

export default function AESCalculator({ attacksOnly = false, learnOnly = false, selectedAttack }: { attacksOnly?: boolean; learnOnly?: boolean; selectedAttack?: string } = {}) {
  const [tab, setTab] = useState('encrypt-decrypt');
  const { setOutputResult, setOutputError, setOutputSource } = useAppContext();

  const handleTabChange = useCallback((tabId: string) => {
    setTab(tabId);
    setOutputResult(null);
    setOutputError(null);
    setOutputSource(null);
  }, [setOutputResult, setOutputError, setOutputSource]);

  if (learnOnly) {
    return <LearnExplanation />;
  }

  if (attacksOnly) {
    return <AESAttacksTab selectedAttack={selectedAttack} />;
  }

  return (
    <CalculatorHeader
      title="AES Calculator"
      subtitle="AES encryption, decryption, mode analysis, and attacks — powered by @noble/ciphers"
      tabs={OPERATION_TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'encrypt-decrypt' && <AESEncryptDecryptTab />}
    </CalculatorHeader>
  );
}
