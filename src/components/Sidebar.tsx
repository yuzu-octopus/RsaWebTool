import { useState, useEffect, useRef } from 'react';
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
import { ExpandLess, ExpandMore, AutoFixHigh, MenuBook, Calculate, SwapHoriz, CheckCircle, ErrorOutlined, VpnKey } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { CATEGORIES, attacksByCategory } from '../attacks';
import type { Attack } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { FACTORDB_PROXY_URL } from '../config';

const drawerWidth = 220;

interface ServiceStatus {
  factordb: 'checking' | 'ok' | 'error';
  sagecell: 'checking' | 'ok' | 'error';
}

export function Sidebar() {
  const { selectedAttack, setSelectedAttack, setViewMode } = useAppContext();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));
  const [status, setStatus] = useState<ServiceStatus>({
    factordb: 'checking',
    sagecell: typeof window !== 'undefined' && window.sagecell ? 'ok' : 'checking',
  });
  const sageCellChecked = useRef(false);

  useEffect(() => {
    const abortController = new AbortController();
    let factorDbTimeout: ReturnType<typeof setTimeout> | undefined;

    if (FACTORDB_PROXY_URL) {
      fetch(`${FACTORDB_PROXY_URL}?query=15`, { signal: abortController.signal })
        .then(r => r.json())
        .then(() => {
          if (factorDbTimeout) clearTimeout(factorDbTimeout);
          setStatus(prev => ({ ...prev, factordb: 'ok' }));
        })
        .catch(() => {
          if (!abortController.signal.aborted) {
            if (factorDbTimeout) clearTimeout(factorDbTimeout);
            setStatus(prev => ({ ...prev, factordb: 'error' }));
          }
        });
      factorDbTimeout = setTimeout(() => {
        if (!abortController.signal.aborted) {
          abortController.abort();
          setStatus(prev => ({ ...prev, factordb: 'error' }));
        }
      }, 5000);
    } else {
      queueMicrotask(() => setStatus(prev => ({ ...prev, factordb: 'error' })));
    }

    return () => {
      abortController.abort();
      if (factorDbTimeout) clearTimeout(factorDbTimeout);
    };
  }, []);

  useEffect(() => {
    if (sageCellChecked.current) return;

    const timer = setInterval(() => {
      if (window.sagecell) {
        clearInterval(timer);
        clearTimeout(timeout);
        sageCellChecked.current = true;
        setStatus(prev => ({ ...prev, sagecell: 'ok' }));
      }
    }, 200);
    const timeout = setTimeout(() => {
      clearInterval(timer);
      sageCellChecked.current = true;
      if (!window.sagecell) {
        setStatus(prev => ({ ...prev, sagecell: 'error' }));
      }
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleAttackClick = (attack: Attack) => {
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
            <Collapse in={expandedCats.has(cat)} unmountOnExit>
              <List component="div" disablePadding>
                {(attacksByCategory.get(cat) || []).map(attack => (
                  <ListItemButton
                    key={attack.id}
                    onClick={() => handleAttackClick(attack)}
                    data-testid={`attack-${attack.id}`}
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
          onClick={() => setViewMode('instructions')}
          sx={{
            mx: 1,
            '&:hover': { backgroundColor: draculaColors.background },
          }}
        >
          <MenuBook sx={{ color: draculaColors.foreground, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Instructions"
            slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setViewMode('magic')}
          sx={{
            mx: 1,
            '&:hover': { backgroundColor: draculaColors.background },
          }}
        >
          <AutoFixHigh sx={{ color: draculaColors.purple, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Magic"
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
          <MenuBook sx={{ color: draculaColors.foreground, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Proofs Index"
            slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setViewMode('calculator')}
          sx={{
            mx: 1,
            mt: 0.5,
            '&:hover': { backgroundColor: draculaColors.background },
          }}
        >
          <Calculate sx={{ color: draculaColors.cyan, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Calculator"
            slotProps={{ primary: { sx: { color: draculaColors.cyan, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setViewMode('format-converter')}
          sx={{
            mx: 1,
            mt: 0.5,
            '&:hover': { backgroundColor: draculaColors.background },
          }}
        >
          <SwapHoriz sx={{ color: draculaColors.orange, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Converter"
            slotProps={{ primary: { sx: { color: draculaColors.orange, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setViewMode('pem')}
          sx={{
            mx: 1,
            mt: 0.5,
            '&:hover': { backgroundColor: draculaColors.background },
          }}
        >
          <VpnKey sx={{ color: draculaColors.yellow, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="PEM Decryptor"
            slotProps={{ primary: { sx: { color: draculaColors.yellow, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <Divider sx={{ borderColor: draculaColors.comment, my: 1 }} />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ color: draculaColors.comment, fontWeight: 600, fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            SERVICE STATUS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {status.factordb === 'ok' ? (
              <CheckCircle sx={{ color: draculaColors.green, fontSize: '0.9rem' }} />
            ) : status.factordb === 'error' ? (
              <ErrorOutlined sx={{ color: draculaColors.red, fontSize: '0.9rem' }} />
            ) : (
              <Box sx={{ width: '0.9rem', height: '0.9rem', borderRadius: '50%', border: `2px solid ${draculaColors.comment}` }} />
            )}
            <Typography variant="caption" sx={{ color: draculaColors.foreground, fontSize: '0.7rem' }}>
              FactorDB
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {status.sagecell === 'ok' ? (
              <CheckCircle sx={{ color: draculaColors.green, fontSize: '0.9rem' }} />
            ) : status.sagecell === 'error' ? (
              <ErrorOutlined sx={{ color: draculaColors.red, fontSize: '0.9rem' }} />
            ) : (
              <Box sx={{ width: '0.9rem', height: '0.9rem', borderRadius: '50%', border: `2px solid ${draculaColors.comment}` }} />
            )}
            <Typography variant="caption" sx={{ color: draculaColors.foreground, fontSize: '0.7rem' }}>
              SageMathCell
            </Typography>
          </Box>
        </Box>
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
