import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Enhanced EmptyState component for dashboard sections.
 * Shows a helpful message when there's no data, with optional CTA.
 */
interface EmptyStateProps {
  icon?: ReactNode | string;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
  secondaryAction?: {
    label: string;
    link?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return <span className="text-5xl mb-5 opacity-60 block">{icon}</span>;
    }
    return <div className="mb-5 text-accent-300/60">{icon}</div>;
  };

  const renderAction = () => {
    if (!actionLabel) return null;

    const btnClass =
      "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all duration-300 hover:from-accent-500 hover:to-accent-400 hover:shadow-xl hover:shadow-accent-500/30 active:scale-[0.97]";

    if (actionLink) {
      return (
        <Link to={actionLink} className={btnClass}>
          {actionLabel}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      );
    }

    return (
      <button onClick={onAction} className={btnClass}>
        {actionLabel}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center py-20 text-center ${className}`}
      style={{
        animation: "fade-up 0.5s ease-out forwards",
      }}
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(51,143,255,0.08) 0%, rgba(99,102,241,0.05) 100%)",
          border: "1px solid rgba(51,143,255, 0.12)",
        }}
      >
        {renderIcon()}
      </div>

      <h3 className="text-xl font-semibold text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-muted max-w-md mb-8 leading-relaxed">{description}</p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {renderAction()}
        {secondaryAction && (
          secondaryAction.link ? (
            <Link
              to={secondaryAction.link}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-ink-muted transition-all duration-300 hover:text-ink hover:bg-panel-raised"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {secondaryAction.label}
            </Link>
          ) : (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-ink-muted transition-all duration-300 hover:text-ink hover:bg-panel-raised"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {secondaryAction.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}