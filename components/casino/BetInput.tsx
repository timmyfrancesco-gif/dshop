"use client";

export default function BetInput({
  bet,
  setBet,
  disabled,
}: {
  bet: string;
  setBet: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Bet amount</span>
      </div>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60">
        <span className="flex items-center pl-4 text-accent">€</span>
        <input
          type="number"
          step="0.10"
          min="0.10"
          value={bet}
          disabled={disabled}
          onChange={(e) => setBet(e.target.value)}
          className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none disabled:opacity-60"
        />
        <button type="button" disabled={disabled} onClick={() => setBet((parseFloat(bet) / 2 || 0).toFixed(2))} className="border-l border-border px-4 text-sm font-semibold text-muted hover:text-foreground">½</button>
        <button type="button" disabled={disabled} onClick={() => setBet((parseFloat(bet) * 2 || 0).toFixed(2))} className="border-l border-border px-4 text-sm font-semibold text-muted hover:text-foreground">2x</button>
      </div>
    </div>
  );
}
