# Plan 003: Add typecheck to CI pipeline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- .github/workflows/deploy.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

The CI pipeline (`.github/workflows/deploy.yml`) runs `bun run lint` and `bun run build` but skips `bun run typecheck`. TypeScript errors can ship to production undetected. The README (`README.md:339`) documents `bun run typecheck` as a development command but the CI doesn't enforce it.

## Current state

- `.github/workflows/deploy.yml:27-29`:
  ```yaml
  - run: bun install
  - run: bun run lint
  - run: bun run build
  ```
- `README.md:339` lists `bun run typecheck` under Development.
- `package.json:15`: `"typecheck": "tsc -b --noEmit"` — the command exists and works.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |
| Build     | `bun run build`            | exit 0              |

## Scope

**In scope**:
- `.github/workflows/deploy.yml`

**Out of scope**:
- `README.md` — the README is already correct; no change needed.

## Git workflow

- Branch: `advisor/003-ci-typecheck`
- Commit message style: `ci: add typecheck step to deployment pipeline`

## Steps

### Step 1: Add typecheck step before lint

In `.github/workflows/deploy.yml`, insert `bun run typecheck` before `bun run lint` in the build job steps (after `bun install`):

```yaml
      - run: bun install
      - run: bun run typecheck
      - run: bun run lint
      - run: bun run build
```

**Verify**: `bun run typecheck` → exit 0 (local check that the command works)

### Step 2: Verify the YAML is valid

**Verify**: `cat .github/workflows/deploy.yml | python3 -c "import sys, yaml; yaml.safe_load(sys.stdin)"` → exit 0

## Test plan

- No code changes — CI config only.
- Manual verification: Push to a branch and confirm the GitHub Actions workflow includes the typecheck step.

## Done criteria

- [ ] `.github/workflows/deploy.yml` contains `bun run typecheck` before `bun run lint`
- [ ] YAML is valid
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The YAML at the locations in "Current state" doesn't match the excerpts.
- The typecheck command fails locally.

## Maintenance notes

- If the typecheck command is ever changed in `package.json`, the CI will automatically pick it up.
- This is a low-risk change — the worst case is CI fails on existing type errors, which is the desired behavior.
