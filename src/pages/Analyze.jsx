import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";
import ResearchDisclaimer from "../components/legal/ResearchDisclaimer";
import MarketDataStatus from "../components/data/MarketDataStatus";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Building2,
  Database,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import ScoreGauge from 
"../components/ScoreGauge";
import AppShell from 
"../components/layout/AppShell";
import PremiumAiResearchPanel from
 "../components/analyze/PremiumAiResearchPanel";
import TechnicalsTab from 
"../components/analyze/TechnicalsTab";
import FundamentalsTab from 
"../components/analyze/FundamentalsTab";
import RisksTab from
  "../components/analyze/RisksTab";
  import FinancialsTab from
  "../components/analyze/FinancialsTab";
import StockNewsPanel from 
"../components/analyze/StockNewsPanel";
import NewsTab from
  "../components/analyze/NewsTab";
import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";
import "../styles/analyze-v2.css";
import "../styles/stock-news.css";
import {
  getAiAnalysis,
  getStockData,
  searchStocks,
} from "../services/financeApi";
import { saveRecentAnalysis } from "../utils/dashboardStorage";

const POPULAR_STOCKS = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries Limited",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "ril.com",
    companyUrl: "https://www.ril.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/500325",
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank Limited",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "hdfcbank.com",
    companyUrl:
      "https://www.hdfcbank.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/500180",
  },
  {
    symbol: "INFY.NS",
    name: "Infosys Limited",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "infosys.com",
    companyUrl:
      "https://www.infosys.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=INFY",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/500209",
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services Limited",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "tcs.com",
    companyUrl: "https://www.tcs.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=TCS",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/532540",
  },
  {
    symbol: "TATAMOTORS.NS",
    name: "Tata Motors Limited",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "tatamotors.com",
    companyUrl:
      "https://www.tatamotors.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=TATAMOTORS",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/500570",
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank Limited",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "icicibank.com",
    companyUrl:
      "https://www.icicibank.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=ICICIBANK",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/532174",
  },
  {
    symbol: "BHARTIARTL.NS",
    name: "Bharti Airtel Limited",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "airtel.in",
    companyUrl: "https://www.airtel.in",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=BHARTIARTL",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/532454",
  },
  {
    symbol: "SBIN.NS",
    name: "State Bank of India",
    exchange: "NSE",
    quoteType: "EQUITY",
    currency: "INR",
    logoDomain: "sbi.co.in",
    companyUrl: "https://sbi.co.in",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=SBIN",
    bseUrl:
      "https://www.bseindia.com/stock-share-price/equity/scripcode/500112",
  },
];

const TIMEFRAMES = ["1D", "1W", "1M", "1Y", "5Y", "MAX"];

const RANGE_MAP = {
  "1D": "1d",
  "1W": "1w",
  "1M": "1m",
  "1Y": "1y",
  "5Y": "5y",
  MAX: "max",
};

const SIGNAL_STYLE = {
  BUY: {
    color: "var(--exa-positive)",
    bg: "var(--exa-positive-soft)",
    label: "Positive",
  },
  SELL: {
    color: "var(--exa-negative)",
    bg: "var(--exa-negative-soft)",
    label: "Negative",
  },
  NEUTRAL: {
    color: "var(--exa-warning)",
    bg: "var(--exa-warning-soft)",
    label: "Neutral",
  },
  WATCH: {
    color: "var(--exa-primary)",
    bg: "var(--exa-primary-soft)",
    label: "Watch",
  },
};

const ANALYZE_LAYOUT_STYLES = `
  /* ---------------------------------------------------------
     Analyze page search and results layout
     --------------------------------------------------------- */

  .exa-analyze-home-search {
    position: relative;
    width: 100%;
    margin: 0 0 18px;
    padding: 16px;
    box-sizing: border-box;
    border: 1px solid var(--exa-border);
    border-radius: 18px;
    background: var(--exa-card-background);
    box-shadow: var(--exa-shadow-card);
  }

  .exa-search-with-icon-button {
    width: 100%;
    margin: 0;
  }

  .exa-search-with-icon-button .exa-analyze-search-field {
    position: relative;
    width: 100%;
  }

  .exa-search-with-icon-button .exa-analyze-search-input {
    padding-right: 58px;
  }

  .exa-analyze-lens-button {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    width: 39px;
    height: 39px;
    margin: 0;
    padding: 0;
    border: 1px solid rgba(96, 165, 250, 0.18);
    border-radius: 11px;
    color: #bfdbfe;
    background:
      linear-gradient(
        135deg,
        rgba(37, 99, 235, 0.9),
        rgba(79, 70, 229, 0.9)
      );
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .exa-analyze-lens-button:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  .exa-analyze-lens-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  /* Compact search displayed inside the desktop top navigation. */
  .exa-analyze-floating-search {
    position: fixed;
    top: 0;
    left: 260px;
    right: 430px;
    z-index: 250;
    height: 76px;
    margin: 0;
    padding: 14px 18px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    box-shadow: none;
    pointer-events: none;
    animation: exaNavSearchIn 0.2s ease;
  }

  .exa-analyze-nav-search-form {
    width: 100%;
    height: 48px;
    min-width: 0;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    pointer-events: auto;
  }

  .exa-analyze-nav-search-field {
    position: relative;
    width: 100%;
    height: 48px;
    min-width: 0;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    border: 1px solid rgba(96, 165, 250, 0.17);
    border-radius: 13px;
    background: rgba(7, 17, 31, 0.92);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    display: flex;
    align-items: center;
    overflow: visible;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .exa-analyze-nav-search-field:focus-within {
    border-color: rgba(96, 165, 250, 0.48);
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.1),
      0 12px 34px rgba(0, 0, 0, 0.2);
  }

  .exa-analyze-nav-search-input {
    width: 100%;
    height: 46px;
    min-width: 0;
    margin: 0;
    padding: 0 52px 0 18px;
    box-sizing: border-box;
    border: 0;
    outline: 0;
    color: #e5edf9;
    background: transparent;
    font: inherit;
    font-size: 13px;
    line-height: normal;
  }

  .exa-analyze-nav-search-input::placeholder {
    color: #61718a;
  }

  .exa-analyze-nav-search-input::-webkit-search-cancel-button {
    display: none;
  }

  .exa-analyze-nav-lens-button {
    position: absolute;
    top: 50%;
    right: 6px;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    min-width: 34px;
    min-height: 34px;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    border: 1px solid rgba(96, 165, 250, 0.16);
    border-radius: 10px;
    color: #93c5fd;
    background: rgba(37, 99, 235, 0.1);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .exa-analyze-nav-lens-button:hover:not(:disabled) {
    color: #ffffff;
    border-color: rgba(96, 165, 250, 0.36);
    background: rgba(37, 99, 235, 0.22);
  }

  .exa-analyze-nav-lens-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  @keyframes exaNavSearchIn {
    from {
      opacity: 0;
      transform: translateY(-7px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .exa-analyze-results-layout {
    width: 100%;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(340px, 430px);
    align-items: start;
    gap: 16px;
  }

  .exa-analyze-main-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .exa-analyze-right-rail {
    position: sticky;
    top: 92px;
    min-width: 0;
    height: calc(100vh - 108px);
    align-self: start;
    overflow: hidden;
  }

  .exa-analyze-right-scroll {
    width: 100%;
    height: 100%;
    padding-right: 7px;
    padding-bottom: 18px;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color:
      rgba(96, 165, 250, 0.36)
      rgba(15, 30, 54, 0.5);
  }

  .exa-analyze-right-scroll::-webkit-scrollbar {
    width: 7px;
  }

  .exa-analyze-right-scroll::-webkit-scrollbar-track {
    border-radius: 999px;
    background: rgba(15, 30, 54, 0.5);
  }

  .exa-analyze-right-scroll::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(96, 165, 250, 0.36);
  }

  .exa-analyze-right-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(96, 165, 250, 0.58);
  }

  .exa-analyze-right-scroll .exa-stock-news-list {
    max-height: none !important;
    overflow: visible !important;
    padding-right: 0 !important;
  }

  .exa-analyze-right-scroll .exa-premium-ai-panel,
  .exa-analyze-right-scroll .exa-stock-news-card {
    width: 100%;
    min-width: 0;
  }

  .exa-analyze-results-layout > * {
    align-self: start;
  }

  @media (min-width: 1400px) {
    .exa-analyze-results-layout {
      grid-template-columns: minmax(0, 2.1fr) minmax(360px, 450px);
    }
  }

  @media (max-width: 1350px) {
    .exa-analyze-floating-search {
      right: 390px;
    }
  }

  @media (max-width: 1150px) {
    .exa-analyze-floating-search {
      left: 78px;
      right: 350px;
    }
  }

  @media (max-width: 1100px) {
    .exa-analyze-results-layout {
      grid-template-columns: 1fr;
    }

    .exa-analyze-right-rail {
      position: static;
      top: auto;
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .exa-analyze-right-scroll {
      height: auto;
      max-height: none;
      padding-right: 0;
      overflow: visible;
    }

    .exa-analyze-right-scroll .exa-stock-news-list {
      max-height: 520px !important;
      overflow-y: auto !important;
      padding-right: 5px !important;
    }
  }

  @media (max-width: 900px) {
    .exa-analyze-floating-search {
      left: 68px;
      right: 270px;
      padding-right: 10px;
      padding-left: 10px;
    }

    .exa-analyze-nav-search-input {
      font-size: 12px;
    }
  }

  @media (max-width: 700px) {
    .exa-analyze-home-search {
      margin-bottom: 14px;
      padding: 12px;
      border-radius: 15px;
    }

    .exa-analyze-floating-search {
      top: 62px;
      right: 0;
      left: 0;
      height: 62px;
      padding: 8px 10px;
      background: rgba(7, 17, 31, 0.97);
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .exa-analyze-nav-search-form,
    .exa-analyze-nav-search-field {
      height: 46px;
    }

    .exa-analyze-nav-search-input {
      height: 44px;
    }

    .exa-analyze-quick-picks {
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 3px;
    }

    .exa-analyze-quick-chip {
      flex-shrink: 0;
    }
  }
`;
function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatMetric(value, maximumFractionDigits = 2) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits,
  }).format(number);
}

function normalizeDateValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let normalizedValue = value;

  if (
    typeof normalizedValue === "number" &&
    normalizedValue < 1_000_000_000_000
  ) {
    normalizedValue *= 1000;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatChartDate(value, selectedTimeframe) {
  const date = normalizeDateValue(value);

  if (!date) {
    return "";
  }

  if (selectedTimeframe === "1D" || selectedTimeframe === "1W") {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  if (selectedTimeframe === "MAX") {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatChartTooltipDate(value) {
  const date = normalizeDateValue(value);

  if (!date) {
    return "Market price";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatUpdatedTime(value) {
  const date = normalizeDateValue(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatIndianLargeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  if (number >= 1_000_000_000_000) {
    return `${(number / 1_000_000_000_000).toFixed(2)} Lakh Cr`;
  }

  if (number >= 10_000_000) {
    return `${(number / 10_000_000).toFixed(2)} Cr`;
  }

  if (number >= 100_000) {
    return `${(number / 100_000).toFixed(2)} Lakh`;
  }

  return new Intl.NumberFormat("en-IN").format(number);
}

function getCompanyDomain(website) {
  if (!website) {
    return "";
  }

  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isAiLimitError(error) {
  const message = String(
    error instanceof Error ? error.message : error || "",
  ).toLowerCase();

  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("high demand") ||
    message.includes("too many requests")
  );
}

function createLiveResult(
  stockData,
  selectedStock,
) {
  const fundamentals = {
    enterpriseValue:
      stockData.enterpriseValue ?? null,
    forwardPE:
      stockData.forwardPE ?? null,
    priceToBook:
      stockData.priceToBook ?? null,
    pegRatio:
      stockData.pegRatio ?? null,
    trailingEps:
      stockData.trailingEps ?? null,
    forwardEps:
      stockData.forwardEps ?? null,
    totalRevenue:
      stockData.totalRevenue ?? null,
    revenueGrowth:
      stockData.revenueGrowth ?? null,
    earningsGrowth:
      stockData.earningsGrowth ?? null,
    profitMargins:
      stockData.profitMargins ?? null,
    returnOnEquity:
      stockData.returnOnEquity ?? null,
    totalCash:
      stockData.totalCash ?? null,
    totalDebt:
      stockData.totalDebt ?? null,
    debtToEquity:
      stockData.debtToEquity ?? null,
    currentRatio:
      stockData.currentRatio ?? null,
    freeCashflow:
      stockData.freeCashflow ?? null,
    dividendYield:
      stockData.dividendYield ?? null,
  };

  return {
    symbol: stockData.symbol,
    ticker: stockData.symbol,
    company:
      stockData.name ||
      selectedStock?.name ||
      stockData.symbol,
    exchange:
      stockData.exchange ||
      selectedStock?.exchange ||
      "N/A",
    currency:
      stockData.currency ||
      selectedStock?.currency ||
      "INR",
    marketState:
      stockData.marketState || null,
    sector:
      stockData.sector || "N/A",
    industry:
      stockData.industry || "N/A",
    businessSummary:
      stockData.businessSummary || "",
    website:
      stockData.website ||
      selectedStock?.website ||
      "",
    employees:
      stockData.employees ?? null,
    price:
      stockData.price ?? null,
    changeAbs:
      stockData.change ?? 0,
    changePercent:
      stockData.changePercent ?? 0,
    marketCap:
      stockData.marketCap ?? null,
    peRatio:
      stockData.peRatioTTM ?? null,
    week52Low:
      stockData.fiftyTwoWeekLow ?? null,
    week52High:
      stockData.fiftyTwoWeekHigh ?? null,
    volume:
      stockData.volume ?? null,

    forwardPE:
      fundamentals.forwardPE,
    enterpriseValue:
      fundamentals.enterpriseValue,
    priceToBook:
      fundamentals.priceToBook,
    pegRatio:
      fundamentals.pegRatio,
    trailingEps:
      fundamentals.trailingEps,
    forwardEps:
      fundamentals.forwardEps,
    totalRevenue:
      fundamentals.totalRevenue,
    revenueGrowth:
      fundamentals.revenueGrowth,
    earningsGrowth:
      fundamentals.earningsGrowth,
    profitMargins:
      fundamentals.profitMargins,
    returnOnEquity:
      fundamentals.returnOnEquity,
    totalCash:
      fundamentals.totalCash,
    totalDebt:
      fundamentals.totalDebt,
    debtToEquity:
      fundamentals.debtToEquity,
    currentRatio:
      fundamentals.currentRatio,
    freeCashflow:
      fundamentals.freeCashflow,
    dividendYield:
      fundamentals.dividendYield,
    fundamentals,

    chart:
      Array.isArray(stockData.chart)
        ? stockData.chart
        : [],
    source:
      stockData.source ||
      "Yahoo Finance",
    lastUpdated:
      stockData.lastUpdated || null,
    logoDomain:
      stockData.logoDomain ||
      selectedStock?.logoDomain ||
      getCompanyDomain(
        stockData.website ||
          selectedStock?.website,
      ),

    signal: "WATCH",
    summary: "",
    keyThemes: [],
    growthDrivers: [],
    keyRisks: [],
    confidenceScore: 0,
    riskLevel: "Moderate",
    fundamentalScore: 0,
    fundamentalLabel:
      "AI unavailable",
    momentumScore: 0,
    momentumLabel:
      "AI unavailable",
    valuationScore: 0,
    valuationLabel:
      "AI unavailable",
    sentimentScore: 0,
    sentimentLabel:
      "AI unavailable",
    aiAvailable: false,
    aiSummaryCached: false,
  };
}

function mergeAiAnalysis(
  liveResult,
  aiAnalysis,
) {
  const strength = Number(
    aiAnalysis?.strength,
  );

  const confidenceScore =
    aiAnalysis?.confidenceScore ??
    (Number.isFinite(strength)
      ? Math.min(
          100,
          Math.max(0, strength * 10),
        )
      : liveResult.confidenceScore);

  return {
    ...liveResult,
    ...aiAnalysis,

    // Live Yahoo Finance values remain the source of truth.
    symbol: liveResult.symbol,
    ticker:
      aiAnalysis?.ticker ||
      liveResult.ticker,
    company:
      aiAnalysis?.company ||
      liveResult.company,
    exchange: liveResult.exchange,
    currency: liveResult.currency,
    marketState:
      liveResult.marketState,
    sector:
      aiAnalysis?.sector ||
      liveResult.sector,
    industry:
      aiAnalysis?.industry ||
      liveResult.industry,
    businessSummary:
      liveResult.businessSummary,
    website: liveResult.website,
    employees: liveResult.employees,
    price: liveResult.price,
    changeAbs: liveResult.changeAbs,
    changePercent:
      liveResult.changePercent,
    marketCap: liveResult.marketCap,
    peRatio: liveResult.peRatio,
    week52Low: liveResult.week52Low,
    week52High:
      liveResult.week52High,
    volume: liveResult.volume,

    forwardPE: liveResult.forwardPE,
    enterpriseValue:
      liveResult.enterpriseValue,
    priceToBook:
      liveResult.priceToBook,
    pegRatio: liveResult.pegRatio,
    trailingEps:
      liveResult.trailingEps,
    forwardEps: liveResult.forwardEps,
    totalRevenue:
      liveResult.totalRevenue,
    revenueGrowth:
      liveResult.revenueGrowth,
    earningsGrowth:
      liveResult.earningsGrowth,
    profitMargins:
      liveResult.profitMargins,
    returnOnEquity:
      liveResult.returnOnEquity,
    totalCash: liveResult.totalCash,
    totalDebt: liveResult.totalDebt,
    debtToEquity:
      liveResult.debtToEquity,
    currentRatio:
      liveResult.currentRatio,
    freeCashflow:
      liveResult.freeCashflow,
    dividendYield:
      liveResult.dividendYield,
    fundamentals:
      liveResult.fundamentals,

    chart: liveResult.chart,
    source: liveResult.source,
    lastUpdated:
      liveResult.lastUpdated,
    logoDomain:
      aiAnalysis?.logoDomain ||
      liveResult.logoDomain,
    signal: String(
      aiAnalysis?.signal ||
        "NEUTRAL",
    ).toUpperCase(),
    summary:
      aiAnalysis?.summary || "",
    keyThemes:
      Array.isArray(
        aiAnalysis?.keyThemes,
      )
        ? aiAnalysis.keyThemes
        : [],
    growthDrivers:
      Array.isArray(
        aiAnalysis?.growthDrivers,
      )
        ? aiAnalysis.growthDrivers
        : Array.isArray(
              aiAnalysis?.positives,
            )
          ? aiAnalysis.positives
          : [],
    keyRisks:
      Array.isArray(
        aiAnalysis?.keyRisks,
      )
        ? aiAnalysis.keyRisks
        : Array.isArray(
              aiAnalysis?.risks,
            )
          ? aiAnalysis.risks
          : [],
    confidenceScore,
    riskLevel:
      aiAnalysis?.riskLevel ||
      liveResult.riskLevel,
    fundamentalScore:
      aiAnalysis?.fundamentalScore ?? 0,
    fundamentalLabel:
      aiAnalysis?.fundamentalLabel ||
      "Not provided",
    momentumScore:
      aiAnalysis?.momentumScore ?? 0,
    momentumLabel:
      aiAnalysis?.momentumLabel ||
      "Not provided",
    valuationScore:
      aiAnalysis?.valuationScore ?? 0,
    valuationLabel:
      aiAnalysis?.valuationLabel ||
      "Not provided",
    sentimentScore:
      aiAnalysis?.sentimentScore ?? 0,
    sentimentLabel:
      aiAnalysis?.sentimentLabel ||
      "Not provided",
    aiAvailable: true,
    aiSummaryCached:
      Boolean(
        aiAnalysis?.aiSummaryCached,
      ),
  };
}

function ScoreCard({ title, score, scoreLabel }) {
  const numericScore = Number(score) || 0;

  const labelColor =
    numericScore >= 70
      ? "var(--exa-positive)"
      : numericScore >= 40
        ? "var(--exa-warning)"
        : "var(--exa-negative)";

  return (
    <div
      style={{
        background: "var(--exa-card-background)",
        border: "1px solid var(--exa-border)",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "var(--exa-text-secondary)",
        }}
      >
        {title}
      </div>

      <ScoreGauge
        score={numericScore}
        size={64}
      />

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: labelColor,
        }}
      >
        {scoreLabel || "N/A"}
      </div>
    </div>
  );
}

function formatSuggestionPrice(
  value,
  currency = "INR",
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Price unavailable";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Price unavailable";
  }

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency:
          currency || "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(number);
  } catch {
    return number.toFixed(2);
  }
}

function formatSuggestionChange(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function matchesSuggestionPrefix(
  suggestion,
  searchText,
) {
  const normalizedQuery = String(
    searchText || "",
  )
    .trim()
    .toLowerCase();

  if (!normalizedQuery) {
    return false;
  }

  const name = String(
    suggestion?.name || "",
  ).toLowerCase();

  const ticker = String(
    suggestion?.symbol || "",
  )
    .replace(/\.(NS|BO)$/i, "")
    .toLowerCase();

  const nameWords = name.split(
    /[\s&-]+/,
  );

  return (
    ticker.startsWith(
      normalizedQuery,
    ) ||
    name.startsWith(
      normalizedQuery,
    ) ||
    nameWords.some((word) =>
      word.startsWith(
        normalizedQuery,
      ),
    )
  );
}

async function fetchPopularStocks() {
  const response =
    await fetch(
      "/api/stock-search?popular=1",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : data?.error?.message ||
          "Unable to load popular stocks.";

    throw new Error(message);
  }

  return Array.isArray(data)
    ? data
    : [];
}

function CompanyLogo({
  domain,
  name,
  size = 52,
}) {
  const [failed, setFailed] =
    useState(false);

  useEffect(() => {
    setFailed(false);
  }, [domain]);

  const logoKey =
    import.meta.env.VITE_LOGO_KEY;

  const showImage = Boolean(
    domain &&
      logoKey &&
      !failed,
  );

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: showImage
          ? "#fff"
          : "#1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {showImage ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${logoKey}&size=128&format=webp`}
          alt={
            name || "Company logo"
          }
          onError={() =>
            setFailed(true)
          }
          style={{
            width: "70%",
            height: "70%",
            objectFit: "contain",
          }}
        />
      ) : (
        <span
          style={{
            fontWeight: 700,
            fontSize: size * 0.35,
            color: "#93c5fd",
          }}
        >
          {name
            ?.charAt(0)
            ?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

function getSuggestionExternalLinks(
  suggestion,
) {
  const symbol = String(
    suggestion?.symbol || "",
  ).toUpperCase();

  const baseSymbol =
    symbol.replace(
      /\.(NS|BO)$/i,
      "",
    );

  const companyUrl =
    suggestion?.companyUrl ||
    suggestion?.website ||
    "";

  const nseUrl =
    suggestion?.nseUrl ||
    (
      symbol.endsWith(".NS") &&
      baseSymbol
        ? `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(
            baseSymbol,
          )}`
        : ""
    );

  const bseCode =
    suggestion?.bseCode ||
    (
      symbol.endsWith(".BO")
        ? baseSymbol
        : ""
    );

  const bseUrl =
    suggestion?.bseUrl ||
    (
      bseCode
        ? `https://www.bseindia.com/stock-share-price/equity/scripcode/${encodeURIComponent(
            bseCode,
          )}`
        : ""
    );

  return {
    companyUrl,
    nseUrl,
    bseUrl,
  };
}

function StockSuggestionList({
  listboxId,
  title,
  suggestions,
  suggestionsLoading,
  activeSuggestionIndex,
  onSelect,
  onActivate,
}) {
  return (
    <div
      id={listboxId}
      className="exa-stock-suggestions"
      role="listbox"
      aria-label={
        title || "Stock suggestions"
      }
    >
      {title && (
        <div className="exa-stock-suggestion-heading">
          {title}
        </div>
      )}

      {suggestionsLoading && (
        <div className="exa-stock-suggestion-status">
          <LoaderCircle
            size={17}
            className="exa-analyze-spinner"
          />
          Searching stocks…
        </div>
      )}

      {!suggestionsLoading &&
        suggestions.map(
          (suggestion, index) => {
            const rawChange =
              suggestion.changePercent;

            const hasChange =
              rawChange !== null &&
              rawChange !== undefined &&
              rawChange !== "" &&
              Number.isFinite(
                Number(rawChange),
              );

            const change =
              hasChange
                ? Number(rawChange)
                : null;

            const {
              companyUrl,
              nseUrl,
              bseUrl,
            } =
              getSuggestionExternalLinks(
                suggestion,
              );

            return (
              <div
                key={suggestion.symbol}
                className="exa-stock-suggestion-group"
                onMouseEnter={() =>
                  onActivate(index)
                }
              >
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={
                    activeSuggestionIndex ===
                    index
                  }
                  className={`exa-stock-suggestion-item ${
                    activeSuggestionIndex ===
                    index
                      ? "active"
                      : ""
                  }`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() =>
                    onSelect(suggestion)
                  }
                >
                  <CompanyLogo
                    domain={
                      suggestion.logoDomain
                    }
                    name={suggestion.name}
                    size={38}
                  />

                  <div className="exa-stock-suggestion-info">
                    <strong>
                      {suggestion.name}
                    </strong>

                    <span>
                      {suggestion.symbol}
                      {suggestion.exchange
                        ? ` · ${suggestion.exchange}`
                        : ""}
                    </span>
                  </div>

                  <div className="exa-stock-suggestion-price">
                    <strong>
                      {formatSuggestionPrice(
                        suggestion.price,
                        suggestion.currency,
                      )}
                    </strong>

                    {hasChange && (
                      <span
                        className={
                          change >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {formatSuggestionChange(
                          change,
                        )}
                      </span>
                    )}
                  </div>
                </button>

                {(companyUrl ||
                  nseUrl ||
                  bseUrl) && (
                  <div className="exa-stock-suggestion-links">
                    {companyUrl && (
                      <a
                        href={companyUrl}
                        target="_blank"
                        rel="noreferrer"
                        onMouseDown={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        Website
                      </a>
                    )}

                    {nseUrl && (
                      <a
                        href={nseUrl}
                        target="_blank"
                        rel="noreferrer"
                        onMouseDown={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        NSE
                      </a>
                    )}

                    {bseUrl && (
                      <a
                        href={bseUrl}
                        target="_blank"
                        rel="noreferrer"
                        onMouseDown={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        BSE
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          },
        )}

      {!suggestionsLoading &&
        suggestions.length === 0 && (
          <div className="exa-stock-suggestion-status">
            No matching Indian stocks
            found.
          </div>
        )}
    </div>
  );
}
function normalizeDirectStockSymbol(value) {
  const symbol = String(value || "")
    .trim()
    .toUpperCase();

  const isYahooStockSymbol =
    /^[A-Z0-9&_-]+\.(NS|BO)$/.test(
      symbol,
    );

  return isYahooStockSymbol
    ? symbol
    : "";
}

function createDirectStockResult(value) {
  const symbol =
    normalizeDirectStockSymbol(
      value,
    );

  if (!symbol) {
    return null;
  }

  const isNse =
    symbol.endsWith(".NS");

  return {
    symbol,

    name: symbol.replace(
      /\.(NS|BO)$/,
      "",
    ),

    exchange: isNse
      ? "NSE"
      : "BSE",

    quoteType: "EQUITY",
    type: "Equity",
  };
}


export default function Analyze() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const autoAnalyzeRef = useRef("");
  const searchSectionRef = useRef(null);
  const suggestionRequestRef =
    useRef(0);

  const [query, setQuery] =
    useState("");
  const [suggestions, setSuggestions] =
    useState([]);
  const [
    suggestionsLoading,
    setSuggestionsLoading,
  ] = useState(false);
  const [
    showSuggestions,
    setShowSuggestions,
  ] = useState(false);
  const [
    activeSuggestionIndex,
    setActiveSuggestionIndex,
  ] = useState(-1);
  const [
    activeSearchSource,
    setActiveSearchSource,
  ] = useState(null);
  const [loading, setLoading] =
    useState(false);
  const [chartLoading, setChartLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [aiNotice, setAiNotice] =
    useState("");
  const [result, setResult] =
    useState(null);
  const [timeframe, setTimeframe] =
    useState("1D");
  const [activeTab, setActiveTab] =
    useState("Overview");
  const [
    showFloatingSearch,
    setShowFloatingSearch,
  ] = useState(false);

  useEffect(() => {
    const searchText = query.trim();

    if (
      loading ||
      !activeSearchSource
    ) {
      suggestionRequestRef.current += 1;
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      setActiveSuggestionIndex(-1);

      return undefined;
    }

    /*
     * Empty focused search shows popular stocks
     * inside the same suggestion dropdown.
     *
     * Local entries appear immediately. When the
     * upgraded backend is installed, live prices
     * replace them from ?popular=1.
     */
    if (!searchText) {
      const requestId =
        suggestionRequestRef.current +
        1;

      suggestionRequestRef.current =
        requestId;

      setSuggestions(
        POPULAR_STOCKS,
      );
      setShowSuggestions(true);
      setSuggestionsLoading(true);
      setActiveSuggestionIndex(-1);

      fetchPopularStocks()
        .then((results) => {
          if (
            requestId !==
            suggestionRequestRef.current
          ) {
            return;
          }

          const validResults =
            Array.isArray(results)
              ? results
                  .filter(
                    (item) =>
                      item?.symbol &&
                      item?.name,
                  )
                  .slice(0, 8)
              : [];

          if (
            validResults.length > 0
          ) {
            setSuggestions(
              validResults,
            );
          }
        })
        .catch((popularError) => {
          console.warn(
            "Popular stocks unavailable:",
            popularError,
          );
        })
        .finally(() => {
          if (
            requestId ===
            suggestionRequestRef.current
          ) {
            setSuggestionsLoading(
              false,
            );
          }
        });

      return () => {
        suggestionRequestRef.current += 1;
      };
    }

    const requestId =
      suggestionRequestRef.current + 1;

    suggestionRequestRef.current =
      requestId;

    const timeoutId =
      window.setTimeout(
        async () => {
          setSuggestionsLoading(true);

          try {
            const results =
              await searchStocks(
                searchText,
              );

            if (
              requestId !==
              suggestionRequestRef.current
            ) {
              return;
            }

            const validResults =
              Array.isArray(results)
                ? results
                    .filter(
                      (item) =>
                        item?.symbol &&
                        item?.name,
                    )
                    .slice(0, 8)
                : [];

            setSuggestions(
              validResults,
            );
            setShowSuggestions(true);
            setActiveSuggestionIndex(-1);
          } catch (suggestionError) {
            if (
              requestId !==
              suggestionRequestRef.current
            ) {
              return;
            }

            console.warn(
              "Stock suggestions unavailable:",
              suggestionError,
            );

            setSuggestions([]);
            setShowSuggestions(true);
          } finally {
            if (
              requestId ===
              suggestionRequestRef.current
            ) {
              setSuggestionsLoading(
                false,
              );
            }
          }
        },
        350,
      );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    query,
    loading,
    activeSearchSource,
  ]);

  useEffect(() => {
    const searchElement =
      searchSectionRef.current;

    if (!searchElement) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setShowFloatingSearch(
            !entry.isIntersecting,
          );
        },
        {
          root: null,
          threshold: 0,
          rootMargin:
            "-76px 0px 0px 0px",
        },
      );

    observer.observe(searchElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  /*
   * The original search remains mounted while the floating
   * search is displayed. Close the old dropdown when the
   * page switches to the floating search.
   */
  useEffect(() => {
    if (
      showFloatingSearch &&
      activeSearchSource === "main"
    ) {
      suggestionRequestRef.current += 1;
      setShowSuggestions(false);
      setSuggestions([]);
      setSuggestionsLoading(false);
      setActiveSuggestionIndex(-1);
      setActiveSearchSource(null);
    }
  }, [
    showFloatingSearch,
    activeSearchSource,
  ]);

  async function analyze(stock) {
  const suppliedStock =
    stock &&
    typeof stock === "object"
      ? stock
      : null;

  const q = String(
    suppliedStock?.symbol ||
      stock ||
      query,
  ).trim();

  if (!q || loading) {
    return;
  }

  /*
   * Dashboard and direct URLs provide exact
   * Yahoo symbols such as HDFCBANK.NS.
   *
   * Exact symbols do not need to pass through
   * the company-name search endpoint.
   */
  const directStock =
    suppliedStock ||
    createDirectStockResult(q);

  closeSuggestions();
  setLoading(true);
  setError("");
  setAiNotice("");
  setResult(null);

  try {
    const searchResults =
      directStock
        ? [directStock]
        : await searchStocks(q);

      if (
        !Array.isArray(searchResults) ||
        searchResults.length === 0
      ) {
        throw new Error(
          "No matching stock was found.",
        );
      }

      const selectedStock =
        searchResults.find(
          (item) =>
            item?.quoteType ===
              "EQUITY" &&
            item?.symbol?.endsWith(
              ".NS",
            ),
        ) ||
        searchResults.find(
          (item) =>
            item?.quoteType ===
              "EQUITY" &&
            item?.symbol?.endsWith(
              ".BO",
            ),
        ) ||
        searchResults.find(
          (item) =>
            item?.quoteType ===
            "EQUITY",
        ) ||
        searchResults[0];

      if (!selectedStock?.symbol) {
        throw new Error(
          "A valid stock symbol was not found.",
        );
      }

      const stockData =
        await getStockData(
          selectedStock.symbol,
          RANGE_MAP[timeframe],
        );

      if (!stockData?.symbol) {
        throw new Error(
          "Yahoo Finance returned incomplete stock data.",
        );
      }

      const liveResult =
        createLiveResult(
          stockData,
          selectedStock,
        );

      setResult(liveResult);
      setQuery("");
      saveRecentAnalysis({
       stockData,
       analysis: liveResult,
          });

      try {
        const aiAnalysis =
          await getAiAnalysis(
            stockData,
          );

        if (
          !aiAnalysis ||
          typeof aiAnalysis !==
            "object"
        ) {
          throw new Error(
            "The AI returned incomplete analysis data.",
          );
        }

        const completeResult =
          mergeAiAnalysis(
            liveResult,
            aiAnalysis,
          );

        setResult(completeResult);

        saveRecentAnalysis({
          stockData,
          analysis: completeResult,
        });

        setAiNotice("");
      } catch (aiError) {
        console.error(
          "AI analysis unavailable:",
          aiError,
        );

        if (isAiLimitError(aiError)) {
          setAiNotice(
            "The AI summary is temporarily unavailable because the free Gemini usage limit was reached. Live Finance prices, metrics and chart data are still available.",
          );
        } else {
          setAiNotice(
            "The AI summary is temporarily unavailable. Live Finance prices, metrics and chart data are still available.",
          );
        }

        setResult(liveResult);
      }
    } catch (caughtError) {
      console.error(
        "Stock data error:",
        caughtError,
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to retrieve this stock.",
      );
    } finally {
      setLoading(false);
    }
  }

  function closeSuggestions() {
    suggestionRequestRef.current += 1;
    setShowSuggestions(false);
    setSuggestions([]);
    setSuggestionsLoading(false);
    setActiveSuggestionIndex(-1);
    setActiveSearchSource(null);
  }

  function selectSuggestion(
    suggestion,
  ) {
    if (!suggestion?.symbol) {
      return;
    }

    closeSuggestions();
    setQuery("");
    analyze(suggestion);
  }

  function handleSearchChange(
    source,
    event,
  ) {
    setActiveSearchSource(source);
    setQuery(event.target.value);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
  }

  function handleSearchFocus(source) {
    setActiveSearchSource(source);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);

    if (!query.trim()) {
      setSuggestions(
        POPULAR_STOCKS,
      );
      setSuggestionsLoading(false);
    }
  }

  function handleSearchBlur(source) {
    window.setTimeout(() => {
      setActiveSearchSource(
        (currentSource) =>
          currentSource === source
            ? null
            : currentSource,
      );
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }, 180);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (
      !showSuggestions ||
      suggestions.length === 0
    ) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveSuggestionIndex(
        (current) =>
          current >=
          suggestions.length - 1
            ? 0
            : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveSuggestionIndex(
        (current) =>
          current <= 0
            ? suggestions.length - 1
            : current - 1,
      );
      return;
    }

    if (
      event.key === "Enter" &&
      activeSuggestionIndex >= 0
    ) {
      event.preventDefault();

      selectSuggestion(
        suggestions[
          activeSuggestionIndex
        ],
      );
    }
  }

  useEffect(() => {
    const parameters =
      new URLSearchParams(
        location.search,
      );

    const requestedStock = String(
      parameters.get("symbol") ||
        parameters.get("query") ||
        "",
    ).trim();

    if (
      !requestedStock ||
      autoAnalyzeRef.current ===
        requestedStock
    ) {
      return;
    }

    autoAnalyzeRef.current =
      requestedStock;
    setQuery(requestedStock);
    analyze(requestedStock);
  }, [location.search]);

  async function handleTimeframeChange(nextTimeframe) {
    if (
      !TIMEFRAMES.includes(nextTimeframe) ||
      chartLoading ||
      nextTimeframe === timeframe
    ) {
      return;
    }

    const previousTimeframe = timeframe;

    setTimeframe(nextTimeframe);

    if (!result?.symbol) {
      return;
    }

    setChartLoading(true);
    setError("");

    try {
      const updatedStockData = await getStockData(
        result.symbol,
        RANGE_MAP[nextTimeframe],
      );

      setResult((currentResult) => {
        if (!currentResult) {
          return currentResult;
        }

        return {
          ...currentResult,
          chart: Array.isArray(
            updatedStockData?.chart,
          )
            ? updatedStockData.chart
            : [],
          price:
            updatedStockData?.price ??
            currentResult.price,
          changeAbs:
            updatedStockData?.change ??
            currentResult.changeAbs,
          changePercent:
            updatedStockData?.changePercent ??
            currentResult.changePercent,
          marketCap:
            updatedStockData?.marketCap ??
            currentResult.marketCap,
          peRatio:
            updatedStockData?.peRatioTTM ??
            currentResult.peRatio,
          week52Low:
            updatedStockData?.fiftyTwoWeekLow ??
            currentResult.week52Low,
          week52High:
            updatedStockData?.fiftyTwoWeekHigh ??
            currentResult.week52High,
          volume:
            updatedStockData?.volume ??
            currentResult.volume,
          lastUpdated:
            updatedStockData?.lastUpdated ??
            currentResult.lastUpdated,
          source:
            updatedStockData?.source ??
            currentResult.source,
        };
      });
    } catch (caughtError) {
      console.error(
        "Chart update error:",
        caughtError,
      );

      setTimeframe(previousTimeframe);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the chart.",
      );
    } finally {
      setChartLoading(false);
    }
  }

  const chartData = useMemo(() => {
    if (
      !result ||
      !Array.isArray(result.chart)
    ) {
      return [];
    }

    return result.chart
      .filter(
        (item) =>
          item?.close !== null &&
          item?.close !== undefined &&
          Number.isFinite(Number(item.close)),
      )
      .map((item, index) => ({
        i: index,
        date: item.date,
        price: Number(item.close),
        open: item.open,
        high: item.high,
        low: item.low,
        volume: item.volume,
      }));
  }, [result]);

  const sig = result
    ? SIGNAL_STYLE[result.signal] ||
      SIGNAL_STYLE.NEUTRAL
    : null;

  const changePercent =
    Number(result?.changePercent) || 0;

  const changeAbs =
    Number(result?.changeAbs) || 0;

  const updatedTime =
    formatUpdatedTime(result?.lastUpdated);

  return (
    <AppShell>
      <style>{ANALYZE_LAYOUT_STYLES}</style>

      <main className="exa-dashboard-page exa-dashboard-v2 exa-analyze-page">
        <div className="exa-analyze-container">
        
          {/* Full search card at the top of the page */}
          <section
            ref={searchSectionRef}
            className="exa-analyze-home-search"
          >
            <form
              className="exa-analyze-search-form exa-search-with-icon-button"
              onSubmit={(event) => {
                event.preventDefault();
                analyze();
              }}
            >
              <div className="exa-analyze-search-field">
                <input
                  type="search"
                  value={query}
                  onChange={(event) =>
                    handleSearchChange(
                      "main",
                      event,
                    )
                  }
                  onFocus={() =>
                    handleSearchFocus(
                      "main",
                    )
                  }
                  onBlur={() =>
                    handleSearchBlur(
                      "main",
                    )
                  }
                  onKeyDown={
                    handleSearchKeyDown
                  }
                  placeholder="Search Reliance, Infosys, HDFC Bank or NSE ticker..."
                  disabled={loading}
                  className="exa-analyze-search-input"
                  autoComplete="off"
                  aria-label="Search Indian stocks"
                  aria-autocomplete="list"
                  aria-expanded={
                    showSuggestions &&
                    activeSearchSource ===
                      "main"
                  }
                  aria-controls="main-stock-suggestion-list"
                  aria-activedescendant={
                    activeSuggestionIndex >=
                    0
                      ? `main-stock-suggestion-list-option-${activeSuggestionIndex}`
                      : undefined
                  }
                />

                <button
                  type="submit"
                  className="exa-analyze-lens-button"
                  disabled={
                    loading ||
                    !query.trim()
                  }
                  aria-label="Analyze stock"
                  title="Analyze stock"
                >
                  {loading ? (
                    <LoaderCircle
                      size={18}
                      className="exa-analyze-spinner"
                    />
                  ) : (
                    <Search size={19} />
                  )}
                </button>

                {showSuggestions &&
                  activeSearchSource ===
                    "main" && (
                    <StockSuggestionList
                      listboxId="main-stock-suggestion-list"
                      title={
                        query.trim()
                          ? "Matching stocks"
                          : "Popular stocks"
                      }
                      suggestions={
                        suggestions
                      }
                      suggestionsLoading={
                        suggestionsLoading
                      }
                      activeSuggestionIndex={
                        activeSuggestionIndex
                      }
                      onSelect={
                        selectSuggestion
                      }
                      onActivate={
                        setActiveSuggestionIndex
                      }
                    />
                  )}
              </div>
            </form>

          </section>

          {/* Compact search appears only after scrolling */}
          {result &&
            showFloatingSearch && (
              <section
                className="exa-analyze-floating-search"
                aria-label="Quick stock search"
              >
                <form
                  className="exa-analyze-nav-search-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    analyze();
                  }}
                >
                  <div className="exa-analyze-nav-search-field">
                    <input
                      type="search"
                      value={query}
                      onChange={(event) =>
                        handleSearchChange(
                          "floating",
                          event,
                        )
                      }
                      onFocus={() =>
                        handleSearchFocus(
                          "floating",
                        )
                      }
                      onBlur={() =>
                        handleSearchBlur(
                          "floating",
                        )
                      }
                      onKeyDown={
                        handleSearchKeyDown
                      }
                      placeholder="Analyze another stock..."
                      disabled={loading}
                      className="exa-analyze-nav-search-input"
                      autoComplete="off"
                      aria-label="Analyze another stock"
                      aria-autocomplete="list"
                      aria-expanded={
                        showSuggestions &&
                        activeSearchSource ===
                          "floating"
                      }
                      aria-controls="nav-stock-suggestion-list"
                      aria-activedescendant={
                        activeSuggestionIndex >=
                        0
                          ? `nav-stock-suggestion-list-option-${activeSuggestionIndex}`
                          : undefined
                      }
                    />

                    <button
                      type="submit"
                      className="exa-analyze-nav-lens-button"
                      disabled={
                        loading ||
                        !query.trim()
                      }
                      aria-label="Analyze stock"
                      title="Analyze stock"
                    >
                      {loading ? (
                        <LoaderCircle
                          size={17}
                          className="exa-analyze-spinner"
                        />
                      ) : (
                        <Search
                          size={18}
                        />
                      )}
                    </button>

                    {showSuggestions &&
                      activeSearchSource ===
                        "floating" && (
                        <StockSuggestionList
                          listboxId="nav-stock-suggestion-list"
                          title={
                            query.trim()
                              ? "Matching stocks"
                              : "Popular stocks"
                          }
                          suggestions={
                            suggestions
                          }
                          suggestionsLoading={
                            suggestionsLoading
                          }
                          activeSuggestionIndex={
                            activeSuggestionIndex
                          }
                          onSelect={
                            selectSuggestion
                          }
                          onActivate={
                            setActiveSuggestionIndex
                          }
                        />
                      )}
                  </div>
                </form>
              </section>
            )}

          <section className="exa-analyze-hero">
            <div className="exa-analyze-hero-content">
              <div className="exa-analyze-title-row">
                <div>
                  <p className="exa-analyze-eyebrow">
                    LITSES AI RESEARCH
                  </p>

                  <h1 className="exa-analyze-title">
                    Analyze Indian stocks with live market intelligence
                  </h1>

                  <p className="exa-analyze-subtitle">
                    Search an NSE or BSE company to view live prices,
                    market metrics, charts, AI research signals,
                    opportunities and key risks.
                  </p>
                </div>
                
                <span className="exa-analyze-ai-badge">
                  <Sparkles size={14} />
                  AI-assisted research
                </span>
              </div>
            </div>
          </section>

          {!result?.symbol && !result?.ticker && !loading && (
          <ResearchDisclaimer compact />
          )}
                    {error && (
            <div className="exa-analyze-message error">
              <AlertTriangle
                size={16}
                aria-hidden="true"
              />

              <div>
                <strong>
                  Analysis unavailable
                </strong>

                <div>{error}</div>
              </div>
            </div>
          )}

          
          {aiNotice && (
            <div className="exa-analyze-message notice">
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              <div>
                <strong>AI notice</strong>
                <div>{aiNotice}</div>
              </div>
            </div>
          )}
          
          {loading && !result && (
            <div className="exa-analyze-loading-state">
              <LoaderCircle
                size={30}
                className="exa-analyze-spinner"
              />

              <strong>
                Building your stock research report
              </strong>

              <span>
                Loading live prices, metrics and AI insights…
              </span>
            </div>
          )}

          {!result &&
            !loading &&
            !error && (
              <section className="exa-analyze-empty-state">
                <div className="exa-analyze-empty-icon">
                  <Search size={27} />
                </div>

                <h2>
                  Start your stock research
                </h2>

                <p>
                  Enter a company name or select a popular stock above.
                  Litses will combine live Yahoo Finance data with
                  AI-assisted educational research.
                </p>

                <div className="exa-analyze-feature-grid">
                  <div className="exa-analyze-feature">
                    <BarChart3 size={19} />

                    <strong>
                      Live market metrics
                    </strong>
                    
                    <span>
                      Price, market cap, valuation, volume and
                      52-week range.
                    </span>
                  </div>

                  <div className="exa-analyze-feature">
                    <Sparkles size={19} />

                    <strong>
                      AI research signals
                    </strong>

                    <span>
                      Structured summaries, themes, growth drivers
                      and risk factors.
                    </span>
                  </div>

                  <div className="exa-analyze-feature">
                    <ShieldCheck size={19} />

                    <strong>
                      Risk-aware insights
                    </strong>

                    <span>
                      Educational research indicators, not
                      personalized financial advice.
                    </span>
                  </div>
                </div>
              </section>
            )}
            
          {result && sig && (
            <section className="exa-analyze-results-layout">
              <div className="exa-analyze-main-column">
                <section className="exa-stock-overview-card">
                  <div className="exa-stock-overview-top">
                    <div className="exa-stock-company">
                      <CompanyLogo
                        domain={result.logoDomain}
                        name={result.company}
                        size={58}
                      />

                      <div className="exa-stock-company-copy">
                        <div className="exa-stock-company-name-row">
                          <h2 title={result.company}>
                           {result.company}
                          </h2>

                          <button
                            type="button"
                            className="exa-stock-watch-button"
                            aria-label={`Add ${result.company} to watchlist`}
                          >
                            <Star size={16} />
                          </button>
                        </div>
                        
                        <div className="exa-stock-company-meta">
                          <span className="exa-stock-ticker">
                            {result.ticker}
                          </span>

                          <span aria-hidden="true">•</span>

                          <span>
                            {result.sector || "Sector unavailable"}
                          </span>

                          {result.industry &&
                            result.industry !== "N/A" && (
                              <>
                                <span aria-hidden="true">•</span>
                                <span>{result.industry}</span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                    
                    <div
                      className="exa-stock-ai-view"
                      style={{
                        "--exa-signal-color": sig.color,
                        "--exa-signal-bg": sig.bg,
                      }}
                    >
                      {changePercent >= 0 ? (
                        <TrendingUp size={15} />
                      ) : (
                        <TrendingDown size={15} />
                      )}

                      <span>
                        {result.aiAvailable
                          ? `AI view: ${sig.label}`
                          
                          : "AI view unavailable"}
                      </span>
                    </div>
                    <MarketDataStatus
                 loading={loading}
                   error={error}
                  symbol={result.symbol}
                   price={result.price}
                 lastUpdated={result.lastUpdated}
                 source={
                    result.source || "Yahoo Finance"
                  }
                  marketState={result.marketState}
                    compact
                  className="exa-analyze-market-status"
                  />
                  </div>

                  <div className="exa-stock-price-section">
                    <div>
                      <p className="exa-stock-price-label">
                        Current market price
                      </p>

                      <div className="exa-stock-price-row">
                        <strong>
                          ₹{formatPrice(result.price)}
                        </strong>

                        <span
                          className={
                            changePercent >= 0
                              ? "exa-stock-change positive"
                              : "exa-stock-change negative"
                          }
                        >
                          {changePercent >= 0 ? "▲" : "▼"}

                          {formatMetric(
                            Math.abs(changeAbs),
                          )}

                          <small>
                            (
                            {formatMetric(
                              Math.abs(changePercent),
                            )}
                            %)
                          </small>
                        </span>
                      </div>

                      <p className="exa-stock-price-caption">
                        Latest available market quote
                      </p>
                    </div>

                    {/* <div className="exa-stock-data-status">
                      <span className="exa-live-dot" />

                      <div>
                        <strong>Market source</strong>

                        <small>
                          {result.source || "Yahoo Finance"}
                        </small>
                      </div>
                    </div> */}
                  </div>
                </section>

                <section className="exa-stock-metrics-grid">
                  <article className="exa-stock-metric-card">
                    <span className="exa-stock-metric-icon">
                      <Building2 size={18} />
                    </span>

                    <div>
                      <p>Market cap</p>

                      <strong>
                        {formatIndianLargeNumber(
                          result.marketCap,
                        )}
                      </strong>

                      <small>Company valuation</small>
                    </div>
                  </article>

                  <article className="exa-stock-metric-card">
                    <span className="exa-stock-metric-icon">
                      <BarChart3 size={18} />
                    </span>

                    <div>
                      <p>P/E ratio</p>

                      <strong>
                        {formatMetric(result.peRatio)}
                      </strong>

                      <small>Trailing twelve months</small>
                    </div>
                  </article>

                  <article className="exa-stock-metric-card">
                    <span className="exa-stock-metric-icon">
                      <ArrowUpDown size={18} />
                    </span>

                    <div>
                      <p>52-week range</p>

                     <div className="exa-stock-range-values">
  <div>
    <span>Low</span>

    <strong>
      ₹{formatMetric(result.week52Low)}
    </strong>
  </div>

  <div>
    <span>High</span>

    <strong>
      ₹{formatMetric(result.week52High)}
    </strong>
  </div>
</div>

                      <small>Annual price range</small>
                    </div>
                  </article>

                  <article className="exa-stock-metric-card">
                    <span className="exa-stock-metric-icon">
                      <Database size={18} />
                    </span>

                    <div>
                      <p>Volume</p>

                      <strong>
                        {formatIndianLargeNumber(
                          result.volume,
                        )}
                      </strong>

                      <small>Latest traded quantity</small>
                    </div>
                  </article>
                </section>

                <section className="exa-price-chart-card">
                  <div className="exa-price-chart-header">
                    <div>
                      <div className="exa-price-chart-heading">
                        <span className="exa-price-chart-icon">
                          <BarChart3 size={17} />
                        </span>

                        <div>
                          <p>PRICE PERFORMANCE</p>

                          <h3>
                            {result.company} market chart
                          </h3>
                        </div>
                      </div>

                      <div className="exa-price-chart-summary">
                        <strong>
                          ₹{formatPrice(result.price)}
                        </strong>

                        <span
                          className={
                            changePercent >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {changePercent >= 0 ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}

                          {changePercent >= 0 ? "+" : "-"}
                          {formatMetric(
                            Math.abs(changePercent),
                          )}
                          %
                        </span>
                      </div>
                    </div>
                                        
                  </div>

                  <div className="exa-chart-timeframes">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        type="button"
                        key={tf}
                        onClick={() =>
                          handleTimeframeChange(tf)
                        }
                        disabled={chartLoading}
                        className={
                          timeframe === tf
                            ? "exa-chart-timeframe active"
                            : "exa-chart-timeframe"
                        }
                        aria-pressed={timeframe === tf}
                      >
                        {chartLoading &&
                        timeframe === tf
                          ? "..."
                          : tf}
                      </button>
                    ))}
                  </div>

                  <div className="exa-price-chart-area">
                    {chartLoading ? (
                      <div className="exa-chart-state">
                        <LoaderCircle
                          size={27}
                          className="exa-analyze-spinner"
                        />

                        <strong>
                          Updating market chart
                        </strong>

                        <span>
                          Loading the selected price range…
                        </span>
                      </div>
                    ) : chartData.length > 0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <AreaChart
                          data={chartData}
                          margin={{
                            top: 12,
                            right: 10,
                            bottom: 4,
                            left: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="exaPremiumPriceFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={
                                  changePercent >= 0
                                    ? "#3b82f6"
                                    : "#f43f5e"
                                }
                                stopOpacity={0.34}
                              />

                              <stop
                                offset="70%"
                                stopColor={
                                  changePercent >= 0
                                    ? "#3b82f6"
                                    : "#f43f5e"
                                }
                                stopOpacity={0.06}
                              />

                              <stop
                                offset="100%"
                                stopColor={
                                  changePercent >= 0
                                    ? "#3b82f6"
                                    : "#f43f5e"
                                }
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            stroke="rgba(148, 163, 184, 0.10)"
                            strokeDasharray="4 5"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            minTickGap={34}
                            tick={{
                              fill: "#64748b",
                              fontSize: 10,
                            }}
                            tickFormatter={(value) =>
                              formatChartDate(
                                value,
                                timeframe,
                              )
                            }
                          />

                          <YAxis
                            domain={[
                              "dataMin",
                              "dataMax",
                            ]}
                            axisLine={false}
                            tickLine={false}
                            width={62}
                            tick={{
                              fill: "#64748b",
                              fontSize: 10,
                            }}
                            tickFormatter={(value) =>
                              `₹${formatMetric(
                                value,
                                0,
                              )}`
                            }
                          />

                          <Tooltip
                            cursor={{
                              stroke:
                                "rgba(96, 165, 250, 0.4)",
                              strokeWidth: 1,
                              strokeDasharray: "4 4",
                            }}
                            contentStyle={{
                              padding: "11px 13px",
                              border:
                                "1px solid rgba(148, 163, 184, 0.18)",
                              borderRadius: 12,
                              background:
                                "rgba(7, 17, 31, 0.96)",
                              boxShadow:
                                "0 18px 45px rgba(0, 0, 0, 0.34)",
                              color: "#f8fafc",
                            }}
                            labelStyle={{
                              marginBottom: 5,
                              color: "#94a3b8",
                              fontSize: 10,
                            }}
                            itemStyle={{
                              color: "#dbeafe",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                            labelFormatter={(value) =>
                              formatChartTooltipDate(
                                value,
                              )
                            }
                            formatter={(value) => [
                              `₹${formatPrice(value)}`,
                              "Closing price",
                            ]}
                          />

                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={
                              changePercent >= 0
                                ? "#60a5fa"
                                : "#fb7185"
                            }
                            strokeWidth={2.4}
                            fill="url(#exaPremiumPriceFill)"
                            activeDot={{
                              r: 5,
                              strokeWidth: 3,
                              stroke: "#07111f",
                              fill:
                                changePercent >= 0
                                  ? "#60a5fa"
                                  : "#fb7185",
                            }}
                            isAnimationActive
                            animationDuration={650}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="exa-chart-state">
                        <BarChart3 size={28} />

                        <strong>
                          Chart data unavailable
                        </strong>

                        <span>
                          Live price information is still
                          available above.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="exa-price-chart-footer">
                    <span>
                      Source:{" "}
                      {result.source || "Market data"}
                    </span>

                    <span>
                      Range: {timeframe}
                    </span>

                    {updatedTime && (
                      <span>
                        Updated {updatedTime}
                      </span>
                    )}
                  </div>
                </section>

                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    borderBottom:
                      "1px solid var(--exa-border)",
                    overflowX: "auto",
                  }}
                >
                  {[
                    "Overview",
                    "Fundamentals",
                    "Technicals",
                    "News",
                    "Risks",
                    "Financials",
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab}
                      onClick={() =>
                        setActiveTab(tab)
                      }
                      style={{
                        padding: "10px 16px",
                        fontSize: 14,
                        cursor: "pointer",
                        border: "none",
                        background: "transparent",
                        color:
                          activeTab === tab
                            ? "var(--exa-primary-hover)"
                            : "var(--exa-text-secondary)",
                        borderBottom:
                          activeTab === tab
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

               {activeTab === "Overview" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "repeat(2, minmax(0, 1fr))"
        : "repeat(4, minmax(0, 1fr))",
      gap: 12,
    }}
  >
    <ScoreCard
      title="Fundamental score"
      score={result.fundamentalScore}
      scoreLabel={result.fundamentalLabel}
    />

    <ScoreCard
      title="Momentum score"
      score={result.momentumScore}
      scoreLabel={result.momentumLabel}
    />

    <ScoreCard
      title="Valuation score"
      score={result.valuationScore}
      scoreLabel={result.valuationLabel}
    />

    <ScoreCard
      title="Sentiment score"
      score={result.sentimentScore}
      scoreLabel={result.sentimentLabel}
    />
  </div>
)}
{activeTab === "Fundamentals" && (
  <FundamentalsTab
    result={result}
  />
)}

{activeTab === "Technicals" && (
  <TechnicalsTab
    chart={
      Array.isArray(result.chart)
        ? result.chart
        : []
    }
    currency={result.currency || "INR"}
    timeframe={timeframe}
  />
)}

{activeTab === "Risks" && (
  <RisksTab
    result={result}
    timeframe={timeframe}
  />
)}
{activeTab === "Financials" && (
  <FinancialsTab
    result={result}
  />
)}
{activeTab === "News" && (
  <NewsTab
    symbol={result.symbol}
    company={result.company}
  />
)}

{![
  "Overview",
  "Fundamentals",
  "Technicals",
  "Risks",
  "Financials",
  "News"
].includes(activeTab) && (
  <div
    style={{
      padding: 24,
      textAlign: "center",
      color: "#475569",
      fontSize: 14,
    }}
  >
    The {activeTab} tab is part of the Litses roadmap and
    will be added in a later phase.
  </div>
)}
              </div>

              <aside className="exa-analyze-right-rail">
                <div className="exa-analyze-right-scroll">
                  <PremiumAiResearchPanel
                    result={result}
                    aiNotice={aiNotice}
                  />

                  {activeTab !== "News" && (
  <StockNewsPanel
    symbol={result.symbol}
    company={result.company}
    onViewAll={() =>
      setActiveTab("News")
    }
  />
)}
                </div>
              </aside>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}


