import type { FeedItemType } from "@/lib/types";

const ICONS: Record<FeedItemType, React.ReactNode> = {
  order: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8l1-4h14l1 4M4 8h16M4 8v11a1 1 0 001 1h14a1 1 0 001-1V8M9 12a3 3 0 006 0"
    />
  ),
  escrow: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
    />
  ),
  mm: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12l2.5 2.5L16 9m-9 3l-3.5 3.5a2 2 0 102.83 2.83L9.5 15M16 9l3.5-3.5a2 2 0 10-2.83-2.83L13 6"
    />
  ),
  slot: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5L6 9H3v6h3l5 4V5zM18 8a5 5 0 010 8"
    />
  ),
  exchange: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"
    />
  ),
};

const COLORS: Record<FeedItemType, string> = {
  order: "text-accent bg-accent/10 border-accent/30",
  escrow: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  mm: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  slot: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  exchange: "text-purple-400 bg-purple-500/10 border-purple-500/30",
};

export default function FeedIcon({ type }: { type: FeedItemType }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${COLORS[type]}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-4.5 w-4.5"
        aria-hidden
      >
        {ICONS[type]}
      </svg>
    </div>
  );
}
