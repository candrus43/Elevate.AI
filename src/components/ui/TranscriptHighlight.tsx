import type { ReactNode } from "react";
import { cn } from "./cn";
import { SeverityBadge } from "./SeverityBadge";
import type { Severity } from "./SeverityBadge";

export interface TranscriptHighlightProps {
  /** e.g. "00:42" */
  timestamp: string;
  speaker?: string;
  text: ReactNode;
  /** Highlight this segment (e.g. finding evidence or a coaching moment). */
  highlighted?: boolean;
  /** Optional associated finding severity (renders a badge). */
  severity?: Severity;
  onClick?: () => void;
  className?: string;
}

export function TranscriptHighlight({
  timestamp,
  speaker,
  text,
  highlighted = false,
  severity,
  onClick,
  className,
}: TranscriptHighlightProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        onClick && "hover:bg-panel-raised/60",
        highlighted && "bg-accent-500/10 ring-1 ring-inset ring-accent-500/30",
        !highlighted && severity && "bg-red-500/5",
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 font-mono text-xs text-ink-faint tabular-nums">{timestamp}</span>
      <div className="min-w-0 flex-1">
        {speaker && (
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{speaker}</p>
        )}
        <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{text}</p>
        {severity && (
          <div className="mt-1.5">
            <SeverityBadge severity={severity} />
          </div>
        )}
      </div>
    </Tag>
  );
}