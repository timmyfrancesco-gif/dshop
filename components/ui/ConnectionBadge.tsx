export default function ConnectionBadge({ isLive, isConfigured }: { isLive: boolean; isConfigured: boolean }) {
  if (!isConfigured) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated/60 px-3 py-1 text-xs font-semibold text-muted">
        <span className="h-2 w-2 rounded-full bg-muted" />
        Not configured
      </span>
    );
  }

  if (isLive) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        Live
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated/60 px-3 py-1 text-xs font-semibold text-muted">
      <span className="h-2 w-2 rounded-full bg-muted" />
      Offline
    </span>
  );
}
