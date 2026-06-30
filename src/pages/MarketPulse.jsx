import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  CalendarDays,
  Database,
  Download,
  Gauge,
  Layers3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Waves,
  Zap,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppShell from
  "../components/layout/AppShell";

import SnapshotFreshnessBanner from
  "../components/data/SnapshotFreshnessBanner";
import DataTimestamp from "../components/data/DataTimestamp";
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
import "../styles/market-pulse.css";

const MAIN_INDEX_SYMBOLS = [
  "^NSEI",
  "^BSESN",
  "^NSEBANK",
  "^CNXIT",
];

const MAX_52_WEEK_ITEMS = 5;
const MAX_TREND_POINTS = 30;

const HISTORY_RANGE_OPTIONS = [7, 30];

const HISTORICAL_INDEX_SERIES = [
  {
    key: "nifty50",
    symbol: "^NSEI",
    name: "NIFTY 50",
    stroke: "#60a5fa",
  },
  {
    key: "sensex",
    symbol: "^BSESN",
    name: "SENSEX",
    stroke: "#a78bfa",
  },
  {
    key: "bankNifty",
    symbol: "^NSEBANK",
    name: "BANK NIFTY",
    stroke: "#22c55e",
  },
  {
    key: "niftyIt",
    symbol: "^CNXIT",
    name: "NIFTY IT",
    stroke: "#f59e0b",
  },
];

const SECTOR_HISTORY_COLORS = [
  "#60a5fa",
  "#22c55e",
  "#f59e0b",
  "#a78bfa",
  "#fb7185",
];

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

function formatTrendDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value || "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
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

function DeltaIndicator({ value, suffix = " pts", inverse = false }) {
  const number = safeNumber(value);

  if (number === null) {
    return <span className="exa-pulse-delta neutral">Baseline</span>;
  }

  const positive = inverse ? number < 0 : number > 0;
  const negative = inverse ? number > 0 : number < 0;
  const DeltaIcon = positive
    ? ArrowUpRight
    : negative
      ? ArrowDownRight
      : CircleDot;

  return (
    <span className={`exa-pulse-delta ${positive ? "positive" : negative ? "negative" : "neutral"}`}>
      <DeltaIcon size={11} />
      {number > 0 ? "+" : ""}{formatNumber(number, 1)}{suffix}
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
    source: data?.source || "Market data",
  };
}

async function fetchMarketPulseAnalytics(signal) {
  const response = await fetch("/api/screener?mode=market-pulse", {
    headers: { Accept: "application/json" },
    signal,
  });

  const data = await readJson(response);
  if (!response.ok || data?.success !== true) {
    throw new Error(data?.error || "Unable to load market intelligence history.");
  }

  return {
    generatedAt: data?.generatedAt || null,
    source: data?.source || "Market data",
    marketPulse: data?.marketPulse || null,
    history: Array.isArray(data?.marketPulseHistory)
      ? data.marketPulseHistory
      : [],
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

function deriveSentiment(indices, sectors, breadth, pulse) {
  const trackedIndices = indices.filter((item) =>
    MAIN_INDEX_SYMBOLS.includes(item?.ticker || item?.symbol),
  );

  const indexAverage = trackedIndices.length
    ? trackedIndices.reduce((sum, item) => sum + safeNumber(item?.changePercent, 0), 0) / trackedIndices.length
    : 0;

  const indexScore = clamp(50 + indexAverage * 18, 0, 100);

  const advancing = safeNumber(breadth?.advancing, safeNumber(pulse?.advancing, 0));
  const declining = safeNumber(breadth?.declining, safeNumber(pulse?.declining, 0));
  const breadthTotal = advancing + declining;
  const breadthScore = breadthTotal > 0
    ? (advancing / breadthTotal) * 100
    : safeNumber(pulse?.advancingPercent, 50);

  const validSectors = sectors.filter((sector) => Number.isFinite(Number(sector?.changePercent)));
  const positiveSectors = validSectors.filter((sector) => Number(sector.changePercent) > 0).length;
  const sectorScore = validSectors.length
    ? (positiveSectors / validSectors.length) * 100
    : safeNumber(pulse?.sectorParticipationPercent, 50);

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

function buildFallbackPulse(breadth, sectors, generatedAt) {
  const advancing = safeNumber(breadth?.advancing, 0);
  const declining = safeNumber(breadth?.declining, 0);
  const unchanged = safeNumber(breadth?.unchanged, 0);
  const totalStocks = Math.max(advancing + declining + unchanged, 1);
  const validSectors = sectors.filter((sector) => Number.isFinite(Number(sector?.changePercent)));
  const positiveSectors = validSectors.filter((sector) => safeNumber(sector?.changePercent, 0) > 0).length;

  return {
    generatedAt: generatedAt || new Date().toISOString(),
    date: String(generatedAt || new Date().toISOString()).slice(0, 10),
    totalStocks,
    advancing,
    declining,
    unchanged,
    advancingPercent: advancing / totalStocks * 100,
    decliningPercent: declining / totalStocks * 100,
    advanceDeclineRatio: declining > 0 ? advancing / declining : advancing,
    above20DMA: safeNumber(breadth?.above50DMA, 50),
    above50DMA: safeNumber(breadth?.above50DMA, 50),
    week52Highs: safeNumber(breadth?.week52Highs, 0),
    week52Lows: safeNumber(breadth?.week52Lows, 0),
    upVolumeShare: 50,
    downVolumeShare: 50,
    volumeRatio: 100,
    positiveSectors,
    negativeSectors: Math.max(validSectors.length - positiveSectors, 0),
    sectorParticipationPercent: validSectors.length
      ? positiveSectors / validSectors.length * 100
      : 50,
    marketParticipationScore: safeNumber(breadth?.advancingPercent, advancing / totalStocks * 100),
    sectors: validSectors.map((sector) => ({
      sector: sector.shortName || sector.name,
      stockCount: null,
      advancingPercent: safeNumber(sector.changePercent, 0) > 0 ? 100 : 0,
      averageChangePercent: safeNumber(sector.changePercent, 0),
      above50DMA: null,
      volumeRatio: null,
      momentumScore: clamp(50 + safeNumber(sector.changePercent, 0) * 15, 0, 100),
    })),
  };
}

function buildTrendRows(history, currentPulse) {
  const byDate = new Map();

  [...history, currentPulse]
    .filter(Boolean)
    .forEach((item) => {
      const date = item?.date || String(item?.generatedAt || "").slice(0, 10);
      if (!date) return;
      byDate.set(date, { ...item, date });
    });

  return [...byDate.values()]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-MAX_TREND_POINTS)
    .map((item) => ({
      date: item.date,
      label: formatTrendDate(item.date),
      advancing: safeNumber(item.advancingPercent, 0),
      above50DMA: safeNumber(item.above50DMA, 0),
      upVolume: safeNumber(item.upVolumeShare, 50),
      participation: safeNumber(item.marketParticipationScore, 50),
      adRatio: safeNumber(item.advanceDeclineRatio, 0),
    }));
}


function getHistoricalPulseDate(item) {
  return item?.date || String(item?.generatedAt || "").slice(0, 10);
}

function getHistoricalIndexValue(item, symbol) {
  const indices = Array.isArray(item?.indices) ? item.indices : [];
  const match = indices.find((index) => {
    const candidate = String(index?.symbol || index?.ticker || "").toUpperCase();
    return candidate === String(symbol || "").toUpperCase();
  });

  return safeNumber(match?.value ?? match?.price ?? match?.regularMarketPrice);
}

function calculateHistoricalSentiment(item) {
  const storedScore = safeNumber(item?.sentimentScore);
  if (storedScore !== null) return clamp(storedScore, 0, 100);

  const indexChanges = (Array.isArray(item?.indices) ? item.indices : [])
    .map((index) => safeNumber(index?.changePercent))
    .filter((value) => value !== null);

  const indexAverage = indexChanges.length
    ? indexChanges.reduce((sum, value) => sum + value, 0) / indexChanges.length
    : 0;

  const indexScore = clamp(50 + indexAverage * 18, 0, 100);
  const breadthScore = clamp(safeNumber(item?.advancingPercent, 50), 0, 100);
  const sectorScore = clamp(safeNumber(item?.sectorParticipationPercent, 50), 0, 100);
  const volumeScore = clamp(safeNumber(item?.upVolumeShare, 50), 0, 100);

  return Math.round(
    indexScore * 0.35 +
    breadthScore * 0.35 +
    sectorScore * 0.2 +
    volumeScore * 0.1,
  );
}

function deriveHistoricalRisk(item) {
  const stored = String(item?.riskLevel || "").toLowerCase();
  if (["low", "moderate", "high"].includes(stored)) return stored;

  const declining = safeNumber(item?.decliningPercent, 50);
  const downVolume = safeNumber(item?.downVolumeShare, 50);
  const above50 = safeNumber(item?.above50DMA, 50);
  const sectorParticipation = safeNumber(item?.sectorParticipationPercent, 50);

  if (
    declining >= 60 ||
    downVolume >= 70 ||
    above50 < 30
  ) {
    return "high";
  }

  if (
    declining >= 52 ||
    downVolume >= 60 ||
    above50 < 40 ||
    sectorParticipation < 35
  ) {
    return "moderate";
  }

  return "low";
}

function buildHistoricalRows(history, currentPulse, range) {
  const byDate = new Map();

  [...(Array.isArray(history) ? history : []), currentPulse]
    .filter(Boolean)
    .forEach((item) => {
      const date = getHistoricalPulseDate(item);
      if (!date) return;
      byDate.set(date, { ...item, date });
    });

  const rows = [...byDate.values()]
    .sort((first, second) => String(first.date).localeCompare(String(second.date)))
    .slice(-range)
    .map((item) => {
      const row = {
        date: item.date,
        label: formatTrendDate(item.date),
        sentiment: calculateHistoricalSentiment(item),
        participation: safeNumber(item?.marketParticipationScore, 50),
        advancing: safeNumber(item?.advancingPercent, 0),
        declining: safeNumber(item?.decliningPercent, 0),
        above50DMA: safeNumber(item?.above50DMA, 0),
        upVolume: safeNumber(item?.upVolumeShare, 50),
        downVolume: safeNumber(item?.downVolumeShare, 50),
        adRatio: safeNumber(item?.advanceDeclineRatio, 0),
        sectorParticipation: safeNumber(item?.sectorParticipationPercent, 50),
        risk: deriveHistoricalRisk(item),
      };

      HISTORICAL_INDEX_SERIES.forEach((series) => {
        row[series.key] = getHistoricalIndexValue(item, series.symbol);
      });

      return row;
    });

  const normalizedRows = rows.map((row) => ({ ...row }));

  HISTORICAL_INDEX_SERIES.forEach((series) => {
    const base = rows
      .map((row) => safeNumber(row[series.key]))
      .find((value) => value !== null && value > 0);

    normalizedRows.forEach((row) => {
      const value = safeNumber(row[series.key]);
      row[`${series.key}Normalized`] =
        base && value !== null
          ? ((value / base) - 1) * 100
          : null;
    });
  });

  return normalizedRows;
}

function buildSectorHistory(history, currentPulse, range) {
  const byDate = new Map();

  [...(Array.isArray(history) ? history : []), currentPulse]
    .filter(Boolean)
    .forEach((item) => {
      const date = getHistoricalPulseDate(item);
      if (!date) return;
      byDate.set(date, { ...item, date });
    });

  const pulses = [...byDate.values()]
    .sort((first, second) => String(first.date).localeCompare(String(second.date)))
    .slice(-range);

  const latestSectors = Array.isArray(pulses[pulses.length - 1]?.sectors)
    ? pulses[pulses.length - 1].sectors
    : [];

  const names = [...latestSectors]
    .sort(
      (first, second) =>
        safeNumber(second?.momentumScore, 0) -
        safeNumber(first?.momentumScore, 0),
    )
    .slice(0, 5)
    .map((sector) => sector?.sector)
    .filter(Boolean);

  const rows = pulses.map((pulse) => {
    const row = {
      date: pulse.date,
      label: formatTrendDate(pulse.date),
    };

    const lookup = new Map(
      (Array.isArray(pulse?.sectors) ? pulse.sectors : [])
        .map((sector) => [String(sector?.sector || ""), sector]),
    );

    names.forEach((name) => {
      row[name] = safeNumber(lookup.get(name)?.averageChangePercent);
    });

    return row;
  });

  return { rows, names };
}

function getHistoricalHighlights(rows) {
  const validRows = rows.filter((row) => Number.isFinite(Number(row?.sentiment)));

  if (!validRows.length) {
    return {
      best: null,
      weakest: null,
      latest: null,
      previous: null,
    };
  }

  const best = [...validRows].sort((a, b) => b.sentiment - a.sentiment)[0];
  const weakest = [...validRows].sort((a, b) => a.sentiment - b.sentiment)[0];
  const latest = validRows[validRows.length - 1];
  const previous = validRows.length > 1 ? validRows[validRows.length - 2] : null;

  return { best, weakest, latest, previous };
}

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function exportMarketHistoryCsv(rows) {
  if (!rows.length || typeof document === "undefined") return;

  const headers = [
    "Date",
    "Sentiment Score",
    "Participation Score",
    "Advancing %",
    "Declining %",
    "Advance Decline Ratio",
    "Above 50 DMA %",
    "Up Volume %",
    "Down Volume %",
    "Sector Participation %",
    "Risk Level",
    ...HISTORICAL_INDEX_SERIES.map((series) => `${series.name} Value`),
    ...HISTORICAL_INDEX_SERIES.map((series) => `${series.name} Normalized %`),
  ];

  const csvRows = rows.map((row) => [
    row.date,
    row.sentiment,
    row.participation,
    row.advancing,
    row.declining,
    row.adRatio,
    row.above50DMA,
    row.upVolume,
    row.downVolume,
    row.sectorParticipation,
    row.risk,
    ...HISTORICAL_INDEX_SERIES.map((series) => row[series.key]),
    ...HISTORICAL_INDEX_SERIES.map((series) => row[`${series.key}Normalized`]),
  ]);

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...csvRows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `exa-market-history-${rows[0]?.date || "start"}-${rows[rows.length - 1]?.date || "latest"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function deriveSectorRotation(currentSectors, previousSectors) {
  const previousLookup = new Map(
    (Array.isArray(previousSectors) ? previousSectors : []).map((sector) => [
      String(sector?.sector || "").toLowerCase(),
      sector,
    ]),
  );

  return (Array.isArray(currentSectors) ? currentSectors : [])
    .map((sector) => {
      const previous = previousLookup.get(String(sector?.sector || "").toLowerCase());
      const score = safeNumber(sector?.momentumScore, 50);
      const previousScore = safeNumber(previous?.momentumScore);
      const delta = previousScore === null ? null : score - previousScore;
      const change = safeNumber(sector?.averageChangePercent, 0);

      let status = "Stable";
      let statusClass = "stable";

      if (previousScore === null) {
        status = score >= 62 ? "Leading" : score <= 38 ? "Lagging" : "Baseline";
        statusClass = score >= 62 ? "leading" : score <= 38 ? "lagging" : "baseline";
      } else if (delta >= 5) {
        status = "Improving";
        statusClass = "improving";
      } else if (delta <= -5) {
        status = "Weakening";
        statusClass = "weakening";
      } else if (score >= 65 && change > 0) {
        status = "Leading";
        statusClass = "leading";
      } else if (score <= 35 && change < 0) {
        status = "Lagging";
        statusClass = "lagging";
      }

      return {
        ...sector,
        score,
        previousScore,
        delta,
        status,
        statusClass,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function deriveRiskAlerts({ indices, pulse, sectors }) {
  const alerts = [];
  const indexAverage = indices.length
    ? indices.reduce((sum, item) => sum + safeNumber(item?.changePercent, 0), 0) / indices.length
    : 0;
  const advancingPercent = safeNumber(pulse?.advancingPercent, 50);
  const decliningPercent = safeNumber(pulse?.decliningPercent, 50);
  const above50DMA = safeNumber(pulse?.above50DMA, 50);
  const downVolumeShare = safeNumber(pulse?.downVolumeShare, 50);
  const sectorParticipation = safeNumber(pulse?.sectorParticipationPercent, 50);
  const positiveSectors = safeNumber(pulse?.positiveSectors, 0);
  const strongestSector = sectors[0];

  if (indexAverage > 0.25 && advancingPercent < 45) {
    alerts.push({
      id: "breadth-divergence",
      severity: "high",
      title: "Index–breadth divergence",
      message: "Major indices are rising while fewer than 45% of tracked stocks are advancing. Leadership may be narrow.",
    });
  }

  if (decliningPercent >= 60) {
    alerts.push({
      id: "broad-selling",
      severity: "high",
      title: "Broad-based selling",
      message: `${formatNumber(decliningPercent, 1)}% of the tracked universe is declining, indicating widespread selling pressure.`,
    });
  }

  if (downVolumeShare >= 60) {
    alerts.push({
      id: "down-volume",
      severity: downVolumeShare >= 70 ? "high" : "moderate",
      title: "Declining-volume dominance",
      message: `${formatNumber(downVolumeShare, 1)}% of tracked volume is concentrated in declining stocks.`,
    });
  }

  if (above50DMA < 40) {
    alerts.push({
      id: "below-50dma",
      severity: "moderate",
      title: "Weak medium-term participation",
      message: `Only ${formatNumber(above50DMA, 1)}% of tracked stocks are above their 50-day moving average.`,
    });
  }

  if (sectorParticipation < 35) {
    alerts.push({
      id: "sector-participation",
      severity: "moderate",
      title: "Low sector participation",
      message: `Only ${positiveSectors} tracked sectors are positive. Market strength is not broadly distributed.`,
    });
  }

  if (
    strongestSector &&
    safeNumber(strongestSector?.averageChangePercent, 0) > 1 &&
    sectorParticipation < 50
  ) {
    alerts.push({
      id: "sector-concentration",
      severity: "moderate",
      title: "Concentrated sector leadership",
      message: `${strongestSector.sector} is leading strongly while fewer than half of sectors are positive.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "balanced",
      severity: "low",
      title: "No major breadth warning",
      message: "Current index direction, participation and volume do not show a major internal market conflict.",
    });
  }

  return alerts.slice(0, 5);
}

function deriveDailyInterpretation({ sentiment, pulse, rotation, alerts, previousPulse }) {
  const advancingPercent = safeNumber(pulse?.advancingPercent, 50);
  const upVolumeShare = safeNumber(pulse?.upVolumeShare, 50);
  const participation = safeNumber(pulse?.marketParticipationScore, 50);
  const leader = rotation[0];
  const laggard = [...rotation].sort((a, b) => a.score - b.score)[0];
  const highRiskCount = alerts.filter((alert) => alert.severity === "high").length;
  const previousParticipation = safeNumber(previousPulse?.marketParticipationScore);
  const participationDelta = previousParticipation === null
    ? null
    : participation - previousParticipation;

  let directionSentence = `The composite market condition is ${sentiment.label.toLowerCase()} with ${formatNumber(advancingPercent, 1)}% of tracked stocks advancing.`;

  if (participationDelta !== null) {
    directionSentence += ` Participation ${participationDelta >= 0 ? "improved" : "weakened"} by ${formatNumber(Math.abs(participationDelta), 1)} points versus the previous stored snapshot.`;
  }

  const volumeSentence = upVolumeShare >= 55
    ? `Advancing stocks control ${formatNumber(upVolumeShare, 1)}% of tracked volume, supporting the move.`
    : upVolumeShare <= 45
      ? `Only ${formatNumber(upVolumeShare, 1)}% of tracked volume is in advancing stocks, so price strength lacks broad volume confirmation.`
      : "Advancing and declining volume are relatively balanced.";

  const sectorSentence = leader && laggard
    ? `${leader.sector} currently leads sector momentum, while ${laggard.sector} is the weakest tracked group.`
    : "Sector-rotation data is still building from the scheduled screener snapshots.";

  const riskSentence = highRiskCount > 0
    ? `${highRiskCount} high-severity internal market warning${highRiskCount === 1 ? " is" : "s are"} active, so risk control deserves extra attention.`
    : "No high-severity internal market warning is active in the current snapshot.";

  return `${directionSentence} ${volumeSentence} ${sectorSentence} ${riskSentence}`;
}

function StockList({ items, mode, onAnalyze }) {
  if (!items.length) {
    return (
      <div className="exa-pulse-empty exa-pulse-empty--compact">
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

          <div className="exa-pulse-stock-actions">
            <div className="exa-pulse-stock-value">
              <strong>{formatPrice(stock.price, stock.currency)}</strong>
              {mode === "active" ? (
                <span className="exa-pulse-stock-volume">
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
      <div className="exa-pulse-empty exa-pulse-empty--compact">
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

          <div className="exa-pulse-stock-actions">
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
  const [analyticsData, setAnalyticsData] = useState(null);
  const [nearHighs, setNearHighs] = useState([]);
  const [nearLows, setNearLows] = useState([]);
  const [snapshotMetadata, setSnapshotMetadata] = useState({
    generatedAt: null,
    source: "Market data",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [historyRange, setHistoryRange] = useState(7);

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
      fetchMarketPulseAnalytics(signal),
    ]);

    if (signal?.aborted) return;

    const [
      marketResult,
      moversResult,
      breadthResult,
      highsResult,
      lowsResult,
      analyticsResult,
    ] = tasks;

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
        source: "Market data",
      });
    } else {
      setNearHighs([]);
    }

    if (lowsResult.status === "fulfilled") {
      setNearLows(buildNearLows(lowsResult.value.stocks));
      setSnapshotMetadata((current) => ({
        generatedAt: current.generatedAt || lowsResult.value.generatedAt,
        source: "Market data",
      }));
    } else {
      setNearLows([]);
    }

    if (analyticsResult.status === "fulfilled") {
      setAnalyticsData(analyticsResult.value);
      setSnapshotMetadata((current) => ({
        generatedAt: analyticsResult.value.generatedAt || current.generatedAt,
        source: "Market data",
      }));
    } else {
      setAnalyticsData(null);
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

  const currentPulse = useMemo(() => {
    return analyticsData?.marketPulse || buildFallbackPulse(
      breadth,
      sectors,
      analyticsData?.generatedAt || marketData?.fetchedAt,
    );
  }, [analyticsData, breadth, sectors, marketData]);

  const trendRows = useMemo(
    () => buildTrendRows(analyticsData?.history || [], currentPulse),
    [analyticsData, currentPulse],
  );

  const historicalRows = useMemo(
    () => buildHistoricalRows(
      analyticsData?.history || [],
      currentPulse,
      historyRange,
    ),
    [analyticsData, currentPulse, historyRange],
  );

  const sectorHistory = useMemo(
    () => buildSectorHistory(
      analyticsData?.history || [],
      currentPulse,
      historyRange,
    ),
    [analyticsData, currentPulse, historyRange],
  );

  const historicalHighlights = useMemo(
    () => getHistoricalHighlights(historicalRows),
    [historicalRows],
  );

  const historicalIndexSeries = useMemo(
    () => HISTORICAL_INDEX_SERIES.filter((series) =>
      historicalRows.filter((row) =>
        Number.isFinite(Number(row?.[`${series.key}`])),
      ).length >= 2,
    ),
    [historicalRows],
  );

  const historyStartDate = historicalRows[0]?.date || null;
  const historyEndDate = historicalRows[historicalRows.length - 1]?.date || null;
  const hasComparableHistory = historicalRows.length >= 2;
  const hasIndexHistory =
    historicalIndexSeries.length > 0 &&
    historicalRows.some((row) =>
      historicalIndexSeries.some((series) =>
        Number.isFinite(Number(row?.[`${series.key}Normalized`])),
      ),
    );

  const previousPulse = useMemo(() => {
    const history = (analyticsData?.history || [])
      .filter(Boolean)
      .sort((a, b) => String(a?.date || "").localeCompare(String(b?.date || "")));

    if (history.length < 2) return null;

    const currentDate = currentPulse?.date;
    const earlier = history.filter((item) => item?.date !== currentDate);
    return earlier[earlier.length - 1] || history[history.length - 2] || null;
  }, [analyticsData, currentPulse]);

  const rotation = useMemo(
    () => deriveSectorRotation(currentPulse?.sectors || [], previousPulse?.sectors || []),
    [currentPulse, previousPulse],
  );

  const sentiment = useMemo(
    () => deriveSentiment(indices, sectors, breadth, currentPulse),
    [indices, sectors, breadth, currentPulse],
  );

  const alerts = useMemo(
    () => deriveRiskAlerts({ indices, pulse: currentPulse, sectors: rotation }),
    [indices, currentPulse, rotation],
  );

  const interpretation = useMemo(
    () => deriveDailyInterpretation({
      sentiment,
      pulse: currentPulse,
      rotation,
      alerts,
      previousPulse,
    }),
    [sentiment, currentPulse, rotation, alerts, previousPulse],
  );

  const movers = moversData?.movers || {};
  const fetchedAt = marketData?.fetchedAt || moversData?.fetchedAt || breadthData?.fetchedAt;
  const marketStatus = marketData?.marketStatus || {};
  const isOpen = Boolean(marketStatus?.isOpen);
  const marketPulseUsesFallback = String(
    marketData?.source || "",
  )
    .toLowerCase()
    .includes("fallback");

  function getMarketPulsePresentation() {
    if (loading) {
      return {
        status: "loading",
        label: "Loading market",
        description: "Preparing the latest market snapshot",
        fallbackText: "Fetching market data",
      };
    }

    if (error || marketPulseUsesFallback) {
      return {
        status: "fallback",
        label: "Reference data",
        description: "Live market services are temporarily unavailable",
        fallbackText: "Live update unavailable",
      };
    }

    if (warning) {
      return {
        status: "delayed",
        label: "Partial update",
        description: "Some market sections may be delayed",
        fallbackText: "Partial market update",
      };
    }

    if (marketData?.cached) {
      return {
        status: "cached",
        label: "Cached snapshot",
        description: isOpen
          ? "Latest available trading-session data"
          : "Latest completed-session data",
        fallbackText: "Cached update time unavailable",
      };
    }

    if (isOpen) {
      return {
        status: "live",
        label: "Market open",
        description: "Current Indian trading session",
        fallbackText: "Current update time unavailable",
      };
    }

    return {
      status: "delayed",
      label: "Market closed",
      description: "Latest completed Indian trading session",
      fallbackText: "Session update time unavailable",
    };
  }

  const marketPulsePresentation =
    getMarketPulsePresentation();

  const pulseAdvancing = safeNumber(currentPulse?.advancingPercent, advancing / breadthTotal * 100);
  const pulseDeclining = safeNumber(currentPulse?.decliningPercent, declining / breadthTotal * 100);
  const pulseAbove50 = safeNumber(currentPulse?.above50DMA, breadth?.above50DMA);
  const participationScore = safeNumber(currentPulse?.marketParticipationScore, 50);
  const upVolumeShare = safeNumber(currentPulse?.upVolumeShare, 50);
  const downVolumeShare = safeNumber(currentPulse?.downVolumeShare, 50);

  function openAnalysis(symbol) {
    if (!symbol) return;
    navigate(`/analyze?symbol=${encodeURIComponent(symbol)}`);
  }

  return (
    <AppShell>
      <main className="exa-pulse-page">
        <div className="exa-pulse-container">
          <section className="exa-pulse-header">
  <div className="exa-pulse-header-content">
    <h1>EXA Market Pulse</h1>
  </div>

  <div className="exa-pulse-header-controls">
    <div
      className={`exa-pulse-premium-status exa-pulse-premium-status--${marketPulsePresentation.status}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="exa-pulse-premium-status__dot"
        aria-hidden="true"
      />

      <strong>
        {marketPulsePresentation.label}
      </strong>
    </div>

    <button
      type="button"
      className="exa-pulse-button"
      disabled={refreshing}
      onClick={() =>
        loadMarketPulse({
          refresh: true,
        })
      }
    >
      {refreshing ? (
        <LoaderCircle
          size={14}
          className="exa-pulse-spinner"
        />
      ) : (
        <RefreshCw size={14} />
      )}

      {refreshing
        ? "Refreshing"
        : "Refresh market"}
    </button>
  </div>
</section>

          {warning && (
            <div className="exa-pulse-notice">
              <ShieldAlert size={16} />
              <span>{warning}</span>
            </div>
          )}

          {error && (
            <div className="exa-pulse-notice error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <section className="exa-pulse-card">
              <div className="exa-pulse-loading">
                <LoaderCircle size={31} className="exa-pulse-spinner" color="#60a5fa" />
                <strong>Building market intelligence</strong>
                <p>Loading indices, breadth, sector rotation, historical comparisons, risk timelines and market movers.</p>
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
                        <strong className="positive">{formatCompact(advancing)}</strong>
                      </div>
                      <div className="exa-pulse-breadth-stat">
                        <span>Declining</span>
                        <strong className="negative">{formatCompact(declining)}</strong>
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

              <section className="exa-pulse-intelligence-grid">
                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      
                      <div>
                        <h2>Breadth trend</h2>
                        <p>Participation history preserved by the scheduled Screener snapshot</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendRows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                          <CartesianGrid stroke="#17283f" strokeDasharray="3 3" />
                          <XAxis dataKey="label" stroke="#60728d" tick={{ fontSize: 9 }} />
                          <YAxis domain={[0, 100]} stroke="#60728d" tick={{ fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ background: "#081321", border: "1px solid #243752", borderRadius: 10, fontSize: 10 }}
                            labelStyle={{ color: "#dbeafe" }}
                          />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Line type="monotone" dataKey="advancing" name="Advancing %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="above50DMA" name="Above 50 DMA %" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="upVolume" name="Up-volume %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {trendRows.length < 2 && (
                      <p className="exa-pulse-chart-note">
                        Historical tracking starts with this snapshot. Each scheduled refresh will add or replace one daily point, building a rolling 30-snapshot history automatically.
                      </p>
                    )}
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><RotateCcw size={18} /></span>
                      <div>
                        <h2>Snapshot comparison</h2>
                        <p>Current breadth versus previous stored session</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-comparison-grid">
                      <div className="exa-pulse-comparison-tile">
                        <span>Advancing stocks</span>
                        <strong>
                          {formatNumber(pulseAdvancing, 1)}%
                          <DeltaIndicator value={previousPulse ? pulseAdvancing - safeNumber(previousPulse?.advancingPercent, pulseAdvancing) : null} />
                        </strong>
                      </div>

                      <div className="exa-pulse-comparison-tile">
                        <span>Above 50 DMA</span>
                        <strong>
                          {formatNumber(pulseAbove50, 1)}%
                          <DeltaIndicator value={previousPulse ? pulseAbove50 - safeNumber(previousPulse?.above50DMA, pulseAbove50) : null} />
                        </strong>
                      </div>

                      <div className="exa-pulse-comparison-tile">
                        <span>Up-volume share</span>
                        <strong>
                          {formatNumber(upVolumeShare, 1)}%
                          <DeltaIndicator value={previousPulse ? upVolumeShare - safeNumber(previousPulse?.upVolumeShare, upVolumeShare) : null} />
                        </strong>
                      </div>

                      <div className="exa-pulse-comparison-tile">
                        <span>Participation score</span>
                        <strong>
                          {formatNumber(participationScore, 1)}
                          <DeltaIndicator value={previousPulse ? participationScore - safeNumber(previousPulse?.marketParticipationScore, participationScore) : null} />
                        </strong>
                      </div>
                    </div>

                    <div className="exa-pulse-volume-track" aria-label="Up and down volume distribution">
                      <span className="up" style={{ width: `${upVolumeShare}%` }} />
                      <span className="down" style={{ width: `${downVolumeShare}%` }} />
                    </div>

                    <div className="exa-pulse-volume-legend">
                      <span>{formatNumber(upVolumeShare, 1)}% up-volume</span>
                      <span>{formatNumber(downVolumeShare, 1)}% down-volume</span>
                    </div>

                    <div className="exa-pulse-volume-grid">
                      <div className="exa-pulse-volume-tile">
                        <span>Volume vs average</span>
                        <strong>{formatNumber(currentPulse?.volumeRatio, 1)}%</strong>
                      </div>
                      <div className="exa-pulse-volume-tile">
                        <span>Positive sectors</span>
                        <strong>{formatCompact(currentPulse?.positiveSectors)}</strong>
                      </div>
                      <div className="exa-pulse-volume-tile">
                        <span>A/D ratio</span>
                        <strong>{formatNumber(currentPulse?.advanceDeclineRatio)}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              </section>

              <section className="exa-pulse-card exa-pulse-history-section">
                <header className="exa-pulse-card-header exa-pulse-history-header">
                  <div className="exa-pulse-card-title">
                    <span><CalendarDays size={18} /></span>
                    <div>
                      <h2>Historical market trends</h2>
                      <p>Rolling sentiment, index performance, breadth, sector leadership and risk regime</p>
                    </div>
                  </div>

                  <div className="exa-pulse-history-actions">
                    <div className="exa-pulse-range-control" aria-label="Historical range">
                      {HISTORY_RANGE_OPTIONS.map((range) => (
                        <button
                          key={range}
                          type="button"
                          className={historyRange === range ? "active" : ""}
                          onClick={() => setHistoryRange(range)}
                        >
                          {range}D
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="exa-pulse-button"
                      disabled={!historicalRows.length}
                      onClick={() => exportMarketHistoryCsv(historicalRows)}
                    >
                      <Download size={14} />
                      Export CSV
                    </button>
                  </div>
                </header>

                <div className="exa-pulse-card-body">
                  <div className="exa-pulse-history-meta-grid">
                    <div className="exa-pulse-history-meta">
                      <span>Stored sessions</span>
                      <strong>{historicalRows.length} / {historyRange}</strong>
                    </div>
                    <div className="exa-pulse-history-meta">
                      <span>History start</span>
                      <strong>{historyStartDate ? formatTrendDate(historyStartDate) : "Building"}</strong>
                    </div>
                    <div className="exa-pulse-history-meta">
                      <span>Latest session</span>
                      <strong>{historyEndDate ? formatTrendDate(historyEndDate) : "Not available"}</strong>
                    </div>
                    <div className="exa-pulse-history-meta">
                      <span>Data status</span>
                      <strong>{hasComparableHistory ? "Comparison ready" : "Baseline only"}</strong>
                    </div>
                  </div>

                  {!hasComparableHistory && (
                    <div className="exa-pulse-notice exa-pulse-notice--flush">
                      <Database size={16} />
                      <span>
                        Historical tracking currently has one stored session. The scheduled snapshot workflow will add one point per Indian-market date, and all comparisons will activate automatically.
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="exa-pulse-history-grid">
                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><Gauge size={18} /></span>
                      <div>
                        <h2>Sentiment history</h2>
                        <p>Composite market condition versus participation score</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalRows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                          <CartesianGrid stroke="#17283f" strokeDasharray="3 3" />
                          <XAxis dataKey="label" stroke="#60728d" tick={{ fontSize: 9 }} />
                          <YAxis domain={[0, 100]} stroke="#60728d" tick={{ fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ background: "#081321", border: "1px solid #243752", borderRadius: 10, fontSize: 10 }}
                            labelStyle={{ color: "#dbeafe" }}
                          />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Line type="monotone" dataKey="sentiment" name="Sentiment score" stroke="#60a5fa" strokeWidth={2.2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="participation" name="Participation" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="sectorParticipation" name="Sector participation" stroke="#f59e0b" strokeWidth={1.8} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="exa-pulse-history-summary">
                      <div>
                        <span>Latest score</span>
                        <strong>{formatNumber(historicalHighlights.latest?.sentiment, 0)}/100</strong>
                      </div>
                      <div>
                        <span>Session change</span>
                        <strong className={getMoveClass(
                          historicalHighlights.previous
                            ? historicalHighlights.latest?.sentiment - historicalHighlights.previous?.sentiment
                            : 0
                        )}>
                          {historicalHighlights.previous
                            ? `${historicalHighlights.latest?.sentiment - historicalHighlights.previous?.sentiment >= 0 ? "+" : ""}${formatNumber(
                                historicalHighlights.latest?.sentiment - historicalHighlights.previous?.sentiment,
                                0,
                              )}`
                            : "Baseline"}
                        </strong>
                      </div>
                      <div>
                        <span>Latest risk</span>
                        <strong style={{ textTransform: "capitalize" }}>{historicalHighlights.latest?.risk || "Not available"}</strong>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><TrendingUp size={18} /></span>
                      <div>
                        <h2>Normalized index performance</h2>
                        <p>Percentage performance from the first available session in the selected range</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    {hasIndexHistory ? (
                      <>
                        <div className="exa-pulse-chart-shell">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalRows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                              <CartesianGrid stroke="#17283f" strokeDasharray="3 3" />
                              <XAxis dataKey="label" stroke="#60728d" tick={{ fontSize: 9 }} />
                              <YAxis
                                stroke="#60728d"
                                tick={{ fontSize: 9 }}
                                tickFormatter={(value) => `${formatNumber(value, 1)}%`}
                              />
                              <Tooltip
                                formatter={(value) => [`${formatNumber(value, 2)}%`, ""]}
                                contentStyle={{ background: "#081321", border: "1px solid #243752", borderRadius: 10, fontSize: 10 }}
                                labelStyle={{ color: "#dbeafe" }}
                              />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                              {historicalIndexSeries.map((series) => (
                                <Line
                                  key={series.key}
                                  type="monotone"
                                  dataKey={`${series.key}Normalized`}
                                  name={series.name}
                                  stroke={series.stroke}
                                  strokeWidth={2}
                                  connectNulls
                                  dot={{ r: 2.5 }}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    ) : (
                      <div className="exa-pulse-history-empty">
                        <TrendingUp size={28} />
                        <strong>Index history starts with the next snapshot</strong>
                        <p>
                          The scheduled market snapshot stores NIFTY 50, SENSEX, BANK NIFTY and NIFTY IT values. Two stored sessions are required for normalized comparison.
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              </section>

              <section className="exa-pulse-history-grid">
                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><Waves size={18} /></span>
                      <div>
                        <h2>Breadth and volume history</h2>
                        <p>Advance–decline ratio, 50-DMA participation and directional volume</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalRows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                          <CartesianGrid stroke="#17283f" strokeDasharray="3 3" />
                          <XAxis dataKey="label" stroke="#60728d" tick={{ fontSize: 9 }} />
                          <YAxis yAxisId="percent" domain={[0, 100]} stroke="#60728d" tick={{ fontSize: 9 }} />
                          <YAxis yAxisId="ratio" orientation="right" stroke="#60728d" tick={{ fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ background: "#081321", border: "1px solid #243752", borderRadius: 10, fontSize: 10 }}
                            labelStyle={{ color: "#dbeafe" }}
                          />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Line yAxisId="percent" type="monotone" dataKey="above50DMA" name="Above 50 DMA %" stroke="#60a5fa" strokeWidth={2} dot={{ r: 2.5 }} />
                          <Line yAxisId="percent" type="monotone" dataKey="upVolume" name="Up-volume %" stroke="#22c55e" strokeWidth={2} dot={{ r: 2.5 }} />
                          <Line yAxisId="percent" type="monotone" dataKey="downVolume" name="Down-volume %" stroke="#fb7185" strokeWidth={1.8} dot={false} />
                          <Line yAxisId="ratio" type="monotone" dataKey="adRatio" name="A/D ratio" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2.5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><ShieldAlert size={18} /></span>
                      <div>
                        <h2>Historical risk timeline</h2>
                        <p>Rule-based internal market risk classification by stored session</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-risk-timeline">
                      {historicalRows.slice(-10).reverse().map((row) => {
                        const width =
                          row.risk === "high"
                            ? 100
                            : row.risk === "moderate"
                              ? 66
                              : 33;

                        return (
                          <div className="exa-pulse-risk-row" key={`risk-${row.date}`}>
                            <span>{row.label}</span>
                            <div className="exa-pulse-risk-track">
                              <span className={row.risk} style={{ width: `${width}%` }} />
                            </div>
                            <strong>{row.risk}</strong>
                          </div>
                        );
                      })}
                    </div>

                    <div className="exa-pulse-session-grid exa-pulse-session-grid--spaced">
                      <div className="exa-pulse-session-card best">
                        <span>Best stored session</span>
                        <strong>{historicalHighlights.best?.label || "Building"}</strong>
                        <p>
                          Sentiment {formatNumber(historicalHighlights.best?.sentiment, 0)}/100 ·
                          {" "}{formatNumber(historicalHighlights.best?.advancing, 1)}% advancing
                        </p>
                      </div>

                      <div className="exa-pulse-session-card weakest">
                        <span>Weakest stored session</span>
                        <strong>{historicalHighlights.weakest?.label || "Building"}</strong>
                        <p>
                          Sentiment {formatNumber(historicalHighlights.weakest?.sentiment, 0)}/100 ·
                          {" "}{formatNumber(historicalHighlights.weakest?.declining, 1)}% declining
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </section>

              <section className="exa-pulse-card exa-pulse-section-gap">
                <header className="exa-pulse-card-header">
                  <div className="exa-pulse-card-title">
                    <span><Trophy size={18} /></span>
                    <div>
                      <h2>Sector leadership history</h2>
                      <p>Daily average sector performance for the latest leading groups</p>
                    </div>
                  </div>
                </header>

                <div className="exa-pulse-card-body">
                  {sectorHistory.names.length > 0 ? (
                    <>
                      <div className="exa-pulse-chart-shell">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sectorHistory.rows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                            <CartesianGrid stroke="#17283f" strokeDasharray="3 3" />
                            <XAxis dataKey="label" stroke="#60728d" tick={{ fontSize: 9 }} />
                            <YAxis
                              stroke="#60728d"
                              tick={{ fontSize: 9 }}
                              tickFormatter={(value) => `${formatNumber(value, 1)}%`}
                            />
                            <Tooltip
                              formatter={(value) => [`${formatNumber(value, 2)}%`, ""]}
                              contentStyle={{ background: "#081321", border: "1px solid #243752", borderRadius: 10, fontSize: 10 }}
                              labelStyle={{ color: "#dbeafe" }}
                            />
                            {sectorHistory.names.map((name, index) => (
                              <Line
                                key={name}
                                type="monotone"
                                dataKey={name}
                                name={name}
                                stroke={SECTOR_HISTORY_COLORS[index % SECTOR_HISTORY_COLORS.length]}
                                strokeWidth={2}
                                connectNulls
                                dot={{ r: 2.5 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="exa-pulse-sector-history-legend">
                        {sectorHistory.names.map((name, index) => (
                          <span key={`legend-${name}`}>
                            <i style={{ background: SECTOR_HISTORY_COLORS[index % SECTOR_HISTORY_COLORS.length] }} />
                            {name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="exa-pulse-history-empty">
                      <Layers3 size={28} />
                      <strong>Sector history is still building</strong>
                      <p>The scheduled snapshot will preserve sector performance for each Indian-market date.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="exa-pulse-card exa-pulse-section-gap">
                <header className="exa-pulse-card-header">
                  <div className="exa-pulse-card-title">
                    <span><Layers3 size={18} /></span>
                    <div>
                      <h2>Sector rotation</h2>
                      <p>Momentum combines sector change, breadth, 50-DMA participation and relative volume</p>
                    </div>
                  </div>
                </header>

                <div className="exa-pulse-card-body">
                  <div className="exa-pulse-rotation-list">
                    {rotation.slice(0, 10).map((sector) => (
                      <div className="exa-pulse-rotation-row" key={sector.sector}>
                        <div className="exa-pulse-rotation-name">
                          <strong>{sector.sector}</strong>
                          <span>{formatCompact(sector.stockCount)} tracked stocks</span>
                        </div>

                        <div className="exa-pulse-rotation-metric">
                          <strong>{formatNumber(sector.score, 1)}</strong>
                          <span>Momentum score</span>
                        </div>

                        <div className="exa-pulse-rotation-metric">
                          <strong className={getMoveClass(sector.averageChangePercent)}>
                            {safeNumber(sector.averageChangePercent, 0) >= 0 ? "+" : ""}
                            {formatNumber(sector.averageChangePercent)}%
                          </strong>
                          <span>{formatNumber(sector.advancingPercent, 1)}% advancing</span>
                        </div>

                        <span className={`exa-pulse-badge ${sector.statusClass}`}>
                          {sector.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="exa-pulse-risk-grid">
                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><TriangleAlert size={18} /></span>
                      <div>
                        <h2>Market risk alerts</h2>
                        <p>Rule-based warnings from breadth, volume and sector participation</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-alert-list">
                      {alerts.map((alert) => (
                        <div className={`exa-pulse-alert-item ${alert.severity}`} key={alert.id}>
                          <span className="exa-pulse-alert-icon">
                            {alert.severity === "high"
                              ? <ShieldAlert size={15} />
                              : alert.severity === "moderate"
                                ? <TriangleAlert size={15} />
                                : <CheckCircle2 size={15} />}
                          </span>

                          <div className="exa-pulse-alert-copy">
                            <strong>{alert.title}</strong>
                            <p>{alert.message}</p>
                          </div>

                          <span className={`exa-pulse-severity ${alert.severity}`}>
                            {alert.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="exa-pulse-card">
                  <header className="exa-pulse-card-header">
                    <div className="exa-pulse-card-title">
                      <span><Sparkles size={18} /></span>
                      <div>
                        <h2>Daily market interpretation</h2>
                        <p>Plain-language summary of the current internal market condition</p>
                      </div>
                    </div>
                  </header>

                  <div className="exa-pulse-card-body">
                    <div className="exa-pulse-interpretation">
                      <h3>{sentiment.label} market condition</h3>
                      <p>{interpretation}</p>
                    </div>

                    <div className="exa-pulse-volume-grid">
                      <div className="exa-pulse-volume-tile">
                        <span>Participation</span>
                        <strong>{formatNumber(participationScore, 1)}/100</strong>
                      </div>
                      <div className="exa-pulse-volume-tile">
                        <span>Advancing</span>
                        <strong className="positive">{formatNumber(pulseAdvancing, 1)}%</strong>
                      </div>
                      <div className="exa-pulse-volume-tile">
                        <span>Declining</span>
                        <strong className="negative">{formatNumber(pulseDeclining, 1)}%</strong>
                      </div>
                    </div>

                    <div className="exa-pulse-chart-shell exa-pulse-chart-shell--compact">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Advancing", value: pulseAdvancing },
                            { name: "Above 50 DMA", value: pulseAbove50 },
                            { name: "Up-volume", value: upVolumeShare },
                            { name: "Sector participation", value: safeNumber(currentPulse?.sectorParticipationPercent, 50) },
                          ]}
                          margin={{ top: 6, right: 8, left: -20, bottom: 6 }}
                        >
                          <CartesianGrid stroke="#17283f" strokeDasharray="3 3" />
                          <XAxis dataKey="name" stroke="#60728d" tick={{ fontSize: 8 }} interval={0} />
                          <YAxis domain={[0, 100]} stroke="#60728d" tick={{ fontSize: 8 }} />
                          <Tooltip
                            contentStyle={{ background: "#081321", border: "1px solid #243752", borderRadius: 10, fontSize: 10 }}
                            labelStyle={{ color: "#dbeafe" }}
                          />
                          <Bar dataKey="value" name="Participation %" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </article>
              </section>

              <section className="exa-pulse-card exa-pulse-section-gap">
                <header className="exa-pulse-card-header">
                  <div className="exa-pulse-card-title">
                    <span><Zap size={18} /></span>
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
            Market data may be delayed, incomplete or based on the latest completed session. Risk alerts and scores are rule-based educational indicators, not personalized investment advice or a buy/sell recommendation.
          </p>
        </div>
      </main>
    </AppShell>
  );
}