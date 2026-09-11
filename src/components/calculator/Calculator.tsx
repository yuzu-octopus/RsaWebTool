import { useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { InputPanel } from '../InputPanel';
import { CipherWorkspace, type CipherId, type CipherWorkspaceTab } from '../cipher/CipherWorkspace';
import RSACalculator from './RSACalculator';
import AESCalculator from './AESCalculator';
import ECCCalculator from './ECCCalculator';
import HashCalculator from './HashCalculator';
import DHCalculator from './DHCalculator';

const CIPHER_IDS: CipherId[] = ['rsa', 'aes', 'ecc', 'hash', 'dh'];

function isCipherId(mode: string): mode is CipherId {
  return (CIPHER_IDS as string[]).includes(mode);
}

export function Calculator() {
  const { viewMode } = useAppContext();
  const [tab, setTab] = useState<CipherWorkspaceTab>('operations');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'operations' || detail === 'attacks' || detail === 'learn') setTab(detail);
    };
    window.addEventListener('cipher-workspace-tab', handler);
    return () => window.removeEventListener('cipher-workspace-tab', handler);
  }, []);

  if (!isCipherId(viewMode)) return null;

  return (
    <CipherWorkspace
      key={viewMode}
      cipher={viewMode}
      tab={tab}
      onTabChange={setTab}
      operations={
        viewMode === 'rsa' ? <RSACalculator /> :
        viewMode === 'aes' ? <AESCalculator /> :
        viewMode === 'ecc' ? <ECCCalculator /> :
        viewMode === 'hash' ? <HashCalculator /> :
        <DHCalculator />
      }
      attacks={
        viewMode === 'rsa' ? <InputPanel /> :
        viewMode === 'aes' ? <AESCalculator attacksOnly /> :
        viewMode === 'ecc' ? <ECCCalculator attacksOnly /> :
        viewMode === 'hash' ? <HashCalculator attacksOnly /> :
        <DHCalculator attacksOnly />
      }
      learn={
        viewMode === 'rsa' ? <RSACalculator learnOnly /> :
        viewMode === 'aes' ? <AESCalculator learnOnly /> :
        viewMode === 'ecc' ? <ECCCalculator learnOnly /> :
        viewMode === 'hash' ? <HashCalculator learnOnly /> :
        <DHCalculator learnOnly />
      }
    />
  );
}

export default Calculator;
