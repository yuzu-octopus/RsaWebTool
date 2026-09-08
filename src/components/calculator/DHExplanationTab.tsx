import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { Table, proportional, pixel } from '@astryxdesign/core/Table';

interface RfcGroupRow extends Record<string, unknown> {
  id: string;
  bits: string;
  strength: string;
}

const RFC_GROUPS: RfcGroupRow[] = [
  { id: '5', bits: '1536', strength: '~90-bit' },
  { id: '14', bits: '2048', strength: '~112-bit' },
  { id: '16', bits: '4096', strength: '~150-bit' },
];

const PROTOCOL_DIAGRAM = `Alice                              Bob
  |                                  |
  |--- agree on (p, g) ------------>|
  |                                  |
  a = random secret                 b = random secret
  A = g^a mod p                     B = g^b mod p
  |--- A -------------------------->|
  |<----------- B -------------------|
  |                                  |
  s = B^a mod p                     s = A^b mod p
  s = g^(ab) mod p                  s = g^(ab) mod p`;

export function DHExplanationTab() {
  return (
    <Stack direction="vertical" gap={2}>
      <Heading level={4}>Diffie-Hellman Key Exchange</Heading>
      <Stack direction="vertical" gap={2} isScrollable>
        <Stack direction="vertical" gap={1}>
          <Heading level={5}>Protocol</Heading>
          <Text>
            Diffie-Hellman (DH) key exchange allows two parties to establish a shared secret over an insecure channel.
            Security relies on the Computational Diffie-Hellman (CDH) assumption and the Discrete Logarithm Problem (DLP).
          </Text>
        </Stack>

        <CodeBlock code={PROTOCOL_DIAGRAM} language="plaintext" hasCopyButton={false} width="100%" />

        <Stack direction="vertical" gap={1}>
          <Heading level={5}>Security</Heading>
          <Text>
            The security of DH depends on the difficulty of computing discrete logarithms in the group Z_p*.
            Standardized MODP groups (RFC 3526) use safe primes p = 2q + 1 to prevent Pohlig-Hellman attacks.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5}>RFC 3526 MODP Groups</Heading>
          <Table
            data={RFC_GROUPS}
            columns={[
              { key: 'id', header: 'Group', width: pixel(80) },
              { key: 'bits', header: 'Bits', width: proportional(1) },
              { key: 'strength', header: 'Strength', width: proportional(1) },
            ]}
            idKey="id"
          />
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5}>Limitations</Heading>
          <Text>
            Raw DH provides no authentication and is vulnerable to man-in-the-middle (MITM) attacks.
            In practice, DH is combined with digital signatures (e.g., IKE, TLS) or used in
            authenticated protocols like Station-to-Station.
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
