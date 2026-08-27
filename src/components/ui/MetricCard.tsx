import type { ReactNode } from "react";
import { cn } from "./cn";
import { Sparkline } from "./ChartCard";

type Tone = "default" | "positive" | "negative" | "accent";

export interface MetricCardProps {
  label: string;
  value: string;
  /** Secondary context line (e.g. "12% vs last week"). */
  delta?: string;
  /** Direction for the delta color when `tone` is not explicitly set. */
  deltaDirection?: "up" | "down" | "neutral";
  tone?: Tone;
  icon?: ReactNode;
  /** Optional sparkline data (dependency-free). */
  sparkline?: number[];
  hint?: string;
  className?: string;
}

const valueTone: Record<Tone, string> = {
  default: "text-ink",
  positive: "text-emerald-400",
  negative: "text-red-400",
  accent: "text-accent-fg",
};

const deltaTone = (tone: Tone, dir?: MetricCardProps["deltaDirection"]) => {
  if (tone === "positive") return "text-emerald-400";
  if (tone === "negative") return "text-red-400";
  if (dir === "up") return "text-emerald-400";
  if (dir === "down") return "text-red-400";
  return "text-ink-faint";
};

export function MetricCard({
  label,
  value,
  delta,
  deltaDirection,
  tone = "default",
  icon,
  sparkline,
  hint,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-edge bg-panel p-5 transition-colors hover:border-edge-strong",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{label}</p>
        {icon && <span className="text-ink-faint [&>svg]:h-5 [&>svg]:w-5">{icon}</span>}
      </div>

      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className={cn("truncate text-2xl font-bold tracking-tight sm:text-3xl", valueTone[tone])}>
            {value}
          </p>
          {delta && (
            <p className={cn("mt-0.5 text-xs font-medium", deltaTone(tone, deltaDirection))}>{delta}</p>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="w-20 shrink-0 sm:w-24">
            <Sparkline data={sparkline} />
          </div>
        )}
      </div>

      {hint && <p className="mt-2 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}