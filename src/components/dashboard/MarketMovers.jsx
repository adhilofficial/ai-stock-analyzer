import {
  useMemo,
  useState,
} from "react";

const TABS = [
  {
    id: "gainers",
    label: "Top Gainers",
  },
  {
    id: "losers",
    label: "Top Losers",
  },
  {
    id: "active",
    label: "Most Active",
  },
];

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(number);
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `${
    number >= 0 ? "+" : ""
  }${number.toFixed(2)}%`;
}

function formatVolume(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  ).format(number);
}

export default function MarketMovers({
  movers = {},
  onAnalyze,
  status = "fallback",
  loading = false,
  error = "",
}) {
  const [
    activeTab,
    setActiveTab,
  ] = useState("gainers");

  const selectedStocks =
    useMemo(() => {
      const stocks =
        movers?.[activeTab];

      return Array.isArray(stocks)
        ? stocks
        : [];
    }, [
      movers,
      activeTab,
    ]);

  function handleAnalyze(symbol) {
    if (
      onAnalyze &&
      symbol
    ) {
      onAnalyze(symbol);
    }
  }

  let badgeText =
    "Fallback data";

  let badgeClass =
    "fallback";

  if (loading) {
    badgeText =
      "Loading live data";

    badgeClass =
      "loading";
  } else if (
    status === "live"
  ) {
    badgeText =
      "Live data";

    badgeClass =
      "live";
  }

  return (
    <article className="exa-dashboard-card exa-movers-card">
      <div className="exa-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            MARKET ACTIVITY
          </p>

          <h2>
            Market Movers
          </h2>
        </div>

        <span
          className={
            `exa-demo-label ` +
            badgeClass
          }
        >
          {badgeText}
        </span>
      </div>

      <div
        className="exa-movers-tabs"
        role="tablist"
        aria-label="Market mover categories"
      >
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            role="tab"
            aria-selected={
              activeTab === tab.id
            }
            className={
              activeTab === tab.id
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(tab.id)
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedStocks.length === 0 ? (
        <div className="exa-movers-empty">
          {loading
            ? "Loading live market movers..."
            : "Market mover data is unavailable."}
        </div>
      ) : (
        <div className="exa-movers-list">
          {selectedStocks.map(
            (stock, index) => {
              const changePercent =
                Number(
                  stock?.changePercent,
                );

              const hasChange =
                Number.isFinite(
                  changePercent,
                );

              const positive =
                hasChange &&
                changePercent >= 0;

              return (
                <button
                  type="button"
                  key={
                    stock?.symbol ||
                    index
                  }
                  className="exa-mover-row"
                  onClick={() =>
                    handleAnalyze(
                      stock?.symbol,
                    )
                  }
                >
                  <span className="exa-mover-rank">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <span className="exa-mover-company">
                    <strong>
                      {stock?.name ||
                        "Unknown"}
                    </strong>

                    <small>
                      {stock?.symbol ||
                        "-"}
                    </small>
                  </span>

                  <span className="exa-mover-price">
                    {formatPrice(
                      stock?.price,
                    )}
                  </span>

                  {activeTab ===
                  "active" ? (
                    <span className="exa-mover-volume">
                      {formatVolume(
                        stock?.volume,
                      )}{" "}
                      volume
                    </span>
                  ) : (
                    <span
                      className={
                        positive
                          ? "exa-mover-change positive"
                          : "exa-mover-change negative"
                      }
                    >
                      {formatPercent(
                        changePercent,
                      )}
                    </span>
                  )}

                  <span className="exa-mover-arrow">
                    →
                  </span>
                </button>
              );
            },
          )}
        </div>
      )}

      {error && (
        <div className="exa-movers-status-note">
          Live Market Movers could not
          be loaded. Temporary fallback
          data is displayed.
        </div>
      )}
    </article>
  );
}