# RSA Web Tool — Agent Instructions

## Commands

```bash
bun run dev          # dev server (port 5173)
bun run build        # tsc -b && vite build → docs/
bun run lint         # eslint
bun run lint:fix     # eslint --fix
bun run typecheck    # tsc -b --noEmit
bun run preview      # vite preview (prod build)
```

**Verification order:** `typecheck → lint → build`

**Verification Status:** L5 Playwright test suite passes **151/153 (98.7%)** across all 51 runnable attacks (factordb-lookup skipped in CI). Only 2 probabilistic partials remain: williams-p1 (2/3) and partial-pq-bits (2/3) — both inherently probabilistic, not fixable bugs.

## Issue-Finding & Fixing Protocol

- **Do NOT hallucinate issues or fixes.** Thoroughly validate each potential issue exists by reading the relevant code, researching patterns online, and confirming the bug is real before attempting any fix.
- **No research, no fix.** Always use websearch + webfetch to verify patterns, check for known bugs, and confirm the correct fix approach before implementing. Never rely on training data alone.
- **Use sequential thinking** before implementing — decompose the problem, verify the root cause, and confirm the fix is correct.
- **If no real issues exist, say so.** Not every codebase has actionable problems. Don't invent issues to fix.
- **Regression vs flakiness:** A 3/3 → 0/3 jump is a fixable regression. A 3/3 → 2/3 drop is inherent flakiness (probabilistic attacks). Don't "fix" what's inherently probabilistic.
- **Fix both ends:** When a test fails, check BOTH the implementation AND the test runner. Test harnesses can have bugs too.

## Deploy

`docs/` is gitignored. GitHub Pages auto-deploys from `docs/` on push to `main`.

```bash
bun run build
git add -f docs/           # CRITICAL — blank screen without -f
git add -A
git status                 # verify before committing (check for unwanted files like test-results/)
git commit --no-verify -m "type: description"
git push origin main
```

**Stable filenames** (`vite.config.ts`): `entryFileNames: 'assets/index.js'` — no content hash on entry JS/CSS. Prevents blank page when cached HTML references a vanished hashed file. Trade-off: no CDN cache busting on filename change.

**CDN cache caveat**: GitHub Pages sets `cache-control: max-age=600` (10 min). After deploy, cached `index.js` may serve stale code. If users report issues post-deploy, tell them to hard-refresh or wait 10 min. To verify the deployed bundle has a fix: `curl -sL "https://yuzu-octopus.github.io/RsaWebTool/assets/index.js?cb=1" | grep "expected string"`.

**Verification after deploy**: `typecheck → lint → build` before pushing. After push, verify the page renders by fetching with a cache-busting param: `curl -sL "https://yuzu-octopus.github.io/RsaWebTool/?cb=$(date +%s)" | grep -c "RSA"`.

CI workflow at `.github/workflows/deploy.yml` runs `lint → build` and deploys to GitHub Pages.

## Pre-commit Hook (global: `~/.config/git/hooks/`)

- Blocks `.env` files → use `--no-verify`
- Blocks high-confidence secrets (API keys, tokens, private keys, DB URLs)
- Never `--no-verify` for secrets — only for .env files

## Architecture

**Browser-only RSA CTF tool on GitHub Pages.** E2E verification via L5 Playwright test suite; quick check via `typecheck → lint → build`.

### Project Stack
| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 + Rolldown |
| UI | Material UI 9 (Dracula themed) |
| Math Rendering | KaTeX 0.16 via `ProofRenderer` |
| Code Highlighting | react-syntax-highlighter (Dracula) |
| Math Engine | SageMathCell (embedded `makeSagecell` JS) |
| External API | FactorDB (via Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |

### Key Directories
| Path | Tracked | Purpose |
|------|---------|---------|
| `src/` | ✓ | App source (attacks, utils, hooks, components, context, theme) |
| `src/attacks/` | ✓ | 52 attack files + `index.ts` barrel (flat directory) |
| `src/utils/testcases/core.ts` | ✓ | `randomPrime()`, `generateKeyPair()`, `encrypt()`, `TESTCASE_BITS` |
| `src/utils/bigint.ts` | ✓ | `gcd()`, `modPow()`, `modInverse()`, `isqrt()`, `extendedGcd()` |
| `src/utils/factordb.ts` | ✓ | FactorDB client (CORS-proxied) + `reportFactor()` + `extractPQ()` |
| `src/utils/converters.ts` | ✓ | Hex/dec/base64 converters + `detectFormat()` + `parsePEM()` |
| `src/hooks/useSageMath.ts` | ✓ | Embedded SageMathCell executor (concurrency=6 for MagicPanel, 3 default) |
| `src/hooks/useDragResize.ts` | ✓ | Reusable drag-to-resize hook (axis, min, max, storageKey, onResize) |
| `src/hooks/useAppContext.ts` | ✓ | `useContext(AppContext)` wrapper with null check |
| `src/context/` | ✓ | AppContext provider + ctx.ts |
| `src/components/` | ✓ | 8 components (InputPanel, OutputPanel, Sidebar, MagicPanel, ProofIndex, ProofRenderer, RsaCalculator, ErrorBoundary) |
| `src/styles/inputSx.ts` | ✓ | Shared Dracula-themed MUI TextField SxProps |
| `src/theme/dracula.ts` | ✓ | MUI theme with full Dracula palette (`cssVariables: true`) |
| `src/config.ts` | ✓ | `FACTORDB_PROXY_URL` — overridable via env var |
| `scripts/` | ✓ (source) | Test scripts: `test-playwright.ts`, `test-attacks.ts`, `gen-missing.ts`, `test-sage-docker.ts` |
| `workers/` | ✓ (source) | Cloudflare Worker CORS proxy — `factordb-proxy.js`, `package.json`, `wrangler.toml`, `DEPLOY.md` |
| `.env.example` | ✓ | Documents `VITE_FACTORDB_PROXY_URL` env var |
| `docs/` | ✗ (gitignored, force-added on deploy) | GitHub Pages build output |
| `workers/node_modules/` | ✗ | Node.js deps (use `npm install` in `workers/`) |
| `workers/.wrangler/` | ✗ | Wrangler cache |
| `test-results/` | ✗ | Playwright test output |
| `scripts/test-results/` | ✗ | Attack test artifacts |
| `.opencode/` / `.superpowers/` | ✗ | Agent config (local only) |
| `tests/` | — | Empty — no test files |

### Entry Points
- `index.html` — loads SageMathCell script + Google Fonts (JetBrains Mono) + mounts React at `#root`
- `src/main.tsx` — React root (StrictMode)
- `src/App.tsx` — top-level layout (ThemeProvider, CssBaseline, AppProvider, Sidebar, content panels, OutputPanel, Snackbar toast)
- `src/attacks/index.ts` — barrel: `attacks[]`, `CATEGORIES`, `attacksByCategory`, `testcaseGenerators`

### App Components

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `Sidebar.tsx` | Collapsible category tree (5 categories) + Magic/Proofs/Calculator nav + FactorDB/SageCell service status indicators |
| `InputPanel` | `InputPanel.tsx` | Shows when attack is selected: Explanation tab (KaTeX proof) / Input tab (form fields + Generate Testcase + Run/Stop). Shows completion toast; auto-submits p,q to FactorDB for Factorization category |
| `OutputPanel` | `OutputPanel.tsx` | Results display (SyntaxHighlighter) + converters (Hex→Bytes, Hex→ASCII, Dec→Hex, etc.) + copy + history (cap 50) + Notepad (drag-resize via `useDragResize` hook) |
| `MagicPanel` | `MagicPanel.tsx` | Paste-all mode: auto-detect params via regex, show applicable attacks preview, priority-ordered parallel execution (concurrency=6), early-stop on first success. Shows success toast; auto-submits p,q to FactorDB for Factorization category |
| `RsaCalculator` | `RsaCalculator.tsx` | Pure BigInt calculator: Key Gen / Encrypt / Decrypt tabs (no SageCell needed) |
| `ProofIndex` | `ProofIndex.tsx` | Searchable list of all 52 attack proofs |
| `ProofRenderer` | `ProofRenderer.tsx` | KaTeX parser: display math (align\*/equation\*/gather\*/aligned), inline math ($...$ + auto-wrap heuristics), itemize lists, heading detection, References section stripper |

### Attack System
- Each file in `src/attacks/` exports `{ attack: Attack, generateTestcase: () => Record<string, string> }`
- `src/attacks/index.ts` aggregates: `attacks[]` (52), `CATEGORIES` (5), `attacksByCategory`, `testcaseGenerators`
- Adding a new attack = 1 file + 1 import line + 2 array entries in `index.ts`. Zero UI changes.
- `TESTCASE_BITS = { p: 256, q: 256 }` → n ≈ 512-bit (small factors for factorization attacks to avoid SageCell timeout)

### Attack Categories Breakdown
| Category | Count | IDs |
|----------|-------|-----|
| **Factorization** | 18 | fermat, wiener, boneh-durfee, ecm, ecm2, pollard-p1, pollard-rho, williams-p1, quadratic-sieve, squfof, binary-poly-factor, small-fraction, batch-gcd, multi-prime, gimmicky-primes, close-prime, novelty-primes, common-prime-rsa |
| **Partial Key / Lattice** | 9 | simple-lattice, partial-d, partial-pq-bits, small-crt-exp, dp-dq-leak, linearly-related-primes, dependent-prime, partial-key-exposure, implicit-key-exposure |
| **Message / Protocol** | 14 | common-modulus, hastad, franklin-reiter, coppersmith-short-pad, hastad-linear-pad, lsb-oracle, rsa-crt-fault, non-coprime-exp, cube-root-crt, common-factor, homomorphic-forgery, bleichenbacher-sig, related-message, hastad-broadcast |
| **Oracle** | 3 | bleichenbacher, manger, biased-lsb |
| **Advanced** | 8 | roca, nitros, factordb-lookup, known-plaintext, small-public-exp, multi-prime-gcd, phi-leak, parity-oracle |

### 8 Attacks with frontendCheck
These run fully in the browser (no SageCell needed) when sufficient parameters are provided:
- **batch-gcd** — BigInt GCD computation across comma-separated modulus list
- **common-factor** — GCD of two moduli to detect shared prime factors
- **common-prime-rsa** — GCD chain across multiple moduli
- **dp-dq-leak** — Decrypt directly from leaked d<sub>p</sub> + d<sub>q</sub>
- **factordb-lookup** — Fetch pre-computed factorization from FactorDB API
- **implicit-key-exposure** — Lattice GCD across related keys
- **multi-prime-gcd** — GCD across multi-prime setups
- **phi-leak** — Decrypt directly from leaked φ(n)

### Attack Interface (`src/types/index.ts`)
```ts
type AttackCategory = 'Factorization' | 'Partial Key / Lattice' | 'Message / Protocol' | 'Oracle' | 'Advanced';

type Attack = {
  id: string;
  name: string;
  description: string;
  category: AttackCategory;
  inputs: InputField[];
  sageTemplate: (vals: Record<string, string>) => string;
  proof: string;
  frontendCheck?: (vals: Record<string, string>) => Promise<string | null>;
  applicableCheck: (vals: Record<string, string>) => boolean;
  priority: 'high' | 'medium' | 'low';
  generateTestcase?: () => Record<string, string>;
}
```
`CATEGORIES` array uses `satisfies readonly AttackCategory[]` for bidirectional type safety.

### External Services
- **FactorDB**: CORS proxy at `https://factordb-proxy.octopusyuzu.workers.dev` (Cloudflare Worker in `workers/`). GET /query for lookups, POST /report for submitting factorized results. `reportFactor()` / `extractPQ()` in `src/utils/factordb.ts`
- **FactorDB auto-submit**: When a Factorization-category attack succeeds, `extractPQ()` parses SageCell output for `p=`, `q=` lines and submits via `reportFactor()` (fire-and-forget POST). Status shown in notification toasts.
- **SageMathCell**: embedded `makeSagecell` JS only (`/service` REST API is dead — Cloudflare 520)
- SageMathCell has **no internet** (firewall since 2021) — attack templates must be pure math
- SageMathCell 120s timeout in `useSageMath.ts` (10s for script load + 110s for execution)

### SageMath Execution Pipeline
1. **Offscreen container**: hidden `<div>` at `-9999px` with absolute positioning
2. **Script injection**: `<script type="text/x-sage">` with generated template code
3. **Execution**: `window.sagecell.makeSagecell()` targets container with `autoeval: true`
4. **Polling**: `MutationObserver` waits for `.sagecell_stdout` to appear, settles after 500ms
5. **Timeout**: 120s default (10s for SageCell script load), returns error on timeout
6. **Cleanup**: container removed from DOM, observer disconnected

### Parallel Execution (Magic Mode)
- `useSageMathParallel()` with concurrency cap of 6
- Queue-based dispatch: new execution starts as soon as a slot opens
- `AbortController` stops all remaining jobs when first `=SUCCESS` is detected
- `onResult` callback enables early-stop logic

## SageMath Gotchas (Hard-Earned)

- **No blank lines inside function/loop bodies** — SageMath interactive mode treats blank lines as cell separators, causing `break/return outside loop/function` errors. This is the single most common bug.
- `^` is XOR for Python `int` — always use `**` for exponentiation
- `.bits()` returns bit positions list — use `.nbits()` for bit count
- Always wrap numeric inputs in `Integer()`
- No `return` at module level — use `quit()` instead (`return` is fine inside functions)
- No nested `def` inside `for` loops at module level — move function definitions outside or inline
- Multi-line string values use `"""..."""` triple quotes, not single-line
- `file.integer_nth_root()` doesn't exist — use `file.nth_root()` with try/except
- `file.continued_fraction()` doesn't exist on Integer — use `continued_fraction(QQ(e)/QQ(n))` global function
- `small_roots(X=..., beta=...)` — `beta=0.5` for sqrt(n) factor search
- `prime_range(start, end)` is faster than `range()` + `is_prime()`
- Oracle attacks: save `orig_c = Integer(${vals.c})` before loop mutation
- 120s timeout (10s load + 110s exec) — factorization testcases must use small factors to fit the window
- `ecmfactor()` returns `(B1, curve_count)` tuple, not factor — use `n.factor(algorithm='ecm')` instead
- `nth_root(exp, truncate_mode=True)` for exact integer roots (avoid `integer_nth_root()` which doesn't exist)
- `range(int(e) + 1)` to avoid Sage Integer → Python range error with `e=3`
- `power_mod()` is non-standard — use `pow(m, e, n)` or `power_mod(m, e, n)` (Sage has `power_mod`)

### Test Runner Gotchas (test-playwright.ts)

- **Cached text race condition (line 188)**: The `__sage_text` fallback must check for `=SUCCESS` or `=FAILED` markers before breaking. Breaking on any non-empty intermediate output (e.g., "Brute forcing...") causes false failures for slow-running attacks. The known-plaintext regression (3/3 → 0/3) was caused by this bug — SageCell prints "Brute forcing..." at ~400ms, the poll catches it, and the cached fallback fires before the loop completes at ~1.6s.

## TypeScript Config

```json
{
  "erasableSyntaxOnly": true,
  "verbatimModuleSyntax": true,
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "target": "ES2023",
  "noFallthroughCasesInSwitch": true,
  "noUncheckedSideEffectImports": true
}
```
- No parameter properties in constructors
- Use `import type` for type-only imports
- No `any` types
- React 19, MUI 9, TypeScript 6

## UI Conventions

- Dracula palette (`src/theme/dracula.ts`): background=#282a36, currentLine=#44475a, foreground=#f8f8f2, comment=#6272a4, cyan=#8be9fd, green=#50fa7b, orange=#ffb86c, pink=#ff79c0, purple=#bd93f9, red=#ff5555, yellow=#f1fa8c
- Font: `'JetBrains Mono'` (400, 500, 700)
- **NO emojis** — Material Icons only (`@mui/icons-material`)
- NO box-shadows — borders + bg colors only
- Scrollbar: 12px, `border: 2px solid transparent`, `backgroundClip: padding-box`
- OutputPanel: 200-600px resizable, width persisted in localStorage
- Notepad: 80-200px drag-resize, 1h localStorage expiry
- Buttons: outlined style, purple/cyan/red variants, JetBrains Mono label
- Snackbar toast: top-center, 3s auto-dismiss, Dracula bg/fg via `slotProps.content.sx`, severity icon (green=success, red=error, cyan=info)
- Shared input styles: `src/styles/inputSx.ts` — `InputLabelProps.sx` + `inputProps.sx` with Dracula colors, imported by 4 components
- Drag-resize: `useDragResize` hook in `src/hooks/useDragResize.ts` — axis ('horizontal' | 'vertical'), min/max bounds, optional localStorage key + onResize callback
- `cssVariables: true` in `createTheme()` — enables CSS custom property injection for runtime overrides
- `theme-color` meta tag at `#282a36` in `index.html` (mobile browser chrome color)

## Workers (FactorDB Proxy)

Two endpoints:
- **GET /query** — `?n=<hex>` — cached CORS proxy for `factordb.com/api`
- **POST /report** — `{number, factors[]}` — submits factorization to `factordb.com/report` (form-encoded)

```bash
cd workers
npm install           # NOT bun — wrangler requires Node
npx wrangler deploy   # deploy to Cloudflare Workers
npx wrangler dev      # local dev on :8787
```

Gitignored: `workers/node_modules/`, `workers/.wrangler/`, `workers/bun.lock`, `workers/package-lock.json`

After deploy, copy the worker URL into `src/config.ts → FACTORDB_PROXY_URL`.

## Problem-Solving Heuristics for SageMathCell Attacks

These patterns emerged from fixing 8+ attacks from 0/3 to 3/3 across multiple sessions.

### Fallback Chain Pattern (Always)
- **Never trust a single SageMath method** — `small_roots` over composite N throws in SageCell under Docker Rosetta emulation. Always: `try/except` → Python-native fallback → brute-force.
- **Narrow try/except boundaries** — wrap only the flaky call, not the whole strategy. A broad `except` at the outer level swallows fallback code.
- **Horner evaluation** — in brute-force loops, precompute polynomial coefficients once, evaluate via `((A*m + B)*m + C)*m + D` instead of `power_mod` (modular exponentiation in tight SageCell loops is slow).

### Detection vs Exploitation (ROCA Lesson)
- **Don't break at first match** — when searching for a signature, track the BEST match across all candidates, not the first. First-match breaks on trivial false positives (M=2 matches every odd n).
- **Separate phases** — detection can be coarse/fast, exploitation needs verified candidates. Don't conflate.

### Regression vs Flakiness
- **A 3/3 → 0/3 jump is a regression** (fixable bug). A 3/3 → 2/3 drop is flakiness (inherently probabilistic). Don't waste time "fixing" the latter.
- **Probabilistic attacks**: williams-p1 (p+1 smoothness) and partial-pq-bits (Coppersmith lattice) are inherently probabilistic. 2/3 is expected.

### Test Harness Debugging
- **Fix both ends** — when a test fails, check BOTH the implementation AND the test runner. A race condition in the poll loop caused a 3/3 → 0/3 regression.
- **Instrument before trust** — validate test harness output before trusting pass/fail signals.

## Safety & File Conventions

- Use `trash` for file deletion (installed at `/usr/bin/trash`) — never `rm`
- Create `.bak` backup before overwriting non-git files
- `docs/` is a build artifact — never edit manually
- `--no-verify` for .env files only (pre-commit blocks secrets)
- `.opencode/` is gitignored — agent memory stays local

### .gitignore Conventions

Source code is tracked; build artifacts, deps, and local config are not.

| Category | Tracked | Ignored |
|----------|---------|---------|
| Source | `src/`, `scripts/*.ts`, `workers/factordb-proxy.js`, `workers/wrangler.toml`, `workers/package.json` | — |
| Build output | — | `docs/`, `dist`, `dist-ssr` |
| Dependencies | — | `node_modules`, `workers/node_modules/` |
| Test artifacts | — | `test-results/`, `scripts/test-results/` |
| Environment | `.env.example` | `.env`, `.env.*.local` |
| IDE/Editor | — | `.vscode/`, `.idea`, `.DS_Store`, `*.sw?` |
| Logs | — | `*.log`, `logs/` |
| Agent config | — | `.opencode/`, `.superpowers/`, `.playwright-mcp/` |

Workers Node dep: `npm install` inside `workers/` (NOT `bun install` — wrangler requires Node). `workers/package-lock.json` is gitignored; ensure `workers/bun.lock` is also ignored.

## Key Patterns from Review Sessions

### ErrorBoundary
- Class component (`getDerivedStateFromError` + `componentDidCatch`) wraps content panels in `App.tsx` (InputPanel, MagicPanel, ProofIndex, RsaCalculator)
- Dracula-themed fallback UI (red heading, comment-colored error message, centered flex layout)
- Accepts optional `fallback` prop for custom error UI
- Prevents render crashes from taking down sidebar, output panel, or snackbar

### combineSignals() Fallback
- `useSageMath.ts` feature-detects `AbortSignal.any()` (Chrome 93+, Firefox 97+, Safari 15.4+)
- Fallback creates manual `AbortController` listening for abort on any input signal
- Already-aborted signals propagate immediately
- Used to merge user-provided abort signals with lifecycle teardown signals

### AttackCategory Union
- `src/types/index.ts`: `type AttackCategory = 'Factorization' | 'Partial Key / Lattice' | 'Message / Protocol' | 'Oracle' | 'Advanced'`
- `Attack.category` narrowed from `string` to `AttackCategory`
- `CATEGORIES` in `src/attacks/index.ts` uses `as const satisfies readonly AttackCategory[]`
