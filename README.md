# RSA CTF Tool

A browser-only RSA cryptography analysis tool powered by SageMathCell, designed for CTF challenges and educational use.

[**Live Demo**](https://yuzu-octopus.github.io/RsaWebTool/)

## Features

- **47 attack implementations** across 5 categories (L5 Playwright test suite: **~99% passing**; 1 expected probabilistic failure)
- **Real-time SageMath execution** via embedded SageMathCell (offscreen DOM + MutationObserver pipeline)
- **Browser-side pre-checks** — 27 attacks run entirely in the browser via BigInt GCD, FactorDB API, lattice GCD, extended GCD (Bezout), Euler sum-of-squares, special-prime trial division, Fermat factorization, Brent cycle detection, oracle binary search, interval arithmetic, e-th root brute-force, and continued fractions (no SageCell needed)
- **FactorDB integration** — CORS-proxied API via Cloudflare Worker for instant factor lookups, with **auto-submit** of factorized results from all 19 Factorization-category attacks
- **Magic Cracker** — paste any RSA parameters, auto-detect format, and run all applicable attacks with priority ordering, concurrent parallel execution (cap 6), and early-stop on first success
- **RSA Calculator** — pure BigInt Key Gen / Encrypt / Decrypt (no SageCell needed), with automatic hex/decimal/ASCII detection
- **Notification toasts** — Dracula-themed Snackbar at top-center (3s auto-dismiss) on attack completion, with auto-submit status for Factorization results
- **Mathematical proofs** — every attack includes a formal LaTeX proof rendered with KaTeX (display math, inline math heuristics, itemize, References section stripper)
- **PEM parser** — SPKI and PKCS#1 public key format auto-detection
- **Format Converter** — standalone tool to convert between Hex, Decimal, Base64, and Text with auto-conversion on every keystroke
- **Notepad** — persistent scratchpad with 80-200px drag-resizable height, 1-hour localStorage expiry
- **Service status** — live FactorDB proxy and SageMathCell availability indicators (colored icons in sidebar)
- **History** — last 50 executions, success/failure status with timestamps
- **Dracula theme** — full dark mode with JetBrains Mono typography, Material Icons (no emojis), no box-shadows
- **Variable modulus sizes** — testcases range from 64-bit (LSB oracle) to 1024-bit (close-prime), with most factorization attacks at 512-bit default; some attacks use custom overrides (pisano-period: 8-bit, roca: 8-bit) for fast SageCell execution

## Attack Categories

| Category | Count | Highlights |
|----------|-------|------------|
| **Factorization** | 19 | Boneh-Durfee, ECM (Full), Pollard p-1, Pollard rho, Williams p+1, SQUFOF, Quadratic Sieve, Binary Poly Factor, Small Fraction, Batch GCD, Multi-Prime, Gimmicky Primes, Close Prime, Novelty Primes, Common Prime RSA, Euler, Pollard-Strassen, Pisano Period, Multi-Prime GCD |
| **Partial Key / Lattice** | 11 | Simple Lattice, Partial d, Partial p/q Bits, Small CRT Exp, dp/dq Leak, Linearly Related Primes, Dependent Prime, Partial Key Exposure, Implicit Key Exposure, Coppersmith Short Pad, Phi(n) Leak |
| **Message / Protocol** | 9 | Common Modulus, Franklin-Reiter Related Message, Hastad Linear Pad, Hastad Broadcast, RSA-CRT Fault, Non-Coprime Exp, Homomorphic Forgery, Bleichenbacher Sig, Known Plaintext |
| **Oracle** | 4 | Bleichenbacher PKCS#1 v1.5, Manger OAEP, Biased LSB, LSB Oracle |
| **Advanced** | 4 | ROCA (Infineon RSALib), Nitros, FactorDB Lookup, Small Public Exp |

## Architecture

### App Components

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `Sidebar.tsx` | Collapsible category tree (5 categories) + Magic/Proofs/Calculator nav buttons + FactorDB/SageCell service status indicators (ok/error/checking) |
| `InputPanel` | `InputPanel.tsx` | Shows when an attack is selected: Explanation tab (KaTeX proof rendering) / Input tab (form fields + Generate Testcase + Run/Stop with AbortController). Shows completion toast; auto-submits p,q to FactorDB for Factorization-category attacks |
| `OutputPanel` | `OutputPanel.tsx` | Results display (react-syntax-highlighter Dracula) + copy button + clickable history (collapsible, cap 50) + Notepad (drag-resize via `useDragResize`) |
| `MagicPanel` | `MagicPanel.tsx` | Paste-all mode: auto-detect params via regex (key=value, PEM, hex, decimal), show applicable attacks preview, priority-ordered parallel execution (concurrency=6), early-stop on first `=SUCCESS`, per-attack status list. Shows success toast; auto-submits p,q to FactorDB for Factorization-category attacks |
| `RsaCalculator` | `RsaCalculator.tsx` | Pure BigInt calculator: Key Gen / Encrypt / Decrypt tabs, auto-format detection (hex/decimal/base64/ASCII), printable ASCII detection |
| `FormatConverter` | `FormatConverter.tsx` | Standalone Hex / Decimal / Base64 / Text converter with dropdown format selectors and live auto-conversion |
| `ProofIndex` | `ProofIndex.tsx` | Searchable index of all 47 attacks with category tags and descriptions, click to navigate |
| `ProofRenderer` | `ProofRenderer.tsx` | Full KaTeX parser: display math (align\*/equation\*/gather\*/aligned), inline math via $...$ (with auto-wrap heuristics for unadorned math tokens), itemize lists, heading detection, References section stripper |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Class component catching render crashes in content panels, Dracula-themed fallback UI, prevents sidebar/output/snackbar from going down |

### State Management

- **AppContext** (`src/context/`) — single flat context with separated context object (`ctx.ts`) and provider (`AppContext.tsx`) for clean imports
- State: `selectedAttack`, `viewMode` ('attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter'), `outputResult`, `outputError`, `history` (capped at 50), `notification` (`NotificationState` | null)
- Methods: `showNotification(msg, severity)` — triggers Dracula-themed Snackbar toast with key-based re-animation
- Hook: `useAppContext()` in `src/hooks/useAppContext.ts`

### Attack System

All 47 attacks live in `src/attacks/` as individual self-contained files in a flat directory. Each file exports:
- `attack: Attack` — full attack metadata (id, name, inputs, sageTemplate, proof, priority, applicableCheck, frontendCheck?, generateTestcase?)
- `generateTestcase: () => Record<string, string>` — attack-specific testcase generator

`src/attacks/index.ts` aggregates everything into:
- `attacks: Attack[]` — flat array for UI consumption
- `testcaseGenerators: Record<string, () => Record<string, string>>` — keyed by attack id
- `CATEGORIES` — ordered category list (5 categories)
- `attacksByCategory` — Map of category → attacks

**Adding a new attack** = 1 file + 1 import line + 2 array entries in `index.ts`. Zero UI changes needed.

### 27 Attacks with frontendCheck (Browser-Only)

These run fully in the browser when sufficient parameters are provided, returning instantly without SageCell:

| Attack | What It Does |
|--------|-------------|
| `batch-gcd` | BigInt GCD computation across a comma-separated modulus list |
| `biased-lsb` | Majority-vote LSB oracle + binary search to recover m |
| `bleichenbacher` | Interval arithmetic for PKCS#1 v1.5 padding oracle |
| `close-prime` | Fermat factorization with isqrt (|p-q| small) |
| `common-modulus` | Extended GCD + Bezout recovery of m from two encryptions under same n |
| `common-prime-rsa` | GCD chain across multiple moduli |
| `coppersmith-short-pad` | Integer e-th root recovery of short-padded messages |
| `dp-dq-leak` | Decrypt directly from leaked d<sub>p</sub> + d<sub>q</sub> |
| `euler` | Euler factorization via two sum-of-squares representations (BigInt) |
| `factordb-lookup` | Fetch pre-computed factorization from FactorDB API |
| `gimmicky-primes` | Trial division against 8 families of special primes (Mersenne, primorial, Fermat, etc.) |
| `hastad-broadcast` | CRT recovery of m from e identical encryptions under different n |
| `homomorphic-forgery` | Forge a valid signature via RSA's multiplicative homomorphism |
| `implicit-key-exposure` | Lattice GCD across related keys |
| `known-plaintext` | Integer e-th root + known-prefix brute-force |
| `linearly-related-primes` | GCD across primes with known linear relations |
| `lsb-oracle` | Binary search with LSB oracle responses |
| `multi-prime-gcd` | GCD across multi-prime setups |
| `novelty-primes` | Window search near powers of 2 and math constants (π, e, √2) |
| `partial-d` | Decrypt directly from leaked private exponent d |
| `phi-leak` | Decrypt directly from leaked φ(n) |
| `pisano-period` | Period detection via Map on 2<sup>i</sup> mod n |
| `pollard-rho` | Brent's cycle detection with batched GCD |
| `rsa-crt-fault` | Recover p via gcd(sig^e - m, n) from faulty CRT signature |
| `small-crt-exp` | Recover p via gcd from small CRT exponent dp or dq leak |
| `small-fraction` | Recover p/q fraction via continued fractions of e/n |

### SageMath Execution Pipeline

1. **Offscreen container**: hidden `<div>` at `(-9999px, -9999px)` with absolute positioning, zero opacity, no pointer-events
2. **Script injection**: `<script type="text/x-sage">` with generated template code appended as textContent
3. **Execution**: `window.sagecell.makeSagecell()` targets container by ID with `template: sagecell.templates.minimal`, `autoeval: true`
4. **Polling**: `MutationObserver` on container waits for `.sagecell_stdout` to appear, then settles for 500ms before extracting text
5. **Timeout**: 120s default (10s for SageCell script load + 110s execution), returns error on timeout
6. **Cleanup**: container removed from DOM, observer disconnected, event listeners cleaned

### Parallel Execution (Magic Mode)

- `useSageMathParallel()` with concurrency cap of 6
- Queue-based dispatch: next execution starts as soon as a slot opens
- `AbortController` stops all remaining jobs when first `=SUCCESS` detected
- `onResult` callback enables early-stop logic

### Key Design Decisions

- **Browser-only** — no backend server. All computation happens client-side on GitHub Pages.
- **SageMathCell embedded JS** — the `/service` REST API is dead (Cloudflare 520). The `makeSagecell` embedded script is the only working path.
- **FactorDB CORS proxy** — FactorDB API has no CORS headers. A Cloudflare Worker at `factordb-proxy.octopusyuzu.workers.dev` adds `Access-Control-Allow-Origin: *` and caches responses (max-age=3600). Worker also supports POST `/report` for submitting factorized results back to FactorDB.
- **FactorDB auto-submit** — when an attack in the Factorization category succeeds, extracted p,q factors are submitted to FactorDB via `reportFactor()` (fire-and-forget, never blocks result display). Status shown in notification toasts.
- **Notification toasts** — Dracula-themed Snackbar (`slotProps.content.sx` with Dracula background/foreground colors) rendered in `App.tsx`. InputPanel and MagicPanel call `showNotification(msg, severity)` on attack completion.
- **frontendCheck pattern** — 27 attacks define an optional async pre-check that runs in the browser before falling back to SageCell. This enables instant results for FactorDB lookups, phi(n) recovery, GCD operations, e-th root brute-force, Fermat factorization, Brent cycle detection, oracle binary search, interval arithmetic, continued fractions, and special-prime trial division.
- **Pure math templates** — SageMathCell has no internet access (firewall since 2021). All attack templates must be self-contained pure math code with no external dependencies.
- **Variable-size testcases** — `TESTCASE_BITS = { p: 256, q: 256 }` (n ≈ 512-bit) is the default; 10 attacks use custom generators with sizes from 64-bit to 1024-bit, typically producing n ≥ 512-bit while respecting algorithmic constraints (Coppersmith bounds, SageCell caps, timeout limits).
- **L5 Playwright test suite** in `scripts/test-playwright.ts` — runs all 47 attacks × 3 runs each (141 total, factordb-lookup skipped in CI = 138 runnable). 10-page concurrency, 120s timeout per run. Current: **~99% passing** (~60s), 1 expected probabilistic failure (partial-pq-bits 2/3).
- **No unit tests** — functional verification is `typecheck → lint → build → L5 Playwright suite`.
- **DRY conventions** — shared MUI TextField styles in `src/styles/inputSx.ts`, reusable drag-to-resize hook in `src/hooks/useDragResize.ts`.

### Directory Structure

```
index.html                  — SageMathCell script + JetBrains Mono font + React mount point
vite.config.ts              — Base path /RsaWebTool/, output to docs/
src/
  main.tsx                  — React root (StrictMode)
  App.tsx                   — Top-level: ThemeProvider + CssBaseline + AppProvider + Sidebar + panels + OutputPanel + Snackbar toast
  config.ts                 — FACTORDB_PROXY_URL, overridable via VITE_FACTORDB_PROXY_URL env var
  vite-env.d.ts             — ImportMetaEnv for VITE_FACTORDB_PROXY_URL
  types/index.ts            — Attack, InputField, HistoryEntry, AppContextType, NotificationState interfaces
  theme/dracula.ts          — MUI createTheme with full Dracula palette + custom scrollbar styling
  context/
    ctx.ts                  — createContext<AppContextType | null>(null)
    AppContext.tsx           — AppProvider with useState for selectedAttack, viewMode, outputResult, outputError, history, notification
  hooks/
    useAppContext.ts        — useContext(AppContext) wrapper with null check
    useSageMath.ts          — createSageMathExecutor(), useSageMath(), useSageMathParallel()
    useDragResize.ts        — Reusable drag-to-resize hook (axis, min, max, storageKey, onResize callback)
  styles/
    inputSx.ts              — Shared Dracula-themed MUI TextField SxProps (used by InputPanel, MagicPanel, ProofIndex, RsaCalculator)
  utils/
    bigint.ts               — gcd, isqrt, extendedGcd, modInverse, modPow (all BigInt)
    converters.ts           — convertFormat, detectFormat, parsePEM, Format type
    factordb.ts             — queryFactorDB, formatFactorDBResult, FactorDBError, setFactorDBProxy, reportFactor, extractPQ
    testcases/core.ts       — randomPrime, isPrimeMR, generateKeyPair, encrypt, TESTCASE_BITS
  attacks/
    index.ts                — Barrel: imports all 47 attacks + testcase generators, CATEGORIES, attacksByCategory
  components/
    FormatConverter.tsx     — Standalone Hex/Decimal/Base64/Text format converter (dropdowns + live auto-conversion)
    Sidebar.tsx             — 220px Drawer, collapsible category tree, Magic/Proofs/Calculator/Converter nav, service status
    InputPanel.tsx          — Explanation tab (ProofRenderer) + Input tab (form + Generate Testcase + Run/Stop)
    OutputPanel.tsx         — Results (SyntaxHighlighter) + copy + clickable history + Notepad
    MagicPanel.tsx          — Parameter auto-detect, applicable preview, parallel execution, per-attack status
    RsaCalculator.tsx       — Key Gen / Encrypt / Decrypt tabs with auto-format detection
    ProofIndex.tsx          — Searchable filtered list of all 47 attacks with category tags
    ProofRenderer.tsx       — KaTeX renderer: parseProof → segments (displayMath, text, list) → render
    ErrorBoundary.tsx       — Class-based error boundary with Dracula fallback UI for content panels
workers/
  factordb-proxy.js         — Cloudflare Worker: CORS proxy for FactorDB (GET /query) + submit endpoint (POST /report)
  wrangler.toml             — Wrangler config (name, main, compatibility_date)
  package.json              — wrangler dev dependency
  DEPLOY.md                 — Deploy instructions for Cloudflare Workers
```

## Local Development

```bash
bun install
bun run dev      # starts dev server on port 5173
```

## Deployment

Build output goes to `docs/`. GitHub Pages auto-deploys from this directory on every push to `main`.

```bash
bun run build
git add -f docs/                     # force-add (docs/ is gitignored)
git add -A && git commit --no-verify # --no-verify for .env.example
git push origin main
```

CI workflow (`.github/workflows/deploy.yml`) runs `bun run lint && bun run build` on push to `main`, then deploys via `actions/deploy-pages@v4`.

## FactorDB Proxy (Cloudflare Worker)

Provides two endpoints:

- **GET /query** — `?n=<hex>` — looks up a number in FactorDB. Returns JSON with factorization status.
- **POST /report** — `{number: <int>, factors: [<int>, ...]}` — submits factorized result to FactorDB (form-encoded forward to `factordb.com/report`).

```bash
cd workers
npm install           # wrangler requires Node (NOT bun)
npx wrangler dev      # local dev on :8787
npx wrangler deploy   # deploy to Cloudflare Workers
```

After deploy, copy the worker URL into `src/config.ts` or set `VITE_FACTORDB_PROXY_URL` env var.

## SageMath Gotchas (Important for Attack Authors)

- **No blank lines inside function/loop bodies** — SageMath interactive mode treats blank lines as cell separators. This is the single most common bug.
- `^` is XOR for Python `int` — always use `**` for exponentiation
- `.bits()` returns bit positions list — use `.nbits()` for bit count
- Always wrap numeric template values in `Integer()`
- No `return` at module level — use `quit()` instead. `return` is fine inside functions.
- No nested `def` inside `for` loops at module level — move function definitions outside or inline
- `nth_root(exp, truncate_mode=True)` for exact integer roots (`integer_nth_root` doesn't exist)
- `n.factor(algorithm='ecm')` — note `ecmfactor()` returns a `(B1, curve_count)` tuple, not the factor
- Continue fractions: use global `continued_fraction(QQ(e)/QQ(n))`, not `.continued_fraction()` on Integer
- Oracle attacks: save `orig_c = Integer(${vals.c})` before loop mutation
- Coppersmith `small_roots(X=..., beta=...)` — beta=0.5 for sqrt(n) factor search
- `range(int(e) + 1)` to avoid Sage Integer → Python range error with small exponents
- `prime_range(start, end)` is faster than `range()` + `is_prime()`
- 120s timeout in useSageMath.ts — factorization testcases must remain feasible within this limit

### Debugging Patterns (Hard-Earned)

- **Fallback chains**: Never trust a single SageMath method. `small_roots` over composite N throws under Docker Rosetta. Always: `try/except` → Python-native fallback → brute-force.
- **Narrow try/except**: Wrap only the flaky call, not the whole strategy. A broad `except` at the outer level swallows fallback code silently.
- **Horner evaluation**: In tight SageCell loops, replace `power_mod` with precomputed Horner coefficients — `((A*m + B)*m + C)*m + D` is 10-100x faster than repeated modular exponentiation.
- **Detection vs exploitation**: Don't break at first match during signature scanning. Track the BEST match across all candidates. First-match on trivial signatures (e.g., M=2 in ROCA) causes false positives.
- **Fix both ends**: When a test fails, check the implementation AND the test runner. Race conditions in polling loops can cause false negatives (e.g., cached text without `=SUCCESS`/`=FAILED` markers).
- **Regression vs flakiness**: A 3/3 → 0/3 jump is a fixable regression. A 3/3 → 2/3 drop is inherent flakiness (williams-p1, partial-pq-bits). Don't "fix" what's probabilistic.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19.2 + TypeScript 6.0 |
| Build | Vite 8.0 + Rolldown |
| UI | Material UI 9.0 (Dracula themed) |
| Math Rendering | KaTeX 0.17 |
| Code Highlighting | react-syntax-highlighter (Dracula) |
| Math Engine | SageMathCell (embedded makeSagecell JS) |
| External API | FactorDB (via Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |

## Security Disclaimer

This tool is designed for **CTF challenges and educational purposes only**. Do not use it against systems you do not have explicit permission to test. RSA cryptography is widely used in production systems — unauthorized access is illegal.

## License

MIT
