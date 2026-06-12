import { Box, Typography } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { MONO_FAMILY } from '../../styles/shared';

export function DHExplanationTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>Diffie-Hellman Key Exchange</Typography>
      <Box sx={{
        maxHeight: '60vh', overflow: 'auto', pr: 1,
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
      }}>
        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>Protocol</Typography>
        <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
          Diffie-Hellman (DH) key exchange allows two parties to establish a shared secret over an insecure channel.
          Security relies on the Computational Diffie-Hellman (CDH) assumption and the Discrete Logarithm Problem (DLP).
        </Typography>

        <Box sx={{
          backgroundColor: draculaColors.currentLine,
          p: 2, borderRadius: 1, mb: 2,
          fontFamily: MONO_FAMILY,
          fontSize: '0.75rem',
          lineHeight: 1.8,
          color: draculaColors.foreground,
          whiteSpace: 'pre',
          overflow: 'auto',
        }}>
{`Alice                              Bob
  |                                  |
  |--- agree on (p, g) ------------>|
  |                                  |
  a = random secret                 b = random secret
  A = g^a mod p                     B = g^b mod p
  |--- A -------------------------->|
  |<----------- B -------------------|
  |                                  |
  s = B^a mod p                     s = A^b mod p
  s = g^(ab) mod p                  s = g^(ab) mod p`}
        </Box>

        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>Security</Typography>
        <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
          The security of DH depends on the difficulty of computing discrete logarithms in the group Z<sub>p</sub>*.
          Standardized MODP groups (RFC 3526) use safe primes p = 2q + 1 to prevent Pohlig-Hellman attacks.
        </Typography>

        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>RFC 3526 MODP Groups</Typography>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, fontFamily: MONO_FAMILY, fontSize: '0.75rem' }}>
          <Box component="thead">
            <Box component="tr" sx={{ borderBottom: `1px solid ${draculaColors.comment}` }}>
              <Box component="th" sx={{ textAlign: 'left', p: 1, color: draculaColors.cyan }}>Group</Box>
              <Box component="th" sx={{ textAlign: 'left', p: 1, color: draculaColors.cyan }}>Bits</Box>
              <Box component="th" sx={{ textAlign: 'left', p: 1, color: draculaColors.cyan }}>Strength</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {[
              { id: '5', bits: '1536', strength: '~90-bit' },
              { id: '14', bits: '2048', strength: '~112-bit' },
              { id: '16', bits: '4096', strength: '~150-bit' },
            ].map(row => (
              <Box key={row.id} component="tr" sx={{ borderBottom: `1px solid ${draculaColors.currentLine}` }}>
                <Box component="td" sx={{ p: 1, color: draculaColors.green }}>{row.id}</Box>
                <Box component="td" sx={{ p: 1, color: draculaColors.foreground }}>{row.bits}</Box>
                <Box component="td" sx={{ p: 1, color: draculaColors.foreground }}>{row.strength}</Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="subtitle1" sx={{ color: draculaColors.pink, mt: 2, mb: 1 }}>Limitations</Typography>
        <Typography variant="body2" sx={{ color: draculaColors.foreground, mb: 1, lineHeight: 1.7 }}>
          Raw DH provides no authentication and is vulnerable to man-in-the-middle (MITM) attacks.
          In practice, DH is combined with digital signatures (e.g., IKE, TLS) or used in
          authenticated protocols like Station-to-Station.
        </Typography>
      </Box>
    </Box>
  );
}
