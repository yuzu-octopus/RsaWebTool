import { useState, useCallback } from 'react';
import { Hub, MenuBook, VpnKey, Verified, Bolt } from '@mui/icons-material';
import { useAppContext } from '../../hooks/useAppContext';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { ECCExplanationTab } from './ECCExplanationTab';
import { ECCKeyOpsTab } from './ECCKeyOpsTab';
import { ECCSignVerifyTab } from './ECCSignVerifyTab';
import { ECCAttacksTab } from './ECCAttacksTab';

const TABS = [
  { id: 'explanation', label: 'Explanation', icon: <MenuBook fontSize="small" /> },
  { id: 'keyops', label: 'Key Operations', icon: <VpnKey fontSize="small" /> },
  { id: 'signverify', label: 'Sign / Verify', icon: <Verified fontSize="small" /> },
  { id: 'attacks', label: 'Attacks', icon: <Bolt fontSize="small" /> },
];

export default function ECCCalculator() {
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
      icon={Hub}
      title="ECC Calculator"
      subtitle="Elliptic curve operations, ECDSA, ECDH, and attacks — powered by @noble/curves"
      tabs={TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'explanation' && <ECCExplanationTab />}
      {tab === 'keyops' && <ECCKeyOpsTab />}
      {tab === 'signverify' && <ECCSignVerifyTab />}
      {tab === 'attacks' && <ECCAttacksTab />}
    </CalculatorHeader>
  );
}
