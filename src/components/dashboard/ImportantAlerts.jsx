const ALERT_LABELS = {
  volume: "VOL",
  score: "EXA",
  earnings: "ER",
  momentum: "MOM",
  price: "52W",
};

export default function ImportantAlerts({
  alerts = [],
  onAnalyze,
}) {
  function handleAnalyze(symbol) {
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

        <span className="exa-alert-count">
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="exa-alert-empty">
          No important alerts are available
          right now.
        </div>
      ) : (
        <div className="exa-alert-list">
          {alerts.map((alert, index) => (
            <button
              type="button"
              key={alert?.id || index}
              className={
                `exa-alert-item ` +
                `severity-${
                  alert?.severity || "info"
                }`
              }
              onClick={() =>
                handleAnalyze(
                  alert?.symbol,
                )
              }
            >
              <span className="exa-alert-icon">
                {ALERT_LABELS[
                  alert?.type
                ] || "!"}
              </span>

              <span className="exa-alert-content">
                <span className="exa-alert-title-row">
                  <strong>
                    {alert?.title ||
                      "Market Alert"}
                  </strong>

                  <time>
                    {alert?.time || ""}
                  </time>
                </span>

                <small>
                  {alert?.message ||
                    "Market activity detected."}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="exa-alert-note">
        Alerts highlight unusual market activity
        and do not represent buy or sell
        recommendations.
      </p>
    </article>
  );
}