# Plan 011: Add architectural decision records for key tradeoffs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- docs/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

The codebase has no ADRs, DESIGN.md, CONTEXT.md, or PRODUCT.md. Key architectural decisions — like why SageMathCell is used instead of local WASM, why the worker pool size is 3, why Prism.js replaced react-syntax-highlighter — can't be reconstructed by future contributors or agents. Recording the most important tradeoffs prevents re-litigating settled decisions.

## Current state

- No `docs/`, `ADR`, `DESIGN.md`, `CONTEXT.md`, or `PRODUCT.md` files found.
- `README.md` documents features and usage but not architectural rationale.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0 (no code changes) |

## Scope

**In scope**:
- `docs/adr/001-sagemathcell-over-wasm.md` (create)
- `docs/adr/002-worker-pool-size.md` (create)
- `docs/adr/003-prismjs-over-react-syntax-highlighter.md` (create)

**Out of scope**:
- No code changes.

## Git workflow

- Branch: `advisor/011-adr-documentation`
- Commit message style: `docs: add ADRs for key architectural decisions`

## Steps

### Step 1: Create docs/adr/ directory

```bash
mkdir -p docs/adr
```

### Step 2: Create ADR 001 — SageMathCell over WASM

Create `docs/adr/001-sagemathcell-over-wasm.md` with:
- **Title**: Use SageMathCell for math-heavy attacks instead of local WASM
- **Status**: Accepted
- **Context**: 42 of 47 attacks require number theory (LLL, ECM, quadratic sieve) that's impractical in browser JS. SageMathCell provides a full SageMath kernel via an offscreen iframe.
- **Decision**: Use SageMathCell as the math backstop. Frontend checks handle simpler attacks.
- **Consequences**: Requires network (firewalled since 2021), 120s timeout, 3 concurrent slots.

### Step 3: Create ADR 002 — Worker pool size

Create `docs/adr/002-worker-pool-size.md` with:
- **Title**: Default Web Worker pool size of 3
- **Status**: Accepted
- **Context**: Browser tab memory limits, parallel attack execution needs.
- **Decision**: Pool size 3 balances parallelism vs memory. Configurable via `env.workerPoolSize`.
- **Consequences**: Users can increase for more parallelism on powerful machines.

### Step 4: Create ADR 003 — Prism.js

Create `docs/adr/003-prismjs-over-react-syntax-highlighter.md` with:
- **Title**: Replace react-syntax-highlighter with Prism.js
- **Status**: Accepted
- **Context**: react-syntax-highlighter was a heavy dependency for syntax highlighting.
- **Decision**: Use Prism.js with draculaPrism.css for 33% smaller bundle.
- **Consequences**: Less React-integrated but lighter weight.

**Verify**: All 3 files exist in `docs/adr/`

## Test plan

- No code tests needed — documentation only.
- Manual verification: Files are well-formed markdown and accurately reflect the codebase.

## Done criteria

- [ ] `docs/adr/001-sagemathcell-over-wasm.md` exists
- [ ] `docs/adr/002-worker-pool-size.md` exists
- [ ] `docs/adr/003-prismjs-over-react-syntax-highlighter.md` exists
- [ ] Each ADR follows the Title/Status/Context/Decision/Consequences format
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The architectural decisions described don't match the actual codebase.
- A step's verification fails.

## Maintenance notes

- New ADRs should be added for significant architectural decisions going forward.
- Number ADRs sequentially: 004, 005, etc.
- Deprecated ADRs should be marked as "Superseded by NNN".
