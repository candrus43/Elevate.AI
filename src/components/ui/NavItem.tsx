import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { cn } from "./cn";

export interface NavItemProps {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  active?: boolean;
  /** Numeric or badge content (e.g. unread count, risk count). */
  badge?: ReactNode;
  disabled?: boolean;
  /** Collapsed mode: icon-only, label kept in the accessibility tree. */
  collapsed?: boolean;
  className?: string;
}

export function NavItem({
  label,
  icon,
  href,
  onClick,
  active = false,
  badge,
  disabled = false,
  collapsed = false,
  className,
}: NavItemProps) {
  const classes = cn(
    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
    "focus-visible:outline-none disabled:opacity-50",
    collapsed && "justify-center px-2",
    active
      ? "bg-accent-500/10 text-accent-fg"
      : "text-ink-muted hover:bg-panel-raised hover:text-ink",
    className,
  );

  const inner = (
    <>
      {icon && <span className="shrink-0 text-base leading-none [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
      {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      {!collapsed && badge && <span className="shrink-0">{badge}</span>}
      {collapsed && <span className="sr-only">{label}</span>}
    </>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {inner}
    </button>
  );
}