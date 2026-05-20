# RSA Web Tool — Architecture & Context

## Build
- TypeScript 6 + Vite + Rollup (Rolldown), React 19, MUI 9
- `erasableSyntaxOnly: true` — no parameter properties in constructors
- Output to `docs/` for GitHub Pages
- Commands: `bun run dev`, `bun run build`

## Runtime Constraints
- **Browser-only** (GitHub Pages — no backend server)
- All computation must happen client-side via embedded JS or CORS-proxied APIs

## FactorDB API

### Problem
`https://factordb.com/api` returns JSON but **no CORS headers** — browser `fetch` is blocked.

### Solution
Cloudflare Worker CORS proxy at `https://factordb-proxy.octopusyuzu.workers.dev`
- Proxies `?query=N` and `?id=N` to FactorDB API
- Adds `Access-Control-Allow-Origin: *` + caching headers
- Code: `workers/factordb-proxy.js`
- Deployed via `wrangler deploy` from `workers/` directory

### Frontend Integration
- `src/config.ts` — exports `FACTORDB_PROXY_URL` (env-aware with fallback)
- `src/utils/factordb.ts` — typed client:
  - `queryFactorDB(n)` — fetches proxy, returns `{id, status, factors}`
  - `formatFactorDBResult(r)` — formats factors to string like `"3 × 5 × 823"`
  - `setFactorDBProxy(url)` — sets proxy URL at runtime
- `src/App.tsx` — calls `setFactorDBProxy(FACTORDB_PROXY_URL)` on mount

## SageMathCell

### Problem
`makeSagecell` embedded JS approach is the **only** working API.
- `api.sagemath.org` — DNS dead
- `sagecell.sagemath.org/service` — returns Cloudflare 520
- `/service` REST API is effectively dead, no CORS proxy can fix a 520

### Solution
Use embedded `makeSagecell` JS for all SageMath computation.
- `src/hooks/useSageMath.ts` — `createSageMathExecutor()` factory, off-screen container (`position: absolute; left: -9999px`), MutationObserver + AbortSignal
- SageCell cells have **no internet** (SageMath firewall since 2021) — all templates must be pure math code, no `requests` / `urllib`

## Attack System

### Attack Type (`src/types/index.ts`)
```ts
type Attack = {
  id, name, category, description, inputs: InputField[],
  sageTemplate: (vals) => string, proof: string,
  frontendCheck?, applicableCheck, priority,
  generateTestcase?: () => Record<string, string>
}
```

### frontendCheck Pattern
Optional async function `(vals: Record<string, string>) => Promise<string | null>` on Attack objects.
- Run **before** SageCell in `InputPanel.tsx` and `MagicPanel.tsx`
- If returns non-null, use that result and skip SageCell
- If returns null, fall through to SageCell as before
- Graceful degradation: if proxy is down/unconfigured, FactorDB frontendCheck returns null

### Attacks with FRONTENDCheck (4 total)
| Attack | File | Implementation |
|--------|------|----------------|
| FactorDB Lookup | `factordb-lookup.ts` | `queryFactorDB` → format result |
| Phi(n) Leak | `phi-leak.ts` | BigInt quadratic solver (discriminant + `isqrt`) |
| Batch GCD | `batch-gcd.ts` | BigInt GCD across multiple moduli |
| Common Factor | `common-factor.ts` | BigInt `gcd(c, n)` |

### Attacks Without FrontendCheck
All other attacks (48) use SageCell only.

## Attack File Structure

Each attack is a self-contained file in `src/attacks/` — all metadata, exploit template, proof, and testcase generator in one place:

```
src/attacks/
  index.ts              — Barrel export: aggregates all 52 attacks, CATEGORIES, attacksByCategory, testcaseGenerators
  fermat.ts             — { attack: Attack, generateTestcase: () => Record<string, string> }
  wiener.ts             — Same pattern (all 52 attacks follow this)
```

Each attack file exports:
- `attack: Attack` — full Attack object (id, name, inputs, sageTemplate, proof, priority, applicableCheck, frontendCheck?, generateTestcase?)
- `generateTestcase: () => Record<string, string>` — attack-specific testcase generator

**UI is completely decoupled** — components import from `src/attacks` and see only the aggregated `attacks[]` array. Adding a new attack = 1 file + 1 import line. Zero UI changes needed.

Testcase bit size is centralized in `src/utils/testcases/core.ts`:
```ts
export const TESTCASE_BITS = { p: 256, q: 256 }; // n ≈ 512-bit
```

### Total: 52 attacks across 5 categories

| Category | Count | Files |
|----------|-------|-------|
| Factorization | 17 | `fermat.ts` through `novelty-primes.ts` |
| Partial Key / Lattice | 7 | `simple-lattice.ts` through `dependent-prime.ts` |
| Message / Protocol | 12 | `common-modulus.ts` through `bleichenbacher-sig.ts` |
| Oracle | 3 | `bleichenbacher.ts` through `biased-lsb.ts` |
| Advanced | 8 | `roca.ts` through `parity-oracle.ts` |

## Source Structure

```
src/
  App.tsx                          — Root: ThemeProvider, CssBaseline, AppProvider, layout
                                     manages outputWidth state (200-600px, persisted in localStorage)
  main.tsx                         — Entry point (StrictMode)
  config.ts                        — FACTORDB_PROXY_URL constant
  types/index.ts                   — Attack, InputField, HistoryEntry, AppContextType
  context/AppContext.tsx           — React context: selectedAttack, viewMode, output, history (cap 50)
  theme/dracula.ts                 — MUI Dracula theme + scrollbar overrides
  hooks/useSageMath.ts             — SageMath executor: `createSageMathExecutor()`, `useSageMath()`, `useSageMathParallel()` (concurrency=3)
  utils/bigint.ts                  — gcd(a,b) + isqrt(x) BigInt utilities + modPow + modInverse + extendedGcd
  utils/converters.ts              — hex/dec/base64 converters + detectFormat() + parsePEM()
  utils/factordb.ts                — FactorDB client (query, format, proxy setter, 10s timeout)
  utils/testcases/core.ts          — randomPrime(), generateKeyPair(), encrypt(), isPrimeMR(), TESTCASE_BITS
  vite-env.d.ts                    — Vite env type declarations
  components/
    InputPanel.tsx                 — Attack input form + Generate Testcase + Run/Stop + proof tab
    OutputPanel.tsx                — Results display (Prism/Dracula) + converters + copy + history
                                     resizable via left-edge drag handle (200-600px, 1px visible line, 4px grab area)
                                     receives width + onWidthChange props from App.tsx
                                     includes Notepad (drag-resizable textarea, 80-200px, 1h localStorage expiry)
    MagicPanel.tsx                 — Generate Testcase + auto-detect format, applicableCheck filter,
                                     priority-ordered parallel execution with early stop
                                     Stop button, progress bar, applicable preview, results summary
    Sidebar.tsx                    — Collapsible category tree + Magic/Proofs/Calculator buttons + service status
    RsaCalculator.tsx              — Pure BigInt calculator: Key Gen / Encrypt / Decrypt tabs
    ProofIndex.tsx                 — Searchable index of all attacks ("Proofs Index" title)
    ProofRenderer.tsx              — KaTeX renderer: parseProof → segments (text/displayMath/list) → render
                                     hides References section, handles $...$ and \(...\) delimiters
  attacks/
    index.ts                       — Barrel export: all 52 attacks, CATEGORIES, attacksByCategory, testcaseGenerators
    fermat.ts                      — { attack, generateTestcase } — close primes
    wiener.ts                      — { attack, generateTestcase } — small d
    ... (52 individual attack files, flat directory)
```

## Workers Directory (core files tracked in git)

Gitignored: `workers/node_modules/`, `workers/.wrangler/`, `workers/bun.lock`
Tracked: `factordb-proxy.js`, `wrangler.toml`, `package.json`, `DEPLOY.md`

## Relevant Files

| File | Purpose |
|------|---------|
| `workers/factordb-proxy.js` | Cloudflare Worker — CORS proxy for FactorDB |
| `workers/package.json` | wrangler deps + deploy script |
| `workers/wrangler.toml` | Worker config |
| `src/config.ts` | `FACTORDB_PROXY_URL` constant |
| `src/utils/bigint.ts` | `gcd()`, `isqrt()`, `modPow()`, `modInverse()`, `extendedGcd()` BigInt utilities |
| `src/utils/factordb.ts` | FactorDB client (query + format) |
| `src/utils/converters.ts` | Hex/dec/base64 converters + `detectFormat()` |
| `src/utils/testcases/core.ts` | `randomPrime()`, `generateKeyPair()`, `encrypt()`, `isPrimeMR()`, `TESTCASE_BITS` |
| `src/types/index.ts` | `Attack` type with `frontendCheck`, `applicableCheck`, `generateTestcase?` |
| `src/attacks/index.ts` | Barrel export: all 52 attacks, CATEGORIES, attacksByCategory, testcaseGenerators |
| `src/components/InputPanel.tsx` | Imports from `../attacks`, runs frontendCheck before SageCell, Generate Testcase button |
| `src/components/MagicPanel.tsx` | Imports from `../attacks`, priority-ordered parallel execution, early stop, Generate Testcase |
| `src/components/ProofRenderer.tsx` | KaTeX proof renderer (handles `$...$` and `\(...\)` inline math, hides References) |
| `src/components/ProofIndex.tsx` | Imports from `../attacks`, searchable proof index |
| `src/components/OutputPanel.tsx` | Results display + converters + history + drag-resize handle + Notepad |
| `src/components/Sidebar.tsx` | Imports from `../attacks`, navigation tree (Material Icons) + service status indicators |
| `src/components/RsaCalculator.tsx` | Pure BigInt calculator: Key Gen / Encrypt / Decrypt tabs |
| `src/hooks/useSageMath.ts` | Embedded makeSagecell executor |
| `src/context/AppContext.tsx` | App state provider |
| `src/theme/dracula.ts` | Dracula theme + CssBaseline overrides |
| `src/App.tsx` | Inits FactorDB proxy URL on mount, manages outputWidth state |

## Key Conventions
- Font: `'JetBrains Mono'` throughout
- **NO emojis** — use Material Icons only (`@mui/icons-material`)
- SageMath: use `Integer()` not `int()`; use `**` not `^` (Sage `^` is XOR for Python ints)
- Attack templates must be pure math (SageCell has no internet since 2021)
- SageCell container: off-screen (`position: absolute; left: -9999px`)
- Proof format: Theorem → Prerequisites (itemize) → Proof (align*) → Explanation → References
- `\qed` in align blocks → rendered as `∎` tombstone symbol
- ProofRenderer hides References section (both `References:` and `\textbf{References:}` variants)
- Dracula theme, no `any` types, direct KaTeX rendering for proofs
- Build output to `docs/` for GitHub Pages
- `docs/` is in `.gitignore` but must be force-committed: `git add -f docs/`
- Pre-commit hook blocks `.env.example` — use `git commit --no-verify`
- `TESTCASE_BITS = { p: 256, q: 256 }` → n ≈ 512-bit

## Known Patterns & Gotchas

### SageMath Syntax
- `^` is **XOR** for Python ints in SageMath — always use `**` for exponentiation
- SageMath `Integer` type has `.bits()` returning bit positions list, not bit count — use `.nbits()` for bit count
- `small_roots(X=..., beta=...)` — `beta` should be `0.5` when looking for factor of size `sqrt(n)`
- Use `prime_range(start, end)` instead of `range(start, end)` + `is_prime()` for performance

### Oracle Attack Verification
- Save original ciphertext before loop mutation: `orig_c = Integer(${vals.c})`
- Compare against `orig_c`, not the modified `c` variable

### ProofRenderer
- Handles both `$...$` and `\(...\)` inline math delimiters
- Regex for heading detection: `/^(?:\\textbf\{)?(Theorem|Prerequisites|Proof|References)(?:\})?:\s*(.*)/s`
- Stops rendering at References section

### OutputPanel Resizing
- Width managed by App.tsx state, persisted in `localStorage` as `outputPanelWidth`
- Range: 200–600px, default: 300px
- Drag handle on left edge, cursor changes to `col-resize`

### MagicPanel
- `applicableCheck` wrapped in try/catch to prevent single bad check from crashing the filter
- Attacks sorted by priority (high→medium→low) before execution
- `executeAll` accepts `onResult` callback — returns `true` to abort remaining via AbortController
- Concurrency=3, early stop on first success, remaining jobs marked as `aborted`

### Notepad
- Collapsible textarea in OutputPanel above History section
- Drag-resizable via 4px grab bar above "Notepad" button (80-200px range)
- localStorage persistence with 1h expiry (`notepad` key: `{text, timestamp}`)
- Height persisted separately (`notepadHeight` key)

### RSA Calculator
- New `calculator` viewMode, pure BigInt (no SageCell)
- 3 tabs: Key Gen (p,q,e → n,φ,d), Encrypt (m,n,e → c), Decrypt (c,n,d or c,n,p,q,e → m)
- Decrypt tries `d` first, falls back to computing from `p,q,e` if not provided
- Auto-detects hex/decimal input format

### Service Status
- Sidebar shows FactorDB proxy and SageMathCell availability on mount
- FactorDB: 5s timeout fetch to `?query=15`
- SageMathCell: polls for `window.sagecell` with 8s timeout

### Scrollbar Styling
- 12px width with `border: 2px solid transparent` + `backgroundClip: padding-box` for visual padding
- OutputPanel left-edge drag handle: 4px grab area, 1px visible line via `::after` pseudo-element

### Testcase Generation at 512-bit
- Factorization attacks that would timeout on random 512-bit semiprimes generate n with at least one small factor:
  - Pollard's rho: 40-bit factor
  - ECM/ecm2: 60-bit factor
  - Quadratic Sieve: 60-bit factor
  - SQUFOF: 16-bit factor (trial division bound)
- Coppersmith attacks: bound is N^(beta^2/deg). For 512-bit N, beta=0.5 gives N^0.25 ≈ 2^128
- ROCA/Nitros: need proper M construction with 5000+ retry attempts for prime generation
- Parity oracle: needs 512 responses for 512-bit n (one per bit)

## What's Blocked
- None. Proxy is deployed, builds pass, app is live on GitHub Pages.

## How to Deploy
```bash
bun run build                           # outputs to docs/
git add -f docs/                        # force-add build artifacts (docs/ is gitignored)
git add -A && git commit --no-verify    # --no-verify for .env.example
git push origin main                    # GitHub Pages auto-deploys from docs/
```
