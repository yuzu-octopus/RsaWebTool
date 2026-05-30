var e=`/**
 * Shared SageMath guard block template.
 *
 * Generates the standard 4-guard block (n<2, n%2, is_prime, is_square)
 * used at the start of most Factorization attack templates.
 *
 * Usage:
 *   sageTemplate: (vals) => \`import math
 *   def _attack():
 *       try:
 *           n = Integer(\${vals.n})
 *           \${sageGuardBlock("TOKEN")}
 *           # real algorithm...
 *
 * @param token The attack token for SUCCESS/FAILED markers (e.g., "SMALL_FRACTION")
 * @param indent Python indentation level for the guard block (default 8 spaces)
 */
export function sageGuardBlock(token: string, indent = '        '): string {
  const inner = \`\${indent}    \`;
  return \`\${indent}if n < 2:
\${inner}print(f"n = {n} is too small to factor")
\${inner}print("\${token}=FAILED")
\${inner}return
\${indent}if n % 2 == 0:
\${inner}print(f"n is even: {n}")
\${inner}print(f"p = 2")
\${inner}print(f"q = {n // 2}")
\${inner}print(f"Verification: 2 * {n // 2} = {n}")
\${inner}print("\${token}=SUCCESS")
\${inner}return
\${indent}if n.is_prime():
\${inner}print(f"n is prime: {n}")
\${inner}print("No factorization possible")
\${inner}print("\${token}=FAILED")
\${inner}return
\${indent}if n.is_square():
\${inner}p = isqrt(n)
\${inner}print(f"n is a perfect square: {p}^2 = {n}")
\${inner}print(f"Verification: p * q = {p * p}")
\${inner}print(f"p = {p}")
\${inner}print(f"q = {p}")
\${inner}print()
\${inner}print("\${token}=SUCCESS")
\${inner}return\`;
}
`;export{e as default};