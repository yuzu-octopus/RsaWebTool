/**
 * Determine whether a SageMathCell output string indicates success.
 *
 * Uses explicit `=SUCCESS` / `=FAILED` markers when present (preferred).
 * Falls back to a heuristic keyword check for templates without markers.
 */
export function isActualSuccess(output: string): boolean {
  const trimmed = output.trim();

  // Check for explicit FAILED/SUCCESS markers (preferred)
  const failedIdx = trimmed.lastIndexOf('=FAILED');
  const successIdx = trimmed.lastIndexOf('=SUCCESS');
  if (failedIdx > -1 || successIdx > -1) {
    return successIdx > failedIdx;
  }

  // All current attack templates include =SUCCESS/=FAILED markers.
  // No heuristic fallback needed.
  return false;
}
