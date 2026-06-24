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

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function formatVolume(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

export default function MarketMovers({
  movers = {},
  onAnalyze,
}) {
  const [activeTab, setActiveTab] =
    useState("gainers");

  const selectedStocks = useMemo(() => {
    const value = movers?.[activeTab];

    return Array.isArray(value)
      ? value
      : [];
  }, [movers, activeTab]);

  function handleAnalyze(symbol) {
    if (onAnalyze && symbol) {
      onAnalyze(symbol);
    }
  }

  return (
    <article className="exa-dashboard-card exa-movers-card">
      <div className="exa-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            MARKET ACTIVITY
          </p>

          <h2>Market Movers</h2>
        </div>

        <span className="exa-demo-label">
          Demo data
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
          Market mover data is unavailable.
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
                    ).padStart(2, "0")}
                  </span>

                  <span className="exa-mover-company">
                    <strong>
                      {stock?.name ||
                        "Unknown"}
                    </strong>

                    <small>
                      {stock?.symbol || "-"}
                    </small>
                  </span>

                  <span className="exa-mover-price">
                    {formatPrice(
                      stock?.price,
                    )}
                  </span>

                  {activeTab === "active" ? (
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
    </article>
  );
}