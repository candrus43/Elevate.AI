import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "./cn";

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...rest} />
    </div>
  );
}

export function TableHead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-edge text-xs uppercase tracking-wider text-ink-faint", className)}
      {...rest}
    />
  );
}

export function TableBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-edge", className)} {...rest} />;
}

export function TableRow({ className, hover = true, ...rest }: HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }) {
  return (
    <tr className={cn(hover && "transition-colors hover:bg-panel-raised/60", className)} {...rest} />
  );
}

export function TableHeaderCell({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-4 py-3 text-left font-semibold first:pl-5 last:pr-5", className)}
      {...rest}
    />
  );
}

export function TableCell({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 align-middle text-ink first:pl-5 last:pr-5", className)} {...rest} />
  );
}

/** Sticky-empty state row for tables. */
export function TableEmpty({ colSpan = 1, children = "No data yet" }: { colSpan?: number; children?: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-ink-faint">
        {children}
      </td>
    </tr>
  );
}