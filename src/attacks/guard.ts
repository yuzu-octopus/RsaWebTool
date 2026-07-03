/**
 * Wraps attack-specific Python code in standard SageMath execution boilerplate.
 *
 * Generates the full Python template with:
 * - Top-level imports (if any)
 * - `def _attack():` wrapper
 * - Outer `try:` with `out = []` initialization
 * - Optional sageGuardBlock (n<2, n%2, is_prime, is_square)
 * - Attack-specific body (parameter parsing + algorithm)
 * - `print("\\n".join(out))` success path
 * - Triple try/except error handling (Exception→BaseException)
 * - `_attack()` call
 *
 * Usage:
 *   sageTemplate: (vals) => wrapSageTemplate({
 *     token: 'MY_ATTACK',
 *     imports: ['import math'],
 *     body: `        n = Integer(${vals.n})
 *         e = Integer(${vals.e})
 *         # algorithm body...`
 *   })
 *
 * @param opts.token Attack token for SUCCESS/FAILED markers
 * @param opts.body Attack-specific Python code (indented at 8 spaces, inside the outer try)
 * @param opts.imports Top-level Python imports (default: [])
 * @param opts.useGuard Whether to include sageGuardBlock (default: true)
 * @param opts.guardIndent Indent for sageGuardBlock (default: '        ')
 * @param opts.n Expression for n (e.g., vals.n) — emitted before guard block when useGuard=true
 */
export function wrapSageTemplate(opts: {
  token: string;
  body: string;
  imports?: string[];
  useGuard?: boolean;
  guardIndent?: string;
  n?: string;
}): string {
  const {
    token,
    body,
    imports = [],
    useGuard = true,
    guardIndent = '        ',
    n,
  } = opts;

  const parts: string[] = [];

  if (imports.length > 0) {
    parts.push(imports.join('\n'));
  }

  parts.push(`def _attack():
    try:
        out = []`);

  if (useGuard) {
    if (n) {
      parts.push(`${guardIndent}n = Integer(${n})`);
    }
    parts.push(sageGuardBlock(token, guardIndent));
  }

  parts.push(body.replace(/\s+$/, ''));

  parts.push(`        print("\\n".join(out))
    except Exception as e:
        try:
            out.append(f"ERROR: {e}")
            out.append("${token}=FAILED")
            print("\\n".join(out))
        except:
            print(f"ERROR: {e}")
            print("${token}=FAILED")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("${token}=FAILED")
_attack()`);

  return parts.join('\n');
}

/**
 * Shared SageMath guard block template.
 *
 * Generates the standard 4-guard block (n<2, n%2, is_prime, is_square)
 * used at the start of most Factorization attack templates.
 *
 * Usage:
 *   sageTemplate: (vals) => `import math
 *   def _attack():
 *       try:
 *           n = Integer(${vals.n})
 *           ${sageGuardBlock("TOKEN")}
 *           # real algorithm...
 *
 * @param token The attack token for SUCCESS/FAILED markers (e.g., "SMALL_FRACTION")
 * @param indent Python indentation level for the guard block (default 8 spaces)
 */
function sageGuardBlock(token: string, indent = '        '): string {
  const inner = `${indent}    `;
  return `${indent}if n < 2:
${inner}print(f"n = {n} is too small to factor")
${inner}print("${token}=FAILED")
${inner}return
${indent}if n % 2 == 0:
${inner}print(f"n is even: {n}")
${inner}print(f"p = 2")
${inner}print(f"q = {n // 2}")
${inner}print(f"Verification: 2 * {n // 2} = {n}")
${inner}print("${token}=SUCCESS")
${inner}return
${indent}if n.is_prime():
${inner}print(f"n is prime: {n}")
${inner}print("No factorization possible")
${inner}print("${token}=FAILED")
${inner}return
${indent}if n.is_square():
${inner}p = isqrt(n)
${inner}print(f"n is a perfect square: {p}^2 = {n}")
${inner}print(f"Verification: p * q = {p * p}")
${inner}print(f"p = {p}")
${inner}print(f"q = {p}")
${inner}print()
${inner}print("${token}=SUCCESS")
${inner}return`;
}

/**
 * Sanitize a user-supplied string for safe interpolation into a Python
 * string literal. Escapes backslashes, quotes, and newlines.
 */
export function sanitizePython(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

export function validateNumeric(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`${fieldName} must be a valid integer, got: "${trimmed.slice(0, 50)}"`);
  }
  return trimmed;
}
