import { useState, useCallback } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { RsaKeyGenTab } from './RsaKeyGenTab';
import { RsaEncryptTab } from './RsaEncryptTab';
import { RsaDecryptTab } from './RsaDecryptTab';
import { ProofRenderer } from '../ProofRenderer';
import { useAppContext } from '../../hooks/useAppContext';

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
'$m$ is the plaintext as an integer $0 \\leq m < n$ (any residue class mod $n$; $\\gcd(m, n) = 1$ is needed only for decryption via Euler\'s theorem to round-trip through $\\varphi(n)$).\n\n' +
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
'PS is $k-3-|M|$ random non-zero bytes. The leading $\\texttt{0x00}$ ensures the padded message is less than $n$.\n\n' +
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
'\\item \\textbf{Coppersmith:} Partial knowledge of $p$ ($|x| < n^{1/4}$ unknown, see Partial Key Exposure / Partial p/q Bits) or small roots $|x_0| < n^{1/e}$ of $f(x) \\equiv 0 \\pmod{n}$ (see Stereotyped Message) using LLL/Howgrave-Graham. Broadcast $m^e < \\prod n_i$ recovers by CRT integer root (see Hastad\'s Broadcast, Small Public Exponent).\n' +
'\\end{itemize}';

function ExplanationTab() {
  return (
    <Stack direction="vertical" gap={1}>
      <Heading level={4} style={{ color: 'var(--dracula-cyan)' }}>RSA Reference</Heading>
      <Stack direction="vertical">
        <ProofRenderer latex={EXPLANATION_LATEX} />
      </Stack>
    </Stack>
  );
}

export default function RSACalculator() {
  const [activeTab, setActiveTab] = useState('explanation');
  const { setOutputResult, setOutputError, setOutputSource } = useAppContext();

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setOutputResult(null);
    setOutputError(null);
    setOutputSource(null);
  }, [setOutputResult, setOutputError, setOutputSource]);

  return (
    <CalculatorHeader
      title="RSA Calculator"
      subtitle="RSA encryption, decryption, and key generation reference"
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {activeTab === 'explanation' && <ExplanationTab />}
      {activeTab === 'key-gen' && <RsaKeyGenTab />}
      {activeTab === 'encrypt' && <RsaEncryptTab />}
      {activeTab === 'decrypt' && <RsaDecryptTab />}
    </CalculatorHeader>
  );
}
