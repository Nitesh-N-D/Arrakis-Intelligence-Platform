import Button from "./Button";

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  compact = false
}) {
  return (
    <div
      className={`rounded-card border border-border-subtle bg-white/4 text-center ${
        compact ? "px-4 py-5" : "px-6 py-8"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.32em] text-white/40">Arrakis</div>
      <h3 className="mt-3 font-display text-2xl text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/58">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button onClick={onAction} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
