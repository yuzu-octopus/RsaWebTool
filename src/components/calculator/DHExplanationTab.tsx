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
  { id: '5', bits: '1536', strength: '~96-bit (legacy — below floor)' },
  { id: '14', bits: '2048', strength: '~112-bit (NIST floor)' },
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
      <Heading level={4} style={{ color: 'var(--dracula-cyan)' }}>Diffie-Hellman Key Exchange</Heading>
      <Stack direction="vertical" gap={2} isScrollable>
        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Protocol</Heading>
          <Text>
            Diffie-Hellman (DH) key exchange allows two parties to establish a shared secret over an insecure channel.
            Security relies on the Computational Diffie-Hellman (CDH) assumption and the Discrete Logarithm Problem (DLP).
          </Text>
        </Stack>

        <CodeBlock code={PROTOCOL_DIAGRAM} language="plaintext" hasCopyButton={false} width="100%" />

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Security</Heading>
          <Text>
            The security of DH depends on the difficulty of computing discrete logarithms in the group Z_p*.
            Pohlig-Hellman applies whenever p-1 is smooth, so safe primes p = 2q + 1 only remove the easy
            smooth case — the large subgroup order q must still be big enough on its own.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>RFC 3526 MODP Groups</Heading>
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
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Strength Notes</Heading>
          <Text>
            Strengths follow NIST SP 800-57 Part 1: 2048-bit finite-field DH is the 112-bit floor for
            new use. Group 5 (1536-bit) is legacy — below the floor, do not deploy. The Key Exchange
            tab also offers RFC 2412 Group 1 (768-bit, labelled BREAKABLE) for demo only.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Logjam / Export Downgrade</Heading>
          <Text>
            Logjam (Adrian et al., 2015) downgraded TLS to 512-bit export DHE, ran one NFS
            precomputation per widely-shared group, then broke individual sessions cheaply — amortising
            one expensive sieving step over millions of connections. Lesson: group size and group
            freshness both matter; shared small groups turn one break into many. See the
            Logjam entry in the Attacks tab.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>X25519 Peer Keys</Heading>
          <Text>
            For X25519, RFC 7748 §6.1 permits (MAY-level) rejecting weak peer keys. The minimum the
            Attacks tab enforces is rejecting the all-zero u-coordinate, which would otherwise force a
            predictable secret; rejecting known low-order points (e.g. u = 1) is stricter SHOULD-level
            hygiene for full contributory behaviour.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Bounded Keys & DSA Parameters</Heading>
          <Text>
            When the secret is known to lie in an interval [a, b) — e.g. a biased RNG — Pollard&apos;s
            kangaroo finds it in O(sqrt(b-a)) jumps (try the bounded-DLP demo). Finite-field DSA
            (FIPS 186) instead works in a validated prime-order subgroup: q prime (N ≥ 224 bits),
            q dividing p-1, g^q = 1 mod p — the dsa-params entry checks exactly this.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Parameters You Didn&apos;t Validate</Heading>
          <Text>
            A composite modulus p breaks the field assumptions every attack here relies on (factor p
            and each factor leaks key material — a different, easier game than DLP mod prime), and
            server-supplied or trapdoored (p, g) that skip validation are a known attack direction.
            Never trust group parameters you did not check: Miller-Rabin p, then the subgroup tests.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Key Confirmation Leaks</Heading>
          <Text>
            The Lim–Lee demo pairs with this lesson: a raw confirmation oracle (MAC verify, finished
            message) that answers &quot;is this guess the secret?&quot; turns small-subgroup confinement
            into full key recovery against static keys. Always run DH output through a KDF, use
            ephemeral keys, and validate peer keys — confirmation must not become a decision oracle.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading level={5} style={{ color: 'var(--dracula-pink)' }}>Limitations</Heading>
          <Text>
            Raw DH provides no authentication and is vulnerable to man-in-the-middle (MITM) attacks.
            In practice, DH is combined with digital signatures (e.g., IKE, TLS) or used in
            authenticated protocols like Station-to-Station. Prefer ephemeral keys: static DH keys
            additionally enable confinement-style recovery when validation is missing.
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
