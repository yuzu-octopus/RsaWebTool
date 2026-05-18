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
  frontendCheck?, applicableCheck, priority
}
```

### frontendCheck Pattern
Optional async function `(vals: Record<string, string>) => Promise<string | null>` on Attack objects.
- Run **before** SageCell in `InputPanel.tsx` and `MagicPanel.tsx`
- If returns non-null, use that result and skip SageCell
- If returns null, fall through to SageCell as before
- Graceful degradation: if proxy is down/unconfigured, FactorDB frontendCheck returns null

### Attacks with FrontendCheck (4 total)
| Attack | File | Implementation |
|--------|------|----------------|
| FactorDB Lookup | `advanced.ts` | `queryFactorDB` → format result |
| Phi(n) Leak | `advanced.ts` | BigInt quadratic solver (discriminant + `isqrt`) |
| Batch GCD | `factorization2.ts` | BigInt GCD across multiple moduli |
| Common Factor | `message-protocol.ts` | BigInt `gcd(c, n)` |

### Attacks Without FrontendCheck
All other attacks (~43) use SageCell only.

## Source Structure

```
src/
  App.tsx              — Root: ThemeProvider, CssBaseline, AppProvider, layout
  main.tsx             — Entry point (StrictMode)
  config.ts            — FACTORDB_PROXY_URL (env-aware)
  types/index.ts       — Attack, InputField, HistoryEntry, AppContextType
  context/AppContext.tsx  — React context: selectedAttack, viewMode, output, history (cap 50)
  theme/dracula.ts     — MUI Dracula theme + scrollbar overrides
  hooks/useSageMath.ts — SageMath executor (single + parallel with concurrency=3)
  utils/bigint.ts      — gcd(a,b) + isqrt(x) BigInt utilities
  utils/converters.ts  — hex/dec/base64 converters + detectFormat()
  utils/factordb.ts    — FactorDB client (query, format, proxy setter, 10s timeout)
  vite-env.d.ts        — Vite env type declarations
  components/
    InputPanel.tsx     — Attack input form + run button + proof tab (frontendCheck → SageCell)
    OutputPanel.tsx    — Results display (Prism/Dracula) + converters + copy + history
    MagicPanel.tsx     — Auto-detect format, applicableCheck filter, parallel frontendCheck + SageCell
    Sidebar.tsx        — Collapsible category tree + Magic/Proofs buttons + footer
    ProofIndex.tsx     — Searchable index of all attacks
    ProofRenderer.tsx  — KaTeX renderer: parseProof → segments (text/displayMath/list) → render
  data/attacks/
    index.ts           — Aggregates all attacks, CATEGORIES, attacksByCategory
    factorization.ts   — 9 attacks: Fermat, Wiener, Boneh-Durfee, ECM, ECM2, Pollard p-1, Pollard rho, Williams p+1, Quadratic Sieve
    factorization2.ts  — 8 attacks: SQUFOF, Binary Poly Factor, Small Fraction, Batch GCD, Multi-Prime, Gimmicky Primes, Close-Prime, Novelty Primes
    partial-key.ts     — 7 attacks: Simple Lattice, Partial D, Partial p/q Bits, Small CRT Exp, dp/dq Leak, Linearly Related, Dependent Prime
    message-protocol.ts— 12 attacks: Common Modulus, Hastad, Franklin-Reiter, Coppersmith Short Pad, Hastad Linear Pad, LSB Oracle, RSA-CRT Fault, Non-Coprime Exp, Cube Root CRT, Common Factor, Homomorphic Forgery, Bleichenbacher Sig
    oracle.ts          — 3 attacks: Bleichenbacher PKCS#1, Manger OAEP, Biased LSB
    advanced.ts        — 8 attacks: ROCA, Nitros, FactorDB Lookup, Known Plaintext, Small Public Exp, Multi-Prime GCD, Phi(n) Leak, Parity Oracle
```

### Total: ~47 attacks across 5 categories

| Category | Count | Files |
|----------|-------|-------|
| Factorization | 17 | `factorization.ts` (9) + `factorization2.ts` (8) |
| Partial Key / Lattice | 7 | `partial-key.ts` |
| Message / Protocol | 12 | `message-protocol.ts` |
| Oracle | 3 | `oracle.ts` |
| Advanced | 8 | `advanced.ts` |

## Workers Directory (separate deployable unit, not in git)

| File | Purpose |
|------|---------|
| `workers/factordb-proxy.js` | Cloudflare Worker — CORS proxy for FactorDB API |
| `workers/package.json` | wrangler ^4.0.0 devDependency, deploy/dev scripts |
| `workers/wrangler.toml` | Worker name: `factordb-proxy`, main: `factordb-proxy.js` |
| `workers/DEPLOY.md` | Deployment instructions |

## Relevant Files

| File | Purpose |
|------|---------|
| `workers/factordb-proxy.js` | Cloudflare Worker — CORS proxy for FactorDB |
| `workers/package.json` | wrangler deps + deploy script |
| `workers/wrangler.toml` | Worker config |
| `src/config.ts` | `FACTORDB_PROXY_URL` constant |
| `src/utils/bigint.ts` | `gcd()`, `isqrt()` BigInt utilities |
| `src/utils/factordb.ts` | FactorDB client (query + format) |
| `src/utils/converters.ts` | Hex/dec/base64 converters + `detectFormat()` |
| `src/types/index.ts` | `Attack` type with `frontendCheck`, `applicableCheck` |
| `src/data/attacks/advanced.ts` | FactorDB + Phi(n) Leak with frontendCheck |
| `src/data/attacks/factorization2.ts` | Batch GCD with frontendCheck |
| `src/data/attacks/message-protocol.ts` | Common Factor with frontendCheck |
| `src/components/InputPanel.tsx` | Runs frontendCheck before SageCell |
| `src/components/MagicPanel.tsx` | Runs frontendCheck on all attacks in parallel |
| `src/components/ProofRenderer.tsx` | KaTeX proof renderer (handles `$...$` and `\(...\)` inline math) |
| `src/components/ProofIndex.tsx` | Searchable proof index |
| `src/components/OutputPanel.tsx` | Results display + converters + history |
| `src/components/Sidebar.tsx` | Navigation tree |
| `src/hooks/useSageMath.ts` | Embedded makeSagecell executor |
| `src/context/AppContext.tsx` | App state provider |
| `src/theme/dracula.ts` | Dracula theme + CssBaseline overrides |
| `src/App.tsx` | Inits FactorDB proxy URL on mount |

## Key Conventions
- Font: `'JetBrains Mono'` throughout
- SageMath: use `Integer()` not `int()`; use `**` not `^` (Sage `^` is XOR for Python ints)
- Attack templates must be pure math (SageCell has no internet since 2021)
- SageCell container: off-screen (`position: absolute; left: -9999px`)
- Proof format: Theorem → Prerequisites (itemize) → Proof (align*) → Explanation → References
- `\qed` in align blocks → rendered as `∎` tombstone symbol
- Dracula theme, no `any` types, direct KaTeX rendering for proofs
- Build output to `docs/` for GitHub Pages

## What's Blocked
- None. Proxy is deployed, builds pass, app is ready for GitHub Pages deploy.

## How to Deploy
```bash
bun run build     # outputs to docs/
git push origin   # GitHub Pages auto-deploys from docs/
```
