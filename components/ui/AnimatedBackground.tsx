export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%)",
        }}
      />
      <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[120px] animate-glow-pulse" />
      <div
        className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-casino-from/20 blur-[140px] animate-glow-pulse"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-casino-to/15 blur-[120px] animate-glow-pulse"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 220px rgba(0,0,0,0.85)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
