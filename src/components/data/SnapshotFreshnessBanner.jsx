import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
} from "lucide-react";

const HOUR_MS = 60 * 60 * 1000;

const SNAPSHOT_FRESHNESS_STYLES = `
  .exa-snapshot-freshness {
    margin: 0 0 16px;
    padding: 12px 14px;
    border: 1px solid #1e3350;
    border-radius: 13px;
    background: #0a1628;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .exa-snapshot-freshness-main {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .exa-snapshot-freshness-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .exa-snapshot-freshness-copy {
    min-width: 0;
  }

  .exa-snapshot-freshness-title {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  .exa-snapshot-freshness-title strong {
    color: #f8fafc;
    font-size: 11px;
  }

  .exa-snapshot-freshness-badge {
    padding: 3px 7px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 850;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .exa-snapshot-freshness-copy p {
    margin: 5px 0 0;
    color: #94a3b8;
    font-size: 9px;
    line-height: 1.55;
  }

  .exa-snapshot-freshness-meta {
    flex-shrink: 0;
    color: #64748b;
    font-size: 9px;
    line-height: 1.55;
    text-align: right;
  }

  .exa-snapshot-freshness.fresh {
    border-color: rgba(34, 197, 94, 0.24);
    background: rgba(20, 83, 45, 0.08);
  }

  .exa-snapshot-freshness.fresh .exa-snapshot-freshness-icon {
    color: #4ade80;
    background: rgba(34, 197, 94, 0.1);
  }

  .exa-snapshot-freshness.fresh .exa-snapshot-freshness-badge {
    color: #86efac;
    background: rgba(34, 197, 94, 0.12);
  }

  .exa-snapshot-freshness.aging {
    border-color: rgba(234, 179, 8, 0.25);
    background: rgba(113, 63, 18, 0.08);
  }

  .exa-snapshot-freshness.aging .exa-snapshot-freshness-icon {
    color: #facc15;
    background: rgba(234, 179, 8, 0.1);
  }

  .exa-snapshot-freshness.aging .exa-snapshot-freshness-badge {
    color: #fde047;
    background: rgba(234, 179, 8, 0.12);
  }

  .exa-snapshot-freshness.stale {
    border-color: rgba(244, 63, 94, 0.27);
    background: rgba(127, 29, 29, 0.08);
  }

  .exa-snapshot-freshness.stale .exa-snapshot-freshness-icon {
    color: #fb7185;
    background: rgba(244, 63, 94, 0.1);
  }

  .exa-snapshot-freshness.stale .exa-snapshot-freshness-badge {
    color: #fda4af;
    background: rgba(244, 63, 94, 0.12);
  }

  .exa-snapshot-freshness.unknown .exa-snapshot-freshness-icon {
    color: #94a3b8;
    background: rgba(100, 116, 139, 0.1);
  }

  .exa-snapshot-freshness.unknown .exa-snapshot-freshness-badge {
    color: #cbd5e1;
    background: rgba(100, 116, 139, 0.12);
  }

  @media (max-width: 720px) {
    .exa-snapshot-freshness {
      align-items: flex-start;
      flex-direction: column;
    }

    .exa-snapshot-freshness-meta {
      padding-left: 44px;
      text-align: left;
    }
  }
`;

function getFreshnessState(
  generatedAt,
  freshHours,
  staleHours,
) {
  const timestamp = new Date(
    generatedAt,
  ).getTime();

  if (!Number.isFinite(timestamp)) {
    return {
      status: "unknown",
      label: "Timestamp unavailable",
      ageHours: null,
    };
  }

  const ageHours = Math.max(
    0,
    (Date.now() - timestamp) /
      HOUR_MS,
  );

  if (ageHours <= freshHours) {
    return {
      status: "fresh",
      label: "Current",
      ageHours,
    };
  }

  if (ageHours <= staleHours) {
    return {
      status: "aging",
      label: "Aging",
      ageHours,
    };
  }

  return {
    status: "stale",
    label: "Stale",
    ageHours,
  };
}

function formatAge(ageHours) {
  if (ageHours === null) {
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

function formatGeneratedAt(value) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Generated time unavailable";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function getStatusContent(status) {
  switch (status) {
    case "fresh":
      return {
        icon: CheckCircle2,
        title: "Market snapshot is current",
        message:
          "The screener is using a recently generated market snapshot.",
      };

    case "aging":
      return {
        icon: Clock3,
        title: "Market snapshot is getting old",
        message:
          "Prices and indicators may not reflect the latest market session. A new snapshot should be generated soon.",
      };

    case "stale":
      return {
        icon: AlertTriangle,
        title: "Market snapshot is stale",
        message:
          "Treat displayed prices, fundamentals and technical indicators as outdated until the snapshot is rebuilt.",
      };

    default:
      return {
        icon: Database,
        title: "Snapshot freshness is unavailable",
        message:
          "The API did not provide a valid snapshot generation time.",
      };
  }
}

export default function SnapshotFreshnessBanner({
  generatedAt,
  source = "Yahoo Finance",
  freshHours = 24,
  staleHours = 48,
}) {
  const freshness =
    getFreshnessState(
      generatedAt,
      freshHours,
      staleHours,
    );

  const content =
    getStatusContent(
      freshness.status,
    );

  const StatusIcon = content.icon;

  return (
    <>
      <style>
        {SNAPSHOT_FRESHNESS_STYLES}
      </style>

      <section
        className={`exa-snapshot-freshness ${freshness.status}`}
        aria-live="polite"
      >
        <div className="exa-snapshot-freshness-main">
          <span className="exa-snapshot-freshness-icon">
            <StatusIcon size={17} />
          </span>

          <div className="exa-snapshot-freshness-copy">
            <div className="exa-snapshot-freshness-title">
              <strong>
                {content.title}
              </strong>

              <span className="exa-snapshot-freshness-badge">
                {freshness.label}
              </span>
            </div>

            <p>{content.message}</p>
          </div>
        </div>

        <div className="exa-snapshot-freshness-meta">
          <div>
            {formatAge(
              freshness.ageHours,
            )}
          </div>

          <div>
            {formatGeneratedAt(
              generatedAt,
            )}
          </div>

          <div>Source: {source}</div>
        </div>
      </section>
    </>
  );
}