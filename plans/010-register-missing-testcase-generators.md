# Plan 010: Register missing testcaseGenerators in index.ts

## Status
- Priority: P1
- Effort: S
- Risk: LOW
- Depends on: none
- Category: bug
- Planned at: 08e26cc, 2026-07-03

## Why this matters

Three attacks (hastad-linear-pad, non-coprime-exp, related-message) have generateTestcase functions exported from their files but are NOT registered in the testcaseGenerators Record in index.ts. The Generate button in InputPanel silently does nothing for these attacks.

## Current state

- `src/attacks/index.ts:82-131`: testcaseGenerators Record with 47 entries
- Missing: hastad-linear-pad, non-coprime-exp, related-message
- Each already exports generateTestcase from their respective files

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |

## Steps

### Step 1: Add missing entries to testcaseGenerators

In src/attacks/index.ts, add the three missing entries:

```typescript
'hastad-linear-pad': genHastadLinearPad,
'non-coprime-exp': genNonCoprimeExp,
'related-message': genRelatedMessage,
```

### Step 2: Verify

- `bun run typecheck` passes
- Manual test: select each of these 3 attacks, click Generate — testcase should appear

## Done criteria

- [ ] All 47 attacks have entries in testcaseGenerators
- [ ] bun run typecheck exits 0
