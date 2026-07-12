import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  glow?: boolean;
}

export function GlassCard({ children, className = "", hover = true, padding = "md", glow = false }: GlassCardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${
        hover ? "hover:border-purple-500/20 hover:translate-y-[-1px]" : ""
      } ${glow ? "shadow-lg shadow-purple-500/5" : ""} ${paddingClasses[padding]} ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 ${className}`}
      style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
    >
      {children}
    </div>
  );
}

export function GlassCardBody({ children, className = "", divide = false }: { children: ReactNode; className?: string; divide?: boolean }) {
  return (
    <div className={`${divide ? "divide-y divide-white/5" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function GlassCardRow({ children, className = "", hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 transition-colors ${
        hover ? "hover:bg-white/[0.02]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function GlassStatCard({
  label,
  value,
  change,
  color = "from-purple-500 to-indigo-600",
  icon,
}: {
  label: string;
  value: string;
  change?: string;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <GlassCard padding="md" hover={false}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <p className={`bg-gradient-to-r ${color} bg-clip-text text-2xl sm:text-3xl font-bold text-transparent`}>
        {value}
      </p>
      {change && (
        <p className="text-xs text-green-400 mt-0.5 font-medium">{change}</p>
      )}
    </GlassCard>
  );
}

export function GlassBadge({
  children,
  color = "default",
}: {
  children: ReactNode;
  color?: "default" | "purple" | "green" | "amber" | "red" | "blue";
}) {
  const colorClasses = {
    default: "text-gray-300 bg-white/5",
    purple: "text-purple-300 bg-purple-500/10",
    green: "text-green-300 bg-green-500/10",
    amber: "text-amber-300 bg-amber-500/10",
    red: "text-red-300 bg-red-500/10",
    blue: "text-blue-300 bg-blue-500/10",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

export function GlassButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  href,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 active:scale-[0.97]";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:from-purple-500 hover:to-indigo-500",
    secondary: "text-gray-300 hover:text-white",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return <a href={href} className={classes}>{children}</a>;
  }

  return <button onClick={onClick} className={classes}>{children}</button>;
}

export function GlassInput({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    />
  );
}

export function GlassSelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className="rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {children}
    </select>
  );
}

export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        background: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <span className="text-4xl mb-4 opacity-50">{icon}</span>}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">⚠️</span>
      <h3 className="text-lg font-semibold text-white mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <GlassButton onClick={onRetry} variant="primary">
          Try again
        </GlassButton>
      )}
    </div>
  );
}