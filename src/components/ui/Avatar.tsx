import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Status = "online" | "away" | "offline" | "none";

const sizeClasses: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const statusDot: Record<Status, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-ink-faint",
  none: "hidden",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string;
  alt?: string;
  size?: Size;
  status?: Status;
  /** Accent background for initials fallback. */
  className?: string;
}

export function Avatar({
  name = "",
  src,
  alt,
  size = "md",
  status = "none",
  className,
  ...rest
}: AvatarProps) {
  const fallback = initials(name) || "?";

  return (
    <span className={cn("relative inline-flex shrink-0", className)} {...rest}>
      {src ? (
        <img
          src={src}
          alt={alt ?? name}
          className={cn("rounded-full object-cover ring-1 ring-edge-strong", sizeClasses[size])}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-navy-600 font-semibold text-white ring-1 ring-edge-strong",
            sizeClasses[size],
          )}
        >
          {fallback}
        </span>
      )}
      {status !== "none" && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-canvas",
            statusDot[status],
          )}
        />
      )}
    </span>
  );
}