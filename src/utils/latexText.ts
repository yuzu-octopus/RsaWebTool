// Single source for the LaTeX text commands rendered as inline wrappers,
// shared by balanced `\cmd{...}` conversion and unbalanced-opener stripping.
const TEXT_COMMANDS = ['texttt', 'text', 'emph', 'underline', 'textbf', 'textit'] as const;
const TEXT_COMMAND_HTML: Record<(typeof TEXT_COMMANDS)[number], [string, string]> = {
  texttt: ['<code>', '</code>'],
  text: ['<span>', '</span>'],
  emph: ['<em>', '</em>'],
  underline: ['<u>', '</u>'],
  textbf: ['<strong>', '</strong>'],
  textit: ['<em>', '</em>'],
};
const balancedWrapperRegexes: Array<[RegExp, string]> = TEXT_COMMANDS.map((cmd) => [
  new RegExp(`\\\\${cmd}\\{([^}]*)\\}`, 'g'),
  `${TEXT_COMMAND_HTML[cmd][0]}$1${TEXT_COMMAND_HTML[cmd][1]}`,
]);
const unbalancedOpenerRegex = new RegExp(`\\\\(${TEXT_COMMANDS.join('|')})\\{`, 'g');

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converts LaTeX text commands to HTML for rendering.
 */
export function renderInlineText(text: string): string {
  let html = escapeHtml(text);
  // Process LaTeX command wrappers before escape sequences
  for (const [re, replacement] of balancedWrapperRegexes) html = html.replace(re, replacement);
  html = html.replace(/\\&/g, '&');
  html = html.replace(/\\#/g, '#');
  html = html.replace(/\\%/g, '%');
  html = html.replace(/\\'/g, "'");
  // Strip math-split remnants: unbalanced openers and orphan closers.
  // Supported math never reaches here (InlineMath routes $...$ and
  // \(...\) without an inner ')' to KaTeX; parseProof extracts the
  // supported starred display envs), so a leftover opener/orphan closer
  // is a split artifact, not content. Unsupported forms (\(...\) with an
  // inner ')', \[...\], non-starred envs) can still arrive as text.
  html = html.replace(unbalancedOpenerRegex, '');
  // Spare escaped closers: \{ and \} become literals below, so only
  // strip unescaped orphans (converting first would re-expose \} as a
  // fresh orphan and eat it again).
  html = html.replace(/(?<!\\)\}/g, '');
  html = html.replace(/\\\{/g, '{');
  html = html.replace(/\\\}/g, '}');
  return html;
}
