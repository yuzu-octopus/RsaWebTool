import { useState, useCallback } from 'react';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Card } from '@astryxdesign/core/Card';
import { Banner } from '@astryxdesign/core/Banner';
import { Badge } from '@astryxdesign/core/Badge';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { useAppContext } from '../hooks/useAppContext';
import { parsePEM, decryptPEM } from '../utils/pemParser';
import type { ParsedPEM } from '../utils/pemParser';

// Dracula brand tokens (verbatim kit names — never raw hex).
const c = {
  green: 'var(--dracula-green)',
  orange: 'var(--dracula-orange)',
};

/** Truncate a hex string for display: show first keepLen + "..." + last keepLen chars */
function truncateHex(hex: string, keepLen = 16): string {
  if (hex.length <= keepLen * 2 + 3) return hex;
  return `${hex.slice(0, keepLen)}...${hex.slice(-keepLen)}`;
}

const PEM_EXAMPLE = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`;

export function PemDecryptorDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { setViewMode, showNotification } = useAppContext();
  const [pemInput, setPemInput] = useState('');
  const [parsed, setParsed] = useState<ParsedPEM | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const handleParse = useCallback(() => {
    setError(null);
    setParsed(null);
    try {
      const result = parsePEM(pemInput);
      setParsed(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse PEM');
      showNotification('Failed to parse PEM', 'error');
    }
  }, [pemInput, showNotification]);

  const handleDecrypt = useCallback(async () => {
    if (!parsed || !passphrase) return;
    setError(null);
    setDecrypting(true);
    try {
      const result = await decryptPEM(parsed, passphrase);
      setParsed(result);
      showNotification('Key decrypted successfully', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Decryption failed';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setDecrypting(false);
    }
  }, [parsed, passphrase, showNotification]);

  const handleCopyParams = useCallback(() => {
    if (!parsed?.keyParams) return;
    const lines = [
      `Format: ${parsed.format}`,
      '',
      ...Object.entries(parsed.keyParams)
        .reduce<string[]>((acc, [k, v]) => {
          if (v && v !== '0') acc.push(`${k}: ${v}`);
          return acc;
        }, []),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(
      () => showNotification('Parameters copied to clipboard', 'success'),
      () => showNotification('Failed to copy', 'error')
    ).catch(() => {});
  }, [parsed, showNotification]);

  const handleFeedAttacks = useCallback(() => {
    if (!parsed?.keyParams) return;
    const n = parsed.keyParams.n;
    if (!n || n === '0') return;
    setViewMode('magic');
    window.dispatchEvent(new CustomEvent('magic-prefill', {
      detail: { n, e: parsed.keyParams.e }
    }));
    showNotification('Prefilled Magic Panel with n/e', 'success');
    onOpenChange(false);
  }, [parsed, setViewMode, showNotification, onOpenChange]);

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={600}>
      <DialogHeader title="PEM Key Decryptor" subtitle="Parse and decrypt PEM private keys in PKCS#1 and PKCS#8 formats" onOpenChange={onOpenChange} />
      <Stack padding={3}>
        <Stack width="100%" gap={2}>

          {/* PEM Input */}
          <TextArea
            label="PEM private key"
            rows={6}
            value={pemInput}
            onChange={(value) => setPemInput(value)}
            placeholder="Paste a PEM private key here..."
          />

          {/* PEM Format Example */}
          <CodeBlock
            code={PEM_EXAMPLE}
            language="plaintext"
            width="100%"
          />

          {/* Parse Button */}
          <Stack direction="horizontal">
            <Button
              label="Parse Key"
              variant="secondary"
              onClick={handleParse}
              isDisabled={!pemInput.trim()}
            />
          </Stack>

          {/* Error Display */}
          {error && (
            <Banner status="error" title={error} />
          )}

          {/* Passphrase + Decrypt (only for encrypted keys) */}
          {parsed?.encrypted && (
            <Stack direction="horizontal" gap={1} vAlign="center">
              <StackItem size="fill">
                <TextInput
                  label="Passphrase"
                  isLabelHidden
                  type="password"
                  value={passphrase}
                  onChange={(value) => setPassphrase(value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && passphrase && !decrypting) {
                      e.preventDefault();
                      void handleDecrypt();
                    }
                  }}
                  placeholder="Passphrase"
                  isDisabled={decrypting}
                  width="100%"
                />
              </StackItem>
              <Button
                label="Decrypt"
                variant="secondary"
                onClick={() => { void handleDecrypt(); }}
                isDisabled={!passphrase || decrypting}
              />
            </Stack>
          )}

          {decrypting && (
            <Stack gap={1}>
              <ProgressBar label="Decrypting key" isIndeterminate />
              <Text type="body" color="secondary">
                Decrypting key…
              </Text>
            </Stack>
          )}

          {/* Extracted Parameters */}
          {parsed && (
            <Card padding={3}>
              <Stack gap={2}>
                <Stack direction="horizontal" gap={1} vAlign="center">
                  <Text weight="semibold" style={{ color: parsed.encrypted ? c.orange : c.green }}>
                    {parsed.format}
                  </Text>
                  <Badge variant={parsed.encrypted ? 'warning' : 'success'} label={parsed.encrypted ? 'Encrypted' : 'Decrypted'} />
                  {parsed.encryptionAlgorithm && (
                    <Text type="supporting">
                      ({parsed.encryptionAlgorithm})
                    </Text>
                  )}
                </Stack>

                {parsed.keyParams ? (
                  <Stack gap={1}>
                    {Object.entries(parsed.keyParams).flatMap(([key, value]) => {
                      if (['dp', 'dq', 'qInv'].includes(key) || !value || value === '0') return [];
                      const display = truncateHex(value);
                      return [
                        <Stack
                          key={key}
                          direction="horizontal"
                          gap={1}
                          vAlign="center"
                        >
                          <Text type="label" weight="semibold">
                            {key}:
                          </Text>
                          <Tooltip content={value}>
                            <Text type="code" wordBreak="break-all">
                              {display}
                            </Text>
                          </Tooltip>
                          <IconButton
                            label={`Copy ${key}`}
                            tooltip={`Copy ${key}`}
                            icon={<Icon icon="copy" size="sm" />}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(value).catch(() => {});
                              showNotification(`Copied ${key}`, 'info');
                            }}
                          />
                        </Stack>,
                      ];
                    })}
                  </Stack>
                ) : (
                  <Text type="body" color="secondary">
                    No parameters extracted (encrypted key, decrypt first)
                  </Text>
                )}
              </Stack>
            </Card>
          )}

          {/* Action Buttons */}
          {parsed?.keyParams && !parsed.encrypted && (
            <Stack direction="horizontal" gap={1} wrap="wrap">
              <Button
                label="Copy All Params"
                variant="ghost"
                icon={<Icon icon="copy" size="sm" />}
                onClick={handleCopyParams}
              />

              <Button
                label="Open in RSA View"
                variant="ghost"
                onClick={() => {
                  const { n: nVal, e: eVal } = parsed.keyParams!;
                  if (!nVal || nVal === '0') return;
                  setViewMode('rsa');
                  window.dispatchEvent(new CustomEvent('calculator-prefill', {
                    detail: { n: nVal, e: eVal }
                  }));
                  showNotification('Prefilled RSA view with key parameters', 'success');
                  onOpenChange(false);
                }}
              />

              <Button
                label="Feed to Attacks"
                variant="ghost"
                onClick={handleFeedAttacks}
              />
            </Stack>
          )}
        </Stack>
      </Stack>
    </Dialog>
  );
}

export default PemDecryptorDialog;
