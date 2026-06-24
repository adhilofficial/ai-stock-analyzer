function formatAnalysisDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(new Date(value));
  } catch {
    return String(value);
  }
}

function getSignalClass(signal) {
  const normalizedSignal =
    String(signal || "")
      .trim()
      .toUpperCase();

  if (
    normalizedSignal === "BUY" ||
    normalizedSignal === "POSITIVE"
  ) {
    return "positive";
  }

  if (
    normalizedSignal === "SELL" ||
    normalizedSignal === "NEGATIVE"
  ) {
    return "negative";
  }

  return "neutral";
}

export default function RecentAnalyses({
  analyses = [],
  onAnalyze,
  onClear,
}) {
  function handleOpen(symbol) {
    if (onAnalyze && symbol) {
      onAnalyze(symbol);
    }
  }

  function handleClear() {
    if (onClear) {
      onClear();
    }
  }

  return (
    <article className="exa-dashboard-card exa-recent-card">
      <div className="exa-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            SAVED RESEARCH
          </p>

          <h2>Recent Analyses</h2>
        </div>

        {analyses.length > 0 && (
          <button
            type="button"
            className="exa-recent-clear"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </div>

      {analyses.length === 0 ? (
        <div className="exa-recent-empty">
          <strong>
            No saved analyses yet
          </strong>

          <p>
            Successfully analyzed stocks
            will appear here.
          </p>
        </div>
      ) : (
        <div className="exa-recent-list">
          {analyses.map(
            (analysis, index) => (
              <button
                type="button"
                key={
                  `${analysis.symbol}-` +
                  `${analysis.analyzedAt || index}`
                }
                className="exa-recent-item"
                onClick={() =>
                  handleOpen(
                    analysis.symbol,
                  )
                }
              >
                <span className="exa-recent-company">
                  <strong>
                    {analysis.company ||
                      analysis.symbol}
                  </strong>

                  <small>
                    {analysis.symbol}
                  </small>

                  <time>
                    {formatAnalysisDate(
                      analysis.analyzedAt,
                    )}
                  </time>
                </span>

                <span className="exa-recent-result">
                  <span
                    className={
                      `exa-recent-signal ` +
                      getSignalClass(
                        analysis.signal,
                      )
                    }
                  >
                    {analysis.signal ||
                      "WATCH"}
                  </span>

                  <strong className="exa-recent-score">
                    {analysis.score ??
                      "—"}
                  </strong>
                </span>
              </button>
            ),
          )}
        </div>
      )}

      <p className="exa-recent-note">
        Stored locally on this device.
        Clearing browser data removes these
        saved records.
      </p>
    </article>
  );
}