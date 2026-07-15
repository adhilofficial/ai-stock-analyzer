import { useMemo } from "react";

import {
  Activity,
  BarChart3,
  CircleMinus,
  Gauge,
  Layers3,
  LineChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Volume2,
} from "lucide-react";

import ScoreGauge from "../ScoreGauge";

import {
  analyzeTechnicals,
} from "../../utils/technicalIndicators";

const COLORS = {
  background: "var(--exa-background)",
  card: "var(--exa-card-background)",
  cardSecondary: "var(--exa-card-background-soft)",
  border: "var(--exa-border)",
  blue: "var(--exa-primary)",
  cyan: "var(--exa-accent)",
  purple: "var(--exa-purple)",
  green: "var(--exa-positive)",
  yellow: "var(--exa-warning)",
  red: "var(--exa-negative)",
  white: "var(--exa-text-primary)",
  text: "var(--exa-text-secondary)",
  muted: "var(--exa-text-muted)",
};

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function formatNumber(
  value,
  maximumFractionDigits = 2,
) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits,
    },
  ).format(number);
}

function formatPrice(
  value,
  currency = "INR",
) {
  const number = safeNumber(value);

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
        minimumFractionDigits: 2,
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

function formatVolume(value) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  if (number >= 10_000_000) {
    return `${formatNumber(
      number / 10_000_000,
      2,
    )} Cr`;
  }

  if (number >= 100_000) {
    return `${formatNumber(
      number / 100_000,
      2,
    )} L`;
  }

  if (number >= 1_000) {
    return `${formatNumber(
      number / 1_000,
      2,
    )} K`;
  }

  return formatNumber(
    number,
    0,
  );
}

function getScoreLabel(score) {
  const number =
    safeNumber(score) ?? 0;

  if (number >= 70) {
    return {
      label: "Strong",
      description:
        "Most calculated indicators currently support positive technical momentum.",
      color: COLORS.green,
      background:
        "color-mix(in srgb, var(--exa-positive) 10%, transparent)",
    };
  }

  if (number >= 45) {
    return {
      label: "Neutral",
      description:
        "Technical indicators are mixed and do not currently show a strong directional advantage.",
      color: COLORS.yellow,
      background:
        "color-mix(in srgb, var(--exa-warning) 10%, transparent)",
    };
  }

  return {
    label: "Weak",
    description:
      "Several calculated indicators currently reflect weak or negative technical momentum.",
    color: COLORS.red,
    background:
      "color-mix(in srgb, var(--exa-negative) 10%, transparent)",
  };
}

function getTrendStyle(trend) {
  switch (
    String(trend || "")
      .trim()
      .toLowerCase()
  ) {
    case "bullish":
      return {
        Icon: TrendingUp,
        color: COLORS.green,
        background:
          "color-mix(in srgb, var(--exa-positive) 10%, transparent)",
      };

    case "bearish":
      return {
        Icon: TrendingDown,
        color: COLORS.red,
        background:
          "color-mix(in srgb, var(--exa-negative) 10%, transparent)",
      };

    case "sideways":
      return {
        Icon: CircleMinus,
        color: COLORS.yellow,
        background:
          "color-mix(in srgb, var(--exa-warning) 10%, transparent)",
      };

    default:
      return {
        Icon: Activity,
        color: COLORS.muted,
        background:
          "color-mix(in srgb, var(--exa-text-muted) 10%, transparent)",
      };
  }
}

function getIndicatorStyle(label) {
  const normalized =
    String(label || "")
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "bullish",
    ) ||
    normalized.includes(
      "positive",
    ) ||
    normalized.includes(
      "strong",
    ) ||
    normalized.includes(
      "oversold",
    )
  ) {
    return {
      color: COLORS.green,
      background:
        "color-mix(in srgb, var(--exa-positive) 10%, transparent)",
    };
  }

  if (
    normalized.includes(
      "bearish",
    ) ||
    normalized.includes(
      "weak",
    ) ||
    normalized.includes(
      "overbought",
    )
  ) {
    return {
      color: COLORS.red,
      background:
        "color-mix(in srgb, var(--exa-negative) 10%, transparent)",
    };
  }

  if (
    normalized.includes(
      "neutral",
    ) ||
    normalized.includes(
      "normal",
    ) ||
    normalized.includes(
      "sideways",
    )
  ) {
    return {
      color: COLORS.yellow,
      background:
        "color-mix(in srgb, var(--exa-warning) 10%, transparent)",
    };
  }

  if (
    normalized.includes(
      "high volume",
    )
  ) {
    return {
      color: COLORS.cyan,
      background:
        "color-mix(in srgb, var(--exa-accent) 10%, transparent)",
    };
  }

  return {
    color: COLORS.muted,
    background:
      "color-mix(in srgb, var(--exa-text-muted) 10%, transparent)",
  };
}

function StatusBadge({
  label,
  color,
  background,
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color,
        background,
        border:
          `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      {label || "Unavailable"}
    </span>
  );
}

function TechnicalMetricCard({
  icon: Icon,
  title,
  value,
  label,
  description,
  accent = COLORS.blue,
}) {
  const statusStyle =
    getIndicatorStyle(label);

  return (
    <article
      style={{
        background:
          "linear-gradient(145deg, var(--exa-card-background) 0%, var(--exa-card-background-soft) 100%)",
        border:
          "1px solid var(--exa-border)",
        borderRadius: 14,
        padding: 16,
        minWidth: 0,
        boxShadow: "var(--exa-shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 12,
          marginBottom: 15,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            borderRadius: 10,
            color: accent,
            background:
              `color-mix(in srgb, ${accent} 8%, transparent)`,
            border:
              `1px solid color-mix(in srgb, ${accent} 18%, transparent)`,
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>

        <StatusBadge
          label={label}
          color={
            statusStyle.color
          }
          background={
            statusStyle.background
          }
        />
      </div>

      <div
        style={{
          color: COLORS.muted,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: COLORS.white,
          fontSize: 22,
          fontWeight: 750,
          letterSpacing: "-0.02em",
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </div>

      <p
        style={{
          margin:
            "9px 0 0",
          color: COLORS.text,
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </article>
  );
}

function DetailRow({
  label,
  value,
  valueColor = COLORS.white,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        gap: 18,
        padding: "11px 0",
        borderBottom:
          "1px solid var(--exa-border)",
      }}
    >
      <span
        style={{
          color: COLORS.muted,
          fontSize: 13,
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: valueColor,
          fontSize: 13,
          fontWeight: 700,
          textAlign: "right",
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TechnicalSummary({
  technicals,
  timeframe,
}) {
  const scoreStyle =
    getScoreLabel(
      technicals.technicalScore,
    );

  const trendStyle =
    getTrendStyle(
      technicals.trend,
    );

  const TrendIcon =
    trendStyle.Icon;

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 14,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(145deg, var(--exa-card-background) 0%, var(--exa-card-background-soft) 100%)",
          border:
            "1px solid var(--exa-border)",
          borderRadius: 14,
          padding: 18,
          display: "flex",
          alignItems: "center",
          gap: 18,
          minWidth: 0,
        }}
      >
        <ScoreGauge
          score={
            technicals
              .technicalScore
          }
          size={78}
        />

        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color:
                COLORS.muted,
              fontSize: 12,
              marginBottom: 5,
            }}
          >
            Technical score
          </div>

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 7,
            }}
          >
            <strong
              style={{
                color:
                  COLORS.white,
                fontSize: 20,
              }}
            >
              {
                technicals
                  .technicalScore
              }
              /100
            </strong>

            <StatusBadge
              label={
                scoreStyle.label
              }
              color={
                scoreStyle.color
              }
              background={
                scoreStyle
                  .background
              }
            />
          </div>

          <p
            style={{
              margin: 0,
              color:
                COLORS.text,
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            {
              scoreStyle.description
            }
          </p>
        </div>
      </div>

      <div
        style={{
          background:
            "linear-gradient(145deg, var(--exa-card-background) 0%, var(--exa-card-background-soft) 100%)",
          border:
            "1px solid var(--exa-border)",
          borderRadius: 14,
          padding: 18,
          display: "flex",
          alignItems: "center",
          gap: 16,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            borderRadius: 14,
            color:
              trendStyle.color,
            background:
              trendStyle.background,
            border:
              `1px solid color-mix(in srgb, ${trendStyle.color} 20%, transparent)`,
            flexShrink: 0,
          }}
        >
          <TrendIcon
            size={24}
          />
        </div>

        <div>
          <div
            style={{
              color:
                COLORS.muted,
              fontSize: 12,
              marginBottom: 5,
            }}
          >
            Calculated trend
          </div>

          <div
            style={{
              color:
                trendStyle.color,
              fontSize: 21,
              fontWeight: 750,
              marginBottom: 5,
            }}
          >
            {technicals.trend}
          </div>

          <div
            style={{
              color:
                COLORS.text,
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            Based on the price,
            SMA 20 and SMA 50
            relationship for the{" "}
            {timeframe ||
              "selected"}{" "}
            chart.
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TechnicalsTab({
  chart = [],
  currency = "INR",
  timeframe = "1Y",
}) {
  const technicals =
    useMemo(
      () =>
        analyzeTechnicals(
          chart,
        ),
      [chart],
    );

  const hasChartData =
    Array.isArray(chart) &&
    chart.length > 0;

  const hasEnoughLongTermData =
    Array.isArray(chart) &&
    chart.length >= 50;

  if (!hasChartData) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          background:
            COLORS.card,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius: 14,
        }}
      >
        <Activity
          size={34}
          color={COLORS.muted}
          style={{
            marginBottom: 12,
          }}
        />

        <h3
          style={{
            margin:
              "0 0 8px",
            color:
              COLORS.white,
            fontSize: 17,
          }}
        >
          Technical data
          unavailable
        </h3>

        <p
          style={{
            maxWidth: 480,
            margin: "0 auto",
            color:
              COLORS.muted,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          The selected stock does
          not currently have enough
          chart data to calculate
          technical indicators.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <TechnicalSummary
        technicals={
          technicals
        }
        timeframe={
          timeframe
        }
      />

      {!hasEnoughLongTermData && (
        <div
          style={{
            display: "flex",
            alignItems:
              "flex-start",
            gap: 10,
            padding:
              "12px 14px",
            color:
              COLORS.yellow,
            background:
              "color-mix(in srgb, var(--exa-warning) 8%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--exa-warning) 22%, transparent)",
            borderRadius: 12,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <ShieldCheck
            size={17}
            style={{
              marginTop: 1,
              flexShrink: 0,
            }}
          />

          <span>
            This chart contains{" "}
            {chart.length} usable
            data points. SMA 50 may
            be unavailable until a
            longer timeframe provides
            at least 50 closing-price
            records.
          </span>
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
        }}
      >
        <TechnicalMetricCard
          icon={LineChart}
          title="SMA 20"
          value={formatPrice(
            technicals.sma20,
            currency,
          )}
          label={
            technicals.sma20 ===
            null
              ? "Unavailable"
              : technicals.price >
                  technicals.sma20
                ? "Price above SMA"
                : "Price below SMA"
          }
          description="The average closing price across the latest 20 chart periods."
          accent={COLORS.blue}
        />

        <TechnicalMetricCard
          icon={Layers3}
          title="SMA 50"
          value={formatPrice(
            technicals.sma50,
            currency,
          )}
          label={
            technicals.sma50 ===
            null
              ? "Unavailable"
              : technicals.price >
                  technicals.sma50
                ? "Price above SMA"
                : "Price below SMA"
          }
          description="A broader moving average used to evaluate the medium-term trend."
          accent={COLORS.purple}
        />

        <TechnicalMetricCard
          icon={Gauge}
          title="RSI 14"
          value={formatNumber(
            technicals.rsi,
            2,
          )}
          label={
            technicals.rsiLabel
          }
          description="Momentum reading where values above 70 may be overbought and below 30 may be oversold."
          accent={COLORS.cyan}
        />

        <TechnicalMetricCard
          icon={Activity}
          title="MACD"
          value={formatNumber(
            technicals.macd,
            3,
          )}
          label={
            technicals.macdLabel
          }
          description="Compares short-term and long-term exponential moving averages."
          accent={COLORS.green}
        />

        <TechnicalMetricCard
          icon={TrendingDown}
          title="Support"
          value={formatPrice(
            technicals.support,
            currency,
          )}
          label="Recent low"
          description="The lowest calculated price level across the latest chart periods."
          accent={COLORS.green}
        />

        <TechnicalMetricCard
          icon={TrendingUp}
          title="Resistance"
          value={formatPrice(
            technicals.resistance,
            currency,
          )}
          label="Recent high"
          description="The highest calculated price level across the latest chart periods."
          accent={COLORS.red}
        />

        <TechnicalMetricCard
          icon={Volume2}
          title="Latest volume"
          value={formatVolume(
            technicals
              .currentVolume,
          )}
          label={
            technicals
              .volumeLabel
          }
          description="Compares the latest available volume with the 20-period average."
          accent={COLORS.cyan}
        />

        <TechnicalMetricCard
          icon={BarChart3}
          title="Average volume"
          value={formatVolume(
            technicals
              .averageVolume,
          )}
          label="20-period average"
          description="The average reported trading volume across the latest 20 chart periods."
          accent={COLORS.blue}
        />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            background:
              COLORS.card,
            border:
              `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: 17,
          }}
        >
          <h3
            style={{
              margin:
                "0 0 6px",
              color:
                COLORS.white,
              fontSize: 15,
            }}
          >
            MACD details
          </h3>

          <p
            style={{
              margin:
                "0 0 8px",
              color:
                COLORS.muted,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Current MACD,
            signal and histogram
            calculations.
          </p>

          <DetailRow
            label="MACD line"
            value={formatNumber(
              technicals.macd,
              4,
            )}
          />

          <DetailRow
            label="Signal line"
            value={formatNumber(
              technicals.signal,
              4,
            )}
          />

          <DetailRow
            label="Histogram"
            value={formatNumber(
              technicals.histogram,
              4,
            )}
            valueColor={
              technicals
                .histogram >
              0
                ? COLORS.green
                : technicals
                      .histogram <
                    0
                  ? COLORS.red
                  : COLORS.white
            }
          />
        </div>

        <div
          style={{
            background:
              COLORS.card,
            border:
              `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: 17,
          }}
        >
          <h3
            style={{
              margin:
                "0 0 6px",
              color:
                COLORS.white,
              fontSize: 15,
            }}
          >
            Price structure
          </h3>

          <p
            style={{
              margin:
                "0 0 8px",
              color:
                COLORS.muted,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Current price relative
            to moving averages and
            recent levels.
          </p>

          <DetailRow
            label="Latest close"
            value={formatPrice(
              technicals.price,
              currency,
            )}
          />

          <DetailRow
            label="Distance to support"
            value={
              technicals.price !==
                null &&
              technicals.support !==
                null
                ? `${formatNumber(
                    ((technicals
                      .price -
                      technicals
                        .support) /
                      technicals
                        .support) *
                      100,
                    2,
                  )}%`
                : "N/A"
            }
            valueColor={
              COLORS.green
            }
          />

          <DetailRow
            label="Distance to resistance"
            value={
              technicals.price !==
                null &&
              technicals
                .resistance !==
                null
                ? `${formatNumber(
                    ((technicals
                      .resistance -
                      technicals
                        .price) /
                      technicals
                        .price) *
                      100,
                    2,
                  )}%`
                : "N/A"
            }
            valueColor={
              COLORS.red
            }
          />
        </div>
      </section>

      <div
        style={{
          padding: "13px 15px",
          color: COLORS.muted,
          background:
            "color-mix(in srgb, var(--exa-primary) 6%, transparent)",
          border:
            "1px solid color-mix(in srgb, var(--exa-primary) 18%, transparent)",
          borderRadius: 12,
          fontSize: 11,
          lineHeight: 1.65,
        }}
      >
        These indicators are
        calculated from the chart
        data currently loaded in Litses.
        They are provided for
        educational market research
        and should not be treated as
        personalised investment
        advice.
      </div>
    </div>
  );
}
