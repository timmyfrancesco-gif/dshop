export default function DeliveredNotice({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h4 className="text-lg font-semibold text-foreground">Delivered!</h4>
      <p className="text-sm text-muted">
        {message ?? "Check your Discord DMs — the bot has automatically delivered your item."}
      </p>
    </div>
  );
}
