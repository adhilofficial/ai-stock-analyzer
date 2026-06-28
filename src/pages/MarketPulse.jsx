import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Clock3,
  Gauge,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import SnapshotFreshnessBanner from
  "../components/data/SnapshotFreshnessBanner";

import {
  getDashboardMarketData,
  getMarketBreadth,
  getMarketMovers,
} from "../services/dashboardApi";

import {
  dashboardMockData,
} from "../data/dashboardMockData";

import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";

const MAIN_INDEX_SYMBOLS = [
  "^NSEI",
  "^BSESN",
  "^NSEBANK",
  "^CNXIT",
];

const MAX_52_WEEK_ITEMS = 5;

const MARKET_PULSE_STYLES = `
  .exa-pulse-page {
    min-height: 100vh;
    padding: 28px;
    color: #e2e8f0;
  }

  .exa-pulse-container {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .exa-pulse-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 22px;
    margin-bottom: 20px;
  }

  .exa-pulse-eyebrow {
    margin: 0 0 7px;
    color: #60a5fa;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.14em;
  }

  .exa-pulse-header h1 {
    margin: 0;
    color: #f8fafc;
    font-size: clamp(27px, 3vw, 40px);
    line-height: 1.08;
    letter-spacing: -0.035em;
  }

  .exa-pulse-header-copy {
    max-width: 760px;
    margin: 10px 0 0;
    color: #8ea0bc;
    font-size: 13px;
    line-height: 1.7;
  }

  .exa-pulse-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .exa-pulse-button {
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid #243752;
    border-radius: 11px;
    background: #0b1526;
    color: #dbeafe;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    transition: 160ms ease;
  }

  .exa-pulse-button:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: #3b82f6;
    background: #10203a;
  }

  .exa-pulse-button:disabled {
    opacity: 0.62;
    cursor: not-allowed;
  }

  .exa-pulse-spinner {
    animation: exaPulseSpin 0.9s linear infinite;
  }

  @keyframes exaPulseSpin {
    to { transform: rotate(360deg); }
  }

  .exa-pulse-status-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: stretch;
    margin-bottom: 16px;
  }

  .exa-pulse-market-status,
  .exa-pulse-update-card {
    border: 1px solid #1c2d45;
    border-radius: 14px;
    background: linear-gradient(145deg, rgba(12, 24, 42, 0.96), rgba(7, 15, 28, 0.96));
  }

  .exa-pulse-market-status {
    min-height: 62px;
    padding: 13px 15px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .exa-pulse-status-icon {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .exa-pulse-market-status.open .exa-pulse-status-icon {
    color: #4ade80;
    background: rgba(34, 197, 94, 0.11);
  }

  .exa-pulse-market-status.closed .exa-pulse-status-icon {
    color: #facc15;
    background: rgba(234, 179, 8, 0.11);
  }

  .exa-pulse-market-status strong {
    display: block;
    color: #f8fafc;
    font-size: 12px;
  }

  .exa-pulse-market-status span {
    display: block;
    margin-top: 4px;
    color: #7f91ad;
    font-size: 10px;
  }

  .exa-pulse-update-card {
    min-width: 220px;
    padding: 12px 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: right;
  }

  .exa-pulse-update-card span {
    color: #64748b;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .exa-pulse-update-card strong {
    margin-top: 5px;
    color: #cbd5e1;
    font-size: 10px;
  }

  .exa-pulse-notice {
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid rgba(245, 158, 11, 0.28);
    border-radius: 12px;
    background: rgba(120, 53, 15, 0.08);
    color: #fcd34d;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 10px;
    line-height: 1.55;
  }

  .exa-pulse-index-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
    margin-bottom: 16px;
  }

  .exa-pulse-index-card {
    position: relative;
    overflow: hidden;
    min-height: 126px;
    padding: 16px;
    border: 1px solid #1c2d45;
    border-radius: 15px;
    background: linear-gradient(145deg, #0c182b, #07111f);
  }

  .exa-pulse-index-card::after {
    content: "";
    position: absolute;
    right: -28px;
    bottom: -42px;
    width: 110px;
    height: 110px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.06);
  }

  .exa-pulse-index-top,
  .exa-pulse-index-price,
  .exa-pulse-index-range {
    position: relative;
    z-index: 1;
  }

  .exa-pulse-index-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .exa-pulse-index-top strong {
    color: #dbeafe;
    font-size: 11px;
  }

  .exa-pulse-index-symbol {
    color: #52657f;
    font-size: 8px;
  }

  .exa-pulse-index-price {
    margin-top: 19px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
  }

  .exa-pulse-index-price > strong {
    color: #f8fafc;
    font-size: clamp(19px, 2.1vw, 27px);
    letter-spacing: -0.035em;
  }

  .exa-pulse-move {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 850;
  }

  .exa-pulse-move.positive { color: #4ade80; }
  .exa-pulse-move.negative { color: #fb7185; }
  .exa-pulse-move.neutral { color: #94a3b8; }

  .exa-pulse-index-range {
    margin-top: 11px;
    display: flex;
    justify-content: space-between;
    color: #5f718c;
    font-size: 8px;
  }

  .exa-pulse-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .exa-pulse-card {
    border: 1px solid #1c2d45;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(12, 24, 43, 0.98), rgba(6, 14, 26, 0.98));
    overflow: hidden;
  }

  .exa-pulse-card-header {
    min-height: 62px;
    padding: 15px 17px;
    border-bottom: 1px solid #16263c;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .exa-pulse-card-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-pulse-card-title span {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .exa-pulse-card-title h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 13px;
  }

  .exa-pulse-card-title p {
    margin: 4px 0 0;
    color: #65758d;
    font-size: 9px;
  }

  .exa-pulse-card-body {
    padding: 17px;
  }

  .exa-pulse-sentiment-layout {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 22px;
    align-items: center;
  }

  .exa-pulse-score-ring {
    --score: 50;
    width: 156px;
    height: 156px;
    margin: 0 auto;
    border-radius: 50%;
    background: conic-gradient(#3b82f6 calc(var(--score) * 1%), #14243a 0);
    display: grid;
    place-items: center;
    position: relative;
  }

  .exa-pulse-score-ring::before {
    content: "";
    position: absolute;
    inset: 11px;
    border-radius: 50%;
    background: #081321;
    border: 1px solid #1f314a;
  }

  .exa-pulse-score-copy {
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .exa-pulse-score-copy strong {
    display: block;
    color: #f8fafc;
    font-size: 36px;
    letter-spacing: -0.06em;
  }

  .exa-pulse-score-copy span {
    color: #71839c;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .exa-pulse-sentiment-copy h3 {
    margin: 0;
    font-size: 22px;
    color: #f8fafc;
  }

  .exa-pulse-sentiment-copy > p {
    margin: 8px 0 15px;
    color: #8394ad;
    font-size: 11px;
    line-height: 1.6;
  }

  .exa-pulse-factors {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .exa-pulse-factor {
    padding: 10px 11px;
    border: 1px solid #17283f;
    border-radius: 11px;
    background: rgba(6, 15, 29, 0.72);
  }

  .exa-pulse-factor div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    color: #93a4bc;
    font-size: 9px;
  }

  .exa-pulse-factor div strong {
    color: #e2e8f0;
  }

  .exa-pulse-factor-track {
    height: 5px;
    margin-top: 8px;
    border-radius: 999px;
    background: #14243a;
    overflow: hidden;
  }

  .exa-pulse-factor-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #2563eb, #60a5fa);
  }

  .exa-pulse-breadth-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }

  .exa-pulse-breadth-stat {
    padding: 12px;
    border: 1px solid #17283f;
    border-radius: 11px;
    background: rgba(6, 15, 29, 0.72);
  }

  .exa-pulse-breadth-stat span {
    display: block;
    color: #687a94;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .exa-pulse-breadth-stat strong {
    display: block;
    margin-top: 6px;
    color: #f8fafc;
    font-size: 19px;
  }

  .exa-pulse-breadth-bar {
    display: flex;
    height: 14px;
    margin: 17px 0 10px;
    border-radius: 999px;
    overflow: hidden;
    background: #17283f;
  }

  .exa-pulse-breadth-bar span:nth-child(1) { background: #22c55e; }
  .exa-pulse-breadth-bar span:nth-child(2) { background: #64748b; }
  .exa-pulse-breadth-bar span:nth-child(3) { background: #f43f5e; }

  .exa-pulse-breadth-legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    color: #74859e;
    font-size: 9px;
  }

  .exa-pulse-breadth-details {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
    margin-top: 16px;
  }

  .exa-pulse-detail {
    padding: 10px;
    border-radius: 10px;
    background: rgba(15, 28, 47, 0.72);
  }

  .exa-pulse-detail span {
    color: #667991;
    font-size: 8px;
  }

  .exa-pulse-detail strong {
    display: block;
    margin-top: 5px;
    color: #dce7f5;
    font-size: 12px;
  }

  .exa-pulse-sector-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 9px;
  }

  .exa-pulse-sector {
    min-height: 88px;
    padding: 12px;
    border: 1px solid transparent;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .exa-pulse-sector.strong-positive {
    background: rgba(22, 163, 74, 0.16);
    border-color: rgba(74, 222, 128, 0.26);
  }

  .exa-pulse-sector.positive {
    background: rgba(34, 197, 94, 0.08);
    border-color: rgba(74, 222, 128, 0.15);
  }

  .exa-pulse-sector.neutral {
    background: rgba(100, 116, 139, 0.08);
    border-color: rgba(148, 163, 184, 0.13);
  }

  .exa-pulse-sector.negative {
    background: rgba(244, 63, 94, 0.08);
    border-color: rgba(251, 113, 133, 0.15);
  }

  .exa-pulse-sector.strong-negative {
    background: rgba(190, 18, 60, 0.16);
    border-color: rgba(251, 113, 133, 0.26);
  }

  .exa-pulse-sector span {
    color: #b9c7da;
    font-size: 9px;
    line-height: 1.35;
  }

  .exa-pulse-sector strong {
    font-size: 15px;
  }

  .exa-pulse-sector.strong-positive strong,
  .exa-pulse-sector.positive strong { color: #4ade80; }
  .exa-pulse-sector.strong-negative strong,
  .exa-pulse-sector.negative strong { color: #fb7185; }
  .exa-pulse-sector.neutral strong { color: #cbd5e1; }

  .exa-pulse-three-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .exa-pulse-list {
    display: flex;
    flex-direction: column;
  }

  .exa-pulse-stock-row {
    min-height: 61px;
    padding: 10px 0;
    border-bottom: 1px solid #14243a;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
  }

  .exa-pulse-stock-row:last-child {
    border-bottom: 0;
  }

  .exa-pulse-stock-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .exa-pulse-stock-rank {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: #122139;
    color: #7f91ad;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 850;
  }

  .exa-pulse-stock-copy {
    min-width: 0;
  }

  .exa-pulse-stock-copy strong {
    display: block;
    overflow: hidden;
    color: #e8eef8;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-pulse-stock-copy span {
    display: block;
    margin-top: 4px;
    color: #5f718c;
    font-size: 8px;
  }

  .exa-pulse-stock-value {
    text-align: right;
  }

  .exa-pulse-stock-value > strong {
    display: block;
    color: #f8fafc;
    font-size: 10px;
  }

  .exa-pulse-stock-value > span {
    display: inline-flex;
    margin-top: 4px;
  }

  .exa-pulse-stock-button {
    width: 27px;
    height: 27px;
    margin-left: 7px;
    padding: 0;
    border: 1px solid #21334c;
    border-radius: 8px;
    background: #0d192b;
    color: #7da9e8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .exa-pulse-highlow-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .exa-pulse-proximity {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-pulse-proximity.high { color: #4ade80; }
  .exa-pulse-proximity.low { color: #facc15; }

  .exa-pulse-empty,
  .exa-pulse-loading {
    min-height: 260px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .exa-pulse-empty strong,
  .exa-pulse-loading strong {
    margin-top: 11px;
    color: #e2e8f0;
    font-size: 12px;
  }

  .exa-pulse-empty p,
  .exa-pulse-loading p {
    max-width: 430px;
    margin: 7px 0 0;
    color: #70829b;
    font-size: 10px;
    line-height: 1.55;
  }

  .exa-pulse-disclaimer {
    margin: 16px 0 0;
    color: #53657e;
    font-size: 9px;
    line-height: 1.6;
    text-align: center;
  }

  @media (max-width: 1180px) {
    .exa-pulse-index-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .exa-pulse-main-grid {
      grid-template-columns: 1fr;
    }

    .exa-pulse-sector-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .exa-pulse-three-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .exa-pulse-page {
      padding: 18px 14px 30px;
    }

    .exa-pulse-header,
    .exa-pulse-status-row {
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .exa-pulse-header-actions {
      width: 100%;
      justify-content: stretch;
    }

    .exa-pulse-button {
      flex: 1;
    }

    .exa-pulse-update-card {
      min-width: 0;
      text-align: left;
    }

    .exa-pulse-sentiment-layout {
      grid-template-columns: 1fr;
    }

    .exa-pulse-sector-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .exa-pulse-highlow-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .exa-pulse-index-grid,
    .exa-pulse-factors,
    .exa-pulse-breadth-summary,
    .exa-pulse-breadth-details {
      grid-template-columns: 1fr;
    }

    .exa-pulse-sector-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function safeNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatNumber(value, digits = 2) {
  const number = safeNumber(value);
  if (number === null) return "N/A";

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(number);
}

function formatPrice(value, currency = "INR") {
  const number = safeNumber(value);
  if (number === null) return "N/A";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `₹${formatNumber(number)}`;
  }
}

function formatCompact(value) {
  const number = safeNumber(value);
  if (number === null) return "N/A";

  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function getMoveClass(value) {
  const number = safeNumber(value, 0);
  if (number > 0) return "positive";
  if (number < 0) return "negative";
  return "neutral";
}

function MoveIndicator({ value, showPoints = false, points }) {
  const move = safeNumber(value, 0);
  const MoveIcon = move > 0
    ? ArrowUpRight
    : move < 0
      ? ArrowDownRight
      : CircleDot;

  return (
    <span className={`exa-pulse-move ${getMoveClass(move)}`}>
      <MoveIcon size={13} />
      {showPoints && Number.isFinite(Number(points))
        ? `${move >= 0 ? "+" : ""}${formatNumber(points)} · `
        : ""}
      {move >= 0 ? "+" : ""}{formatNumber(move)}%
    </span>
  );
}

function normalizeScreenerStock(stock) {
  return {
    symbol: String(stock?.symbol || stock?.yahooSymbol || "").toUpperCase(),
    name: stock?.name || stock?.longName || stock?.shortName || stock?.symbol || "Unknown company",
    price: safeNumber(stock?.price || stock?.regularMarketPrice),
    changePercent: safeNumber(stock?.changePercent || stock?.regularMarketChangePercent, 0),
    week52High: safeNumber(stock?.week52High || stock?.fiftyTwoWeekHigh),
    week52Low: safeNumber(stock?.week52Low || stock?.fiftyTwoWeekLow),
    distanceFrom52WeekHigh: safeNumber(stock?.distanceFrom52WeekHigh),
    volume: safeNumber(stock?.volume, 0),
    currency: stock?.currency || "INR",
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned invalid market data.");
  }
}

async function fetchScreenerList(sort, limit, signal) {
  const parameters = new URLSearchParams({
    page: "1",
    limit: String(limit),
    sort,
  });

  const response = await fetch(`/api/screener?${parameters.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  const data = await readJson(response);
  if (!response.ok || data?.success !== true) {
    throw new Error(data?.error || "Unable to load 52-week market data.");
  }

  return {
    stocks: Array.isArray(data?.stocks)
      ? data.stocks.map(normalizeScreenerStock)
      : [],
    generatedAt: data?.generatedAt || null,
    source: data?.source || "Yahoo Finance",
  };
}

function buildNearHighs(stocks) {
  return stocks
    .map((stock) => {
      const price = safeNumber(stock.price);
      const high = safeNumber(stock.week52High);
      const fallbackDistance = safeNumber(stock.distanceFrom52WeekHigh);
      const distance = price !== null && high !== null && high > 0
        ? ((price - high) / high) * 100
        : fallbackDistance;

      return { ...stock, proximityPercent: distance };
    })
    .filter((stock) => Number.isFinite(stock.proximityPercent))
    .sort((a, b) => Math.abs(a.proximityPercent) - Math.abs(b.proximityPercent))
    .slice(0, MAX_52_WEEK_ITEMS);
}

function buildNearLows(stocks) {
  return stocks
    .map((stock) => {
      const price = safeNumber(stock.price);
      const low = safeNumber(stock.week52Low);
      const distance = price !== null && low !== null && low > 0
        ? ((price - low) / low) * 100
        : null;

      return { ...stock, proximityPercent: distance };
    })
    .filter((stock) => Number.isFinite(stock.proximityPercent))
    .sort((a, b) => Math.abs(a.proximityPercent) - Math.abs(b.proximityPercent))
    .slice(0, MAX_52_WEEK_ITEMS);
}

function deriveSentiment(indices, sectors, breadth) {
  const trackedIndices = indices.filter((item) =>
    MAIN_INDEX_SYMBOLS.includes(item?.ticker || item?.symbol),
  );

  const indexAverage = trackedIndices.length
    ? trackedIndices.reduce((sum, item) => sum + safeNumber(item?.changePercent, 0), 0) / trackedIndices.length
    : 0;

  const indexScore = clamp(50 + indexAverage * 18, 0, 100);

  const advancing = safeNumber(breadth?.advancing, 0);
  const declining = safeNumber(breadth?.declining, 0);
  const breadthTotal = advancing + declining;
  const breadthScore = breadthTotal > 0
    ? (advancing / breadthTotal) * 100
    : 50;

  const validSectors = sectors.filter((sector) => Number.isFinite(Number(sector?.changePercent)));
  const positiveSectors = validSectors.filter((sector) => Number(sector.changePercent) > 0).length;
  const sectorScore = validSectors.length
    ? (positiveSectors / validSectors.length) * 100
    : 50;

  const vix = indices.find((item) =>
    String(item?.ticker || item?.symbol || "").includes("VIX"),
  );
  const vixChange = safeNumber(vix?.changePercent, 0);
  const volatilityScore = clamp(50 - vixChange * 8, 0, 100);

  const score = Math.round(
    indexScore * 0.35 +
    breadthScore * 0.35 +
    sectorScore * 0.2 +
    volatilityScore * 0.1,
  );

  let label = "Mixed";
  let description = "Market participation and price direction are balanced, with no clear broad-market advantage.";

  if (score >= 72) {
    label = "Strong";
    description = "Major indices, market breadth and sector participation are aligned positively across the tracked universe.";
  } else if (score >= 58) {
    label = "Positive";
    description = "Market conditions are constructive, although leadership may still be concentrated in selected sectors.";
  } else if (score < 30) {
    label = "Risk-off";
    description = "Weak breadth and negative price participation suggest elevated short-term market risk.";
  } else if (score < 43) {
    label = "Weak";
    description = "Declining participation is outweighing advancing participation across the tracked market universe.";
  }

  return {
    score,
    label,
    description,
    factors: [
      { name: "Index trend", score: Math.round(indexScore) },
      { name: "Market breadth", score: Math.round(breadthScore) },
      { name: "Sector participation", score: Math.round(sectorScore) },
      { name: "Volatility", score: Math.round(volatilityScore) },
    ],
  };
}

function getSectorTone(value) {
  const number = safeNumber(value, 0);
  if (number >= 1) return "strong-positive";
  if (number > 0.05) return "positive";
  if (number <= -1) return "strong-negative";
  if (number < -0.05) return "negative";
  return "neutral";
}

function normalizeMockMover(stock) {
  return {
    symbol: String(stock?.symbol || "").toUpperCase(),
    name: stock?.name || stock?.symbol || "Unknown company",
    price: safeNumber(stock?.price),
    changePercent: safeNumber(stock?.changePercent, 0),
    volume: safeNumber(stock?.volume, 0),
    currency: stock?.currency || "INR",
  };
}

function StockList({ items, mode, onAnalyze }) {
  if (!items.length) {
    return (
      <div className="exa-pulse-empty" style={{ minHeight: 190 }}>
        <BarChart3 size={27} color="#52657f" />
        <strong>No market rows available</strong>
        <p>The current market source did not return enough data for this section.</p>
      </div>
    );
  }

  return (
    <div className="exa-pulse-list">
      {items.slice(0, 5).map((stock, index) => (
        <div className="exa-pulse-stock-row" key={`${mode}-${stock.symbol}-${index}`}>
          <div className="exa-pulse-stock-main">
            <span className="exa-pulse-stock-rank">{index + 1}</span>
            <div className="exa-pulse-stock-copy">
              <strong>{stock.name}</strong>
              <span>{stock.symbol}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="exa-pulse-stock-value">
              <strong>{formatPrice(stock.price, stock.currency)}</strong>
              {mode === "active" ? (
                <span style={{ color: "#7f91ad", fontSize: 8 }}>
                  Vol {formatCompact(stock.volume)}
                </span>
              ) : (
                <MoveIndicator value={stock.changePercent} />
              )}
            </div>

            <button
              type="button"
              className="exa-pulse-stock-button"
              aria-label={`Analyze ${stock.name}`}
              onClick={() => onAnalyze(stock.symbol)}
            >
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HighLowList({ items, type, onAnalyze }) {
  if (!items.length) {
    return (
      <div className="exa-pulse-empty" style={{ minHeight: 180 }}>
        <Waves size={26} color="#52657f" />
        <strong>Snapshot rows unavailable</strong>
        <p>The 52-week snapshot did not contain enough comparable price-range data.</p>
      </div>
    );
  }

  return (
    <div className="exa-pulse-list">
      {items.map((stock, index) => (
        <div className="exa-pulse-stock-row" key={`${type}-${stock.symbol}-${index}`}>
          <div className="exa-pulse-stock-main">
            <span className="exa-pulse-stock-rank">{index + 1}</span>
            <div className="exa-pulse-stock-copy">
              <strong>{stock.name}</strong>
              <span>{stock.symbol} · {formatPrice(stock.price, stock.currency)}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <span className={`exa-pulse-proximity ${type}`}>
              {type === "high" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {type === "high"
                ? `${formatNumber(Math.abs(stock.proximityPercent))}% from high`
                : `${formatNumber(Math.abs(stock.proximityPercent))}% above low`}
            </span>
            <button
              type="button"
              className="exa-pulse-stock-button"
              aria-label={`Analyze ${stock.name}`}
              onClick={() => onAnalyze(stock.symbol)}
            >
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MarketPulse() {
  const navigate = useNavigate();

  const [marketData, setMarketData] = useState(null);
  const [moversData, setMoversData] = useState(null);
  const [breadthData, setBreadthData] = useState(null);
  const [nearHighs, setNearHighs] = useState([]);
  const [nearLows, setNearLows] = useState([]);
  const [snapshotMetadata, setSnapshotMetadata] = useState({
    generatedAt: null,
    source: "Yahoo Finance",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const loadMarketPulse = useCallback(async ({ refresh = false, signal } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");
    setWarning("");

    const tasks = await Promise.allSettled([
      getDashboardMarketData({ refresh, signal }),
      getMarketMovers({ refresh, signal }),
      getMarketBreadth({ refresh, signal }),
      fetchScreenerList("distanceFrom52WeekHigh-asc", 20, signal),
      fetchScreenerList("distanceFrom52WeekHigh-desc", 50, signal),
    ]);

    if (signal?.aborted) return;

    const [marketResult, moversResult, breadthResult, highsResult, lowsResult] = tasks;
    const failures = tasks.filter((result) => result.status === "rejected");

    if (marketResult.status === "fulfilled") {
      setMarketData(marketResult.value);
    } else {
      setMarketData({
        success: true,
        source: "EXA fallback dataset",
        fetchedAt: new Date().toISOString(),
        cached: true,
        marketStatus: dashboardMockData.marketStatus,
        indices: dashboardMockData.indices,
        sectors: dashboardMockData.sectors,
      });
    }

    if (moversResult.status === "fulfilled") {
      setMoversData(moversResult.value);
    } else {
      setMoversData({
        success: true,
        source: "EXA fallback dataset",
        fetchedAt: new Date().toISOString(),
        movers: {
          gainers: (dashboardMockData.movers?.gainers || []).map(normalizeMockMover),
          losers: (dashboardMockData.movers?.losers || []).map(normalizeMockMover),
          active: (dashboardMockData.movers?.active || []).map(normalizeMockMover),
        },
      });
    }

    if (breadthResult.status === "fulfilled") {
      setBreadthData(breadthResult.value);
    } else {
      setBreadthData({
        success: true,
        source: "EXA fallback dataset",
        fetchedAt: new Date().toISOString(),
        breadth: dashboardMockData.breadth,
      });
    }

    if (highsResult.status === "fulfilled") {
      setNearHighs(buildNearHighs(highsResult.value.stocks));
      setSnapshotMetadata({
        generatedAt: highsResult.value.generatedAt,
        source: highsResult.value.source,
      });
    } else {
      setNearHighs([]);
    }

    if (lowsResult.status === "fulfilled") {
      setNearLows(buildNearLows(lowsResult.value.stocks));
      setSnapshotMetadata((current) => ({
        generatedAt: current.generatedAt || lowsResult.value.generatedAt,
        source: current.source || lowsResult.value.source,
      }));
    } else {
      setNearLows([]);
    }

    if (failures.length === tasks.length) {
      setError("Live market services are temporarily unavailable. EXA is displaying its fallback market dataset where possible.");
    } else if (failures.length > 0) {
      setWarning(`${failures.length} market data section${failures.length === 1 ? "" : "s"} could not be refreshed. Available sections remain visible, with fallback data used where possible.`);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadMarketPulse({ signal: controller.signal });
    return () => controller.abort();
  }, [loadMarketPulse]);

  const indices = useMemo(() => {
    const available = Array.isArray(marketData?.indices) ? marketData.indices : [];
    const primary = available.filter((item) => MAIN_INDEX_SYMBOLS.includes(item?.ticker || item?.symbol));
    return (primary.length ? primary : available).slice(0, 4);
  }, [marketData]);

  const sectors = useMemo(() => {
    return [...(Array.isArray(marketData?.sectors) ? marketData.sectors : [])]
      .sort((a, b) => safeNumber(b?.changePercent, 0) - safeNumber(a?.changePercent, 0));
  }, [marketData]);

  const breadth = breadthData?.breadth || {};
  const advancing = safeNumber(breadth?.advancing, 0);
  const declining = safeNumber(breadth?.declining, 0);
  const unchanged = safeNumber(breadth?.unchanged, 0);
  const breadthTotal = Math.max(advancing + declining + unchanged, 1);

  const sentiment = useMemo(
    () => deriveSentiment(indices, sectors, breadth),
    [indices, sectors, breadth],
  );

  const movers = moversData?.movers || {};
  const fetchedAt = marketData?.fetchedAt || moversData?.fetchedAt || breadthData?.fetchedAt;
  const marketStatus = marketData?.marketStatus || {};
  const isOpen = Boolean(marketStatus?.isOpen);

  function openAnalysis(symbol) {
    if (!symbol) return;
    navigate(`/analyze?symbol=${encodeURIComponent(symbol)}`);
  }

  return (
    <AppShell>
      <style>{MARKET_PULSE_STYLES}</style>

      <main className="exa-pulse-page">
        <div className="exa-pulse-container">
          <section className="exa-pulse-header">
            <div>
              <p className="exa-pulse-eyebrow">EXA MARKET INTELLIGENCE</p>
              <h1>Market Pulse</h1>
              <p className="exa-pulse-header-copy">
                A broad view of Indian market direction, participation, sector leadership, market movers and 52-week price positioning. This page summarizes market conditions and does not provide a buy or sell recommendation.
              </p>
            </div>

            <div className="exa-pulse-header-actions">
              <button
                type="button"
                className="exa-pulse-button"
                disabled={refreshing}
                onClick={() => loadMarketPulse({ refresh: true })}
              >
                {refreshing
                  ? <LoaderCircle size={14} className="exa-pulse-spinner" />
                  : <RefreshCw size={14} />}
                {refreshing ? "Refreshing" : "Refresh market"}
              </button>
            </div>
          </section>

          <section className="exa-pulse-status-row">
            <div className={`exa-pulse-market-status ${isOpen ? "open" : "closed"}`}>
              <span className="exa-pulse-status-icon">
                {isOpen ? <Activity size={19} /> : <Clock3 size={19} />}
              </span>
              <div>
                <strong>{marketStatus?.label || (isOpen ? "Indian market is open" : "Indian market is closed")}</strong>
                <span>
                  {isOpen
                    ? "Changes represent the current trading session."
                    : "Changes represent the latest completed trading session."}
                </span>
              </div>
            </div>

            <div className="exa-pulse-update-card">
              <span>Last refreshed</span>
              <strong>{formatTimestamp(fetchedAt)}</strong>
            </div>
          </section>

          {warning && (
            <div className="exa-pulse-notice">
              <ShieldAlert size={16} />
              <span>{warning}</span>
            </div>
          )}

          {error && (
            <div className="exa-pulse-notice" style={{ borderColor: "rgba(244,63,94,.3)", color: "#fda4af" }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <section className="exa-pulse-card">
              <div className="exa-pulse-loading">
                <LoaderCircle size={31} className="exa-pulse-spinner" color="#60a5fa" />
                <strong>Building the market pulse</strong>
                <p>Loading indices, breadth, sectors, market movers and 52-week snapshot data.</p>
              </div>
            </section>
          ) : (
            <>
              <section className="exa-pulse-index-grid">
                {indices.map((index) => (
                  <article className="exa-pulse-index-card" key={index.ticker || index.symbol}>
                    <div className="exa-pulse-index-top">
                      <div>
                        <strong>{index.symbol}</strong>
                        <div className="exa-pulse-index-symbol">{index.ticker}</div>
                      </div>
                      <MoveIndicator value={index.changePercent} />
                    </div>

                    <div className="exa-pulse-index-price">
                      <strong>{formatNumber(index.value)}</strong>
                    </div>

                    <div className="exa-pulse-index-range">
                      <span>Low {formatNumber(index.dayLow)}</span>
                      <span>High {formatNumber(index.dayHigh)}</span>
                    </div>
                  </article>
                ))}
              </section>

              <section className="exa-pulse-main-grid">
                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><Gauge size={18} /></span>
                      <div>
                        <h2>Market sentiment</h2>
                        <p>Composite score from direction, breadth, sectors and volatility</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-sentiment-layout">
                      <div
                        className="exa-pulse-score-ring"
                        style={{ "--score": sentiment.score }}
                      >
                        <div className="exa-pulse-score-copy">
                          <strong>{sentiment.score}</strong>
                          <span>out of 100</span>
                        </div>
                      </div>

                      <div className="exa-pulse-sentiment-copy">
                        <h3>{sentiment.label}</h3>
                        <p>{sentiment.description}</p>

                        <div className="exa-pulse-factors">
                          {sentiment.factors.map((factor) => (
                            <div className="exa-pulse-factor" key={factor.name}>
                              <div>
                                <span>{factor.name}</span>
                                <strong>{factor.score}</strong>
                              </div>
                              <div className="exa-pulse-factor-track">
                                <span style={{ width: `${factor.score}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><Waves size={18} /></span>
                      <div>
                        <h2>Market breadth</h2>
                        <p>{breadth?.scope || "Tracked NSE stock universe"}</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-breadth-summary">
                      <div className="exa-pulse-breadth-stat">
                        <span>Advancing</span>
                        <strong style={{ color: "#4ade80" }}>{formatCompact(advancing)}</strong>
                      </div>
                      <div className="exa-pulse-breadth-stat">
                        <span>Declining</span>
                        <strong style={{ color: "#fb7185" }}>{formatCompact(declining)}</strong>
                      </div>
                      <div className="exa-pulse-breadth-stat">
                        <span>Unchanged</span>
                        <strong>{formatCompact(unchanged)}</strong>
                      </div>
                    </div>

                    <div className="exa-pulse-breadth-bar" aria-label="Market breadth distribution">
                      <span style={{ width: `${(advancing / breadthTotal) * 100}%` }} />
                      <span style={{ width: `${(unchanged / breadthTotal) * 100}%` }} />
                      <span style={{ width: `${(declining / breadthTotal) * 100}%` }} />
                    </div>

                    <div className="exa-pulse-breadth-legend">
                      <span>{formatNumber((advancing / breadthTotal) * 100, 1)}% advancing</span>
                      <span>A/D ratio {formatNumber(breadth?.advanceDeclineRatio)}</span>
                      <span>{formatNumber((declining / breadthTotal) * 100, 1)}% declining</span>
                    </div>

                    <div className="exa-pulse-breadth-details">
                      <div className="exa-pulse-detail">
                        <span>Above 50 DMA</span>
                        <strong>{formatNumber(breadth?.above50DMA, 1)}%</strong>
                      </div>
                      <div className="exa-pulse-detail">
                        <span>52-week highs</span>
                        <strong>{formatCompact(breadth?.week52Highs)}</strong>
                      </div>
                      <div className="exa-pulse-detail">
                        <span>52-week lows</span>
                        <strong>{formatCompact(breadth?.week52Lows)}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              </section>

              <section className="exa-pulse-card" style={{ marginBottom: 16 }}>
                <header className="exa-pulse-card-header">
                  <div className="exa-pulse-card-title">
                    <span><Sparkles size={18} /></span>
                    <div>
                      <h2>Sector performance heatmap</h2>
                      <p>Latest-session percentage change across tracked sector indices</p>
                    </div>
                  </div>
                </header>

                <div className="exa-pulse-card-body">
                  <div className="exa-pulse-sector-grid">
                    {sectors.map((sector) => (
                      <article
                        className={`exa-pulse-sector ${getSectorTone(sector.changePercent)}`}
                        key={sector.symbol || sector.name}
                      >
                        <span>{sector.shortName || sector.name}</span>
                        <strong>
                          {safeNumber(sector.changePercent, 0) >= 0 ? "+" : ""}
                          {formatNumber(sector.changePercent)}%
                        </strong>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="exa-pulse-three-grid">
                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><TrendingUp size={18} /></span>
                      <div><h2>Top gainers</h2><p>Strongest latest-session moves</p></div>
                    </div>
                  </header>
                  <div className="exa-pulse-card-body">
                    <StockList items={movers?.gainers || []} mode="gainers" onAnalyze={openAnalysis} />
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><TrendingDown size={18} /></span>
                      <div><h2>Top losers</h2><p>Weakest latest-session moves</p></div>
                    </div>
                  </header>
                  <div className="exa-pulse-card-body">
                    <StockList items={movers?.losers || []} mode="losers" onAnalyze={openAnalysis} />
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><BarChart3 size={18} /></span>
                      <div><h2>Most active</h2><p>Highest tracked trading volume</p></div>
                    </div>
                  </header>
                  <div className="exa-pulse-card-body">
                    <StockList items={movers?.active || []} mode="active" onAnalyze={openAnalysis} />
                  </div>
                </article>
              </section>

              {snapshotMetadata.generatedAt && (
                <SnapshotFreshnessBanner
                  generatedAt={snapshotMetadata.generatedAt}
                  source={snapshotMetadata.source}
                />
              )}

              <section className="exa-pulse-highlow-grid">
                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><CheckCircle2 size={18} /></span>
                      <div><h2>Near 52-week highs</h2><p>Stocks trading closest to their annual high</p></div>
                    </div>
                  </header>
                  <div className="exa-pulse-card-body">
                    <HighLowList items={nearHighs} type="high" onAnalyze={openAnalysis} />
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><ShieldAlert size={18} /></span>
                      <div><h2>Near 52-week lows</h2><p>Stocks trading closest to their annual low</p></div>
                    </div>
                  </header>
                  <div className="exa-pulse-card-body">
                    <HighLowList items={nearLows} type="low" onAnalyze={openAnalysis} />
                  </div>
                </article>
              </section>
            </>
          )}

          <p className="exa-pulse-disclaimer">
            Market data may be delayed, incomplete or based on the latest completed session. EXA provides educational research tools and not personalized investment advice.
          </p>
        </div>
      </main>
    </AppShell>
  );
}