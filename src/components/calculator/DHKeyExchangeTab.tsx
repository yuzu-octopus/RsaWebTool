import { useState, useCallback, useMemo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, Button, Typography, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { primaryBtnSx, MONO_FAMILY } from '../../styles/shared';
import { inputSx } from '../../styles/shared';
import { useCalculatorOutput } from '../../hooks/useCalculatorOutput';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { RFC3526_GROUPS, generatePrivateKey, parseHex } from '../../utils/dhCrypto';
import { modPow } from '../../utils/bigint';

export function DHKeyExchangeTab() {
  const [group, setGroup] = useState('group5');
  const [customP, setCustomP] = useState('');
  const [customG, setCustomG] = useState('2');
  const [alicePriv, setAlicePriv] = useState<bigint | null>(null);
  const [alicePub, setAlicePub] = useState<bigint | null>(null);
  const [bobPriv, setBobPriv] = useState<bigint | null>(null);
  const [bobPub, setBobPub] = useState<bigint | null>(null);
  const [sharedAlice, setSharedAlice] = useState<bigint | null>(null);
  const [sharedBob, setSharedBob] = useState<bigint | null>(null);
  const out = useCalculatorOutput({ category: 'calculator-dh' });
  const { copy, copied } = useCopyToClipboard(1500);

  const currentGroup = useMemo(() => {
    if (group === 'custom') return null;
    const idx = group === 'group5' ? 0 : group === 'group14' ? 1 : 2;
    return RFC3526_GROUPS[idx];
  }, [group]);

  const p = useMemo(() => currentGroup?.p ?? (parseHex(customP) || 0n), [currentGroup, customP]);
  const g = useMemo(() => currentGroup?.g ?? (parseHex(customG) || 0n), [currentGroup, customG]);

  const genAlice = useCallback(() => {
    out.clear();
    setSharedAlice(null);
    setSharedBob(null);
    if (p <= 1n || g <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const a = generatePrivateKey();
    const A = modPow(g, a, p);
    setAlicePriv(a);
    setAlicePub(A);
  }, [p, g, out]);

  const genBob = useCallback(() => {
    out.clear();
    setSharedAlice(null);
    setSharedBob(null);
    if (p <= 1n || g <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const b = generatePrivateKey();
    const B = modPow(g, b, p);
    setBobPriv(b);
    setBobPub(B);
  }, [p, g, out]);

  const computeAlice = useCallback(() => {
    out.clear();
    if (alicePriv === null || bobPub === null) { out.dispatchError('Alice private key or Bob public key missing'); return; }
    if (p <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const s = modPow(bobPub, alicePriv, p);
    setSharedAlice(s);
    out.dispatch(`Shared secret (Alice): 0x${s.toString(16)}\nMETHOD=TYPESCRIPT`, 'DH Key Exchange');
  }, [alicePriv, bobPub, p, out]);

  const computeBob = useCallback(() => {
    out.clear();
    if (bobPriv === null || alicePub === null) { out.dispatchError('Bob private key or Alice public key missing'); return; }
    if (p <= 1n) { out.dispatchError('Invalid group parameters'); return; }
    const s = modPow(alicePub, bobPriv, p);
    setSharedBob(s);
    out.dispatch(`Shared secret (Bob): 0x${s.toString(16)}\nMETHOD=TYPESCRIPT`, 'DH Key Exchange');
  }, [bobPriv, alicePub, p, out]);

  return (
    <Box>
      <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
        <InputLabel>DH Group</InputLabel>
        <Select value={group} label="DH Group" onChange={e => { setGroup(e.target.value); out.clear(); }}>
          <MenuItem value="group5">RFC 3526 Group 5 (1536-bit)</MenuItem>
          <MenuItem value="group14">RFC 3526 Group 14 (2048-bit)</MenuItem>
          <MenuItem value="group16">RFC 3526 Group 16 (4096-bit)</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>

      {group === 'custom' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField fullWidth label="p (hex)" value={customP} onChange={e => setCustomP(e.target.value)}
            variant="outlined" sx={{ ...inputSx }} placeholder="Prime modulus" spellCheck={false} />
          <TextField fullWidth label="g (decimal)" value={customG} onChange={e => setCustomG(e.target.value)}
            variant="outlined" sx={{ ...inputSx }} placeholder="Generator" spellCheck={false} />
        </Box>
      )}

      {/* Alice panel */}
      <Box sx={{
        border: `1px solid ${draculaColors.comment}`, borderRadius: 1, p: 2, mb: 2,
        backgroundColor: draculaColors.background,
      }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mb: 1 }}>Alice</Typography>
        <Button variant="contained" startIcon={<PlayArrow />} onClick={genAlice} fullWidth sx={primaryBtnSx}>
          Generate
        </Button>
        {alicePriv !== null && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment, flex: 1, wordBreak: 'break-all', fontFamily: MONO_FAMILY }}>
              Private: 0x{alicePriv.toString(16)}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}><IconButton size="small" onClick={() => { void copy(`0x${alicePriv.toString(16)}`); }} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="inherit" /></IconButton></Tooltip>
          </Box>
        )}
        {alicePub !== null && (
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment, flex: 1, wordBreak: 'break-all', fontFamily: MONO_FAMILY }}>
              Public: <Box component="span" sx={{ color: draculaColors.green }}>0x{alicePub.toString(16)}</Box>
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}><IconButton size="small" onClick={() => { void copy(`0x${alicePub.toString(16)}`); }} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="inherit" /></IconButton></Tooltip>
          </Box>
        )}
      </Box>

      {/* Bob panel */}
      <Box sx={{
        border: `1px solid ${draculaColors.comment}`, borderRadius: 1, p: 2, mb: 2,
        backgroundColor: draculaColors.background,
      }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mb: 1 }}>Bob</Typography>
        <Button variant="contained" startIcon={<PlayArrow />} onClick={genBob} fullWidth sx={primaryBtnSx}>
          Generate
        </Button>
        {bobPriv !== null && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment, flex: 1, wordBreak: 'break-all', fontFamily: MONO_FAMILY }}>
              Private: 0x{bobPriv.toString(16)}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}><IconButton size="small" onClick={() => { void copy(`0x${bobPriv.toString(16)}`); }} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="inherit" /></IconButton></Tooltip>
          </Box>
        )}
        {bobPub !== null && (
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment, flex: 1, wordBreak: 'break-all', fontFamily: MONO_FAMILY }}>
              Public: <Box component="span" sx={{ color: draculaColors.green }}>0x{bobPub.toString(16)}</Box>
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}><IconButton size="small" onClick={() => { void copy(`0x${bobPub.toString(16)}`); }} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="inherit" /></IconButton></Tooltip>
          </Box>
        )}
      </Box>

      {/* Shared Secret panel */}
      <Box sx={{
        border: `1px solid ${draculaColors.comment}`, borderRadius: 1, p: 2, mb: 2,
        backgroundColor: draculaColors.background,
      }}>
        <Typography variant="subtitle2" sx={{ color: draculaColors.cyan, mb: 1 }}>Shared Secret</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="contained" onClick={computeAlice} fullWidth sx={{ ...primaryBtnSx, fontSize: '0.75rem' }}>
            Alice computes
          </Button>
          <Button variant="contained" onClick={computeBob} fullWidth sx={{ ...primaryBtnSx, fontSize: '0.75rem' }}>
            Bob computes
          </Button>
        </Box>
        {sharedAlice !== null && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment, flex: 1, wordBreak: 'break-all', fontFamily: MONO_FAMILY }}>
              Alice shared: <Box component="span" sx={{ color: draculaColors.green }}>0x{sharedAlice.toString(16)}</Box>
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}><IconButton size="small" onClick={() => { void copy(`0x${sharedAlice.toString(16)}`); }} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="inherit" /></IconButton></Tooltip>
          </Box>
        )}
        {sharedBob !== null && (
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.comment, flex: 1, wordBreak: 'break-all', fontFamily: MONO_FAMILY }}>
              Bob shared: <Box component="span" sx={{ color: draculaColors.green }}>0x{sharedBob.toString(16)}</Box>
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}><IconButton size="small" onClick={() => { void copy(`0x${sharedBob.toString(16)}`); }} sx={{ color: draculaColors.cyan }}><ContentCopy fontSize="inherit" /></IconButton></Tooltip>
          </Box>
        )}
        {sharedAlice !== null && sharedBob !== null && (
          <Typography variant="caption" sx={{ color: sharedAlice === sharedBob ? draculaColors.green : draculaColors.red, mt: 1, display: 'block' }}>
            {sharedAlice === sharedBob ? '✓ Shared secrets match!' : '✗ Shared secrets differ!'}
          </Typography>
        )}
      </Box>

      {out.error && <Typography sx={{ color: draculaColors.red, mt: 1, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>{out.error}</Typography>}
    </Box>
  );
}
