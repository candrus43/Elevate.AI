import { useId } from "react";

/**
 * ElevateAI brand logo — inline SVG mark + wordmark.
 * Crisp at any size; single consistent logo across the product.
 * Mark: gradient rounded square with ascending bars (performance trending up).
 * Wordmark: "Elevate" in ink (adapts to light/dark), "AI" in accent.
 */
export function BrandLogo({
  className = "",
  markClassName = "h-7 w-7",
  showWordmark = true,
  wordmarkClassName = "text-[17px] font-bold tracking-tight text-ink",
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  const gid = useId().replace(/:/g, "");
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className={`${markClassName} shrink-0`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${gid}-mark`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#338fff" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8.5" fill={`url(#${gid}-mark)`} />
        <rect x="7.5" y="18" width="4" height="7" rx="1.5" fill="#ffffff" opacity="0.62" />
        <rect x="14" y="12.5" width="4" height="12.5" rx="1.5" fill="#ffffff" opacity="0.82" />
        <rect x="20.5" y="7" width="4" height="18" rx="1.5" fill="#ffffff" />
      </svg>
      {showWordmark && (
        <span className={`whitespace-nowrap ${wordmarkClassName}`}>
          Elevate<span className="text-accent-500">AI</span>
        </span>
      )}
    </span>
  );
}
