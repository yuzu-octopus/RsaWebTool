import { useState } from 'react';
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
import { useAppContext } from '../context/AppContext';
import { attacks } from '../attacks';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: draculaColors.currentLine,
    color: draculaColors.foreground,
    fontFamily: "'JetBrains Mono', monospace",
    '& fieldset': { borderColor: draculaColors.comment },
    '&:hover fieldset': { borderColor: draculaColors.purple },
    '&.Mui-focused fieldset': { borderColor: draculaColors.purple },
  },
  '& .MuiInputLabel-root': {
    color: draculaColors.comment,
    fontFamily: "'JetBrains Mono', monospace",
    '&.Mui-focused': { color: draculaColors.purple },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'JetBrains Mono', monospace",
  },
};

export function ProofIndex() {
  const { viewMode, setSelectedAttack, setViewMode } = useAppContext();
  const [search, setSearch] = useState('');

  if (viewMode !== 'proofs') return null;

  const filtered = attacks.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleClick = (attack: typeof attacks[0]) => {
    setSelectedAttack(attack);
    setViewMode('attack');
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h2" sx={{ color: draculaColors.purple, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <MenuBook sx={{ fontSize: 'inherit' }} /> Proofs Index
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

      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <List sx={{ width: '100%', maxWidth: 640, px: 2 }}>
          {filtered.map(attack => (
            <ListItem key={attack.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleClick(attack)}
                sx={{
                  borderRadius: 1,
                  border: `1px solid ${draculaColors.comment}`,
                  '&:hover': { backgroundColor: draculaColors.background, borderColor: draculaColors.purple },
                }}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ color: draculaColors.cyan, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      {attack.name}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: draculaColors.comment, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                      [{attack.category}] {attack.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
