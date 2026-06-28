import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleDollarSign,
  Edit3,
  ExternalLink,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import SnapshotFreshnessBanner from
  "../components/data/SnapshotFreshnessBanner";

import {
  normalizePortfolioHolding,
  PORTFOLIO_UPDATED_EVENT,
  readPortfolioHoldings,
  writePortfolioHoldings,
} from "../utils/portfolioStorage";

import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";

const MAX_PORTFOLIO_HOLDINGS = 100;
const SYMBOL_BATCH_SIZE = 5;

const SORT_OPTIONS = [
  {
    value: "currentValue-desc",
    label: "Current value: High to low",
  },
  {
    value: "profitLoss-desc",
    label: "Profit/Loss: High to low",
  },
  {
    value: "returnPercent-desc",
    label: "Return: High to low",
  },
  {
    value: "dayChangeValue-desc",
    label: "Day change: High to low",
  },
  {
    value: "name-asc",
    label: "Company: A to Z",
  },
];

const EMPTY_FORM = {
  query: "",
  selectedStock: null,
  quantity: "",
  averagePrice: "",
  notes: "",
};

const PORTFOLIO_STYLES = `
  .exa-portfolio-page {
    min-height: 100vh;
    padding: 28px;
    color: #e2e8f0;
  }

  .exa-portfolio-container {
    width: 100%;
    max-width: 1540px;
    margin: 0 auto;
  }

  .exa-portfolio-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
  }

  .exa-portfolio-eyebrow {
    margin: 0 0 7px;
    color: #60a5fa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .exa-portfolio-header h1 {
    margin: 0;
    color: #f8fafc;
    font-size: clamp(28px, 4vw, 40px);
    line-height: 1.1;
  }

  .exa-portfolio-subtitle {
    max-width: 760px;
    margin: 10px 0 0;
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.7;
  }

  .exa-portfolio-header-actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
  }

  .exa-portfolio-button {
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

  .exa-portfolio-button.primary {
    border-color: rgba(96, 165, 250, 0.36);
    color: #eff6ff;
    background:
      linear-gradient(
        135deg,
        #2563eb,
        #4f46e5
      );
  }

  .exa-portfolio-button.danger {
    border-color: rgba(244, 63, 94, 0.24);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.08);
  }

  .exa-portfolio-button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .exa-portfolio-spinner {
    animation: exaPortfolioSpin 0.9s linear infinite;
  }

  @keyframes exaPortfolioSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .exa-portfolio-summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0;
  }

  .exa-portfolio-summary-card {
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

  .exa-portfolio-summary-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .exa-portfolio-summary-icon {
    width: 31px;
    height: 31px;
    border: 1px solid #29405f;
    border-radius: 9px;
    color: #93c5fd;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .exa-portfolio-summary-card span {
    color: #64748b;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .exa-portfolio-summary-card strong {
    display: block;
    margin-top: 12px;
    color: #f8fafc;
    font-size: 20px;
  }

  .exa-portfolio-summary-card small {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 9px;
    line-height: 1.45;
  }

  .exa-portfolio-positive {
    color: #4ade80 !important;
  }

  .exa-portfolio-negative {
    color: #fb7185 !important;
  }

  .exa-portfolio-toolbar {
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

  .exa-portfolio-toolbar-search {
    position: relative;
    flex: 1 1 260px;
  }

  .exa-portfolio-toolbar-search svg {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .exa-portfolio-toolbar-search input,
  .exa-portfolio-toolbar select {
    width: 100%;
    min-height: 40px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #e2e8f0;
    background: #101e34;
    font-size: 10px;
  }

  .exa-portfolio-toolbar-search input {
    padding: 9px 12px 9px 37px;
  }

  .exa-portfolio-toolbar select {
    width: auto;
    min-width: 210px;
    padding: 8px 12px;
  }

  .exa-portfolio-toolbar input:focus,
  .exa-portfolio-toolbar select:focus {
    border-color: rgba(96, 165, 250, 0.65);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-portfolio-count {
    color: #64748b;
    font-size: 10px;
    white-space: nowrap;
  }

  .exa-portfolio-notice {
    padding: 10px 13px;
    margin-top: 12px;
    border: 1px solid rgba(96, 165, 250, 0.18);
    border-radius: 11px;
    color: #cbd5e1;
    background: rgba(30, 64, 175, 0.07);
    font-size: 10px;
    line-height: 1.6;
  }

  .exa-portfolio-table-card {
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-portfolio-table-scroll {
    overflow-x: auto;
  }

  .exa-portfolio-table {
    width: 100%;
    min-width: 1220px;
    border-collapse: collapse;
  }

  .exa-portfolio-table th {
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

  .exa-portfolio-table td {
    padding: 13px 12px;
    border-bottom: 1px solid #152844;
    color: #cbd5e1;
    font-size: 10px;
    vertical-align: middle;
    white-space: nowrap;
  }

  .exa-portfolio-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .exa-portfolio-table tbody tr:hover {
    background: rgba(30, 64, 175, 0.06);
  }

  .exa-portfolio-company {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-portfolio-logo {
    width: 38px;
    height: 38px;
    overflow: hidden;
    border: 1px solid #29405f;
    border-radius: 50%;
    color: #93c5fd;
    background: #17263d;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 800;
  }

  .exa-portfolio-logo img {
    width: 72%;
    height: 72%;
    object-fit: contain;
  }

  .exa-portfolio-company-copy {
    min-width: 0;
    max-width: 200px;
  }

  .exa-portfolio-company-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 11px;
    text-overflow: ellipsis;
  }

  .exa-portfolio-company-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 9px;
  }

  .exa-portfolio-row-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .exa-portfolio-icon-button {
    width: 31px;
    height: 31px;
    border: 1px solid #29405f;
    border-radius: 8px;
    color: #94a3b8;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .exa-portfolio-icon-button.danger {
    border-color: rgba(244, 63, 94, 0.18);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.06);
  }

  .exa-portfolio-analyze {
    min-height: 31px;
    padding: 6px 9px;
    border: 1px solid rgba(96, 165, 250, 0.28);
    border-radius: 8px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.11);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-portfolio-state {
    padding: 62px 20px;
    color: #94a3b8;
    text-align: center;
  }

  .exa-portfolio-state strong {
    display: block;
    margin-top: 12px;
    color: #f8fafc;
    font-size: 15px;
  }

  .exa-portfolio-state p {
    max-width: 500px;
    margin: 8px auto 0;
    font-size: 10px;
    line-height: 1.7;
  }

  .exa-portfolio-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    padding: 18px;
    background: rgba(2, 6, 23, 0.78);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .exa-portfolio-modal {
    width: min(560px, 100%);
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    border: 1px solid #29405f;
    border-radius: 18px;
    background: #081426;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  }

  .exa-portfolio-modal-header {
    padding: 17px;
    border-bottom: 1px solid #1e3350;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .exa-portfolio-modal-header h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 17px;
  }

  .exa-portfolio-modal-header p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 9px;
    line-height: 1.5;
  }

  .exa-portfolio-modal-close {
    width: 31px;
    height: 31px;
    border: 1px solid #29405f;
    border-radius: 8px;
    color: #94a3b8;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .exa-portfolio-modal-body {
    padding: 17px;
  }

  .exa-portfolio-field {
    margin-top: 13px;
  }

  .exa-portfolio-field:first-child {
    margin-top: 0;
  }

  .exa-portfolio-field label {
    display: block;
    margin-bottom: 7px;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 800;
  }

  .exa-portfolio-field input,
  .exa-portfolio-field textarea {
    width: 100%;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #e2e8f0;
    background: #101e34;
    font-size: 11px;
  }

  .exa-portfolio-field input {
    min-height: 41px;
    padding: 9px 11px;
  }

  .exa-portfolio-field textarea {
    min-height: 82px;
    padding: 10px 11px;
    resize: vertical;
  }

  .exa-portfolio-field input:focus,
  .exa-portfolio-field textarea:focus {
    border-color: rgba(96, 165, 250, 0.65);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-portfolio-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
  }

  .exa-portfolio-stock-search {
    position: relative;
  }

  .exa-portfolio-search-results {
    margin-top: 8px;
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #1e3350;
    border-radius: 11px;
    background: #0a1628;
  }

  .exa-portfolio-search-state {
    padding: 14px 12px;
    color: #94a3b8;
    font-size: 10px;
    line-height: 1.6;
    text-align: center;
  }

  .exa-portfolio-search-state.error {
    color: #fda4af;
  }

  .exa-portfolio-search-result {
    width: 100%;
    padding: 10px;
    border: 0;
    border-bottom: 1px solid #172a45;
    color: #cbd5e1;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }

  .exa-portfolio-search-result:last-child {
    border-bottom: 0;
  }

  .exa-portfolio-search-result:hover {
    background: rgba(37, 99, 235, 0.09);
  }

  .exa-portfolio-search-result-copy {
    min-width: 0;
    flex: 1;
  }

  .exa-portfolio-search-result-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-portfolio-search-result-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-portfolio-selected-stock {
    padding: 11px;
    margin-top: 8px;
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 11px;
    background: rgba(34, 197, 94, 0.06);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-portfolio-selected-stock-copy {
    min-width: 0;
    flex: 1;
  }

  .exa-portfolio-selected-stock-copy strong {
    display: block;
    color: #f8fafc;
    font-size: 10px;
  }

  .exa-portfolio-selected-stock-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-portfolio-form-message {
    padding: 9px 10px;
    margin-top: 12px;
    border-radius: 9px;
    font-size: 9px;
    line-height: 1.5;
  }

  .exa-portfolio-form-message.error {
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.07);
  }

  .exa-portfolio-form-message.success {
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: #86efac;
    background: rgba(34, 197, 94, 0.07);
  }

  .exa-portfolio-modal-actions {
    padding: 14px 17px 17px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  @media (max-width: 1180px) {
    .exa-portfolio-summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .exa-portfolio-page {
      padding: 18px 12px 28px;
    }

    .exa-portfolio-header {
      flex-direction: column;
    }

    .exa-portfolio-header-actions {
      width: 100%;
    }

    .exa-portfolio-header-actions .exa-portfolio-button {
      flex: 1;
    }

    .exa-portfolio-summary-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .exa-portfolio-toolbar {
      align-items: stretch;
    }

    .exa-portfolio-toolbar select {
      width: 100%;
    }

    .exa-portfolio-form-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  @media (max-width: 460px) {
    .exa-portfolio-summary-grid {
      grid-template-columns: 1fr;
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

function formatCurrency(
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
      style: "currency",
      currency: "INR",
      maximumFractionDigits:
        digits,
    },
  ).format(number);
}

function formatPercent(value) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  const sign =
    number > 0 ? "+" : "";

  return `${sign}${number.toFixed(
    2,
  )}%`;
}

function splitIntoChunks(
  items,
  chunkSize,
) {
  const chunks = [];

  for (
    let index = 0;
    index < items.length;
    index += chunkSize
  ) {
    chunks.push(
      items.slice(
        index,
        index + chunkSize,
      ),
    );
  }

  return chunks;
}

function getApiErrorMessage(
  value,
  fallback,
) {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const nested =
      value.message ||
      value.error ||
      value.details;

    if (
      typeof nested === "string" &&
      nested.trim()
    ) {
      return nested.trim();
    }
  }

  return fallback;
}

async function fetchJson(
  url,
  signal,
) {
  const response = await fetch(
    url,
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
      "The market-data API returned a non-JSON response.",
    );
  }

  const data = await response.json();

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      getApiErrorMessage(
        data?.error,
        "Unable to load portfolio market data.",
      ),
    );
  }

  return data;
}

async function searchPortfolioCompanies(
  query,
  signal,
) {
  const response = await fetch(
    `/api/stock-search?q=${encodeURIComponent(
      query,
    )}`,
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
      "The stock-search API returned a non-JSON response.",
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data?.error,
        "Unable to search companies.",
      ),
    );
  }

  const rawResults =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.stocks)
        ? data.stocks
        : Array.isArray(data?.results)
          ? data.results
          : [];

  const seen = new Set();

  return rawResults
    .filter((stock) => {
      const symbol = cleanText(
        stock?.symbol,
      ).toUpperCase();

      const quoteType = cleanText(
        stock?.quoteType ||
          stock?.type,
      ).toUpperCase();

      const isIndianEquity =
        symbol.endsWith(".NS") ||
        symbol.endsWith(".BO");

      const isEquity =
        !quoteType ||
        quoteType.includes(
          "EQUITY",
        );

      if (
        !symbol ||
        !isIndianEquity ||
        !isEquity ||
        seen.has(symbol)
      ) {
        return false;
      }

      seen.add(symbol);
      return true;
    })
    .sort((first, second) => {
      const firstSymbol =
        cleanText(
          first?.symbol,
        ).toUpperCase();

      const secondSymbol =
        cleanText(
          second?.symbol,
        ).toUpperCase();

      const firstRank =
        firstSymbol.endsWith(
          ".NS",
        )
          ? 0
          : 1;

      const secondRank =
        secondSymbol.endsWith(
          ".NS",
        )
          ? 0
          : 1;

      return firstRank - secondRank;
    })
    .slice(0, 10)
    .map((stock) => ({
      symbol:
        cleanText(
          stock?.symbol,
        ).toUpperCase(),

      name:
        cleanText(
          stock?.name ||
            stock?.longname ||
            stock?.shortname,
        ) ||
        cleanText(
          stock?.symbol,
        ),

      sector:
        cleanText(
          stock?.sector,
        ) ||
        "Sector loads after selection",

      logoDomain:
        cleanText(
          stock?.logoDomain,
        ),

      exchange:
        cleanText(
          stock?.exchange,
        ),
    }));
}

async function fetchSingleSymbol(
  symbol,
  signal,
) {
  const baseSymbol = cleanText(
    symbol,
  )
    .toUpperCase()
    .replace(
      /\.(NS|BO)$/i,
      "",
    );

  const parameters =
    new URLSearchParams({
      q: baseSymbol,
      page: "1",
      limit: "50",
      sort: "marketCap-desc",
    });

  const data = await fetchJson(
    `/api/screener?${parameters.toString()}`,
    signal,
  );

  const normalizedTarget =
    cleanText(symbol).toUpperCase();

  const exactStock = (
    Array.isArray(data?.stocks)
      ? data.stocks
      : []
  ).find((stock) => {
    const candidates = [
      stock?.symbol,
      stock?.yahooSymbol,
      stock?.nseSymbol,
      stock?.nseSymbol
        ? `${stock.nseSymbol}.NS`
        : "",
      stock?.bseCode
        ? `${stock.bseCode}.BO`
        : "",
    ]
      .map((value) =>
        cleanText(value).toUpperCase(),
      )
      .filter(Boolean);

    return candidates.includes(
      normalizedTarget,
    );
  });

  return {
    stock: exactStock || null,
    generatedAt:
      data?.generatedAt || null,
    source:
      data?.source ||
      "Screener snapshot",
  };
}

function getDomainFromWebsite(
  website,
) {
  const value = cleanText(website);

  if (!value) {
    return "";
  }

  try {
    return new URL(
      value.startsWith("http")
        ? value
        : `https://${value}`,
    ).hostname.replace(
      /^www\./i,
      "",
    );
  } catch {
    return "";
  }
}

async function fetchLivePortfolioStock(
  symbol,
  signal,
) {
  const normalizedSymbol =
    cleanText(symbol).toUpperCase();

  const parameters =
    new URLSearchParams({
      symbol: normalizedSymbol,
      range: "1d",
    });

  const response = await fetch(
    `/api/stock-data?${parameters.toString()}`,
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
      `Live market data for ${normalizedSymbol} returned a non-JSON response.`,
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data?.error,
        `Live market data is unavailable for ${normalizedSymbol}.`,
      ),
    );
  }

  if (!data?.symbol) {
    return {
      stock: null,
      generatedAt: null,
      source:
        data?.source ||
        "Yahoo Finance",
    };
  }

  const resolvedSymbol =
    cleanText(data.symbol)
      .toUpperCase() ||
    normalizedSymbol;

  const baseNseSymbol =
    resolvedSymbol.endsWith(".NS")
      ? resolvedSymbol.replace(
          /\.NS$/i,
          "",
        )
      : "";

  return {
    stock: {
      symbol: resolvedSymbol,
      yahooSymbol: resolvedSymbol,
      name:
        cleanText(
          data.name ||
            data.company,
        ) || resolvedSymbol,
      exchange:
        cleanText(data.exchange),
      currency:
        cleanText(data.currency) ||
        "INR",
      marketState:
        cleanText(data.marketState),
      price: data.price ?? null,
      previousClose:
        data.previousClose ?? null,
      change: data.change ?? null,
      changePercent:
        data.changePercent ?? null,
      marketCap:
        data.marketCap ?? null,
      peRatio:
        data.peRatio ??
        data.peRatioTTM ??
        null,
      forwardPE:
        data.forwardPE ?? null,
      week52Low:
        data.week52Low ??
        data.fiftyTwoWeekLow ??
        null,
      week52High:
        data.week52High ??
        data.fiftyTwoWeekHigh ??
        null,
      volume: data.volume ?? null,
      averageVolume:
        data.averageVolume ?? null,
      sector:
        cleanText(data.sector) ||
        "Sector unavailable",
      industry:
        cleanText(data.industry),
      website:
        cleanText(data.website),
      logoDomain:
        getDomainFromWebsite(
          data.website,
        ),
      nseSymbol: baseNseSymbol,
      nseUrl:
        baseNseSymbol
          ? `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(
              baseNseSymbol,
            )}`
          : "",
      source:
        data.source ||
        "Yahoo Finance",
      lastUpdated:
        data.lastUpdated ||
        new Date().toISOString(),
    },
    generatedAt:
      data.lastUpdated ||
      new Date().toISOString(),
    source:
      data.source ||
      "Yahoo Finance live fallback",
  };
}

async function fetchPortfolioStock(
  symbol,
  signal,
) {
  const snapshotResult =
    await fetchSingleSymbol(
      symbol,
      signal,
    );

  if (snapshotResult.stock) {
    return {
      ...snapshotResult,
      usedLiveFallback: false,
    };
  }

  const liveResult =
    await fetchLivePortfolioStock(
      symbol,
      signal,
    );

  return {
    ...liveResult,
    usedLiveFallback:
      Boolean(liveResult.stock),
  };
}

async function fetchPortfolioStocks(
  symbols,
  signal,
) {
  const uniqueSymbols = [
    ...new Set(
      symbols
        .map((symbol) =>
          cleanText(symbol)
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ];

  const chunks = splitIntoChunks(
    uniqueSymbols,
    SYMBOL_BATCH_SIZE,
  );

  const stocks = [];
  const missingSymbols = [];
  let generatedAt = null;
  let usedLiveFallback = false;

  for (const chunk of chunks) {
    const results =
      await Promise.allSettled(
        chunk.map((symbol) =>
          fetchPortfolioStock(
            symbol,
            signal,
          ),
        ),
      );

    results.forEach(
      (result, index) => {
        const symbol = chunk[index];

        if (
          result.status ===
          "rejected"
        ) {
          if (
            result.reason?.name ===
            "AbortError"
          ) {
            throw result.reason;
          }

          console.warn(
            `Portfolio data unavailable for ${symbol}:`,
            result.reason,
          );

          missingSymbols.push(symbol);
          return;
        }

        if (result.value?.stock) {
          stocks.push(
            result.value.stock,
          );
          generatedAt =
            generatedAt ||
            result.value.generatedAt ||
            null;
          usedLiveFallback =
            usedLiveFallback ||
            Boolean(
              result.value
                .usedLiveFallback,
            );
          return;
        }

        missingSymbols.push(symbol);
      },
    );
  }

  return {
    stocks,
    generatedAt,
    source: usedLiveFallback
      ? "Screener snapshot + Yahoo Finance live fallback"
      : "Screener snapshot",
    missingSymbols,
  };
}

function compareRows(
  first,
  second,
  sortValue,
) {
  const separatorIndex =
    sortValue.lastIndexOf("-");

  const key =
    sortValue.slice(
      0,
      separatorIndex,
    );

  const direction =
    sortValue.slice(
      separatorIndex + 1,
    );

  const firstValue =
    first?.[key];

  const secondValue =
    second?.[key];

  if (
    typeof firstValue === "string" ||
    typeof secondValue === "string"
  ) {
    const result =
      String(firstValue || "")
        .localeCompare(
          String(secondValue || ""),
          "en-IN",
          {
            sensitivity: "base",
          },
        );

    return direction === "asc"
      ? result
      : -result;
  }

  const firstNumber =
    numericValue(firstValue);

  const secondNumber =
    numericValue(secondValue);

  if (
    firstNumber === null &&
    secondNumber === null
  ) {
    return 0;
  }

  if (firstNumber === null) {
    return 1;
  }

  if (secondNumber === null) {
    return -1;
  }

  return direction === "asc"
    ? firstNumber - secondNumber
    : secondNumber - firstNumber;
}

function CompanyLogo({
  domain,
  name,
  className = "exa-portfolio-logo",
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  const logoKey =
    import.meta.env
      .VITE_LOGO_KEY;

  const showImage = Boolean(
    domain &&
      logoKey &&
      !failed,
  );

  return (
    <span className={className}>
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "",
}) {
  return (
    <article className="exa-portfolio-summary-card">
      <div className="exa-portfolio-summary-top">
        <span>{label}</span>

        <span className="exa-portfolio-summary-icon">
          <Icon size={15} />
        </span>
      </div>

      <strong className={tone}>
        {value}
      </strong>

      <small>{note}</small>
    </article>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();

  const [
    holdings,
    setHoldings,
  ] = useState(() =>
    readPortfolioHoldings(),
  );

  const [
    marketStocks,
    setMarketStocks,
  ] = useState([]);

  const [
    marketMetadata,
    setMarketMetadata,
  ] = useState({
    generatedAt: null,
    source: "Yahoo Finance",
  });

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
    unavailableSymbols,
    setUnavailableSymbols,
  ] = useState([]);

  const [
    holdingSearch,
    setHoldingSearch,
  ] = useState("");

  const [
    sortValue,
    setSortValue,
  ] = useState(
    "currentValue-desc",
  );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingHolding,
    setEditingHolding,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(EMPTY_FORM);

  const [
    formMessage,
    setFormMessage,
  ] = useState({
    type: "",
    text: "",
  });

  const [
    stockSearchResults,
    setStockSearchResults,
  ] = useState([]);

  const [
    stockSearchLoading,
    setStockSearchLoading,
  ] = useState(false);

  const [
    stockSearchError,
    setStockSearchError,
  ] = useState("");

  const stockSearchRequestRef =
    useRef(0);

  const holdingSymbols =
    useMemo(
      () =>
        holdings.map(
          (holding) =>
            holding.symbol,
        ),
      [holdings],
    );

  const loadPortfolioData =
    useCallback(
      async ({
        refresh = false,
        signal,
      } = {}) => {
        if (
          holdingSymbols.length === 0
        ) {
          setMarketStocks([]);
          setUnavailableSymbols([]);
          setLoading(false);
          setRefreshing(false);
          setError("");
          return;
        }

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const data =
            await fetchPortfolioStocks(
              holdingSymbols,
              signal,
            );

          setMarketStocks(
            data.stocks,
          );

          setUnavailableSymbols(
            Array.isArray(
              data?.missingSymbols,
            )
              ? data.missingSymbols
              : [],
          );

          setMarketMetadata({
            generatedAt:
              data.generatedAt,
            source:
              data.source,
          });
        } catch (caughtError) {
          if (
            caughtError?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Portfolio market-data error:",
            caughtError,
          );

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load portfolio market data.",
          );

          setMarketStocks([]);
          setUnavailableSymbols(
            holdingSymbols,
          );
        } finally {
          if (!signal?.aborted) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      [holdingSymbols],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadPortfolioData({
      signal:
        controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadPortfolioData]);

  useEffect(() => {
    function handlePortfolioUpdate(
      event,
    ) {
      if (
        Array.isArray(
          event?.detail,
        )
      ) {
        setHoldings(
          event.detail,
        );
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
        "exa-portfolio-holdings-v1"
      ) {
        setHoldings(
          readPortfolioHoldings(),
        );
      }
    }

    window.addEventListener(
      PORTFOLIO_UPDATED_EVENT,
      handlePortfolioUpdate,
    );

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        PORTFOLIO_UPDATED_EVENT,
        handlePortfolioUpdate,
      );

      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  useEffect(() => {
    if (
      !modalOpen ||
      editingHolding ||
      form.selectedStock
    ) {
      setStockSearchResults([]);
      setStockSearchLoading(false);
      setStockSearchError("");
      return;
    }

    const query =
      cleanText(form.query);

    if (query.length < 2) {
      setStockSearchResults([]);
      setStockSearchLoading(false);
      setStockSearchError("");
      return;
    }

    const requestId =
      stockSearchRequestRef.current +
      1;

    stockSearchRequestRef.current =
      requestId;

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        async () => {
          setStockSearchLoading(true);
          setStockSearchError("");

          try {
            const results =
              await searchPortfolioCompanies(
                query,
                controller.signal,
              );

            if (
              stockSearchRequestRef.current !==
              requestId
            ) {
              return;
            }

            setStockSearchResults(
              results,
            );
          } catch (caughtError) {
            if (
              caughtError?.name ===
              "AbortError"
            ) {
              return;
            }

            if (
              stockSearchRequestRef.current !==
              requestId
            ) {
              return;
            }

            setStockSearchError(
              caughtError instanceof Error
                ? caughtError.message
                : "Unable to search companies.",
            );

            setStockSearchResults([]);
          } finally {
            if (
              stockSearchRequestRef.current ===
              requestId
            ) {
              setStockSearchLoading(false);
            }
          }
        },
        400,
      );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    modalOpen,
    editingHolding,
    form.query,
    form.selectedStock,
  ]);

  const marketStockMap =
    useMemo(
      () =>
        new Map(
          marketStocks.map(
            (stock) => [
              cleanText(
                stock?.symbol,
              ).toUpperCase(),
              stock,
            ],
          ),
        ),
      [marketStocks],
    );

  const rows =
    useMemo(
      () =>
        holdings.map(
          (holding) => {
            const quote =
              marketStockMap.get(
                holding.symbol,
              ) || null;

            const price =
              numericValue(
                quote?.price,
              );

            const investedValue =
              holding.quantity *
              holding.averagePrice;

            const currentValue =
              price === null
                ? null
                : holding.quantity *
                  price;

            const profitLoss =
              currentValue === null
                ? null
                : currentValue -
                  investedValue;

            const returnPercent =
              profitLoss === null ||
              investedValue <= 0
                ? null
                : (
                    profitLoss /
                    investedValue
                  ) * 100;

            const dayChangeValue =
              numericValue(
                quote?.change,
              ) === null
                ? null
                : holding.quantity *
                  Number(
                    quote.change,
                  );

            return {
              ...holding,

              name:
                cleanText(
                  quote?.name,
                ) || holding.name,

              sector:
                cleanText(
                  quote?.sector,
                ) || holding.sector,

              logoDomain:
                cleanText(
                  quote?.logoDomain,
                ) ||
                holding.logoDomain,

              quote,
              price,
              investedValue,
              currentValue,
              profitLoss,
              returnPercent,
              dayChangeValue,
              changePercent:
                numericValue(
                  quote?.changePercent,
                ),
            };
          },
        ),
      [
        holdings,
        marketStockMap,
      ],
    );

    const isMarketOpen =
  rows.some(
    (row) =>
      String(
        row.quote?.marketState || "",
      ).toUpperCase() ===
      "REGULAR",
  );

const dayMovementLabel =
  isMarketOpen
    ? "Today"
    : "Last session";

const dayMovementNote =
  isMarketOpen
    ? "Estimated live change across holdings"
    : "Change from the latest completed trading session";

  const filteredRows =
    useMemo(() => {
      const query =
        cleanText(
          holdingSearch,
        ).toLowerCase();

      const filtered =
        query
          ? rows.filter((row) =>
              [
                row.name,
                row.symbol,
                row.sector,
              ]
                .join(" ")
                .toLowerCase()
                .includes(query),
            )
          : rows;

      return [...filtered].sort(
        (first, second) =>
          compareRows(
            first,
            second,
            sortValue,
          ),
      );
    }, [
      rows,
      holdingSearch,
      sortValue,
    ]);

  const totals =
    useMemo(() => {
      const investedValue =
        rows.reduce(
          (sum, row) =>
            sum +
            row.investedValue,
          0,
        );

      const currentRows =
        rows.filter(
          (row) =>
            row.currentValue !==
            null,
        );

      const currentValue =
        currentRows.reduce(
          (sum, row) =>
            sum +
            row.currentValue,
          0,
        );

      const profitLoss =
        currentRows.length === 0
          ? null
          : currentValue -
            currentRows.reduce(
              (sum, row) =>
                sum +
                row.investedValue,
              0,
            );

      const returnPercent =
        profitLoss === null ||
        investedValue <= 0
          ? null
          : (
              profitLoss /
              investedValue
            ) * 100;

      const dayChangeRows =
        rows.filter(
          (row) =>
            row.dayChangeValue !==
            null,
        );

      const dayChangeValue =
        dayChangeRows.length === 0
          ? null
          : dayChangeRows.reduce(
              (sum, row) =>
                sum +
                row.dayChangeValue,
              0,
            );

      return {
        investedValue,
        currentValue:
          currentRows.length === 0
            ? null
            : currentValue,
        profitLoss,
        returnPercent,
        dayChangeValue,
      };
    }, [rows]);

  function persistHoldings(
    nextHoldings,
  ) {
    const success =
      writePortfolioHoldings(
        nextHoldings,
      );

    if (!success) {
      setFormMessage({
        type: "error",
        text:
          "Portfolio could not be saved in this browser.",
      });

      return false;
    }

    setHoldings(nextHoldings);
    return true;
  }

  function openAddModal() {
    setEditingHolding(null);
    setForm({
      ...EMPTY_FORM,
    });
    setFormMessage({
      type: "",
      text: "",
    });
    setStockSearchResults([]);
    setModalOpen(true);
  }

  function openEditModal(holding) {
    setEditingHolding(holding);

    setForm({
      query: holding.name,
      selectedStock: {
        symbol:
          holding.symbol,
        name:
          holding.name,
        sector:
          holding.sector,
        logoDomain:
          holding.logoDomain,
      },
      quantity:
        String(
          holding.quantity,
        ),
      averagePrice:
        String(
          holding.averagePrice,
        ),
      notes:
        holding.notes || "",
    });

    setFormMessage({
      type: "",
      text: "",
    });

    setStockSearchResults([]);
    setModalOpen(true);
  }

  function closeModal() {
    stockSearchRequestRef.current +=
      1;

    setModalOpen(false);
    setEditingHolding(null);
    setForm({
      ...EMPTY_FORM,
    });
    setFormMessage({
      type: "",
      text: "",
    });
    setStockSearchResults([]);
    setStockSearchLoading(false);
    setStockSearchError("");
  }

  function selectStock(stock) {
    setForm(
      (current) => ({
        ...current,
        query:
          stock?.name ||
          stock?.symbol ||
          "",
        selectedStock: {
          symbol:
            cleanText(
              stock?.symbol,
            ).toUpperCase(),
          name:
            cleanText(
              stock?.name,
            ) ||
            cleanText(
              stock?.symbol,
            ),
          sector:
            cleanText(
              stock?.sector,
            ) ||
            "Sector unavailable",
          logoDomain:
            cleanText(
              stock?.logoDomain,
            ),
        },
      }),
    );

    setStockSearchResults([]);
    setStockSearchError("");
    setFormMessage({
      type: "",
      text: "",
    });
  }

  function clearSelectedStock() {
    if (editingHolding) {
      return;
    }

    setForm(
      (current) => ({
        ...current,
        query: "",
        selectedStock: null,
      }),
    );
  }

  function submitHolding(event) {
    event.preventDefault();

    const selectedStock =
      form.selectedStock;

    const quantity =
      numericValue(
        form.quantity,
      );

    const averagePrice =
      numericValue(
        form.averagePrice,
      );

    if (
      !selectedStock?.symbol
    ) {
      setFormMessage({
        type: "error",
        text:
          "Search and select a company first.",
      });
      return;
    }

    if (
      quantity === null ||
      quantity <= 0
    ) {
      setFormMessage({
        type: "error",
        text:
          "Quantity must be greater than zero.",
      });
      return;
    }

    if (
      averagePrice === null ||
      averagePrice < 0
    ) {
      setFormMessage({
        type: "error",
        text:
          "Average purchase price must be zero or higher.",
      });
      return;
    }

    if (
      !editingHolding &&
      holdings.some(
        (holding) =>
          holding.symbol ===
          selectedStock.symbol,
      )
    ) {
      setFormMessage({
        type: "error",
        text:
          "This company already exists in the portfolio. Edit the existing holding instead.",
      });
      return;
    }

    if (
      !editingHolding &&
      holdings.length >=
        MAX_PORTFOLIO_HOLDINGS
    ) {
      setFormMessage({
        type: "error",
        text:
          `You can store up to ${MAX_PORTFOLIO_HOLDINGS} holdings.`,
      });
      return;
    }

    const now =
      new Date().toISOString();

    const normalized =
      normalizePortfolioHolding({
        id:
          editingHolding?.id,
        symbol:
          selectedStock.symbol,
        name:
          selectedStock.name,
        sector:
          selectedStock.sector,
        logoDomain:
          selectedStock.logoDomain,
        quantity,
        averagePrice,
        notes:
          form.notes,
        createdAt:
          editingHolding
            ?.createdAt,
        updatedAt: now,
      });

    if (!normalized) {
      setFormMessage({
        type: "error",
        text:
          "The holding details are invalid.",
      });
      return;
    }

    const nextHoldings =
      editingHolding
        ? holdings.map(
            (holding) =>
              holding.id ===
              editingHolding.id
                ? normalized
                : holding,
          )
        : [
            normalized,
            ...holdings,
          ];

    if (
      persistHoldings(
        nextHoldings,
      )
    ) {
      closeModal();
    }
  }

  function deleteHolding(holding) {
    const confirmed =
      window.confirm(
        `Remove ${holding.name} from your portfolio?`,
      );

    if (!confirmed) {
      return;
    }

    persistHoldings(
      holdings.filter(
        (item) =>
          item.id !==
          holding.id,
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
        {PORTFOLIO_STYLES}
      </style>

      <main className="exa-portfolio-page">
        <div className="exa-portfolio-container">
          <section className="exa-portfolio-header">
            <div>
              

              <h1>
                Portfolio Tracker
              </h1>

              <p className="exa-portfolio-subtitle">
                Track Indian equity holdings, purchase cost, current
                snapshot value and unrealized performance. Holdings are
                saved locally in this browser and are not connected to a
                broker or demat account.
              </p>
            </div>

            <div className="exa-portfolio-header-actions">
              <button
                type="button"
                className="exa-portfolio-button"
                disabled={
                  refreshing ||
                  holdings.length === 0
                }
                onClick={() =>
                  loadPortfolioData({
                    refresh: true,
                  })
                }
              >
                {refreshing ? (
                  <LoaderCircle
                    size={14}
                    className="exa-portfolio-spinner"
                  />
                ) : (
                  <RefreshCw size={14} />
                )}

                {refreshing
                  ? "Reloading"
                  : "Reload values"}
              </button>

              <button
                type="button"
                className="exa-portfolio-button primary"
                onClick={
                  openAddModal
                }
              >
                <Plus size={14} />
                Add holding
              </button>
            </div>
          </section>

          {marketMetadata.generatedAt && (
            <SnapshotFreshnessBanner
              generatedAt={
                marketMetadata.generatedAt
              }
              source={
                marketMetadata.source
              }
            />
          )}

          <section className="exa-portfolio-summary-grid">
            <SummaryCard
              icon={
                BriefcaseBusiness
              }
              label="Holdings"
              value={
                holdings.length
              }
              note={`${filteredRows.length} currently visible`}
            />

            <SummaryCard
              icon={WalletCards}
              label="Invested value"
              value={formatCurrency(
                totals.investedValue,
                0,
              )}
              note="Quantity × average purchase price"
            />

            <SummaryCard
              icon={
                CircleDollarSign
              }
              label="Current value"
              value={formatCurrency(
                totals.currentValue,
                0,
              )}
              note={
                totals.currentValue ===
                null
                  ? "Snapshot price unavailable"
                  : "Based on current screener snapshot"
              }
            />

            <SummaryCard
              icon={
                totals.profitLoss !==
                  null &&
                totals.profitLoss < 0
                  ? TrendingDown
                  : TrendingUp
              }
              label="Unrealized P/L"
              value={formatCurrency(
                totals.profitLoss,
                0,
              )}
              note={formatPercent(
                totals.returnPercent,
              )}
              tone={
                totals.profitLoss ===
                null
                  ? ""
                  : totals.profitLoss >=
                      0
                    ? "exa-portfolio-positive"
                    : "exa-portfolio-negative"
              }
            />

            <SummaryCard
  icon={BarChart3}
  label={dayMovementLabel}
  value={formatCurrency(
    totals.dayChangeValue,
    0,
  )}
  note={dayMovementNote}
              tone={
                totals.dayChangeValue ===
                null
                  ? ""
                  : totals.dayChangeValue >=
                      0
                    ? "exa-portfolio-positive"
                    : "exa-portfolio-negative"
              }
            />
          </section>

          <section className="exa-portfolio-toolbar">
            <div className="exa-portfolio-toolbar-search">
              <Search size={15} />

              <input
                type="search"
                value={
                  holdingSearch
                }
                onChange={(event) =>
                  setHoldingSearch(
                    event.target.value,
                  )
                }
                placeholder="Search portfolio by company, symbol or sector"
                aria-label="Search portfolio holdings"
              />
            </div>

            <select
              value={sortValue}
              onChange={(event) =>
                setSortValue(
                  event.target.value,
                )
              }
              aria-label="Sort portfolio"
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
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <span className="exa-portfolio-count">
              {filteredRows.length} of{" "}
              {holdings.length} holdings
            </span>
          </section>

          <div className="exa-portfolio-notice">
            Portfolio values are educational estimates based on the
            generated Screener snapshot, with live Yahoo Finance fallback
            for companies that are not yet included in that snapshot.
            Brokerage, taxes, dividends, corporate actions and realized
            transactions are not included in this foundation phase.
          </div>

          {unavailableSymbols.length > 0 && (
            <div
              className="exa-portfolio-notice"
              style={{
                borderColor:
                  "rgba(245, 158, 11, 0.26)",
                color: "#fcd34d",
                background:
                  "rgba(245, 158, 11, 0.07)",
              }}
            >
              Current market values could not be loaded for:{" "}
              {unavailableSymbols.join(", ")}. Those holdings remain
              saved and display N/A until market data becomes available.
            </div>
          )}

          <section className="exa-portfolio-table-card">
            {loading ? (
              <div className="exa-portfolio-state">
                <LoaderCircle
                  size={30}
                  className="exa-portfolio-spinner"
                />

                <strong>
                  Loading portfolio values
                </strong>

                <p>
                  Matching your saved holdings with the current
                  Screener snapshot.
                </p>
              </div>
            ) : error ? (
              <div className="exa-portfolio-state">
                <AlertCircle
                  size={30}
                  color="#fb7185"
                />

                <strong>
                  Portfolio values unavailable
                </strong>

                <p>{error}</p>

                <button
                  type="button"
                  className="exa-portfolio-button"
                  style={{
                    marginTop: 14,
                  }}
                  onClick={() =>
                    loadPortfolioData({
                      refresh: true,
                    })
                  }
                >
                  <RefreshCw size={13} />
                  Try again
                </button>
              </div>
            ) : holdings.length ===
              0 ? (
              <div className="exa-portfolio-state">
                <BriefcaseBusiness
                  size={31}
                  color="#60a5fa"
                />

                <strong>
                  Your portfolio is empty
                </strong>

                <p>
                  Add your first Indian equity holding to begin tracking
                  invested value, current value and unrealized returns.
                </p>

                <button
                  type="button"
                  className="exa-portfolio-button primary"
                  style={{
                    marginTop: 14,
                  }}
                  onClick={
                    openAddModal
                  }
                >
                  <Plus size={13} />
                  Add first holding
                </button>
              </div>
            ) : filteredRows.length ===
              0 ? (
              <div className="exa-portfolio-state">
                <Search
                  size={30}
                  color="#60a5fa"
                />

                <strong>
                  No matching holdings
                </strong>

                <p>
                  Change the portfolio search text to see your saved
                  holdings.
                </p>
              </div>
            ) : (
              <div className="exa-portfolio-table-scroll">
                <table className="exa-portfolio-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Quantity</th>
                      <th>Average price</th>
                      <th>Current price</th>
                      <th>Invested value</th>
                      <th>Current value</th>
                      <th>Unrealized P/L</th>
                      <th>Return</th>
                      <th>
                      {dayMovementLabel}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map(
                      (row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="exa-portfolio-company">
                              <CompanyLogo
                                domain={
                                  row.logoDomain ||
                                  row.quote
                                    ?.logoDomain
                                }
                                name={
                                  row.name
                                }
                              />

                              <div className="exa-portfolio-company-copy">
                                <strong title={row.name}>
                                  {row.name}
                                </strong>

                                <span>
                                  {row.symbol} ·{" "}
                                  {row.sector}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {formatNumber(
                              row.quantity,
                              4,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              row.averagePrice,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              row.price,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              row.investedValue,
                              0,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              row.currentValue,
                              0,
                            )}
                          </td>

                          <td
                            className={
                              row.profitLoss ===
                              null
                                ? ""
                                : row.profitLoss >=
                                    0
                                  ? "exa-portfolio-positive"
                                  : "exa-portfolio-negative"
                            }
                          >
                            {formatCurrency(
                              row.profitLoss,
                              0,
                            )}
                          </td>

                          <td
                            className={
                              row.returnPercent ===
                              null
                                ? ""
                                : row.returnPercent >=
                                    0
                                  ? "exa-portfolio-positive"
                                  : "exa-portfolio-negative"
                            }
                          >
                            {formatPercent(
                              row.returnPercent,
                            )}
                          </td>

                          <td
                            className={
                              row.dayChangeValue ===
                              null
                                ? ""
                                : row.dayChangeValue >=
                                    0
                                  ? "exa-portfolio-positive"
                                  : "exa-portfolio-negative"
                            }
                          >
                            <div>
                              {formatCurrency(
                                row.dayChangeValue,
                                0,
                              )}
                            </div>

                            <div
                              style={{
                                marginTop: 3,
                                color:
                                  "#64748b",
                                fontSize: 8,
                              }}
                            >
                              {formatPercent(
                                row.changePercent,
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="exa-portfolio-row-actions">
                              <button
                                type="button"
                                className="exa-portfolio-analyze"
                                onClick={() =>
                                  openAnalysis(
                                    row.symbol,
                                  )
                                }
                              >
                                Analyze
                                <ArrowRight
                                  size={11}
                                />
                              </button>

                              {row.quote
                                ?.nseUrl && (
                                <a
                                  className="exa-portfolio-icon-button"
                                  href={
                                    row.quote
                                      .nseUrl
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open NSE"
                                  aria-label={`Open ${row.name} on NSE`}
                                >
                                  <ExternalLink
                                    size={12}
                                  />
                                </a>
                              )}

                              <button
                                type="button"
                                className="exa-portfolio-icon-button"
                                onClick={() =>
                                  openEditModal(
                                    row,
                                  )
                                }
                                title="Edit holding"
                                aria-label={`Edit ${row.name}`}
                              >
                                <Edit3
                                  size={12}
                                />
                              </button>

                              <button
                                type="button"
                                className="exa-portfolio-icon-button danger"
                                onClick={() =>
                                  deleteHolding(
                                    row,
                                  )
                                }
                                title="Delete holding"
                                aria-label={`Delete ${row.name}`}
                              >
                                <Trash2
                                  size={12}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {modalOpen && (
        <div
          className="exa-portfolio-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="exa-portfolio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-holding-title"
          >
            <div className="exa-portfolio-modal-header">
              <div>
                <h2 id="portfolio-holding-title">
                  {editingHolding
                    ? "Edit holding"
                    : "Add portfolio holding"}
                </h2>

                <p>
                  Enter your quantity and average purchase price. This
                  information stays in local browser storage.
                </p>
              </div>

              <button
                type="button"
                className="exa-portfolio-modal-close"
                onClick={
                  closeModal
                }
                aria-label="Close portfolio form"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={submitHolding}>
              <div className="exa-portfolio-modal-body">
                <div className="exa-portfolio-field">
                  <label>
                    Company
                  </label>

                  {form.selectedStock ? (
                    <div className="exa-portfolio-selected-stock">
                      <CompanyLogo
                        domain={
                          form
                            .selectedStock
                            .logoDomain
                        }
                        name={
                          form
                            .selectedStock
                            .name
                        }
                      />

                      <div className="exa-portfolio-selected-stock-copy">
                        <strong>
                          {
                            form
                              .selectedStock
                              .name
                          }
                        </strong>

                        <span>
                          {
                            form
                              .selectedStock
                              .symbol
                          }{" "}
                          ·{" "}
                          {
                            form
                              .selectedStock
                              .sector
                          }
                        </span>
                      </div>

                      {!editingHolding && (
                        <button
                          type="button"
                          className="exa-portfolio-icon-button"
                          onClick={
                            clearSelectedStock
                          }
                          aria-label="Change selected company"
                          title="Change company"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="exa-portfolio-stock-search">
                      <input
                        type="search"
                        value={
                          form.query
                        }
                        onChange={(event) => {
                          const nextQuery =
                            event.target.value;

                          setForm(
                            (current) => ({
                              ...current,
                              query:
                                nextQuery,
                            }),
                          );

                          setFormMessage({
                            type: "",
                            text: "",
                          });
                        }}
                        placeholder="Search Reliance, TCS, HDFC Bank..."
                        autoComplete="off"
                      />

                      {cleanText(
                        form.query,
                      ).length >= 2 && (
                        <div className="exa-portfolio-search-results">
                          {stockSearchLoading ? (
                            <div className="exa-portfolio-search-state">
                              <LoaderCircle
                                size={15}
                                className="exa-portfolio-spinner"
                              />

                              <div
                                style={{
                                  marginTop: 7,
                                }}
                              >
                                Searching companies...
                              </div>
                            </div>
                          ) : stockSearchError ? (
                            <div className="exa-portfolio-search-state error">
                              {stockSearchError}
                            </div>
                          ) : stockSearchResults.length ===
                            0 ? (
                            <div className="exa-portfolio-search-state">
                              No matching NSE or BSE companies found. Try a company name or ticker such as RELIANCE or TCS.
                            </div>
                          ) : (
                            stockSearchResults.map(
                              (stock) => (
                                <button
                                  key={
                                    stock.symbol
                                  }
                                  type="button"
                                  className="exa-portfolio-search-result"
                                  onClick={() =>
                                    selectStock(
                                      stock,
                                    )
                                  }
                                >
                                  <CompanyLogo
                                    domain={
                                      stock.logoDomain
                                    }
                                    name={
                                      stock.name
                                    }
                                  />

                                  <div className="exa-portfolio-search-result-copy">
                                    <strong>
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

                                  <Check
                                    size={13}
                                    color="#60a5fa"
                                  />
                                </button>
                              ),
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="exa-portfolio-form-grid">
                  <div className="exa-portfolio-field">
                    <label htmlFor="portfolio-quantity">
                      Quantity
                    </label>

                    <input
                      id="portfolio-quantity"
                      type="number"
                      min="0"
                      step="any"
                      value={
                        form.quantity
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            quantity:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      placeholder="Example: 10"
                    />
                  </div>

                  <div className="exa-portfolio-field">
                    <label htmlFor="portfolio-average-price">
                      Average purchase price
                    </label>

                    <input
                      id="portfolio-average-price"
                      type="number"
                      min="0"
                      step="any"
                      value={
                        form.averagePrice
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            averagePrice:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      placeholder="Example: 1450"
                    />
                  </div>
                </div>

                <div className="exa-portfolio-field">
                  <label htmlFor="portfolio-notes">
                    Notes — optional
                  </label>

                  <textarea
                    id="portfolio-notes"
                    value={form.notes}
                    maxLength={240}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          notes:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="Investment thesis, purchase date or personal notes"
                  />
                </div>

                {formMessage.text && (
                  <div
                    className={`exa-portfolio-form-message ${formMessage.type}`}
                    role="status"
                  >
                    {formMessage.text}
                  </div>
                )}
              </div>

              <div className="exa-portfolio-modal-actions">
                <button
                  type="button"
                  className="exa-portfolio-button"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="exa-portfolio-button primary"
                >
                  {editingHolding ? (
                    <Edit3 size={13} />
                  ) : (
                    <Plus size={13} />
                  )}

                  {editingHolding
                    ? "Save changes"
                    : "Add holding"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}