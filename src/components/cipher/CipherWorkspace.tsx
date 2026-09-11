import { createContext, useState, type ReactNode } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { LayoutHeader } from '@astryxdesign/core/Layout';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { CIPHER_ITEMS } from '../../config/sidebarItems';

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
  /** Exec-path badge text, e.g. 'Local' / 'Sage'. Omitted when the cipher has no badge. */
  badge?: string;
  /** Optional header actions (Generate / Run slots for RSA). */
  actions?: ReactNode;
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
 * Shared shell for the five cipher workbenches: a `LayoutHeader` (cipher name
 * + exec badge + optional action slots) above an Operations / Attacks / Learn
 * tab strip. Each cipher keeps its own `operations` UI untouched; the
 * ExplanationTab CTAs retarget to the in-view tabs via the controlled
 * `tab`/`onTabChange` props.
 */
export function CipherWorkspace({
  cipher,
  badge,
  actions,
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
      <LayoutHeader hasDivider>
        <Stack direction="horizontal" gap={2} vAlign="center" width="100%">
          <Heading level={3}>{CIPHER_ITEMS.find(c => c.id === cipher)?.label ?? cipher}</Heading>
          {badge && <Badge variant="info" label={badge} />}
          {actions && (
            <Stack direction="horizontal" gap={1} hAlign="end" style={{ flex: 1 }}>
              {actions}
            </Stack>
          )}
        </Stack>
      </LayoutHeader>
      <TabList value={tab} onChange={(v) => setTab(v as CipherWorkspaceTab)} role="tablist" hasDivider>
        {WORKSPACE_TABS.map((t) => (
          <Tab key={t.id} value={t.id} label={t.label} />
        ))}
      </TabList>
      <Stack
        direction="vertical"
        gap={2}
        width="100%"
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
