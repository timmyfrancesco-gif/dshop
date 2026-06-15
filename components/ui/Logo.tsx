export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="heaven-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        fill="url(#heaven-logo-gradient)"
        d="M30 8 H45 V44 H55 V8 H70 V70 L50 92 L30 70 Z"
      />
      <path
        fill="#07050d"
        opacity="0.18"
        d="M30 8 C46 24, 54 40, 70 8 V70 L50 92 L30 70 Z"
      />
    </svg>
  );
}
