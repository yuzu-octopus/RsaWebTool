import { use, useState, useCallback} from 'react';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import HashFunctionsTab from './hash/HashFunctionsTab';
import HMACTab from './hash/HMACTab';
import LengthExtensionTab, { LengthExtensionAttackPanel } from './hash/LengthExtensionTab';
import ExplanationTab from './hash/ExplanationTab';
import ProofOfWorkTab from './hash/ProofOfWorkTab';
import { useAppContext } from '../../hooks/useAppContext';
import { CipherWorkspaceTabContext } from '../cipher/CipherWorkspace';

const OPERATION_TABS = [
  { id: 'hash-functions', label: 'Hash Functions' },
  { id: 'hmac', label: 'HMAC' },
  { id: 'length-ext', label: 'Length Ext.' },
  { id: 'pow', label: 'PoW' },
];

function LearnExplanation() {
  const switchWorkspaceTab = use(CipherWorkspaceTabContext);
  return <ExplanationTab onContinue={() => switchWorkspaceTab('operations')} />;
}

export default function HashCalculator({ attacksOnly = false, learnOnly = false, selectedAttack }: { attacksOnly?: boolean; learnOnly?: boolean; selectedAttack?: string } = {}) {
  const [activeTab, setActiveTab] = useState(selectedAttack ?? 'hash-functions');
  const { setOutputResult, setOutputError, setOutputSource } = useAppContext();

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setOutputResult(null);
    setOutputError(null);
    setOutputSource(null);
  }, [setOutputResult, setOutputError, setOutputSource]);

  if (learnOnly) {
    return <LearnExplanation />;
  }

  if (attacksOnly) {
    return <LengthExtensionAttackPanel />;
  }

  return (
    <CalculatorHeader
      title="Hash Calculator"
      subtitle="Pure JS hash computation — no SageCell needed"
      tabs={OPERATION_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {activeTab === 'hash-functions' && <HashFunctionsTab />}
      {activeTab === 'hmac' && <HMACTab />}
      {activeTab === 'length-ext' && <LengthExtensionTab />}
      {activeTab === 'pow' && <ProofOfWorkTab />}
    </CalculatorHeader>
  );
}
