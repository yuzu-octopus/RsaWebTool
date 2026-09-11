import { createContext, useState, type ReactNode } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { TabList, Tab } from '@astryxdesign/core/TabList';

export type CipherId = 'rsa' | 'aes' | 'ecc' | 'hash' | 'dh';

export type CipherWorkspaceTab = 'operations' | 'attacks' | 'learn';


const WORKSPACE_TABS: { id: CipherWorkspaceTab; label: string }[] = [
  { id: 'operations', label: 'Operations' },
  { id: 'attacks', label: 'Attacks' },
  { id: 'learn', label: 'Learn' },
];

/**
 * Lets an ExplanationTab CTA switch the enclosing workspace tab (Operations /
 * Attacks / Learn) without prop-drilling. Defaults to a no-op outside a
 * workspace so explanation tabs stay usable standalone.
 */
export const CipherWorkspaceTabContext = createContext<(tab: CipherWorkspaceTab) => void>(() => {});

export interface CipherWorkspaceProps {
  /** Active cipher — drives the header name and the workspace testid. */
  cipher: CipherId;
  /** Main calculator UI for the cipher. */
  operations: ReactNode;
  /** Attack form / attack-description panels for the cipher. */
  attacks: ReactNode;
  /** Proof + usage-guide content for the cipher. */
  learn: ReactNode;
  /** Controlled tab (defaults to uncontrolled 'operations'). */
  tab?: CipherWorkspaceTab;
  /** Controlled tab setter. */
  onTabChange?: (tab: CipherWorkspaceTab) => void;
  /** Initial tab for uncontrolled use. @default 'operations' */
  defaultTab?: CipherWorkspaceTab;
}

/**
 * Shared shell for the five cipher workbenches: an Operations / Attacks / Learn
 * tab strip. Each cipher keeps its own `operations` UI untouched; the
 * ExplanationTab CTAs retarget to the in-view tabs via the controlled
 * `tab`/`onTabChange` props.
 */
export function CipherWorkspace({
  cipher,
  operations,
  attacks,
  learn,
  tab: controlledTab,
  onTabChange,
  defaultTab = 'operations',
}: CipherWorkspaceProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<CipherWorkspaceTab>(defaultTab);
  const tab = controlledTab ?? uncontrolledTab;
  const setTab = onTabChange ?? setUncontrolledTab;

  return (
    <CipherWorkspaceTabContext.Provider value={setTab}>
    <Stack direction="vertical" gap={0} width="100%" height="100%">
      <TabList value={tab} onChange={(v) => setTab(v as CipherWorkspaceTab)} role="tablist" hasDivider>
        {WORKSPACE_TABS.map((t) => (
          <Tab key={t.id} value={t.id} label={t.label} />
        ))}
      </TabList>
      <Stack
        direction="vertical"
        gap={2}
        width="100%"
        padding={4}
        style={{ flex: 1, minHeight: 0 }}
        isScrollable
        data-testid={`cipher-workspace-${cipher}-${tab}`}
      >
        {tab === 'operations' && operations}
        {tab === 'attacks' && attacks}
        {tab === 'learn' && learn}
      </Stack>
    </Stack>
    </CipherWorkspaceTabContext.Provider>
  );
}

export default CipherWorkspace;
