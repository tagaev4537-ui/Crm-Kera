export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-8 py-6">
      <div>
        <h1 className="font-display text-xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
