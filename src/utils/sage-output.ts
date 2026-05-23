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

  // Heuristic fallback for legacy templates without markers.
  // NOTE: This is inherently fuzzy — `p =` or `found` can match intermediate output
  // like "Trying p = 2..." or "No factor found". Only triggers when explicit
  // =SUCCESS/=FAILED markers are absent; all current attack templates include markers.
  const text = trimmed.toLowerCase();
  if (/failed|error|impossible|no factor found|could not|unable to/.test(text)) {
    return false;
  }
  if (/=success|p =|q =|factors:|recovered|found|decrypted/.test(text)) {
    return true;
  }
  return false;
}
