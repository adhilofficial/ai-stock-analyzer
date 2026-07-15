import {
  useId,
  useMemo,
} from "react";

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
  Activity,
  ArrowUpRight,
  ChevronDown,
  LineChart,
  Sparkles,
} from "lucide-react";

function safeNumber(
  value,
  fallback = 0,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function findNiftyIndex(
  indices = [],
) {
  return (
    indices.find((index) => {
      const ticker = String(
        index?.ticker || "",
      ).toUpperCase();

      const symbol = String(
        index?.symbol || "",
      ).toUpperCase();

      return (
        ticker === "^NSEI" ||
        symbol.includes("NIFTY 50")
      );
    }) || null
  );
}

function findIndiaVix(
  indices = [],
) {
  return (
    indices.find((index) => {
      const ticker = String(
        index?.ticker || "",
      ).toUpperCase();

      const symbol = String(
        index?.symbol || "",
      ).toUpperCase();

      return (
        ticker.includes("INDIAVIX") ||
        symbol.includes("VIX")
      );
    }) || null
  );
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  ).format(number);
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `${
    number >= 0 ? "+" : ""
  }${number.toFixed(2)}%`;
}

function formatChartTime(
  index,
  total,
) {
  if (total <= 1) {
    return "9:15 AM";
  }

  const marketOpenMinutes =
    9 * 60 + 15;

  const marketCloseMinutes =
    15 * 60 + 30;

  const progress =
    index / (total - 1);

  const currentMinutes =
    Math.round(
      marketOpenMinutes +
        (
          marketCloseMinutes -
          marketOpenMinutes
        ) *
          progress,
    );

  const hours24 =
    Math.floor(
      currentMinutes / 60,
    );

  const minutes =
    currentMinutes % 60;

  const period =
    hours24 >= 12
      ? "PM"
      : "AM";

  const hours12 =
    hours24 % 12 || 12;

  return `${hours12}:${String(
    minutes,
  ).padStart(2, "0")} ${period}`;
}

function createChartData(
  trend = [],
) {
  const values =
    Array.isArray(trend)
      ? trend
          .map(Number)
          .filter(Number.isFinite)
      : [];

  return values.map(
    (value, index) => ({
      value,
      time: formatChartTime(
        index,
        values.length,
      ),
    }),
  );
}

function getSectorSummary(
  sectors = [],
) {
  const usableSectors =
    Array.isArray(sectors)
      ? sectors.filter((sector) =>
          Number.isFinite(
            Number(
              sector?.changePercent,
            ),
          ),
        )
      : [];

  if (
    usableSectors.length === 0
  ) {
    return {
      positiveCount: 0,
      total: 0,
      positivePercent: 0,
      strongest: null,
      weakest: null,
    };
  }

  const sorted = [
    ...usableSectors,
  ].sort(
    (first, second) =>
      Number(
        second.changePercent,
      ) -
      Number(
        first.changePercent,
      ),
  );

  const positiveCount =
    usableSectors.filter(
      (sector) =>
        Number(
          sector.changePercent,
        ) > 0,
    ).length;

  return {
    positiveCount,

    total:
      usableSectors.length,

    positivePercent:
      (
        positiveCount /
        usableSectors.length
      ) *
      100,

    strongest:
      sorted[0],

    weakest:
      sorted[
        sorted.length - 1
      ],
  };
}

function createMarketSummary({
  nifty,
  indiaVix,
  breadth,
  sectors,
  alertCount,
}) {
  const niftyChange =
    safeNumber(
      nifty?.changePercent,
      0,
    );

  const vixValue =
    safeNumber(
      indiaVix?.value,
      0,
    );

  const vixChange =
    safeNumber(
      indiaVix?.changePercent,
      0,
    );

  const advancingPercent =
    safeNumber(
      breadth?.advancingPercent,
      50,
    );

  const above50DMA =
    safeNumber(
      breadth?.above50DMA,
      50,
    );

  const sectorSummary =
    getSectorSummary(sectors);

  let tone = "neutral";
  let headline =
    "Mixed market conditions";

  if (
    niftyChange >= 0.75 &&
    advancingPercent >= 60
  ) {
    tone = "positive";
    headline =
      "Strong positive momentum";
  } else if (
    niftyChange > 0 &&
    advancingPercent >= 50
  ) {
    tone = "positive";
    headline =
      "Constructive market momentum";
  } else if (
    niftyChange <= -0.75 &&
    advancingPercent <= 40
  ) {
    tone = "negative";
    headline =
      "Risk-off market conditions";
  } else if (
    niftyChange < 0
  ) {
    tone = "warning";
    headline =
      "Cautious market sentiment";
  }

  const sectorText =
    sectorSummary.total > 0
      ? `${sectorSummary.positiveCount} of ${sectorSummary.total} tracked sectors are positive`
      : "sector participation data is limited";

  const breadthText =
    advancingPercent >= 60
      ? "market breadth is supportive"
      : advancingPercent <= 40
        ? "market breadth remains weak"
        : "market breadth is balanced";

  const volatilityText =
    vixValue > 20 ||
    vixChange > 5
      ? "volatility remains elevated"
      : vixChange < -2
        ? "volatility is easing"
        : "volatility is stable";

  const summary =
    `NIFTY 50 is ${
      niftyChange >= 0
        ? "higher"
        : "lower"
    } by ${Math.abs(
      niftyChange,
    ).toFixed(2)}%. ` +
    `${sectorText}, ${breadthText}, and ${volatilityText}.`;

  return {
    tone,
    headline,
    summary,

    metrics: [
      {
        label:
          "Sector participation",
        value:
          sectorSummary.total > 0
            ? `${sectorSummary.positivePercent.toFixed(
                0,
              )}%`
            : "N/A",
      },
      {
        label:
          "Above 50 DMA",
        value:
          `${above50DMA.toFixed(
            0,
          )}%`,
      },
      {
        label:
          "Live alerts",
        value:
          String(alertCount),
      },
    ],

    strongestSector:
      sectorSummary.strongest,

    weakestSector:
      sectorSummary.weakest,
  };
}

function CustomTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !Array.isArray(payload) ||
    payload.length === 0
  ) {
    return null;
  }

  return (
    <div className="exa-premium-chart-tooltip">
      <span>{label}</span>

      <strong>
        {formatNumber(
          payload[0]?.value,
        )}
      </strong>
    </div>
  );
}

export default function PremiumMarketOverview({
  indices = [],
  breadth,
  sectors = [],
  alerts = [],
  marketStatus,
  loading = false,
  onOpenAnalyze,
}) {
  const rawGradientId =
    useId();

  const gradientId =
    `exaNiftyGradient${rawGradientId.replace(
      /:/g,
      "",
    )}`;

  const nifty =
    findNiftyIndex(indices);

  const indiaVix =
    findIndiaVix(indices);

  const chartData =
    useMemo(
      () =>
        createChartData(
          nifty?.trend,
        ),
      [nifty?.trend],
    );

  const alertCount =
    Array.isArray(alerts)
      ? alerts.length
      : 0;

  const marketSummary =
    useMemo(
      () =>
        createMarketSummary({
          nifty,
          indiaVix,
          breadth,
          sectors,
          alertCount,
        }),
      [
        nifty,
        indiaVix,
        breadth,
        sectors,
        alertCount,
      ],
    );

  const niftyChange =
    safeNumber(
      nifty?.changePercent,
      0,
    );

  const positive =
    niftyChange >= 0;

  const chartValues =
    chartData.map(
      (item) => item.value,
    );

  const chartLow =
    chartValues.length > 0
      ? Math.min(
          ...chartValues,
        )
      : null;

  const chartHigh =
    chartValues.length > 0
      ? Math.max(
          ...chartValues,
        )
      : null;

  return (
    <section className="exa-premium-overview-grid">
      <article className="exa-dashboard-card exa-premium-chart-card">
        <div className="exa-premium-card-header">
          <div>
            <p className="exa-card-eyebrow">
              LIVE MARKET
            </p>

            <h2>
              NIFTY 50 Index
            </h2>
          </div>

          <div className="exa-premium-chart-controls">
            <button
              type="button"
              className="active"
            >
              1D
            </button>

            {[
              "1W",
              "1M",
              "3M",
              "1Y",
            ].map((period) => (
              <button
                key={period}
                type="button"
                disabled
                title="Additional chart periods will be connected in the next stage"
              >
                {period}
              </button>
            ))}

            <button
              type="button"
              className="exa-chart-type-button"
            >
              <LineChart size={14} />
              Line chart
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        <div className="exa-premium-chart-summary">
          <div>
            <strong>
              {loading
                ? "..."
                : formatNumber(
                    nifty?.value,
                  )}
            </strong>

            <span
              className={
                positive
                  ? "positive"
                  : "negative"
              }
            >
              {formatPercent(
                nifty?.changePercent,
              )}
            </span>
          </div>

          <span
            className={
              marketStatus?.isOpen
                ? "exa-chart-market-state open"
                : "exa-chart-market-state closed"
            }
          >
            <Activity size={13} />

            {marketStatus?.label ||
              "Status unavailable"}
          </span>
        </div>

        <div className="exa-premium-chart-body">
          {loading ? (
            <div className="exa-premium-chart-loading">
              Loading live NIFTY chart...
            </div>
          ) : chartData.length < 2 ? (
            <div className="exa-premium-chart-empty">
              Intraday chart data is currently unavailable.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
                margin={{
                  top: 15,
                  right: 8,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#22d3ee"
                      stopOpacity={0.32}
                    />

                    <stop
                      offset="100%"
                      stopColor="#2f80ed"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="var(--exa-border)"
                  strokeDasharray="3 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={55}
                  tick={{
                    fill:
                      "var(--exa-text-muted)",
                    fontSize: 9,
                  }}
                />

                <YAxis
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  domain={[
                    "auto",
                    "auto",
                  ]}
                  tickFormatter={
                    formatNumber
                  }
                  tick={{
                    fill:
                      "var(--exa-text-muted)",
                    fontSize: 9,
                  }}
                  width={68}
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={
                    positive
                      ? "#22d3ee"
                      : "#ef4444"
                  }
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    fill:
                      "var(--exa-card-background)",
                  }}
                  isAnimationActive
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="exa-premium-chart-footer">
          <span>
            Day low
            <strong>
              {chartLow === null
                ? "N/A"
                : formatNumber(
                    chartLow,
                  )}
            </strong>
          </span>

          <span>
            Current
            <strong>
              {formatNumber(
                nifty?.value,
              )}
            </strong>
          </span>

          <span>
            Day high
            <strong>
              {chartHigh === null
                ? "N/A"
                : formatNumber(
                    chartHigh,
                  )}
            </strong>
          </span>
        </div>
      </article>

      <article className="exa-dashboard-card exa-ai-summary-panel">
        <div className="exa-premium-card-header">
          <div>
            <p className="exa-card-eyebrow">
              LITSES INTELLIGENCE
            </p>

            <h2>
              Litses Market Summary
            </h2>
          </div>

          <span className="exa-live-intelligence-badge">
            <Sparkles size={13} />
            Live
          </span>
        </div>

        <div
          className={`exa-summary-orb ${marketSummary.tone}`}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>

        <div className="exa-ai-summary-content">
          <span className="exa-ai-updated">
            Generated from live indicators
          </span>

          <h3
            className={
              marketSummary.tone
            }
          >
            {marketSummary.headline}
          </h3>

          <p>
            {marketSummary.summary}
          </p>
        </div>

        <div className="exa-summary-metrics">
          {marketSummary.metrics.map(
            (metric) => (
              <div key={metric.label}>
                <span>
                  {metric.label}
                </span>

                <strong>
                  {metric.value}
                </strong>
              </div>
            ),
          )}
        </div>

        <div className="exa-summary-sector-row">
          <div>
            <span>
              Strongest sector
            </span>

            <strong className="positive">
              {marketSummary
                .strongestSector
                ?.shortName ||
                marketSummary
                  .strongestSector
                  ?.name ||
                "N/A"}
            </strong>
          </div>

          <div>
            <span>
              Weakest sector
            </span>

            <strong className="negative">
              {marketSummary
                .weakestSector
                ?.shortName ||
                marketSummary
                  .weakestSector
                  ?.name ||
                "N/A"}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="exa-summary-analyze-button"
          onClick={onOpenAnalyze}
        >
          <Sparkles size={15} />
          Ask Litses AI
          <ArrowUpRight size={14} />
        </button>

        <p className="exa-summary-disclaimer">
          Generated from live market indicators for educational
          research—not investment advice.
        </p>
      </article>
    </section>
  );
}
