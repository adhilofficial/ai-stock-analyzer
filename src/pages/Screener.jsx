import {
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
  ExternalLink,
  Filter,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";

const DEFAULT_FILTERS = {
  sector: "All",
  trend: "All",

  minPrice: "",
  maxPrice: "",

  minPe: "",
  maxPe: "",

  minRevenueGrowth: "",
  minRoe: "",
  minProfitMargin: "",

  maxDebtToEquity: "",

  minRsi: "",
  maxRsi: "",

  maxDistanceFromHigh: "",
};

const PRESETS = [
  {
    id: "all",
    label: "All stocks",
    description:
      "Clear every active screener filter.",
  },

  {
    id: "quality-growth",
    label: "Quality growth",
    description:
      "Growth, profitability and controlled debt.",
  },

  {
    id: "low-debt",
    label: "Low debt",
    description:
      "Companies with lower debt-to-equity.",
  },

  {
    id: "high-roe",
    label: "High ROE",
    description:
      "Return on equity of at least 15%.",
  },

  {
    id: "positive-momentum",
    label: "Positive momentum",
    description:
      "Bullish price and moving-average alignment.",
  },

  {
    id: "near-high",
    label: "Near 52-week high",
    description:
      "Trading within 10% of the annual high.",
  },

  {
    id: "value",
    label: "Value screen",
    description:
      "Moderate P/E with profitability controls.",
  },

  {
    id: "oversold",
    label: "Oversold",
    description:
      "RSI at or below 35.",
  },
];

const SORT_OPTIONS = [
  {
    value: "marketCap-desc",
    label: "Market cap: High to low",
  },

  {
    value: "changePercent-desc",
    label: "Daily change: High to low",
  },

  {
    value: "changePercent-asc",
    label: "Daily change: Low to high",
  },

  {
    value: "revenueGrowthPercent-desc",
    label: "Revenue growth: High to low",
  },

  {
    value: "returnOnEquityPercent-desc",
    label: "ROE: High to low",
  },

  {
    value: "peRatio-asc",
    label: "P/E: Low to high",
  },

  {
  value: "debtToEquity-asc",
  label: "Debt-to-equity: Low to high",
  },

  {
    value: "rsi-desc",
    label: "RSI: High to low",
  },

  {
    value: "rsi-asc",
    label: "RSI: Low to high",
  },

  {
    value: "distanceFrom52WeekHigh-asc",
    label: "Nearest 52-week high",
  },

  {
    value: "name-asc",
    label: "Company name: A to Z",
  },
];

const SCREENER_STYLES = `
  .exa-screener-page {
    min-height: 100vh;
    padding: 28px;
    color: #e2e8f0;
  }

  .exa-screener-container {
    width: 100%;
    max-width: 1540px;
    margin: 0 auto;
  }

  .exa-screener-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
  }

  .exa-screener-eyebrow {
    margin: 0 0 7px;
    color: #60a5fa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .exa-screener-header h1 {
    margin: 0;
    color: #f8fafc;
    font-size: clamp(27px, 4vw, 40px);
    line-height: 1.1;
  }

  .exa-screener-subtitle {
    max-width: 720px;
    margin: 10px 0 0;
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.7;
  }

  .exa-screener-refresh {
    min-height: 40px;
    padding: 9px 13px;
    border: 1px solid rgba(96, 165, 250, 0.28);
    border-radius: 11px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 750;
    white-space: nowrap;
  }

  .exa-screener-refresh:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .exa-screener-spinner {
    animation: exaScreenerSpin 0.9s linear infinite;
  }

  @keyframes exaScreenerSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .exa-screener-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .exa-screener-summary-card {
    min-width: 0;
    padding: 16px;
    border: 1px solid #1e3350;
    border-radius: 15px;
    background:
      linear-gradient(
        145deg,
        rgba(14, 29, 50, 0.98),
        rgba(8, 20, 37, 0.98)
      );
  }

  .exa-screener-summary-card span {
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .exa-screener-summary-card strong {
    display: block;
    margin-top: 7px;
    color: #f8fafc;
    font-size: 22px;
  }

  .exa-screener-summary-card small {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 10px;
  }

  .exa-screener-layout {
    display: grid;
    grid-template-columns: 285px minmax(0, 1fr);
    align-items: start;
    gap: 16px;
  }

  .exa-screener-sidebar {
    position: sticky;
    top: 86px;
    padding: 16px;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-screener-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .exa-screener-panel-heading div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .exa-screener-panel-heading h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 15px;
  }

  .exa-screener-reset {
    padding: 5px 7px;
    border: 0;
    border-radius: 8px;
    color: #94a3b8;
    background: transparent;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 10px;
  }

  .exa-screener-filter-group {
    padding-top: 13px;
    margin-top: 13px;
    border-top: 1px solid #172a45;
  }

  .exa-screener-filter-group:first-of-type {
    padding-top: 0;
    margin-top: 0;
    border-top: 0;
  }

  .exa-screener-filter-label {
    display: block;
    margin-bottom: 7px;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 750;
  }

  .exa-screener-input,
  .exa-screener-select {
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid #1e3350;
    border-radius: 9px;
    outline: none;
    color: #e2e8f0;
    background: #0f1d32;
    font-size: 11px;
  }

  .exa-screener-input:focus,
  .exa-screener-select:focus {
    border-color: rgba(96, 165, 250, 0.65);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-screener-select option {
    background: #0f1d32;
  }

  .exa-screener-range-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .exa-screener-main {
    min-width: 0;
  }

  .exa-screener-presets {
    padding: 15px;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-screener-presets-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 11px;
    color: #f8fafc;
    font-size: 13px;
    font-weight: 750;
  }

  .exa-screener-preset-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 3px;
  }

  .exa-screener-preset-button {
    min-width: 132px;
    padding: 10px 11px;
    border: 1px solid #1e3350;
    border-radius: 11px;
    color: #94a3b8;
    background: #101e34;
    cursor: pointer;
    text-align: left;
  }

  .exa-screener-preset-button.active {
    border-color: rgba(96, 165, 250, 0.55);
    color: #ffffff;
    background: rgba(37, 99, 235, 0.17);
  }

  .exa-screener-preset-button strong {
    display: block;
    font-size: 10px;
  }

  .exa-screener-preset-button small {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 9px;
    line-height: 1.45;
  }

  .exa-screener-toolbar {
    padding: 14px;
    margin-top: 14px;
    border: 1px solid #1e3350;
    border-radius: 15px;
    background: #0a1628;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .exa-screener-search {
    position: relative;
    flex: 1 1 260px;
  }

  .exa-screener-search svg {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .exa-screener-search input {
    width: 100%;
    min-height: 40px;
    padding: 9px 12px 9px 37px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #e2e8f0;
    background: #101e34;
    font-size: 11px;
  }

  .exa-screener-toolbar-select {
    min-height: 40px;
    padding: 8px 32px 8px 10px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #cbd5e1;
    background: #101e34;
    font-size: 10px;
  }

  .exa-screener-result-count {
    color: #64748b;
    font-size: 10px;
    white-space: nowrap;
  }

  .exa-screener-notice {
    padding: 10px 13px;
    margin-top: 12px;
    border: 1px solid rgba(234, 179, 8, 0.2);
    border-radius: 11px;
    color: #cbd5e1;
    background: rgba(113, 63, 18, 0.1);
    font-size: 10px;
    line-height: 1.6;
  }

  .exa-screener-table-card {
    min-width: 0;
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-screener-table-scroll {
    overflow-x: auto;
  }

  .exa-screener-table {
    width: 100%;
    min-width: 1120px;
    border-collapse: collapse;
  }

  .exa-screener-table th {
    padding: 12px;
    border-bottom: 1px solid #1e3350;
    color: #64748b;
    background: #0d1a2e;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .exa-screener-table td {
    padding: 13px 12px;
    border-bottom: 1px solid #152844;
    color: #cbd5e1;
    font-size: 10px;
    vertical-align: middle;
    white-space: nowrap;
  }

  .exa-screener-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .exa-screener-table tbody tr:hover {
    background: rgba(30, 64, 175, 0.06);
  }

  .exa-screener-company {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-screener-company-logo {
    width: 36px;
    height: 36px;
    overflow: hidden;
    border: 1px solid #263b57;
    border-radius: 50%;
    color: #93c5fd;
    background: #17263d;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 800;
  }

  .exa-screener-company-logo img {
    width: 72%;
    height: 72%;
    object-fit: contain;
  }

  .exa-screener-company-copy {
    min-width: 0;
    max-width: 190px;
  }

  .exa-screener-company-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 11px;
    text-overflow: ellipsis;
  }

  .exa-screener-company-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 9px;
  }

  .exa-screener-positive {
    color: #22c55e !important;
  }

  .exa-screener-negative {
    color: #fb7185 !important;
  }

  .exa-screener-neutral {
    color: #eab308 !important;
  }

  .exa-screener-trend {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border: 1px solid #1e3350;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-screener-trend.bullish,
  .exa-screener-trend.positive {
    border-color: rgba(34, 197, 94, 0.26);
    color: #4ade80;
    background: rgba(34, 197, 94, 0.09);
  }

  .exa-screener-trend.bearish,
  .exa-screener-trend.negative {
    border-color: rgba(244, 63, 94, 0.26);
    color: #fb7185;
    background: rgba(244, 63, 94, 0.09);
  }

  .exa-screener-trend.sideways,
  .exa-screener-trend.unavailable {
    color: #94a3b8;
    background: rgba(100, 116, 139, 0.08);
  }

  .exa-screener-action {
    min-height: 32px;
    padding: 6px 10px;
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 8px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.12);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-screener-link {
    width: 29px;
    height: 29px;
    border: 1px solid #1e3350;
    border-radius: 8px;
    color: #94a3b8;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .exa-screener-row-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .exa-screener-state {
    padding: 54px 20px;
    color: #94a3b8;
    text-align: center;
  }

  .exa-screener-state strong {
    display: block;
    margin-top: 11px;
    color: #f8fafc;
    font-size: 14px;
  }

  .exa-screener-state p {
    max-width: 440px;
    margin: 7px auto 0;
    font-size: 10px;
    line-height: 1.65;
  }

  .exa-screener-pagination {
    padding: 13px 15px;
    border-top: 1px solid #1e3350;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .exa-screener-pagination-info {
    color: #64748b;
    font-size: 10px;
  }

  .exa-screener-pagination-actions {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .exa-screener-page-button {
    min-height: 33px;
    padding: 6px 10px;
    border: 1px solid #1e3350;
    border-radius: 8px;
    color: #cbd5e1;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 750;
  }

  .exa-screener-page-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  @media (max-width: 1100px) {
    .exa-screener-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .exa-screener-layout {
      grid-template-columns: 1fr;
    }

    .exa-screener-sidebar {
      position: static;
    }

    .exa-screener-sidebar-fields {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .exa-screener-filter-group {
      padding-top: 0;
      margin-top: 0;
      border-top: 0;
    }
  }

  @media (max-width: 720px) {
    .exa-screener-page {
      padding: 18px 12px 28px;
    }

    .exa-screener-header {
      flex-direction: column;
    }

    .exa-screener-refresh {
      width: 100%;
    }

    .exa-screener-summary-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .exa-screener-summary-card {
      padding: 13px;
    }

    .exa-screener-summary-card strong {
      font-size: 18px;
    }

    .exa-screener-sidebar-fields {
      grid-template-columns: 1fr 1fr;
    }

    .exa-screener-toolbar {
      align-items: stretch;
    }

    .exa-screener-toolbar-select {
      width: 100%;
    }

    .exa-screener-pagination {
      flex-direction: column;
    }

    .exa-screener-pagination-actions {
      width: 100%;
    }

    .exa-screener-page-button {
      flex: 1;
      justify-content: center;
    }
  }

  @media (max-width: 460px) {
    .exa-screener-summary-grid,
    .exa-screener-sidebar-fields {
      grid-template-columns: 1fr;
    }
  }
`;

function numericValue(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function formatNumber(
  value,
  digits = 2,
) {
  const number =
    numericValue(value);

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
  const number =
    numericValue(value);

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
    return formatNumber(
      number,
      2,
    );
  }
}

function formatMarketCap(value) {
  const number =
    numericValue(value);

  if (number === null) {
    return "N/A";
  }

  if (
    Math.abs(number) >=
    1_00_00_000
  ) {
    return `₹${(
      number / 1_00_00_000
    ).toFixed(0)} Cr`;
  }

  if (
    Math.abs(number) >=
    1_00_000
  ) {
    return `₹${(
      number / 1_00_000
    ).toFixed(1)} L`;
  }

  return `₹${formatNumber(
    number,
    0,
  )}`;
}

function formatPercent(value) {
  const number =
    numericValue(value);

  if (number === null) {
    return "N/A";
  }

  return `${number.toFixed(
    2,
  )}%`;
}

function CompanyLogo({
  domain,
  name,
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  const logoKey =
    import.meta.env
      .VITE_LOGO_KEY;

  const showImage =
    Boolean(
      domain &&
        logoKey &&
        !failed,
    );

  return (
    <span className="exa-screener-company-logo">
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
        String(
          name || "?",
        )
          .trim()
          .charAt(0)
          .toUpperCase()
      )}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  note,
}) {
  return (
    <article className="exa-screener-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value,
        )
      }
      placeholder={placeholder}
      className="exa-screener-input"
      inputMode="decimal"
    />
  );
}

export default function Screener() {
  const navigate =
    useNavigate();

  const [
    stocks,
    setStocks,
  ] = useState([]);

  const [
    apiData,
    setApiData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [
    filters,
    setFilters,
  ] = useState(
    DEFAULT_FILTERS,
  );

  const [
    activePreset,
    setActivePreset,
  ] = useState("all");

  const [
    sortValue,
    setSortValue,
  ] = useState(
    "marketCap-desc",
  );

  const loadScreener =
    useCallback(
      async ({
        refresh = false,
        signal,
      } = {}) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const parameters =
            new URLSearchParams({
              page:
                String(page),

              limit:
                String(
                  pageSize,
                ),

              sort:
                sortValue,
            });

          function addParameter(
            key,
            value,
          ) {
            if (
              value === null ||
              value === undefined ||
              value === "" ||
              value === "All"
            ) {
              return;
            }

            parameters.set(
              key,
              String(value),
            );
          }

          addParameter(
            "q",
            debouncedSearch,
          );

          addParameter(
            "sector",
            filters.sector,
          );

          addParameter(
            "trend",
            filters.trend,
          );

          addParameter(
            "minPrice",
            filters.minPrice,
          );

          addParameter(
            "maxPrice",
            filters.maxPrice,
          );

          addParameter(
            "minPe",
            filters.minPe,
          );

          addParameter(
            "maxPe",
            filters.maxPe,
          );

          addParameter(
            "minRevenueGrowth",
            filters.minRevenueGrowth,
          );

          addParameter(
            "minRoe",
            filters.minRoe,
          );

          addParameter(
            "minProfitMargin",
            filters.minProfitMargin,
          );

          addParameter(
            "maxDebtToEquity",
            filters.maxDebtToEquity,
          );

          addParameter(
            "minRsi",
            filters.minRsi,
          );

          addParameter(
            "maxRsi",
            filters.maxRsi,
          );

          addParameter(
            "maxDistanceFromHigh",
            filters.maxDistanceFromHigh,
          );

          if (refresh) {
            parameters.set(
              "refresh",
              "1",
            );
          }

          const response =
            await fetch(
              `/api/screener?${parameters.toString()}`,
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
              "The Screener API returned a non-JSON response. Restart Vercel development mode.",
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
                "Unable to load screener data.",
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

          if (
            Number.isFinite(
              Number(data?.page),
            ) &&
            Number(data.page) !==
              page
          ) {
            setPage(
              Number(data.page),
            );
          }
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
            "Screener loading error:",
            caughtError,
          );

          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to load the stock screener.",
          );

          setStocks([]);
        } finally {
          if (!signal?.aborted) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      [
        page,
        pageSize,
        debouncedSearch,
        filters,
        sortValue,
      ],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadScreener({
      signal:
        controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadScreener]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setPage(1);

        setDebouncedSearch(
          searchQuery.trim(),
        );
      }, 450);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [searchQuery]);

  const availableSectors =
    useMemo(() => {
      const sectors =
        Array.isArray(
          apiData?.sectors,
        )
          ? apiData.sectors
          : [];

      return [
        "All",
        ...sectors.filter(
          (sector) =>
            sector &&
            sector !==
              "Not available",
        ),
      ];
    }, [apiData]);

  function updateFilter(
    key,
    value,
  ) {
    setFilters(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );

    setActivePreset(
      "custom",
    );

    setPage(1);
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_FILTERS,
    });

    setSearchQuery("");
    setDebouncedSearch("");

    setActivePreset("all");

    setSortValue(
      "marketCap-desc",
    );

    setPage(1);
  }

  function applyPreset(
    presetId,
  ) {
    setSearchQuery("");
    setDebouncedSearch("");

    setActivePreset(
      presetId,
    );

    setPage(1);

    switch (presetId) {
      case "quality-growth":
        setFilters({
          ...DEFAULT_FILTERS,

          minRevenueGrowth:
            "10",

          minRoe: "15",

          minProfitMargin:
            "10",

          maxDebtToEquity:
            "100",
        });

        setSortValue(
          "revenueGrowthPercent-desc",
        );

        break;

      case "low-debt":
        setFilters({
          ...DEFAULT_FILTERS,

          maxDebtToEquity:
            "50",
        });

        setSortValue(
          "debtToEquity-asc",
        );

        break;

      case "high-roe":
        setFilters({
          ...DEFAULT_FILTERS,

          minRoe: "15",
        });

        setSortValue(
          "returnOnEquityPercent-desc",
        );

        break;

      case "positive-momentum":
        setFilters({
          ...DEFAULT_FILTERS,

          trend: "Bullish",

          minRsi: "50",

          maxRsi: "70",
        });

        setSortValue(
          "rsi-desc",
        );

        break;

      case "near-high":
        setFilters({
          ...DEFAULT_FILTERS,

          maxDistanceFromHigh:
            "10",
        });

        setSortValue(
          "distanceFrom52WeekHigh-asc",
        );

        break;

      case "value":
        setFilters({
          ...DEFAULT_FILTERS,

          minPe: "1",

          maxPe: "25",

          minRoe: "10",

          maxDebtToEquity:
            "100",
        });

        setSortValue(
          "peRatio-asc",
        );

        break;

      case "oversold":
        setFilters({
          ...DEFAULT_FILTERS,

          maxRsi: "35",
        });

        setSortValue(
          "rsi-asc",
        );

        break;

      default:
        setFilters({
          ...DEFAULT_FILTERS,
        });

        setSortValue(
          "marketCap-desc",
        );

        break;
    }
  }

  const visibleStocks =
    stocks;

  const matchingCount =
    Number(
      apiData?.matchingStocks ??
        stocks.length,
    );

  const bullishCount =
    stocks.filter(
      (stock) =>
        stock?.trend ===
        "Bullish",
    ).length;

  const positiveChangeCount =
    stocks.filter(
      (stock) =>
        Number(
          stock?.changePercent,
        ) > 0,
    ).length;

  const averageRsi =
    (() => {
      const values =
        stocks
          .map(
            (stock) =>
              numericValue(
                stock?.rsi,
              ),
          )
          .filter(
            (value) =>
              value !== null,
          );

      if (
        values.length === 0
      ) {
        return "N/A";
      }

      return (
        values.reduce(
          (sum, value) =>
            sum + value,
          0,
        ) / values.length
      ).toFixed(1);
    })();

  function openAnalysis(
    symbol,
  ) {
    if (!symbol) {
      return;
    }

    navigate(
      `/analyze?symbol=${encodeURIComponent(
        symbol,
      )}`,
    );
  }

  return (
    <AppShell>
      <style>
        {SCREENER_STYLES}
      </style>

      <main className="exa-screener-page">
        <div className="exa-screener-container">
          <section className="exa-screener-header">
            <div>
              <p className="exa-screener-eyebrow">
                EXA NEXUS
              </p>

              <h1>
                Stock Screener
              </h1>

              <p className="exa-screener-subtitle">
                Discover Indian equities using live market data,
                fundamental indicators and technical conditions.
                Screener results are educational research filters,
                not Buy or Sell recommendations.
              </p>
            </div>

            <button
              type="button"
              className="exa-screener-refresh"
              disabled={
                loading ||
                refreshing
              }
              onClick={() =>
                loadScreener({
                  refresh: true,
                })
              }
            >
              {refreshing ? (
                <LoaderCircle
                  size={15}
                  className="exa-screener-spinner"
                />
              ) : (
                <RefreshCw
                  size={15}
                />
              )}

              {refreshing
                ? "Reloading"
                : "Reload results"}
            </button>
          </section>

          <section className="exa-screener-summary-grid">
            <SummaryCard
              label="Universe"
              value={
                apiData?.totalStocks ??
                "—"
              }
              note="Complete snapshot universe"
            />

            <SummaryCard
              label="Matching stocks"
              value={matchingCount}
              note={`${stocks.length} shown on this page`}
            />

            <SummaryCard
              label="Bullish trends"
              value={
                apiData
                  ?.trendSummary
                  ?.Bullish ??
                bullishCount
              }
              note="Price > SMA20 > SMA50"
            />

            <SummaryCard
              label="Average RSI"
              value={averageRsi}
              note={`${positiveChangeCount} positive on this page`}
            />
          </section>

          <section className="exa-screener-layout">
            <aside className="exa-screener-sidebar">
              <div className="exa-screener-panel-heading">
                <div>
                  <SlidersHorizontal
                    size={16}
                    color="#60a5fa"
                  />

                  <h2>
                    Filters
                  </h2>
                </div>

                <button
                  type="button"
                  className="exa-screener-reset"
                  onClick={
                    resetFilters
                  }
                >
                  <RotateCcw
                    size={12}
                  />
                  Reset
                </button>
              </div>

              <div className="exa-screener-sidebar-fields">
                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Sector
                  </label>

                  <select
                    className="exa-screener-select"
                    value={
                      filters.sector
                    }
                    onChange={(event) =>
                      updateFilter(
                        "sector",
                        event.target
                          .value,
                      )
                    }
                  >
                    {availableSectors.map(
                      (sector) => (
                        <option
                          key={sector}
                          value={sector}
                        >
                          {sector ===
                          "All"
                            ? "All sectors"
                            : sector}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Technical trend
                  </label>

                  <select
                    className="exa-screener-select"
                    value={
                      filters.trend
                    }
                    onChange={(event) =>
                      updateFilter(
                        "trend",
                        event.target
                          .value,
                      )
                    }
                  >
                    {[
                      "All",
                      "Bullish",
                      "Positive",
                      "Sideways",
                      "Negative",
                      "Bearish",
                    ].map(
                      (trend) => (
                        <option
                          key={trend}
                          value={trend}
                        >
                          {trend ===
                          "All"
                            ? "All trends"
                            : trend}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Price range
                  </label>

                  <div className="exa-screener-range-row">
                    <NumberInput
                      value={
                        filters.minPrice
                      }
                      onChange={(
                        value,
                      ) =>
                        updateFilter(
                          "minPrice",
                          value,
                        )
                      }
                      placeholder="Min ₹"
                    />

                    <NumberInput
                      value={
                        filters.maxPrice
                      }
                      onChange={(
                        value,
                      ) =>
                        updateFilter(
                          "maxPrice",
                          value,
                        )
                      }
                      placeholder="Max ₹"
                    />
                  </div>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    P/E range
                  </label>

                  <div className="exa-screener-range-row">
                    <NumberInput
                      value={
                        filters.minPe
                      }
                      onChange={(
                        value,
                      ) =>
                        updateFilter(
                          "minPe",
                          value,
                        )
                      }
                      placeholder="Min"
                    />

                    <NumberInput
                      value={
                        filters.maxPe
                      }
                      onChange={(
                        value,
                      ) =>
                        updateFilter(
                          "maxPe",
                          value,
                        )
                      }
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Minimum revenue growth %
                  </label>

                  <NumberInput
                    value={
                      filters.minRevenueGrowth
                    }
                    onChange={(
                      value,
                    ) =>
                      updateFilter(
                        "minRevenueGrowth",
                        value,
                      )
                    }
                    placeholder="Example: 10"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Minimum ROE %
                  </label>

                  <NumberInput
                    value={
                      filters.minRoe
                    }
                    onChange={(
                      value,
                    ) =>
                      updateFilter(
                        "minRoe",
                        value,
                      )
                    }
                    placeholder="Example: 15"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Minimum profit margin %
                  </label>

                  <NumberInput
                    value={
                      filters.minProfitMargin
                    }
                    onChange={(
                      value,
                    ) =>
                      updateFilter(
                        "minProfitMargin",
                        value,
                      )
                    }
                    placeholder="Example: 10"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Maximum debt-to-equity
                  </label>

                  <NumberInput
                    value={
                      filters.maxDebtToEquity
                    }
                    onChange={(
                      value,
                    ) =>
                      updateFilter(
                        "maxDebtToEquity",
                        value,
                      )
                    }
                    placeholder="Example: 100"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    RSI range
                  </label>

                  <div className="exa-screener-range-row">
                    <NumberInput
                      value={
                        filters.minRsi
                      }
                      onChange={(
                        value,
                      ) =>
                        updateFilter(
                          "minRsi",
                          value,
                        )
                      }
                      placeholder="Min"
                    />

                    <NumberInput
                      value={
                        filters.maxRsi
                      }
                      onChange={(
                        value,
                      ) =>
                        updateFilter(
                          "maxRsi",
                          value,
                        )
                      }
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Maximum distance from 52W high %
                  </label>

                  <NumberInput
                    value={
                      filters.maxDistanceFromHigh
                    }
                    onChange={(
                      value,
                    ) =>
                      updateFilter(
                        "maxDistanceFromHigh",
                        value,
                      )
                    }
                    placeholder="Example: 10"
                  />
                </div>
              </div>
            </aside>

            <div className="exa-screener-main">
              <section className="exa-screener-presets">
                <div className="exa-screener-presets-title">
                  <Sparkles
                    size={15}
                    color="#60a5fa"
                  />

                  Quick screen presets
                </div>

                <div className="exa-screener-preset-list">
                  {PRESETS.map(
                    (preset) => (
                      <button
                        key={
                          preset.id
                        }
                        type="button"
                        className={
                          activePreset ===
                          preset.id
                            ? "exa-screener-preset-button active"
                            : "exa-screener-preset-button"
                        }
                        onClick={() =>
                          applyPreset(
                            preset.id,
                          )
                        }
                      >
                        <strong>
                          {
                            preset.label
                          }
                        </strong>

                        <small>
                          {
                            preset.description
                          }
                        </small>
                      </button>
                    ),
                  )}
                </div>
              </section>

              <section className="exa-screener-toolbar">
                <div className="exa-screener-search">
                  <Search
                    size={15}
                  />

                  <input
                    type="search"
                    value={
                      searchQuery
                    }
                    onChange={(event) =>
                      setSearchQuery(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search the complete universe by company or symbol"
                    aria-label="Search screener stocks"
                  />
                </div>

                <select
                  className="exa-screener-toolbar-select"
                  value={
                    sortValue
                  }
                  onChange={(event) => {
                    setSortValue(
                      event.target
                        .value,
                    );

                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  className="exa-screener-toolbar-select"
                  value={
                    pageSize
                  }
                  onChange={(event) => {
                    setPageSize(
                      Number(
                        event.target
                          .value,
                      ),
                    );

                    setPage(1);
                  }}
                >
                  <option value={5}>
                    5 stocks
                  </option>

                  <option value={10}>
                    10 stocks
                  </option>

                  <option value={15}>
                    15 stocks
                  </option>
                </select>

                <span className="exa-screener-result-count">
                  {matchingCount} matching
                </span>
              </section>

              <div className="exa-screener-notice">
                Search, filters, presets and sorting now apply to the
                complete screener universe. Results are filtered and
                sorted before pagination.
              </div>

              <section className="exa-screener-table-card">
                {loading ? (
                  <div className="exa-screener-state">
                    <LoaderCircle
                      size={28}
                      className="exa-screener-spinner"
                    />

                    <strong>
                      Loading screener data
                    </strong>

                    <p>
                      Loading the generated market snapshot and applying
                      full-universe filters.
                    </p>
                  </div>
                ) : error ? (
                  <div className="exa-screener-state">
                    <AlertCircle
                      size={27}
                      color="#fb7185"
                    />

                    <strong>
                      Screener unavailable
                    </strong>

                    <p>
                      {error}
                    </p>

                    <button
                      type="button"
                      className="exa-screener-refresh"
                      style={{
                        marginTop: 14,
                      }}
                      onClick={() =>
                        loadScreener({
                          refresh: true,
                        })
                      }
                    >
                      <RefreshCw
                        size={14}
                      />

                      Try again
                    </button>
                  </div>
                ) : visibleStocks.length ===
                  0 ? (
                  <div className="exa-screener-state">
                    <Filter
                      size={27}
                      color="#60a5fa"
                    />

                    <strong>
                      No matching stocks
                    </strong>

                    <p>
                      Change the current filters, select another
                      preset or move to another screener page.
                    </p>

                    <button
                      type="button"
                      className="exa-screener-refresh"
                      style={{
                        marginTop: 14,
                      }}
                      onClick={
                        resetFilters
                      }
                    >
                      <RotateCcw
                        size={14}
                      />

                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="exa-screener-table-scroll">
                    <table className="exa-screener-table">
                      <thead>
                        <tr>
                          <th>
                            Company
                          </th>

                          <th>
                            Price
                          </th>

                          <th>
                            Change
                          </th>

                          <th>
                            Market cap
                          </th>

                          <th>
                            P/E
                          </th>

                          <th>
                            Revenue growth
                          </th>

                          <th>
                            ROE
                          </th>

                          <th>
                            Debt/equity
                          </th>

                          <th>
                            RSI
                          </th>

                          <th>
                            Trend
                          </th>

                          <th>
                            52W high distance
                          </th>

                          <th>
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleStocks.map(
                          (stock) => {
                            const change =
                              Number(
                                stock?.changePercent,
                              ) || 0;

                            const trendClass =
                              String(
                                stock?.trend ||
                                  "unavailable",
                              )
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-",
                                );

                            return (
                              <tr
                                key={
                                  stock.symbol
                                }
                              >
                                <td>
                                  <div className="exa-screener-company">
                                    <CompanyLogo
                                      domain={
                                        stock.logoDomain
                                      }
                                      name={
                                        stock.name
                                      }
                                    />

                                    <div className="exa-screener-company-copy">
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
                                  </div>
                                </td>

                                <td>
                                  {formatPrice(
                                    stock.price,
                                    stock.currency,
                                  )}
                                </td>

                                <td
                                  className={
                                    change > 0
                                      ? "exa-screener-positive"
                                      : change <
                                          0
                                        ? "exa-screener-negative"
                                        : "exa-screener-neutral"
                                  }
                                >
                                  {change >
                                  0
                                    ? "+"
                                    : ""}
                                  {formatPercent(
                                    change,
                                  )}
                                </td>

                                <td>
                                  {formatMarketCap(
                                    stock.marketCap,
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    stock.peRatio,
                                    2,
                                  )}
                                </td>

                                <td
                                  className={
                                    Number(
                                      stock
                                        .revenueGrowthPercent,
                                    ) > 0
                                      ? "exa-screener-positive"
                                      : Number(
                                            stock
                                              .revenueGrowthPercent,
                                          ) <
                                          0
                                        ? "exa-screener-negative"
                                        : ""
                                  }
                                >
                                  {formatPercent(
                                    stock
                                      .revenueGrowthPercent,
                                  )}
                                </td>

                                <td>
                                  {formatPercent(
                                    stock
                                      .returnOnEquityPercent,
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    stock.debtToEquity,
                                    2,
                                  )}
                                </td>

                                <td>
                                  <strong
                                    className={
                                      Number(
                                        stock.rsi,
                                      ) >=
                                      70
                                        ? "exa-screener-negative"
                                        : Number(
                                              stock.rsi,
                                            ) <=
                                            30
                                          ? "exa-screener-positive"
                                          : ""
                                    }
                                  >
                                    {formatNumber(
                                      stock.rsi,
                                      1,
                                    )}
                                  </strong>

                                  <div
                                    style={{
                                      marginTop:
                                        3,
                                      color:
                                        "#64748b",
                                      fontSize:
                                        8,
                                    }}
                                  >
                                    {
                                      stock.rsiStatus
                                    }
                                  </div>
                                </td>

                                <td>
                                  <span
                                    className={`exa-screener-trend ${trendClass}`}
                                  >
                                    {[
                                      "Bullish",
                                      "Positive",
                                    ].includes(
                                      stock.trend,
                                    ) ? (
                                      <TrendingUp
                                        size={11}
                                      />
                                    ) : [
                                        "Bearish",
                                        "Negative",
                                      ].includes(
                                        stock.trend,
                                      ) ? (
                                      <TrendingDown
                                        size={11}
                                      />
                                    ) : (
                                      <BarChart3
                                        size={11}
                                      />
                                    )}

                                    {
                                      stock.trend
                                    }
                                  </span>
                                </td>

                                <td>
                                  {formatPercent(
                                    stock
                                      .distanceFrom52WeekHigh,
                                  )}
                                </td>

                                <td>
                                  <div className="exa-screener-row-actions">
                                    <button
                                      type="button"
                                      className="exa-screener-action"
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
                                        className="exa-screener-link"
                                        href={
                                          stock.nseUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open NSE"
                                        aria-label="Open NSE"
                                      >
                                        <ExternalLink
                                          size={11}
                                        />
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="exa-screener-pagination">
                  <span className="exa-screener-pagination-info">
                    Page{" "}
                    {apiData?.page ||
                      page}{" "}
                    of{" "}
                    {apiData?.totalPages ||
                      1}
                    {" · "}
                    {matchingCount} matching stocks
                    {" · "}
                    Snapshot data
                  </span>

                  <div className="exa-screener-pagination-actions">
                    <button
                      type="button"
                      className="exa-screener-page-button"
                      disabled={
                        loading ||
                        page <= 1
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.max(
                              current -
                                1,
                              1,
                            ),
                        )
                      }
                    >
                      <ArrowLeft
                        size={12}
                      />
                      Previous
                    </button>

                    <button
                      type="button"
                      className="exa-screener-page-button"
                      disabled={
                        loading ||
                        page >=
                          (
                            apiData?.totalPages ||
                            1
                          )
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current +
                            1,
                        )
                      }
                    >
                      Next
                      <ArrowRight
                        size={12}
                      />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}