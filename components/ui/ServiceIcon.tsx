const ICONS: Record<string, React.ReactNode> = {
  shield: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
    />
  ),
  handshake: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12l2.5 2.5L16 9m-9 3l-3.5 3.5a2 2 0 102.83 2.83L9.5 15M16 9l3.5-3.5a2 2 0 10-2.83-2.83L13 6"
    />
  ),
  exchange: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"
    />
  ),
  casino: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  megaphone: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5L6 9H3v6h3l5 4V5zM18 8a5 5 0 010 8"
    />
  ),
  shop: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8l1-4h14l1 4M4 8h16M4 8v11a1 1 0 001 1h14a1 1 0 001-1V8M9 12a3 3 0 006 0"
    />
  ),
  wallet: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 3h18M15 13h2"
    />
  ),
  nitro: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2l3 5h5l-3.5 4 1.5 6-6-3.5L6 17l1.5-6L4 7h5l3-5z"
    />
  ),
  vps: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4h16v6H4V4zm0 10h16v6H4v-6zM7 7h.01M7 17h.01"
    />
  ),
};

export default function ServiceIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden
    >
      {ICONS[name] ?? ICONS.shield}
    </svg>
  );
}
