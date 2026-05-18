import { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Divider,
  Link,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { CATEGORIES, attacksByCategory, attacks } from '../data/attacks';
import { useAppContext } from '../context/AppContext';

export const drawerWidth = 220;

export function Sidebar() {
  const { selectedAttack, setSelectedAttack, setViewMode } = useAppContext();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const handleAttackClick = (attackId: string) => {
    const attack = attacks.find(a => a.id === attackId) || null;
    setSelectedAttack(attack);
    setViewMode('attack');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: draculaColors.currentLine,
          borderRight: `1px solid ${draculaColors.comment}`,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ color: draculaColors.purple, fontWeight: 700 }}>
          RSA CTF Tool
        </Typography>
        <Typography variant="caption" sx={{ color: draculaColors.comment }}>
          SageMath Powered
        </Typography>
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {CATEGORIES.map(cat => (
          <Box key={cat}>
            <ListItemButton onClick={() => toggleCat(cat)} sx={{ px: 2 }}>
              <Typography sx={{ color: draculaColors.cyan, fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>
                {cat}
              </Typography>
              {expandedCats.has(cat) ? <ExpandLess sx={{ color: draculaColors.comment }} /> : <ExpandMore sx={{ color: draculaColors.comment }} />}
            </ListItemButton>
            <Collapse in={expandedCats.has(cat)} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {(attacksByCategory.get(cat) || []).map(attack => (
                  <ListItemButton
                    key={attack.id}
                    onClick={() => handleAttackClick(attack.id)}
                    sx={{
                      pl: 4,
                      borderLeft: selectedAttack?.id === attack.id ? `3px solid ${draculaColors.purple}` : '3px solid transparent',
                      backgroundColor: selectedAttack?.id === attack.id ? draculaColors.background : 'transparent',
                      '&:hover': { backgroundColor: draculaColors.background },
                    }}
                  >
                    <ListItemText
                      primary={attack.name}
                      slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.75rem' } } }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}

        <Divider sx={{ borderColor: draculaColors.comment, my: 1 }} />

        <ListItemButton
          onClick={() => setViewMode('magic')}
          sx={{
            mx: 1,
            border: `1px solid ${draculaColors.purple}`,
            borderRadius: 1,
            '&:hover': { backgroundColor: draculaColors.background },
          }}
        >
          <ListItemText
            primary="🪄 Magic"
            slotProps={{ primary: { sx: { color: draculaColors.purple, fontWeight: 600, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setViewMode('proofs')}
          sx={{
            mx: 1,
            mt: 0.5,
            '&:hover': { backgroundColor: draculaColors.background },
          }}
        >
          <ListItemText
            primary="📚 Proofs Index"
            slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>
      </List>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: draculaColors.comment, display: 'block' }}>
          © 2026 yuzu-octopus
        </Typography>
        <Typography variant="caption" sx={{ color: draculaColors.comment, display: 'block' }}>
          Powered by{' '}
          <Link href="https://pages.github.com" target="_blank" rel="noopener" sx={{ color: draculaColors.purple }}>
            GitHub Pages
          </Link>
        </Typography>
        <Typography variant="caption" sx={{ color: draculaColors.comment, display: 'block' }}>
          Made with{' '}
          <Link href="https://vite.dev" target="_blank" rel="noopener" sx={{ color: draculaColors.purple }}>
            Vite
          </Link>
        </Typography>
      </Box>
    </Drawer>
  );
}
