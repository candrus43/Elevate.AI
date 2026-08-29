import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { AlertTriangle, Check, Info, ShieldAlert } from "./icons";

/**
 * Compliance / risk severity levels (ordered by intensity).
 * `requires_review` maps to "requires human review" — never a confirmed violation.
 */
export type Severity = "info" | "low" | "medium" | "high" | "critical" | "requires_review";

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
  /** Optional override of the rendered label (defaults to the severity name). */
  label?: string;
  icon?: ReactNode;
}

const config: Record<Severity, { label: string; classes: string; icon: ReactNode }> = {
  info: {
    label: "Info",
    classes: "bg-sky-500/10 text-sky-300 border-sky-500/25",
    icon: <Info className="h-3.5 w-3.5" />,
  },
  low: {
    label: "Low",
    classes: "bg-slate-500/10 text-slate-300 border-slate-500/25",
    icon: <Info className="h-3.5 w-3.5" />,
  },
  medium: {
    label: "Medium",
    classes: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  high: {
    label: "High",
    classes: "bg-orange-500/10 text-orange-300 border-orange-500/25",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  critical: {
    label: "Critical",
    classes: "bg-red-500/10 text-red-300 border-red-500/25",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  requires_review: {
    label: "Requires review",
    classes: "bg-teal-500/10 text-teal-300 border-teal-500/25",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

export function SeverityBadge({
  severity,
  label,
  icon,
  className,
  ...rest
}: SeverityBadgeProps) {
  const c = config[severity];
  const text = label ?? c.label;
  return (
    <span
      title={text}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        c.classes,
        className,
      )}
      {...rest}
    >
      {icon ?? c.icon}
      {text}
    </span>
  );
}

/** Green confirmation chip (severity resolved / confirmed) — kept separate from sales tones. */
export function ResolvedBadge({ className, children = "Resolved", ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300",
        className,
      )}
      {...rest}
    >
      <Check className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}