import { useEffect, useState } from "react";

const LOGO_DEV_KEY =
  import.meta.env.VITE_LOGO_DEV_KEY || "";

function formatPrice(value) {
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

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
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

function getLogoDomain(stock) {
  const savedDomain = String(
    stock?.logoDomain || "",
  ).trim();

  if (savedDomain) {
    return savedDomain;
  }

  const symbol = String(
    stock?.symbol || "",
  )
    .trim()
    .toUpperCase();

  const knownDomains = {
    "RELIANCE.NS": "ril.com",
    "INFY.NS": "infosys.com",
    "HDFCBANK.NS": "hdfcbank.com",
    "ASIANPAINT.NS": "asianpaints.com",
    "TCS.NS": "tcs.com",
    "ICICIBANK.NS": "icicibank.com",
    "SBIN.NS": "sbi.co.in",
    "WIPRO.NS": "wipro.com",
    "TECHM.NS": "techmahindra.com",
    "BHARTIARTL.NS": "airtel.in",
    "ITC.NS": "itcportal.com",
    "MARUTI.NS": "marutisuzuki.com",
    "SUNPHARMA.NS": "sunpharma.com",
    "BAJFINANCE.NS": "bajajfinserv.in",
    "BAJAJFINSV.NS": "bajajfinserv.in",
    "AXISBANK.NS": "axisbank.com",
    "KOTAKBANK.NS": "kotak.com",
    "HINDUNILVR.NS": "hul.co.in",
    "TITAN.NS": "titancompany.in",
    "POWERGRID.NS": "powergrid.in",
    "NTPC.NS": "ntpc.co.in",
    "ONGC.NS": "ongcindia.com",
    "TATASTEEL.NS": "tatasteel.com",
  };

  return knownDomains[symbol] || "";
}

function getLogoUrl(stock) {
  if (!LOGO_DEV_KEY) {
    return "";
  }

  const domain = getLogoDomain(stock);

  if (!domain) {
    return "";
  }

  return (
    `https://img.logo.dev/${encodeURIComponent(domain)}` +
    `?token=${encodeURIComponent(LOGO_DEV_KEY)}` +
    "&size=64&format=png"
  );
}

function StockLogo({ stock }) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const logoUrl = getLogoUrl(stock);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const firstLetter =
    stock?.name
      ?.charAt(0)
      ?.toUpperCase() || "S";

  return (
    <span className="exa-stock-avatar">
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={`${stock?.name || "Company"} logo`}
          className="exa-stock-logo"
          loading="lazy"
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <span className="exa-stock-fallback">
          {firstLetter}
        </span>
      )}
    </span>
  );
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

          {stocks.map((stock, index) => {
            const changeNumber = Number(
              stock?.changePercent,
            );

            const hasChange =
              stock?.changePercent !== null &&
              stock?.changePercent !== undefined &&
              Number.isFinite(changeNumber);

            const changeClass =
              !hasChange
                ? "neutral"
                : changeNumber >= 0
                  ? "positive"
                  : "negative";

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
                  <StockLogo stock={stock} />

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
                      if (
                        onAnalyze &&
                        stock?.symbol
                      ) {
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
                    onClick={() => {
                      if (
                        onRemove &&
                        stock?.symbol
                      ) {
                        onRemove(stock.symbol);
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
        Prices and daily changes are loaded from Yahoo Finance.
        EXA scores appear only after a successful AI analysis.{" "}
        <a
          href="https://logo.dev"
          target="_blank"
          rel="noreferrer"
          className="exa-logo-attribution"
        >
          Logos provided by Logo.dev
        </a>
      </p>
    </article>
  );
}