# Plan 001: Lazy-load views for code splitting

## Status
- Priority: P1
- Effort: M
- Risk: LOW
- Depends on: none
- Planned at: 83aa232

## Why this matters

App.tsx eagerly imports all 7 view components plus CommandPalette, pulling KaTeX (300KB), Prism (100KB), MUI, and all 47 attack modules into a single 1.2MB main chunk. Users who only visit one tab download everything. Vite already produces separate chunks per dynamic import — we just need to trigger it.

## Current state

- `src/App.tsx:8-16` — static imports of MagicPanel, ProofIndex, Calculator, FormatConverter, InstructionsPanel, PemDecryptor
- `src/components/InputPanel.tsx:18` — statically imports ProofRenderer (which imports KaTeX)
- `src/components/InputPanel.tsx:22-24` — statically imports Prism + two grammar files
- Build output: 1.2MB main chunk, no lazy chunks for views

## Scope

**In scope:**
- `src/App.tsx` — wrap 6 non-default views in React.lazy
- `src/components/InputPanel.tsx` — lazy-load ProofRenderer and Prism

**Out of scope:**
- Sidebar, InputPanel, OutputPanel — these render immediately on load
- Attack index — still loaded eagerly (shared across CommandPalette and Sidebar)

## Steps

### Step 1: Lazy-load non-default views in App.tsx

Replace the 6 static imports (MagicPanel through PemDecryptor) with React.lazy wrappers. Add a Suspense fallback.

```tsx
import { lazy, Suspense } from 'react';
// Remove static imports for: MagicPanel, ProofIndex, Calculator, FormatConverter, InstructionsPanel, PemDecryptor

const MagicPanel = lazy(() => import('./components/MagicPanel'));
const ProofIndex = lazy(() => import('./components/ProofIndex'));
const Calculator = lazy(() => import('./components/calculator/Calculator'));
const FormatConverter = lazy(() => import('./components/FormatConverter'));
const InstructionsPanel = lazy(() => import('./components/InstructionsPanel'));
const PemDecryptor = lazy(() => import('./components/PemDecryptor'));
```

Note: Each lazy-loaded component must have a default export. Verify with `grep -l "export default" src/components/MagicPanel.tsx src/components/ProofIndex.tsx src/components/calculator/Calculator.tsx src/components/FormatConverter.tsx src/components/InstructionsPanel.tsx src/components/PemDecryptor.tsx`.

Wrap the view container in `<Suspense fallback={null}>`.

### Step 2: Lazy-load ProofRenderer and Prism in InputPanel

In `src/components/InputPanel.tsx`:
- Remove static `import { ProofRenderer }` and `import Prism from 'prismjs'` + grammar imports
- Lazy-load ProofRenderer: `const ProofRenderer = lazy(() => import('./ProofRenderer'))`
- For Prism, use dynamic import inside the Source tab rendering path instead of top-level import

**Verify**: `bun run typecheck` passes, `bun run build` produces separate chunks

## Done criteria
- [ ] `bun run typecheck` exits 0
- [ ] `bun run build` produces multiple chunks (check `docs/assets/` for new chunk files)
- [ ] Views render correctly in browser (spot check Calculator, Magic, PEM)
