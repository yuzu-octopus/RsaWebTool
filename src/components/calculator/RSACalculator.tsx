import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { VpnKey } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { colFlexSx, centeredPanelSx } from '../../styles/shared';
import { CalculatorSubTabs } from './CalculatorSubTabs';
import { RsaKeyGenTab } from '../RsaKeyGenTab';
import { RsaEncryptTab } from '../RsaEncryptTab';
import { RsaDecryptTab } from '../RsaDecryptTab';
import { ProofRenderer } from '../ProofRenderer';

const SUB_TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'key-gen', label: 'Key Gen' },
  { id: 'encrypt', label: 'Encrypt' },
  { id: 'decrypt', label: 'Decrypt' },
];

const EXPLANATION_LATEX =
'\\textbf{RSA Key Generation:}\n\n' +
'Choose two large primes $p$ and $q$, then compute:\n\n' +
'$n = p \\cdot q$\n' +
'$\\varphi(n) = (p-1)(q-1)$\n\n' +
'Select public exponent $e$ where $\\gcd(e, \\varphi(n)) = 1$ (commonly $65537$).\n' +
'The private exponent is:\n\n' +
'$d \\equiv e^{-1} \\pmod{\\varphi(n)}$\n\n' +
'Public key: $(e, n)$ \u00a0 Private key: $(d, n)$.\n\n' +
'\\textbf{Encryption:}\n\n' +
'$c \\equiv m^e \\pmod{n}$\n\n' +
'$m$ is the plaintext as an integer $0 < m < n$.\n\n' +
'\\textbf{Decryption:}\n\n' +
'$m \\equiv c^d \\pmod{n}$\n\n' +
'This works because $e \\cdot d \\equiv 1 \\pmod{\\varphi(n)}$, so $m^{e \\cdot d} \\equiv m \\pmod{n}$ by Euler\'s theorem.\n\n' +
'\\textbf{CRT Optimization:}\n\n' +
'Chinese Remainder Theorem speeds up decryption ~4x. Precompute:\n\n' +
'$d_p = d \\bmod (p-1)$\n' +
'$d_q = d \\bmod (q-1)$\n' +
'$q_{\\text{inv}} = q^{-1} \\pmod{p}$\n\n' +
'Decrypt: $m_p = c^{d_p} \\bmod p$, $m_q = c^{d_q} \\bmod q$, then $m = m_q + q \\cdot ((q_{\\text{inv}} \\cdot (m_p - m_q)) \\bmod p)$.\n\n' +
'\\textbf{PKCS\\#1 v1.5 Padding:}\n\n' +
'$\\text{EM} = \\texttt{0x00} \\parallel \\texttt{0x02} \\parallel \\text{PS} \\parallel \\texttt{0x00} \\parallel M$\n\n' +
'PS is $k-3-|M|$ random non-zero bytes. The leading $\texttt{0x00}$ ensures the padded message is less than $n$.\n\n' +
'\\textbf{OAEP Padding:}\n\n' +
'Optimal Asymmetric Encryption Padding uses a Feistel network with a hash function $G$ and $H$ (MGF1):\n\n' +
'$\\text{EM} = \\text{mask\\_seed} \\parallel \\text{masked\\_DB}$' +
'\n\n' +
'Provides semantic security: same plaintext produces different ciphertexts each time. Recommended over PKCS\\#1 v1.5.\n\n' +
'\\textbf{Common CTF Attacks:}\n\n' +
'\\begin{itemize}\n' +
'\\item \\textbf{Small $e$:} When $e=3$ and $m^3 < n$, ciphertext decryption is simply $m = \\sqrt[3]{c}$ (integer cube root).\n' +
'\\item \\textbf{Common Modulus:} Same $n$, different $e_1, e_2$. If $\\gcd(e_1, e_2) = 1$, find $a e_1 + b e_2 = 1$ via extended GCD, then $m = c_1^a \\cdot c_2^b \\bmod n$.\n' +
'\\item \\textbf{Wiener\'s Attack:} When $d < \\frac{1}{3} n^{1/4}$, continued fractions on $e/n$ recover $d$ directly.\n' +
'\\item \\textbf{Hastad\'s Broadcast:} Same $m$ encrypted to $k \\geq e$ recipients with the same $e$ — CRT recovers $m^e$, then take $e$th root.\n' +
'\\item \\textbf{Coppersmith:} Partial knowledge of $p$ or small roots of $f(x) \\equiv 0 \\pmod{p}$ using LLL/Howgrave-Graham.\n' +
'\\end{itemize}';

function ExplanationTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>
        RSA Reference
      </Typography>
      <Box sx={{
        maxHeight: '60vh', overflow: 'auto', pr: 1, pb: '30vh',
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
      }}>
        <ProofRenderer latex={EXPLANATION_LATEX} />
      </Box>
    </Box>
  );
}

export default function RSACalculator() {
  const [activeTab, setActiveTab] = useState('explanation');

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h3"
            sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <VpnKey sx={{ fontSize: 'inherit' }} /> RSA Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 2 }}>
            RSA encryption, decryption, and key generation reference
          </Typography>

          <CalculatorSubTabs tabs={SUB_TABS} activeTab={activeTab} onChange={setActiveTab} />

          <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pt: 1 }}>
            {activeTab === 'explanation' && <ExplanationTab />}
            {activeTab === 'key-gen' && <RsaKeyGenTab />}
            {activeTab === 'encrypt' && <RsaEncryptTab />}
            {activeTab === 'decrypt' && <RsaDecryptTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
