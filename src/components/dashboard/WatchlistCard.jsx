import {
  RefreshCw,
  X,
} from "lucide-react";

import CompanyLogo from "../common/CompanyLogo";
import DataStatusBadge from "../data/DataStatusBadge";
import DataTimestamp from "../data/DataTimestamp";

function formatPrice(value, currency = "INR") {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return number.toFixed(2);
  }
}

function formatPercent(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

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

function getQuoteLabel(stock) {
  if (
    stock?.quoteStatus === "unavailable" ||
    stock?.price === null ||
    stock?.price === undefined
  ) {
    return "Quote unavailable";
  }

  if (stock?.quoteStatus === "previous") {
    return "Previous value";
  }

  if (
    String(stock?.marketState || "").toUpperCase() ===
    "REGULAR"
  ) {
    return "Market open";
  }

  return "Latest close";
}

function getStatusPresentation({
  loading,
  refreshing,
  error,
  stocks,
  meta,
}) {
  if ((loading || refreshing) && stocks.length === 0) {
    return {
      status: "loading",
      label: "Loading",
    };
  }

  if (error && stocks.length === 0) {
    return {
      status: "unavailable",
      label: "Unavailable",
    };
  }

  if (
    error ||
    meta?.partial ||
    meta?.stale ||
    (meta?.unavailableSymbols?.length || 0) > 0
  ) {
    return {
      status: "delayed",
      label: "Partial update",
    };
  }

  if (meta?.cached) {
    return {
      status: "cached",
      label: "Cached",
    };
  }

  return {
    status: "live",
    label: "Live",
  };
}

export default function WatchlistCard({
  stocks = [],
  loading = false,
  refreshing = false,
  error = "",
  meta = null,
  onAnalyze,
  onRemove,
  onRefresh,
}) {
  const safeStocks = Array.isArray(stocks)
    ? stocks
    : [];

  const statusPresentation =
    getStatusPresentation({
      loading,
      refreshing,
      error,
      stocks: safeStocks,
      meta,
    });

  return (
    <article className="exa-dashboard-card exa-watchlist-card">
      <div className="exa-card-heading exa-watchlist-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            SAVED STOCKS
          </p>

          <h2>My Watchlist</h2>
        </div>

        <div className="exa-watchlist-card-heading-actions">
          <span className="exa-watchlist-count">
            {safeStocks.length} stocks
          </span>

          <button
            type="button"
            className="exa-watchlist-refresh-button"
            disabled={loading || refreshing}
            onClick={onRefresh}
            aria-label="Reload watchlist prices"
            title="Reload watchlist prices"
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? "spinning"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      <div className="exa-watchlist-data-meta">
        <DataStatusBadge
          status={statusPresentation.status}
          label={statusPresentation.label}
          compact
        />

        <DataTimestamp
          value={
            meta?.latestQuoteAt ||
            meta?.fetchedAt
          }
          source={meta?.source || "Market data"}
          fallbackText={
            loading
              ? "Fetching prices"
              : "Update time unavailable"
          }
          compact
        />
      </div>

      {error && safeStocks.length > 0 && (
        <p className="exa-watchlist-inline-warning">
          {meta?.warning ||
            "Some quotes could not be refreshed. Previous values remain visible."}
        </p>
      )}

      {loading && safeStocks.length === 0 ? (
        <div className="exa-watchlist-empty">
          <strong>Loading watchlist</strong>
          <p>Fetching current market values.</p>
        </div>
      ) : error && safeStocks.length === 0 ? (
        <div className="exa-watchlist-empty">
          <strong>Prices unavailable</strong>
          <p>Reload the watchlist to try again.</p>
        </div>
      ) : safeStocks.length === 0 ? (
        <div className="exa-watchlist-empty">
          <strong>Your watchlist is empty</strong>
          <p>
            Add stocks from the Analyze page to monitor them here.
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

          {safeStocks.map((stock, index) => {
            const changeNumber = Number(
              stock?.changePercent,
            );

            const hasChange =
              stock?.changePercent !== null &&
              stock?.changePercent !== undefined &&
              Number.isFinite(changeNumber);

            const changeClass = !hasChange
              ? "neutral"
              : changeNumber >= 0
                ? "positive"
                : "negative";

            const quoteUnavailable =
              stock?.quoteStatus === "unavailable" ||
              stock?.price === null ||
              stock?.price === undefined;

            return (
              <div
                key={stock?.symbol || index}
                className={`exa-watchlist-row ${
                  quoteUnavailable
                    ? "quote-unavailable"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="exa-watchlist-company"
                  onClick={() => {
                    if (onAnalyze && stock?.symbol) {
                      onAnalyze(stock.symbol);
                    }
                  }}
                >
                  <CompanyLogo
                    symbol={stock?.symbol}
                    name={stock?.name}
                    logoDomain={stock?.logoDomain}
                    website={stock?.website}
                    size={40}
                    className="exa-stock-avatar"
                  />

                  <span>
                    <strong>
                      {stock?.name || "Unknown"}
                    </strong>

                    <small>
                      {stock?.symbol || "-"}
                      <span aria-hidden="true"> · </span>
                      {getQuoteLabel(stock)}
                    </small>
                  </span>
                </button>

                <span className="exa-watchlist-price">
                  {formatPrice(
                    stock?.price,
                    stock?.currency,
                  )}
                </span>

                <span
                  className={`exa-watchlist-change ${changeClass}`}
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
                      if (onAnalyze && stock?.symbol) {
                        onAnalyze(stock.symbol);
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
                    title="Remove from watchlist"
                    onClick={() => {
                      if (onRemove && stock?.symbol) {
                        onRemove(stock.symbol);
                      }
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="exa-watchlist-note">
        Market data may be delayed. EXA scores appear only after a successful AI analysis.
      </p>
    </article>
  );
}