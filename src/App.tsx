import { useEffect, useState } from 'react';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { useToast } from '@astryxdesign/core/Toast';
import { ToastViewport } from '@astryxdesign/core/Toast';
import { Sidebar, useIsMobile } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Calculator } from './components/calculator/Calculator';
import { MagicPanel } from './components/MagicPanel';
import { ProofIndex } from './components/ProofIndex';
import { FormatConverter } from './components/FormatConverter';
import { InstructionsPanel } from './components/InstructionsPanel';
import { PemDecryptor } from './components/PemDecryptor';
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

function AppContent() {
  const { notification, mobileNavOpen, setMobileNavOpen } = useAppContext();
  const [skipLinkFocused, setSkipLinkFocused] = useState(false);
  const isMobile = useIsMobile();
  const showToast = useToast();

  useEffect(() => {
    if (env.factordbProxyUrl) {
      setFactorDBProxy(env.factordbProxyUrl);
    }
  }, []);

  useKeyboardShortcuts();

  // Snackbar re-expressed as a Toast: Toast only has info/error types, so
  // success maps to info. The toast self-dismisses; nothing to clear.
  useEffect(() => {
    if (notification?.message) {
      showToast({
        body: notification.message,
        type: notification.severity === 'error' ? 'error' : 'info',
        autoHideDuration: 3000,
        uniqueID: String(notification.key),
      });
    }
  }, [notification, showToast]);

  return (
    <ToastViewport position="bottomEnd" maxVisible={3}>
    <Stack direction="vertical" gap={0} width="100%" height="100vh" style={{ backgroundColor: 'var(--color-background)' }}>
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
      {isMobile && (
        <TopNav
          label="Mobile navigation"
          heading={<TopNavHeading heading="RSA CTF Tool" />}
          startContent={
            <IconButton
              label="Open navigation"
              variant="ghost"
              icon={<Icon icon="menu" />}
              onClick={() => setMobileNavOpen(true)}
            />
          }
        />
      )}
      <StackItem size="fill">
        <Stack direction="horizontal" gap={0} width="100%" height="100%">
          <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
          <StackItem size="fill">
            <Stack as="main" id="main-workspace" tabIndex={-1} direction={isMobile ? 'vertical' : 'horizontal'} gap={0} width="100%" height="100%" isScrollable={isMobile}>
              <StackItem size="fill" isScrollable>
                <ErrorBoundary>
                  <InputPanel />
                  <Calculator />
                  <MagicPanel />
                  <ProofIndex />
                  <FormatConverter />
                  <InstructionsPanel />
                  <PemDecryptor />
                </ErrorBoundary>
              </StackItem>
              <ErrorBoundary>
                <OutputPanel />
              </ErrorBoundary>
            </Stack>
          </StackItem>
        </Stack>
      </StackItem>
    </Stack>
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
