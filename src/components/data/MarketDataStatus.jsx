import DataStatusBadge from "./DataStatusBadge";
import DataTimestamp from "./DataTimestamp";

const ACTIVE_MARKET_STATES = new Set([
  "REGULAR",
  "PRE",
  "POST",
]);

function hasValidPrice(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

function getTimestampAgeMinutes(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(
    0,
    (Date.now() - date.getTime()) / 60_000,
  );
}

function getMarketDataPresentation({
  loading,
  error,
  symbol,
  price,
  lastUpdated,
  marketState,
}) {
  const hasData =
    Boolean(symbol) && hasValidPrice(price);

  if (loading && !hasData) {
    return {
      status: "loading",
      label: "Loading",
      fallbackText: "Fetching market data",
    };
  }

  if (!hasData) {
    return {
      status: "unavailable",
      label: "Unavailable",
      fallbackText: "Market data unavailable",
    };
  }

  if (error) {
    return {
      status: "delayed",
      label: "Partial data",
      fallbackText: "Latest refresh failed",
    };
  }

  const normalizedMarketState = String(
    marketState || "",
  ).toUpperCase();

  if (
    normalizedMarketState &&
    !ACTIVE_MARKET_STATES.has(
      normalizedMarketState,
    )
  ) {
    return {
      status: "delayed",
      label: "Market closed",
      fallbackText: "Latest available market close",
    };
  }

  const ageMinutes =
    getTimestampAgeMinutes(lastUpdated);

  if (ageMinutes === null) {
    return {
      status: "delayed",
      label: "Timestamp unavailable",
      fallbackText: "Update time unavailable",
    };
  }

  if (ageMinutes <= 20) {
    return {
      status: "live",
      label: "Live",
      fallbackText: "Recently updated",
    };
  }

  return {
    status: "delayed",
    label: "Delayed",
    fallbackText: "Data may be delayed",
  };
}

export default function MarketDataStatus({
  loading = false,
  error = "",
  symbol,
  price,
  lastUpdated,
  source,
  marketState,
  compact = false,
  className = "",
}) {
  const presentation =
    getMarketDataPresentation({
      loading,
      error,
      symbol,
      price,
      lastUpdated,
      marketState,
    });

  return (
    <div
      className={`exa-data-status-row exa-market-data-status ${className}`}
      role="status"
      aria-live="polite"
    >
      <DataStatusBadge
        status={presentation.status}
        label={presentation.label}
        compact={compact}
      />

      <DataTimestamp
        value={lastUpdated}
        source={source}
        fallbackText={presentation.fallbackText}
        compact={compact}
      />
    </div>
  );
}