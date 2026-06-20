import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { VpnKey, ContentCopy, Send } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, MONO_FAMILY, colorGhostBtn } from '../styles/shared';
import { useAppContext } from '../hooks/useAppContext';
import { parsePEM, decryptPEM } from '../utils/pemParser';
import type { ParsedPEM } from '../utils/pemParser';

/** Truncate a hex string for display: show first keepLen + "..." + last keepLen chars */
function truncateHex(hex: string, keepLen = 16): string {
  if (hex.length <= keepLen * 2 + 3) return hex;
  return `${hex.slice(0, keepLen)}...${hex.slice(-keepLen)}`;
}

export function PemDecryptor() {
  const { viewMode, setViewMode, setCalculatorMode, showNotification } = useAppContext();
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
  }, [parsed, setViewMode, showNotification]);

  if (viewMode !== 'pem') return null;

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h3"
            sx={{
              color: draculaColors.purple,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <VpnKey sx={{ fontSize: 'inherit' }} /> PEM Key Decryptor
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: draculaColors.comment,
              fontFamily: MONO_FAMILY,
              fontSize: '0.75rem',
              mb: 3,
            }}
          >
            Parse and decrypt PEM private keys in PKCS#1 and PKCS#8 formats
          </Typography>

          {/* PEM Input */}
          <TextField
            fullWidth
            multiline
            rows={6}
            value={pemInput}
            onChange={(e) => setPemInput(e.target.value)}
            placeholder="Paste a PEM private key here..."
            variant="outlined"
            sx={{ ...inputSx, mb: 1 }}
          />

          {/* PEM Format Example */}
          <Box sx={{
            fontFamily: MONO_FAMILY, fontSize: '0.75rem',
            color: draculaColors.comment, mt: 0, p: 1,
            border: `1px solid ${draculaColors.currentLine}`, borderRadius: '4px',
            whiteSpace: 'pre-wrap', mb: 2,
          }}>
{`-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`}
          </Box>

          {/* Parse Button */}
          <Button
            variant="outlined"
            onClick={handleParse}
            disabled={!pemInput.trim()}
            startIcon={<VpnKey />}
            sx={{
              borderColor: draculaColors.purple,
              color: draculaColors.purple,
              fontFamily: MONO_FAMILY,
              fontSize: '0.8rem',
              mb: 2,
              '&:hover': {
                backgroundColor: draculaColors.purple,
                color: draculaColors.background,
              },
            }}
          >
            Parse Key
          </Button>

          {/* Error Display */}
          {error && (
            <Typography
              variant="body2"
              sx={{
                color: draculaColors.red,
                fontFamily: MONO_FAMILY,
                fontSize: '0.75rem',
                mb: 2,
                p: 1,
                backgroundColor: 'rgba(255,85,85,0.1)',
                borderRadius: 1,
              }}
            >
              {error}
            </Typography>
          )}

          {/* Passphrase + Decrypt (only for encrypted keys) */}
          {parsed?.encrypted && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TextField
                type="password"
                size="small"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passphrase && !decrypting) {
                    e.preventDefault();
                    void handleDecrypt();
                  }
                }}
                placeholder="Passphrase"
                variant="outlined"
                disabled={decrypting}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: draculaColors.currentLine,
                    color: draculaColors.foreground,
                    fontFamily: MONO_FAMILY,
                    '& fieldset': { borderColor: draculaColors.comment },
                    '&:hover fieldset': { borderColor: draculaColors.purple },
                    '&.Mui-focused fieldset': { borderColor: draculaColors.purple },
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={() => { void handleDecrypt(); }}
                disabled={!passphrase || decrypting}
                startIcon={<VpnKey />}
                sx={{
                  borderColor: draculaColors.green,
                  color: draculaColors.green,
                  fontFamily: MONO_FAMILY,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: draculaColors.green,
                    color: draculaColors.background,
                  },
                }}
              >
                Decrypt
              </Button>
            </Box>
          )}

          {decrypting && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                sx={{
                  backgroundColor: draculaColors.currentLine,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: draculaColors.green,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: draculaColors.comment,
                  fontFamily: MONO_FAMILY,
                  mt: 0.5,
                  display: 'block',
                }}
              >
                Decrypting key...
              </Typography>
            </Box>
          )}

          {/* Extracted Parameters */}
          {parsed && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                backgroundColor: draculaColors.currentLine,
                borderColor: parsed.encrypted ? draculaColors.orange : draculaColors.green,
                borderRadius: 1,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: parsed.encrypted ? draculaColors.orange : draculaColors.green,
                  fontFamily: MONO_FAMILY,
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <VpnKey sx={{ fontSize: '1rem' }} />
                {parsed.format}
                {parsed.encryptionAlgorithm && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY }}
                  >
                    ({parsed.encryptionAlgorithm})
                  </Typography>
                )}
              </Typography>

              {parsed.keyParams ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  {Object.entries(parsed.keyParams).flatMap(([key, value]) => {
                    if (['dp', 'dq', 'qInv'].includes(key) || !value || value === '0') return [];
                    const display = truncateHex(value);
                    return [
                      <Box
                        key={key}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: draculaColors.purple,
                            fontFamily: MONO_FAMILY,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            minWidth: 32,
                            textTransform: 'uppercase',
                          }}
                        >
                          {key}:
                        </Typography>
                        <Tooltip title={value} arrow placement="top">
                          <Typography
                            variant="caption"
                            sx={{
                              color: draculaColors.foreground,
                              fontFamily: MONO_FAMILY,
                              fontSize: '0.7rem',
                              wordBreak: 'break-all',
                              '&:hover': { color: draculaColors.cyan },
                            }}
                          >
                            {display}
                          </Typography>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(value).catch(() => {});
                            showNotification(`Copied ${key}`, 'info');
                          }}
                          sx={{ color: draculaColors.comment, p: '2px' }}
                          aria-label={`Copy ${key}`}
                        >
                          <ContentCopy sx={{ fontSize: '0.65rem' }} />
                        </IconButton>
                      </Box>,
                    ];
                  })}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, fontSize: '0.75rem' }}
                >
                  No parameters extracted (encrypted key — decrypt first)
                </Typography>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {parsed?.keyParams && !parsed.encrypted && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={handleCopyParams}
                sx={colorGhostBtn(draculaColors.purple)}
              >
                Copy All Params
              </Button>

              <Button
                variant="outlined"
                startIcon={<VpnKey />}
                onClick={() => {
                  const { n: nVal, e: eVal } = parsed.keyParams!;
                  if (!nVal || nVal === '0') return;
                  setViewMode('calculator');
                  setCalculatorMode('rsa');
                  window.dispatchEvent(new CustomEvent('calculator-prefill', {
                    detail: { n: nVal, e: eVal }
                  }));
                  showNotification('Prefilled RSA Calculator with key parameters', 'success');
                }}
                sx={colorGhostBtn(draculaColors.cyan)}
              >
                Switch to Calculator
              </Button>

              <Button
                variant="outlined"
                startIcon={<Send />}
                onClick={handleFeedAttacks}
                sx={colorGhostBtn(draculaColors.green)}
              >
                Feed to Attacks
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
