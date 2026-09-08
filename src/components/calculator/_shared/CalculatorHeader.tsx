import type { ReactNode } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { CalculatorSubTabs } from '../CalculatorSubTabs';

export interface CalculatorHeaderTab {
  id: string;
  label: string;
}

/**
 * Base props shared by both variants.
 */
interface CalculatorHeaderBase {
  /** Page title (h3). */
  title: string;
  /** One-line subtitle shown under the title. */
  subtitle?: string;
  /** The active tab's content. */
  children: ReactNode;
}

/**
 * Variant WITH sub-tabs: tabs/activeTab/onTabChange are required together.
 */
export interface CalculatorHeaderWithTabs extends CalculatorHeaderBase {
  tabs: CalculatorHeaderTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * Variant WITHOUT sub-tabs: tabs/activeTab/onTabChange must be omitted.
 */
export interface CalculatorHeaderWithoutTabs extends CalculatorHeaderBase {
  tabs?: undefined;
  activeTab?: undefined;
  onTabChange?: undefined;
}

export type CalculatorHeaderProps = CalculatorHeaderWithTabs | CalculatorHeaderWithoutTabs;

/**
 * Standard shell for every calculator (RSA, AES, ECC, DH, Hash).
 * Eliminates the 5x-duplicated outer Stack + title + subtitle + tab bar + scrollable body.
 *
 * @example
 *   <CalculatorHeader
 *     title="AES Calculator"
 *     subtitle="AES encryption, decryption, mode analysis, and attacks"
 *     tabs={TABS}
 *     activeTab={tab}
 *     onTabChange={setTab}
 *   >
 *     {tab === 'encrypt-decrypt' && <AESEncryptDecryptTab />}
 *   </CalculatorHeader>
 */
export function CalculatorHeader(props: CalculatorHeaderProps) {
  const { title, subtitle, children } = props;
  const tabs = 'tabs' in props ? props.tabs : undefined;
  const activeTab = 'activeTab' in props ? props.activeTab : undefined;
  const onTabChange = 'onTabChange' in props ? props.onTabChange : undefined;
  return (
    <Stack direction="vertical" hAlign="center" padding={2}>
      <Stack direction="vertical" gap={2} width="100%" maxWidth={640}>
        <Stack direction="vertical" gap={1}>
          <Heading level={3}>{title}</Heading>
          {subtitle && <Text type="supporting">{subtitle}</Text>}
        </Stack>
        {tabs && activeTab !== undefined && onTabChange && (
          <CalculatorSubTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
        )}
        <Stack direction="vertical" gap={2} isScrollable>
          {children}
        </Stack>
      </Stack>
    </Stack>
  );
}
