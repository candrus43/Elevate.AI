import type { ReactNode } from "react";
import { cn } from "./cn";
import { Sparkles } from "./icons";

export interface AIInsightCardProps {
  title: string;
  body: ReactNode;
  confidence?: "high" | "medium" | "low" | "requires_review";
  source?: string;
  actions?: ReactNode;
  className?: string;
}

const confidenceLabel: Record<NonNullable<AIInsightCardProps["confidence"]>, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  requires_review: "Requires human review",
};

const confidenceColor: Record<NonNullable<AIInsightCardProps["confidence"]>, string> = {
  high: "text-emerald-400",
  medium: "text-amber-400",
  low: "text-red-400",
  requires_review: "text-teal-300",
};

const confidenceBg: Record<NonNullable<AIInsightCardProps["confidence"]>, string> = {
  high: "bg-emerald-500/10",
  medium: "bg-amber-500/10",
  low: "bg-red-500/10",
  requires_review: "bg-teal-500/10",
};

export function AIInsightCard({
  title,
  body,
  confidence,
  source,
  actions,
  className,
}: AIInsightCardProps) {
  return (
    <div className={cn("rounded-xl border border-edge bg-panel p-5", className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-500/15 text-accent-400">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        {confidence && (
          <span
            className={cn(
              "ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              confidenceBg[confidence],
              confidenceColor[confidence],
            )}
          >
            {confidenceLabel[confidence]}
          </span>
        )}
      </div>

      <div className="text-sm leading-relaxed text-ink-muted">{body}</div>

      {(source || actions) && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-edge pt-3">
          {source ? (
            <p className="text-xs text-ink-faint">
              <span className="mr-1 opacity-50">Source:</span>
              {source}
            </p>
          ) : (
            <span />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
    </div>
  );
}