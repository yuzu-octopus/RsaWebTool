import {
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { colFlexSx, MONO_FAMILY } from '../styles/shared';
import { useAppContext } from '../hooks/useAppContext';

interface Section {
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'Getting Started',
    content: [
      'RSA Web Tool is a browser-only toolkit for RSA CTF challenges with 47 attacks across 5 categories.',
      'To use it: select an attack from the sidebar, fill in the required inputs, then click Run (or Generate for test data).',
      'Output shows SUCCESS or FAILED markers. On success, factors are auto-submitted to FactorDB and decryption is attempted automatically.',
    ],
  },
  {
    title: 'Attack Categories',
    content: [
      'Factorization (19): Factor n into p×q using batch-GCD, Pollard, ECM, and other algorithms.',
      'Partial Key / Lattice (11): Recover private key from partial information using Coppersmith and lattice reduction.',
      'Message / Protocol (9): Exploit protocol weaknesses like Hastad broadcast, Bleichenbacher oracle, and CRT faults.',
      'Oracle (4): Side-channel attacks including LSB oracle and padding oracle.',
      'Advanced (4): ROCA, Nitros, FactorDB lookup, and small public exponent attacks.',
    ],
  },
  {
    title: 'Features',
    content: [
      'Magic Panel: Paste any text — auto-detect RSA parameters and run all applicable attacks in parallel.',
      'RSA Calculator: Key generation, encryption, and decryption with custom exponents.',
      'Format Converter: Convert between hex, decimal, Base64, and text representations.',
      'PEM Key Decryptor: Parse and decrypt PEM private keys in PKCS#1 and PKCS#8 formats.',
      'Source Code View: View the actual TypeScript or Python implementation of any attack.',
      'Proof Viewer: Mathematical proofs rendered with KaTeX for every attack.',
    ],
  },
  {
    title: 'Tips',
    content: [
      'Generate test cases to quickly verify that an attack works with known-good data.',
      'Use Magic Panel for unstructured input like CTF challenge text — it detects parameters automatically.',
      'Try FactorDB Lookup first for unknown moduli — it is the fastest option.',
      'Keyboard shortcut: Press Ctrl+K (or Cmd+K on Mac) to open the command palette.',
    ],
  },
];

const sectionContentSx = {
  px: 2,
  pb: 0.5,
} as const;

const bulletSx = {
  color: draculaColors.foreground,
  fontFamily: MONO_FAMILY,
  fontSize: '0.85rem',
  lineHeight: 1.6,
  mb: 0.25,
} as const;

export function InstructionsPanel() {
  const { viewMode } = useAppContext();

  if (viewMode !== 'instructions') return null;

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <MenuBook sx={{ fontSize: 'inherit' }} /> Instructions
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', pb: '20vh' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          {SECTIONS.map((section) => (
            <Box key={section.title} sx={{ mb: 1.5 }}>
              <Box sx={{ px: 2, pt: 1, pb: 0.25 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: draculaColors.cyan,
                    fontFamily: MONO_FAMILY,
                    fontWeight: 700,
                  }}
                >
                  {section.title}
                </Typography>
              </Box>

              <Box sx={sectionContentSx}>
                {section.content.map((line, i) => (
                  <Typography key={i} sx={bulletSx}>
                    {line}
                  </Typography>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default InstructionsPanel;
