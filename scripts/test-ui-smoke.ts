import { spawn, type ChildProcess } from 'child_process';
import { chromium } from 'playwright';

const PORT = 4174;
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
    const blockedRequests: string[] = [];
    await page.route('**/assets/MagicPanel-*.js', route => {
      blockedRequests.push(route.request().url());
      return route.abort();
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const initialText = await page.locator('body').innerText();
    assert(!initialText.includes(FALLBACK_TEXT), `Workspace crashed after a missing view chunk: ${blockedRequests.join(', ')}`);
    assert(blockedRequests.length === 0, 'Workspace shell must not depend on lazy view chunks');
    assert(await page.getByRole('button', { name: /search commands/i }).count() === 0, 'Visible command-search controls must be absent');
    await page.locator('#sidebar-attack-pollard-rho').click();
    await page.getByTestId('input-tab').waitFor();
    assert(!(await page.locator('body').innerText()).includes(FALLBACK_TEXT), 'Selecting an attack crashed the workspace');
    await page.getByTestId('source-tab').click();
    const sagePreview = page.locator('#attack-tabpanel-2 pre');
    await sagePreview.waitFor();
    assert((await sagePreview.textContent()).includes('Integer(1)'), 'Sage source preview must use valid placeholders');
    assert(!(await page.locator('body').innerText()).includes(FALLBACK_TEXT), 'Opening Sage source crashed the workspace');

    await page.getByTestId('input-tab').click();
    const modulusInput = page.locator('textarea').first();
    await modulusInput.waitFor();
    await page.getByTestId('generate-testcase').click();
    await page.waitForFunction(() => Boolean(document.querySelector('textarea')?.value));
    await page.getByTestId('run-attack').click();
    await page.getByText(/POLLARD_RHO=SUCCESS/).waitFor({ timeout: 30_000 });


    for (const [mode, heading] of [
      ['instructions', 'Instructions'],
      ['magic', 'Magic Cracker'],
      ['proofs', 'Attack Index'],
      ['format-converter', 'Format Converter'],
      ['pem', 'PEM Key Decryptor'],
    ] as const) {
      await page.locator(`#sidebar-view-${mode}`).click();
      await page.getByRole('heading', { name: heading }).waitFor();
      const text = await page.locator('body').innerText();
      assert(!text.includes(FALLBACK_TEXT), `${mode} crashed the workspace`);
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
