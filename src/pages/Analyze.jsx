import { useEffect, useMemo, useState } from "react";
import useIsMobile from "../hooks/useIsMobile";

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
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import ScoreGauge from "../components/ScoreGauge";

import {
  getAiAnalysis,
  getStockData,
  searchStocks,
} from "../services/financeApi";

const SAMPLES = [
  "Reliance Industries",
  "HDFC Bank",
  "Infosys",
  "Tata Motors",
  "Wipro",
  "Asian Paints",
  "Zomato",
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
    color: "#22c55e",
    bg: "#052e16",
    label: "Positive",
  },
  SELL: {
    color: "#ef4444",
    bg: "#450a0a",
    label: "Negative",
  },
  NEUTRAL: {
    color: "#eab308",
    bg: "#422006",
    label: "Neutral",
  },
  WATCH: {
    color: "#3b82f6",
    bg: "#172554",
    label: "Watch",
  },
};

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatMetric(value, maximumFractionDigits = 2) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
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

function formatIndianLargeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  if (number >= 1_000_000_000_000) {
    return `${(
      number / 1_000_000_000_000
    ).toFixed(2)} Lakh Cr`;
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
    error instanceof Error
      ? error.message
      : error || "",
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

function createLiveResult(stockData, selectedStock) {
  return {
    symbol: stockData.symbol,

    ticker: stockData.symbol,

    company:
      stockData.name ||
      selectedStock?.name ||
      stockData.symbol,

    sector: stockData.sector || "N/A",

    industry: stockData.industry || "N/A",

    price: stockData.price ?? null,

    changeAbs: stockData.change ?? 0,

    changePercent: stockData.changePercent ?? 0,

    marketCap: stockData.marketCap ?? null,

    peRatio: stockData.peRatioTTM ?? null,

    week52Low: stockData.fiftyTwoWeekLow ?? null,

    week52High: stockData.fiftyTwoWeekHigh ?? null,

    volume: stockData.volume ?? null,

    chart: Array.isArray(stockData.chart)
      ? stockData.chart
      : [],

    source: stockData.source || "Yahoo Finance",

    lastUpdated: stockData.lastUpdated || null,

    logoDomain:
      stockData.logoDomain ||
      getCompanyDomain(stockData.website),

    signal: "WATCH",

    summary: "",

    keyThemes: [],

    growthDrivers: [],

    keyRisks: [],

    confidenceScore: 0,

    riskLevel: "Moderate",

    fundamentalScore: 0,
    fundamentalLabel: "AI unavailable",

    momentumScore: 0,
    momentumLabel: "AI unavailable",

    valuationScore: 0,
    valuationLabel: "AI unavailable",

    sentimentScore: 0,
    sentimentLabel: "AI unavailable",

    aiAvailable: false,
    aiSummaryCached: false,
  };
}

function mergeAiAnalysis(liveResult, aiAnalysis) {
  const strength = Number(aiAnalysis?.strength);

  const confidenceScore =
    aiAnalysis?.confidenceScore ??
    (Number.isFinite(strength)
      ? Math.min(100, Math.max(0, strength * 10))
      : liveResult.confidenceScore);

  return {
    ...liveResult,
    ...aiAnalysis,

    symbol: liveResult.symbol,

    ticker:
      aiAnalysis?.ticker ||
      liveResult.ticker,

    company:
      aiAnalysis?.company ||
      liveResult.company,

    sector:
      aiAnalysis?.sector ||
      liveResult.sector,

    industry:
      aiAnalysis?.industry ||
      liveResult.industry,

    /*
     * Always retain live Yahoo Finance values.
     * Gemini cannot replace these fields.
     */
    price: liveResult.price,
    changeAbs: liveResult.changeAbs,
    changePercent: liveResult.changePercent,
    marketCap: liveResult.marketCap,
    peRatio: liveResult.peRatio,
    week52Low: liveResult.week52Low,
    week52High: liveResult.week52High,
    volume: liveResult.volume,
    chart: liveResult.chart,
    source: liveResult.source,
    lastUpdated: liveResult.lastUpdated,

    logoDomain:
      aiAnalysis?.logoDomain ||
      liveResult.logoDomain,

    signal: String(
      aiAnalysis?.signal || "NEUTRAL",
    ).toUpperCase(),

    summary:
      aiAnalysis?.summary || "",

    keyThemes: Array.isArray(aiAnalysis?.keyThemes)
      ? aiAnalysis.keyThemes
      : [],

    growthDrivers: Array.isArray(
      aiAnalysis?.growthDrivers,
    )
      ? aiAnalysis.growthDrivers
      : Array.isArray(aiAnalysis?.positives)
        ? aiAnalysis.positives
        : [],

    keyRisks: Array.isArray(aiAnalysis?.keyRisks)
      ? aiAnalysis.keyRisks
      : Array.isArray(aiAnalysis?.risks)
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
      Boolean(aiAnalysis?.aiSummaryCached),
  };
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#101a30",
        border: "1px solid #1e293b",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={17} color="#93c5fd" />
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score, scoreLabel }) {
  const numericScore = Number(score) || 0;

  const labelColor =
    numericScore >= 70
      ? "#22c55e"
      : numericScore >= 40
        ? "#eab308"
        : "#ef4444";

  return (
    <div
      style={{
        background: "#101a30",
        border: "1px solid #1e293b",
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
          color: "#cbd5e1",
        }}
      >
        {title}
      </div>

      <ScoreGauge score={numericScore} size={64} />

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

function CompanyLogo({ domain, name, size = 52 }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [domain]);

  const logoKey = import.meta.env.VITE_LOGO_KEY;

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
        background: showImage ? "#fff" : "#1e293b",
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
          alt={name || "Company logo"}
          onError={() => setFailed(true)}
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
          {name?.charAt(0)?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

export default function Analyze() {
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  const [error, setError] = useState("");
  const [aiNotice, setAiNotice] = useState("");

  const [result, setResult] = useState(null);
  const [timeframe, setTimeframe] = useState("1D");
  const [activeTab, setActiveTab] = useState("Overview");

  async function analyze(stock) {
    const q = String(stock || query).trim();

    if (!q || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setAiNotice("");
    setResult(null);

    try {
      /*
       * Step 1: Find the Yahoo Finance symbol.
       */
      const searchResults = await searchStocks(q);

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
            item?.quoteType === "EQUITY" &&
            item?.symbol?.endsWith(".NS"),
        ) ||
        searchResults.find(
          (item) =>
            item?.quoteType === "EQUITY" &&
            item?.symbol?.endsWith(".BO"),
        ) ||
        searchResults.find(
          (item) =>
            item?.quoteType === "EQUITY",
        ) ||
        searchResults[0];

      if (!selectedStock?.symbol) {
        throw new Error(
          "A valid stock symbol was not found.",
        );
      }

      /*
       * Step 2: Fetch live Yahoo Finance data.
       */
      const stockData = await getStockData(
        selectedStock.symbol,
        RANGE_MAP[timeframe],
      );

      if (!stockData?.symbol) {
        throw new Error(
          "Yahoo Finance returned incomplete stock data.",
        );
      }

      /*
       * Immediately save the live market result.
       * The dashboard continues working even if Gemini fails.
       */
      const liveResult = createLiveResult(
        stockData,
        selectedStock,
      );

      setResult(liveResult);
      setQuery("");

      /*
       * Step 3: Request the optional AI summary.
       */
      try {
        const aiAnalysis = await getAiAnalysis(
          stockData,
        );

        if (
          !aiAnalysis ||
          typeof aiAnalysis !== "object"
        ) {
          throw new Error(
            "The AI returned incomplete analysis data.",
          );
        }

        const completeResult = mergeAiAnalysis(
          liveResult,
          aiAnalysis,
        );

        setResult(completeResult);
        setAiNotice("");
      } catch (aiError) {
        console.error(
          "AI analysis unavailable:",
          aiError,
        );

        if (isAiLimitError(aiError)) {
          setAiNotice(
            "The AI summary is temporarily unavailable because the free Gemini usage limit was reached. Live Yahoo Finance prices, metrics and chart data are still available.",
          );
        } else {
          setAiNotice(
            "The AI summary is temporarily unavailable. Live Yahoo Finance prices, metrics and chart data are still available.",
          );
        }

        /*
         * Do not call setError here.
         * The Yahoo Finance result remains visible.
         */
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

  async function handleTimeframeChange(
    nextTimeframe,
  ) {
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
      /*
       * This calls only Yahoo Finance.
       * Gemini is not called when changing chart range.
       */
      const updatedStockData =
        await getStockData(
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

  return (
    <div
      style={{
        width: "100%",
        padding: isMobile
          ? "16px"
          : "20px 32px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Search row */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile
            ? "column"
            : "row",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !loading
            ) {
              analyze();
            }
          }}
          placeholder="Search stocks, sectors or themes..."
          disabled={loading}
          style={{
            flex: 1,
            width: isMobile ? "100%" : "50%",
            boxSizing: "border-box",
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 15,
            border: "1px solid #1e293b",
            background: "#101a30",
            color: "#fff",
            outline: "none",
            opacity: loading ? 0.7 : 1,
          }}
        />

        <button
          type="button"
          onClick={() => analyze()}
          disabled={
            loading ||
            !query.trim()
          }
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            cursor:
              loading || !query.trim()
                ? "not-allowed"
                : "pointer",
            whiteSpace: "nowrap",
            opacity:
              loading || !query.trim()
                ? 0.65
                : 1,
          }}
        >
          {loading
            ? "Analyzing..."
            : "Analyze"}
        </button>
      </div>

      {/* Sample chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {SAMPLES.map((sample) => (
          <button
            type="button"
            key={sample}
            onClick={() => analyze(sample)}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 14,
              background: "#101a30",
              border: "1px solid #1e293b",
              color: "#cbd5e1",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {sample}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            background: "#450a0a",
            border: "1px solid #7f1d1d",
            borderRadius: 10,
            color: "#fca5a5",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {aiNotice && (
        <div
          style={{
            padding: 14,
            background: "#10233d",
            border: "1px solid #365a84",
            borderRadius: 10,
            color: "#93c5fd",
            marginBottom: 20,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <strong>AI notice: </strong>
          {aiNotice}
        </div>
      )}

      {loading && !result && (
        <div
          style={{
            textAlign: "center",
            color: "#94a3b8",
            padding: 60,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          Loading live Yahoo Finance data and AI analysis...
        </div>
      )}

      {!result &&
        !loading &&
        !error && (
          <div
            style={{
              textAlign: "center",
              color: "#475569",
              padding: 60,
              fontSize: 14,
            }}
          >
            Search for a stock or select one above to view live
            market data and AI-powered research.
          </div>
        )}

      {result && sig && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "2fr 1fr",
            gap: 16,
          }}
        >
          {/* Left column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minWidth: 0,
            }}
          >
            {/* Stock header */}
            <div
              style={{
                background: "#101a30",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile
                    ? "column"
                    : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile
                    ? "stretch"
                    : "flex-start",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    minWidth: 0,
                  }}
                >
                  <CompanyLogo
                    domain={result.logoDomain}
                    name={result.company}
                    size={52}
                  />

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 19,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {result.company}
                      </span>

                      <Star
                        size={16}
                        color="#64748b"
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#60a5fa",
                        marginTop: 2,
                      }}
                    >
                      {result.ticker}

                      <span
                        style={{
                          color: "#64748b",
                        }}
                      >
                        {" "}
                        · {result.sector || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: sig.bg,
                    color: sig.color,
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {changePercent >= 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}

                  {result.aiAvailable
                    ? `AI View: ${sig.label}`
                    : "AI View: Unavailable"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  ₹{formatPrice(result.price)}
                </span>

                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color:
                      changePercent >= 0
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                >
                  {changePercent >= 0
                    ? "▲"
                    : "▼"}{" "}
                  {formatMetric(
                    Math.abs(changeAbs),
                  )}{" "}
                  (
                  {formatMetric(
                    Math.abs(changePercent),
                  )}
                  %)
                </span>

                <span
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  Today
                </span>
              </div>
            </div>

            {/* Metric cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(4, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <MetricCard
                icon={Building2}
                label="Market cap"
                value={formatIndianLargeNumber(
                  result.marketCap,
                )}
              />

              <MetricCard
                icon={BarChart3}
                label="P/E ratio (TTM)"
                value={formatMetric(
                  result.peRatio,
                )}
              />

              <MetricCard
                icon={ArrowUpDown}
                label="52W range"
                value={`${formatMetric(
                  result.week52Low,
                )} - ${formatMetric(
                  result.week52High,
                )}`}
              />

              <MetricCard
                icon={Database}
                label="Volume"
                value={formatIndianLargeNumber(
                  result.volume,
                )}
              />
            </div>

            {/* Chart */}
            <div
              style={{
                background: "#101a30",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 12,
                  overflowX: "auto",
                }}
              >
                {TIMEFRAMES.map((tf) => (
                  <button
                    type="button"
                    key={tf}
                    onClick={() =>
                      handleTimeframeChange(tf)
                    }
                    disabled={chartLoading}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: chartLoading
                        ? "not-allowed"
                        : "pointer",
                      border: "none",
                      background:
                        timeframe === tf
                          ? "#1d4ed8"
                          : "transparent",
                      color:
                        timeframe === tf
                          ? "#fff"
                          : "#64748b",
                      opacity: chartLoading
                        ? 0.7
                        : 1,
                    }}
                  >
                    {chartLoading &&
                    timeframe === tf
                      ? "..."
                      : tf}
                  </button>
                ))}
              </div>

              <div
                style={{
                  height: 240,
                  position: "relative",
                }}
              >
                {chartLoading ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    Updating chart...
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="priceFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#3b82f6"
                            stopOpacity={0.35}
                          />

                          <stop
                            offset="100%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#1e293b"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="i"
                        hide
                      />

                      <YAxis
                        domain={[
                          "auto",
                          "auto",
                        ]}
                        tick={{
                          fill: "#64748b",
                          fontSize: 11,
                        }}
                        width={60}
                        tickFormatter={(value) =>
                          formatMetric(
                            value,
                            0,
                          )
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border:
                            "1px solid #1e293b",
                          borderRadius: 8,
                          color: "#fff",
                        }}
                        labelStyle={{
                          display: "none",
                        }}
                        formatter={(value) => [
                          `₹${formatPrice(value)}`,
                          "Price",
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#priceFill)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    Chart data is currently unavailable.
                  </div>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div
              style={{
                display: "flex",
                gap: 4,
                borderBottom:
                  "1px solid #1e293b",
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
                        ? "#fff"
                        : "#64748b",
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

            {activeTab === "Overview" ? (
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
                  score={
                    result.fundamentalScore
                  }
                  scoreLabel={
                    result.fundamentalLabel
                  }
                />

                <ScoreCard
                  title="Momentum score"
                  score={result.momentumScore}
                  scoreLabel={
                    result.momentumLabel
                  }
                />

                <ScoreCard
                  title="Valuation score"
                  score={
                    result.valuationScore
                  }
                  scoreLabel={
                    result.valuationLabel
                  }
                />

                <ScoreCard
                  title="Sentiment score"
                  score={
                    result.sentimentScore
                  }
                  scoreLabel={
                    result.sentimentLabel
                  }
                />
              </div>
            ) : (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#475569",
                  fontSize: 14,
                }}
              >
                This tab is part of the EXA NEXUS roadmap and will
                be added in a later phase.
              </div>
            )}
          </div>

          {/* Right column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: "#101a30",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginBottom: 8,
                    }}
                  >
                    Confidence score
                  </div>

                  <ScoreGauge
                    score={
                      Number(
                        result.confidenceScore,
                      ) || 0
                    }
                    size={72}
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginBottom: 8,
                    }}
                  >
                    Risk level
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color:
                        result.riskLevel ===
                        "Low"
                          ? "#22c55e"
                          : result.riskLevel ===
                              "High"
                            ? "#ef4444"
                            : "#eab308",
                    }}
                  >
                    {result.riskLevel ||
                      "Moderate"}
                  </div>
                </div>
              </div>
            </div>

            {/* AI summary */}
            <div
              style={{
                background: "#101a30",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#60a5fa",
                  marginBottom: 10,
                }}
              >
                <Sparkles size={15} />
                AI research summary
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "#cbd5e1",
                  lineHeight: 1.7,
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                {result.summary ||
                  aiNotice ||
                  "AI research summary is currently unavailable. Live market information is still available from Yahoo Finance."}
              </p>

              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                Key themes
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {result.keyThemes.length >
                0 ? (
                  result.keyThemes.map(
                    (theme, index) => (
                      <span
                        key={`${theme}-${index}`}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background:
                            "#1e293b",
                          color: "#93c5fd",
                        }}
                      >
                        {theme}
                      </span>
                    ),
                  )
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    No AI themes available.
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "1fr 1fr",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "#052e16",
                  border: "1px solid #166534",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#4ade80",
                    marginBottom: 8,
                  }}
                >
                  <ShieldCheck size={14} />
                  Growth drivers
                </div>

                {result.growthDrivers.length >
                0 ? (
                  result.growthDrivers.map(
                    (driver, index) => (
                      <div
                        key={`${driver}-${index}`}
                        style={{
                          fontSize: 12.5,
                          color: "#86efac",
                          marginBottom: 6,
                          lineHeight: 1.5,
                        }}
                      >
                        • {driver}
                      </div>
                    ),
                  )
                ) : (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#86efac",
                    }}
                  >
                    AI growth drivers are currently unavailable.
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "#431407",
                  border: "1px solid #9a3412",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fb923c",
                    marginBottom: 8,
                  }}
                >
                  <AlertTriangle size={14} />
                  Key risks
                </div>

                {result.keyRisks.length >
                0 ? (
                  result.keyRisks.map(
                    (risk, index) => (
                      <div
                        key={`${risk}-${index}`}
                        style={{
                          fontSize: 12.5,
                          color: "#fdba74",
                          marginBottom: 6,
                          lineHeight: 1.5,
                        }}
                      >
                        • {risk}
                      </div>
                    ),
                  )
                ) : (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#fdba74",
                    }}
                  >
                    AI risk analysis is currently unavailable.
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#475569",
                lineHeight: 1.6,
                textAlign: "center",
                padding: "4px 8px",
              }}
            >
              Market data source:{" "}
              {result.source ||
                "Yahoo Finance"}
              . AI analysis is provided for
              educational research purposes and
              is not financial advice.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}