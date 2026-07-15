export default function ScoreGauge({ score, max = 100, size = 64, strokeWidth = 6 }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct >= 70
      ? "var(--exa-positive)"
      : pct >= 40
        ? "var(--exa-warning)"
        : "var(--exa-negative)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="var(--exa-border)" strokeWidth={strokeWidth} fill="none"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.26} fontWeight="600" fill="var(--exa-text-primary)">
        {score}
      </text>
      <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.15} fill="var(--exa-text-muted)">
        /{max}
      </text>
    </svg>
  );
}
