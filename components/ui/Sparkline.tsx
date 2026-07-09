"use client";

/** Minimal SVG line chart for a short price history — no external chart lib needed. */
export default function Sparkline({
  values,
  width = 160,
  height = 40,
  positive = true,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}) {
  if (values.length < 2) {
    return (
      <div style={{ width, height }} className={`flex items-center justify-center text-[10px] text-muted ${className ?? ""}`}>
        —
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const color = positive ? "#34d399" : "#fb7185";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      <polygon points={fillPoints} fill={color} opacity={0.12} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
