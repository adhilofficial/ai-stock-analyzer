import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  LoaderCircle,
  WifiOff,
} from "lucide-react";

const STATUS_CONFIG = Object.freeze({
  live: {
    label: "Live",
    icon: CheckCircle2,
  },

  cached: {
    label: "Cached",
    icon: Database,
  },

  delayed: {
    label: "Delayed",
    icon: Clock3,
  },

  fallback: {
    label: "Fallback",
    icon: AlertTriangle,
  },

  unavailable: {
    label: "Unavailable",
    icon: WifiOff,
  },

  loading: {
    label: "Loading",
    icon: LoaderCircle,
  },
});

export default function DataStatusBadge({
  status = "unavailable",
  label,
  compact = false,
  className = "",
}) {
  const normalizedStatus = STATUS_CONFIG[status]
    ? status
    : "unavailable";

  const config = STATUS_CONFIG[normalizedStatus];
  const Icon = config.icon;

  return (
    <span
      className={`exa-data-status-badge exa-data-status-badge--${normalizedStatus} ${
        compact ? "exa-data-status-badge--compact" : ""
      } ${className}`}
      aria-label={`Data status: ${label || config.label}`}
    >
      <Icon
        size={compact ? 12 : 14}
        strokeWidth={2}
        aria-hidden="true"
        className={
          normalizedStatus === "loading"
            ? "exa-data-status-badge__spinner"
            : ""
        }
      />

      <span>{label || config.label}</span>
    </span>
  );
}