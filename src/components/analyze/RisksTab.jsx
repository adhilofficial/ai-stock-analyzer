import {
  Activity,
  AlertTriangle,
  BarChart3,
  CircleCheck,
  Gauge,
  Scale,
  ShieldAlert,
  TrendingDown,
  WalletCards,
} from "lucide-react";

const COLORS = {
  panel: "var(--exa-card-background)",
  panelAlt: "var(--exa-card-background-soft)",
  border: "var(--exa-border)",
  text: "var(--exa-text-secondary)",
  muted: "var(--exa-text-muted)",
  white: "var(--exa-text-primary)",
  blue: "var(--exa-primary)",
  green: "var(--exa-positive)",
  yellow: "var(--exa-warning)",
  orange:
    "color-mix(in srgb, var(--exa-warning) 72%, var(--exa-negative))",
  red: "var(--exa-negative)",
};

function safeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 2) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(number);
}

function formatPercent(value, alreadyPercentage = false) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  const percentage = alreadyPercentage
    ? number
    : Math.abs(number) <= 2
      ? number * 100
      : number;

  return `${percentage >= 0 ? "+" : ""}${formatNumber(
    percentage,
    2,
  )}%`;
}

function getCloseValues(chart) {
  if (!Array.isArray(chart)) {
    return [];
  }

  return chart
    .map((point) => safeNumber(point?.close))
    .filter((value) => value !== null);
}

function calculateSma(values, period) {
  if (values.length < period) {
    return null;
  }

  const sample = values.slice(-period);
  const total = sample.reduce((sum, value) => sum + value, 0);
  return total / period;
}

function calculateRsi(values, period = 14) {
  if (values.length <= period) {
    return null;
  }

  const sample = values.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < sample.length; index += 1) {
    const change = sample[index] - sample[index - 1];

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return averageGain > 0 ? 100 : 50;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

function calculateVolatility(values) {
  if (values.length < 3) {
    return null;
  }

  const returns = [];

  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];

    if (previous > 0) {
      returns.push(((current - previous) / previous) * 100);
    }
  }

  if (returns.length < 2) {
    return null;
  }

  const average =
    returns.reduce((sum, value) => sum + value, 0) /
    returns.length;

  const variance =
    returns.reduce(
      (sum, value) => sum + (value - average) ** 2,
      0,
    ) / returns.length;

  return Math.sqrt(variance);
}

function calculateMaxDrawdown(values) {
  if (values.length < 2) {
    return null;
  }

  let peak = values[0];
  let maxDrawdown = 0;

  values.forEach((value) => {
    if (value > peak) {
      peak = value;
    }

    if (peak > 0) {
      const drawdown = ((value - peak) / peak) * 100;
      maxDrawdown = Math.min(maxDrawdown, drawdown);
    }
  });

  return maxDrawdown;
}

function createRiskItem({
  title,
  value,
  description,
  severity = "low",
  icon: Icon,
}) {
  return {
    title,
    value,
    description,
    severity,
    Icon,
  };
}

function getSeverityMeta(severity) {
  const metadata = {
    low: {
      label: "Low",
      color: COLORS.green,
      background:
        "color-mix(in srgb, var(--exa-positive) 10%, transparent)",
      score: 5,
    },
    moderate: {
      label: "Moderate",
      color: COLORS.yellow,
      background:
        "color-mix(in srgb, var(--exa-warning) 10%, transparent)",
      score: 12,
    },
    elevated: {
      label: "Elevated",
      color: COLORS.orange,
      background:
        "color-mix(in srgb, var(--exa-warning) 8%, transparent)",
      score: 18,
    },
    high: {
      label: "High",
      color: COLORS.red,
      background:
        "color-mix(in srgb, var(--exa-negative) 10%, transparent)",
      score: 25,
    },
  };

  return metadata[severity] || metadata.moderate;
}

function RiskBadge({ severity }) {
  const meta = getSeverityMeta(severity);

  return (
    <span
      style={{
        padding: "5px 9px",
        borderRadius: 999,
        border:
          `1px solid color-mix(in srgb, ${meta.color} 21%, transparent)`,
        color: meta.color,
        background: meta.background,
        fontSize: 10,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

function RiskCard({ item }) {
  const meta = getSeverityMeta(item.severity);
  const Icon = item.Icon || AlertTriangle;

  return (
    <article
      style={{
        minWidth: 0,
        padding: 16,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        background:
          "linear-gradient(145deg, var(--exa-card-background) 0%, var(--exa-card-background-soft) 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            color: meta.color,
            background: meta.background,
            border:
              `1px solid color-mix(in srgb, ${meta.color} 15%, transparent)`,
          }}
        >
          <Icon size={18} />
        </div>

        <RiskBadge severity={item.severity} />
      </div>

      <p
        style={{
          margin: "13px 0 4px",
          color: COLORS.muted,
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {item.title}
      </p>

      <strong
        style={{
          display: "block",
          color: COLORS.white,
          fontSize: 18,
        }}
      >
        {item.value}
      </strong>

      <p
        style={{
          margin: "9px 0 0",
          color: COLORS.text,
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {item.description}
      </p>
    </article>
  );
}

function buildRiskItems(result) {
  const closes = getCloseValues(result?.chart);
  const latestClose = closes.at(-1) ?? safeNumber(result?.price);
  const sma20 = calculateSma(closes, 20);
  const sma50 = calculateSma(closes, 50);
  const rsi = calculateRsi(closes, 14);
  const volatility = calculateVolatility(closes);
  const drawdown = calculateMaxDrawdown(closes);

  const week52Low = safeNumber(
    result?.week52Low ?? result?.fiftyTwoWeekLow,
  );
  const week52High = safeNumber(
    result?.week52High ?? result?.fiftyTwoWeekHigh,
  );

  const peRatio = safeNumber(
    result?.peRatio ?? result?.peRatioTTM,
  );
  const debtToEquity = safeNumber(result?.debtToEquity);
  const currentRatio = safeNumber(result?.currentRatio);
  const revenueGrowth = safeNumber(result?.revenueGrowth);
  const earningsGrowth = safeNumber(result?.earningsGrowth);
  const profitMargins = safeNumber(result?.profitMargins);

  const items = [];

  let volatilitySeverity = "low";
  if (volatility !== null && volatility >= 2) {
    volatilitySeverity = "high";
  } else if (volatility !== null && volatility >= 1) {
    volatilitySeverity = "elevated";
  } else if (volatility !== null && volatility >= 0.5) {
    volatilitySeverity = "moderate";
  }

  items.push(
    createRiskItem({
      title: "Price volatility",
      value:
        volatility === null
          ? "Insufficient data"
          : `${formatNumber(volatility, 2)}%`,
      description:
        "Measures how widely prices moved between consecutive chart points in the selected timeframe.",
      severity: volatilitySeverity,
      icon: Activity,
    }),
  );

  let drawdownSeverity = "low";
  if (drawdown !== null && drawdown <= -20) {
    drawdownSeverity = "high";
  } else if (drawdown !== null && drawdown <= -10) {
    drawdownSeverity = "elevated";
  } else if (drawdown !== null && drawdown <= -5) {
    drawdownSeverity = "moderate";
  }

  items.push(
    createRiskItem({
      title: "Maximum drawdown",
      value:
        drawdown === null
          ? "Insufficient data"
          : formatPercent(drawdown, true),
      description:
        "Shows the largest decline from a chart-period peak to a later low.",
      severity: drawdownSeverity,
      icon: TrendingDown,
    }),
  );

  let momentumSeverity = "moderate";
  let momentumDescription =
    "RSI could not be calculated from the available chart history.";

  if (rsi !== null) {
    if (rsi >= 70) {
      momentumSeverity = "elevated";
      momentumDescription =
        "RSI is above 70, indicating potentially overextended short-term momentum.";
    } else if (rsi <= 30) {
      momentumSeverity = "high";
      momentumDescription =
        "RSI is below 30, indicating strong downside pressure and oversold conditions.";
    } else {
      momentumSeverity = "low";
      momentumDescription =
        "RSI is inside the commonly watched neutral range of 30 to 70.";
    }
  }

  items.push(
    createRiskItem({
      title: "Momentum risk",
      value: rsi === null ? "N/A" : `RSI ${formatNumber(rsi, 1)}`,
      description: momentumDescription,
      severity: momentumSeverity,
      icon: Gauge,
    }),
  );

  let trendSeverity = "moderate";
  let trendValue = "Insufficient data";
  let trendDescription =
    "More chart history is required to compare the latest price with moving averages.";

  if (latestClose !== null && sma20 !== null) {
    const below20 = latestClose < sma20;
    const below50 = sma50 !== null && latestClose < sma50;

    if (below20 && below50) {
      trendSeverity = "high";
      trendValue = "Below SMA 20 & 50";
      trendDescription =
        "The latest price is below both short- and medium-term moving averages.";
    } else if (below20) {
      trendSeverity = "elevated";
      trendValue = "Below SMA 20";
      trendDescription =
        "The latest price is below its short-term average, signalling weaker momentum.";
    } else {
      trendSeverity = "low";
      trendValue = "Above SMA 20";
      trendDescription =
        "The latest price remains above its short-term moving average.";
    }
  }

  items.push(
    createRiskItem({
      title: "Trend position",
      value: trendValue,
      description: trendDescription,
      severity: trendSeverity,
      icon: BarChart3,
    }),
  );

  let valuationSeverity = "moderate";
  if (peRatio !== null) {
    if (peRatio < 0 || peRatio >= 50) {
      valuationSeverity = "high";
    } else if (peRatio >= 35) {
      valuationSeverity = "elevated";
    } else if (peRatio <= 25) {
      valuationSeverity = "low";
    }
  }

  items.push(
    createRiskItem({
      title: "Valuation risk",
      value: peRatio === null ? "P/E unavailable" : `${formatNumber(peRatio, 2)}x P/E`,
      description:
        peRatio === null
          ? "Yahoo Finance did not provide a current trailing P/E ratio."
          : "Higher P/E multiples can increase sensitivity to earnings disappointments.",
      severity: valuationSeverity,
      icon: Scale,
    }),
  );

  let balanceSheetSeverity = "moderate";
  let balanceSheetValue = "Limited data";
  let balanceSheetDescription =
    "Debt and liquidity information is not fully available.";

  if (debtToEquity !== null || currentRatio !== null) {
    const highDebt = debtToEquity !== null && debtToEquity > 150;
    const weakLiquidity = currentRatio !== null && currentRatio < 1;

    if (highDebt && weakLiquidity) {
      balanceSheetSeverity = "high";
    } else if (highDebt || weakLiquidity) {
      balanceSheetSeverity = "elevated";
    } else {
      balanceSheetSeverity = "low";
    }

    balanceSheetValue = `D/E ${formatNumber(
      debtToEquity,
      1,
    )} · Current ${formatNumber(currentRatio, 2)}`;

    balanceSheetDescription =
      "Combines debt-to-equity and current-ratio information to assess leverage and short-term liquidity.";
  }

  items.push(
    createRiskItem({
      title: "Balance-sheet risk",
      value: balanceSheetValue,
      description: balanceSheetDescription,
      severity: balanceSheetSeverity,
      icon: WalletCards,
    }),
  );

  const negativeGrowth =
    (revenueGrowth !== null && revenueGrowth < 0) ||
    (earningsGrowth !== null && earningsGrowth < 0);
  const negativeMargins =
    profitMargins !== null && profitMargins < 0;

  let businessSeverity = "low";
  if (negativeGrowth && negativeMargins) {
    businessSeverity = "high";
  } else if (negativeGrowth || negativeMargins) {
    businessSeverity = "elevated";
  } else if (
    revenueGrowth === null &&
    earningsGrowth === null &&
    profitMargins === null
  ) {
    businessSeverity = "moderate";
  }

  items.push(
    createRiskItem({
      title: "Business performance risk",
      value:
        revenueGrowth === null
          ? "Growth data limited"
          : `Revenue ${formatPercent(revenueGrowth)}`,
      description:
        "Reviews reported revenue growth, earnings growth and profit margins for deterioration.",
      severity: businessSeverity,
      icon: ShieldAlert,
    }),
  );

  let rangeSeverity = "moderate";
  let rangeValue = "Range unavailable";
  let rangeDescription =
    "The 52-week price range was not available.";

  if (
    latestClose !== null &&
    week52Low !== null &&
    week52High !== null &&
    week52High > week52Low
  ) {
    const rangePosition =
      ((latestClose - week52Low) / (week52High - week52Low)) * 100;

    rangeValue = `${formatNumber(rangePosition, 1)}% of range`;

    if (rangePosition >= 90) {
      rangeSeverity = "elevated";
      rangeDescription =
        "Price is close to its 52-week high, increasing pullback sensitivity.";
    } else if (rangePosition <= 10) {
      rangeSeverity = "high";
      rangeDescription =
        "Price is close to its 52-week low, signalling persistent weakness.";
    } else {
      rangeSeverity = "low";
      rangeDescription =
        "Price is not currently at an extreme end of its 52-week range.";
    }
  }

  items.push(
    createRiskItem({
      title: "52-week position",
      value: rangeValue,
      description: rangeDescription,
      severity: rangeSeverity,
      icon: BarChart3,
    }),
  );

  return items;
}

function calculateRiskScore(items) {
  if (!items.length) {
    return 0;
  }

  const total = items.reduce(
    (sum, item) => sum + getSeverityMeta(item.severity).score,
    0,
  );

  return Math.min(100, Math.round((total / (items.length * 25)) * 100));
}

function getOverallRisk(score) {
  if (score >= 65) {
    return {
      label: "High risk",
      color: COLORS.red,
      background:
        "color-mix(in srgb, var(--exa-negative) 10%, transparent)",
    };
  }

  if (score >= 35) {
    return {
      label: "Moderate risk",
      color: COLORS.yellow,
      background:
        "color-mix(in srgb, var(--exa-warning) 10%, transparent)",
    };
  }

  return {
    label: "Lower risk",
    color: COLORS.green,
    background:
      "color-mix(in srgb, var(--exa-positive) 10%, transparent)",
  };
}

export default function RisksTab({ result, timeframe = "1Y" }) {
  const items = buildRiskItems(result || {});
  const score = calculateRiskScore(items);
  const overall = getOverallRisk(score);
  const aiRisks = Array.isArray(result?.keyRisks)
    ? result.keyRisks.filter(Boolean).slice(0, 6)
    : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <section
        style={{
          padding: 18,
          border:
            `1px solid color-mix(in srgb, ${overall.color} 21%, transparent)`,
          borderRadius: 16,
          background: overall.background,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                color: overall.color,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Litses deterministic risk assessment
            </p>

            <h3
              style={{
                margin: 0,
                color: COLORS.white,
                fontSize: 20,
              }}
            >
              {overall.label}
            </h3>

            <p
              style={{
                margin: "7px 0 0",
                color: COLORS.text,
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              Calculated from live market, technical and fundamental data. Chart-based checks use the selected {timeframe} timeframe.
            </p>
          </div>

          <div
            style={{
              minWidth: 92,
              padding: "12px 16px",
              border:
                `1px solid color-mix(in srgb, ${overall.color} 21%, transparent)`,
              borderRadius: 13,
              textAlign: "center",
              background:
                "color-mix(in srgb, var(--exa-card-background-soft) 72%, transparent)",
            }}
          >
            <strong
              style={{
                display: "block",
                color: COLORS.white,
                fontSize: 24,
              }}
            >
              {score}
            </strong>
            <span
              style={{
                color: COLORS.muted,
                fontSize: 10,
              }}
            >
              Risk score /100
            </span>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item) => (
          <RiskCard key={item.title} item={item} />
        ))}
      </section>

      <section
        style={{
          padding: 17,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          background: COLORS.panel,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          {aiRisks.length > 0 ? (
            <AlertTriangle size={18} color={COLORS.orange} />
          ) : (
            <CircleCheck size={18} color={COLORS.green} />
          )}

          <h3
            style={{
              margin: 0,
              color: COLORS.white,
              fontSize: 15,
            }}
          >
            AI and company-specific risk notes
          </h3>
        </div>

        {aiRisks.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: 8,
              marginTop: 13,
            }}
          >
            {aiRisks.map((risk, index) => (
              <div
                key={`${risk}-${index}`}
                style={{
                  padding: "11px 12px",
                  border:
                    "1px solid color-mix(in srgb, var(--exa-warning) 18%, transparent)",
                  borderRadius: 10,
                  color: COLORS.text,
                  background:
                    "color-mix(in srgb, var(--exa-warning) 6%, transparent)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {risk}
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              margin: "12px 0 0",
              color: COLORS.muted,
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            AI-specific risks are currently unavailable. The deterministic assessment above remains active using Yahoo Finance and chart data.
          </p>
        )}
      </section>

      <div
        style={{
          padding: "12px 14px",
          border: "1px solid var(--exa-border-strong)",
          borderRadius: 11,
          color: COLORS.muted,
          background:
            "color-mix(in srgb, var(--exa-primary) 5%, transparent)",
          fontSize: 11,
          lineHeight: 1.65,
        }}
      >
        Risk indicators are educational screening signals, not personalised investment advice. A low score does not mean an investment is risk-free.
      </div>
    </div>
  );
}
