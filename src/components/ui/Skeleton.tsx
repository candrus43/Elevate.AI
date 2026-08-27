import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Convenience presets; pass `className` for exact dimensions instead. */
  variant?: "text" | "title" | "avatar" | "button" | "card";
  rounded?: "sm" | "md" | "full";
}

const variantClasses: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  text: "h-3 w-full",
  title: "h-5 w-1/2",
  avatar: "h-10 w-10",
  button: "h-10 w-24",
  card: "h-32 w-full",
};

const roundedClasses = { sm: "rounded", md: "rounded-lg", full: "rounded-full" } as const;

export function Skeleton({ variant = "text", rounded = "md", className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-panel-raised",
        variantClasses[variant],
        roundedClasses[rounded],
        className,
      )}
      {...rest}
    />
  );
}

/** A list of skeleton rows (used for loading tables / lists). */
export function SkeletonGroup({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}