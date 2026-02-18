"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 60, height = 20 }: SparklineProps) {
  if (data.length < 2) {
    return <div className="h-5 w-15 rounded bg-muted/30" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  });

  const trending = data[data.length - 1] >= data[0];
  const color = trending ? "#4ade80" : "#f87171";

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
