import { useId } from "react";
import { cn } from "@/lib/utils";

interface GridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  squares?: Array<[x: number, y: number]>;
  strokeDasharray?: string;
  className?: string;
  startColor?: string;
  endColor?: string;
  [key: string]: unknown;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = "0",
  squares,
  className,
  startColor = "rgba(112, 60, 255, 0.18)", // Default start color
  endColor = "rgba(255, 0, 0, 0.3)", // Default end color
  ...props
}: GridPatternProps) {
  const id = useId();
  const gradientId = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: startColor }} />
          <stop offset="100%" style={{ stopColor: endColor }} />
        </linearGradient>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect 
        width="100%" 
        height="100%" 
        strokeWidth={0} 
        fill={`url(#${id})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width - 1}
              height={height - 1}
              x={x * width + 1}
              y={y * height + 1}
              fill={`url(#${gradientId})`}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
