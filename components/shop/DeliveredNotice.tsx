"use client";

import { useState } from "react";

interface DeliveredNoticeProps {
  message?: string;
  deliveredItem?: string | null;
}

export default function DeliveredNotice({ message, deliveredItem }: DeliveredNoticeProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!deliveredItem) return;
    try {
      await navigator.clipboard.writeText(deliveredItem);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h4 className="text-lg font-semibold text-foreground">Delivered!</h4>

      {deliveredItem ? (
        <div className="flex w-full flex-col gap-2">
          <div className="w-full break-all rounded-lg border border-border bg-background/60 px-3 py-2 text-left font-mono text-xs text-foreground">
            {deliveredItem}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="self-center rounded-full border border-accent/30 bg-accent-soft px-4 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {message ?? "Check your Discord DMs — the bot has automatically delivered your item."}
        </p>
      )}
    </div>
  );
}
