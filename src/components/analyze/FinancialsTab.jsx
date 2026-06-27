import {
  Activity,
  Banknote,
  BarChart3,
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
  panel: "#0b1729",
  card: "#101e34",
  border: "#1e3350",
  text: "#94a3b8",
  muted: "#64748b",
  white: "#f8fafc",
  blue: "#60a5fa",
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getField(result, key) {
  return (
    result?.[key] ??
    result?.fundamentals?.[key] ??
    null
  );
}

function formatCurrency(
  value,
  currency = "INR",
) {
  const number = safeNumber(value);

  if (number === null) {
    return "Not available";
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
    return number.toFixed(2);
  }
}

function formatCompactCurrency(
  value,
  currency = "INR",
) {
  const number = safeNumber(value);

  if (number === null) {
    return "Not available";
  }

  const absolute = Math.abs(number);
  const symbol =
    currency === "INR"
      ? "₹"
      : `${currency} `;

  if (absolute >= 1_00_00_00_00_000) {
    return `${symbol}${(
      number /
      1_00_00_00_00_000
    ).toFixed(2)} Lakh Cr`;
  }

  if (absolute >= 1_00_00_00_000) {
    return `${symbol}${(
      number /
      1_00_00_00_000
    ).toFixed(2)} K Cr`;
  }

  if (absolute >= 1_00_00_000) {
    return `${symbol}${(
      number /
      1_00_00_000
    ).toFixed(2)} Cr`;
  }

  if (absolute >= 1_00_000) {
    return `${symbol}${(
      number /
      1_00_000
    ).toFixed(2)} Lakh`;
  }

  return formatCurrency(
    number,
    currency,
  );
}

function formatNumber(
  value,
  digits = 2,
) {
  const number = safeNumber(value);

  if (number === null) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        digits,
    },
  ).format(number);
}

function formatRatio(value) {
  const number = safeNumber(value);

  if (number === null) {
    return "Not available";
  }

  return `${formatNumber(number, 2)}x`;
}

function normalizePercentage(
  value,
) {
  const number = safeNumber(value);

  if (number === null) {
    return null;
  }

  /*
   * Yahoo usually returns decimal values:
   * 0.18 = 18%.
   *
   * Some providers may already return 18.
   */
  if (Math.abs(number) <= 2) {
    return number * 100;
  }

  return number;
}

function formatPercent(
  value,
  showSign = false,
) {
  const percentage =
    normalizePercentage(value);

  if (percentage === null) {
    return "Not available";
  }

  const sign =
    showSign &&
    percentage > 0
      ? "+"
      : "";

  return `${sign}${percentage.toFixed(
    2,
  )}%`;
}

function getValueTone(
  value,
  {
    positiveAbove = null,
    warningBelow = null,
    negativeBelow = null,
  } = {},
) {
  const number = safeNumber(value);

  if (number === null) {
    return COLORS.white;
  }

  if (
    negativeBelow !== null &&
    number < negativeBelow
  ) {
    return COLORS.red;
  }

  if (
    warningBelow !== null &&
    number < warningBelow
  ) {
    return COLORS.yellow;
  }

  if (
    positiveAbove !== null &&
    number >= positiveAbove
  ) {
    return COLORS.green;
  }

  return COLORS.white;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  valueColor = COLORS.white,
}) {
  return (
    <article
      style={{
        minWidth: 0,
        padding: 16,
        border:
          `1px solid ${COLORS.border}`,
        borderRadius: 14,
        background: COLORS.card,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            color: COLORS.blue,
            background:
              "rgba(37, 99, 235, 0.12)",
            border:
              "1px solid rgba(96, 165, 250, 0.16)",
            display:
              "inline-flex",
            alignItems: "center",
            justifyContent:
              "center",
            flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </span>

        <span
          style={{
            color: COLORS.text,
            fontSize: 12,
            fontWeight: 650,
          }}
        >
          {label}
        </span>
      </div>

      <strong
        style={{
          display: "block",
          overflow: "hidden",
          color: valueColor,
          fontSize: 18,
          lineHeight: 1.25,
          textOverflow:
            "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={value}
      >
        {value}
      </strong>

      <p
        style={{
          minHeight: 36,
          margin: "8px 0 0",
          color: COLORS.muted,
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        {note}
      </p>
    </article>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section
      style={{
        marginTop: 16,
        padding: 18,
        border:
          `1px solid ${COLORS.border}`,
        borderRadius: 16,
        background: COLORS.panel,
      }}
    >
      <div
        style={{
          marginBottom: 14,
        }}
      >
        <span
          style={{
            color: COLORS.blue,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing:
              "0.14em",
            textTransform:
              "uppercase",
          }}
        >
          {eyebrow}
        </span>

        <h3
          style={{
            margin: "5px 0 0",
            color: COLORS.white,
            fontSize: 17,
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            style={{
              maxWidth: 760,
              margin: "6px 0 0",
              color: COLORS.muted,
              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(185px, 1fr))",
          gap: 11,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function buildHealthSummary(result) {
  const revenueGrowth =
    normalizePercentage(
      getField(
        result,
        "revenueGrowth",
      ),
    );

  const earningsGrowth =
    normalizePercentage(
      getField(
        result,
        "earningsGrowth",
      ),
    );

  const profitMargin =
    normalizePercentage(
      getField(
        result,
        "profitMargins",
      ),
    );

  const roe =
    normalizePercentage(
      getField(
        result,
        "returnOnEquity",
      ),
    );

  const currentRatio =
    safeNumber(
      getField(
        result,
        "currentRatio",
      ),
    );

  const debtToEquity =
    safeNumber(
      getField(
        result,
        "debtToEquity",
      ),
    );

  const freeCashflow =
    safeNumber(
      getField(
        result,
        "freeCashflow",
      ),
    );

  const tests = [
    revenueGrowth !== null
      ? revenueGrowth > 0
      : null,
    earningsGrowth !== null
      ? earningsGrowth > 0
      : null,
    profitMargin !== null
      ? profitMargin > 10
      : null,
    roe !== null
      ? roe > 12
      : null,
    currentRatio !== null
      ? currentRatio >= 1
      : null,
    debtToEquity !== null
      ? debtToEquity <= 100
      : null,
    freeCashflow !== null
      ? freeCashflow > 0
      : null,
  ].filter(
    (value) =>
      value !== null,
  );

  if (tests.length === 0) {
    return {
      label:
        "Financial data limited",
      description:
        "Yahoo Finance did not provide enough financial fields to build a complete health summary.",
      tone: COLORS.yellow,
    };
  }

  const passed =
    tests.filter(Boolean).length;

  const score =
    Math.round(
      (passed / tests.length) *
        100,
    );

  if (score >= 70) {
    return {
      label:
        "Generally healthy",
      description:
        `${passed} of ${tests.length} available financial checks are positive.`,
      tone: COLORS.green,
    };
  }

  if (score >= 45) {
    return {
      label:
        "Mixed financial profile",
      description:
        `${passed} of ${tests.length} available financial checks are positive.`,
      tone: COLORS.yellow,
    };
  }

  return {
    label:
      "Financial caution",
    description:
      `${passed} of ${tests.length} available financial checks are positive.`,
    tone: COLORS.red,
  };
}

export default function FinancialsTab({
  result,
}) {
  const currency =
    result?.currency ||
    "INR";

  const totalRevenue =
    getField(
      result,
      "totalRevenue",
    );

  const revenueGrowth =
    getField(
      result,
      "revenueGrowth",
    );

  const earningsGrowth =
    getField(
      result,
      "earningsGrowth",
    );

  const profitMargins =
    getField(
      result,
      "profitMargins",
    );

  const returnOnEquity =
    getField(
      result,
      "returnOnEquity",
    );

  const totalCash =
    getField(
      result,
      "totalCash",
    );

  const totalDebt =
    getField(
      result,
      "totalDebt",
    );

  const debtToEquity =
    getField(
      result,
      "debtToEquity",
    );

  const currentRatio =
    getField(
      result,
      "currentRatio",
    );

  const freeCashflow =
    getField(
      result,
      "freeCashflow",
    );

  const dividendYield =
    getField(
      result,
      "dividendYield",
    );

  const trailingEps =
    getField(
      result,
      "trailingEps",
    );

  const forwardEps =
    getField(
      result,
      "forwardEps",
    );

  const trailingPE =
    result?.peRatio ??
    result?.peRatioTTM ??
    getField(
      result,
      "peRatio",
    );

  const forwardPE =
    getField(
      result,
      "forwardPE",
    );

  const priceToBook =
    getField(
      result,
      "priceToBook",
    );

  const pegRatio =
    getField(
      result,
      "pegRatio",
    );

  const marketCap =
    result?.marketCap ??
    getField(
      result,
      "marketCap",
    );

  const enterpriseValue =
    getField(
      result,
      "enterpriseValue",
    );

  const cash =
    safeNumber(totalCash);

  const debt =
    safeNumber(totalDebt);

  const netCash =
    cash !== null &&
    debt !== null
      ? cash - debt
      : null;

  const health =
    buildHealthSummary(
      result,
    );

  return (
    <div
      style={{
        paddingTop: 16,
      }}
    >
      <section
        style={{
          padding: 18,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius: 16,
          background:
            "linear-gradient(145deg, rgba(10, 24, 43, 0.98), rgba(7, 18, 35, 0.98))",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              color: COLORS.blue,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing:
                "0.14em",
              textTransform:
                "uppercase",
            }}
          >
            Financial health
          </span>

          <h2
            style={{
              margin: "6px 0 0",
              color: COLORS.white,
              fontSize: 20,
            }}
          >
            {health.label}
          </h2>

          <p
            style={{
              maxWidth: 650,
              margin: "7px 0 0",
              color: COLORS.text,
              fontSize: 12,
              lineHeight: 1.65,
            }}
          >
            {health.description}
          </p>
        </div>

        <div
          style={{
            minWidth: 160,
            padding: "12px 14px",
            border:
              `1px solid ${health.tone}44`,
            borderRadius: 12,
            color: health.tone,
            background:
              `${health.tone}12`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ShieldCheck
            size={22}
          />

          <div>
            <strong
              style={{
                display: "block",
                fontSize: 13,
              }}
            >
              Live financial data
            </strong>

            <span
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 10,
              }}
            >
              Source:{" "}
              {result?.source ||
                "Yahoo Finance"}
            </span>
          </div>
        </div>
      </section>

      <Section
        eyebrow="Financial highlights"
        title="Business scale and cash generation"
        description="High-level indicators showing the company's size, revenue base and ability to generate cash."
      >
        <MetricCard
          icon={Landmark}
          label="Market capitalisation"
          value={formatCompactCurrency(
            marketCap,
            currency,
          )}
          note="Current market value of the company's listed equity."
        />

        <MetricCard
          icon={Scale}
          label="Enterprise value"
          value={formatCompactCurrency(
            enterpriseValue,
            currency,
          )}
          note="Approximate operating value after including debt and cash."
        />

        <MetricCard
          icon={Banknote}
          label="Total revenue"
          value={formatCompactCurrency(
            totalRevenue,
            currency,
          )}
          note="Latest revenue figure supplied by Yahoo Finance."
        />

        <MetricCard
          icon={WalletCards}
          label="Free cash flow"
          value={formatCompactCurrency(
            freeCashflow,
            currency,
          )}
          valueColor={getValueTone(
            freeCashflow,
            {
              positiveAbove: 0,
              negativeBelow: 0,
            },
          )}
          note="Cash remaining after operating and capital expenditure."
        />
      </Section>

      <Section
        eyebrow="Growth and profitability"
        title="Operating performance"
        description="Growth and profitability values help show whether the business is expanding efficiently."
      >
        <MetricCard
          icon={TrendingUp}
          label="Revenue growth"
          value={formatPercent(
            revenueGrowth,
            true,
          )}
          valueColor={getValueTone(
            normalizePercentage(
              revenueGrowth,
            ),
            {
              positiveAbove: 10,
              warningBelow: 0,
              negativeBelow: -10,
            },
          )}
          note="Year-over-year revenue growth where available."
        />

        <MetricCard
          icon={Activity}
          label="Earnings growth"
          value={formatPercent(
            earningsGrowth,
            true,
          )}
          valueColor={getValueTone(
            normalizePercentage(
              earningsGrowth,
            ),
            {
              positiveAbove: 10,
              warningBelow: 0,
              negativeBelow: -10,
            },
          )}
          note="Growth in company earnings reported by the data provider."
        />

        <MetricCard
          icon={Percent}
          label="Profit margin"
          value={formatPercent(
            profitMargins,
          )}
          valueColor={getValueTone(
            normalizePercentage(
              profitMargins,
            ),
            {
              positiveAbove: 15,
              warningBelow: 5,
              negativeBelow: 0,
            },
          )}
          note="Share of revenue retained as profit."
        />

        <MetricCard
          icon={BarChart3}
          label="Return on equity"
          value={formatPercent(
            returnOnEquity,
          )}
          valueColor={getValueTone(
            normalizePercentage(
              returnOnEquity,
            ),
            {
              positiveAbove: 15,
              warningBelow: 8,
              negativeBelow: 0,
            },
          )}
          note="Profitability relative to shareholder equity."
        />
      </Section>

      <Section
        eyebrow="Balance sheet"
        title="Cash, debt and liquidity"
        description="Balance-sheet indicators help assess financial flexibility and short-term liquidity."
      >
        <MetricCard
          icon={Coins}
          label="Total cash"
          value={formatCompactCurrency(
            totalCash,
            currency,
          )}
          note="Cash and liquid resources reported by the company."
        />

        <MetricCard
          icon={Landmark}
          label="Total debt"
          value={formatCompactCurrency(
            totalDebt,
            currency,
          )}
          note="Combined debt obligations available from Yahoo Finance."
        />

        <MetricCard
          icon={CircleDollarSign}
          label={
            netCash !== null &&
            netCash >= 0
              ? "Net cash"
              : "Net debt"
          }
          value={formatCompactCurrency(
            netCash === null
              ? null
              : Math.abs(netCash),
            currency,
          )}
          valueColor={
            netCash === null
              ? COLORS.white
              : netCash >= 0
                ? COLORS.green
                : COLORS.red
          }
          note="Difference between available cash and reported total debt."
        />

        <MetricCard
          icon={Scale}
          label="Debt-to-equity"
          value={formatRatio(
            debtToEquity,
          )}
          valueColor={getValueTone(
            debtToEquity,
            {
              positiveAbove: null,
              warningBelow: null,
              negativeBelow: null,
            },
          )}
          note="Debt relative to shareholder equity. Lower is generally more conservative."
        />

        <MetricCard
          icon={ShieldCheck}
          label="Current ratio"
          value={formatRatio(
            currentRatio,
          )}
          valueColor={getValueTone(
            currentRatio,
            {
              positiveAbove: 1.5,
              warningBelow: 1,
              negativeBelow: 0.75,
            },
          )}
          note="Short-term assets relative to short-term liabilities."
        />
      </Section>

      <Section
        eyebrow="Per-share and valuation"
        title="Earnings and valuation multiples"
        description="These values connect the share price with earnings, book value, growth and shareholder distributions."
      >
        <MetricCard
          icon={Banknote}
          label="Trailing EPS"
          value={formatCurrency(
            trailingEps,
            currency,
          )}
          note="Earnings per share over the trailing twelve-month period."
        />

        <MetricCard
          icon={TrendingUp}
          label="Forward EPS"
          value={formatCurrency(
            forwardEps,
            currency,
          )}
          note="Forecast earnings per share where Yahoo Finance provides it."
        />

        <MetricCard
          icon={BarChart3}
          label="Trailing P/E"
          value={formatRatio(
            trailingPE,
          )}
          note="Current share price relative to trailing earnings per share."
        />

        <MetricCard
          icon={BarChart3}
          label="Forward P/E"
          value={formatRatio(
            forwardPE,
          )}
          note="Current price relative to forecast earnings."
        />

        <MetricCard
          icon={Scale}
          label="Price-to-book"
          value={formatRatio(
            priceToBook,
          )}
          note="Share price relative to book value per share."
        />

        <MetricCard
          icon={TrendingUp}
          label="PEG ratio"
          value={formatRatio(
            pegRatio,
          )}
          note="P/E ratio adjusted for expected earnings growth."
        />

        <MetricCard
          icon={Percent}
          label="Dividend yield"
          value={formatPercent(
            dividendYield,
          )}
          note="Annual dividend return relative to the current share price."
        />
      </Section>

      <p
        style={{
          margin:
            "14px 4px 0",
          color: COLORS.muted,
          fontSize: 10,
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        Financial fields may be unavailable for some companies, sectors or newly listed stocks. Values are for educational research and should be verified against company filings.
      </p>
    </div>
  );
}