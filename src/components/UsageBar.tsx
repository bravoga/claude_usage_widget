import { useCountdown, formatCountdown } from "../hooks/useCountdown";

interface UsageBarProps {
  percent: number;
  label: "Current" | "Weekly";
  resetInSecs: number | null;
}

function barColor(pct: number): string {
  if (pct >= 85) return "#ef4444";
  if (pct >= 60) return "#f97316";
  return "#22c55e";
}

export function UsageBar({ percent, label, resetInSecs }: UsageBarProps) {
  const countdown = useCountdown(resetInSecs);
  const pct = Math.min(Math.round(percent), 100);
  const color = barColor(pct);

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-white font-bold text-2xl leading-none">{pct}%</span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{ backgroundColor: "#222", color: "#9ca3af" }}
        >
          {label}
        </span>
      </div>

      <div className="w-full h-2.5 rounded overflow-hidden" style={{ backgroundColor: "#2a2a2a" }}>
        <div
          className="h-full rounded transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      <div className="mt-1">
        <span className="text-xs" style={{ color: "#4b5563" }}>
          Resets in {formatCountdown(countdown)}
        </span>
      </div>
    </div>
  );
}
