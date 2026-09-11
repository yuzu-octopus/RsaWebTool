import { use, useState, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { DHExplanationTab } from './DHExplanationTab';
import { DHKeyExchangeTab } from './DHKeyExchangeTab';
import { DHAttacksTab } from './DHAttacksTab';
import { CipherWorkspaceTabContext } from '../cipher/CipherWorkspace';

const OPERATION_TABS = [
  { id: 'keyexchange', label: 'Key Exchange' },
];

function LearnExplanation() {
  const switchWorkspaceTab = use(CipherWorkspaceTabContext);
  return <DHExplanationTab onContinue={() => switchWorkspaceTab('operations')} />;
}

export default function DHCalculator({ attacksOnly = false, learnOnly = false, selectedAttack }: { attacksOnly?: boolean; learnOnly?: boolean; selectedAttack?: string } = {}) {
  const [tab, setTab] = useState('keyexchange');
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
    return <DHAttacksTab selectedAttack={selectedAttack} />;
  }

  return (
    <CalculatorHeader
      title="DH Calculator"
      subtitle="Diffie-Hellman key exchange simulation and discrete log attacks"
      tabs={OPERATION_TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'keyexchange' && <DHKeyExchangeTab />}
    </CalculatorHeader>
  );
}
