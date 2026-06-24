function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function getViewClass(view) {
  const normalizedView = String(view || "")
    .trim()
    .toLowerCase();

  if (normalizedView === "positive") {
    return "positive";
  }

  if (normalizedView === "negative") {
    return "negative";
  }

  if (normalizedView === "watch") {
    return "watch";
  }

  return "neutral";
}

export default function WatchlistCard({
  stocks = [],
  onAnalyze,
  onRemove,
}) {
  return (
    <article className="exa-dashboard-card exa-watchlist-card">
      <div className="exa-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            SAVED STOCKS
          </p>

          <h2>My Watchlist</h2>
        </div>

        <span className="exa-watchlist-count">
          {stocks.length} stocks
        </span>
      </div>

      {stocks.length === 0 ? (
        <div className="exa-watchlist-empty">
          <strong>
            Your watchlist is empty
          </strong>

          <p>
            Add stocks from the Analyze page to
            monitor them here.
          </p>
        </div>
      ) : (
        <div className="exa-watchlist-table">
          <div className="exa-watchlist-header">
            <span>Company</span>
            <span>Price</span>
            <span>1D</span>
            <span>EXA Score</span>
            <span>AI View</span>
            <span>Actions</span>
          </div>

          {stocks.map((stock, index) => {
            const positive =
              Number(stock?.changePercent) >= 0;

            return (
              <div
                key={stock?.symbol || index}
                className="exa-watchlist-row"
              >
                <button
                  type="button"
                  className="exa-watchlist-company"
                  onClick={() => {
                    if (
                      onAnalyze &&
                      stock?.symbol
                    ) {
                      onAnalyze(stock.symbol);
                    }
                  }}
                >
                  <span className="exa-stock-avatar">
                    {stock?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "S"}
                  </span>

                  <span>
                    <strong>
                      {stock?.name || "Unknown"}
                    </strong>

                    <small>
                      {stock?.symbol || "-"}
                    </small>
                  </span>
                </button>

                <span className="exa-watchlist-price">
                  {formatPrice(stock?.price)}
                </span>

                <span
                  className={
                    positive
                      ? "exa-watchlist-change positive"
                      : "exa-watchlist-change negative"
                  }
                >
                  {formatPercent(
                    stock?.changePercent,
                  )}
                </span>

                <span className="exa-score-badge">
                  {stock?.exaScore ?? "—"}
                </span>

                <span
                  className={
                    "exa-ai-view " +
                    getViewClass(stock?.aiView)
                  }
                >
                  {stock?.aiView ||
                    "Not analyzed"}
                </span>

                <div className="exa-watchlist-actions">
                  <button
                    type="button"
                    className="analyze"
                    onClick={() => {
                      if (
                        onAnalyze &&
                        stock?.symbol
                      ) {
                        onAnalyze(
                          stock.symbol,
                        );
                      }
                    }}
                  >
                    Analyze
                  </button>

                  <button
                    type="button"
                    className="remove"
                    aria-label={`Remove ${
                      stock?.name || "stock"
                    }`}
                    onClick={() => {
                      if (
                        onRemove &&
                        stock?.symbol
                      ) {
                        onRemove(
                          stock.symbol,
                        );
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="exa-watchlist-note">
        EXA scores and AI views are educational
        research indicators, not investment
        recommendations.
      </p>
    </article>
  );
}