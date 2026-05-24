# RSA CTF Tool

A browser-only RSA cryptography analysis tool powered by SageMathCell, designed for CTF challenges and educational use.

[**Live Demo**](https://yuzu-octopus.github.io/RsaWebTool/)

## Features

- **49 attack implementations** across 5 categories (L5 Playwright test suite: **141/144 passing**, 98%; 3 expected probabilistic failures)
- **Real-time SageMath execution** via embedded SageMathCell (offscreen DOM + MutationObserver pipeline)
- **Browser-side pre-checks** — 8 attacks run entirely in the browser via BigInt GCD, FactorDB API, or lattice GCD (no SageCell needed)
- **FactorDB integration** — CORS-proxied API via Cloudflare Worker for instant factor lookups, with **auto-submit** of factorized results from all 18 Factorization-category attacks
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
- **512-bit modulus support** — most testcase generators produce 256-bit primes (n ≈ 512-bit); some attacks use custom overrides (pisano-period: 8-bit, roca: 8-bit) for fast SageCell execution

## Attack Categories

| Category | Count | Highlights |
|----------|-------|------------|
| **Factorization** | 19 | Boneh-Durfee, ECM (Full), Pollard p-1, Pollard rho, Williams p+1, SQUFOF, Quadratic Sieve, Binary Poly Factor, Small Fraction, Batch GCD, Multi-Prime, Gimmicky Primes, Close Prime, Novelty Primes, Common Prime RSA, Common Factor, Euler, Pollard-Strassen, Pisano Period |
| **Partial Key / Lattice** | 9 | Simple Lattice, Partial d Key Exposure, Partial p/q Bits, Small CRT Exp, dp/dq Leak, Linearly Related Primes, Dependent Prime, Partial Key Exposure, Implicit Key Exposure |
| **Message / Protocol** | 10 | Common Modulus, Franklin-Reiter Related Message, Coppersmith Short Pad, Hastad Linear Pad, Hastad Broadcast, RSA-CRT Fault, Non-Coprime Exp, Cube Root CRT, Homomorphic Forgery, Bleichenbacher Sig |
| **Oracle** | 4 | Bleichenbacher PKCS#1 v1.5, Manger OAEP, Biased LSB, LSB Oracle |
| **Advanced** | 7 | ROCA (Infineon RSALib), Nitros, FactorDB Lookup, Known Plaintext, Small Public Exp, Multi-Prime GCD, Phi(n) Leak |

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
| `ProofIndex` | `ProofIndex.tsx` | Searchable index of all 49 attacks with category tags and descriptions, click to navigate |
| `ProofRenderer` | `ProofRenderer.tsx` | Full KaTeX parser: display math (align\*/equation\*/gather\*/aligned), inline math via $...$ (with auto-wrap heuristics for unadorned math tokens), itemize lists, heading detection, References section stripper |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Class component catching render crashes in content panels, Dracula-themed fallback UI, prevents sidebar/output/snackbar from going down |

### State Management

- **AppContext** (`src/context/`) — single flat context with separated context object (`ctx.ts`) and provider (`AppContext.tsx`) for clean imports
- State: `selectedAttack`, `viewMode` ('attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter'), `outputResult`, `outputError`, `history` (capped at 50), `notification` (`NotificationState` | null)
- Methods: `showNotification(msg, severity)` — triggers Dracula-themed Snackbar toast with key-based re-animation
- Hook: `useAppContext()` in `src/hooks/useAppContext.ts`

### Attack System

All 49 attacks live in `src/attacks/` as individual self-contained files in a flat directory. Each file exports:
- `attack: Attack` — full attack metadata (id, name, inputs, sageTemplate, proof, priority, applicableCheck, frontendCheck?, generateTestcase?)
- `generateTestcase: () => Record<string, string>` — attack-specific testcase generator

`src/attacks/index.ts` aggregates everything into:
- `attacks: Attack[]` — flat array for UI consumption
- `testcaseGenerators: Record<string, () => Record<string, string>>` — keyed by attack id
- `CATEGORIES` — ordered category list (5 categories)
- `attacksByCategory` — Map of category → attacks

**Adding a new attack** = 1 file + 1 import line + 2 array entries in `index.ts`. Zero UI changes needed.

### 8 Attacks with frontendCheck (Browser-Only)

These run fully in the browser when sufficient parameters are provided, returning instantly without SageCell:

| Attack | What It Does |
|--------|-------------|
| `batch-gcd` | BigInt GCD computation across a comma-separated modulus list |
| `common-factor` | GCD of two moduli to detect shared prime factors |
| `common-prime-rsa` | GCD chain across multiple moduli |
| `dp-dq-leak` | Decrypt directly from leaked d<sub>p</sub> + d<sub>q</sub> |
| `factordb-lookup` | Fetch pre-computed factorization from FactorDB API |
| `implicit-key-exposure` | Lattice GCD across related keys |
| `multi-prime-gcd` | GCD across multi-prime setups |
| `phi-leak` | Decrypt directly from leaked φ(n) |

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
- **frontendCheck pattern** — attacks can define an optional async pre-check that runs in the browser before falling back to SageCell. This enables instant results for FactorDB lookups, phi(n) recovery, and BigInt GCD operations.
- **Pure math templates** — SageMathCell has no internet access (firewall since 2021). All attack templates must be self-contained pure math code with no external dependencies.
- **512-bit testcases** — `TESTCASE_BITS = { p: 256, q: 256 }` produces n ≈ 512-bit. Factorization attacks generate n with at least one small factor to avoid SageCell 120s timeout.
- **L5 Playwright test suite** in `scripts/test-playwright.ts` — runs all 49 attacks × 3 runs each (147 total, factordb-lookup skipped in CI = 144 runnable). 10-page concurrency, 120s timeout per run. Current: 141/144 passing, 3 expected probabilistic failures (williams-p1 1/3, partial-pq-bits 2/3).
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
    index.ts                — Barrel: imports all 49 attacks + testcase generators, CATEGORIES, attacksByCategory
  components/
    FormatConverter.tsx     — Standalone Hex/Decimal/Base64/Text format converter (dropdowns + live auto-conversion)
    Sidebar.tsx             — 220px Drawer, collapsible category tree, Magic/Proofs/Calculator/Converter nav, service status
    InputPanel.tsx          — Explanation tab (ProofRenderer) + Input tab (form + Generate Testcase + Run/Stop)
    OutputPanel.tsx         — Results (SyntaxHighlighter) + copy + clickable history + Notepad
    MagicPanel.tsx          — Parameter auto-detect, applicable preview, parallel execution, per-attack status
    RsaCalculator.tsx       — Key Gen / Encrypt / Decrypt tabs with auto-format detection
    ProofIndex.tsx          — Searchable filtered list of all 49 attacks with category tags
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
