# React Doctor — False Positives & Deferred Findings

Last triage: b8a4cf6 (score: 69/100, 32 remaining warnings)

This file documents findings that react-doctor flags but are either:
1. **False positives** — the rule doesn't apply to this codebase's context
2. **Deferred** — mechanically correct but a high-risk refactor that should be a standalone effort

Future scans should not re-flag the items below. If the underlying assumption changes (e.g., a list becomes dynamic, a component's responsibility expands), remove the entry and address the warning.

---

## Security (6 warnings) — False Positive

### `dangerouslySetInnerHTML` in `ProofRenderer.tsx:96,108,117,196`
- **Rule:** Raw HTML injection / XSS risk
- **Why suppressed:** Renders KaTeX-rendered LaTeX output (`katex.renderToString()`) and `renderInlineText()` output. KaTeX sanitizes its *output* but does NOT sanitize the input LaTeX string. The safety of these call sites depends entirely on the *input source* being static build-time constants (calculator proof data bundled with the app), NOT on KaTeX itself. Currently all call sites pass static content (`ECC_PROOF`, `EXPLANATION_LATEX`, `AES_PROOF`, `selectedAttack.proof`, etc.) — no user-supplied strings reach this component.
- **Do not un-suppress** unless user input starts flowing into these call sites. If a future feature adds a "render your own proof" textbox that feeds `ProofRenderer`, the XSS concern becomes real and the call sites must add DOMPurify sanitization (or the feature must be rejected).

### `dangerouslySetInnerHTML` in `AttackExplanationPanel.tsx:88`
- **Rule:** Raw HTML injection / XSS risk
- **Why suppressed:** Renders static `PROOF` / `EXPLANATION` constants bundled with the attack modules. Content is authored at build time, not user-supplied.

### `dangerouslySetInnerHTML` in `InputPanel.tsx:328`
- **Rule:** Raw HTML injection / XSS risk
- **Why suppressed:** Renders `selectedAttack.proof` — a static string from the attack catalog, not user input.

---

## Bugs (14 warnings) — Deferred / False Positive

### Array index keys (2)
- `InstructionsPanel.tsx:106` — `<Typography key={i} ...>{section.content[i]}</Typography>` in a static `SECTIONS` array. List is never reordered, filtered, or mutated at runtime. Index keys are safe.
- `ProofOfWorkTab.tsx:246` — Index key in a derived list computed from a static alphabet. No reordering.

### Missing effect dependencies (1)
- `ProofOfWorkTab.tsx:91` — `useCallback` references values intentionally excluded from deps (synchronous refs to worker pool). Behavior verified safe; the alternative (adding deps) causes worker teardown on every render. The suppression is self-documenting in the source via a local `// eslint-disable-next-line react-hooks/exhaustive-deps` comment.

### Data fetching in useEffect (1)
- `Sidebar.tsx:69` — The "data fetching" is reading `localStorage` for the notepad persist-on-mount. Not a network race condition; `useEffect` is the correct hook for mount-time hydration. No cleanup needed (synchronous read).

### Many related `useState` calls (10) — Deferred
The following components are flagged for `useReducer` conversion:
- `AESAttacksTab.tsx`, `ECCAttacksTab.tsx`, `LengthExtensionTab.tsx`, `ECCSignVerifyTab.tsx`, `HashFunctionsTab.tsx`, `DHKeyExchangeTab.tsx`, `AESEncryptDecryptTab.tsx`, `HMACTab.tsx`, `ProofOfWorkTab.tsx`, `PemDecryptor.tsx`

**Why deferred:** Each component has 5-8 `useState` calls that map 1:1 to distinct UI fields (input, output, error, mode, etc.). Converting to `useReducer` would:
- Require defining action types and a reducer for every component (~10 new files or large inline reducers)
- Make the "dispatch + typed field" pattern strictly more verbose than the current `setX(value)` pattern
- Risk introducing stale-closure bugs if action payloads aren't carefully typed

The current pattern is idiomatic for forms with independent fields. A `useReducer` refactor is only worthwhile if these components gain cross-field state transitions (e.g., "submitting" orchestrates clearing 3 fields + showing a spinner). Until then, `useState` per field is correct.

---

## Performance (5 warnings) — 1 Fixed, 4 Deferred / False Positive

### Chained array iterations (1) — ✅ Fixed in b8a4cf6
- `PemDecryptor.tsx:280` — Replaced `.filter().map()` with single-pass `.flatMap()`.

### JSX passed as a prop (4) — Deferred
- `ProofIndex.tsx:58`, `OutputPanel.tsx:56, 61` — JSX-as-prop pattern is used to pass pre-rendered children (icons, labels) into a shared layout. The receiving components are not memoized, so the "unnecessary re-renders" concern is moot in the current architecture. Worth revisiting if those components gain `React.memo`.

---

## Maintainability (10 warnings) — 2 Fixed, 8 Deferred

### Unused exports (1 fixed)
- ✅ `sectionTitleSx` from `src/styles/shared.ts` — removed in b8a4cf6.
- ✅ `src/utils/sageDispatch.ts` — file deleted in b8a4cf6 (replaced by `useCalculatorOutput` hook).

### Large components (6) — Deferred
The following components exceed the size threshold and are flagged for splitting:
- `PemDecryptor.tsx` (~390 lines)
- `ECCAttacksTab.tsx`
- `InputPanel.tsx`
- `CommandPalette.tsx`
- `Sidebar.tsx`
- `ProofOfWorkTab.tsx`

**Why deferred:** Each component is a self-contained feature surface (PEM decryption, attack catalog, command palette, etc.) where splitting would require:
- Defining prop interfaces for each sub-section
- Lifting shared state up or introducing context
- Risk of over-engineering for a UI that already works

A refactor here is a separate effort that should be paired with adding tests for the existing behavior first. The components are not "too large" in the sense of doing too many things — they have a single responsibility that happens to need many UI elements.

### Unused exports (remaining, 2) — Verified in use
The scan reported "3 unused exports" but per-export analysis confirmed only 1 was actually unused (`sectionTitleSx`, now removed). The other exports referenced in the scan output are imported transitively via barrel re-exports or in test files.

---

## How to update this file

When react-doctor flags a new false positive:
1. Verify the finding is genuinely a false positive (not a real bug being masked)
2. Add an entry with: rule name, file:line, why it's safe, and what would un-suppress it
3. Commit alongside the fix that resolved the real warnings, or as a docs-only commit

When a deferred item is addressed:
1. Remove its entry from this file
2. Reference this file in the commit message that resolves the warning
