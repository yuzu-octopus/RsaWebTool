# Plan 003: Add test gate to CI pipeline

## Status
- Priority: P1
- Effort: S
- Risk: LOW
- Depends on: none
- Planned at: 83aa232

## Why this matters

The CI pipeline runs typecheck, lint, and build but never runs tests. Broken tests ship silently. The test suite exists (`test:unit` script) but provides zero gate protection.

## Current state

- `.github/workflows/deploy.yml:28-30` — runs `bun run typecheck`, `bun run lint`, `bun run build` only
- `package.json:17` — `"test:unit": "bun test src/utils/__tests__/"`

## Scope

**In scope:**
- `.github/workflows/deploy.yml` — add test step

## Steps

### Step 1: Add test step to CI

In `.github/workflows/deploy.yml`, add between `lint` and `build`:

```yaml
      - run: bun run typecheck
      - run: bun run lint
      - run: bun run test:unit
      - run: bun run build
```

### Step 2: Verify
- Push to a branch and confirm CI runs tests
- Or locally: `bun run test:unit` passes

## Done criteria
- [ ] CI pipeline includes `bun run test:unit` step
- [ ] `bun run test:unit` passes locally
