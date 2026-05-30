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

/**
 * Strip common leading whitespace from each line (for dedenting .toString() output).
 */
export function dedent(str: string): string {
  const lines = str.split('\n');
  const minIndent = lines.reduce((min, line) => {
    if (line.trim().length === 0) return min;
    const match = line.match(/^(\s*)/);
    return Math.min(min, match ? match[1].length : 0);
  }, Infinity);
  if (minIndent === Infinity || minIndent === 0) return str;
  return lines.map(line => line.slice(minIndent)).join('\n');
}

/**
 * Extract the frontendCheck arrow function body from raw TypeScript source using
 * brace counting. Handles nested braces, nested parentheses in type annotations,
 * template literals, and return type annotations.
 *
 * Returns the extracted function body (from the opening `(` of params to the
 * matching `}` of the body), or null if extraction fails.
 */
export function extractFrontendCheck(rawSource: string): string | null {
  // 1. Find the "frontendCheck:" marker
  const marker = rawSource.indexOf('frontendCheck:');
  if (marker === -1) return null;

  let idx = marker + 'frontendCheck:'.length;

  // Skip whitespace
  while (idx < rawSource.length && /\s/.test(rawSource[idx])) idx++;

  // Skip "async" keyword if present (before params)
  if (rawSource.substring(idx, idx + 5) === 'async') {
    idx += 5;
    while (idx < rawSource.length && /\s/.test(rawSource[idx])) idx++;
  }

  // 2. Count parentheses through parameter list — handles nested parens
  // in type annotations like onProgress?: (pct: number, detail?: string) => void
  if (rawSource[idx] !== '(') return null;
  let parenDepth = 1;
  idx++;
  while (idx < rawSource.length && parenDepth > 0) {
    if (rawSource[idx] === '(') parenDepth++;
    else if (rawSource[idx] === ')') {
      parenDepth--;
      if (parenDepth === 0) {
        idx++; // move past closing paren
        break;
      }
    }
    idx++;
  }
  if (parenDepth !== 0) return null;

  // 3. Skip whitespace and any return type annotation (e.g., ": Promise<string | null>")
  //    by scanning forward for =>
  while (idx < rawSource.length - 1) {
    if (rawSource[idx] === '=' && rawSource[idx + 1] === '>') {
      idx += 2;
      break;
    }
    idx++;
  }
  if (idx >= rawSource.length - 1) return null;

  // Skip whitespace to find the opening {
  while (idx < rawSource.length && /\s/.test(rawSource[idx])) idx++;
  if (rawSource[idx] !== '{') return null;

  // 4. Brace-count from the opening { to find the matching closing }
  // Tracks template expression depth ($ {...}) to avoid counting
  // template literal braces as real scope braces.
  let braceDepth = 0;
  let templateDepth = 0;

  while (idx < rawSource.length) {
    const ch = rawSource[idx];

    if (ch === '{') {
      if (templateDepth > 0) {
        // Nested brace inside a template expression — still counts
        braceDepth++;
      } else {
        // Check if this is a template expression start ${...}
        if (idx > 0 && rawSource[idx - 1] === '$') {
          templateDepth++;
          braceDepth++;
        } else {
          braceDepth++;
        }
      }
    } else if (ch === '}') {
      if (braceDepth === 0) break; // Should not happen in valid code

      braceDepth--;
      if (templateDepth > 0 && braceDepth === templateDepth) {
        // We just closed a template expression
        templateDepth--;
      }

      if (braceDepth === 0) {
        idx++; // include closing brace
        break;
      }
    }
    idx++;
  }

  if (braceDepth !== 0) return null;

  // 5. Extract from after "frontendCheck:" to the closing }
  // Find the actual start of the function (skip prefix + async)
  let funcStart = marker + 'frontendCheck:'.length;
  while (funcStart < rawSource.length && /\s/.test(rawSource[funcStart])) funcStart++;

  const funcBody = rawSource.substring(funcStart, idx);
  return dedent(funcBody.trim());
}
