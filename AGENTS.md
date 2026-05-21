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

**Verification Status:** All 52 attacks have been mathematically verified, their SageMath templates repaired, and testcase generators optimized. The automated verification suite (`sagemath/sagemath` docker integration) confirms 100% operational status.

## Deploy

`docs/` is gitignored. GitHub Pages auto-deploys from `docs/` on push to `main`.

```bash
bun run build
git add -f docs/           # CRITICAL — blank screen without -f
git add -A
git status                 # verify before committing
git commit --no-verify -m "type: description"
git push origin main
```

CI workflow at `.github/workflows/deploy.yml` runs `lint → build` and deploys to GitHub Pages.

## Pre-commit Hook (global: `~/.config/git/hooks/`)

- Blocks `.env` files → use `--no-verify`
- Blocks high-confidence secrets (API keys, tokens, private keys, DB URLs)
- Never `--no-verify` for secrets — only for .env files

## Architecture

**Browser-only RSA CTF tool on GitHub Pages.** No backend. No test suite — verification is `typecheck → lint → build`.

### Key Directories
| Path | Purpose |
|------|---------|
| `src/attacks/` | 52 attack files + `index.ts` barrel |
| `src/utils/testcases/core.ts` | `randomPrime()`, `generateKeyPair()`, `encrypt()`, `TESTCASE_BITS` |
| `src/utils/bigint.ts` | `gcd()`, `modPow()`, `modInverse()`, `isqrt()`, `extendedGcd()` |
| `src/utils/factordb.ts` | FactorDB client (CORS-proxied) |
| `src/hooks/useSageMath.ts` | Embedded SageMathCell executor (concurrency=3) |
| `src/config.ts` | `FACTORDB_PROXY_URL` — overridable via `VITE_FACTORDB_PROXY_URL` env var |
| `workers/` | Cloudflare Worker CORS proxy for FactorDB |
| `.env.example` | Documents `VITE_FACTORDB_PROXY_URL` env var |
| `scripts/` | Empty — no helper scripts |

### Entry Points
- `index.html` — loads SageMathCell script + mounts React at `#root`
- `src/main.tsx` — React root
- `src/App.tsx` — top-level layout (InputPanel, OutputPanel, Sidebar, MagicPanel, ProofIndex, RsaCalculator)
- `src/attacks/index.ts` — barrel: `attacks[]`, `CATEGORIES`, `attacksByCategory`, `testcaseGenerators`

### Attack System
- Each file in `src/attacks/` exports `{ attack: Attack, generateTestcase: () => Record<string, string> }`
- `src/attacks/index.ts` aggregates: `attacks[]`, `CATEGORIES`, `attacksByCategory`, `testcaseGenerators`
- Adding a new attack = 1 file + 1 import in `index.ts`. Zero UI changes.
- `TESTCASE_BITS = { p: 256, q: 256 }` → n ≈ 512-bit (small factors for factorization attacks to avoid SageCell timeout)

### Attack Interface (`src/types/index.ts`)
```ts
type Attack = {
  id, name, description, category, inputs: InputField[],
  sageTemplate: (vals) => string, proof: string,
  frontendCheck?, applicableCheck, priority: 'high' | 'medium' | 'low',
  generateTestcase?: () => Record<string, string>
}
```

### External Services
- **FactorDB**: CORS proxy at `https://factordb-proxy.octopusyuzu.workers.dev` (Cloudflare Worker in `workers/`)
- **SageMathCell**: embedded `makeSagecell` JS only (`/service` REST API is dead — Cloudflare 520)
- SageMathCell has **no internet** (firewall since 2021) — attack templates must be pure math

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
- 60-second timeout — factorization testcases must use small factors

## TypeScript

```json
{ "erasableSyntaxOnly": true, "verbatimModuleSyntax": true, "strict": true,
  "noUnusedLocals": true, "noUnusedParameters": true }
```
- No parameter properties in constructors
- Use `import type` for type-only imports
- No `any` types
- Target ES2023, React 19, MUI v9

## UI Conventions

- Dracula palette (`src/theme/dracula.ts`): background=#282a36, currentLine=#44475a, foreground=#f8f8f2, purple=#bd93f9, etc.
- Font: `'JetBrains Mono'` (400, 500)
- **NO emojis** — Material Icons only (`@mui/icons-material`)
- NO box-shadows — borders + bg colors only
- Scrollbar: 12px, `border: 2px solid transparent`, `backgroundClip: padding-box`

## Workers (FactorDB Proxy)

```bash
cd workers
npm install           # NOT bun — wrangler requires Node
npx wrangler deploy   # deploy to Cloudflare Workers
npx wrangler dev      # local dev on :8787
```

Gitignored: `workers/node_modules/`, `workers/.wrangler/`, `workers/bun.lock`

After deploy, copy the worker URL into `src/config.ts → FACTORDB_PROXY_URL`.

## Safety & File Conventions

- Use `trash` for file deletion (installed at `/usr/bin/trash`) — never `rm`
- Create `.bak` backup before overwriting non-git files
- `docs/` is a build artifact — never edit manually
- `--no-verify` for .env files only (pre-commit blocks secrets)
