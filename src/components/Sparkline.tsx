import { useMemo } from "react";

interface SparklineProps {
  /** Array of point values in chronological order */
  data: number[];
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Line color */
  color?: string;
  /** Fill color (gradient bottom) */
  fillColor?: string;
}

/**
 * SVG sparkline mini-chart.
 * Renders a smooth line with gradient fill showing point evolution.
 */
export function Sparkline({
  data,
  width = 120,
  height = 28,
  color = "#3FB950",
  fillColor = "rgba(63,185,80,0.15)",
}: SparklineProps) {
  const safeId = useMemo(() => color.replace("#", ""), [color]);

  const pathD = useMemo(() => {
    if (data.length < 2) return "";

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const padding = 2;
    const usableH = height - padding * 2;
    const usableW = width - padding * 2;
    const step = usableW / (data.length - 1);

    const points = data.map((v, i) => ({
      x: padding + i * step,
      y: padding + usableH - ((v - min) / range) * usableH,
    }));

    // Build smooth path using cardinal spline approximation
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    return d;
  }, [data, width, height]);

  const fillPathD = useMemo(() => {
    if (!pathD) return "";
    const padding = 2;
    const usableW = width - padding * 2;
    const step = usableW / (data.length - 1);
    const lastX = padding + (data.length - 1) * step;
    return `${pathD} L${lastX},${height} L${padding},${height} Z`;
  }, [pathD, data.length, width, height]);

  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="shrink-0">
        <line
          x1={2}
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="#484F58"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className="shrink-0" style={{ overflow: "visible" }}>
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`spark-fill-${safeId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={fillPathD} fill={`url(#spark-fill-${safeId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 &&
        (() => {
          const max = Math.max(...data, 1);
          const min = Math.min(...data, 0);
          const range = max - min || 1;
          const padding = 2;
          const usableH = height - padding * 2;
          const usableW = width - padding * 2;
          const step = usableW / (data.length - 1);
          const lastVal = data[data.length - 1];
          const x = padding + (data.length - 1) * step;
          const y = padding + usableH - ((lastVal - min) / range) * usableH;
          return <circle cx={x} cy={y} r={2.5} fill={color} />;
        })()}
    </svg>
  );
}
