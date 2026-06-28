import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Bell,
  CalendarClock,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ALERT_CENTER_STATE_KEY,
  ALERT_CENTER_UPDATED_EVENT,
  getActiveAlerts,
  isAlertRead,
  markAlertRead,
  mergeAlertCenterCache,
  readAlertCenterState,
} from "../../utils/alertStorage";

function getAlertVisual(alert) {
  const alertText = String(
    `${alert?.type || ""} ${alert?.category || ""} ${
      alert?.title || ""
    }`,
  )
    .trim()
    .toLowerCase();

  if (alertText.includes("volume")) {
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
    alertText.includes("warning") ||
    alertText.includes("vix")
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
  const navigate = useNavigate();
  const [alertState, setAlertState] = useState(
    readAlertCenterState,
  );

  useEffect(() => {
    mergeAlertCenterCache(alerts, {
      source: "Dashboard market alerts",
      fetchedAt: new Date().toISOString(),
    });
  }, [alerts]);

  useEffect(() => {
    function refreshState() {
      setAlertState(readAlertCenterState());
    }

    function handleStorage(event) {
      if (event.key === ALERT_CENTER_STATE_KEY) {
        refreshState();
      }
    }

    window.addEventListener(
      ALERT_CENTER_UPDATED_EVENT,
      refreshState,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        ALERT_CENTER_UPDATED_EVENT,
        refreshState,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const visibleAlerts = useMemo(
    () => getActiveAlerts(alerts, alertState),
    [alerts, alertState],
  );

  const unreadCount = useMemo(
    () =>
      visibleAlerts.filter(
        (alert) => !isAlertRead(alert?.id, alertState),
      ).length,
    [visibleAlerts, alertState],
  );

  function handleAlertClick(alert) {
    if (alert?.id) {
      markAlertRead(alert.id, true);
      setAlertState(readAlertCenterState());
    }

    const symbol = alert?.symbol || alert?.ticker;

    if (onAnalyze && symbol) {
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

          <h2>Important Alerts</h2>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="exa-alert-count">
            {unreadCount}
          </span>

          <button
            type="button"
            onClick={() => navigate("/alerts")}
            style={{
              minHeight: 30,
              padding: "5px 9px",
              border: "1px solid #29405f",
              borderRadius: 8,
              color: "#93c5fd",
              background: "#101e34",
              cursor: "pointer",
              fontSize: 8,
              fontWeight: 800,
            }}
          >
            View all
          </button>
        </div>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="exa-alerts-empty">
          <Bell size={22} />

          <strong>No important alerts</strong>

          <p>
            New research notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="exa-alerts-list">
          {visibleAlerts.map((alert, index) => {
            const {
              Icon,
              iconClass,
              itemClass,
              label,
            } = getAlertVisual(alert);

            const symbol = alert?.symbol || alert?.ticker;
            const canOpen = Boolean(symbol && onAnalyze);
            const read = isAlertRead(alert?.id, alertState);

            return (
              <div
                key={
                  alert?.id ||
                  `${alert?.title}-${index}`
                }
                className={`exa-alert-item ${itemClass} ${
                  canOpen ? "clickable" : ""
                } ${read ? "read" : "unread"}`}
                role={canOpen ? "button" : undefined}
                tabIndex={canOpen ? 0 : undefined}
                onClick={() => handleAlertClick(alert)}
                onKeyDown={(event) => {
                  if (
                    canOpen &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    handleAlertClick(alert);
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
                      {alert?.title || "Market Alert"}
                      {!read ? " · New" : ""}
                    </strong>

                    <time>{alert?.time || ""}</time>
                  </div>

                  <p>
                    {alert?.message ||
                      alert?.description ||
                      "New market activity has been detected."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="exa-alerts-note">
        Alerts highlight unusual market activity and do not represent
        buy or sell recommendations.
      </p>
    </article>
  );
}