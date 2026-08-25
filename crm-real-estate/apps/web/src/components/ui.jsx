export function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-ink text-white hover:bg-ink/90",
    accent: "bg-accent text-white hover:bg-accent-dark",
    ghost: "bg-transparent text-ink hover:bg-ink/5",
    danger: "bg-danger text-white hover:bg-danger/90",
    outline: "border border-line bg-surface text-ink hover:bg-bg",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>}
      <input
        className={`w-full rounded-lg border ${
          error ? "border-danger" : "border-line"
        } bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-ring ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>}
      <select
        className={`w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-ring ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>}
      <textarea
        className={`w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-ring ${className}`}
        {...props}
      />
    </label>
  );
}

export function Card({ className = "", children }) {
  return <div className={`rounded-xl border border-line bg-surface shadow-card ${className}`}>{children}</div>;
}

export function Badge({ tone = "default", children }) {
  const tones = {
    default: "bg-ink/5 text-ink-soft",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent-dark",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={`animate-spin text-accent ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className={`max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-md"} overflow-y-auto rounded-xl bg-surface p-6 shadow-card`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-faint hover:bg-bg hover:text-ink focus-ring">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
