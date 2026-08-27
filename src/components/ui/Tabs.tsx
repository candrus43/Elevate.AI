import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "./cn";

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  /** Renders the active panel contents inline (managed). */
  children?: (active: string) => ReactNode;
}

/**
 * WAI-ARIA tabs pattern with roving tabindex + arrow-key navigation.
 */
export function Tabs({ items, value, defaultValue, onChange, className, children }: TabsProps) {
  const autoId = useId();
  const [internal, setInternal] = useState<string>(defaultValue ?? items[0]?.value ?? "");
  const active = value ?? internal;

  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    const enabled = items.map((i) => !i.disabled);
    const current = items[index];
    if (!current) return;

    let next: number | undefined;
    if (e.key === "ArrowRight") {
      next = nextEnabled(enabled, index, 1);
    } else if (e.key === "ArrowLeft") {
      next = nextEnabled(enabled, index, -1);
    } else if (e.key === "Home") {
      next = enabled.findIndex(Boolean);
    } else if (e.key === "End") {
      next = enabled.lastIndexOf(true);
    }

    if (next !== undefined && next !== index && items[next]) {
      e.preventDefault();
      select(items[next].value);
      document.getElementById(`${autoId}-tab-${next}`)?.focus();
    }
  };

  return (
    <div className={className}>
      <div role="tablist" className="flex items-center gap-1 overflow-x-auto border-b border-edge">
        {items.map((item, i) => {
          const selected = item.value === active;
          return (
            <button
              key={item.value}
              id={`${autoId}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${autoId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none disabled:opacity-40",
                selected ? "text-ink" : "text-ink-faint hover:text-ink-muted",
              )}
            >
              {item.icon}
              {item.label}
              {item.badge}
              {selected && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-500" />
              )}
            </button>
          );
        })}
      </div>
      {children ? (
        <div
          role="tabpanel"
          id={`${autoId}-panel-${items.findIndex((i) => i.value === active)}`}
          aria-labelledby={`${autoId}-tab-${items.findIndex((i) => i.value === active)}`}
          className="pt-4"
        >
          {children(active)}
        </div>
      ) : null}
    </div>
  );
}

function nextEnabled(enabled: boolean[], from: number, step: 1 | -1): number | undefined {
  let i = from + step;
  while (i >= 0 && i < enabled.length) {
    if (enabled[i]) return i;
    i += step;
  }
  return undefined;
}