import {
  BarChart3,
  Bell,
  CalendarClock,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

function getAlertVisual(alert) {
  const alertText = String(
    `${alert?.type || ""} ${alert?.category || ""} ${
      alert?.title || ""
    }`,
  )
    .trim()
    .toLowerCase();

  if (
    alertText.includes("volume")
  ) {
    return {
      Icon: BarChart3,
      iconClass: "volume",
      itemClass: "danger",
      label: "Volume alert",
    };
  }

  if (
    alertText.includes("exa") ||
    alertText.includes("score")
  ) {
    return {
      Icon: Sparkles,
      iconClass: "exa-score",
      itemClass: "warning",
      label: "EXA score alert",
    };
  }

  if (
    alertText.includes("earning") ||
    alertText.includes("result")
  ) {
    return {
      Icon: CalendarClock,
      iconClass: "earnings",
      itemClass: "warning",
      label: "Earnings alert",
    };
  }

  if (
    alertText.includes("momentum") ||
    alertText.includes("trend")
  ) {
    return {
      Icon: TrendingUp,
      iconClass: "momentum",
      itemClass: "information",
      label: "Momentum alert",
    };
  }

  if (
    alertText.includes("risk") ||
    alertText.includes("warning")
  ) {
    return {
      Icon: TriangleAlert,
      iconClass: "risk",
      itemClass: "danger",
      label: "Risk alert",
    };
  }

  return {
    Icon: Bell,
    iconClass: "default",
    itemClass: "information",
    label: "Market alert",
  };
}

export default function ImportantAlerts({
  alerts = [],
  onAnalyze,
}) {
  function handleAlertClick(alert) {
    const symbol =
      alert?.symbol ||
      alert?.ticker;

    if (
      onAnalyze &&
      symbol
    ) {
      onAnalyze(symbol);
    }
  }

  return (
    <article className="exa-dashboard-card exa-alerts-card">
      <div className="exa-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            RESEARCH NOTIFICATIONS
          </p>

          <h2>
            Important Alerts
          </h2>
        </div>

        <span className="exa-alert-count">
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="exa-alerts-empty">
          <Bell size={22} />

          <strong>
            No important alerts
          </strong>

          <p>
            New research notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="exa-alerts-list">
          {alerts.map(
            (alert, index) => {
              const {
                Icon,
                iconClass,
                itemClass,
                label,
              } = getAlertVisual(
                alert,
              );

              const symbol =
                alert?.symbol ||
                alert?.ticker;

              const canOpen =
                Boolean(
                  symbol &&
                    onAnalyze,
                );

              return (
                <div
                  key={
                    alert?.id ||
                    `${alert?.title}-${index}`
                  }
                  className={`exa-alert-item ${itemClass} ${
                    canOpen
                      ? "clickable"
                      : ""
                  }`}
                  role={
                    canOpen
                      ? "button"
                      : undefined
                  }
                  tabIndex={
                    canOpen
                      ? 0
                      : undefined
                  }
                  onClick={() =>
                    handleAlertClick(
                      alert,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      canOpen &&
                      (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      )
                    ) {
                      event.preventDefault();

                      handleAlertClick(
                        alert,
                      );
                    }
                  }}
                >
                  <span
                    className={`exa-alert-icon ${iconClass}`}
                    aria-label={label}
                  >
                    <Icon
                      size={22}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </span>

                  <div className="exa-alert-content">
                    <div className="exa-alert-title-row">
                      <strong>
                        {alert?.title ||
                          "Market Alert"}
                      </strong>

                      <time>
                        {alert?.time ||
                          ""}
                      </time>
                    </div>

                    <p>
                      {alert?.message ||
                        alert?.description ||
                        "New market activity has been detected."}
                    </p>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      <p className="exa-alerts-note">
        Alerts highlight unusual market activity and do not represent
        buy or sell recommendations.
      </p>
    </article>
  );
}