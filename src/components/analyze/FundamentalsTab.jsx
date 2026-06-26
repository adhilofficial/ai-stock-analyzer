import {
  Activity,
  BarChart3,
  Building2,
  Database,
  ExternalLink,
  Gauge,
  Percent,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import "../../styles/fundamentals-tab.css";

function numberValue(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function formatNumber(
  value,
  digits = 2,
) {
  const number =
    numberValue(value);

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

function formatPercent(value) {
  const number =
    numberValue(value);

  if (number === null) {
    return "N/A";
  }

  const percentage =
    Math.abs(number) <= 2
      ? number * 100
      : number;

  return `${formatNumber(
    percentage,
  )}%`;
}

function formatRatio(value) {
  const number =
    numberValue(value);

  if (number === null) {
    return "N/A";
  }

  return `${formatNumber(
    number,
  )}x`;
}

function formatLarge(
  value,
  currency = "INR",
) {
  const number =
    numberValue(value);

  if (number === null) {
    return "N/A";
  }

  const absolute =
    Math.abs(number);

  const sign =
    number < 0 ? "-" : "";

  const prefix =
    currency === "INR"
      ? "₹"
      : `${currency} `;

  if (
    absolute >=
    1_000_000_000_000
  ) {
    return `${sign}${prefix}${formatNumber(
      absolute /
        1_000_000_000_000,
    )} Lakh Cr`;
  }

  if (absolute >= 10_000_000) {
    return `${sign}${prefix}${formatNumber(
      absolute / 10_000_000,
    )} Cr`;
  }

  if (absolute >= 100_000) {
    return `${sign}${prefix}${formatNumber(
      absolute / 100_000,
    )} Lakh`;
  }

  return `${sign}${prefix}${formatNumber(
    absolute,
    0,
  )}`;
}

function MetricCard({
  icon,
  label,
  value,
  caption,
}) {
  return (
    <article className="exa-fundamental-metric">
      <span>
        {icon}
      </span>

      <div>
        <p>{label}</p>

        <strong>
          {value}
        </strong>

        <small>
          {caption}
        </small>
      </div>
    </article>
  );
}

function MetricSection({
  eyebrow,
  title,
  icon,
  items,
}) {
  return (
    <article className="exa-fundamental-section">
      <header>
        <span>
          {icon}
        </span>

        <div>
          <p>{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </header>

      <div className="exa-fundamental-grid">
        {items.map((item) => (
          <MetricCard
            key={item.label}
            {...item}
          />
        ))}
      </div>
    </article>
  );
}

export default function FundamentalsTab({
  result,
}) {
  if (!result) {
    return null;
  }

  const fundamentals =
    result.fundamentals ||
    result;

  const currency =
    result.currency || "INR";

  const valuationItems = [
    {
      icon: (
        <Building2 size={18} />
      ),
      label: "Market cap",
      value: formatLarge(
        result.marketCap,
        currency,
      ),
      caption:
        "Equity market value",
    },
    {
      icon: (
        <Database size={18} />
      ),
      label: "Enterprise value",
      value: formatLarge(
        fundamentals
          .enterpriseValue,
        currency,
      ),
      caption:
        "Equity plus net debt",
    },
    {
      icon: (
        <BarChart3 size={18} />
      ),
      label: "Trailing P/E",
      value: formatRatio(
        result.peRatio,
      ),
      caption:
        "Price versus trailing earnings",
    },
    {
      icon: (
        <TrendingUp size={18} />
      ),
      label: "Forward P/E",
      value: formatRatio(
        fundamentals.forwardPE,
      ),
      caption:
        "Price versus forecast earnings",
    },
    {
      icon: (
        <Scale size={18} />
      ),
      label: "Price to book",
      value: formatRatio(
        fundamentals.priceToBook,
      ),
      caption:
        "Price versus book value",
    },
    {
      icon: (
        <Gauge size={18} />
      ),
      label: "PEG ratio",
      value: formatRatio(
        fundamentals.pegRatio,
      ),
      caption:
        "P/E adjusted for growth",
    },
  ];

  const performanceItems = [
    {
      icon: (
        <Database size={18} />
      ),
      label: "Revenue",
      value: formatLarge(
        fundamentals.totalRevenue,
        currency,
      ),
      caption:
        "Trailing twelve months",
    },
    {
      icon: (
        <TrendingUp size={18} />
      ),
      label: "Revenue growth",
      value: formatPercent(
        fundamentals.revenueGrowth,
      ),
      caption:
        "Latest reported growth",
    },
    {
      icon: (
        <Activity size={18} />
      ),
      label: "Earnings growth",
      value: formatPercent(
        fundamentals.earningsGrowth,
      ),
      caption:
        "Latest reported growth",
    },
    {
      icon: (
        <Percent size={18} />
      ),
      label: "Net margin",
      value: formatPercent(
        fundamentals.profitMargins,
      ),
      caption:
        "Net profit percentage",
    },
    {
      icon: (
        <Gauge size={18} />
      ),
      label: "Return on equity",
      value: formatPercent(
        fundamentals.returnOnEquity,
      ),
      caption:
        "Return generated on equity",
    },
    {
      icon: (
        <BarChart3 size={18} />
      ),
      label: "Trailing EPS",
      value: formatNumber(
        fundamentals.trailingEps,
      ),
      caption:
        "Earnings per share",
    },
  ];

  const healthItems = [
    {
      icon: (
        <Database size={18} />
      ),
      label: "Total cash",
      value: formatLarge(
        fundamentals.totalCash,
        currency,
      ),
      caption:
        "Cash and equivalents",
    },
    {
      icon: (
        <Scale size={18} />
      ),
      label: "Total debt",
      value: formatLarge(
        fundamentals.totalDebt,
        currency,
      ),
      caption:
        "Reported borrowings",
    },
    {
      icon: (
        <Gauge size={18} />
      ),
      label: "Debt to equity",
      value: formatNumber(
        fundamentals.debtToEquity,
      ),
      caption:
        "Debt relative to equity",
    },
    {
      icon: (
        <ShieldCheck size={18} />
      ),
      label: "Current ratio",
      value: formatNumber(
        fundamentals.currentRatio,
      ),
      caption:
        "Short-term liquidity",
    },
    {
      icon: (
        <TrendingUp size={18} />
      ),
      label: "Free cash flow",
      value: formatLarge(
        fundamentals.freeCashflow,
        currency,
      ),
      caption:
        "Cash after capital spending",
    },
    {
      icon: (
        <Percent size={18} />
      ),
      label: "Dividend yield",
      value: formatPercent(
        fundamentals.dividendYield,
      ),
      caption:
        "Annual dividend yield",
    },
  ];

  return (
    <section className="exa-fundamentals-tab">
      <article className="exa-fundamental-profile">
        <div>
          <p>
            COMPANY FUNDAMENTALS
          </p>

          <h2>
            {result.company}
          </h2>

          <div>
            <span>
              {result.sector ||
                "Sector unavailable"}
            </span>

            <i>•</i>

            <span>
              {result.industry ||
                "Industry unavailable"}
            </span>

            {result.employees && (
              <>
                <i>•</i>

                <span>
                  {formatNumber(
                    result.employees,
                    0,
                  )}{" "}
                  employees
                </span>
              </>
            )}
          </div>
        </div>

        {result.website && (
          <a
            href={result.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Company website
            <ExternalLink
              size={13}
            />
          </a>
        )}

        <p>
          {result.businessSummary ||
            "A detailed company description is not currently available from Yahoo Finance."}
        </p>
      </article>

      <MetricSection
        eyebrow="VALUATION"
        title="Market valuation"
        icon={
          <Scale size={18} />
        }
        items={valuationItems}
      />

      <MetricSection
        eyebrow="GROWTH & PROFITABILITY"
        title="Operating performance"
        icon={
          <TrendingUp
            size={18}
          />
        }
        items={performanceItems}
      />

      <MetricSection
        eyebrow="FINANCIAL HEALTH"
        title="Balance sheet and cash flow"
        icon={
          <ShieldCheck
            size={18}
          />
        }
        items={healthItems}
      />

      <article className="exa-fundamental-reading">
        <header>
          <span>
            <ShieldCheck
              size={18}
            />
          </span>

          <div>
            <p>
              EXA FUNDAMENTAL SCORE
            </p>

            <h3>
              Fundamental interpretation
            </h3>
          </div>
        </header>

        <div>
          <strong>
            {formatNumber(
              result.fundamentalScore,
              0,
            )}
            /100
          </strong>

          <span>
            {result.fundamentalLabel ||
              "Score unavailable"}
          </span>
        </div>

        <p>
          This score combines the
          available Yahoo Finance
          metrics with AI-assisted
          research. Missing values
          are displayed as N/A and
          are not estimated.
        </p>
      </article>

      <p className="exa-fundamental-disclaimer">
        Fundamental metrics are for
        educational research and are
        not personalized investment
        advice.
      </p>
    </section>
  );
}