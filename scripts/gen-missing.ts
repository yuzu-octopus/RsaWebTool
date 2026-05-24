import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { attacks, testcaseGenerators } from '../src/attacks/index';

const TEMPLATE_DIR = resolve(import.meta.dirname, 'test-results', 'templates');
if (!existsSync(TEMPLATE_DIR)) mkdirSync(TEMPLATE_DIR, { recursive: true });

// Build a map of attack.id → attack for quick lookup
const attackMap = new Map(attacks.map(a => [a.id, a]));

for (const [id, gen] of Object.entries(testcaseGenerators)) {
  const attack = attackMap.get(id);
  const attackName = attack?.name ?? id;
  const attackCategory = attack?.category ?? 'Unknown';

  const targetPath = resolve(TEMPLATE_DIR, `${id}.sage`);

  // Skip existing files — gen-missing only creates what's not there
  if (existsSync(targetPath)) {
    console.log(`${id}: SKIP (exists already)`);
    continue;
  }

  try {
    const vals = gen();
    const sageCode = attack?.sageTemplate(vals) ?? '# No template available';
    const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const header = `# Test case for ${attackName} (${id})\n# Category: ${attackCategory}\n# Generated: ${dateStr}\n\n`;
    writeFileSync(targetPath, header + sageCode, 'utf-8');
    console.log(`${id}: OK (keys: ${Object.keys(vals).join(',')})`);
  } catch (err) {
    console.error(`${id}: ERROR — ${err instanceof Error ? err.message : String(err)}`);
  }
}
console.log('Done');
