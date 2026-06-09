import { useState, useCallback } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { draculaColors } from '../../../theme/dracula';
import { tabSx } from '../../../styles/shared';
import { ProofRenderer } from '../../ProofRenderer';

const TABS = [
  { id: 'properties', label: 'Properties' },
  { id: 'md', label: 'Merkle-Damgård' },
  { id: 'sha2', label: 'SHA-256 Internals' },
  { id: 'sponge', label: 'Sponge / SHA-3' },
  { id: 'hmac', label: 'HMAC' },
  { id: 'password', label: 'Password Hashing' },
  { id: 'pow', label: 'Proof of Work' },
];

const TAB_CONTENT: Record<string, string> = {
  properties: '\\textbf{Hash Functions} map arbitrary-length input to a fixed-length output: $H: \\{0,1\\}^* \\rightarrow \\{0,1\\}^n$.\n\n\\textbf{Preimage Resistance:} Given $y = H(x)$, infeasible to find $x\'$ with $H(x\') = y$. $O(2^n)$.\n\n\\textbf{Collision Resistance:} Find any $x \\neq x\'$ with $H(x) = H(x\')$. $O(2^{n/2})$ birthday bound.\n\n\\textbf{Lengths:} MD5 (128-bit, broken), SHA-1 (160-bit, deprecated), SHA-256 (256-bit, secure), SHA-512 (512-bit, secure).\n\n\\textbf{Avalanche Effect:} 1-bit input change flips ~50\\% of output bits.',
  md: '\\textbf{Merkle-Damgård Construction:} Used by MD5, SHA-1, SHA-2. Message padded to block boundary, split into blocks, each updates $h_{i+1} = f(h_i, m_i)$.\n\n\\textbf{Length Extension:} Given $H(M)$ and $\\text{len}(M)$, compute $H(M \\parallel \\text{pad} \\parallel S)$ without knowing $M$. The digest IS the internal state.\n\nImmune: SHA-3 (sponge), BLAKE2/3 (HAIFA with length encoding).',
  sha2: '\\textbf{SHA-256:} 64-byte blocks, 64 rounds. IV = fractional parts of square roots of first 8 primes.\n\n$$T_1 = h + \\Sigma_1(e) + Ch(e,f,g) + K_i + W_i$$\n$$T_2 = \\Sigma_0(a) + Maj(a,b,c)$$\n\n$Ch(x,y,z) = (x \\land y) \\oplus (\\lnot x \\land z)$\n$Maj(x,y,z) = (x \\land y) \\oplus (x \\land z) \\oplus (y \\land z)$\n\n$K_i$ = fractional parts of cube roots of first 64 primes.',
  sponge: '\\textbf{Sponge Construction (SHA-3 / Keccak):} $b$-bit state ($b = r + c$). Absorb XORs $r$-bit blocks with state then applies $f$; Squeeze outputs $r$ bits.\n\nSHA-3-256: $r = 1088$, $c = 512$. SHA-3-512: $r = 576$, $c = 1024$.\n\nSHA-3 uses $\\texttt{0x06}$ suffix vs raw Keccak $\\texttt{0x01}$.\n\n\\textbf{BLAKE2/3:} HAIFA construction (internal length encoding). BLAKE3: tree-based parallelism.',
  hmac: '\\textbf{HMAC:}\n$$HMAC_K(M) = H((K\' \\oplus opad) \\parallel H((K\' \\oplus ipad) \\parallel M))$$\n\nUnforgeable without $K$. HMAC security does NOT require collision resistance.\n\n\\textbf{Timing Attacks:} Constant-time comparison: XOR all bytes and check $= 0$.\nUse \\texttt{crypto.timingSafeEqual()} in JavaScript.',
  password: '\\textbf{PBKDF2:} Iterate HMAC $c$ times. CPU-only. \\textbf{scrypt:} Memory-hard ($Salsa20/8$).\n\n\\textbf{Argon2id} (recommended): $t=3$, $m=65536$, $p=4$.\n\nAlways use a unique 16+ byte random salt per password.',
  pow: '\\textbf{Proof of Work:} Find $x$ such that $H(\\text{prefix} \\parallel x) < T$.\n\nDifficulty: $d$ leading zero bits requires $\\sim 2^d$ attempts.\n\nBitcoin: SHA-256d (double hash). ASIC resistance: scrypt, Equihash, RandomX.',
};

export default function ExplanationTab() {
  const [tab, setTab] = useState('properties');
  const tabIdx = TABS.findIndex(t => t.id === tab);

  const handleChange = useCallback((_e: React.SyntheticEvent, idx: number) => {
    if (idx >= 0 && idx < TABS.length) setTab(TABS[idx].id);
  }, []);

  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>Hash Function Reference</Typography>
      <Tabs value={tabIdx >= 0 ? tabIdx : 0} onChange={handleChange}
        sx={{ mb: 2, borderBottom: `1px solid ${draculaColors.comment}`, minHeight: 40,
          '& .MuiTab-root': { ...tabSx, px: 2, fontSize: '0.75rem', minHeight: 40 },
          '& .MuiTabs-indicator': { backgroundColor: draculaColors.cyan },
          '& .Mui-selected': { color: `${draculaColors.cyan} !important` },
        }} variant="scrollable" scrollButtons="auto">
        {TABS.map(t => (<Tab key={t.id} label={t.label} />))}
      </Tabs>
      <Box sx={{ maxHeight: '60vh', overflow: 'auto', pr: 1,
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
      }}>
        <ProofRenderer latex={TAB_CONTENT[tab] ?? ''} />
      </Box>
    </Box>
  );
}
