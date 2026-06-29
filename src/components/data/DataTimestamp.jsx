import { Clock3 } from "lucide-react";

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function DataTimestamp({
  value,
  source,
  fallbackText = "Update time unavailable",
  compact = false,
  className = "",
}) {
  const formattedTimestamp = formatTimestamp(value);

  const parts = [
    source,
    formattedTimestamp
      ? `Updated ${formattedTimestamp}`
      : fallbackText,
  ].filter(Boolean);

  return (
    <span
      className={`exa-data-timestamp ${
        compact ? "exa-data-timestamp--compact" : ""
      } ${className}`}
    >
      <Clock3
        size={compact ? 12 : 14}
        aria-hidden="true"
      />

      <span>{parts.join(" · ")}</span>
    </span>
  );
}