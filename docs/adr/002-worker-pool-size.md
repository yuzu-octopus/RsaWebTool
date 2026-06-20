# ADR 002: Default Web Worker pool size of 3

## Status

Accepted

## Context

The tool runs attack `frontendCheck` computations in Web Workers to avoid blocking the main thread. Browser tabs have memory limits (typically 1-4 GB depending on the browser and device), and each Worker loads the full attack module (~304KB lazy chunk). Running too many Workers in parallel can cause memory pressure on constrained devices.

The Magic Panel fires all applicable attacks in parallel, which means the worker pool receives many tasks simultaneously. A pool size of 1 would serialize everything; a pool size of 10+ would create memory pressure.

## Decision

Default pool size of 3, configurable via `env.workerPoolSize` (console: `env.workerPoolSize = 5`). Tasks are queued when all workers are busy and dispatched round-robin as workers free up.

## Consequences

- 3 parallel attacks provide good throughput without memory pressure
- Users on powerful machines can increase via console
- The pool is per-hook-instance — InputPanel and MagicPanel each create their own pool
- Workers are lazily re-created after `cancelCurrentRun()` terminates them
