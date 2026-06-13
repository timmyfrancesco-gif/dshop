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
  sparkle: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
      d="M12 2l1.8 4.6L18.4 8.4 13.8 10.2 12 14.8 10.2 10.2 5.6 8.4 10.2 6.6 12 2zM19 14l1 2.5L22.5 17.5 20 18.5 19 21 18 18.5 15.5 17.5 18 16.5 19 14zM5 13l0.9 2.3L8.2 16.2 5.9 17.1 5 19.4 4.1 17.1 1.8 16.2 4.1 15.3 5 13z"
    />
  ),
};

export default function ServiceIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      style={style}
      aria-hidden
    >
      {ICONS[name] ?? ICONS.shield}
    </svg>
  );
}
