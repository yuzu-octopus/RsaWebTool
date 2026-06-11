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
import { VpnKey, ContentCopy, Calculate, AutoFixHigh } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, FONT_FAMILY } from '../styles/shared';
import { useAppContext } from '../hooks/useAppContext';
import { parsePEM, decryptPEM } from '../utils/pemParser';
import type { ParsedPEM } from '../utils/pemParser';

/** Truncate a hex string for display: show first n chars + "..." */
function truncateHex(hex: string, maxLen = 48): string {
  if (hex.length <= maxLen) return hex;
  return `${hex.slice(0, maxLen)}...`;
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
              fontFamily: FONT_FAMILY,
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
            rows={8}
            value={pemInput}
            onChange={(e) => setPemInput(e.target.value)}
            placeholder={`-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----`}
            variant="outlined"
            sx={{ ...inputSx, mb: 2 }}
          />

          {/* Parse Button */}
          <Button
            variant="outlined"
            onClick={handleParse}
            disabled={!pemInput.trim()}
            startIcon={<VpnKey />}
            sx={{
              borderColor: draculaColors.purple,
              color: draculaColors.purple,
              fontFamily: FONT_FAMILY,
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
                fontFamily: FONT_FAMILY,
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
                placeholder="Passphrase"
                variant="outlined"
                disabled={decrypting}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: draculaColors.currentLine,
                    color: draculaColors.foreground,
                    fontFamily: FONT_FAMILY,
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
                  fontFamily: FONT_FAMILY,
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
                  fontFamily: FONT_FAMILY,
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
                  fontFamily: FONT_FAMILY,
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
                    sx={{ color: draculaColors.comment, fontFamily: FONT_FAMILY }}
                  >
                    ({parsed.encryptionAlgorithm})
                  </Typography>
                )}
              </Typography>

              {parsed.keyParams ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  {Object.entries(parsed.keyParams)
                    .filter(([k]) => !['dp', 'dq', 'qInv'].includes(k))
                    .map(([key, value]) => {
                      if (!value || value === '0') return null;
                      const display = truncateHex(value);
                      return (
                        <Box
                          key={key}
                          sx={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: draculaColors.purple,
                              fontFamily: FONT_FAMILY,
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
                                fontFamily: FONT_FAMILY,
                                fontSize: '0.7rem',
                                wordBreak: 'break-all',
                                cursor: 'pointer',
                                '&:hover': { color: draculaColors.cyan },
                              }}
                              onClick={() => {
                                navigator.clipboard.writeText(value).catch(() => {});
                                showNotification(`Copied ${key}`, 'info');
                              }}
                            >
                              {display}
                            </Typography>
                          </Tooltip>
                        </Box>
                      );
                    })}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: draculaColors.comment, fontFamily: FONT_FAMILY, fontSize: '0.75rem' }}
                >
                  No parameters extracted (encrypted key — decrypt first)
                </Typography>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {parsed?.keyParams && !parsed.encrypted && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <IconButton
                onClick={handleCopyParams}
                sx={{
                  border: `1px solid ${draculaColors.purple}`,
                  borderRadius: 1,
                  color: draculaColors.purple,
                  fontFamily: FONT_FAMILY,
                  fontSize: '0.75rem',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  '&:hover': { backgroundColor: draculaColors.purple, color: draculaColors.background },
                }}
              >
                <ContentCopy sx={{ fontSize: '1rem' }} />
                <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY }}>
                  Copy All Params
                </Typography>
              </IconButton>

              <IconButton
                onClick={() => {
                  const { n: nVal } = parsed.keyParams!;
                  if (!nVal || nVal === '0') return;
                  setViewMode('calculator');
                  setCalculatorMode('rsa');
                  showNotification('Switched to RSA Calculator', 'success');
                }}
                sx={{
                  border: `1px solid ${draculaColors.cyan}`,
                  borderRadius: 1,
                  color: draculaColors.cyan,
                  fontFamily: FONT_FAMILY,
                  fontSize: '0.75rem',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  '&:hover': { backgroundColor: draculaColors.cyan, color: draculaColors.background },
                }}
              >
                <Calculate sx={{ fontSize: '1rem' }} />
                <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY }}>
                  Feed to Calculator
                </Typography>
              </IconButton>

              <IconButton
                onClick={handleFeedAttacks}
                sx={{
                  border: `1px solid ${draculaColors.green}`,
                  borderRadius: 1,
                  color: draculaColors.green,
                  fontFamily: FONT_FAMILY,
                  fontSize: '0.75rem',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  '&:hover': { backgroundColor: draculaColors.green, color: draculaColors.background },
                }}
              >
                <AutoFixHigh sx={{ fontSize: '1rem' }} />
                <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY }}>
                  Feed to Attacks
                </Typography>
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
