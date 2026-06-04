# RSA Web Tool

A browser-only RSA CTF (Capture The Flag) tool with 47 cryptographic attacks across 5 categories.

**Live at:** [yuzu-octopus.github.io/RsaWebTool](https://yuzu-octopus.github.io/RsaWebTool/)

No server needed — everything runs in your browser via JavaScript BigInt and embedded SageMathCell for math-heavy computation.

## Features

- **47 attacks** — Factorization, Lattice, Protocol, Oracle, and Advanced categories
- **34 browser-side checks** — instant results via native BigInt (no SageCell needed), with live progress bars showing iteration variable + count on longer-running attacks
- **3 concurrent Web Workers** — parallel frontendCheck execution across attacks
- **SageMathCell integration** — 3 concurrent slots with 30s stall detection and immediate error element reporting
- **FactorDB lookup** — auto-queries FactorDB and auto-submits discovered factorizations
- **Magic Panel** — paste all RSA parameters at once, auto-detect applicable attacks, parallel execution (3 concurrent) with early-stop on first true success (FactorDB non-FF results don't trigger early-stop)
- **Console Environment** — `window.env` exposes all config (workers, timeouts, FactorDB proxy) with localStorage persistence; `env.reset()` clears all stored state
- **RSA Calculator** — standalone key generation, encryption, decryption (pure BigInt). 3-tab interface with merged form state. e defaults to 65537; Decrypt accepts any 2 of (p, q, n) with auto-derivation
- **Format Converter** — live Hex / Decimal / Base64 / Text conversion
- **Attack Index** — searchable catalog of all 47 attack proofs with KaTeX rendering
- **METHOD indicator** — every output shows `METHOD=TYPESCRIPT` or `METHOD=SAGEMATHCELL`
- **Standardized output format** — all 47 attacks produce consistent `Attack Name → Inputs → Results → Verification → TOKEN → METHOD` output
- **Command Palette** — ⌘/Ctrl+K fuzzy search across all 47 attacks + views
- **Keyboard Shortcuts** — ⌘Enter (run), ⌘1/2/3 (tabs), ⌘Shift+C (copy), Tab/Shift+Tab (cycle attacks)
- **PEM Decryptor** — Parse and decrypt PKCS#1/PKCS#8/encrypted PEM keys, feed params to Calculator or Attacks
- **Instructions** — Reference guide for using the tool
- **Console Configuration** — `env` object exposed on `window` for runtime config (proxy URL, worker pool, timeouts). Persisted to localStorage, `env.reset()` clears all stored data.
- **Dracula theme** — dark, developer-friendly UI
- **Prismjs syntax highlighting** — replaces react-syntax-highlighter, 33% smaller bundle (1.22MB)
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
| close-prime | Fermat factorization (|p-q| small) | ✓ |
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
| manger | Manger oracle attack | — |

### Advanced (4)
| Attack | Description | Frontend |
|--------|-------------|----------|
| factordb-lookup | Fetch factorization from FactorDB API | ✓ |
| nitros | NITROS attack | — |
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
Standalone BigInt operations: key generation, encryption, and decryption. Smart defaults: `e` defaults to 65537 in Key Gen and Encrypt when left empty. Decrypt accepts any 2 of (p, q, n) and auto-derives the third.

### Format Converter
Live conversion between hex, decimal, base64, and text.

### Command Palette
Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open. Fuzzy-search across all attacks and views. Arrow keys to navigate, Enter to select.

### PEM Decryptor
Paste a PEM private key (PKCS#1, PKCS#8, or encrypted). The tool parses the key, extracts n/e/d/p/q parameters, and offers "Feed to Calculator" or "Feed to Attacks" buttons. Supports passphrase-protected keys via Web Crypto API.

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| ⌘/Ctrl+K | Open command palette |
| ⌘/Ctrl+Enter | Run current attack |
| ⌘/Ctrl+1/2/3 | Switch Explanation/Input/Source tabs |
| ⌘/Ctrl+Shift+C | Copy output |
| Tab/Shift+Tab | Cycle through attacks |

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
| External | FactorDB (via Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |

## Architecture

```
src/
  attacks/          47 individual .ts files + guard.ts + index.ts + rawSources.ts
  components/       15 React components (Sidebar, InputPanel, OutputPanel, MagicPanel, CommandPalette, InstructionsPanel, PemDecryptor, etc.)
  config/           env.ts (console-accessible Env class), sidebarItems.ts
  context/          AppContext provider, ctx.ts
  hooks/            useSageMath, useWorkerPool, useDragResize, useAppContext, useTimer, useCommandPalette, useKeyboardShortcuts
  styles/           shared.ts, inputSx.ts
  theme/            dracula.ts
  types/            index.ts
  utils/            bigint.ts, converters.ts, factordb.ts, sageOutput.ts, testcases/core.ts, attackSource.ts, pemParser.ts, asn1.ts, progressEstimator.ts
workers/            Cloudflare Worker CORS proxy for FactorDB
```

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
