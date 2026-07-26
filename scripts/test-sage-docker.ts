/**
 * test-sage-docker.ts — Bun script
 *
 * Runs L4: executes all SageMath .sage templates through Docker.
 * Concurrency = 3 (configurable). Parses stdout for =SUCCESS/=FAILED.
 *
 * Prerequisites:
 *   - Docker (Orbstack) must be running
 *   - .sage template files in scripts/test-results/templates/ (from test:attacks)
 *   - sagemath/sagemath docker image (pulled automatically if missing)
 *
 * Usage:
 *   bun run test:attacks:sage                    # full run
 *   bun run test:attacks:sage -- --concurrency=5 # override concurrency
 *   bun run test:attacks:sage -- --fail          # only show failures
 *   bun run test:attacks:sage -- --json          # JSON output only
 *
 * Output:
 *   scripts/test-results/results-sage.json — per-template results
 *   stdout — formatted summary
 */

import { readdirSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Config ────────────────────────────────────────────────────────────

const TEMPLATE_DIR = resolve(import.meta.dirname, 'test-results', 'templates');
const RESULT_FILE = resolve(import.meta.dirname, 'test-results', 'results-sage.json');

const DOCKER_IMAGE = 'sagemath/sagemath';
const CONTAINER_TIMEOUT_MS = 120_000; // 120s per template (some attacks need 2 min for 512-bit)

interface SageTestResult {
  id: string;
  status: 'pass' | 'fail' | 'error';
  stdout: string;
  stderr: string;
  durationMs: number;
  successMarker: boolean;
  failedMarker: boolean;
  error?: string;
}

// ── Concurrency limiter ──────────────────────────────────────────────

async function* concurrencyPool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number
): AsyncGenerator<R> {
  const queue = [...items];
  const inFlight = new Set<Promise<R>>();

  while (queue.length > 0 || inFlight.size > 0) {
    while (inFlight.size < concurrency && queue.length > 0) {
      const item = queue.shift()!;
      const p = worker(item)
        .catch(err => {
          console.warn(`Worker failed for ${item}: ${err}`);
          return null;
        })
        .finally(() => inFlight.delete(p));
      inFlight.add(p);
    }

    if (inFlight.size > 0) {
      const done = await Promise.race(inFlight);
      yield done;
    }
  }
}

// ── Docker runner ────────────────────────────────────────────────────

async function runSageTemplate(id: string, filePath: string): Promise<SageTestResult> {
  const start = Date.now();
  const result: SageTestResult = {
    id,
    status: 'error',
    stdout: '',
    stderr: '',
    durationMs: 0,
    successMarker: false,
    failedMarker: false,
  };

  try {
    const proc = Bun.spawn(
      [
        'docker',
        'run',
        '--rm',
        '--entrypoint',
        '/bin/bash',
        '-v',
        `${filePath}:/tmp/input/${id}.sage:ro`,
        DOCKER_IMAGE,
        '-c',
        `cp /tmp/input/${id}.sage /tmp/${id}.sage && sage /tmp/${id}.sage`,
      ],
      {
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: CONTAINER_TIMEOUT_MS,
      }
    );

    const output = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const stdout = output[0].trim();
    const stderr = output[1].trim();

    result.stdout = stdout;
    result.stderr = stderr;
    result.durationMs = Date.now() - start;

    // Parse markers
    result.successMarker = stdout.includes('=SUCCESS');
    result.failedMarker = stdout.includes('=FAILED');

    if (result.successMarker && !result.failedMarker) {
      result.status = 'pass';
    } else if (result.failedMarker) {
      result.status = 'fail';
    } else {
      result.status = 'error';
      result.error = 'No SUCCESS or FAILED marker found in output';
    }
  } catch (err) {
    result.durationMs = Date.now() - start;
    result.error = err instanceof Error ? err.message : String(err);
    result.status = 'error';
  }

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Check Docker image availability before running templates
  const dockerCheck = Bun.spawnSync(['docker', 'image', 'inspect', DOCKER_IMAGE]);
  if (dockerCheck.exitCode !== 0) {
    console.error(`Docker image "${DOCKER_IMAGE}" not found. Pull it first:`);
    console.error(`  docker pull ${DOCKER_IMAGE}`);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const onlyFail = args.includes('--fail');
  const jsonOnly = args.includes('--json');
  const concurrencyArg = args.find((a) => a.startsWith('--concurrency='));
  const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 3;

  // Check template dir
  if (!existsSync(TEMPLATE_DIR)) {
    console.error(`Template directory not found: ${TEMPLATE_DIR}`);
    console.error('Run `bun run test:attacks` first to generate .sage files.');
    process.exit(1);
  }

  const files = readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith('.sage'));

  if (files.length === 0) {
    console.error('No .sage files found in template directory.');
    console.error('Run `bun run test:attacks` first to generate .sage files.');
    process.exit(1);
  }

  if (!jsonOnly) {
    console.log(`\x1b[36m══════════════════════════════════════════════════\x1b[0m`);
    console.log(`\x1b[36m  L4: SageMath Docker Test Suite\x1b[0m`);
    console.log(`\x1b[36m══════════════════════════════════════════════════\x1b[0m\n`);
    console.log(`  Templates:  ${files.length}`);
    console.log(`  Concurrency: ${concurrency}`);
    console.log(`  Timeout:     ${CONTAINER_TIMEOUT_MS / 1000}s`);
    console.log(`  Docker image: ${DOCKER_IMAGE}\n`);
    console.log(`  \x1b[90m(Starting Docker containers... this will take a while)\x1b[0m\n`);
  }

  // Build items
  const items = files.map((f) => ({
    id: f.replace(/\.sage$/, ''),
    filePath: resolve(TEMPLATE_DIR, f),
  }));

  const allResults: SageTestResult[] = [];
  let passed = 0;
  let failed = 0;
  let errors = 0;

  // Run with concurrency
  for await (const result of concurrencyPool(items, (item) => runSageTemplate(item.id, item.filePath), concurrency)) {
    if (result === null) { errors++; continue; }
    allResults.push(result);

    if (result.status === 'pass') passed++;
    else if (result.status === 'fail') failed++;
    else errors++;

    if (!jsonOnly) {
      const show = onlyFail ? result.status !== 'pass' : true;
      if (show) {
        const statusIcon =
          result.status === 'pass'
            ? '\x1b[32mPASS\x1b[0m'
            : result.status === 'fail'
              ? '\x1b[31mFAIL\x1b[0m'
              : '\x1b[33mERROR\x1b[0m';
        console.log(`  ${statusIcon}  ${result.id}  (${result.durationMs}ms)`);
        if (result.status !== 'pass' && result.error) {
          console.log(`       ${result.error}`);
        }
      } else {
        // Show a progress dot for passing items when in only-fail mode
        process.stdout.write('\x1b[32m.\x1b[0m');
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────

  if (!jsonOnly) {
    console.log(`\n\n\x1b[36m══════════════════════════════════════════════════\x1b[0m`);
    console.log(`\x1b[36m  Summary\x1b[0m`);
    console.log(`\x1b[36m══════════════════════════════════════════════════\x1b[0m\n`);
    console.log(`  Total:  ${allResults.length}`);
    console.log(`  Pass:   \x1b[32m${passed}\x1b[0m`);
    console.log(`  Fail:   \x1b[31m${failed}\x1b[0m`);
    console.log(`  Error:  \x1b[33m${errors}\x1b[0m`);
    console.log(`\n  Results: ${RESULT_FILE}`);
  }

  // Write results
  const output = {
    timestamp: new Date().toISOString(),
    concurrency,
    timeoutMs: CONTAINER_TIMEOUT_MS,
    dockerImage: DOCKER_IMAGE,
    summary: { total: allResults.length, pass: passed, fail: failed, error: errors },
    results: allResults,
  };

  writeFileSync(RESULT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  if (jsonOnly) {
    console.log(JSON.stringify(output, null, 2));
  }

  process.exit(failed > 0 || errors > 0 ? 1 : 0);
}

main();
