# RSA Web Tool

A browser-only RSA CTF (Capture The Flag) tool with 47 cryptographic attacks across 5 categories.

**Live at:** [yuzu-octopus.github.io/RsaWebTool](https://yuzu-octopus.github.io/RsaWebTool/)

No server needed — everything runs in your browser via JavaScript BigInt and embedded SageMathCell for math-heavy computation.

## Features

- **47 attacks** — Factorization, Lattice, Protocol, Oracle, and Advanced categories
- **30 browser-side checks** — instant results via native BigInt (no SageCell needed), with live progress bars showing iteration variable + count on longer-running attacks
- **SageMathCell integration** — runs SageMath code for Coppersmith, lattice reduction, and complex math
- **FactorDB lookup** — auto-queries FactorDB and auto-submits discovered factorizations
- **Magic Panel** — paste all RSA parameters at once, auto-detect applicable attacks, parallel execution with early-stop
- **RSA Calculator** — standalone key generation, encryption, decryption (pure BigInt). e defaults to 65537; Decrypt accepts any 2 of (p, q, n) with auto-derivation
- **Format Converter** — live Hex / Decimal / Base64 / Text conversion
- **Proof Index** — searchable catalog of all 47 attack proofs with KaTeX rendering
- **Dracula theme** — dark, developer-friendly UI
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
| dependent-prime | Dependent prime lattice | — |
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
| franklin-reiter-related-message | Related message recovery | — |
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
| small-public-exp | Small public exponent attack | — |

## Usage

### Input Panel
Select an attack from the sidebar. The Input Panel shows:
- **Explanation tab** — KaTeX-rendered proof of how the attack works
- **Input tab** — form fields for RSA parameters. Fill in values (manually or via "Generate Testcase") and click **Run**.

### Magic Panel
Click the wand icon in the sidebar. Paste all known RSA parameters — the tool auto-detects values via regex, shows which attacks apply, and runs them all in parallel (up to 6 at a time). Stops at first success.

### Progress Bars
Iterative frontendCheck attacks (close-prime, euler, pollard-p1, small-crt-exp, dependent-prime, etc.) show a determinate progress bar with live iteration variable and count below the Run button. Works through both Web Workers and main-thread fallback.

### Output Panel
Results appear in the Output Panel on the right. Features:
- Syntax-highlighted output
- Copy button
- Clickable history (last 50 results)
- Resizable notepad (drag from bottom)

### RSA Calculator
Standalone BigInt operations: key generation, encryption, and decryption. Smart defaults: `e` defaults to 65537 in Key Gen and Encrypt when left empty. Decrypt accepts any 2 of (p, q, n) and auto-derives the third.

### Format Converter
Live conversion between hex, decimal, base64, and text.

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19.2 + TypeScript 6.0 + Material UI 9.0 |
| Build | Vite 8.0 + Rolldown |
| Math | SageMathCell (embedded JS), KaTeX 0.17 |
| External | FactorDB (via Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |

## Architecture

```
src/
  attacks/    47 attack implementations + guard.ts (shared sage guard helper)
  components/ UI components (Sidebar, InputPanel, MagicPanel, OutputPanel, etc.)
  hooks/      useSageMath, useWorkerPool, useDragResize, useAppContext, useTimer
  context/    AppContext (flat state, history cap 50)
  utils/      bigint math, converters, FactorDB client, sage output parser, testcase generators
  styles/     shared MUI sx style objects, FONT_FAMILY constant
  theme/      Dracula MUI theme
  types/      Attack, InputField, HistoryEntry, NotificationState interfaces
workers/      Cloudflare Worker CORS proxy for FactorDB
```

## External Services

### SageMathCell
SageMathCell runs in an offscreen DOM container. 120s timeout (10s load + 110s exec). No internet access (firewalled since 2021) — all attack templates must be self-contained math.

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
