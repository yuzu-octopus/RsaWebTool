# RSA Web Tool

A browser-only RSA CTF (Capture The Flag) tool with 47 cryptographic attacks across 5 categories, plus 4 built-in calculators.

**Live at:** [yuzu-octopus.github.io/RsaWebTool](https://yuzu-octopus.github.io/RsaWebTool/)

No server needed — everything runs in your browser via JavaScript BigInt and embedded SageMathCell for math-heavy computation.

## Features

### Cryptographic Attacks

- **47 attacks** — Factorization (19), Lattice/Partial Key (11), Message/Protocol (9), Oracle (4), and Advanced (4) categories
- **31 browser-side checks** — instant results via native BigInt (no SageCell needed), with live progress bars showing iteration variable + count on longer-running attacks
- **3 concurrent Web Workers** — parallel frontendCheck execution across attacks
- **SageMathCell integration** — 3 concurrent slots with 30s stall detection and immediate error element reporting
- **FactorDB lookup** — auto-queries FactorDB and auto-submits discovered factorizations
- **Magic Panel** — paste all RSA parameters at once, auto-detect applicable attacks, parallel execution (3 concurrent) with early-stop on first true success
- **Console Environment** — `window.env` exposes all config (workers, timeouts, FactorDB proxy) with localStorage persistence; `env.reset()` clears all stored state

### Built-in Calculators

- 🔢 **RSA Calculator** — Key Generation, Encryption, Decryption (pure BigInt) with Explanation tab. e defaults to 65537; Decrypt auto-derives missing parameters from any 2 of (p, q, n)
- 🔒 **AES Calculator** — Encrypt/Decrypt via Web Crypto API (@noble/ciphers) in ECB/CBC/CTR/GCM/OFB/CFB modes with explanation tab. 8 attack modes: CTR nonce reuse, CBC bit-flipping, ECB mode detection, ECB cut-and-paste, ECB byte-at-a-time oracle, CBC padding oracle, GCM nonce reuse, AES-128 key schedule inversion
- 📐 **ECC Calculator** — Key generation, public-from-private, ECDH shared secret, ECDSA sign/verify via @noble/curves (secp256k1, P-256, P-384, P-521, Curve25519). 7 attack modes: ECDSA nonce reuse, point validation checker, biased nonce LLL, invalid curve attack, MOV embedding degree, Smart's anomalous attack, singular curve attack
- 🔏 **Hash Calculator** — 11 hash algorithms (SHA-256/384/512, MD5, SHA-1, BLAKE2b, BLAKE2s, BLAKE3, SHA-3-256/512, Keccak-256/512), HMAC, Proof of Work with Web Worker support, Length Extension attack, Format Converter (hex/decimal/base64/text)

### Interface

- **Format Converter** — live Hex / Decimal / Base64 / Text conversion
- **Attack Index** — searchable catalog of all 47 attack proofs with KaTeX rendering
- **METHOD indicator** — every output shows `METHOD=TYPESCRIPT` or `METHOD=SAGEMATHCELL`
- **Standardized output format** — all 47 attacks produce consistent `Attack Name → Inputs → Results → Verification → TOKEN → METHOD` output
- **Command Palette** — ⌘/Ctrl+K fuzzy search across all 47 attacks + calculators + views
- **Keyboard Shortcuts** — ⌘Enter (run), ⌘1/2/3/4/5/6 (tabs / calculator sub-tabs), ⌘Shift+C (copy), Tab/Shift+Tab (cycle attacks)
- **PEM Decryptor** — Parse and decrypt PKCS#1/PKCS#8/encrypted PEM keys, feed params to Calculator or Attacks
- **Instructions** — Reference guide for using the tool
- **Console Configuration** — `env` object exposed on `window` for runtime config (proxy URL, worker pool, timeouts). Persisted to localStorage, `env.reset()` clears all stored data.
- **Dracula theme** — dark, developer-friendly UI
- **Prismjs syntax highlighting** — replaces react-syntax-highlighter, 33% smaller bundle
- **Notepad** — drag-resizeable scratchpad with localStorage persistence

## Quick Start

```bash
bun install
bun run dev      # dev server at localhost:5173
```

Open `http://localhost:5173` in your browser.

## Attack Catalog

### Factorization (19)
| Attack | Description | Frontend |
|--------|-------------|----------|
| batch-gcd | GCD across comma-separated moduli | ✓ |
| binary-poly-factor | Binary polynomial factorization | — |
| boneh-durfee | Boneh-Durfee lattice for small d | — |
| close-prime | Fermat factorization (\|p-q\| small) | ✓ |
| common-prime-rsa | GCD chain across multiple moduli | ✓ |
| ecm2 | ECM factorization (elliptic curve method) | — |
| euler | Euler factorization via two sum-of-squares | ✓ |
| gimmicky-primes | Trial division against 8 prime families | ✓ |
| multi-prime | Multi-prime RSA factorization | — |
| multi-prime-gcd | GCD across multi-prime setups | ✓ |
| novelty-primes | Window search near powers of 2 and constants | ✓ |
| pisano-period | Period detection via 2^i mod n | ✓ |
| pollard-p1 | Pollard's p-1 factorization | ✓ |
| pollard-rho | Brent's cycle detection with batched GCD | ✓ |
| pollard-strassen | Pollard-Strassen algorithm | — |
| quadratic-sieve | Quadratic sieve | — |
| small-fraction | Continued fraction attack on e/n | ✓ |
| squfof | SQUFOF algorithm | — |
| williams-p1 | Williams' p+1 factorization | — |

### Partial Key / Lattice (11)
| Attack | Description | Frontend |
|--------|-------------|----------|
| coppersmith-short-pad | Integer e-th root recovery of short-padded messages | ✓ |
| dependent-prime | GCD-based recovery from related primes | ✓ |
| dp-dq-leak | Decrypt from leaked dp + dq | ✓ |
| implicit-key-exposure | Lattice GCD across related keys | ✓ |
| linearly-related-primes | GCD across linearly related primes | ✓ |
| partial-d | Decrypt from leaked private exponent d | ✓ |
| partial-key-exposure | Partial key exposure attack | — |
| partial-pq-bits | Coppersmith lattice from partial p/q bits | — |
| phi-leak | Decrypt from leaked φ(n) | ✓ |
| simple-lattice | Simple lattice attack | — |
| small-crt-exp | Recover p via n % pCandidate from small CRT exponent | ✓ |

### Message / Protocol (9)
| Attack | Description | Frontend |
|--------|-------------|----------|
| bleichenbacher-sig | Bleichenbacher signature forgery | — |
| common-modulus | Extended GCD + Bezout recovery | ✓ |
| related-message | Related message recovery (e=3) | ✓ |
| hastad-broadcast | CRT recovery from e identical ciphertexts | ✓ |
| hastad-linear-pad | Hastad's broadcast with linear padding | — |
| homomorphic-forgery | RSA multiplicative homomorphism signature forge | ✓ |
| known-plaintext | Integer e-th root + known-prefix brute-force | ✓ |
| non-coprime-exp | Attack when e and φ(n) share a factor | — |
| rsa-crt-fault | Recover p from faulty CRT signature | ✓ |

### Oracle (4)
| Attack | Description | Frontend |
|--------|-------------|----------|
| biased-lsb | Majority-vote LSB oracle + binary fraction recovery | ✓ |
| bleichenbacher | Full PKCS#1 v1.5 padding oracle (interval narrowing) | ✓ |
| lsb-oracle | Binary fraction recovery of m from LSB oracle | ✓ |
| manger | Manger oracle attack | ✓ |

### Advanced (4)
| Attack | Description | Frontend |
|--------|-------------|----------|
| factordb-lookup | Fetch factorization from FactorDB API | ✓ |
| nitros | NITROS attack (dynamic M selection, M > n^(1/4), any key size) | — |
| roca | ROCA vulnerability (CVE-2017-15361) | — |
| small-public-exp | Small public exponent attack (modular pre-filter, warm-start Newton) | ✓ |

## Usage

### Input Panel
Select an attack from the sidebar. The Input Panel shows:
- **Explanation tab** — KaTeX-rendered proof of how the attack works
- **Input tab** — form fields for RSA parameters. Fill in values (manually or via "Generate Testcase") and click **Run**.

### Magic Panel
Click the wand icon in the sidebar. Paste all known RSA parameters — the tool auto-detects values via regex, shows which attacks apply, and runs them all in parallel (up to 3 at a time) via Web Workers and SageCell slots. Stops at first success.

### Progress Bars
Iterative frontendCheck attacks (close-prime, euler, pollard-p1, small-crt-exp, dependent-prime, etc.) show a determinate progress bar with live iteration variable and count below the Run button. Works through both Web Workers and main-thread fallback.

### Output Panel
Results appear in the Output Panel on the right. Features:
- Syntax-highlighted output
- Copy button
- Clickable history (last 50 results)
- Resizable notepad (drag from bottom)

### Attack Output Format
Every attack produces a standardized output:

```
Attack Name
n = [value]
e = [value]

Results:
p = [value]
q = [value]

Verification: p * q = [product]

TOKEN=SUCCESS
METHOD=TYPESCRIPT
```

The `METHOD=` line indicates whether the result came from the browser (`TYPESCRIPT`) or SageMathCell (`SAGEMATHCELL`). Tokens: `=SUCCESS` (fully recovered), `=RESULT` (FactorDB query returned non-FF status), `=FAILED` (attack did not recover).

### RSA Calculator
Standalone BigInt operations: key generation, encryption, and decryption. Smart defaults: `e` defaults to 65537 in Key Gen and Encrypt when left empty. Decrypt accepts any 2 of (p, q, n) and auto-derives the third. Includes an Explanation tab for RSA theory reference.

### AES Calculator
Encrypt/Decrypt in 6 modes (ECB, CBC, CTR, GCM, OFB, CFB) via @noble/ciphers Web Crypto API. Supports hex, base64, and text input encoding. AAD for GCM mode. 8 attack modes: CTR nonce reuse (keystream recovery), CBC bit-flipping (plaintext manipulation), ECB mode detector (block dedup), ECB cut-and-paste (block reordering), ECB byte-at-a-time oracle, CBC padding oracle, GCM nonce reuse (keystream + tag forgery), AES-128 key schedule inversion (last round key → original key).

### ECC Calculator
Curve operations via @noble/curves: key generation (compressed/uncompressed), public key from private, ECDH shared secret with secp256k1, P-256, P-384, P-521, and Curve25519. ECDSA sign/verify. 7 attack modes (some via SageMathCell): ECDSA nonce reuse, point validation checker, biased nonce LLL, invalid curve attack, MOV embedding degree, Smart's anomalous curve attack, singular curve attack.

### Hash Calculator
Pure JS hash computation (no SageCell needed). 11 algorithms: SHA-256/384/512, MD5, SHA-1, BLAKE2b, BLAKE2s, BLAKE3, SHA-3-256/512, Keccak-256/512. HMAC with any algorithm. Proof of Work with user-defined conditions (prefix + difficulty), Web Worker offload, EWMA ETA. Length Extension attack demonstration. Format Converter between hex, decimal, base64, and text.

### Format Converter
Live conversion between hex, decimal, base64, and text.

### Command Palette
Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open. Fuzzy-search across all attacks, calculators, and views. Arrow keys to navigate, Enter to select.

### PEM Decryptor
Paste a PEM private key (PKCS#1, PKCS#8, or encrypted). The tool parses the key, extracts n/e/d/p/q parameters, and offers "Feed to Calculator" or "Feed to Attacks" buttons. Supports passphrase-protected keys via Web Crypto API.

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| ⌘/Ctrl+K | Open command palette |
| ⌘/Ctrl+Enter | Run current attack |
| ⌘/Ctrl+1/2/3 | Switch Explanation/Input/Source tabs (attack mode), or RSA/AES/ECC/Hash calculator tabs (calculator mode) |
| ⌘/Ctrl+4/5/6 | Switch calculator sub-tabs for AES/ECC/Hash (only in calculator mode) |
| ⌘/Ctrl+Shift+C | Copy output |
| Tab/Shift+Tab | Cycle through sidebar items |

### Console Configuration

All runtime settings are accessible via the `env` object in the browser console. Settings persist to localStorage across page loads.

```js
env.workerPoolSize       // 3
env.workerPoolSize = 5   // persisted, takes effect on next page load
env.DOCS                 // descriptions of all properties
env.reset()              // clears ALL localStorage + reloads
```

| Property | Default | Description |
|----------|---------|-------------|
| `factordbProxyUrl` | `"...octopusyuzu.workers.dev"` | FactorDB CORS proxy URL |
| `workerPoolSize` | `3` | Web Worker pool size for frontendCheck |
| `sagecellSlots` | `3` | Max concurrent SageCell executions |
| `sagecellTimeout` | `120` | SageCell timeout (seconds) |
| `stallTimeout` | `30` | Kernel stall detection threshold (seconds) |
| `reportFactors` | `true` | Report factors to FactorDB (false for competitive CTF) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19.2 + TypeScript 6.0 + Material UI 9.0 |
| Build | Vite 8.0 + Rolldown |
| Syntax Highlighting | Prismjs (replaces react-syntax-highlighter) |
| Math | SageMathCell (embedded JS), KaTeX 0.17 |
| Crypto | @noble/ciphers (AES), @noble/curves (ECC), @noble/hashes (hash) |
| External | FactorDB (via Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |

## Architecture

```
src/
  attacks/           47 individual .ts files + guard.ts + index.ts + rawSources.ts
  components/        React components (Sidebar, InputPanel, OutputPanel, MagicPanel,
                     CommandPalette, InstructionsPanel, PemDecryptor, calculators, etc.)
    calculator/      Calculator shell (Calculator.tsx, CalculatorSubTabs.tsx)
      RSACalculator, AESCalculator, ECCCalculator, HashCalculator
      hash/          Hash sub-tabs (Explanation, HashFunctions, HMAC, LengthExt, PoW, FormatConv)
  config/            env.ts (console-accessible Env class), sidebarItems.ts
  context/           AppContext provider, ctx.ts
  hooks/             useSageMath, useWorkerPool, useDragResize, useAppContext, useTimer,
                     useCommandPalette, useKeyboardShortcuts
  styles/            shared.ts, inputSx.ts
  theme/             dracula.ts
  types/             index.ts
  utils/             bigint.ts, converters.ts, factordb.ts, sageOutput.ts,
                     testcases/core.ts, attackSource.ts, pemParser.ts, asn1.ts, progressEstimator.ts
workers/             Cloudflare Worker CORS proxy for FactorDB
```

## Calculator Architecture

The unified Calculator shell (`Calculator.tsx`) provides a 4-tab selector (RSA / AES / ECC / Hash) with keyboard shortcuts (⌘1-⌘4) to switch modes. Each calculator is lazy-loaded via `React.lazy` and wrapped in a `<Suspense>` boundary. All calculators support:
- **Explanation tab** — KaTeX-rendered reference theory
- **Sub-tab navigation** via shared `CalculatorSubTabs` component
- **Pure browser-side execution** — no SageCell required for basic operations

### RSA Calculator (`RSACalculator.tsx`)
- 4 sub-tabs: Explanation, Key Gen, Encrypt, Decrypt
- Uses existing `RsaKeyGenTab`, `RsaEncryptTab`, `RsaDecryptTab` components
- Pure BigInt, e defaults to 65537, auto-derives missing params

### AES Calculator (`AESCalculator.tsx`)
- 3 sub-tabs: Explanation, Encrypt/Decrypt, Attacks
- @noble/ciphers for ECB/CBC/CTR/GCM/OFB/CFB modes, AES-128/192/256
- 8 attack modes with in-browser computation

### ECC Calculator (`ECCCalculator.tsx`)
- 4 sub-tabs: Explanation, Key Operations, Sign/Verify, Attacks
- @noble/curves for secp256k1, P-256, P-384, P-521, Curve25519
- 7 attack modes (5 via SageMathCell, 2 in-browser)

### Hash Calculator (`HashCalculator.tsx`)
- 6 sub-tabs: Explanation, Hash Functions, HMAC, Length Ext., Format Conv., PoW
- @noble/hashes for 11 algorithms + HMAC
- Proof of Work with Web Worker offload and EWMA ETA

## External Services

### SageMathCell
SageMathCell runs in an offscreen DOM container, with 3 concurrent execution slots. Includes 30s stall detection — kernel crashes that stop producing output are detected and reported early. Immediate error element detection surfaces SageMath errors as soon as they appear. 120s hard timeout (10s load + 110s exec). No internet access (firewalled since 2021) — all attack templates must be self-contained math.

### FactorDB
Auto-lookup via Cloudflare Worker CORS proxy (20s timeout). When a Factorization-category attack succeeds, discovered p,q are auto-submitted to FactorDB. Network errors propagate immediately to the user rather than silently falling through to SageCell.

## Deployment

### Manual Deploy

```bash
bun run build
git add -f docs/       # docs/ is gitignored — force-add
git add -A
git commit --no-verify -m "deploy: description"
git push origin main
```

### CI/CD
GitHub Actions on push to `main`: lint → build → deploy to GitHub Pages.

**Cache caveat:** GitHub Pages sets `cache-control: max-age=600` (10 min). After deploy, users may need a hard refresh to get the latest bundle.

## Development

```bash
bun install
bun run dev          # dev server
bun run typecheck    # TypeScript check
bun run lint         # ESLint
bun run build        # production build
bun run preview      # preview production build
```

## License

MIT
