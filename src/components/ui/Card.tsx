import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Padding = "none" | "sm" | "md" | "lg";

const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  hover?: boolean;
  bordered?: boolean;
}

export function Card({
  padding = "md",
  hover = false,
  bordered = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-panel",
        bordered && "border border-edge",
        paddingClasses[padding],
        hover && "transition-all duration-200 hover:border-accent-500/40 hover:shadow-glow",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-edge px-5 py-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-ink", className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-0.5 text-sm text-ink-faint", className)} {...rest}>
      {children}
    </p>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between gap-4 border-t border-edge px-5 py-4", className)}
      {...rest}
    >
      {children}
    </div>
  );
}