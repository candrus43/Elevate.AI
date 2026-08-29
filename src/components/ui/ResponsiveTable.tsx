import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { useIsMobile } from "./use-media-query";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
} from "./Table";
import { ChevronDown } from "./icons";

/* ─────────────────────────────────────────────────────────────────
 * ResponsiveTable — renders a real <table> on desktop and stacked
 * cards on mobile (<768px). No horizontal scroll; secondary fields
 * collapse behind an expand/collapse toggle on mobile.
 *
 * Mobile layout:
 *   · `primary` column becomes the card title (emphasized).
 *   · other non-hidden columns render as "label — value" rows.
 *   · fields beyond `collapseAfter` are hidden until expanded.
 * ───────────────────────────────────────────────────────────────── */

export interface ResponsiveColumn<T> {
  /** Stable identifier for this column. */
  key: string;
  /** Desktop header text. */
  header: ReactNode;
  /** Render the cell content. */
  render: (row: T, index: number) => ReactNode;
  /** The primary field — emphasized as the mobile card title. */
  primary?: boolean;
  /** Omit this column entirely on mobile (not even in collapsed section). */
  hideOnMobile?: boolean;
  /** Label used on the mobile card (defaults to `header`). */
  label?: ReactNode;
  /** Optional classes applied to the desktop `<td>`. */
  className?: string;
  /** Optional classes applied to the desktop `<th>`. */
  headerClassName?: string;
}

export interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[];
  data: T[];
  /** Stable React key per row. */
  getKey: (row: T, index: number) => string;
  emptyState?: ReactNode;
  /** Number of non-primary fields to show on mobile before collapsing the rest. */
  collapseAfter?: number;
  className?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  getKey,
  emptyState,
  collapseAfter = 2,
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  const secondaryCols = columns.filter(
    (c) => c !== primaryCol && !c.hideOnMobile,
  );

  /* ── Desktop table ─────────────────────────────────────────────── */
  if (!isMobile) {
    return (
      <div className={cn("w-full", className)}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableHeaderCell key={col.key} className={col.headerClassName}>
                  {col.header}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableEmpty colSpan={columns.length}>{emptyState ?? "No data yet"}</TableEmpty>
            ) : (
              data.map((row, i) => (
                <TableRow key={getKey(row, i)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(row, i)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  /* ── Mobile stacked cards ───────────────────────────────────────── */
  if (data.length === 0) {
    return (
      <div className={cn("px-5 py-12 text-center text-sm text-ink-faint", className)}>
        {emptyState ?? "No data yet"}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((row, i) => {
        const key = getKey(row, i);
        const isOpen = !!expanded[key];
        const visibleSecondary = secondaryCols.slice(0, collapseAfter);
        const hiddenSecondary = secondaryCols.slice(collapseAfter);

        return (
          <div
            key={key}
            className="rounded-xl border border-edge bg-panel p-4"
          >
            {/* Primary field as the card title */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {primaryCol.label && (
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                    {primaryCol.label}
                  </p>
                )}
                <div className="mt-0.5 text-[15px] font-semibold text-ink">
                  {primaryCol.render(row, i)}
                </div>
              </div>

              {hiddenSecondary.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [key]: !isOpen }))}
                  aria-expanded={isOpen}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent-300 transition-colors hover:bg-panel-raised"
                >
                  {isOpen ? "Less" : "More"}
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                  />
                </button>
              )}
            </div>

            {/* Visible secondary fields */}
            {visibleSecondary.length > 0 && (
              <dl className="mt-3 space-y-2 border-t border-edge pt-3">
                {visibleSecondary.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 text-xs text-ink-faint">
                      {col.label ?? col.header}
                    </dt>
                    <dd className="min-w-0 text-right text-sm text-ink">
                      {col.render(row, i)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Collapsed secondary fields */}
            {isOpen && hiddenSecondary.length > 0 && (
              <dl className="mt-3 space-y-2 border-t border-edge pt-3">
                {hiddenSecondary.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 text-xs text-ink-faint">
                      {col.label ?? col.header}
                    </dt>
                    <dd className="min-w-0 text-right text-sm text-ink">
                      {col.render(row, i)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
}
