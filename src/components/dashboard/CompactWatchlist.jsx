import {
  ArrowUpRight,
  Plus,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

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

  return `${
    number >= 0 ? "+" : ""
  }${number.toFixed(2)}%`;
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
    "HINDALCO.NS": "hindalco.com",
    "JSWSTEEL.NS": "jsw.in",
    "ULTRACEMCO.NS": "ultratechcement.com",
    "ADANIPORTS.NS": "adani.com",
  };

  return knownDomains[symbol] || "";
}

function getLogoUrl(stock) {
  const domain =
    getLogoDomain(stock);

  if (
    !domain ||
    !LOGO_DEV_KEY
  ) {
    return "";
  }

  return (
    `https://img.logo.dev/${encodeURIComponent(
      domain,
    )}` +
    `?token=${encodeURIComponent(
      LOGO_DEV_KEY,
    )}` +
    "&size=64&format=png"
  );
}

function CompactStockLogo({
  stock,
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const logoUrl =
    getLogoUrl(stock);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const firstLetter =
    stock?.name
      ?.charAt(0)
      ?.toUpperCase() ||
    stock?.symbol
      ?.charAt(0)
      ?.toUpperCase() ||
    "S";

  return (
    <span className="exa-compact-stock-logo">
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={`${stock?.name || "Company"} logo`}
          loading="lazy"
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <span>
          {firstLetter}
        </span>
      )}
    </span>
  );
}

export default function CompactWatchlist({
  stocks = [],
  loading = false,
  error = "",
  onAnalyze,
  onRemove,
  onViewAll,
}) {
  const visibleStocks =
    Array.isArray(stocks)
      ? stocks.slice(0, 6)
      : [];

  function handleAnalyze(symbol) {
    if (
      onAnalyze &&
      symbol
    ) {
      onAnalyze(symbol);
    }
  }

  function handleRemove(symbol) {
    if (
      onRemove &&
      symbol
    ) {
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
          <span>
            {stocks.length}
          </span>

          <button
            type="button"
            aria-label="Add stock"
            onClick={onViewAll}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="exa-compact-watchlist-state">
          Loading live prices...
        </div>
      ) : error ? (
        <div className="exa-compact-watchlist-state error">
          Live prices are temporarily unavailable.
        </div>
      ) : visibleStocks.length === 0 ? (
        <div className="exa-compact-watchlist-state">
          <strong>
            Watchlist is empty
          </strong>

          <p>
            Add stocks from the Analyze page.
          </p>
        </div>
      ) : (
        <div className="exa-compact-watchlist-list">
          {visibleStocks.map(
            (stock, index) => {
              const change =
                Number(
                  stock?.changePercent,
                );

              const hasChange =
                stock?.changePercent !==
                  null &&
                stock?.changePercent !==
                  undefined &&
                Number.isFinite(
                  change,
                );

              const changeClass =
                !hasChange
                  ? "neutral"
                  : change >= 0
                    ? "positive"
                    : "negative";

              return (
                <div
                  key={
                    stock?.symbol ||
                    index
                  }
                  className="exa-compact-watchlist-row"
                >
                  <button
                    type="button"
                    className="exa-compact-stock-button"
                    onClick={() =>
                      handleAnalyze(
                        stock?.symbol,
                      )
                    }
                  >
                    <CompactStockLogo
                      stock={stock}
                    />

                    <span className="exa-compact-stock-copy">
                      <strong>
                        {stock?.name ||
                          stock?.symbol ||
                          "Unknown"}
                      </strong>

                      <small>
                        {stock?.symbol ||
                          "-"}
                      </small>
                    </span>
                  </button>

                  <div className="exa-compact-stock-price">
                    <strong>
                      {formatPrice(
                        stock?.price,
                      )}
                    </strong>

                    <span
                      className={
                        changeClass
                      }
                    >
                      {formatPercent(
                        stock?.changePercent,
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="exa-compact-remove-button"
                    aria-label={`Remove ${
                      stock?.name ||
                      "stock"
                    }`}
                    onClick={() =>
                      handleRemove(
                        stock?.symbol,
                      )
                    }
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            },
          )}
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