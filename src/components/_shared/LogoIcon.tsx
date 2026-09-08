/**
 * Shared logo SVG component. Used in:
 * - Sidebar header (this component)
 * - index.html favicon (inline copy — update both if design changes)
 *
 * Design: Dracula purple unlocked padlock on transparent background.
 * For favicon, wrap in a 72x72 rounded-rect with var(--dracula-bg) background.
 * Fills use brand tokens (never raw hex) so the logo follows the Dracula theme.
 */
interface LogoIconProps {
  size?: number | string;
  className?: string;
}

export function LogoIcon({ size = '100%', className }: LogoIconProps) {
  return (
    <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={className}>
      <rect x="18" y="32" width="36" height="28" rx="4" fill="var(--dracula-purple)" />
      <path d="M24 32V24a12 12 0 0 1 12-12h0a12 12 0 0 1 12 12v2" fill="none" stroke="var(--dracula-purple)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="36" cy="46" r="3.5" fill="var(--dracula-bg)" />
      <path d="M34.5 46l1.5 5 1.5-5z" fill="var(--dracula-bg)" />
    </svg>
  );
}
