import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "positive" | "negative" | "warning" | "info" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
  dot?: boolean;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-panel-raised text-ink-muted border-edge",
  positive: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  negative: "bg-red-500/10 text-red-300 border-red-500/25",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  info: "bg-sky-500/10 text-sky-300 border-sky-500/25",
  accent: "bg-accent-500/10 text-accent-300 border-accent-500/25",
};

const dotClasses: Record<Tone, string> = {
  neutral: "bg-ink-faint",
  positive: "bg-emerald-400",
  negative: "bg-red-400",
  warning: "bg-amber-400",
  info: "bg-sky-400",
  accent: "bg-accent-400",
};

export function Badge({ tone = "neutral", icon, dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span className="h-3.5 w-3.5">{icon}</span>
      ) : dot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[tone])} />
      ) : null}
      {children}
    </span>
  );
}