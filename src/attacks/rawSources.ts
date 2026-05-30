/**
 * Vite glob import: fetches all attack .ts files as raw strings at build time.
 * This preserves the original TypeScript source even after minification in
 * production builds. Files are loaded lazily — only the specific attack file
 * is fetched when requested.
 */
const rawModules = import.meta.glob('./*.ts', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

/**
 * Load the raw TypeScript source for a given attack file.
 * Returns the full file source or null if the file is not found.
 */
export async function getAttackSource(attackId: string): Promise<string | null> {
  const key = `./${attackId}.ts`;
  const loader = rawModules[key];
  if (!loader) return null;
  try {
    return await loader();
  } catch {
    return null;
  }
}
