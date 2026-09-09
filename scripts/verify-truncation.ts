import { spawn, type ChildProcess } from 'child_process';
import { chromium } from 'playwright';

const PORT = 4188;
const BASE_URL = `http://127.0.0.1:${PORT}/RsaWebTool/`;

async function startServer(): Promise<ChildProcess> {
  const server = spawn('bun', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: import.meta.dirname + '/..',
    stdio: 'ignore',
  });

  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if ((await fetch(BASE_URL)).ok) return server;
    } catch { /* preview server is still starting */ }
    const delay = Promise.withResolvers<void>();
    setTimeout(delay.resolve, 500);
    await delay.promise;
  }

  server.kill();
  throw new Error(`Preview server did not start at ${BASE_URL}`);
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 1440, height: 900 });
    // Expand every collapsible category so collapsed groups are measured too —
    // without this only the default-expanded groups have visible labels.
    while ((await page.locator('button[aria-expanded="false"]').count()) > 0) {
      const before = await page.locator('button[aria-expanded="false"]').count();
      await page.locator('button[aria-expanded="false"]').first().click();
      await page.waitForFunction(
        count => document.querySelectorAll('button[aria-expanded="false"]').length < count,
        before,
      );
    }
    // NOTE: brief deviation — the [data-testid] node is the row BUTTON
    // (white-space: normal, never overflows itself), so the brief's verbatim
    // selector measures 0 clipped even at width 220. The real truncation
    // happens on SideNavItem's inner label SPAN (overflow hidden + ellipsis),
    // so the check targets that element instead. Threshold/message unchanged.
    const clipped = await page.evaluate(() => Array.from(
      document.querySelectorAll('[data-testid^="attack-"] span')
    ).filter(el => getComputedStyle(el).textOverflow === 'ellipsis'
      && (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1).length);
    // Category/calculator headers: the collapsible toggle buttons
    // (button[aria-expanded]) — their inner ellipsis label span must never
    // clip. Fixed by widening the rail 264→280 (the measured overflow of
    // 'Partial Key / Lattice' was 15px); SideNavItem's label is string-only
    // with no wrap prop, so width is the only kit-supported remedy.
    const clippedHeaders: string[] = await page.evaluate(() => Array.from(
      document.querySelectorAll('button[aria-expanded] span')
    ).filter(el => getComputedStyle(el).textOverflow === 'ellipsis'
      && (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1)
      .map(el => (el.textContent ?? '').trim()).filter(Boolean));
    if (clippedHeaders.length > 0) throw new Error(`header labels truncated: ${clippedHeaders.join(' | ')}`);
    // Allowance 10: measured 2026-09-09 at 1440px viewport / 280px rail with
    // every category expanded (see loop above). These 10 attack labels still
    // ellipsize, which is acceptable because every attack/category/calculator
    // row now carries a native `title` fallback (see nativeTitle in
    // src/components/Sidebar.tsx) — the kit Tooltip only covers the collapsed
    // rail, so the title covers the expanded truncated rows. Raise this
    // number only after re-measuring. (Format Converter segments measured
    // clean at 1440px — scrollWidth == clientWidth on all 8 radios — and
    // SegmentedControl offers no scroll/wrap prop, so there is nothing to fix
    // or cover there.)
    if (clipped > 10) throw new Error(`${clipped} nav labels still truncated`);
    console.log(`OK: ${clipped} clipped nav labels (within allowance of 10), 0 clipped headers`);
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
