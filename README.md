# RSA Web Tool

A browser-only RSA CTF tool with 47 cryptographic attacks across 5 categories, plus 5 built-in calculators (RSA, AES, ECC, Hash, DH).

**Live at:** [yuzu-octopus.github.io/RsaWebTool](https://yuzu-octopus.github.io/RsaWebTool/)

No server needed — everything runs in your browser via JavaScript BigInt and embedded SageMathCell for math-heavy computation.

## Features

### Cryptographic Attacks

- **47 attacks** — Factorization (19), Lattice/Partial Key (11), Message/Protocol (9), Oracle (4), and Advanced (4) categories
- **33 browser-side checks** — instant results via native BigInt (no SageCell needed), with live progress bars showing iteration variable + count on longer-running attacks
- **3 concurrent Web Workers** — parallel frontendCheck execution across attacks
- **SageMathCell integration** — 43 attacks with SageMath backstop (4 are pure-JS only), 3 concurrent slots, 30s stall detection, immediate error element reporting
- **FactorDB lookup** — auto-queries FactorDB and auto-submits discovered factorizations
- **Magic Panel** — paste all RSA parameters at once, auto-detect applicable attacks, parallel execution (3 concurrent) with early-stop on first true success
- **Console Environment** — `window.env` exposes all config (workers, timeouts, FactorDB proxy) with localStorage persistence; `env.reset()` clears all stored state

### Built-in Calculators

- 🔢 **RSA Calculator** — Key Generation, Encryption, Decryption (pure BigInt) with Explanation tab. e defaults to 65537; Decrypt auto-derives missing parameters from any 2 of (p, q, n, e, d)
- 🔒 **AES Calculator** — Encrypt/Decrypt via @noble/ciphers in ECB/CBC/CTR/GCM/OFB/CFB modes. 8 attack modes: CTR nonce reuse, CBC bit-flipping, ECB detection, ECB cut-and-paste, ECB byte-at-a-time oracle, CBC padding oracle, GCM nonce reuse, AES-128 key schedule inversion
- 📐 **ECC Calculator** — Key generation, public-from-private, ECDH shared secret, ECDSA sign/verify via @noble/curves (secp256k1, P-256, P-384, P-521, Ed25519, X25519). 7 attack modes: ECDSA nonce reuse, point validation checker, biased nonce LLL, invalid curve attack, MOV embedding degree, Smart's anomalous attack, singular curve attack
- 🔏 **Hash Calculator** — 14 hash algorithms (SHA-224/256/384/512, SHA3-256/384/512, BLAKE2s/2b, BLAKE3, Keccak-256, SHAKE128/256), HMAC, Proof of Work with Web Worker offload, Length Extension attack
- 🤝 **DH Calculator** — RFC 3526 standard groups + custom parameters, key exchange simulation, discrete log attacks

### Interface

- **Format Converter** — live Hex / Decimal / Base64 / Binary conversion
- **Attack Index** — searchable catalog of all 47 attack proofs with KaTeX rendering
- **METHOD indicator** — every output shows `METHOD=TYPESCRIPT` or `METHOD=SAGEMATHCELL`
- **Standardized output format** — all attacks produce consistent `Attack Name → Inputs → Results → Verification → TOKEN → METHOD` output
- **Command Palette** — ⌘/Ctrl+K fuzzy search across all 47 attacks + calculators + views
- **Keyboard Shortcuts** — ⌘Enter (run), ⌘1-5 (calculator tabs), ⌘Shift+C (copy), Tab/Shift+Tab (cycle)
- **PEM Decryptor** — Parse and decrypt PKCS#1/PKCS#8/encrypted PEM keys, feed params to Calculator or Attacks
- **Instructions Panel** — Always-visible reference guide
- **Notepad** — Drag-resizable scratchpad with localStorage persistence (1h expiry)
- **Prism.js syntax highlighting** — replaces react-syntax-highlighter, 33% smaller bundle
- **Dracula theme** — dark, developer-friendly UI

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
| related-message | Related message recovery (e=3/e=5) | ✓ |
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
| nitros | NITROS attack (dynamic M selection, M > n^(1/4)) | — |
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
Standalone BigInt operations: key generation, encryption, decryption. Smart defaults: e defaults to 65537. Decrypt auto-derives any 2 of (p, q, n, e, d) and uses CRT-optimized decryption. 4 sub-tabs: Explanation, Key Gen, Encrypt, Decrypt.

### AES Calculator
Encrypt/Decrypt in 6 modes (ECB, CBC, CTR, GCM, OFB, CFB) via @noble/ciphers. Supports hex, base64, and text input/output. AAD for GCM. 3 sub-tabs: Explanation, Encrypt/Decrypt, Attacks (8 attack references with in-browser computation).

### ECC Calculator
Curve operations via @noble/curves: key generation, public-from-private, ECDH shared secret, ECDSA sign/verify. 6 curves (secp256k1, P-256, P-384, P-521, Ed25519, X25519). 4 sub-tabs: Explanation, Key Operations, Sign/Verify, Attacks (7 attack descriptions).

### Hash Calculator
Pure JS hash computation via @noble/hashes. 14 algorithms including SHA-2/3, BLAKE2/3, Keccak, SHAKE. HMAC with any algorithm. Proof of Work with Web Worker offload and EWMA ETA. Length Extension attack (SHA-256/512). 5 sub-tabs: Explanation, Hash Functions, HMAC, Length Extension, PoW.

### DH Calculator
Diffie-Hellman key exchange with RFC 3526 standard groups (group1/group5/group14) or custom p/g parameters. Generates private/public keys, computes shared secrets. 3 sub-tabs: Explanation, Key Exchange, Attacks (discrete log attacks).

### Format Converter
Live conversion between hex, decimal, base64, binary, and text.

### Command Palette
Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open. Fuzzy-search across all attacks, calculators, and views. Arrow keys to navigate, Enter to select.

### PEM Decryptor
Paste a PEM private key (PKCS#1, PKCS#8, or encrypted). The tool parses the key, extracts n/e/d/p/q parameters, and offers "Feed to Calculator" or "Feed to Attacks" buttons. Supports passphrase-protected keys via Web Crypto API.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘/Ctrl+K | Open command palette |
| ⌘/Ctrl+Enter | Run current attack |
| ⌘/Ctrl+1/2/3 | Switch Explanation/Input/Source tabs (attack mode) |
| ⌘/Ctrl+1/2/3/4/5 | Switch calculator modes RSA/AES/ECC/Hash/DH (calculator mode) |
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
| Syntax Highlighting | Prism.js (replaces react-syntax-highlighter) |
| Math | SageMathCell (embedded JS), KaTeX 0.17 |
| Crypto | @noble/ciphers 2.2 (AES), @noble/curves 2.2 (ECC), @noble/hashes 2.2 (hash), bigint-gcd 1.0 |
| External | FactorDB (via Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |

## Architecture

```
src/
  attacks/           47 attack files + guard.ts + index.ts + rawSources.ts + _rsaHelpers.ts
  components/        React components (40 .tsx files)
    _shared/         EmptyState.tsx
    calculator/      Calculator shell + 5 calculators with sub-tabs (28 files)
      _shared/       CalculatorHeader.tsx, ResultBox.tsx
      hash/          ExplanationTab, HashFunctionsTab, HMACTab, LengthExtensionTab, ProofOfWorkTab
  config/            env.ts (console-accessible Env class), sidebarItems.ts
  context/           AppContext provider, ctx.ts (createContext barrel)
  hooks/             12 hooks: useAppContext, useAttackExecution, useCalculatorOutput,
                     useCommandPalette, useCopyToClipboard, useDragResize,
                     useKeyboardShortcuts, useMagicExecution, useNotepad,
                     useSageMath, useTimer, useWorkerPool
  styles/            shared.ts (7 style objects, FONT_FAMILY, animation keyframes),
                     inputSx.ts, draculaPrism.css
  theme/             dracula.ts — full Dracula palette
  types/             index.ts — Attack, InputField, HistoryEntry, NotificationState,
                     AppContextType, CalculatorMode, AttackCategory
  utils/             bigint.ts, converters.ts, dhCrypto.ts, aesCrypto.ts, eccCurves.ts,
                     factordb.ts, sageOutput.ts, rsaCalc.ts, testcases/core.ts,
                     attackSource.ts, pemParser.ts, asn1.ts, progressEstimator.ts
  workers/           2 Web Workers
    attack-worker.ts    Attack execution worker (~304KB lazy chunk)
    pow-worker.ts       Hashcash Proof of Work solver (~86 lines)
workers/             Cloudflare Worker CORS proxy for FactorDB
  factordb-proxy.js
  wrangler.toml
  DEPLOY.md
.github/workflows/deploy.yml
```

## Calculator Architecture

The unified Calculator shell (`Calculator.tsx`) provides a 5-tab selector (RSA / AES / ECC / Hash / DH) with keyboard shortcuts (⌘1-⌘5). Each calculator is lazy-loaded via `React.lazy` and wrapped in a `<Suspense>` boundary. Shared UI components (`CalculatorHeader`, `ResultBox`, `AttackExplanationPanel`) eliminate duplicate layout patterns.

### RSA Calculator (`RSACalculator.tsx`)
- 4 sub-tabs: Explanation, Key Gen, Encrypt, Decrypt
- Uses existing `RsaKeyGenTab`, `RsaEncryptTab`, `RsaDecryptTab` components
- Pure BigInt, e defaults to 65537, CRT-optimized decryption

### AES Calculator (`AESCalculator.tsx`)
- 3 sub-tabs: Explanation, Encrypt/Decrypt, Attacks
- @noble/ciphers for ECB/CBC/CTR/GCM/OFB/CFB modes, AES-128/192/256
- 8 attack modes with in-browser computation

### ECC Calculator (`ECCCalculator.tsx`)
- 4 sub-tabs: Explanation, Key Operations, Sign/Verify, Attacks
- @noble/curves for secp256k1, P-256, P-384, P-521, Ed25519, X25519
- 7 attack descriptions (2 in-browser, 5 via SageMathCell)

### Hash Calculator (`HashCalculator.tsx`)
- 5 sub-tabs: Explanation, Hash Functions, HMAC, Length Extension, PoW
- @noble/hashes for 14 algorithms + HMAC
- Proof of Work with Web Worker offload and EWMA ETA

### DH Calculator (`DHCalculator.tsx`)
- 3 sub-tabs: Explanation, Key Exchange, Attacks
- RFC 3526 groups + custom p/g parameters
- Shared secret computation, discrete log attacks

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
