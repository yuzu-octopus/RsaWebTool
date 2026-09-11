import { use, useState, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { ECCExplanationTab } from './ECCExplanationTab';
import { ECCKeyOpsTab } from './ECCKeyOpsTab';
import { ECCSignVerifyTab } from './ECCSignVerifyTab';
import { ECCAttacksTab } from './ECCAttacksTab';
import { CipherWorkspaceTabContext } from '../cipher/CipherWorkspace';

const OPERATION_TABS = [
  { id: 'keyops', label: 'Key Operations' },
  { id: 'signverify', label: 'Sign / Verify' },
];

function LearnExplanation() {
  const switchWorkspaceTab = use(CipherWorkspaceTabContext);
  return <ECCExplanationTab onContinue={() => switchWorkspaceTab('operations')} />;
}

export default function ECCCalculator({ attacksOnly = false, learnOnly = false, selectedAttack }: { attacksOnly?: boolean; learnOnly?: boolean; selectedAttack?: string } = {}) {
  const [tab, setTab] = useState('keyops');
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
    return <ECCAttacksTab selectedAttack={selectedAttack} />;
  }

  return (
    <CalculatorHeader
      title="ECC Calculator"
      subtitle="Elliptic curve operations, ECDSA, ECDH, and attacks — powered by @noble/curves"
      tabs={OPERATION_TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'keyops' && <ECCKeyOpsTab />}
      {tab === 'signverify' && <ECCSignVerifyTab />}
    </CalculatorHeader>
  );
}
