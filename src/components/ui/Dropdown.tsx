import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "./cn";
import { ChevronDown, Check } from "./icons";

/* ─────────────────────────────────────────────────────────────────
 * Select — accessible native <select> with label / hint.
 * ───────────────────────────────────────────────────────────────── */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  children: ReactNode;
}

export function Select({
  label,
  hint,
  error,
  className,
  containerClassName,
  id,
  children,
  ...props
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-edge bg-panel pl-3 pr-9 text-sm text-ink",
            "transition-colors focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-focus/40",
            error && "border-red-500/60",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Dropdown — controlled listbox menu (button trigger + options).
 * ───────────────────────────────────────────────────────────────── */

export interface DropdownOption {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  trigger?: ReactNode;
  triggerLabel?: string;
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  trigger,
  triggerLabel,
  className,
  menuClassName,
  align = "left",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (v: string) => {
    onChange?.(v);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-edge bg-panel px-3 text-sm text-ink",
          "transition-colors hover:border-edge-strong focus:outline-none focus:ring-2 focus:ring-focus/40",
        )}
      >
        {trigger ?? <span className="truncate text-left">{selected ? selected.label : placeholder}</span>}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={buttonId}
          className={cn(
            "absolute z-50 mt-1.5 max-h-72 w-full min-w-[10rem] overflow-auto rounded-lg border border-edge bg-panel-raised p-1 shadow-xl shadow-black/40",
            align === "right" && "right-0",
            menuClassName,
          )}
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={o.disabled}
                  onClick={() => select(o.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    "hover:bg-panel disabled:opacity-40",
                    isSelected ? "text-ink" : "text-ink-muted",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {o.icon}
                    {o.label}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-accent-fg" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}