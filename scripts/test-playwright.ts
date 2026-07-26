/**
 * test-playwright.ts — Bun script
 *
 * Runs all attacks through real SageMathCell via Playwright headless browser.
 * Uses a single shared browser with CONCURRENCY pages for resource efficiency.
 * Each attack is run 3 times with fresh testcases to verify consistency.
 *
 * Usage:
 *   bun run build && bun run scripts/test-playwright.ts
 *   bun run scripts/test-playwright.ts -- --resume         # resume from progress file
 *   bun run scripts/test-playwright.ts -- --json           # JSON output only
 *   bun run scripts/test-playwright.ts -- --server-only    # start server, don't run tests
 */

import { chromium, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'child_process';
import { dirname, resolve } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { attacks as attackList, attacksByCategory } from '../src/attacks';
import { isActualSuccess } from '../src/utils/sageOutput';

// Extend Window with our custom property for SageCell text cache
interface WindowWithSageText extends Window {
  __sage_text?: string;
}

// ── Config ────────────────────────────────────────────────────────────

const CONCURRENCY = 10;
const RUNS_PER_ATTACK = 3;
const ATTACK_TIMEOUT_MS = 120000;
const SERVER_PORT = 4173;
const BASE_URL = `http://localhost:${SERVER_PORT}/RsaWebTool/`;
const SKIP_ATTACKS = new Set<string>(['factordb-lookup']);
const PROGRESS_FILE = resolve(import.meta.dirname, 'test-results', 'playwright-progress.json');

// ── Types ─────────────────────────────────────────────────────────────

interface AttackInfo {
  id: string;
  name: string;
}

interface SingleRunResult {
  run: number;
  success: boolean;
  output: string;
  durationMs: number;
  timedOut: boolean;
  error?: string;
}

interface AttackResult {
  id: string;
  name: string;
  runs: SingleRunResult[];
  passed: number;
  failed: number;
}

interface ProgressState {
  completed: string[];
  results: Record<string, AttackResult>;
}

// ── Attack List (sourced from barrel) ─────────────────────────────────

const ALL_ATTACKS: AttackInfo[] = attackList.map(a => ({ id: a.id, name: a.name }));

function startServer(): Promise<ChildProcess> {
  return new Promise((resolve_, reject) => {
    const proc = spawn('bun', ['run', 'preview'], {
      cwd: resolve(import.meta.dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let started = false;
    const onData = (data: Buffer) => {
      const text = data.toString();
      if (!started && text.includes('Local:')) {
        started = true;
        resolve_(proc);
      }
    };
    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    // Health-check loop: poll the server instead of a blind 5s timeout
    const healthCheck = async () => {
      const maxAttempts = 30; // 30 * 500ms = 15s timeout
      for (let i = 0; i < maxAttempts; i++) {
        if (started) return; // Prevent double-resolve after onData already resolved
        try {
          const resp = await fetch(BASE_URL);
          if (resp.ok) {
            started = true;
            resolve_(proc);
            return;
          }
        } catch { /* server not ready yet */ }
        await new Promise(r => setTimeout(r, 500));
      }
      // Server never started
      started = true;
      proc.kill();
      reject(new Error(`Server failed to start at ${BASE_URL} within ${maxAttempts * 500}ms`));
    };
    healthCheck();
    proc.on('error', reject);
  });
}

function saveProgress(state: ProgressState) {
  mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
  writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2));
}

function loadProgress(): ProgressState | null {
  try {
    if (existsSync(PROGRESS_FILE)) {
      return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

// ── Run Single Attack ──────────────────────────────────────────────────

async function runSingleAttack(
  page: Page,
  attack: AttackInfo,
  runNum: number,
): Promise<SingleRunResult> {
  const start = Date.now();
  const result: SingleRunResult = {
    run: runNum,
    success: false,
    output: '',
    durationMs: 0,
    timedOut: false,
  };

  try {
    // Click attack in sidebar (longer timeout for initial page load with CDN script)
    const sidebarSelector = `[data-testid="attack-${attack.id}"]`;
    await page.waitForSelector(sidebarSelector, { timeout: 20000 });
    await page.click(sidebarSelector, { timeout: 5000 });
    await page.waitForTimeout(300);

    // Click Input tab (use data-testid to avoid matching SageMathCell widget text)
    await page.click('[data-testid="input-tab"]', { timeout: 5000 });
    await page.waitForTimeout(200);

    // Generate testcase (fresh values each run)
    await page.waitForSelector('[data-testid="generate-testcase"]', { state: 'visible', timeout: 5000 });
    await page.click('[data-testid="generate-testcase"]');
    await page.waitForTimeout(400);

    // Remove old SageCell containers from previous runs to prevent cross-run
    // contamination (the evaluate polling loop would find old output from a
    // previous SageCell run's widget and return it immediately).
    await page.evaluate(() => {
      document.querySelectorAll('[id^="sagecell-"]').forEach(el => el.remove());
      delete (window as WindowWithSageText).__sage_text;
    }).catch((err) => console.warn('SageCell cleanup failed:', err));

    // Click Run via a short page.evaluate — this is <1ms and completes before React
    // re-renders, so the CDP execution context stays valid.
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-testid="run-attack"]');
      if (btn && !btn.disabled) btn.click();
    }).catch((err) => console.warn('Run button click failed:', err));

    // Poll for output using SHORT evaluate calls in a Node.js loop.
    // Each evaluate creates a fresh CDP execution context. If React DOM mutations
    // invalidate the context, only that one call fails (retry 200ms later).
    // Store intermediate SageCell output on window.__sage_text for persistence
    // across evaluate calls (since each call is a fresh context).
    const pollStart = Date.now();
    while (Date.now() - pollStart < ATTACK_TIMEOUT_MS) {
      const out = await page.evaluate(() => {
        // 1. ALWAYS check React UI output first (frontendCheck attacks)
        const appR = document.querySelector('[data-testid="output-result"]');
        const appE = document.querySelector('[data-testid="output-error"]');
        if (appR || appE) {
          const t = (appR || appE)?.textContent?.trim() || '';
          if (t) return t;
        }

        // 2. ALSO check SageCell stdout containers
        const containers = document.querySelectorAll('[id^="sagecell-"]');
        for (const container of containers) {
          if (!document.body.contains(container)) continue;
          const stdout = container.querySelector('.sagecell_stdout');
          if (stdout) {
            const t = stdout.textContent?.trim() || '';
            if (t) (window as WindowWithSageText).__sage_text = t;
            if (t.includes('=SUCCESS') || t.includes('=FAILED')) return t;
          }
        }
        return '';
      }).catch(() => '');

      if (out) { result.output = out; break; }

      // Also check if we have SageCell text cached from a previous call
      // Only break if the cached text contains a conclusive marker — otherwise
      // we'd break with intermediate output (e.g. "Brute forcing...") before
      // the SageCell script finishes, causing a false failure.
      const cached = await page.evaluate(() => (window as WindowWithSageText).__sage_text || '')
        .catch(() => '');
      if (cached && (cached.includes('=SUCCESS') || cached.includes('=FAILED'))) {
        result.output = cached; break;
      }

      await new Promise(r => setTimeout(r, 200));
    }
    result.success = isActualSuccess(result.output);
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.timedOut = (result.error?.includes('Timeout') ?? false);
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ── Worker ─────────────────────────────────────────────────────────────

async function runWorker(
  browser: import('playwright').Browser,
  attacks: AttackInfo[],
): Promise<AttackResult[]> {
  const results: AttackResult[] = [];

  for (const attack of attacks) {
    console.log(`  [W] START ${attack.id} (${RUNS_PER_ATTACK} runs)`);

    const attackResult: AttackResult = {
      id: attack.id,
      name: attack.name,
      runs: [],
      passed: 0,
      failed: 0,
    };

    // Create a fresh page + context per attack to prevent state degradation
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    try {
      // Navigate to the app, waiting for DOMContentLoaded (blocks on CDN script in <head>,
      // but falls back if CDN is unresponsive — the sidebar waitForSelector below provides
      // the ultimate stability guarantee once React mounts).
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(async () => {
          // CDN script blocked DOMContentLoaded — that's OK, React will mount once
          // the script finishes loading in the background.
        });

      for (let run = 1; run <= RUNS_PER_ATTACK; run++) {
        // No page reload between runs — the fresh page per attack provides clean state.
        // Re-clicking the sidebar + generating a testcase resets the React state.
        const runResult = await runSingleAttack(page, attack, run);
        attackResult.runs.push(runResult);
        if (runResult.success) {
          attackResult.passed++;
        } else {
          attackResult.failed++;
        }

        // If the page is in a bad state (crashed/closed), reload before next run
        if (!runResult.success && runResult.error && (
          runResult.error.includes('closed') ||
          runResult.error.includes('page') ||
          runResult.error.includes('context')
        )) {
          try {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
          } catch {
            // Page may still be loading; waitForSelector handles this
          }
          await page.waitForSelector(`[data-testid="attack-${attack.id}"]`, { timeout: 20000 })
            .catch(() => {});
        }

        // Per-run output
        const status = runResult.success ? '✓' : '✗';
        process.stdout.write(`    [W] ${status} ${attack.id} run ${run}/${RUNS_PER_ATTACK} (${runResult.durationMs}ms)`);
        if (!runResult.success && runResult.error) {
          process.stdout.write(` — ${runResult.error.slice(0, 100)}`);
        }
        process.stdout.write('\n');
      }

      // Summary for this attack
      console.log(`  [W] DONE ${attack.id}: ${attackResult.passed}/${RUNS_PER_ATTACK} passed`);

      results.push(attackResult);
    } finally {
      await page.close().catch(() => {});
      await ctx.close().catch(() => {});
    }
  }

  return results;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const failOnly = args.includes('--fail') || args.includes('-f');
  const jsonMode = args.includes('--json') || args.includes('-j');
  const serverOnly = args.includes('--server-only');
  const resumeMode = args.includes('--resume') || args.includes('-r');

  const attacks = ALL_ATTACKS.filter(a => !SKIP_ATTACKS.has(a.id));

  // Load resume state
  let resumeState: ProgressState | null = null;
  if (resumeMode) {
    resumeState = loadProgress();
    if (resumeState) {
      console.log(`Resuming from progress file: ${resumeState.completed.length} attacks already done`);
    } else {
      console.log('No progress file found, starting fresh');
    }
  }

  // Filter out completed attacks
  const remainingAttacks = resumeState
    ? attacks.filter(a => !resumeState.completed.includes(a.id))
    : attacks;
  // Track completed attacks from resume state for accumulation at save time
  const completedFromResume = resumeState?.completed || [];

  if (!jsonMode) {
    console.log(`Playwright SageMathCell Test Suite`);
    console.log(`================================`);
    console.log(`Total attacks:     ${ALL_ATTACKS.length}`);
    console.log(`Running:           ${remainingAttacks.length}`);
    console.log(`Skipped:           ${ALL_ATTACKS.length - attacks.length} (${[...SKIP_ATTACKS].join(', ')})`);
    console.log(`Concurrency:       ${CONCURRENCY} pages`);
    console.log(`Runs per attack:   ${RUNS_PER_ATTACK}`);
    console.log(`Timeout per run:   ${ATTACK_TIMEOUT_MS}ms`);
    console.log(`Resume mode:       ${resumeMode ? 'yes' : 'no'}`);
    console.log();
  }

  if (remainingAttacks.length === 0 && resumeState) {
    console.log('All attacks already completed. Use without --resume to re-run.');
    // Still report the results from the progress file
  }

  // Start server
  if (!jsonMode) process.stdout.write('Starting preview server... ');
  const server = await startServer();
  if (!jsonMode) console.log(`ready at ${BASE_URL}\n`);

  if (serverOnly) {
    console.log('Server running. Press Ctrl+C to stop.');
    await new Promise(() => {});
  }

  // ── Begin test execution ──────────────────────────────────────────

  // Use previous results as starting point
  const allResults: AttackResult[] = resumeState
    ? Object.values(resumeState.results)
    : [];

  if (remainingAttacks.length > 0) {
    // Split remaining attacks into batches for concurrent pages
    const batchSize = Math.ceil(remainingAttacks.length / CONCURRENCY);
    const batches: AttackInfo[][] = [];
    for (let i = 0; i < remainingAttacks.length; i += batchSize) {
      batches.push(remainingAttacks.slice(i, i + batchSize));
    }

    // Launch a single shared browser (workers create fresh pages per attack internally)
    const browser = await chromium.launch({ headless: true });
    const startAll = Date.now();

    // Workers create pages on-demand; no need to stagger since each attack takes 3-30s+
    const workerPromises = batches.map(async (batch) => {
      const workerResults = await runWorker(browser, batch);
      return workerResults;
    });

    const settledResults = await Promise.allSettled(workerPromises);
    const nestedResults: AttackResult[][] = [];
    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        nestedResults.push(result.value);
      } else {
        console.warn(`Worker failed: ${result.reason}`);
      }
    }
    allResults.push(...nestedResults.flat());
    const totalTime = Date.now() - startAll;

    await browser.close();

    if (!jsonMode) {
      console.log(`\nExecution time: ${(totalTime / 1000).toFixed(1)}s`);
    }
  }

  // Clean up server
  server.kill('SIGTERM');

  // ── Aggregate Results ──────────────────────────────────────────────

  let totalRuns = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const ar of allResults) {
    for (const run of ar.runs) {
      totalRuns++;
      if (run.success) totalPassed++;
      else totalFailed++;
    }
  }

  // Save progress (merge with previously completed attacks from resume)
  const allCompleted = [...new Set([...completedFromResume, ...attacks.map(a => a.id)])];
  const finalProgress: ProgressState = { completed: allCompleted, results: {} };
  for (const ar of allResults) {
    finalProgress.results[ar.id] = ar;
  }
  saveProgress(finalProgress);

  if (jsonMode) {
    console.log(JSON.stringify({
      totalAttacks: allResults.length,
      totalRuns,
      passed: totalPassed,
      failed: totalFailed,
      totalTimeMs: 0,
      results: allResults.map(ar => ({
        id: ar.id,
        passed: ar.passed,
        failed: ar.failed,
        runs: ar.runs.map(r => ({
          success: r.success,
          durationMs: r.durationMs,
          error: r.error ? r.error.slice(0, 200) : null,
        })),
      })),
    }, null, 2));
    process.exit(totalFailed > 0 ? 1 : 0);
  }

  // ── Print Summary ──────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(` RESULTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Attacks:        ${allResults.length}/${attacks.length}`);
  console.log(`Total runs:     ${totalRuns}`);
  console.log(`Passed runs:    ${totalPassed}/${totalRuns}`);
  console.log(`Failed runs:    ${totalFailed}/${totalRuns}`);

  // Per-attack summary
  const partial = allResults.filter(ar => ar.failed > 0 && ar.failed < RUNS_PER_ATTACK);
  const allFailed = allResults.filter(ar => ar.failed === RUNS_PER_ATTACK);

  if (allFailed.length > 0) {
    console.log(`\n─── All ${RUNS_PER_ATTACK} Runs Failed ───`);
    for (const ar of allFailed) {
      console.log(`  ✗ ${ar.id}`);
      for (const run of ar.runs) {
        const e = run.error ? run.error.slice(0, 120) : run.output.slice(0, 120);
        console.log(`    Run ${run.run}: ${e}`);
      }
    }
  }

  if (partial.length > 0) {
    console.log(`\n─── Partial Failures (${1}-${RUNS_PER_ATTACK - 1}/${RUNS_PER_ATTACK}) ───`);
    for (const ar of partial) {
      console.log(`  ⚠ ${ar.id} (${ar.passed}/${RUNS_PER_ATTACK})`);
      for (const run of ar.runs) {
        if (!run.success) {
          const e = run.error ? run.error.slice(0, 120) : run.output.slice(0, 120);
          console.log(`    Run ${run.run}: ${e}`);
        }
      }
    }
  }

  // By category
  if (!failOnly) {
    console.log(`\n─── By Category ───`);
    const catDefs: { name: string; ids: string[] }[] = Array.from(attacksByCategory.entries()).map(([name, attacks]) => ({
      name,
      ids: attacks.map(a => a.id),
    }));

    for (const cat of catDefs) {
      const catResults = allResults.filter(ar => cat.ids.includes(ar.id));
      const catPassedAll = catResults.filter(ar => ar.failed === 0);
      console.log(`  ${cat.name.padEnd(24)} ${catPassedAll.length}/${catResults.length} clean`);
    }
  }

  if (totalFailed > 0) {
    console.log(`\n❌ ${totalFailed} run(s) failed across ${allFailed.length + partial.length} attack(s).`);
    console.log(`   Progress saved to: ${PROGRESS_FILE}`);
    console.log(`   Resume with:       bun run scripts/test-playwright.ts -- --resume`);
    process.exit(1);
  }
  console.log(`\n✅ All ${totalPassed} runs passed across ${allResults.length} attacks.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
