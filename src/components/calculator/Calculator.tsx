import { useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { InputPanel } from '../InputPanel';
import { CipherWorkspace, type CipherId, type CipherWorkspaceTab } from '../cipher/CipherWorkspace';
import RSACalculator from './RSACalculator';
import AESCalculator from './AESCalculator';
import ECCCalculator from './ECCCalculator';
import HashCalculator from './HashCalculator';
import DHCalculator from './DHCalculator';

import { CIPHER_IDS } from '../../config/sidebarItems';

function isCipherId(mode: string): mode is CipherId {
  return (CIPHER_IDS as readonly string[]).includes(mode);
}

const OPERATIONS = { rsa: RSACalculator, aes: AESCalculator, ecc: ECCCalculator, hash: HashCalculator, dh: DHCalculator } as const;

export function Calculator() {
  const { viewMode } = useAppContext();
  const [tab, setTab] = useState<CipherWorkspaceTab>('operations');
  const [cipherAttack, setCipherAttack] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CipherWorkspaceTab>).detail;
      if (detail === 'operations' || detail === 'attacks' || detail === 'learn') setTab(detail);
    };
    const attackHandler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') {
        setCipherAttack(detail);
        setTab('attacks');
        window.dispatchEvent(new CustomEvent('cipher-attack-active', { detail }));
      }
    };
    const opsHandler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') {
        setCipherAttack(detail);
        setTab('operations');
      }
    };
    window.addEventListener('cipher-workspace-tab', handler);
    window.addEventListener('cipher-attack-select', attackHandler);
    window.addEventListener('cipher-ops-select', opsHandler);
    return () => {
      window.removeEventListener('cipher-workspace-tab', handler);
      window.removeEventListener('cipher-attack-select', attackHandler);
      window.removeEventListener('cipher-ops-select', opsHandler);
    };
  }, []);

  if (!isCipherId(viewMode)) return null;

  return (
    <CipherWorkspace
      key={viewMode}
      cipher={viewMode}
      tab={tab}
      onTabChange={setTab}
      operations={(() => { const C = OPERATIONS[viewMode]; return <C key={cipherAttack ?? 'default'} selectedAttack={cipherAttack} />; })()}
      attacks={viewMode === 'rsa' ? <InputPanel /> : (() => { const C = OPERATIONS[viewMode] as (p: { attacksOnly?: boolean; selectedAttack?: string }) => React.JSX.Element; return <C key={cipherAttack ?? 'default'} attacksOnly selectedAttack={cipherAttack} />; })()}
      learn={(() => { const C = OPERATIONS[viewMode] as (p: { learnOnly?: boolean }) => React.JSX.Element; return <C learnOnly />; })()}
    />
  );
}

export default Calculator;
