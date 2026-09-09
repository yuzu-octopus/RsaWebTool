import type { AttackExplanationData } from '../../components/calculator/AttackExplanationPanel';

/** LaTeX proof rendered in the Explanation tab. */
export const AES_PROOF = `\\textbf{AES (Rijndael)}: 128-bit block cipher, 10/12/14 rounds for AES-128/192/256.

\\textbf{Per-round:} SubBytes (S-box), ShiftRows (cyclic shift), MixColumns ($GF(2^8)$), AddRoundKey (XOR).

\\textbf{Mode Comparison:}
$\\begin{array}{ll}
\\text{ECB} & \\text{Each block independent — pattern leaks} \\\\
\\text{CBC} & \\text{CT chain + IV — sequential encrypt, parallel decrypt} \\\\
\\text{CTR} & \\text{Counter + AES = keystream — parallel, no pad} \\\\
\\text{GCM} & \\text{CTR + GHASH — AEAD, 12B nonce typical, len block in GHASH} \\\\
\\text{OFB} & \\text{AES(feedback) — precomputable keystream} \\\\
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
  { value: 'cbc-iv', label: 'CBC Predictable / Duplicate IV' },
  { value: 'stream-bitflip', label: 'CTR/CFB/OFB Bit Flip' },
  { value: 'cbc-keyiv', label: 'CBC Key-as-IV' },
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
    description: 'ECB encrypts identical plaintext blocks to identical ciphertext blocks. Detect passively first: collect ciphertexts and look for repeated 16-byte blocks — no chosen plaintext needed. Actively: encrypt two identical blocks and check whether the ciphertext blocks repeat.',
    whenToUse: 'When you suspect a cipher is using ECB mode. Start with passive traffic (repeated blocks confirm ECB); fall back to feeding repeated identical blocks and observing whether ciphertext blocks repeat.',
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
      'Block-aligned swaps decrypt cleanly (each forged block yields its original plaintext); misaligned cuts garble every touched block',
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
    description: 'When an encryption oracle uses ECB mode, an attacker can recover unknown suffix bytes one at a time. Align the unknown byte to a block boundary by prepending (block_size - 1 - position % block_size) known bytes, then brute-force all 256 possibilities and keep the guess whose target block matches. Preconditions: ECB mode, attacker-controlled prefix, and a secret at a predictable alignment (or a discoverable random prefix — see below).',
    whenToUse: 'An encryption oracle that uses ECB mode and appends a secret. You can submit arbitrary plaintext and observe the ciphertext. If the oracle prepends a random prefix, discover its length first; if the prefix is fixed, align past it.',
    algorithm: [
      'Determine block size by sending increasing-length inputs until ciphertext length jumps',
      'Confirm ECB by checking for repeating blocks',
      'If a random prefix is suspected: find the smallest prefix making two identical blocks collide — that is the alignment point; prefix length follows',
      'For each unknown byte: prepend (block_size - 1 - position % block_size) known bytes so the target byte lands last in its block, brute-force all 256 guesses by matching the target block at block_start',
      'Repeat for all secret bytes (~128 guesses per byte on average)',
    ],
    python: `import requests

BLOCK_SIZE = 16
# Hex I/O contract: the oracle takes hex plaintext in 'plaintext' and returns
# a hex ciphertext. It appends the secret itself — send ONLY your prefix.

def oracle_encrypt(oracle_url: str, prefix: bytes) -> bytes:
    """One oracle query: send prefix only, get full hex ciphertext back."""
    resp = requests.get(oracle_url, params={'plaintext': prefix.hex()})
    return bytes.fromhex(resp.text)

def ecb_byte_at_a_time(oracle_url: str, secret_len: int) -> bytes:
    """Recover the unknown suffix the oracle appends, byte-by-byte."""
    recovered = b''

    for i in range(secret_len):
        pad_len = BLOCK_SIZE - 1 - (i % BLOCK_SIZE)
        prefix = b'A' * pad_len
        block_start = (i // BLOCK_SIZE) * BLOCK_SIZE

        # Target block: prefix aligns secret[i] last in its block
        target = oracle_encrypt(oracle_url, prefix)[block_start:block_start + BLOCK_SIZE]

        # Brute-force all 256 possibilities against the same block
        for guess in range(256):
            test_pt = prefix + recovered + bytes([guess])
            test_ct = oracle_encrypt(oracle_url, test_pt)[block_start:block_start + BLOCK_SIZE]
            if test_ct == target:
                recovered += bytes([guess])
                break
    return recovered

def find_prefix_len(oracle_url: str) -> int:
    """Discover a random-prefix length: slide identical blocks until two
    consecutive ciphertext blocks collide; the shift is the alignment point."""
    for pad in range(BLOCK_SIZE * 2):
        probe = b'A' * (pad + BLOCK_SIZE * 2)
        ct = oracle_encrypt(oracle_url, probe)
        blocks = [ct[i:i+BLOCK_SIZE] for i in range(0, len(ct), BLOCK_SIZE)]
        for j in range(len(blocks) - 1):
            if blocks[j] == blocks[j + 1]:
                return j * BLOCK_SIZE - pad
    raise ValueError('no collision found — oracle may not be ECB')

# Offline equivalent with an embedded secret (no server needed):
# from Crypto.Cipher import AES
# KEY = bytes.fromhex('2b7e151628aed2a6abf7158809cf4f3c')
# SECRET = b'flag{ecb_oracle_demo_123}'
# local = lambda prefix: AES.new(KEY, AES.MODE_ECB).encrypt(prefix + SECRET)
# (pad prefix+secret to 16 bytes first; then run the same loop over local)`,
  },
  'cbc-padding': {
    title: 'CBC Padding Oracle Attack',
    description: 'When a server uses CBC mode with PKCS#7 padding and reveals whether padding is valid, an attacker can decrypt any ciphertext byte-by-byte (~256 requests per byte). Each byte is recovered by mutating only the preceding block (or the IV for block 0 — treat the IV as block −1) and observing the padding response; earlier plaintext never shifts under the attack.',
    whenToUse: 'A server that decrypts CBC ciphertext, checks PKCS#7 padding, and returns different responses for valid vs invalid padding. You need at least one valid ciphertext plus the IV it was encrypted under.',
    algorithm: [
      'Set up the IV + ciphertext blocks (IV is block −1: block 0 is attacked via the IV)',
      'For each block from last to first, for each byte position (15 down to 0):',
      '  Send ONLY the (mutated previous block || target block) pair — never the full chain',
      '  Try all 256 values at the target position, forcing already-cracked tail bytes to the current pad value',
      '  On a valid-padding response: intermediate = guess XOR pad; plaintext byte = intermediate XOR original byte',
      'Move to the previous block (~256 requests per byte, ~4k per block)',
    ],
    python: `import requests

BLOCK_SIZE = 16

def make_oracle(oracle_url: str, status_code: int = 200, match: str = 'VALID'):
    """Explicit oracle contract: the endpoint takes hex 'iv' + 'ct' (ONE pair),
    and answers valid padding with HTTP status_code whose body contains match."""
    def oracle(iv: bytes, ct: bytes) -> bool:
        resp = requests.get(oracle_url,
            params={'iv': iv.hex(), 'ct': ct.hex()})
        return resp.status_code == status_code and match in resp.text
    return oracle

def padding_oracle_decrypt(oracle, iv: bytes, ct: bytes) -> bytes:
    """Decrypt a CBC ciphertext with a padding oracle (~256 req/byte).

    Only the (previous, target) pair is ever sent; the IV stands in as the
    previous block when attacking block 0."""
    blocks = [iv] + [ct[i:i+16] for i in range(0, len(ct), 16)]
    plaintext = b''

    for blk in range(len(blocks) - 1, 0, -1):
        prev, curr = blocks[blk - 1], blocks[blk]
        intermediate = [0] * 16

        for pad in range(1, 17):
            idx = 16 - pad
            for guess in range(256):
                probe = bytearray(prev)
                for j in range(15, idx, -1):
                    probe[j] = intermediate[j] ^ pad
                probe[idx] = guess
                if pad == 1:
                    probe[14] ^= 0x01  # dodge an accidental valid padding
                if oracle(bytes(probe), curr):
                    if pad == 1:
                        confirm = bytearray(probe)
                        confirm[14] ^= 0x03  # second flip: a true 01 stays valid, a 02-02 dies
                        if not oracle(bytes(confirm), curr):
                            continue
                    intermediate[idx] = guess ^ pad
                    break

        block_pt = bytes(intermediate[i] ^ prev[i] for i in range(16))
        plaintext = block_pt + plaintext

    # Strip PKCS#7: last byte N means N bytes of value N
    return plaintext[:-plaintext[-1]]

# Live use:
# oracle = make_oracle('https://target/decrypt', status_code=200, match='VALID')
# print(padding_oracle_decrypt(oracle, bytes.fromhex(IV), bytes.fromhex(CT)))

# Offline equivalent (local boolean oracle, no server needed):
# from Crypto.Cipher import AES
# from Crypto.Util.Padding import unpad
# KEY = bytes.fromhex('2b7e151628aed2a6abf7158809cf4f3c')
# def local(iv: bytes, ct: bytes) -> bool:
#     try:
#         unpad(AES.new(KEY, AES.MODE_CBC, iv).decrypt(ct), 16)
#         return True
#     except ValueError:
#         return False`,
  },
  'gcm-nonce': {
    title: 'GCM Nonce Reuse',
    description: 'When the same nonce is used with the same key in GCM mode, the GHASH authentication key H = AES_K(0) is reused. XORing two ciphertexts gives the XOR of their plaintexts, and the authentication tags can be analyzed to recover H.',
    whenToUse: 'Two ciphertexts encrypted with the same AES-GCM key and nonce. Common in misconfigured implementations or counter reset bugs.',
    algorithm: [
      'Obtain two ciphertexts CT1, CT2 (with TAG1, TAG2 and shared AAD) and known PT1 encrypted with same (key, nonce)',
      'Compute keystream KS = CT1 XOR PT1; decrypt CT2: PT2 = CT2 XOR KS',
      'For single-block CTs: recover H from ΔT = ΔC · H² → H = sqrt(ΔT / ΔC) in GF(2^128)',
      'Recover E(J0) = TAG1 XOR GHASH(H, AAD, CT1); forge any message: TAG = E(J0) XOR GHASH(H, AAD, CT)',
      'Multi-block pairs leave a high-degree equation — no closed-form H; say so instead of forging',
    ],
    python: `def gcm_nonce_reuse(ct1: bytes, pt1: bytes, ct2: bytes) -> bytes:
    """Recover PT2 given two GCM ciphertexts and known PT1.
    Same nonce → same keystream from AES-CTR component."""
    ks = bytes(a ^ b for a, b in zip(pt1, ct1[:len(pt1)]))
    pt2 = bytes(a ^ b for a, b in zip(ct2[:len(ks)], ks))
    return pt2

# --- Full forgery for single-block messages (same nonce + same AAD) ---
R = 0xE1000000000000000000000000000000

def gf_mul(x: int, y: int) -> int:
    """GCM field multiply on 128-bit ints (MSB-first, NIST SP 800-38D 6.3)."""
    z, v = 0, x
    for i in range(128):
        if (y >> (127 - i)) & 1:
            z ^= v
        v = (v >> 1) ^ R if v & 1 else v >> 1
    return z

def ghash(h: int, aad: bytes, ct: bytes) -> int:
    """GHASH(H, AAD, CT) including the length block (NIST SP 800-38D 6.4)."""
    data = aad + b'\\x00' * (-len(aad) % 16) + ct + b'\\x00' * (-len(ct) % 16)
    data += (8 * len(aad)).to_bytes(8, 'big') + (8 * len(ct)).to_bytes(8, 'big')
    x = 0
    for i in range(0, len(data), 16):
        x = gf_mul(x ^ int.from_bytes(data[i:i+16], 'big'), h)
    return x

def gf_pow(a: int, e: int) -> int:
    """Binary-field power by square-and-multiply (field 1 = 0x80...00)."""
    r = 1 << 127
    while e:
        if e & 1:
            r = gf_mul(r, a)
        a = gf_mul(a, a)
        e >>= 1
    return r

def recover_h_single_block(c1: bytes, t1: bytes, c2: bytes, t2: bytes) -> int:
    """H from two single-block (CT, TAG) pairs: dT = dC.H^2, so H = sqrt(dT/dC)."""
    assert len(c1) == len(c2) == len(t1) == len(t2) == 16 and c1 != c2
    dc = int.from_bytes(c1, 'big') ^ int.from_bytes(c2, 'big')
    dt = int.from_bytes(t1, 'big') ^ int.from_bytes(t2, 'big')
    return gf_pow(gf_mul(dt, gf_pow(dc, (1 << 128) - 2)), 1 << 127)

# ct1 = bytes.fromhex("...")  # First ciphertext (raw CT, tag split off)
# pt1 = bytes.fromhex("...")  # Known plaintext for ct1
# ct2 = bytes.fromhex("...")  # Second ciphertext
# pt2 = gcm_nonce_reuse(ct1, pt1, ct2)
# print(f"Recovered PT2: {pt2}")
#
# H = recover_h_single_block(ct1, tag1, ct2, tag2)
# e_j0 = int.from_bytes(tag1, 'big') ^ ghash(H, aad, ct1)
# forged = (e_j0 ^ ghash(H, aad, target_ct)).to_bytes(16, 'big')`,
  },
  'key-schedule': {
    title: 'AES Key Schedule Inversion',
    description: 'The AES-128 key schedule is invertible from the last round key. If you can recover any round key (e.g., via side-channel attack on the last round), you can reverse the key schedule to recover the original master key.',
    whenToUse: 'When you have recovered the AES-128 last round key from a side-channel attack (timing, power analysis, cache attacks). AES-128 only — AES-192/256 need different inverses.',
    algorithm: [
      'Obtain the last round key (4 words n0..n3 for AES-128)',
      'Per round i = 10..1: p3 = n3^n2, p2 = n2^n1, p1 = n1^n0 (from the round words first)',
      'Then p0 = n0 ^ SubWord(RotWord(p3)) ^ RCon[i] — p0 comes last, it needs p3',
      'Re-expand the master key and check its last round equals the input (round-trip)',
    ],
    python: `def invert_key_schedule(round_key_hex):
    """Invert the AES-128 key schedule: last round key -> master key."""
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

    def xor(a: bytes, b: bytes) -> bytes:
        return bytes(x ^ y for x, y in zip(a, b))

    rk = bytes.fromhex(round_key_hex)
    assert len(rk) == 16, 'AES-128 only: need a 16-byte last round key'
    n0, n1, n2, n3 = (rk[i:i+4] for i in range(0, 16, 4))

    for i in range(10, 0, -1):
        # p3/p2/p1 derive from the round-n words — recover them BEFORE p0.
        p3 = xor(n3, n2)
        p2 = xor(n2, n1)
        p1 = xor(n1, n0)
        p0 = xor(n0, sub_word(rot_word(p3)))
        p0 = bytes([p0[0] ^ rcon[i-1]]) + p0[1:]
        n0, n1, n2, n3 = p0, p1, p2, p3

    master_key = b''.join([n0, n1, n2, n3])
    # Round-trip check: re-expanding master_key must end at round_key_hex.
    return master_key.hex()

# Example (FIPS-197 Appendix A.1 / B):
# round_key = "d014f9a8c9ee2589e13f0cc8b6630ca6"  # last round key of below master
# master = invert_key_schedule(round_key)
# assert master == "2b7e151628aed2a6abf7158809cf4f3c"
# print(f"Master key: {master}")`,
  },
  'cbc-iv': {
    title: 'CBC Predictable / Duplicate IV',
    description: 'CBC is only IND-CPA secure with an unpredictable IV. A duplicate IV leaks equality: equal first ciphertext blocks mean equal first plaintext blocks under the same key. A predictable IV is worse (BEAST): an attacker who can make the victim encrypt chosen plaintext shifts the target byte to a block boundary and guesses it byte-by-byte against the predictable next IV.',
    whenToUse: 'TLS 1.0-style chained IVs, counters, timestamps, or a fixed IV reused across messages. Collect ciphertexts sharing one IV, or predict the next IV while choosing plaintext.',
    algorithm: [
      'Duplicate IV: group messages by IV; equal C1 blocks imply equal P1 blocks (equality oracle)',
      'Predictable IV (BEAST): predict IV_next, choose P so the secret byte lands last in a block',
      'Guess the byte: C_guess = E(P_guess XOR IV_next) must equal the observed block — 256 tries per byte',
      'Slide the window and repeat; each cracked byte anchors the next alignment',
    ],
    python: `from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

KEY = bytes.fromhex('2b7e151628aed2a6abf7158809cf4f3c')

def enc(iv: bytes, pt: bytes) -> bytes:
    """Our own CBC primitive for the demo (never reuse an IV like this)."""
    return AES.new(KEY, AES.MODE_CBC, iv).encrypt(pad(pt, 16))

# Duplicate IV leaks equality: same IV + same P1 -> identical C1.
IV = bytes.fromhex('00' * 16)
c1 = enc(IV, b'admin=false!!!!!!')
c2 = enc(IV, b'admin=false!!!!!!')
c3 = enc(IV, b'admin=true!!!!!!!!')
assert c1[:16] == c2[:16] and c1[:16] != c3[:16]
print('equal C1 <=> equal P1 under a duplicate IV')

# BEAST sketch (predictable IV = previous CT block): attacker predicts IV_next,
# aligns the secret byte last in a block, and brute-forces it in 256 tries.
# for guess in range(256):
#     if enc(iv_next, prefix + bytes([guess]))[:16] == observed[:16]:
#         secret_byte = guess; break`,
  },
  'stream-bitflip': {
    title: 'CTR/CFB/OFB Stream Bit-Flipping',
    description: 'CTR, CFB, and OFB all turn AES into a keystream XORed with the message, so flipping a ciphertext bit flips the same plaintext bit — with no error propagation to neighbours. Given any known-plaintext window, recover the keystream (KS = PT XOR CT) and rewrite that window to anything: forged = CT XOR current XOR target.',
    whenToUse: 'Any CTR/CFB/OFB ciphertext where you know (or can guess) part of the plaintext — cookies, roles, amounts — and can resubmit the ciphertext.',
    algorithm: [
      'Locate the target field at byte offset k in the plaintext',
      'Recover the window keystream: KS = current_plaintext XOR CT[k:k+n]',
      'Forge: CT\'[k:k+n] = CT[k:k+n] XOR current XOR target (same math for CTR, CFB, OFB)',
      'Splice and resubmit — only the targeted window changes on decrypt',
    ],
    python: `def recover_keystream(known_pt: bytes, ct: bytes) -> bytes:
    """KS = PT XOR CT over the shared window (works for CTR, CFB, OFB)."""
    return bytes(a ^ b for a, b in zip(known_pt, ct))

def stream_bitflip(ct: bytes, offset: int, current: bytes, target: bytes) -> bytes:
    """Rewrite ct[offset:offset+len] to decrypt as target."""
    assert len(current) == len(target), 'window lengths must match'
    forged = bytearray(ct)
    for i in range(len(target)):
        forged[offset + i] ^= current[i] ^ target[i]
    return bytes(forged)

# ct = bytes.fromhex("...")  # CTR/CFB/OFB ciphertext
# forged = stream_bitflip(ct, 6, b'user=false', b'user=true!')
# (No padding involved: stream modes never pad, so any length works.)`,
  },
  'cbc-keyiv': {
    title: 'CBC Key-as-IV',
    description: 'Using the key as the CBC IV turns the first block into P1 = D_K(C1) XOR K. With a known first plaintext block P1, one decryption-oracle query under a zero IV reveals D_K(C1), and the key falls out: K = D_K(C1) XOR P1. Never let key material appear on the wire as an IV.',
    whenToUse: 'Implementations that set IV = key (embedded devices, home-grown protocols) where you know the first plaintext block and can get one ciphertext decrypted under a chosen (zero) IV.',
    algorithm: [
      'Capture C1 and its known plaintext P1 (so D_K(C1) = P1 XOR K is one XOR from the key)',
      'Ask the decryption oracle with IV = 0: P_zero = D_K(C1) — the raw block decryption',
      'Recover K = P_zero XOR P1 and verify by re-encrypting P1 under IV = K',
      'Unknown bytes elsewhere? Drag cribs through a PT-XOR-PT stream with the English scorer',
    ],
    python: `from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

def recover_key_as_iv(p1: bytes, d_c1: bytes) -> bytes:
    """K = D_K(C1) XOR P1. d_c1 comes from one zero-IV oracle query."""
    assert len(p1) == len(d_c1) == 16
    return bytes(a ^ b for a, b in zip(p1, d_c1))

# Demo with our own CBC primitive (key hidden from the "attacker" half):
# KEY = AES.get_random_bytes(16); P1 = b'known-plaintext!'
# C1 = AES.new(KEY, AES.MODE_CBC, KEY).encrypt(pad(P1, 16))[:16]
# d_c1 = AES.new(KEY, AES.MODE_ECB).decrypt(C1)          # zero-IV oracle query
# assert recover_key_as_iv(P1, d_c1) == KEY               # key recovered
# assert AES.new(KEY, AES.MODE_CBC, KEY).encrypt(pad(P1, 16))[:16] == C1`,
  },
};
