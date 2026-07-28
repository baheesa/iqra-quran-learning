type Props = {
  percent: number;
  label: string;
  sub: string;
  tone?: "primary" | "accent" | "warning";
  size?: "sm" | "md";
};

export function JourneyDonut({
  percent,
  label,
  sub,
  tone = "primary",
  size = "md",
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const dim = size === "sm" ? 72 : 96;
  const r = size === "sm" ? 26 : 36;
  const strokeW = size === "sm" ? 6 : 8;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const stroke =
    tone === "accent"
      ? "var(--accent)"
      : tone === "warning"
        ? "var(--warning)"
        : "var(--primary)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg
          viewBox={`0 0 ${dim} ${dim}`}
          className="h-full w-full -rotate-90"
          aria-hidden
        >
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeW}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={
              size === "sm"
                ? "text-primary text-sm font-medium"
                : "text-primary text-lg font-medium"
            }
          >
            {pct}%
          </span>
        </div>
      </div>
      <p className="text-foreground text-center text-xs font-medium sm:text-sm">
        {label}
      </p>
      <p className="text-muted max-w-[8.5rem] text-center text-[11px] leading-snug sm:text-xs">
        {sub}
      </p>
    </div>
  );
}
