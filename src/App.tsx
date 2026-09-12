import { useEffect, useState } from 'react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { Layout, LayoutContent, LayoutPanel } from '@astryxdesign/core/Layout';
import { useResizable } from '@astryxdesign/core/Resizable';
import { ResizeHandle } from '@astryxdesign/core/Resizable';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Kbd } from '@astryxdesign/core/Kbd';
import { Link } from '@astryxdesign/core/Link';
import { useToast } from '@astryxdesign/core/Toast';
import { ToastViewport } from '@astryxdesign/core/Toast';
import type { ToastContentRenderProps } from '@astryxdesign/core/Toast';
import { Stack } from '@astryxdesign/core/Stack';
import { Sidebar, useIsMobile } from './components/Sidebar';
import { LogoIcon } from './components/_shared/LogoIcon';
import { AppProvider } from './context/AppContext';
import { OutputPanel, SAGE_META, useSageStatus } from './components/OutputPanel';
import { Calculator } from './components/calculator/Calculator';
import { MagicPanel } from './components/MagicPanel';
import { FormatConverterDialog } from './components/FormatConverter';
import { PemDecryptorDialog } from './components/PemDecryptor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { setFactorDBProxy } from './utils/factordb';
import env from './config/env';
import { useAppContext } from './hooks/useAppContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Canonical visually-hidden clip (same values as core VisuallyHidden). The skip
// link cannot live inside VisuallyHidden itself: that primitive is permanently
// clipped with pointer events removed and forbids interactive children. Instead
// the clip is applied until the link takes keyboard focus, then released.
const skipLinkHiddenStyle = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderStyle: 'none',
} as const;

// Resize contract for the results rail (spec §1): kit-owned width persisted
// under the existing `outputPanelWidth` key.
const RESULTS_RESIZABLE = {
  defaultSize: 340,
  minSizePx: 240,
  maxSizePx: 600,
  collapsible: true,
  collapsedSize: 50,
  autoSaveId: 'outputPanelWidth',
} as const;

// Toast only has info/error types, so success keeps type info and gets a
// Banner-success look (green border + check icon + message) via
// renderContent. The kit keeps the card, live region, and auto-hide.
function renderSuccessToast({ body }: ToastContentRenderProps) {
  return (
    <Stack
      direction="horizontal"
      gap={2}
      vAlign="center"
      width="100%"
      padding={2}
      style={{ border: '1px solid var(--dracula-green)', borderRadius: 8 }}
      data-testid="toast-success"
    >
      <Icon icon="check" size="sm" color="success" />
      <Text type="body">{body}</Text>
    </Stack>
  );
}

function AppContent() {
  const { notification, mobileNavOpen, setMobileNavOpen, setCommandPaletteOpen, outputError } = useAppContext();
  const sage = SAGE_META[useSageStatus(outputError)];
  const [skipLinkFocused, setSkipLinkFocused] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [pemOpen, setPemOpen] = useState(false);
  const isMobile = useIsMobile();
  const showToast = useToast();
  const results = useResizable({ ...RESULTS_RESIZABLE, direction: 'horizontal' });

  useEffect(() => {
    if (env.factordbProxyUrl) {
      setFactorDBProxy(env.factordbProxyUrl);
    }
  }, []);

  useKeyboardShortcuts();

  // Snackbar re-expressed as a Toast: Toast only has info/error types, so
  // success maps to info with a Banner-styled renderContent. The toast
  // self-dismisses; nothing to clear.
  // ToastPosition has no top-center (corners only), so the viewport stays
  // at bottomEnd.
  useEffect(() => {
    if (notification?.message) {
      showToast({
        body: notification.message,
        type: notification.severity === 'error' ? 'error' : 'info',
        autoHideDuration: 3000,
        uniqueID: String(notification.key),
        ...(notification.severity === 'success' ? { renderContent: renderSuccessToast } : {}),
      });
    }
  }, [notification, showToast]);

  const topNav = (
    <TopNav
      label="Application navigation"
      heading={
        <TopNavHeading
          logo={<LogoIcon size={28} />}
          heading="RSA CTF Tool"
        />
      }
      startContent={
        isMobile ? (
          <IconButton
            label="Open navigation"
            variant="ghost"
            icon={<Icon icon="menu" />}
            onClick={() => setMobileNavOpen(true)}
          />
        ) : undefined
      }
      endContent={
        <>
          <IconButton
            label="Open format converter"
            tooltip="Format converter"
            variant="ghost"
            icon={<Icon icon="arrowsUpDown" />}
            onClick={() => setFormatOpen(true)}
          />
          <IconButton
            label="Open PEM decryptor"
            tooltip="PEM decryptor"
            variant="ghost"
            icon={<Icon icon="wrench" />}
            onClick={() => setPemOpen(true)}
          />
          <Button
            label="Command palette"
            variant="ghost"
            size="sm"
            onClick={() => setCommandPaletteOpen(true)}
            icon={<Icon icon="search" size="sm" />}
            endContent={<Kbd keys="mod+k" />}
          />
          <StatusDot variant={sage.variant} label={sage.label} tooltip={sage.tooltip} data-testid="sage-status" />
          <Text type="supporting">
            {sage.text}
          </Text>
        </>
      }
    />
  );

  if (isMobile) {
    return (
      <ToastViewport position="bottomEnd" maxVisible={3}>
      <AppShell topNav={topNav} mobileNav={false}>
        <Link
          href="#main-workspace"
          isStandalone
          onFocus={() => setSkipLinkFocused(true)}
          onBlur={() => setSkipLinkFocused(false)}
          style={skipLinkFocused ? undefined : skipLinkHiddenStyle}
        >
          Skip navigation
        </Link>
        <CommandPalette />
        <FormatConverterDialog isOpen={formatOpen} onOpenChange={setFormatOpen} />
        <PemDecryptorDialog isOpen={pemOpen} onOpenChange={setPemOpen} />
        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <Layout height="fill" content={<LayoutContent padding={0}>
          <div id="main-workspace" tabIndex={-1}>
          <ErrorBoundary>
            <Calculator />
            <MagicPanel />
          </ErrorBoundary>
          <ErrorBoundary>
            <OutputPanel />
          </ErrorBoundary>
          </div>
        </LayoutContent>} />
      </AppShell>
      </ToastViewport>
    );
  }

  return (
    <ToastViewport position="bottomEnd" maxVisible={3}>
      <AppShell topNav={topNav} mobileNav={false} contentPadding={0}>
        <Link
          href="#main-workspace"
          isStandalone
          onFocus={() => setSkipLinkFocused(true)}
          onBlur={() => setSkipLinkFocused(false)}
          style={skipLinkFocused ? undefined : skipLinkHiddenStyle}
        >
          Skip navigation
        </Link>
        <CommandPalette />
        <FormatConverterDialog isOpen={formatOpen} onOpenChange={setFormatOpen} />
        <PemDecryptorDialog isOpen={pemOpen} onOpenChange={setPemOpen} />
        <Layout
          height="fill"
          start={<Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />}
          content={
            <LayoutContent padding={0}>
              <div id="main-workspace" tabIndex={-1}>
                <ErrorBoundary>
                        <Calculator />
                  <MagicPanel />
                </ErrorBoundary>
              </div>
            </LayoutContent>
          }
          end={
            <>
              <ResizeHandle direction="horizontal" isReversed resizable={results.props} label="Resize results" />
              <LayoutPanel resizable={results.props} label="Results" hasDivider>
                <ErrorBoundary>
                  <OutputPanel onCollapseResults={results.collapse} />
                </ErrorBoundary>
              </LayoutPanel>
            </>
          }
        />
      </AppShell>
    </ToastViewport>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
