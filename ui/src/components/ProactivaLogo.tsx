interface ProactivaLogoProps {
  className?: string;
  size?: number;
}

/**
 * Proactiva brand mark — a "P" inside a circle.
 * Renders in `currentColor` so it inherits whatever text color the context
 * provides (white on the dark theme, dark on the light theme, brand cyan
 * when placed inside a brand-colored wrapper).
 */
export function ProactivaLogo({ className, size }: ProactivaLogoProps) {
  const dim = size ?? 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={dim}
      height={dim}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Proactiva"
      role="img"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 17V7h4.5a3 3 0 0 1 0 6H9" />
    </svg>
  );
}
