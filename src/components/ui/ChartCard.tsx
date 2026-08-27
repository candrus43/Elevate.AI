import type { ReactNode } from "react";
import { cn } from "./cn";

/* ─────────────────────────────────────────────────────────────────
 * ChartCard — container for a titled chart (sparkline, bar, etc.).
 * Includes a dependency-free SVG sparkline and horizontal bar renderer.
 * ───────────────────────────────────────────────────────────────── */

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function ChartCard({ title, subtitle, children, className, actions }: ChartCardProps) {
  return (
    <div className={cn("rounded-xl border border-edge bg-panel p-5", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
          {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

/* ── Sparkline (dependency-free SVG polyline) ───────────────── */

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

const f = (n: number) => Number.isFinite(n) ? n : 0;

export function Sparkline({
  data,
  width = 100,
  height = 32,
  stroke = "var(--accent-fg, #59adff)",
  className,
}: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((f(v) - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full overflow-visible", className)}
      fill="none"
      aria-hidden
    >
      <polyline points={points.join(" ")} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Horizontal bar (dependency-free) ────────────────────────── */

export interface BarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  className?: string;
}

export function Bar({ value, max = 100, color = "var(--accent-fg, #59adff)", label, className }: BarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      {label ? <span className="w-14 shrink-0 truncate text-ink-muted">{label}</span> : null}
      <div className="h-2 flex-1 rounded-full bg-panel-raised">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right tabular-nums text-ink-faint">{value}</span>
    </div>
  );
}