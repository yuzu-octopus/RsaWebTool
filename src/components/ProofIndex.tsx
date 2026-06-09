import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { colFlexSx } from '../styles/shared';
import { inputSx } from '../styles/inputSx';

function AttackListItem({
  attack,
  onClick,
}: {
  attack: typeof attacks[0];
  onClick: (attack: typeof attacks[0]) => void;
}) {
  const primaryContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Typography sx={{ color: draculaColors.cyan, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
        {attack.name}
      </Typography>
      <Typography
        component="span"
        sx={{
          color: attack.frontendCheck ? draculaColors.green : draculaColors.orange,
          fontSize: '0.65rem',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        ({attack.frontendCheck ? 'Local' : 'SageMath'})
      </Typography>
    </Box>
  );
  const secondaryContent = (
    <Typography sx={{ color: draculaColors.comment, fontFamily: "'JetBrains Mono', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", fontSize: '0.75rem' }}>
      [{attack.category}] {attack.description}
    </Typography>
  );
  return (
    <ListItem disablePadding sx={{ mb: 1 }}>
      <ListItemButton
        onClick={() => onClick(attack)}
        sx={{
          borderRadius: 1,
          border: `1px solid ${draculaColors.comment}`,
          '&:hover': { backgroundColor: draculaColors.background, borderColor: draculaColors.purple },
        }}
      >
        <ListItemText primary={primaryContent} secondary={secondaryContent} />
      </ListItemButton>
    </ListItem>
  );
}

export function ProofIndex() {
  const { viewMode, setSelectedAttack, setViewMode } = useAppContext();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    attacks.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  );

  const handleClick = useCallback((attack: typeof attacks[0]) => {
    setSelectedAttack(attack);
    setViewMode('attack');
  }, [setSelectedAttack, setViewMode]);

  const attackItems = useMemo(() =>
    filtered.map(attack => (
      <AttackListItem key={attack.id} attack={attack} onClick={handleClick} />
    )),
    [filtered, handleClick],
  );

  if (viewMode !== 'proofs') return null;

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <MenuBook sx={{ fontSize: 'inherit' }} /> Attack Index
          </Typography>

          <TextField
            fullWidth
            label="Search proofs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ ...inputSx, mb: 2 }}
          />

          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 1 }}>
            {filtered.length} of {attacks.length} attacks
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', pb: '30vh' }}>
        <List sx={{ width: '100%', maxWidth: 640, px: 2 }}>
          {attackItems}
        </List>
      </Box>
    </Box>
  );
}
