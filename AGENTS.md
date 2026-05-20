# RSA Web Tool — Agent Instructions

## Commands

```bash
bun run dev          # dev server (port 5173)
bun run build        # tsc -b && vite build → docs/
bun run lint         # eslint
bun run lint:fix     # eslint --fix
bun run typecheck    # tsc -b --noEmit
bun run preview      # vite preview (prod build locally)
```

**Verification order:** `typecheck → lint → build`

## Deploy

`docs/` is gitignored. GitHub Pages auto-deploys from `docs/` on push to `main`.

```bash
bun run build
git add -f docs/           # CRITICAL — docs/ is gitignored, blank screen without -f
git add -A
git status                 # verify before committing
git commit --no-verify -m "type: description"  # --no-verify: pre-commit blocks .env files
git push origin main
```

## Pre-commit Hook (global: `~/.config/git/hooks/`)

- **Blocks** any `.env` file in staged changes → use `--no-verify`
- **Blocks** high-confidence secrets (AWS keys, GitHub tokens, private keys, AI API keys, DB URLs)
- **Warns** on JWT tokens
- Never `--no-verify` for secrets — only for .env files you know are safe

## Architecture

**Browser-only** RSA CTF tool on GitHub Pages. No backend. All computation is client-side.

### Key Directories
| Path | Purpose |
|------|---------|
| `src/attacks/` | 52 individual attack files + `index.ts` barrel |
| `src/utils/testcases/core.ts` | `randomPrime()`, `generateKeyPair()`, `encrypt()`, `TESTCASE_BITS` |
| `src/utils/bigint.ts` | `gcd()`, `isqrt()`, `modPow()`, `modInverse()`, `extendedGcd()` |
| `src/utils/factordb.ts` | FactorDB client (CORS-proxied) |
| `src/hooks/useSageMath.ts` | Embedded SageMathCell executor (concurrency=3) |
| `workers/` | Cloudflare Worker CORS proxy for FactorDB |

### Attack System
- Each file in `src/attacks/` exports `{ attack: Attack, generateTestcase: () => Record<string, string> }`
- `src/attacks/index.ts` aggregates: `attacks[]`, `CATEGORIES`, `attacksByCategory`, `testcaseGenerators`
- Adding a new attack = 1 file + 1 import in `index.ts`. Zero UI changes needed.
- `TESTCASE_BITS = { p: 256, q: 256 }` → n ≈ 512-bit

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
Optional async `(vals) => Promise<string | null>`. Runs **before** SageCell in InputPanel and MagicPanel.
- Returns string → use result, skip SageCell
- Returns null → fall through to SageCell
- 4 attacks use it: `factordb-lookup`, `phi-leak`, `batch-gcd`, `common-factor`
- Graceful degradation: if proxy is down, FactorDB frontendCheck returns null

### Categories (52 attacks)
| Category | Count |
|----------|-------|
| Factorization | 17 |
| Partial Key / Lattice | 7 |
| Message / Protocol | 12 |
| Oracle | 3 |
| Advanced | 8 |

### Components
| Component | Purpose |
|-----------|---------|
| `InputPanel.tsx` | Attack input form + Generate Testcase + Run/Stop + proof tab |
| `OutputPanel.tsx` | Results display + converters + copy + history + Notepad |
| `MagicPanel.tsx` | Auto-detect format, applicableCheck filter, priority-ordered parallel execution with early stop |
| `Sidebar.tsx` | Collapsible category tree + Magic/Proofs/Calculator buttons + service status |
| `RsaCalculator.tsx` | Pure BigInt calculator: Key Gen / Encrypt / Decrypt tabs |
| `ProofIndex.tsx` | Searchable index of all attacks |
| `ProofRenderer.tsx` | KaTeX renderer, hides References section |

### External Services
- **FactorDB**: CORS proxy at `https://factordb-proxy.octopusyuzu.workers.dev` (Cloudflare Worker in `workers/`)
- **SageMathCell**: embedded `makeSagecell` JS only — `/service` REST API is dead (Cloudflare 520)
- SageMathCell has **no internet** (firewall since 2021) — attack templates must be pure math
- SageCell container: off-screen (`position: absolute; left: -9999px`)

## Critical Gotchas

### SageMath
- `^` is **XOR** for Python `int` — always use `**` for exponentiation
- `.bits()` returns bit positions list — use `.nbits()` for bit count
- `small_roots(X=..., beta=...)` — `beta=0.5` for sqrt(n) factor search
- `prime_range(start, end)` is faster than `range()` + `is_prime()`
- Oracle attacks: save `orig_c = Integer(${vals.c})` before loop mutation
- Always wrap numeric inputs in `Integer()`

### Testcase Generation (512-bit)
- Random 512-bit semiprimes **will timeout** in SageCell for factorization attacks
- Factorization testcases use small factors: Pollard's rho (40-bit), ECM (60-bit), QS (60-bit), SQUFOF (16-bit)
- Coppersmith bound: N^(beta^2/deg). For 512-bit N, beta=0.5 → N^0.25 ≈ 2^128
- ROCA/Nitros: need proper M construction with 5000+ retry attempts
- Parity oracle: needs 512 responses for 512-bit n (one per bit)

### TypeScript
- `erasableSyntaxOnly: true` — **no parameter properties** in constructors
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUnusedLocals` + `noUnusedParameters` — strict
- `strict: true` — no `any` types

### UI Conventions
- Dracula theme throughout — see `src/theme/dracula.ts`
- Font: `'JetBrains Mono'`
- **NO emojis** — Material Icons only (`@mui/icons-material`)
- NO box-shadows — borders + bg colors only
- Scrollbar: 12px width with `border: 2px solid transparent` + `backgroundClip: padding-box` trick

### MagicPanel
- `applicableCheck` wrapped in try/catch — single bad check won't crash filter
- Priority-ordered execution (high→medium→low), early stop on first success
- Concurrency=3 via `useSageMathParallel`
- `executeAll` accepts `onResult` callback — returns `true` to abort remaining via AbortController

### ProofRenderer
- Handles `$...$` and `\(...\)` inline math delimiters
- Hides References section (both `References:` and `\textbf{References:}` variants)
- Format: Theorem → Prerequisites (itemize) → Proof (align*) → Explanation → References
- `\qed` in align blocks → rendered as `∎` tombstone symbol

### OutputPanel
- Resizable 200-600px via left-edge drag handle (4px grab area, 1px visible line)
- Width persisted in `localStorage` as `outputPanelWidth`

### Notepad
- Collapsible textarea in OutputPanel above History section
- Drag-resizable via 4px grab bar (80-200px range)
- localStorage persistence with 1h expiry (`notepad` key: `{text, timestamp}`)
- Height persisted separately (`notepadHeight` key)

### RSA Calculator
- `calculator` viewMode, pure BigInt (no SageCell)
- 3 tabs: Key Gen (p,q,e → n,φ,d), Encrypt (m,n,e → c), Decrypt (c,n,d or c,n,p,q,e → m)
- Decrypt tries `d` first, falls back to computing from `p,q,e` if not provided

### Service Status
- Sidebar shows FactorDB proxy and SageMathCell availability on mount
- FactorDB: 5s timeout fetch to `?query=15`
- SageMathCell: polls for `window.sagecell` with 8s timeout

## Workers (FactorDB Proxy)

```bash
cd workers
bun install          # or npm install
npx wrangler deploy  # deploy to Cloudflare Workers
npx wrangler dev     # local dev on :8787
```

Gitignored: `workers/node_modules/`, `workers/.wrangler/`, `workers/bun.lock`

## File Safety

- Use `trash` for file deletion — never `rm`
- Create `.bak` backups before overwriting non-git files
- `docs/` is a build artifact — never edit manually
