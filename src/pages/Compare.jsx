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
  Award,
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
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
const SEARCH_RESULT_LIMIT = 8;
const COMPARE_SELECTION_STORAGE_KEY =
  "exa-screener-compare-selection-v1";

const SCORE_CATEGORIES = [
  {
    key: "quality",
    label: "Growth & quality",
    description:
      "Revenue growth, earnings growth, ROE and profit margin.",
    weight: 0.35,
    metrics: [
      {
        key: "revenueGrowthPercent",
        direction: "high",
        weight: 0.25,
      },
      {
        key: "earningsGrowthPercent",
        direction: "high",
        weight: 0.2,
      },
      {
        key: "returnOnEquityPercent",
        direction: "high",
        weight: 0.3,
      },
      {
        key: "profitMarginsPercent",
        direction: "high",
        weight: 0.25,
      },
    ],
  },
  {
    key: "valuation",
    label: "Valuation",
    description:
      "Lower positive valuation multiples and higher dividend yield.",
    weight: 0.25,
    metrics: [
      {
        key: "peRatio",
        direction: "low-positive",
        weight: 0.4,
      },
      {
        key: "forwardPE",
        direction: "low-positive",
        weight: 0.25,
      },
      {
        key: "priceToBook",
        direction: "low-positive",
        weight: 0.2,
      },
      {
        key: "dividendYield",
        direction: "high",
        weight: 0.15,
      },
    ],
  },
  {
    key: "financialHealth",
    label: "Financial health",
    description:
      "Debt control, liquidity, cash coverage and free-cash-flow margin.",
    weight: 0.2,
    metrics: [
      {
        key: "debtToEquity",
        direction: "low",
        weight: 0.35,
      },
      {
        key: "currentRatioScore",
        direction: "absolute",
        weight: 0.25,
      },
      {
        key: "cashCoverage",
        direction: "high",
        weight: 0.2,
      },
      {
        key: "freeCashflowMargin",
        direction: "high",
        weight: 0.2,
      },
    ],
  },
  {
    key: "momentum",
    label: "Momentum",
    description:
      "Trend alignment, balanced RSI, proximity to the annual high and daily move.",
    weight: 0.2,
    metrics: [
      {
        key: "trendScore",
        direction: "absolute",
        weight: 0.35,
      },
      {
        key: "rsiFitness",
        direction: "absolute",
        weight: 0.25,
      },
      {
        key: "distanceFrom52WeekHigh",
        direction: "low",
        weight: 0.25,
      },
      {
        key: "changePercent",
        direction: "high",
        weight: 0.15,
      },
    ],
  },
];

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

  .exa-compare-tools {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    margin-bottom: 14px;
  }

  .exa-compare-add-panel {
    position: relative;
    min-width: 0;
    padding: 13px;
    border: 1px solid #1e3350;
    border-radius: 14px;
    background: #0a1628;
  }

  .exa-compare-add-heading {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 9px;
    color: #e2e8f0;
    font-size: 10px;
    font-weight: 800;
  }

  .exa-compare-search-wrap {
    position: relative;
  }

  .exa-compare-search-wrap > svg {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .exa-compare-search-input {
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

  .exa-compare-search-input:focus {
    border-color: rgba(34, 211, 238, 0.55);
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
  }

  .exa-compare-search-input:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .exa-compare-search-results {
    position: absolute;
    z-index: 20;
    top: calc(100% + 7px);
    left: 0;
    right: 0;
    max-height: 290px;
    overflow-y: auto;
    border: 1px solid #29405f;
    border-radius: 12px;
    background: #0d1a2e;
    box-shadow: 0 18px 45px rgba(2, 8, 23, 0.52);
  }

  .exa-compare-search-state {
    padding: 13px;
    color: #94a3b8;
    font-size: 10px;
    text-align: center;
  }

  .exa-compare-search-result {
    width: 100%;
    padding: 10px 12px;
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

  .exa-compare-search-result:last-child {
    border-bottom: 0;
  }

  .exa-compare-search-result:hover {
    background: rgba(37, 99, 235, 0.1);
  }

  .exa-compare-search-result-copy {
    min-width: 0;
    flex: 1;
  }

  .exa-compare-search-result-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-compare-search-result-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-compare-search-add {
    width: 27px;
    height: 27px;
    border: 1px solid rgba(34, 211, 238, 0.25);
    border-radius: 8px;
    color: #67e8f9;
    background: rgba(34, 211, 238, 0.07);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .exa-compare-share-button {
    min-height: 66px;
    padding: 10px 14px;
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 14px;
    color: #dbeafe;
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.18),
      rgba(79, 70, 229, 0.14)
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .exa-compare-action-message {
    padding: 9px 11px;
    margin: -4px 0 14px;
    border: 1px solid rgba(34, 211, 238, 0.18);
    border-radius: 10px;
    color: #bae6fd;
    background: rgba(8, 47, 73, 0.12);
    font-size: 9px;
  }

  .exa-compare-score-section {
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-compare-score-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 13px;
  }

  .exa-compare-score-heading-main {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }

  .exa-compare-score-heading h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 14px;
  }

  .exa-compare-score-heading p {
    max-width: 760px;
    margin: 5px 0 0;
    color: #64748b;
    font-size: 9px;
    line-height: 1.6;
  }

  .exa-compare-score-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(225px, 1fr));
    gap: 10px;
  }

  .exa-compare-score-card {
    min-width: 0;
    padding: 13px;
    border: 1px solid #1e3350;
    border-radius: 13px;
    background: #0d1a2e;
  }

  .exa-compare-score-card.leader {
    border-color: rgba(34, 211, 238, 0.38);
    background: linear-gradient(
      145deg,
      rgba(8, 47, 73, 0.25),
      rgba(30, 41, 59, 0.9)
    );
  }

  .exa-compare-score-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .exa-compare-score-company {
    min-width: 0;
  }

  .exa-compare-score-company strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-compare-score-company span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-compare-overall-score {
    flex-shrink: 0;
    color: #67e8f9;
    font-size: 21px;
    font-weight: 900;
  }

  .exa-compare-overall-score small {
    color: #64748b;
    font-size: 8px;
  }

  .exa-compare-score-rank {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 7px;
    margin-top: 9px;
    border: 1px solid #29405f;
    border-radius: 999px;
    color: #93c5fd;
    background: #101e34;
    font-size: 8px;
    font-weight: 800;
  }

  .exa-compare-category-list {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }

  .exa-compare-category-row {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr) 31px;
    align-items: center;
    gap: 7px;
  }

  .exa-compare-category-row span,
  .exa-compare-category-row strong {
    font-size: 8px;
  }

  .exa-compare-category-row span {
    overflow: hidden;
    color: #94a3b8;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-compare-category-row strong {
    color: #cbd5e1;
    text-align: right;
  }

  .exa-compare-score-track {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: #17263d;
  }

  .exa-compare-score-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #2563eb, #22d3ee);
  }

  .exa-compare-coverage {
    margin-top: 10px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-compare-winner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 9px;
    margin-top: 12px;
  }

  .exa-compare-winner-card {
    padding: 12px;
    border: 1px solid #1e3350;
    border-radius: 12px;
    background: rgba(16, 30, 52, 0.74);
  }

  .exa-compare-winner-card > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #60a5fa;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .exa-compare-winner-card strong {
    display: block;
    margin-top: 7px;
    color: #f8fafc;
    font-size: 11px;
  }

  .exa-compare-winner-card p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 8px;
    line-height: 1.55;
  }

  .exa-compare-method-note {
    margin: 12px 0 0;
    color: #64748b;
    font-size: 8px;
    line-height: 1.6;
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

    .exa-compare-tools {
      grid-template-columns: 1fr;
    }

    .exa-compare-share-button {
      min-height: 42px;
      width: 100%;
    }

    .exa-compare-score-heading {
      flex-direction: column;
    }
  }
`;

function cleanText(value) {
  return String(value ?? "").trim();
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
    const nestedMessage =
      value.message ||
      value.error ||
      value.details;

    if (
      typeof nestedMessage ===
        "string" &&
      nestedMessage.trim()
    ) {
      return nestedMessage.trim();
    }
  }

  return fallback;
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

function clampScore(value) {
  const number = numericValue(value);

  if (number === null) {
    return null;
  }

  return Math.min(
    Math.max(number, 0),
    100,
  );
}

function roundScore(value) {
  const number = numericValue(value);

  if (number === null) {
    return null;
  }

  return Math.round(number);
}

function getTrendScore(trend) {
  const scores = {
    Bullish: 100,
    Positive: 78,
    Sideways: 52,
    Negative: 28,
    Bearish: 8,
  };

  return scores[cleanText(trend)] ?? 40;
}

function getRsiFitnessScore(value) {
  const rsi = numericValue(value);

  if (rsi === null) {
    return null;
  }

  if (rsi >= 50 && rsi <= 65) {
    return 100;
  }

  if (rsi < 50) {
    return clampScore(
      100 - (50 - rsi) * 2.4,
    );
  }

  return clampScore(
    100 - (rsi - 65) * 2.85,
  );
}

function getCurrentRatioScore(value) {
  const ratio = numericValue(value);

  if (ratio === null || ratio < 0) {
    return null;
  }

  if (ratio <= 1) {
    return clampScore(ratio * 55);
  }

  if (ratio <= 2) {
    return clampScore(
      55 + (ratio - 1) * 35,
    );
  }

  if (ratio <= 4) {
    return clampScore(
      90 + (ratio - 2) * 5,
    );
  }

  return clampScore(
    100 - (ratio - 4) * 5,
  );
}

function getScoreMetricValue(
  stock,
  metricKey,
) {
  switch (metricKey) {
    case "trendScore":
      return getTrendScore(
        stock?.trend,
      );

    case "rsiFitness":
      return getRsiFitnessScore(
        stock?.rsi,
      );

    case "currentRatioScore":
      return getCurrentRatioScore(
        stock?.currentRatio,
      );

    case "cashCoverage": {
      const cash = numericValue(
        stock?.totalCash,
      );

      const debt = numericValue(
        stock?.totalDebt,
      );

      if (cash === null || debt === null) {
        return null;
      }

      if (debt <= 0) {
        return cash > 0 ? 5 : null;
      }

      return cash / debt;
    }

    case "freeCashflowMargin": {
      const freeCashflow = numericValue(
        stock?.freeCashflow,
      );

      const revenue = numericValue(
        stock?.totalRevenue,
      );

      if (
        freeCashflow === null ||
        revenue === null ||
        revenue === 0
      ) {
        return null;
      }

      return (
        freeCashflow /
        Math.abs(revenue)
      ) * 100;
    }

    default:
      return numericValue(
        stock?.[metricKey],
      );
  }
}

function getMetricScoreMap(
  metric,
  stocks,
) {
  const scoreMap = new Map();

  const values = stocks
    .map((stock) => ({
      symbol: stock.symbol,
      value: getScoreMetricValue(
        stock,
        metric.key,
      ),
    }))
    .filter((item) => {
      if (item.value === null) {
        return false;
      }

      if (
        metric.direction ===
          "low-positive" &&
        item.value <= 0
      ) {
        return false;
      }

      return true;
    });

  if (metric.direction === "absolute") {
    values.forEach((item) => {
      scoreMap.set(
        item.symbol,
        clampScore(item.value),
      );
    });

    return scoreMap;
  }

  if (values.length === 0) {
    return scoreMap;
  }

  const rawValues = values.map(
    (item) => item.value,
  );

  const minimum = Math.min(
    ...rawValues,
  );

  const maximum = Math.max(
    ...rawValues,
  );

  values.forEach((item) => {
    let score = 70;

    if (maximum !== minimum) {
      const normalized =
        (item.value - minimum) /
        (maximum - minimum);

      score =
        metric.direction === "high"
          ? normalized * 100
          : (1 - normalized) * 100;
    }

    scoreMap.set(
      item.symbol,
      clampScore(score),
    );
  });

  return scoreMap;
}

function getLeaderSymbols(
  entries,
  scoreGetter,
) {
  const validEntries = entries.filter(
    (entry) =>
      numericValue(
        scoreGetter(entry),
      ) !== null,
  );

  if (validEntries.length === 0) {
    return [];
  }

  const highestScore = Math.max(
    ...validEntries.map(
      (entry) =>
        numericValue(
          scoreGetter(entry),
        ),
    ),
  );

  return validEntries
    .filter(
      (entry) =>
        Math.abs(
          numericValue(
            scoreGetter(entry),
          ) - highestScore,
        ) < 0.51,
    )
    .map((entry) => entry.symbol);
}

function calculateComparisonScores(
  stocks,
) {
  if (!Array.isArray(stocks)) {
    return {
      entries: [],
      overallLeaders: [],
      categoryLeaders: {},
    };
  }

  const categoryMetricScores =
    new Map();

  SCORE_CATEGORIES.forEach(
    (category) => {
      category.metrics.forEach(
        (metric) => {
          categoryMetricScores.set(
            `${category.key}:${metric.key}`,
            getMetricScoreMap(
              metric,
              stocks,
            ),
          );
        },
      );
    },
  );

  const entries = stocks.map(
    (stock) => {
      const categories = {};
      let overallWeightedScore = 0;
      let overallAvailableWeight = 0;
      let availableMetrics = 0;
      let totalMetrics = 0;

      SCORE_CATEGORIES.forEach(
        (category) => {
          let categoryWeightedScore = 0;
          let categoryAvailableWeight = 0;

          category.metrics.forEach(
            (metric) => {
              totalMetrics += 1;

              const metricScore =
                categoryMetricScores
                  .get(
                    `${category.key}:${metric.key}`,
                  )
                  ?.get(stock.symbol);

              if (
                numericValue(
                  metricScore,
                ) === null
              ) {
                return;
              }

              availableMetrics += 1;
              categoryWeightedScore +=
                metricScore *
                metric.weight;
              categoryAvailableWeight +=
                metric.weight;
            },
          );

          const categoryScore =
            categoryAvailableWeight > 0
              ? categoryWeightedScore /
                categoryAvailableWeight
              : null;

          categories[category.key] =
            roundScore(categoryScore);

          if (
            numericValue(
              categoryScore,
            ) !== null
          ) {
            overallWeightedScore +=
              categoryScore *
              category.weight;
            overallAvailableWeight +=
              category.weight;
          }
        },
      );

      const overall =
        overallAvailableWeight > 0
          ? roundScore(
              overallWeightedScore /
                overallAvailableWeight,
            )
          : null;

      return {
        symbol: stock.symbol,
        name: stock.name,
        overall,
        categories,
        coverage:
          totalMetrics > 0
            ? Math.round(
                (availableMetrics /
                  totalMetrics) *
                  100,
              )
            : 0,
      };
    },
  );

  const overallLeaders =
    getLeaderSymbols(
      entries,
      (entry) => entry.overall,
    );

  const categoryLeaders = {};

  SCORE_CATEGORIES.forEach(
    (category) => {
      categoryLeaders[category.key] =
        getLeaderSymbols(
          entries,
          (entry) =>
            entry.categories[
              category.key
            ],
        );
    },
  );

  return {
    entries,
    overallLeaders,
    categoryLeaders,
  };
}

function writeCompareSelection(
  stocks,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalized = stocks
      .map((stock) => ({
        symbol: cleanText(
          stock?.symbol,
        ).toUpperCase(),
        name:
          cleanText(stock?.name) ||
          cleanText(stock?.symbol),
        sector:
          cleanText(stock?.sector) ||
          "Sector unavailable",
        logoDomain: cleanText(
          stock?.logoDomain,
        ),
      }))
      .filter((stock) => stock.symbol)
      .slice(0, MAX_COMPARE_STOCKS);

    window.sessionStorage.setItem(
      COMPARE_SELECTION_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  } catch (error) {
    console.error(
      "Unable to save comparison selection:",
      error,
    );
  }
}

function getLeaderNames(
  symbols,
  stocks,
) {
  const lookup = new Map(
    stocks.map((stock) => [
      stock.symbol,
      stock.name,
    ]),
  );

  return symbols
    .map(
      (symbol) =>
        lookup.get(symbol) ||
        symbol,
    )
    .join(" and ");
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

  const [companySearch, setCompanySearch] =
    useState("");

  const [debouncedCompanySearch, setDebouncedCompanySearch] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");

  const [actionMessage, setActionMessage] =
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
              getApiErrorMessage(
                data?.error,
                "Unable to load comparison data.",
              ),
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

  useEffect(() => {
    if (stocks.length > 0) {
      writeCompareSelection(stocks);
    }
  }, [stocks]);

  useEffect(() => {
    const normalizedSearch =
      companySearch.trim();

    const timer = window.setTimeout(
      () => {
        setDebouncedCompanySearch(
          normalizedSearch,
        );
      },
      350,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [companySearch]);

  useEffect(() => {
    const query =
      debouncedCompanySearch.trim();

    if (
      query.length < 2 ||
      requestedSymbols.length >=
        MAX_COMPARE_STOCKS
    ) {
      setSearchResults([]);
      setSearching(false);
      setSearchError("");
      return undefined;
    }

    const controller =
      new AbortController();

    async function searchCompanies() {
      setSearching(true);
      setSearchError("");

      try {
        const parameters =
          new URLSearchParams({
            q: query,
            page: "1",
            limit: String(
              SEARCH_RESULT_LIMIT,
            ),
            sort: "marketCap-desc",
          });

        const response = await fetch(
          `/api/screener?${parameters.toString()}`,
          {
            headers: {
              Accept:
                "application/json",
            },
            signal:
              controller.signal,
          },
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          data?.success !== true
        ) {
          throw new Error(
            getApiErrorMessage(
              data?.error,
              "Unable to search companies.",
            ),
          );
        }

        const selectedSet = new Set(
          requestedSymbols,
        );

        setSearchResults(
          (Array.isArray(data?.stocks)
            ? data.stocks
            : []
          ).filter(
            (stock) =>
              stock?.symbol &&
              !selectedSet.has(
                stock.symbol,
              ),
          ),
        );
      } catch (caughtError) {
        if (
          caughtError?.name ===
          "AbortError"
        ) {
          return;
        }

        setSearchResults([]);
        setSearchError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to search companies.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }

    searchCompanies();

    return () => {
      controller.abort();
    };
  }, [
    debouncedCompanySearch,
    requestedSymbols,
  ]);

  const comparisonScores =
    useMemo(
      () =>
        calculateComparisonScores(
          stocks,
        ),
      [stocks],
    );

  const scoreBySymbol = useMemo(
    () =>
      new Map(
        comparisonScores.entries.map(
          (entry) => [
            entry.symbol,
            entry,
          ],
        ),
      ),
    [comparisonScores.entries],
  );

  const rankBySymbol = useMemo(
    () => {
      const ranked = [
        ...comparisonScores.entries,
      ].sort((first, second) => {
        const firstScore =
          numericValue(
            first.overall,
          ) ?? -1;

        const secondScore =
          numericValue(
            second.overall,
          ) ?? -1;

        return secondScore -
          firstScore;
      });

      return new Map(
        ranked.map((entry, index) => [
          entry.symbol,
          index + 1,
        ]),
      );
    },
    [comparisonScores.entries],
  );

  function updateSymbols(
    nextSymbols,
    nextStocks = null,
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

    if (Array.isArray(nextStocks)) {
      writeCompareSelection(
        nextStocks.filter((stock) =>
          normalized.includes(
            cleanText(
              stock?.symbol,
            ).toUpperCase(),
          ),
        ),
      );
    }

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
    if (requestedSymbols.length <= 2) {
      setActionMessage(
        "Keep at least two companies in the comparison. Add another company before removing this one.",
      );
      return;
    }

    const nextSymbols =
      requestedSymbols.filter(
        (item) => item !== symbol,
      );

    const nextStocks = stocks.filter(
      (stock) =>
        stock.symbol !== symbol,
    );

    updateSymbols(
      nextSymbols,
      nextStocks,
    );
  }

  function addStock(stock) {
    if (!stock?.symbol) {
      return;
    }

    if (
      requestedSymbols.length >=
      MAX_COMPARE_STOCKS
    ) {
      setActionMessage(
        `You can compare up to ${MAX_COMPARE_STOCKS} companies at one time.`,
      );
      return;
    }

    if (
      requestedSymbols.includes(
        stock.symbol,
      )
    ) {
      setActionMessage(
        `${stock.name || stock.symbol} is already selected.`,
      );
      return;
    }

    const nextSymbols = [
      ...requestedSymbols,
      stock.symbol,
    ];

    const nextStocks = [
      ...stocks,
      stock,
    ];

    setCompanySearch("");
    setDebouncedCompanySearch("");
    setSearchResults([]);
    setActionMessage(
      `${stock.name || stock.symbol} added to the comparison.`,
    );

    updateSymbols(
      nextSymbols,
      nextStocks,
    );
  }

  async function copyComparisonLink() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : "";

    if (!url) {
      return;
    }

    try {
      if (
        navigator?.clipboard
          ?.writeText
      ) {
        await navigator.clipboard.writeText(
          url,
        );
      } else {
        const textArea =
          document.createElement(
            "textarea",
          );

        textArea.value = url;
        textArea.style.position =
          "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(
          textArea,
        );
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setActionMessage(
        "Comparison link copied.",
      );
    } catch (copyError) {
      console.error(
        "Unable to copy comparison link:",
        copyError,
      );

      setActionMessage(
        "Copying failed. You can copy the URL from the browser address bar.",
      );
    }
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
                Compare up to five Indian companies, review transparent
                relative scores, see category leaders and add more companies
                directly from this page. Scores describe only this selected
                group and are not investment recommendations.
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

              <section className="exa-compare-tools">
                <div className="exa-compare-add-panel">
                  <div className="exa-compare-add-heading">
                    <Plus size={13} />
                    Add another company
                  </div>

                  <div className="exa-compare-search-wrap">
                    <Search size={14} />

                    <input
                      type="search"
                      className="exa-compare-search-input"
                      value={companySearch}
                      disabled={
                        requestedSymbols.length >=
                        MAX_COMPARE_STOCKS
                      }
                      onChange={(event) =>
                        setCompanySearch(
                          event.target.value,
                        )
                      }
                      placeholder={
                        requestedSymbols.length >=
                        MAX_COMPARE_STOCKS
                          ? "Maximum five companies selected"
                          : "Search company or NSE symbol"
                      }
                      aria-label="Search companies to add"
                    />

                    {(companySearch.trim().length >= 2 ||
                      searching ||
                      searchError) &&
                      requestedSymbols.length <
                        MAX_COMPARE_STOCKS && (
                        <div className="exa-compare-search-results">
                          {searching ? (
                            <div className="exa-compare-search-state">
                              <LoaderCircle
                                size={15}
                                className="exa-compare-spinner"
                              />
                              <div style={{ marginTop: 6 }}>
                                Searching companies
                              </div>
                            </div>
                          ) : searchError ? (
                            <div className="exa-compare-search-state">
                              {searchError}
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="exa-compare-search-state">
                              No additional matching companies found.
                            </div>
                          ) : (
                            searchResults.map(
                              (stock) => (
                                <button
                                  key={stock.symbol}
                                  type="button"
                                  className="exa-compare-search-result"
                                  onClick={() =>
                                    addStock(stock)
                                  }
                                >
                                  <CompanyLogo
                                    domain={stock.logoDomain}
                                    name={stock.name}
                                  />

                                  <span className="exa-compare-search-result-copy">
                                    <strong>
                                      {stock.name}
                                    </strong>
                                    <span>
                                      {stock.symbol} · {stock.sector}
                                    </span>
                                  </span>

                                  <span className="exa-compare-search-add">
                                    <Plus size={11} />
                                  </span>
                                </button>
                              ),
                            )
                          )}
                        </div>
                      )}
                  </div>
                </div>

                <button
                  type="button"
                  className="exa-compare-share-button"
                  onClick={copyComparisonLink}
                >
                  <Copy size={14} />
                  Copy share link
                </button>
              </section>

              {actionMessage && (
                <div className="exa-compare-action-message">
                  {actionMessage}
                </div>
              )}

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

              <section className="exa-compare-score-section">
                <div className="exa-compare-score-heading">
                  <div className="exa-compare-score-heading-main">
                    <Sparkles
                      size={16}
                      color="#22d3ee"
                    />

                    <div>
                      <h2>
                        Relative comparison scores
                      </h2>

                      <p>
                        Scores run from 0 to 100 and are calculated only
                        against the companies currently selected. Overall
                        score weights Growth & Quality 35%, Valuation 25%,
                        Financial Health 20% and Momentum 20%.
                      </p>
                    </div>
                  </div>

                  <span className="exa-compare-score-rank">
                    <Trophy size={11} />
                    Selected-group ranking
                  </span>
                </div>

                <div className="exa-compare-score-grid">
                  {stocks.map((stock) => {
                    const score =
                      scoreBySymbol.get(
                        stock.symbol,
                      );

                    const isLeader =
                      comparisonScores.overallLeaders.includes(
                        stock.symbol,
                      );

                    return (
                      <article
                        key={`score-${stock.symbol}`}
                        className={
                          isLeader
                            ? "exa-compare-score-card leader"
                            : "exa-compare-score-card"
                        }
                      >
                        <div className="exa-compare-score-card-top">
                          <div className="exa-compare-score-company">
                            <strong title={stock.name}>
                              {stock.name}
                            </strong>
                            <span>
                              {stock.symbol}
                            </span>
                          </div>

                          <div className="exa-compare-overall-score">
                            {score?.overall ?? "N/A"}
                            <small>/100</small>
                          </div>
                        </div>

                        <span className="exa-compare-score-rank">
                          {isLeader ? (
                            <Trophy size={10} />
                          ) : (
                            <Award size={10} />
                          )}
                          Rank #{
                            rankBySymbol.get(
                              stock.symbol,
                            ) || "—"
                          }
                        </span>

                        <div className="exa-compare-category-list">
                          {SCORE_CATEGORIES.map(
                            (category) => {
                              const categoryScore =
                                score?.categories?.[
                                  category.key
                                ];

                              return (
                                <div
                                  key={`${stock.symbol}-${category.key}`}
                                  className="exa-compare-category-row"
                                >
                                  <span title={category.label}>
                                    {category.label}
                                  </span>

                                  <div className="exa-compare-score-track">
                                    <div
                                      className="exa-compare-score-fill"
                                      style={{
                                        width: `${Math.max(
                                          Number(categoryScore) || 0,
                                          0,
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  <strong>
                                    {categoryScore ?? "—"}
                                  </strong>
                                </div>
                              );
                            },
                          )}
                        </div>

                        <div className="exa-compare-coverage">
                          Data coverage: {score?.coverage ?? 0}%
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="exa-compare-winner-grid">
                  <article className="exa-compare-winner-card">
                    <span>
                      <Trophy size={11} />
                      Overall leader
                    </span>
                    <strong>
                      {getLeaderNames(
                        comparisonScores.overallLeaders,
                        stocks,
                      ) || "Insufficient data"}
                    </strong>
                    <p>
                      Highest weighted score across all four categories in
                      this selected group.
                    </p>
                  </article>

                  {SCORE_CATEGORIES.map(
                    (category) => (
                      <article
                        key={`winner-${category.key}`}
                        className="exa-compare-winner-card"
                      >
                        <span>
                          <Award size={11} />
                          {category.label}
                        </span>
                        <strong>
                          {getLeaderNames(
                            comparisonScores.categoryLeaders[
                              category.key
                            ] || [],
                            stocks,
                          ) || "Insufficient data"}
                        </strong>
                        <p>
                          {category.description}
                        </p>
                      </article>
                    ),
                  )}
                </div>

                <p className="exa-compare-method-note">
                  A higher score means stronger relative positioning only
                  against the companies selected here. Missing data is excluded
                  and reflected in each card’s coverage percentage. Scores do
                  not predict future returns and should not be treated as Buy
                  or Sell recommendations.
                </p>
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