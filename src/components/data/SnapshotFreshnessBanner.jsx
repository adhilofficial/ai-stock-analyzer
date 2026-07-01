import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  LoaderCircle,
} from "lucide-react";

const HOUR_MS = 60 * 60 * 1000;

function formatAge(ageHours) {
  if (!Number.isFinite(ageHours)) {
    return "Age unavailable";
  }

  if (ageHours < 1) {
    const minutes = Math.max(
      1,
      Math.round(ageHours * 60),
    );

    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } old`;
  }

  if (ageHours < 48) {
    const hours = Math.round(ageHours);

    return `${hours} hour${
      hours === 1 ? "" : "s"
    } old`;
  }

  const days = Math.round(
    ageHours / 24,
  );

  return `${days} day${
    days === 1 ? "" : "s"
  } old`;
}

function getSnapshotPresentation({
  generatedAt,
  freshHours,
  staleHours,
  loading,
  error,
}) {
  if (loading && !generatedAt) {
    return {
      status: "loading",
      label: "Loading snapshot",
      detail: "Preparing screener data",
      icon: LoaderCircle,
    };
  }

  const timestamp =
    new Date(generatedAt).getTime();

  if (!Number.isFinite(timestamp)) {
    return {
      status: error
        ? "unavailable"
        : "unknown",

      label: error
        ? "Snapshot unavailable"
        : "Snapshot time unavailable",

      detail: error
        ? "Unable to refresh screener data"
        : "Generation time was not provided",

      icon: error
        ? AlertTriangle
        : Database,
    };
  }

  const ageHours = Math.max(
    0,
    (Date.now() - timestamp) /
      HOUR_MS,
  );

  if (error) {
    return {
      status: "previous",
      label: "Previous snapshot",
      detail: `${formatAge(
        ageHours,
      )} · latest refresh failed`,
      icon: AlertTriangle,
    };
  }

  if (ageHours <= freshHours) {
    return {
      status: "current",
      label: "Current snapshot",
      detail: formatAge(ageHours),
      icon: CheckCircle2,
    };
  }

  if (ageHours <= staleHours) {
    return {
      status: "previous",
      label: "Previous snapshot",
      detail: formatAge(ageHours),
      icon: Clock3,
    };
  }

  return {
    status: "stale",
    label: "Stale snapshot",
    detail: formatAge(ageHours),
    icon: AlertTriangle,
  };
}

export default function SnapshotFreshnessBanner({
  generatedAt,
  freshHours = 24,
  staleHours = 72,
  loading = false,
  error = "",
  className = "",
}) {
  const presentation =
    getSnapshotPresentation({
      generatedAt,
      freshHours,
      staleHours,
      loading,
      error,
    });

  const StatusIcon =
    presentation.icon;

  return (
    <div
      className={`exa-snapshot-status exa-snapshot-status--${presentation.status} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="exa-snapshot-status__information">
        <span
          className="exa-snapshot-status__dot"
          aria-hidden="true"
        />

        <div className="exa-snapshot-status__copy">
          <strong>
            {presentation.label}
          </strong>

          <span>
            {presentation.detail}
          </span>
        </div>

        <StatusIcon
          size={14}
          aria-hidden="true"
          className={
            presentation.status ===
            "loading"
              ? "exa-snapshot-status__spinner"
              : "exa-snapshot-status__icon"
          }
        />
      </div>
    </div>
  );
}