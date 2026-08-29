import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { X } from "./icons";

/* ─────────────────────────────────────────────────────────────────
 * BottomSheet — slide-up panel anchored to the bottom edge.
 *
 * On mobile it spans full width with rounded top corners (native
 * sheet feel). On ≥768px it becomes a floating card anchored to the
 * bottom-right with a max width, so it never reads as a full-screen
 * takeover on desktop.
 *
 * Includes: Escape-to-close, backdrop click-to-close, body scroll
 * lock, focus management, and an aria-labelled dialog role.
 * ───────────────────────────────────────────────────────────────── */

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Max content height; the body scrolls internally. */
  maxHeight?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  maxHeight = "min(78vh, 44rem)",
}: BottomSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col border-t border-edge bg-panel shadow-2xl shadow-black/60 outline-none",
          "sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[24rem] sm:rounded-2xl sm:border",
          "animate-slide-up",
          className,
        )}
        style={{ maxHeight }}
      >
        {/* Grab handle (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-edge-strong" aria-hidden />
        </div>

        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-panel-raised hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer && (
          <div className="border-t border-edge px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
