import type { AttackExplanationData } from '../../components/calculator/AttackExplanationPanel';

/** LaTeX proof rendered in the Explanation tab. */
export const AES_PROOF = `\\textbf{AES (Rijndael)}: 128-bit block cipher, 10/12/14 rounds for AES-128/192/256.

\\textbf{Per-round:} SubBytes (S-box), ShiftRows (cyclic shift), MixColumns ($GF(2^8)$), AddRoundKey (XOR).

\\textbf{Mode Comparison:}
$\\begin{array}{ll}
\\text{ECB} & \\text{Each block independent — pattern leaks} \\\\
\\text{CBC} & \\text{CT chain + IV — parallel decrypt only} \\\\
\\text{CTR} & \\text{Counter + AES = keystream — parallel, no pad} \\\\
\\text{GCM} & \\text{CTR + GHASH — AEAD, unique nonce} \\\\
\\text{OFB} & \\text{AES(feedback) — precomputable} \\\\
\\text{CFB} & \\text{AES(prev CT) — self-synchronising}
\\end{array}$

\\textbf{PKCS#7}: Fill remaining bytes with N where N = pad count. Verify on decrypt.

\\textbf{GCM}: AES-CTR + GHASH over $GF(2^{128})$. Tag = GHASH(AAD, CT) $\\oplus$ AES(key, nonce||1).

\\textbf{Attacks:} ECB block reordering / byte-at-a-time oracle; CBC bit flip / padding oracle; CTR/GCM nonce reuse $\\rightarrow$ total break; AES-128 key schedule inversion (last round key $\\rightarrow$ original key).`;

/** AES block-cipher modes supported by the encrypt/decrypt tab. */
export const AES_MODES = ['ECB', 'CBC', 'CTR', 'GCM', 'OFB', 'CFB'] as const;

/** Supported input/output encodings. */
export const ENCODINGS = [
  { value: 'text', label: 'Text' },
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
] as const;

/** AES-specific attack options. */
export const AES_ATTACKS = [
  { value: 'ctr-nonce', label: 'CTR Nonce Reuse' },
  { value: 'cbc-bitflip', label: 'CBC Bit Flipping' },
  { value: 'ecb-detect', label: 'ECB Mode Detector' },
  { value: 'ecb-cutpaste', label: 'ECB Cut-and-Paste' },
  { value: 'ecb-byte', label: 'ECB Byte-at-a-Time (oracle)' },
  { value: 'cbc-padding', label: 'CBC Padding Oracle' },
  { value: 'gcm-nonce', label: 'GCM Nonce Reuse Simplified' },
  { value: 'key-schedule', label: 'AES Key Schedule Inversion' },
] as const;

/** Per-attack educational content shown above the input form. */
export const AES_ATTACK_EXPLANATIONS: Record<string, AttackExplanationData> = {
  'ctr-nonce': {
    title: 'CTR Nonce Reuse',
    description: 'When the same nonce is used twice with the same key in CTR mode, the keystream is identical. XORing two ciphertexts encrypted with the same (key, nonce) gives the XOR of their plaintexts — keystream = PT1 XOR CT1 = PT2 XOR CT2.',
    whenToUse: 'Two or more ciphertexts encrypted with the same CTR nonce. Common in servers with a fixed nonce, counter reset bugs, or static IVs in CTR mode.',
    algorithm: [
      'Identify two ciphertexts CT1, CT2 encrypted with the same key and nonce',
      'If you know the plaintext PT1 corresponding to CT1, compute keystream = PT1 XOR CT1[:len(PT1)]',
      'Decrypt CT2: PT2 = CT2[:len(keystream)] XOR keystream',
      'Without known plaintext: CT1 XOR CT2 = PT1 XOR PT2 — use crib-dragging to recover both',
    ],
    python: `from Crypto.Cipher import AES

def recover_ctr(c1: bytes, c2: bytes, known_pt1: bytes) -> bytes:
    """Recover PT2 given two CTR ciphertexts and known PT1"""
    ks = bytes(a ^ b for a, b in zip(known_pt1, c1))
    pt2 = bytes(a ^ b for a, b in zip(c2[:len(ks)], ks))
    return pt2

# Example:
# c1 = bytes.fromhex("...")  # CT1 hex
# c2 = bytes.fromhex("...")  # CT2 hex
# pt1 = bytes.fromhex("...") # Known PT1 hex
# pt2 = recover_ctr(c1, c2, pt1)
# print(f"Recovered PT2: {pt2}")`,
  },
  'cbc-bitflip': {
    title: 'CBC Bit Flipping',
    description: 'In CBC mode, modifying a ciphertext block C[i] changes the corresponding plaintext block P[i+1] (via XOR in the CBC decryption chain). The previous plaintext P[i] becomes garbled, but the attacker can choose P[i+1] to any desired value by computing: C\'[i] = C[i] XOR P_original[i+1] XOR P_target[i+1].',
    whenToUse: 'When you can modify ciphertext blocks and observe the decrypted result. Common in cookie tampering, privilege escalation, and format manipulation.',
    algorithm: [
      'Identify the ciphertext block C[i] preceding the target block',
      'Determine the current plaintext P[i+1] at the target position',
      'Compute C\'[i] = C[i] XOR P[i+1] XOR P_target',
      'Submit modified ciphertext — P[i] will be garbled but P[i+1] becomes P_target',
    ],
    python: `def cbc_bitflip(ct_block: bytes, current_pt: bytes, target: bytes) -> bytes:
    """Compute modified ciphertext block for CBC bit flip.

    Modify ct_block (the block BEFORE the target) so that
    target decrypts to the desired plaintext.
    """
    n = min(len(ct_block), len(current_pt), len(target))
    return bytes(ct_block[i] ^ current_pt[i] ^ target[i] for i in range(n))

# For block index 1+: modify CT[idx-1]
# For block index 0: modify IV
# modified = cbc_bitflip(ct_block, current_plain, desired_plain)`,
  },
  'ecb-detect': {
    title: 'ECB Mode Detector',
    description: 'ECB encrypts identical plaintext blocks to identical ciphertext blocks. To detect: encrypt the same block twice and check if the ciphertexts match. If they do, the cipher is in ECB mode.',
    whenToUse: 'When you suspect a cipher is using ECB mode. Feed repeated identical blocks and observe whether ciphertext blocks repeat.',
    algorithm: [
      'Encrypt a plaintext containing at least two identical 16-byte blocks',
      'Check if any ciphertext blocks repeat',
      'If repeats found: ECB mode confirmed',
      'If no repeats: likely CBC, CTR, or another mode',
    ],
    python: `from Crypto.Cipher import AES

def detect_ecb(cts: list[bytes]) -> tuple[bool, int]:
    """Detect ECB mode by checking for repeating 16-byte blocks.
    Returns (is_ecb, ciphertext_index)."""
    for i, ct in enumerate(cts):
        seen = set()
        for j in range(0, len(ct), 16):
            block = ct[j:j+16]
            if block in seen:
                return True, i
            seen.add(block)
    return False, -1

# cts = [bytes.fromhex(line) for line in ciphertexts.splitlines()]
# is_ecb, idx = detect_ecb(cts)`,
  },
  'ecb-cutpaste': {
    title: 'ECB Cut-and-Paste',
    description: 'ECB mode encrypts each block independently. This means ciphertext blocks can be rearranged without detection — the decryption will still succeed but produce a different (forged) plaintext. This allows block-level manipulation.',
    whenToUse: 'When you have an ECB ciphertext and want to rearrange blocks to forge a different plaintext. Common in cookie/token manipulation.',
    algorithm: [
      'Split the ciphertext into 16-byte blocks',
      'Rearrange blocks to construct the desired plaintext pattern',
      'Submit the rearranged ciphertext',
      'The server decrypts to the forged plaintext (P[i] is garbled at block boundaries)',
    ],
    python: `def ecb_cutpaste(ct: bytes, order: list[int]) -> bytes:
    """Rearrange ECB ciphertext blocks to forge a new plaintext.

    Args:
        ct: Original ciphertext (must be multiple of 16 bytes)
        order: Desired block indices in new order
    Returns:
        Forged ciphertext
    """
    blocks = [ct[i:i+16] for i in range(0, len(ct), 16)]
    return b''.join(blocks[i] for i in order)

# Example: swap blocks 0 and 2
# forged = ecb_cutpaste(ct, [2, 1, 0, 3])`,
  },
  'ecb-byte': {
    title: 'ECB Byte-at-a-Time (Oracle Attack)',
    description: 'When an encryption oracle uses ECB mode, an attacker can recover unknown suffix bytes one at a time. By prepending known bytes and observing which ciphertext block changes, the unknown byte is deduced by brute-forcing all 256 possibilities.',
    whenToUse: 'An encryption oracle that uses ECB mode and appends a secret. You can submit arbitrary plaintext and observe the ciphertext.',
    algorithm: [
      'Determine block size by sending increasing-length inputs until ciphertext length jumps',
      'Confirm ECB by checking for repeating blocks',
      'For each unknown byte: prepend (block_size - 1 - position % block_size) known bytes, brute-force the 256th byte by matching the target block',
      'Repeat for all secret bytes',
    ],
    python: `import requests

BLOCK_SIZE = 16

def ecb_byte_at_a_time(oracle_url: str, unknown_suffix: bytes) -> bytes:
    """Recover unknown suffix encrypted with ECB byte-by-byte."""
    recovered = b''

    for i in range(len(unknown_suffix)):
        pad_len = BLOCK_SIZE - 1 - (i % BLOCK_SIZE)
        prefix = b'A' * pad_len
        block_start = (i // BLOCK_SIZE) * BLOCK_SIZE

        # Get target block
        resp = requests.get(oracle_url,
            params={'plaintext': (prefix + unknown_suffix).hex()})
        target = bytes.fromhex(resp.text)[block_start:block_start + BLOCK_SIZE]

        # Brute-force the unknown byte
        for guess in range(256):
            test_pt = prefix + recovered + bytes([guess])
            resp = requests.get(oracle_url,
                params={'plaintext': test_pt.hex()})
            test_ct = bytes.fromhex(resp.text)[:BLOCK_SIZE]
            if test_ct == target:
                recovered += bytes([guess])
                break
    return recovered`,
  },
  'cbc-padding': {
    title: 'CBC Padding Oracle Attack',
    description: 'When a server uses CBC mode with PKCS#7 padding and reveals whether padding is valid, an attacker can decrypt any ciphertext byte-by-byte. Each byte is recovered by modifying the preceding ciphertext block and observing the padding validation response.',
    whenToUse: 'A server that decrypts CBC ciphertext, checks PKCS#7 padding, and returns different responses for valid vs invalid padding. You need at least one valid ciphertext.',
    algorithm: [
      'Set up the IV + ciphertext blocks',
      'For each byte position (15 down to 0 in each block):',
      '  Modify the preceding block byte to try each value 0-255',
      '  Send the modified ciphertext to the oracle',
      '  If valid padding response: the intermediate value is XOR-derived',
      '  Apply XOR with original byte to get plaintext',
      'Move to next block',
    ],
    python: `import requests

def padding_oracle_decrypt(oracle_url: str, ct_hex: str) -> bytes:
    """Decrypt a CBC ciphertext using a padding oracle."""
    ct = bytes.fromhex(ct_hex)
    blocks = [ct[i:i+16] for i in range(0, len(ct), 16)]
    plaintext = b''

    for blk_idx in range(len(blocks) - 1, 0, -1):
        prev = bytearray(blocks[blk_idx - 1])
        curr = blocks[blk_idx]
        intermediate = [0] * 16

        for pad in range(1, 17):
            for guess in range(256):
                test_prev = prev[:]
                # Set the byte being guessed
                test_prev[-pad] = guess
                # Set earlier bytes for valid PKCS#7 padding
                for j in range(1, pad):
                    test_prev[-j] = intermediate[-j] ^ pad

                resp = requests.get(oracle_url,
                    params={'ct': (bytes(test_prev) + curr).hex()})
                if 'VALID' in resp.text or 'padding' not in resp.text.lower():
                    intermediate[-pad] = guess ^ pad
                    break

        block_pt = bytes(intermediate[i] ^ prev[i] for i in range(16))
        plaintext = block_pt + plaintext

    return plaintext`,
  },
  'gcm-nonce': {
    title: 'GCM Nonce Reuse',
    description: 'When the same nonce is used with the same key in GCM mode, the GHASH authentication key H = AES_K(0) is reused. XORing two ciphertexts gives the XOR of their plaintexts, and the authentication tags can be analyzed to recover H.',
    whenToUse: 'Two ciphertexts encrypted with the same AES-GCM key and nonce. Common in misconfigured implementations or counter reset bugs.',
    algorithm: [
      'Obtain two ciphertexts CT1, CT2 and known PT1 encrypted with same (key, nonce)',
      'Compute keystream KS = CT1 XOR PT1',
      'Decrypt CT2: PT2 = CT2 XOR KS',
      'The GHASH key H = AES_K(0) is the same — use to forge tags',
    ],
    python: `def gcm_nonce_reuse(ct1: bytes, pt1: bytes, ct2: bytes) -> bytes:
    """Recover PT2 given two GCM ciphertexts and known PT1.
    Same nonce → same keystream from AES-CTR component."""
    ks = bytes(a ^ b for a, b in zip(pt1, ct1[:len(pt1)]))
    pt2 = bytes(a ^ b for a, b in zip(ct2[:len(ks)], ks))
    return pt2

# ct1 = bytes.fromhex("...")  # First ciphertext
# pt1 = bytes.fromhex("...")  # Known plaintext for ct1
# ct2 = bytes.fromhex("...")  # Second ciphertext
# pt2 = gcm_nonce_reuse(ct1, pt1, ct2)
# print(f"Recovered PT2: {pt2}")
#
# The GHASH key H = AES_K(0) is also shared —
# recover H to forge valid authentication tags.`,
  },
  'key-schedule': {
    title: 'AES Key Schedule Inversion',
    description: 'The AES-128 key schedule is invertible from the last round key. If you can recover any round key (e.g., via side-channel attack on the last round), you can reverse the key schedule to recover the original master key.',
    whenToUse: 'When you have recovered a round key from a side-channel attack (timing, power analysis, cache attacks). Works for AES-128, AES-192, AES-256.',
    algorithm: [
      'Obtain the last round key (4 words for AES-128)',
      'Apply inverse key schedule: undo SubBytes, XOR with previous round key',
      'Iterate backward through all rounds',
      'Recover the original master key',
    ],
    python: `from Crypto.Cipher import AES

def invert_key_schedule(round_key_hex):
    """Invert AES-128 key schedule from last round key to master key."""
    rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]

    def sub_word(w):
        sbox = [
            0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
            0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
            0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
            0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
            0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
            0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
            0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
            0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
            0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
            0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
            0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
            0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
            0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
            0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
            0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
            0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
        ]
        return bytes([sbox[b] for b in w])

    def rot_word(w):
        return w[1:] + w[:1]

    rk = bytes.fromhex(round_key_hex)
    w = [rk[i:i+4] for i in range(0, 16, 4)]

    for i in range(10, 0, -1):
        w[0] = bytes(a ^ b for a, b in zip(w[0], sub_word(rot_word(w[3]))))
        w[0] = bytes([w[0][0] ^ rcon[i-1]] + list(w[0][1:]))
        for j in range(1, 4):
            w[j] = bytes(a ^ b for a, b in zip(w[j], w[j-1]))

    master_key = b''.join(w)
    return master_key.hex()

# Example:
# round_key = "2b7e151628aed2a6abf7158809cf4f3c"  # AES-128 last round key
# master = invert_key_schedule(round_key)
# cipher = AES.new(bytes.fromhex(master), AES.MODE_ECB)
# print(f"Master key: {master}")`,
  },
};
