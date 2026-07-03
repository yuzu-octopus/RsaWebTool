# RSA Web Tool — Agent Instructions

Browser-only RSA CTF tool on GitHub Pages. 47 attacks across 5 categories, with browser-side frontend checks (31) and SageMathCell backstop (42 attacks) for math-heavy computation. Features 5 calculators (RSA/AES/ECC/Hash/DH), command palette (⌘K), keyboard shortcuts, PEM key decryptor, instructions panel, source tab, and console env config (window.env).

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

## Workflow

All non-trivial tasks MUST follow:
1. **Plan** — write plan to /tmp/opencode-plan.md, present to user, wait for approval
2. **Investigate** — use @deep-analysis or @librarian subagents for root cause research
3. **Fix** — use @fixer subagents (provide complete context, no research needed by fixer)
4. **Criticise** — use @criticiser to validate all changes before committing
5. **Report** — present final report to user with findings and verification

Trivial tasks (single-line fix, simple question, build+commit) can skip this workflow.

## Stack

| Layer | Tech |
|-------|------|
| Framework | React 19.2 + TypeScript 6.0 |
| Build | Vite 8.0 + Rolldown |
| UI | Material UI 9.0 (Dracula themed) |
| Math Engine | SageMathCell (embedded makeSagecell JS) |
| Math Rendering | KaTeX 0.17 via ProofRenderer |
| Code Highlighting | Prism.js + draculaPrism.css |
| External API | FactorDB (Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |
| CI | GitHub Actions (lint → build → deploy) |
| Crypto | @noble/ciphers 2.2, @noble/curves 2.2, @noble/hashes 2.2 |
| Integer Math | bigint-gcd 1.0 (Lehmer's GCD) |

## Directory Layout

```
src/
  attacks/          47 attack files + guard.ts + index.ts + rawSources.ts + _rsaHelpers.ts
  components/       40 .tsx files (11 top-level + 1 _shared + 21 calculator/ + 2 calculator/_shared + 5 calculator/hash)
    _shared/        EmptyState.tsx
    calculator/     21 files: 5 calculator shells + sub-tabs + shared components
      _shared/      CalculatorHeader.tsx, ResultBox.tsx
      hash/         ExplanationTab, HashFunctionsTab, HMACTab, LengthExtensionTab, ProofOfWorkTab
  config/           env.ts (console-accessible Env class), sidebarItems.ts — shared sidebar item definitions
  context/          AppContext provider, ctx.ts (createContext barrel)
  hooks/            12 hooks (see below)
  styles/           shared.ts (style objects + keyframes + MONO_FAMILY/PROSE_FAMILY + inputSx), draculaPrism.css
  theme/            dracula.ts — full Dracula palette
  types/            index.ts — Attack (sageTemplate optional, usageGuide optional), InputField, HistoryEntry, NotificationState, AppContextType, CalculatorMode, AttackCategory
  utils/            bigint.ts, converters.ts, aesCrypto.ts, dhCrypto.ts, eccCurves.ts, factordb.ts, sageOutput.ts, rsaCalc.ts, pemParser.ts, asn1.ts, progressEstimator.ts
    testcases/      core.ts — prime generation, testcase utilities, TESTCASE_BITS
  workers/          2 Web Workers
    attack-worker.ts    Attack execution worker (~304KB lazy chunk)
    pow-worker.ts       Hashcash Proof of Work solver (~86 lines)
workers/            Cloudflare Worker CORS proxy for FactorDB
  factordb-proxy.js
  wrangler.toml
  DEPLOY.md
scripts/            Test scripts
  test-attacks.ts   Attack E2E test runner
  test-sage-docker.ts SageMath Docker test runner
  test-playwright.ts Playwright integration tests
.github/workflows/deploy.yml
```

**Stable filenames** (`vite.config.ts`): entry JS at `assets/index.js` (no content hash). Prevents blank page when cached HTML references vanished hashed file.

## UI Conventions

- Dracula palette: `#282a36` bg, `#44475a` currentLine, `#f8f8f2` fg, `#6272a4` comment, `#8be9fd` cyan, `#50fa7b` green, `#ffb86c` orange, `#ff79c0` pink, `#bd93f9` purple, `#ff5555` red, `#f1fa8c` yellow
- JetBrains Mono (400, 500, 700) — no emojis, Material Icons only
- NO box-shadows — borders + bg colors
- MUI `sx` only — no CSS files
- `cssVariables: true` in `createTheme()`
- Scrollbar: 12px, `border: 2px solid transparent`, `backgroundClip: padding-box`
- Sidebar: 220px fixed, currentLine bg
- OutputPanel: 200-600px drag-resize, viewport-aware max width (`Math.min(600, window.innerWidth - 620)`, re-evaluated on resize), localStorage persisted
- Snackbar toast: top-center, 3s auto-dismiss, Dracula bg + 2px colored border per severity
- ErrorBoundary: class component wrapping all content panels, Dracula fallback UI
- Error detection: `detectError()` in useSageMath.ts — checks `.sagecell_error` elements, red-colored divs, and error-class elements for kernel crash diagnostics
- Stall detection: 30s stall timeout in useSageMath.ts polls stdout text — if unchanged for 30s, kernel is presumed dead and error is surfaced
- METHOD indicator: `METHOD=TYPESCRIPT` / `METHOD=SAGEMATHCELL` appended to all output results to clearly distinguish execution path
- Standardized output format: all attacks output consistent sections — n/E/c values, algorithm explanation, intermediate values, p/q factors, verification, `=SUCCESS`/`=FAILED` token
- Command Palette: ⌘/Ctrl+K to open, centered modal, `#282a36` bg, fuzzy search across 47 attacks + 7 view modules (5 calculator tabs + other views)
- Keyboard shortcuts: ⌘K (palette), ⌘Enter (run), ⌘1-5 (calculator tabs), ⌘Shift+C (copy output), Tab/Shift+Tab (sidebar cycle, follows category order)
- InputPanel: side-by-side Generate + Run buttons, hourglass⏳ spinner, orange progress bar with EWMA ETA, "Continue to Input" CTA button from explanation tab
- Calculator switcher: 5-tab bar (RSA/AES/ECC/Hash/DH) with icons, scrollable on narrow screens
- Consistent content width: all panels use `maxWidth: 640` for readable line lengths
- Stop/cleanup: `handleStop()` unified in `finally` block, `isRunning = loading && progress < 100`
- Sidebar: all items highlighted on select, centering scroll, `pl: 4` padding
- "Attack Index" (was "Proofs Index")
- Input handling: all numeric inputs strip ALL whitespace (not just trim) at every entry point via `.replace(/\s/g, '')`. Covers InputPanel form vals, MagicPanel extractParams, and FormatConverter detectFormat. `BigInt()` throws on internal whitespace like `"123 456"` — `.replace(/\s/g, '')` is required over `.trim()`.

## Attack System

Each file in `src/attacks/` exports `{ attack: Attack, generateTestcase }`.

```ts
type Attack = {
  id: string;
  name: string;
  description: string;
  category: AttackCategory; // literal union
  inputs: InputField[];
  sageTemplate?: (vals: Record<string, string>) => string;  // optional — 5 pure-JS attacks omit it
  proof: string;
  usageGuide?: string;  // optional usage hints
  frontendCheck?: (vals: Record<string, string>, onProgress?: (pct: number, detail?: string) => void) => MaybePromise<string | null>;
  applicableCheck: (params: Record<string, string>) => boolean;
  priority: 'high' | 'medium' | 'low';
};
```

**31 attacks have `frontendCheck`** — run fully in browser (BigInt), no SageCell needed. `rawSources.ts` provides lazy Vite glob imports for raw source fetching and `extractFrontendCheck()` for extracting frontendCheck function bodies from source.

**42 attacks use `wrapSageTemplate()`** — a boilerplate generator in `guard.ts` that wraps attack-specific Python code with standard SageMath execution scaffolding: `def _attack()` wrapper, outer `try:` with `out = []`, optional `sageGuardBlock()`, triple try/except error handling, and automatic `print()` of results.

**5 attacks are pure-TypeScript** (no sageTemplate) using `noopSageTemplate` from `_rsaHelpers.ts`: batch-gcd, common-prime-rsa, factordb-lookup, implicit-key-exposure, multi-prime-gcd.

**47 total attacks** across 5 categories:
- Factorization (19)
- Partial Key / Lattice (11)
- Message / Protocol (9)
- Oracle (4)
- Advanced (4)

TESTCASE_BITS: `{ p: 512, q: 512 }` → n ≈ 1024-bit.

## Calculator Suite

5 top-level calculators accessed via Calculator view mode, each with independent sub-tab navigation:

### RSA Calculator (`RSACalculator.tsx`, ~100 lines)
- 4 sub-tabs: Explanation, Key Gen, Encrypt, Decrypt
- Pure BigInt, e defaults to 65537, auto-derives 2 of (p, q, n, e, d)
- CRT-optimized decryption

### AES Calculator (`AESCalculator.tsx`, ~40 lines shell)
- 3 sub-tabs: Explanation, Encrypt/Decrypt, Attacks
- 6 cipher modes via @noble/ciphers (ECB, CBC, CTR, GCM, OFB, CFB)
- Key sizes: 128, 192, 256 bit
- 8 attack descriptions with in-browser computation

### ECC Calculator (`ECCCalculator.tsx`, ~43 lines shell)
- 4 sub-tabs: Explanation, Key Operations, Sign/Verify, Attacks
- @noble/curves for secp256k1, P-256, P-384, P-521, Ed25519, X25519
- 7 attack descriptions: Nonce Reuse, Invalid Curve, Smart's Attack, Pollard's Rho, BSGS, Pohlig-Hellman

### Hash Calculator (`HashCalculator.tsx`, ~46 lines shell)
- 5 sub-tabs: Explanation, Hash Functions, HMAC, Length Extension, PoW
- 14 algorithms: SHA-224/256/384/512, SHA3-256/384/512, BLAKE2s/2b, BLAKE3, Keccak-256, SHAKE128/256
- HMAC with selectable hash, PoW with worker pool

### DH Calculator (`DHCalculator.tsx`, ~40 lines shell)
- 3 sub-tabs: Explanation, Key Exchange, Attacks
- RFC 3526 standard groups + custom parameters
- Key exchange simulation with shared secret verification

### Shared Calculator Components
- `CalculatorHeader` — unified shell for all calculators: icon, title, subtitle, sub-tab navigation
- `ResultBox` — output display with copy-to-clipboard, 4 size variants
- `AttackExplanationPanel` — reusable attack explanation panel with Prism.js code highlighting
- `CalculatorSubTabs` — shared sub-tab navigation bar
- `EmptyState` — standard empty-state placeholder for all panels

## Hooks

| Hook | Lines | Purpose |
|------|-------|---------|
| useAppContext | 8 | React 19 `use()` wrapper for AppContext |
| useAttackExecution | 251 | Run single attack with progress, worker/sage fallback |
| useCalculatorOutput | 82 | Calculator dispatch to global output + history |
| useCopyToClipboard | 45 | Clipboard write with "Copied!" feedback timer |
| useDragResize | 100 | Axis-based drag resize with localStorage persistence |
| useKeyboardShortcuts | 125 | Global keyboard shortcut registration |
| useMagicExecution | 436 | Magic Panel: parallel attack execution, concurrency=3 |
| useSageMath | 404 | SageMathCell session lifecycle, stall detection, error reporting |
| useTimer | 31 | Timer hook effect cleanup |
| useWorkerPool | 206 | Web Worker pool management (poolsize=3) |

## Shared Guard Block

`src/attacks/guard.ts` exports `wrapSageTemplate` (public) and uses `sageGuardBlock` (private, internal helper):

- **`wrapSageTemplate(opts)`** — boilerplate generator used by 42 sageTemplate attacks. Wraps attack-specific Python code with: top-level imports, `def _attack()` wrapper, outer `try:` / `out = []`, optional `sageGuardBlock()`, triple try/except error handling, and automatic `print("\\n".join(out))` with `TOKEN=SUCCESS`/`TOKEN=FAILED` markers.
- **`sageGuardBlock(token, indent?)`** — generates the standard 4-guard Python block (n<2, n%2, is_prime, is_square) with consistent two-line p/q output.

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.6 | UI framework |
| react-dom | ^19.2.6 | DOM renderer |
| @mui/material | ^9.0.1 | UI components (Dracula themed) |
| @mui/icons-material | ^9.0.1 | Material Icons |
| @emotion/react | ^11.14.0 | CSS-in-JS runtime (MUI peer dep) |
| @emotion/styled | ^11.14.1 | Styled components (MUI peer dep) |
| @noble/ciphers | ^2.2.0 | AES encrypt/decrypt (ECB, CBC, CTR, GCM, OFB, CFB) |
| @noble/curves | ^2.2.0 | Elliptic curve ops, ECDSA, ECDH (secp256k1, P-256, P-384, P-521, Ed25519, X25519) |
| @noble/hashes | ^2.2.0 | 14 hash algorithms, HMAC, SHAKE, Keccak, BLAKE2/3 |
| bigint-gcd | ^1.0.46 | Lehmer's GCD for BigInt |
| prismjs | ^1.30.0 | Syntax highlighting |
| katex | ^0.17.0 | Math rendering |
| typescript | ~6.0.3 | Type system |
| vite | ^8.0.14 | Build tool |

## Key Components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Sidebar | Sidebar.tsx | ~255 | Collapsible category tree + Magic/Proofs/Calculator nav |
| Calculator | Calculator.tsx | 86 | Main shell with 5 top-level tabs (icons, scrollable) + keyboard shortcuts |
| CalculatorSubTabs | CalculatorSubTabs.tsx | 47 | Shared sub-tab navigation bar |
| CalculatorHeader | calculator/_shared/CalculatorHeader.tsx | 90 | Unified calculator header with title, subtitle, sub-tab nav |
| ResultBox | calculator/_shared/ResultBox.tsx | 100 | Output display with copy, 4 size variants |
| AttackExplanationPanel | calculator/AttackExplanationPanel.tsx | 97 | Attack explanation with Prism.js code highlighting |
| InputPanel | InputPanel.tsx | 364 | Attack form: Explanation tab (KaTeX proof) / Input tab (form + Generate + Run/Stop) / Source tab, "Continue to Input" CTA |
| MagicPanel | MagicPanel.tsx | 469 | Paste-all auto-detect parallel execution |
| OutputPanel | OutputPanel.tsx | ~290 | Results display + copy + useReducer + history (cap 50), viewport-aware max width |
| ProofRenderer | ProofRenderer.tsx | 277 | KaTeX parser: display math, inline math, itemize, heading detection |
| ProofIndex | ProofIndex.tsx | 124 | Searchable list of all 47 attack proofs |
| CommandPalette | CommandPalette.tsx | 395 | ⌘/Ctrl+K fuzzy search modal |
| InstructionsPanel | InstructionsPanel.tsx | 117 | Always-visible reference guide |
| PemDecryptor | PemDecryptor.tsx | 413 | PEM key decryptor: PKCS#1/PKCS#8/encrypted, Feed buttons |
| FormatConverter | FormatConverter.tsx | 181 | Hex/base64/binary/decimal converter |
| ErrorBoundary | ErrorBoundary.tsx | 46 | Class component, Dracula fallback UI |
| EmptyState | _shared/EmptyState.tsx | 99 | Standard empty-state placeholder for all panels |

## Current State

- WORKER_POOL_SIZE: 3 (configured via env.workerPoolSize)
- 47 attacks: 31 frontendCheck, 42 wrapSageTemplate, 5 pure-TypeScript
- 5 calculator modes: RSA / AES / ECC / Hash / DH
- 40 component .tsx files (11 top-level + 1 _shared + 21 calculator/ + 2 calculator/_shared + 5 calculator/hash)
- 11 hooks (useCommandPalette inlined into useKeyboardShortcuts)
- 2 Web Workers: attack-worker.ts, pow-worker.ts
- 7 view modes: attack, magic, proofs, calculator, format-converter, instructions, pem
- Test runner: bun test (unit), CI runs tests before build
