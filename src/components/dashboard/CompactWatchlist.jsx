import {
  ArrowUpRight,
  Plus,
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

  const availableStocks = stocks.filter(
    (stock) => stock?.price !== null && stock?.price !== undefined,
  );

  if (
    availableStocks.length > 0 &&
    availableStocks.every(
      (stock) =>
        String(stock?.marketState || "").toUpperCase() !==
        "REGULAR",
    )
  ) {
    return {
      status: "delayed",
      label: "Market closed",
    };
  }

  return {
    status: "live",
    label: "Live",
  };
}

export default function CompactWatchlist({
  stocks = [],
  loading = false,
  refreshing = false,
  error = "",
  meta = null,
  onAnalyze,
  onRemove,
  onViewAll,
  onRefresh,
}) {
  const safeStocks = Array.isArray(stocks)
    ? stocks
    : [];

  const visibleStocks = safeStocks.slice(0, 6);

  const statusPresentation =
    getStatusPresentation({
      loading,
      refreshing,
      error,
      stocks: safeStocks,
      meta,
    });

  const statusTimestamp =
    meta?.latestQuoteAt || meta?.fetchedAt;

  function handleAnalyze(symbol) {
    if (onAnalyze && symbol) {
      onAnalyze(symbol);
    }
  }

  function handleRemove(symbol) {
    if (onRemove && symbol) {
      onRemove(symbol);
    }
  }

  return (
    <article className="exa-dashboard-card exa-compact-watchlist-card">
      <div className="exa-compact-card-header">
        <div>
          <p className="exa-card-eyebrow">
            SAVED STOCKS
          </p>

          <h2>Watchlist</h2>
        </div>

        <div className="exa-compact-header-actions">
          <span>{safeStocks.length}</span>

          <button
            type="button"
            aria-label="Add stock"
            title="Add stock"
            onClick={onViewAll}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="exa-compact-watchlist-meta">
        <div className="exa-compact-watchlist-meta-copy">
          <DataStatusBadge
            status={statusPresentation.status}
            label={statusPresentation.label}
            compact
          />

          <DataTimestamp
            value={statusTimestamp}
            source={meta?.source || "Market data"}
            fallbackText={
              loading
                ? "Fetching prices"
                : "Update time unavailable"
            }
            compact
          />
        </div>

        <button
          type="button"
          className="exa-compact-watchlist-refresh"
          aria-label="Reload watchlist prices"
          title="Reload watchlist prices"
          disabled={loading || refreshing}
          onClick={onRefresh}
        >
          <RefreshCw
            size={13}
            className={
              refreshing
                ? "exa-compact-watchlist-refresh-icon spinning"
                : "exa-compact-watchlist-refresh-icon"
            }
          />
        </button>
      </div>

      {error && visibleStocks.length > 0 && (
        <p
          className="exa-compact-watchlist-warning"
          role="status"
        >
          {meta?.warning ||
            "Some prices could not be refreshed. Previous values remain visible."}
        </p>
      )}

      {loading && visibleStocks.length === 0 ? (
        <div className="exa-compact-watchlist-state">
          Loading market prices...
        </div>
      ) : error && visibleStocks.length === 0 ? (
        <div className="exa-compact-watchlist-state error">
          <strong>Prices unavailable</strong>
          <p>Reload the watchlist to try again.</p>
        </div>
      ) : visibleStocks.length === 0 ? (
        <div className="exa-compact-watchlist-state">
          <strong>Watchlist is empty</strong>
          <p>Add stocks from the Analyze page.</p>
        </div>
      ) : (
        <div className="exa-compact-watchlist-list">
          {visibleStocks.map((stock, index) => {
            const change = Number(
              stock?.changePercent,
            );

            const hasChange =
              stock?.changePercent !== null &&
              stock?.changePercent !== undefined &&
              Number.isFinite(change);

            const changeClass = !hasChange
              ? "neutral"
              : change >= 0
                ? "positive"
                : "negative";

            const quoteUnavailable =
              stock?.quoteStatus === "unavailable" ||
              stock?.price === null ||
              stock?.price === undefined;

            return (
              <div
                key={stock?.symbol || index}
                className={`exa-compact-watchlist-row ${
                  quoteUnavailable
                    ? "quote-unavailable"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="exa-compact-stock-button"
                  onClick={() =>
                    handleAnalyze(stock?.symbol)
                  }
                >
                  <CompanyLogo
                    symbol={stock?.symbol}
                    name={stock?.name}
                    logoDomain={stock?.logoDomain}
                    website={stock?.website}
                    size={36}
                    className="exa-compact-stock-logo"
                  />

                  <span className="exa-compact-stock-copy">
                    <strong>
                      {stock?.name ||
                        stock?.symbol ||
                        "Unknown"}
                    </strong>

                    <small>
                      {stock?.symbol || "-"}
                      <span aria-hidden="true"> · </span>
                      {getQuoteLabel(stock)}
                    </small>
                  </span>
                </button>

                <div className="exa-compact-stock-price">
                  <strong>
                    {formatPrice(
                      stock?.price,
                      stock?.currency,
                    )}
                  </strong>

                  <span className={changeClass}>
                    {formatPercent(
                      stock?.changePercent,
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  className="exa-compact-remove-button"
                  aria-label={`Remove ${
                    stock?.name || "stock"
                  }`}
                  title="Remove from watchlist"
                  onClick={() =>
                    handleRemove(stock?.symbol)
                  }
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="exa-compact-view-all"
        onClick={onViewAll}
      >
        View full watchlist
        <ArrowUpRight size={14} />
      </button>
    </article>
  );
}