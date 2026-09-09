import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Divider } from '@astryxdesign/core/Divider';
import { useAppContext } from '../hooks/useAppContext';

interface Section {
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'Getting Started',
    content: [
      'RSA Web Tool is a browser-only toolkit for RSA CTF challenges with 51 attacks across 5 categories.',
      'To use it: select an attack from the sidebar, fill in the required inputs, then click Run (or Generate for test data).',
      'Output shows SUCCESS or FAILED markers. On success, factors are auto-submitted to FactorDB and decryption is attempted automatically.',
    ],
  },
  {
    title: 'Attack Categories',
    content: [
      'Factorization (20): Factor n into p×q using batch-GCD, Pollard, ECM, and other algorithms.',
      'Partial Key / Lattice (12): Recover private key from partial information using Coppersmith and lattice reduction.',
      'Message / Protocol (10): Exploit protocol weaknesses like Hastad broadcast, Bleichenbacher oracle, and CRT faults.',
      'Oracle (5): Side-channel attacks including LSB oracle and padding oracle.',
      'Advanced (4): ROCA, Nitros, FactorDB lookup, and small public exponent attacks.',
    ],
  },
  {
    title: 'Features',
    content: [
      'Magic Panel: Paste any text — auto-detect RSA parameters and run all applicable attacks in parallel.',
      'RSA Calculator: Key generation, encryption, and decryption with custom exponents.',
      'Format Converter: Convert between hex, dec, Base64, and text representations.',
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

export function InstructionsPanel() {
  const { viewMode } = useAppContext();

  if (viewMode !== 'instructions') return null;

  return (
    <Stack>
      <Stack hAlign="center" padding={2}>
        <Stack width="100%" maxWidth={640}>
          <Heading level={3} color="accent">Instructions</Heading>
        </Stack>
      </Stack>

      <Divider />

      <Stack hAlign="center" isScrollable>
        <Stack width="100%" maxWidth={640} gap={2} padding={2}>
          {SECTIONS.map((section) => (
            <Stack key={section.title} gap={1}>
              <Heading level={4} style={{ color: 'var(--dracula-cyan)' }}>
                {section.title}
              </Heading>

              <Stack gap={1}>
                {section.content.map((line) => (
                  <Text key={line.slice(0, 48)} type="large" as="p">
                    {line}
                  </Text>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

export default InstructionsPanel;
