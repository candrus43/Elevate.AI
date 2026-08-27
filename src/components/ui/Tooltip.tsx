import { useId } from "react";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * CSS-only tooltip — appears on hover AND focus (keyboard accessible).
 * Screen readers read the content via `role="tooltip"` + `aria-describedby`.
 */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const id = useId();

  const sideClasses: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
  };

  return (
    <span className="group relative inline-flex">
      <span aria-describedby={id}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-xs rounded-md border border-edge-strong bg-panel-raised px-2.5 py-1.5 text-xs font-medium text-ink shadow-lg shadow-black/30",
          "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          sideClasses[side],
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}