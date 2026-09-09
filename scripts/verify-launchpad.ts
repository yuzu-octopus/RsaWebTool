import { spawn, type ChildProcess } from 'child_process';
import { chromium } from 'playwright';

const PORT = 4187;
const BASE_URL = `http://127.0.0.1:${PORT}/RsaWebTool/`;
const FALLBACK_TEXT = 'This part of the workspace could not load';

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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Magic Cracker' }).click();
    await page.getByRole('heading', { name: 'Magic Cracker' }).waitFor({ timeout: 5000 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Try Hastad Broadcast' }).click();
    await page.getByTestId('input-tab').waitFor({ timeout: 5000 });
    const text = await page.locator('body').innerText();
    assert(!text.includes(FALLBACK_TEXT), 'Launchpad navigation crashed the workspace');
    console.log('PASS: launchpad empty state');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
