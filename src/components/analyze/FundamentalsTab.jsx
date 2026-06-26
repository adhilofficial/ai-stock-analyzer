import {
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  CircleDollarSign,
  Coins,
  Landmark,
  Percent,
  Scale,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const COLORS = {
  card: "#101A30",
  cardSecondary: "#0D1B2A",
  border: "#1E293B",
  white: "#F8FAFC",
  text: "#CBD5E1",
  muted: "#64748B",
  blue: "#2F80ED",
  cyan: "#22D3EE",
  green: "#22C55E",
  yellow: "#EAB308",
  red: "#EF4444",
  purple: "#8B5CF6",
};

function safeNumber(value) {
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
  maximumFractionDigits = 2,
) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits,
  }).format(number);
}

function formatCurrency(
  value,
  currency = "INR",
) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return formatNumber(number, 2);
  }
}

function formatLargeNumber(value) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  if (Math.abs(number) >= 1_00_00_00_00_000) {
    return `${formatNumber(
      number / 1_00_00_00_00_000,
      2,
    )} Lakh Cr`;
  }

  if (Math.abs(number) >= 1_00_00_000) {
    return `${formatNumber(
      number / 1_00_00_000,
      2,
    )} Cr`;
  }

  if (Math.abs(number) >= 1_00_000) {
    return `${formatNumber(
      number / 1_00_000,
      2,
    )} Lakh`;
  }

  return formatNumber(number, 0);
}

function formatPercentage(value) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  /*
   * Yahoo usually returns ratios such as
   * 0.18 for 18%.
   */
  const percentage =
    Math.abs(number) <= 2
      ? number * 100
      : number;

  return `${formatNumber(
    percentage,
    2,
  )}%`;
}

function getMetricStatus(
  type,
  value,
) {
  const number = safeNumber(value);

  if (number === null) {
    return {
      label: "Unavailable",
      color: COLORS.muted,
      background:
        "rgba(100, 116, 139, 0.10)",
    };
  }

  if (type === "revenueGrowth") {
    if (number > 0.15) {
      return {
        label: "Strong growth",
        color: COLORS.green,
        background:
          "rgba(34, 197, 94, 0.10)",
      };
    }

    if (number > 0) {
      return {
        label: "Positive",
        color: COLORS.cyan,
        background:
          "rgba(34, 211, 238, 0.10)",
      };
    }

    return {
      label: "Declining",
      color: COLORS.red,
      background:
        "rgba(239, 68, 68, 0.10)",
    };
  }

  if (type === "profitMargin") {
    if (number >= 0.2) {
      return {
        label: "High margin",
        color: COLORS.green,
        background:
          "rgba(34, 197, 94, 0.10)",
      };
    }

    if (number > 0) {
      return {
        label: "Positive",
        color: COLORS.yellow,
        background:
          "rgba(234, 179, 8, 0.10)",
      };
    }

    return {
      label: "Negative",
      color: COLORS.red,
      background:
        "rgba(239, 68, 68, 0.10)",
    };
  }

  if (type === "roe") {
    if (number >= 0.2) {
      return {
        label: "Strong",
        color: COLORS.green,
        background:
          "rgba(34, 197, 94, 0.10)",
      };
    }

    if (number >= 0.1) {
      return {
        label: "Moderate",
        color: COLORS.yellow,
        background:
          "rgba(234, 179, 8, 0.10)",
      };
    }

    return {
      label: "Low",
      color: COLORS.red,
      background:
        "rgba(239, 68, 68, 0.10)",
    };
  }

  if (type === "debtToEquity") {
    if (number <= 50) {
      return {
        label: "Low debt",
        color: COLORS.green,
        background:
          "rgba(34, 197, 94, 0.10)",
      };
    }

    if (number <= 150) {
      return {
        label: "Moderate",
        color: COLORS.yellow,
        background:
          "rgba(234, 179, 8, 0.10)",
      };
    }

    return {
      label: "High debt",
      color: COLORS.red,
      background:
        "rgba(239, 68, 68, 0.10)",
    };
  }

  if (type === "currentRatio") {
    if (number >= 1.5) {
      return {
        label: "Healthy",
        color: COLORS.green,
        background:
          "rgba(34, 197, 94, 0.10)",
      };
    }

    if (number >= 1) {
      return {
        label: "Adequate",
        color: COLORS.yellow,
        background:
          "rgba(234, 179, 8, 0.10)",
      };
    }

    return {
      label: "Weak",
      color: COLORS.red,
      background:
        "rgba(239, 68, 68, 0.10)",
    };
  }

  return {
    label: "Reported",
    color: COLORS.blue,
    background:
      "rgba(47, 128, 237, 0.10)",
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
        padding: "5px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color,
        background,
        border: `1px solid ${color}33`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  statusType,
  statusValue,
  accent = COLORS.blue,
}) {
  const status = getMetricStatus(
    statusType,
    statusValue,
  );

  return (
    <article
      style={{
        minWidth: 0,
        padding: 16,
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        background:
          "linear-gradient(145deg, #101A30 0%, #0D1B2A 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
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
            color: accent,
            background: `${accent}15`,
            border: `1px solid ${accent}2E`,
          }}
        >
          <Icon size={18} />
        </div>

        <StatusBadge
          label={status.label}
          color={status.color}
          background={status.background}
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
          fontSize: 21,
          fontWeight: 750,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      <p
        style={{
          margin: "9px 0 0",
          color: COLORS.text,
          fontSize: 12,
          lineHeight: 1.55,
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
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 18,
        padding: "11px 0",
        borderBottom:
          "1px solid rgba(30, 41, 59, 0.75)",
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
          color: COLORS.white,
          fontSize: 13,
          fontWeight: 700,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function FundamentalsTab({
  result,
}) {
  if (!result) {
    return null;
  }

  const currency =
    result.currency || "INR";

  const hasFundamentalData = [
    result.totalRevenue,
    result.revenueGrowth,
    result.profitMargins,
    result.returnOnEquity,
    result.totalCash,
    result.totalDebt,
    result.enterpriseValue,
    result.priceToBook,
  ].some(
    (value) =>
      value !== null &&
      value !== undefined,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {!hasFundamentalData && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "13px 15px",
            color: COLORS.yellow,
            background:
              "rgba(234, 179, 8, 0.08)",
            border:
              "1px solid rgba(234, 179, 8, 0.22)",
            borderRadius: 12,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <ShieldCheck
            size={17}
            style={{
              flexShrink: 0,
              marginTop: 1,
            }}
          />

          <span>
            Some fundamental information is not available from
            Yahoo Finance for this company.
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
        <MetricCard
          icon={CircleDollarSign}
          title="Market capitalisation"
          value={formatLargeNumber(
            result.marketCap,
          )}
          statusType="reported"
          statusValue={result.marketCap}
          description="The total market value of the company's outstanding shares."
          accent={COLORS.blue}
        />

        <MetricCard
          icon={Landmark}
          title="Enterprise value"
          value={formatLargeNumber(
            result.enterpriseValue,
          )}
          statusType="reported"
          statusValue={
            result.enterpriseValue
          }
          description="Company value after considering market capitalisation, debt and cash."
          accent={COLORS.purple}
        />

        <MetricCard
          icon={BarChart3}
          title="Total revenue"
          value={formatLargeNumber(
            result.totalRevenue,
          )}
          statusType="reported"
          statusValue={
            result.totalRevenue
          }
          description="The latest reported total sales generated by the business."
          accent={COLORS.cyan}
        />

        <MetricCard
          icon={TrendingUp}
          title="Revenue growth"
          value={formatPercentage(
            result.revenueGrowth,
          )}
          statusType="revenueGrowth"
          statusValue={
            result.revenueGrowth
          }
          description="The latest reported rate of increase or decrease in revenue."
          accent={COLORS.green}
        />

        <MetricCard
          icon={Percent}
          title="Profit margin"
          value={formatPercentage(
            result.profitMargins,
          )}
          statusType="profitMargin"
          statusValue={
            result.profitMargins
          }
          description="The percentage of revenue retained as profit."
          accent={COLORS.green}
        />

        <MetricCard
          icon={Scale}
          title="Return on equity"
          value={formatPercentage(
            result.returnOnEquity,
          )}
          statusType="roe"
          statusValue={
            result.returnOnEquity
          }
          description="Measures profit generated relative to shareholders' equity."
          accent={COLORS.blue}
        />

        <MetricCard
          icon={WalletCards}
          title="Total cash"
          value={formatLargeNumber(
            result.totalCash,
          )}
          statusType="reported"
          statusValue={result.totalCash}
          description="Cash and liquid resources reported by the company."
          accent={COLORS.cyan}
        />

        <MetricCard
          icon={Banknote}
          title="Total debt"
          value={formatLargeNumber(
            result.totalDebt,
          )}
          statusType="reported"
          statusValue={result.totalDebt}
          description="The company's reported short-term and long-term borrowings."
          accent={COLORS.red}
        />

        <MetricCard
          icon={Scale}
          title="Debt-to-equity"
          value={formatNumber(
            result.debtToEquity,
            2,
          )}
          statusType="debtToEquity"
          statusValue={
            result.debtToEquity
          }
          description="Compares the company's debt with shareholders' equity."
          accent={COLORS.yellow}
        />

        <MetricCard
          icon={Coins}
          title="Free cash flow"
          value={formatLargeNumber(
            result.freeCashflow,
          )}
          statusType="reported"
          statusValue={
            result.freeCashflow
          }
          description="Cash remaining after operating expenses and capital expenditure."
          accent={COLORS.green}
        />

        <MetricCard
          icon={Building2}
          title="Current ratio"
          value={formatNumber(
            result.currentRatio,
            2,
          )}
          statusType="currentRatio"
          statusValue={
            result.currentRatio
          }
          description="Measures the ability to meet short-term financial obligations."
          accent={COLORS.blue}
        />

        <MetricCard
          icon={Percent}
          title="Dividend yield"
          value={formatPercentage(
            result.dividendYield,
          )}
          statusType="reported"
          statusValue={
            result.dividendYield
          }
          description="Annual dividend income relative to the current share price."
          accent={COLORS.purple}
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
            padding: 17,
            borderRadius: 14,
            border:
              `1px solid ${COLORS.border}`,
            background: COLORS.card,
          }}
        >
          <h3
            style={{
              margin: "0 0 5px",
              color: COLORS.white,
              fontSize: 15,
            }}
          >
            Valuation metrics
          </h3>

          <DetailRow
            label="Trailing P/E"
            value={formatNumber(
              result.peRatio,
              2,
            )}
          />

          <DetailRow
            label="Forward P/E"
            value={formatNumber(
              result.forwardPE,
              2,
            )}
          />

          <DetailRow
            label="Price-to-book"
            value={formatNumber(
              result.priceToBook,
              2,
            )}
          />

          <DetailRow
            label="PEG ratio"
            value={formatNumber(
              result.pegRatio,
              2,
            )}
          />

          <DetailRow
            label="Trailing EPS"
            value={formatCurrency(
              result.trailingEps,
              currency,
            )}
          />

          <DetailRow
            label="Forward EPS"
            value={formatCurrency(
              result.forwardEps,
              currency,
            )}
          />
        </div>

        <div
          style={{
            padding: 17,
            borderRadius: 14,
            border:
              `1px solid ${COLORS.border}`,
            background: COLORS.card,
          }}
        >
          <h3
            style={{
              margin: "0 0 5px",
              color: COLORS.white,
              fontSize: 15,
            }}
          >
            Company profile
          </h3>

          <DetailRow
            label="Sector"
            value={result.sector || "N/A"}
          />

          <DetailRow
            label="Industry"
            value={result.industry || "N/A"}
          />

          <DetailRow
            label="Employees"
            value={formatNumber(
              result.employees,
              0,
            )}
          />

          <DetailRow
            label="Earnings growth"
            value={formatPercentage(
              result.earningsGrowth,
            )}
          />
        </div>
      </section>

      {result.businessSummary && (
        <section
          style={{
            padding: 17,
            borderRadius: 14,
            border:
              `1px solid ${COLORS.border}`,
            background: COLORS.card,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 10,
              color: COLORS.white,
            }}
          >
            <BookOpen size={18} />

            <h3
              style={{
                margin: 0,
                fontSize: 15,
              }}
            >
              Business overview
            </h3>
          </div>

          <p
            style={{
              margin: 0,
              color: COLORS.text,
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {result.businessSummary}
          </p>
        </section>
      )}

      <div
        style={{
          padding: "13px 15px",
          color: COLORS.muted,
          background:
            "rgba(47, 128, 237, 0.06)",
          border:
            "1px solid rgba(47, 128, 237, 0.18)",
          borderRadius: 12,
          fontSize: 11,
          lineHeight: 1.65,
        }}
      >
        Fundamental figures are supplied by Yahoo Finance and may
        reflect different reporting periods. They are provided for
        educational research and not personalised investment advice.
      </div>
    </div>
  );
}