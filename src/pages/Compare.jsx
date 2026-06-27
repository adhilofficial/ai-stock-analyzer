import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";

const MAX_COMPARE_STOCKS = 5;

const METRIC_GROUPS = [
  {
    title: "Market overview",
    metrics: [
      {
        key: "price",
        label: "Current price",
        format: "price",
      },
      {
        key: "changePercent",
        label: "Daily change",
        format: "percent",
        direction: "high",
      },
      {
        key: "marketCap",
        label: "Market cap",
        format: "large",
        direction: "high",
      },
      {
        key: "volume",
        label: "Volume",
        format: "number",
        direction: "high",
      },
      {
        key: "week52Low",
        label: "52-week low",
        format: "price",
      },
      {
        key: "week52High",
        label: "52-week high",
        format: "price",
      },
      {
        key: "distanceFrom52WeekHigh",
        label: "Distance from 52W high",
        format: "percent",
        direction: "low",
      },
    ],
  },
  {
    title: "Valuation",
    metrics: [
      {
        key: "peRatio",
        label: "Trailing P/E",
        format: "number",
        direction: "low-positive",
      },
      {
        key: "forwardPE",
        label: "Forward P/E",
        format: "number",
        direction: "low-positive",
      },
      {
        key: "priceToBook",
        label: "Price-to-book",
        format: "number",
        direction: "low-positive",
      },
      {
        key: "dividendYield",
        label: "Dividend yield",
        format: "percent",
        direction: "high",
      },
    ],
  },
  {
    title: "Growth and profitability",
    metrics: [
      {
        key: "revenueGrowthPercent",
        label: "Revenue growth",
        format: "percent",
        direction: "high",
      },
      {
        key: "earningsGrowthPercent",
        label: "Earnings growth",
        format: "percent",
        direction: "high",
      },
      {
        key: "returnOnEquityPercent",
        label: "Return on equity",
        format: "percent",
        direction: "high",
      },
      {
        key: "profitMarginsPercent",
        label: "Profit margin",
        format: "percent",
        direction: "high",
      },
    ],
  },
  {
    title: "Financial health",
    metrics: [
      {
        key: "debtToEquity",
        label: "Debt-to-equity",
        format: "number",
        direction: "low",
      },
      {
        key: "currentRatio",
        label: "Current ratio",
        format: "number",
        direction: "high",
      },
      {
        key: "totalCash",
        label: "Total cash",
        format: "large",
        direction: "high",
      },
      {
        key: "totalDebt",
        label: "Total debt",
        format: "large",
        direction: "low",
      },
      {
        key: "freeCashflow",
        label: "Free cash flow",
        format: "large",
        direction: "high",
      },
    ],
  },
  {
    title: "Technical condition",
    metrics: [
      {
        key: "rsi",
        label: "RSI",
        format: "number",
      },
      {
        key: "rsiStatus",
        label: "RSI status",
        format: "text",
      },
      {
        key: "sma20",
        label: "SMA 20",
        format: "price",
      },
      {
        key: "sma50",
        label: "SMA 50",
        format: "price",
      },
      {
        key: "trend",
        label: "Trend",
        format: "trend",
      },
    ],
  },
];

const COMPARE_STYLES = `
  .exa-compare-page {
    min-height: 100vh;
    padding: 28px;
    color: #e2e8f0;
  }

  .exa-compare-container {
    width: 100%;
    max-width: 1500px;
    margin: 0 auto;
  }

  .exa-compare-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .exa-compare-eyebrow {
    margin: 0 0 7px;
    color: #22d3ee;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .exa-compare-header h1 {
    margin: 0;
    color: #f8fafc;
    font-size: clamp(27px, 4vw, 40px);
    line-height: 1.1;
  }

  .exa-compare-subtitle {
    max-width: 760px;
    margin: 10px 0 0;
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.7;
  }

  .exa-compare-back {
    min-height: 40px;
    padding: 9px 13px;
    border: 1px solid #29405f;
    border-radius: 11px;
    color: #cbd5e1;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .exa-compare-summary {
    padding: 12px 14px;
    margin-bottom: 14px;
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 13px;
    color: #cbd5e1;
    background: rgba(8, 47, 73, 0.12);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    font-size: 10px;
  }

  .exa-compare-summary strong {
    color: #e0f2fe;
  }

  .exa-compare-company-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .exa-compare-company-card {
    min-width: 0;
    padding: 15px;
    border: 1px solid #1e3350;
    border-radius: 15px;
    background:
      linear-gradient(
        145deg,
        rgba(14, 29, 50, 0.98),
        rgba(8, 20, 37, 0.98)
      );
  }

  .exa-compare-company-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .exa-compare-logo {
    width: 42px;
    height: 42px;
    border: 1px solid #2a405e;
    border-radius: 50%;
    color: #93c5fd;
    background: #17263d;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    font-size: 14px;
    font-weight: 800;
  }

  .exa-compare-logo img {
    width: 72%;
    height: 72%;
    object-fit: contain;
  }

  .exa-compare-company-copy {
    min-width: 0;
    flex: 1;
  }

  .exa-compare-company-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-compare-company-copy span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 9px;
  }

  .exa-compare-remove {
    width: 28px;
    height: 28px;
    border: 1px solid rgba(244, 63, 94, 0.18);
    border-radius: 8px;
    color: #fda4af;
    background: rgba(244, 63, 94, 0.06);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .exa-compare-price-row {
    margin-top: 15px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .exa-compare-price-row strong {
    color: #f8fafc;
    font-size: 18px;
  }

  .exa-compare-change {
    font-size: 10px;
    font-weight: 800;
  }

  .exa-compare-change.positive {
    color: #4ade80;
  }

  .exa-compare-change.negative {
    color: #fb7185;
  }

  .exa-compare-company-actions {
    display: flex;
    gap: 7px;
    margin-top: 13px;
  }

  .exa-compare-analyze,
  .exa-compare-external {
    min-height: 33px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 9px;
    font-weight: 800;
    text-decoration: none;
  }

  .exa-compare-analyze {
    flex: 1;
    border: 1px solid rgba(96, 165, 250, 0.3);
    color: #dbeafe;
    background: rgba(37, 99, 235, 0.12);
    cursor: pointer;
  }

  .exa-compare-external {
    width: 34px;
    border: 1px solid #29405f;
    color: #94a3b8;
    background: #101e34;
  }

  .exa-compare-table-card {
    overflow: hidden;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-compare-table-scroll {
    overflow-x: auto;
  }

  .exa-compare-table {
    width: 100%;
    min-width: 940px;
    border-collapse: collapse;
  }

  .exa-compare-table th,
  .exa-compare-table td {
    padding: 12px;
    border-bottom: 1px solid #172a45;
    font-size: 10px;
    text-align: left;
    vertical-align: middle;
  }

  .exa-compare-table th {
    color: #94a3b8;
    background: #0d1a2e;
    font-weight: 800;
  }

  .exa-compare-table th:first-child,
  .exa-compare-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    min-width: 180px;
    background: #0d1a2e;
  }

  .exa-compare-table td {
    color: #cbd5e1;
    background: #0a1628;
  }

  .exa-compare-table td:first-child {
    color: #94a3b8;
    font-weight: 700;
  }

  .exa-compare-group-row td {
    padding: 10px 12px;
    color: #93c5fd !important;
    background: #101e34 !important;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .exa-compare-best {
    color: #ecfeff !important;
    background:
      linear-gradient(
        135deg,
        rgba(37, 99, 235, 0.14),
        rgba(34, 211, 238, 0.08)
      ) !important;
    box-shadow: inset 3px 0 0 #22d3ee;
    font-weight: 800;
  }

  .exa-compare-best-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .exa-compare-trend {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border: 1px solid #29405f;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 800;
  }

  .exa-compare-trend.bullish,
  .exa-compare-trend.positive {
    border-color: rgba(34, 197, 94, 0.24);
    color: #4ade80;
    background: rgba(34, 197, 94, 0.08);
  }

  .exa-compare-trend.bearish,
  .exa-compare-trend.negative {
    border-color: rgba(244, 63, 94, 0.24);
    color: #fb7185;
    background: rgba(244, 63, 94, 0.08);
  }

  .exa-compare-trend.sideways,
  .exa-compare-trend.unavailable {
    color: #94a3b8;
    background: rgba(100, 116, 139, 0.08);
  }

  .exa-compare-spinner {
    animation: exaCompareSpin 0.9s linear infinite;
  }

  @keyframes exaCompareSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .exa-compare-state {
    padding: 64px 20px;
    color: #94a3b8;
    text-align: center;
  }

  .exa-compare-state strong {
    display: block;
    margin-top: 12px;
    color: #f8fafc;
    font-size: 15px;
  }

  .exa-compare-state p {
    max-width: 520px;
    margin: 8px auto 0;
    font-size: 10px;
    line-height: 1.7;
  }

  .exa-compare-state-button {
    min-height: 38px;
    padding: 8px 12px;
    margin-top: 15px;
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 10px;
    color: #dbeafe;
    background: rgba(37, 99, 235, 0.13);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
  }

  @media (max-width: 720px) {
    .exa-compare-page {
      padding: 18px 12px 28px;
    }

    .exa-compare-header {
      flex-direction: column;
    }

    .exa-compare-back {
      width: 100%;
    }

    .exa-compare-summary {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

function cleanText(value) {
  return String(value ?? "").trim();
}

function numericValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function parseSymbols(search) {
  const parameters =
    new URLSearchParams(search);

  const rawSymbols =
    cleanText(
      parameters.get("symbols"),
    );

  const seen = new Set();

  return rawSymbols
    .split(",")
    .map((symbol) =>
      cleanText(symbol).toUpperCase(),
    )
    .filter((symbol) => {
      if (!symbol || seen.has(symbol)) {
        return false;
      }

      seen.add(symbol);
      return true;
    })
    .slice(0, MAX_COMPARE_STOCKS);
}

function formatNumber(
  value,
  digits = 2,
) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits:
        digits,
    },
  ).format(number);
}

function formatPrice(
  value,
  currency = "INR",
) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency:
          currency || "INR",
        maximumFractionDigits: 2,
      },
    ).format(number);
  } catch {
    return formatNumber(number, 2);
  }
}

function formatPercent(value) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  return `${number.toFixed(2)}%`;
}

function formatLargeNumber(value) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  const absolute =
    Math.abs(number);

  if (absolute >= 1_00_00_00_00_000) {
    return `₹${(
      number / 1_00_00_00_00_000
    ).toFixed(2)} L Cr`;
  }

  if (absolute >= 1_00_00_000) {
    return `₹${(
      number / 1_00_00_000
    ).toFixed(0)} Cr`;
  }

  if (absolute >= 1_00_000) {
    return `₹${(
      number / 1_00_000
    ).toFixed(1)} L`;
  }

  return `₹${formatNumber(number, 0)}`;
}

function formatMetric(
  metric,
  stock,
) {
  const value = stock?.[metric.key];

  switch (metric.format) {
    case "price":
      return formatPrice(
        value,
        stock?.currency,
      );

    case "percent":
      return formatPercent(value);

    case "large":
      return formatLargeNumber(value);

    case "number":
      return formatNumber(value, 2);

    case "trend":
    case "text":
      return cleanText(value) || "N/A";

    default:
      return cleanText(value) || "N/A";
  }
}

function getBestSymbols(
  metric,
  stocks,
) {
  if (!metric.direction) {
    return new Set();
  }

  const candidates = stocks
    .map((stock) => ({
      symbol: stock.symbol,
      value: numericValue(
        stock?.[metric.key],
      ),
    }))
    .filter(
      (item) =>
        item.value !== null &&
        (
          metric.direction !==
            "low-positive" ||
          item.value > 0
        ),
    );

  if (candidates.length < 2) {
    return new Set();
  }

  let target;

  if (
    metric.direction === "high"
  ) {
    target = Math.max(
      ...candidates.map(
        (item) => item.value,
      ),
    );
  } else {
    target = Math.min(
      ...candidates.map(
        (item) => item.value,
      ),
    );
  }

  return new Set(
    candidates
      .filter(
        (item) =>
          item.value === target,
      )
      .map(
        (item) => item.symbol,
      ),
  );
}

function CompanyLogo({
  domain,
  name,
}) {
  const [failed, setFailed] =
    useState(false);

  const logoKey =
    import.meta.env
      .VITE_LOGO_KEY;

  const showImage = Boolean(
    domain &&
      logoKey &&
      !failed,
  );

  return (
    <span className="exa-compare-logo">
      {showImage ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${logoKey}&size=128&format=webp`}
          alt=""
          loading="lazy"
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        cleanText(name || "?")
          .charAt(0)
          .toUpperCase()
      )}
    </span>
  );
}

function TrendBadge({ trend }) {
  const normalized =
    cleanText(
      trend || "Unavailable",
    );

  const className =
    normalized
      .toLowerCase()
      .replace(/\s+/g, "-");

  const positive = [
    "Bullish",
    "Positive",
  ].includes(normalized);

  const negative = [
    "Bearish",
    "Negative",
  ].includes(normalized);

  return (
    <span
      className={`exa-compare-trend ${className}`}
    >
      {positive ? (
        <TrendingUp size={11} />
      ) : negative ? (
        <TrendingDown size={11} />
      ) : (
        <BarChart3 size={11} />
      )}

      {normalized}
    </span>
  );
}

export default function Compare() {
  const location = useLocation();
  const navigate = useNavigate();

  const requestedSymbols =
    useMemo(
      () =>
        parseSymbols(
          location.search,
        ),
      [location.search],
    );

  const [stocks, setStocks] =
    useState([]);

  const [apiData, setApiData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadComparison =
    useCallback(
      async (signal) => {
        if (
          requestedSymbols.length <
          2
        ) {
          setStocks([]);
          setApiData(null);
          setLoading(false);
          setError(
            "Select at least two companies from the Stock Screener.",
          );
          return;
        }

        setLoading(true);
        setError("");

        try {
          const parameters =
            new URLSearchParams({
              symbols:
                requestedSymbols.join(
                  ",",
                ),
            });

          const response =
            await fetch(
              `/api/compare?${parameters.toString()}`,
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                },
                signal,
              },
            );

          const contentType =
            response.headers.get(
              "content-type",
            ) || "";

          if (
            !contentType.includes(
              "application/json",
            )
          ) {
            throw new Error(
              "The comparison API returned a non-JSON response.",
            );
          }

          const data =
            await response.json();

          if (
            !response.ok ||
            data?.success !== true
          ) {
            throw new Error(
              data?.error ||
                "Unable to load comparison data.",
            );
          }

          setApiData(data);
          setStocks(
            Array.isArray(
              data?.stocks,
            )
              ? data.stocks
              : [],
          );
        } catch (
          caughtError
        ) {
          if (
            caughtError?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Comparison loading error:",
            caughtError,
          );

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load comparison data.",
          );

          setStocks([]);
        } finally {
          if (!signal?.aborted) {
            setLoading(false);
          }
        }
      },
      [requestedSymbols],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadComparison(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [loadComparison]);

  function updateSymbols(
    nextSymbols,
  ) {
    const normalized = [
      ...new Set(
        nextSymbols
          .map((symbol) =>
            cleanText(symbol)
              .toUpperCase(),
          )
          .filter(Boolean),
      ),
    ].slice(
      0,
      MAX_COMPARE_STOCKS,
    );

    const parameters =
      new URLSearchParams();

    if (normalized.length > 0) {
      parameters.set(
        "symbols",
        normalized.join(","),
      );
    }

    navigate({
      pathname: "/compare",
      search:
        parameters.toString()
          ? `?${parameters.toString()}`
          : "",
    });
  }

  function removeStock(symbol) {
    updateSymbols(
      requestedSymbols.filter(
        (item) =>
          item !== symbol,
      ),
    );
  }

  function openAnalysis(symbol) {
    navigate(
      `/analyze?symbol=${encodeURIComponent(
        symbol,
      )}`,
    );
  }

  return (
    <AppShell>
      <style>
        {COMPARE_STYLES}
      </style>

      <main className="exa-compare-page">
        <div className="exa-compare-container">
          <section className="exa-compare-header">
            <div>
              <p className="exa-compare-eyebrow">
                EXA NEXUS
              </p>

              <h1>
                Stock Comparison
              </h1>

              <p className="exa-compare-subtitle">
                Compare up to five Indian companies across market,
                valuation, growth, financial-health and technical
                indicators. Highlighted cells show the strongest numeric
                value only within this selected group and are not investment
                recommendations.
              </p>
            </div>

            <button
              type="button"
              className="exa-compare-back"
              onClick={() =>
                navigate("/screener")
              }
            >
              <ArrowLeft size={14} />
              Back to Screener
            </button>
          </section>

          {loading ? (
            <section className="exa-compare-table-card">
              <div className="exa-compare-state">
                <LoaderCircle
                  size={30}
                  className="exa-compare-spinner"
                />

                <strong>
                  Loading comparison
                </strong>

                <p>
                  Reading the selected companies from the current
                  screener snapshot.
                </p>
              </div>
            </section>
          ) : error ? (
            <section className="exa-compare-table-card">
              <div className="exa-compare-state">
                <AlertCircle
                  size={30}
                  color="#fb7185"
                />

                <strong>
                  Comparison unavailable
                </strong>

                <p>{error}</p>

                <button
                  type="button"
                  className="exa-compare-state-button"
                  onClick={() =>
                    navigate("/screener")
                  }
                >
                  <ArrowLeft size={13} />
                  Select companies
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="exa-compare-summary">
                <span>
                  <strong>
                    {stocks.length} companies
                  </strong>{" "}
                  selected · snapshot generated{" "}
                  {apiData?.generatedAt
                    ? new Date(
                        apiData.generatedAt,
                      ).toLocaleString(
                        "en-IN",
                      )
                    : "time unavailable"}
                </span>

                <span>
                  Source:{" "}
                  {apiData?.source ||
                    "Yahoo Finance"}
                </span>
              </section>

              <section className="exa-compare-company-grid">
                {stocks.map(
                  (stock) => {
                    const change =
                      numericValue(
                        stock
                          ?.changePercent,
                      ) || 0;

                    return (
                      <article
                        key={
                          stock.symbol
                        }
                        className="exa-compare-company-card"
                      >
                        <div className="exa-compare-company-top">
                          <CompanyLogo
                            domain={
                              stock.logoDomain
                            }
                            name={
                              stock.name
                            }
                          />

                          <div className="exa-compare-company-copy">
                            <strong title={stock.name}>
                              {
                                stock.name
                              }
                            </strong>

                            <span>
                              {
                                stock.symbol
                              }{" "}
                              ·{" "}
                              {
                                stock.sector
                              }
                            </span>
                          </div>

                          <button
                            type="button"
                            className="exa-compare-remove"
                            onClick={() =>
                              removeStock(
                                stock.symbol,
                              )
                            }
                            aria-label={`Remove ${stock.name}`}
                            title="Remove company"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        <div className="exa-compare-price-row">
                          <strong>
                            {formatPrice(
                              stock.price,
                              stock.currency,
                            )}
                          </strong>

                          <span
                            className={
                              change >= 0
                                ? "exa-compare-change positive"
                                : "exa-compare-change negative"
                            }
                          >
                            {change >= 0
                              ? "+"
                              : ""}
                            {formatPercent(
                              change,
                            )}
                          </span>
                        </div>

                        <div className="exa-compare-company-actions">
                          <button
                            type="button"
                            className="exa-compare-analyze"
                            onClick={() =>
                              openAnalysis(
                                stock.symbol,
                              )
                            }
                          >
                            Analyze
                            <ArrowRight
                              size={11}
                            />
                          </button>

                          {stock.nseUrl && (
                            <a
                              className="exa-compare-external"
                              href={
                                stock.nseUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${stock.name} on NSE`}
                              title="Open NSE"
                            >
                              <ExternalLink
                                size={11}
                              />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </section>

              <section className="exa-compare-table-card">
                <div className="exa-compare-table-scroll">
                  <table className="exa-compare-table">
                    <thead>
                      <tr>
                        <th>
                          Metric
                        </th>

                        {stocks.map(
                          (stock) => (
                            <th
                              key={
                                stock.symbol
                              }
                            >
                              {
                                stock.symbol
                              }
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {METRIC_GROUPS.map(
                        (group) => (
                          <Fragment key={group.title}>
                            <tr
                              key={`${group.title}-heading`}
                              className="exa-compare-group-row"
                            >
                              <td
                                colSpan={
                                  stocks.length +
                                  1
                                }
                              >
                                {
                                  group.title
                                }
                              </td>
                            </tr>

                            {group.metrics.map(
                              (metric) => {
                                const bestSymbols =
                                  getBestSymbols(
                                    metric,
                                    stocks,
                                  );

                                return (
                                  <tr
                                    key={
                                      metric.key
                                    }
                                  >
                                    <td>
                                      {
                                        metric.label
                                      }
                                    </td>

                                    {stocks.map(
                                      (
                                        stock,
                                      ) => {
                                        const isBest =
                                          bestSymbols.has(
                                            stock.symbol,
                                          );

                                        return (
                                          <td
                                            key={`${metric.key}-${stock.symbol}`}
                                            className={
                                              isBest
                                                ? "exa-compare-best"
                                                : ""
                                            }
                                          >
                                            {metric.format ===
                                            "trend" ? (
                                              <TrendBadge
                                                trend={
                                                  stock[
                                                    metric
                                                      .key
                                                  ]
                                                }
                                              />
                                            ) : isBest ? (
                                              <span className="exa-compare-best-label">
                                                <CheckCircle2
                                                  size={
                                                    11
                                                  }
                                                />

                                                {formatMetric(
                                                  metric,
                                                  stock,
                                                )}
                                              </span>
                                            ) : (
                                              formatMetric(
                                                metric,
                                                stock,
                                              )
                                            )}
                                          </td>
                                        );
                                      },
                                    )}
                                  </tr>
                                );
                              },
                            )}
                          </Fragment>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                className="exa-compare-summary"
                style={{
                  marginTop: 14,
                  marginBottom: 0,
                }}
              >
                <span>
                  <ShieldCheck
                    size={14}
                    style={{
                      marginRight: 6,
                      verticalAlign:
                        "middle",
                    }}
                  />

                  Educational research comparison only. Validate all figures
                  with official exchange filings before making financial
                  decisions.
                </span>

                <span>
                  <Scale
                    size={14}
                    style={{
                      marginRight: 6,
                      verticalAlign:
                        "middle",
                    }}
                  />
                  Maximum{" "}
                  {MAX_COMPARE_STOCKS} companies
                </span>
              </section>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}