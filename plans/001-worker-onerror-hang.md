# Plan 001: Fix worker onerror orphaning pending tasks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/hooks/useWorkerPool.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

When a Web Worker crashes with an uncaught error (OOM, module load failure), the `worker.onerror` handler at `src/hooks/useWorkerPool.ts:77-81` marks the worker as free but never resolves or rejects the pending task. The caller's `runAttack` Promise hangs forever. In `useMagicExecution`, this causes `runFrontendCheckPhase` to hang (its completion counter never reaches `total`), freezing the Magic Cracker UI with no feedback.

## Current state

- `src/hooks/useWorkerPool.ts:77-81` — `worker.onerror` pushes the worker index to `freeRef` and marks it not busy, but never looks up or rejects the pending task:
  ```ts
  worker.onerror = () => {
    freeRef.current.push(i);
    busyRef.current[i] = false;
    processQueue();
  };
  ```
- Each worker slot has at most one pending task at a time (tracked via `busyRef`).
- The `pending` Map (`Map<number, PendingTask>`) holds all in-flight tasks keyed by ID.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/hooks/useWorkerPool.ts`

**Out of scope**:
- `src/workers/attack-worker.ts` — the worker itself already catches errors and sends error messages; this plan only fixes the case where an *uncaught* error bypasses that path.
- `src/hooks/useMagicExecution.ts` — the magic execution hook depends on this fix but doesn't need changes itself.

## Git workflow

- Branch: `advisor/001-worker-onerror-hang`
- Commit message style: `fix: reject pending task on worker onerror`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Track the current task ID per worker slot

Add a `currentTaskId` ref array that records the task ID assigned to each worker slot when a task is dispatched.

In `src/hooks/useWorkerPool.ts`, add after the existing `busyRef` declaration (around line 28):

```ts
const currentTaskIdRef = useRef<(number | null)[]>([]);
```

Initialize it alongside `busyRef` in `initWorkers` (line 86-101):

```ts
currentTaskIdRef.current = [];
// ... inside the for loop:
currentTaskIdRef.current.push(null);
```

Update it when dispatching a task — in the `runAttack` callback where `workersRef.current[freeIndex].postMessage(...)` is called (line 172-176), add before the postMessage:

```ts
currentTaskIdRef.current[freeIndex] = id;
```

And in `processQueue` (line 36-48), add after `busyRef.current[freeIndex] = true`:

```ts
currentTaskIdRef.current[freeIndex] = task.id;
```

Clear it in `cancelCurrentRun` (line 196-203):

```ts
currentTaskIdRef.current = [];
```

**Verify**: `bun run typecheck` → exit 0

### Step 2: Reject the pending task in onerror

Replace the `worker.onerror` handler (lines 77-81) to look up and reject the pending task:

```ts
worker.onerror = () => {
  const taskId = currentTaskIdRef.current[i];
  if (taskId !== undefined && taskId !== null) {
    const pt = pending.get(taskId);
    if (pt) {
      pending.delete(taskId);
      pt.reject(new Error('Web Worker crashed'));
    }
  }
  currentTaskIdRef.current[i] = null;
  freeRef.current.push(i);
  busyRef.current[i] = false;
  processQueue();
};
```

**Verify**: `bun run typecheck` → exit 0

### Step 3: Clean up currentTaskIdRef in useEffect cleanup

In the `useEffect` cleanup (line 107-117), add:

```ts
currentTaskIdRef.current = [];
```

**Verify**: `bun run typecheck` → exit 0, `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a Web Worker error path that's difficult to unit test. The fix is small and self-contained.
- Manual verification: In browser DevTools, terminate a worker via `Worker.terminate()` while an attack is running, then confirm the error surfaces instead of hanging.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `src/hooks/useWorkerPool.ts` contains `currentTaskIdRef` and the updated `worker.onerror` handler
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- If the worker pool architecture changes (e.g., multiple tasks per worker), the `currentTaskIdRef` approach needs revisiting.
- Reviewer should verify that `currentTaskIdRef` is always consistent with `busyRef` — a task ID should only be set when the slot is marked busy.
