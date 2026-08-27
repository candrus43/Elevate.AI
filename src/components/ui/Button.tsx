import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./icons";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  href?: string;
  target?: string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  title?: string;
  "aria-label"?: string;
  "aria-current"?: string;
  "aria-expanded"?: boolean;
  id?: string;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 shadow-glow active:scale-[0.98]",
  secondary:
    "bg-panel-raised text-ink border border-edge hover:border-edge-strong hover:bg-graphite-850 active:scale-[0.98]",
  outline:
    "border border-edge-strong text-ink hover:bg-panel hover:border-accent-500/50 active:scale-[0.98]",
  ghost: "text-ink-muted hover:bg-panel hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

const spinnerSize: Record<Size, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  href,
  target,
  onClick,
  className,
  leftIcon,
  rightIcon,
  title,
  fullWidth = false,
  ...aria
}: ButtonProps) {
  const classes = cn(
    base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  const inner = (
    <>
      {loading ? <Spinner className={cn("animate-spin", spinnerSize[size])} /> : leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        onClick={onClick}
        title={title}
        aria-label={aria["aria-label"]}
        aria-current={aria["aria-current"]}
        aria-disabled={disabled || loading}
        className={classes}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled || loading}
      aria-label={aria["aria-label"]}
      aria-current={aria["aria-current"]}
      aria-expanded={aria["aria-expanded"]}
      className={classes}
    >
      {inner}
    </button>
  );
}
