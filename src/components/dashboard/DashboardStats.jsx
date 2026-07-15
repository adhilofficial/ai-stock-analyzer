import {
  Activity,
  BellRing,
  Gauge,
  ShieldAlert,
  TrendingUp,
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

function clampScore(value) {
  return Math.round(
    Math.min(
      100,
      Math.max(
        0,
        safeNumber(value),
      ),
    ),
  );
}

function findNiftyIndex(indices = []) {
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

function findIndiaVix(indices = []) {
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

function calculateVolatilityScore(
  vixValue,
) {
  const vix = safeNumber(
    vixValue,
    20,
  );

  if (vix <= 12) return 90;
  if (vix <= 15) return 80;
  if (vix <= 18) return 70;
  if (vix <= 22) return 58;
  if (vix <= 25) return 45;
  if (vix <= 30) return 30;

  return 15;
}

function calculateExaScore({
  breadth,
  indices,
  sectors,
}) {
  const advancingPercent =
    safeNumber(
      breadth?.advancingPercent,
      50,
    );

  const advanceDeclineRatio =
    safeNumber(
      breadth?.advanceDeclineRatio,
      1,
    );

  const above50DMA =
    safeNumber(
      breadth?.above50DMA,
      50,
    );

  const ratioScore =
    clampScore(
      50 +
        (
          advanceDeclineRatio -
          1
        ) *
          25,
    );

  const breadthScore =
    clampScore(
      advancingPercent * 0.65 +
        ratioScore * 0.35,
    );

  const nifty =
    findNiftyIndex(indices);

  const niftyChangePercent =
    safeNumber(
      nifty?.changePercent,
      0,
    );

  const momentumScore =
    clampScore(
      50 +
        niftyChangePercent * 15,
    );

  const indiaVix =
    findIndiaVix(indices);

  const volatilityScore =
    calculateVolatilityScore(
      indiaVix?.value,
    );

  const validSectors =
    Array.isArray(sectors)
      ? sectors.filter((sector) =>
          Number.isFinite(
            Number(
              sector?.changePercent,
            ),
          ),
        )
      : [];

  const positiveSectors =
    validSectors.filter(
      (sector) =>
        Number(
          sector.changePercent,
        ) > 0,
    ).length;

  const positiveSectorPercent =
    validSectors.length > 0
      ? (
          positiveSectors /
          validSectors.length
        ) *
        100
      : 50;

  const participationScore =
    clampScore(
      (
        positiveSectorPercent * 2 +
        above50DMA
      ) /
        3,
    );

  return clampScore(
    breadthScore * 0.3 +
      momentumScore * 0.25 +
      volatilityScore * 0.15 +
      participationScore * 0.3,
  );
}

function getScoreLabel(score) {
  if (score >= 71) {
    return {
      label: "Bullish",
      className: "positive",
    };
  }

  if (score >= 56) {
    return {
      label: "Cautiously Bullish",
      className: "positive",
    };
  }

  if (score >= 46) {
    return {
      label: "Neutral",
      className: "neutral",
    };
  }

  if (score >= 31) {
    return {
      label: "Cautious",
      className: "warning",
    };
  }

  return {
    label: "Bearish",
    className: "negative",
  };
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

function MiniSparkline({
  values = [],
  positive = true,
}) {
  const usableValues =
    Array.isArray(values)
      ? values
          .map(Number)
          .filter(Number.isFinite)
      : [];

  if (usableValues.length < 2) {
    return (
      <div className="exa-stat-mini-bars">
        {[4, 7, 5, 9, 6, 10, 8].map(
          (height, index) => (
            <span
              key={`${height}-${index}`}
              style={{
                height: `${height}px`,
              }}
            />
          ),
        )}
      </div>
    );
  }

  const width = 110;
  const height = 32;

  const minimum = Math.min(
    ...usableValues,
  );

  const maximum = Math.max(
    ...usableValues,
  );

  const range =
    maximum - minimum || 1;

  const points =
    usableValues
      .map((value, index) => {
        const x =
          (
            index /
            (
              usableValues.length -
              1
            )
          ) *
          width;

        const y =
          height -
          (
            (
              value -
              minimum
            ) /
            range
          ) *
            height;

        return `${x},${y}`;
      })
      .join(" ");

  return (
    <svg
      className={
        positive
          ? "exa-stat-sparkline positive"
          : "exa-stat-sparkline negative"
      }
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardStats({
  marketStatus,
  indices = [],
  breadth,
  sectors = [],
  alerts = [],
  loading = false,
}) {
  const nifty =
    findNiftyIndex(indices);

  const indiaVix =
    findIndiaVix(indices);

  const exaScore =
    calculateExaScore({
      breadth,
      indices,
      sectors,
    });

  const scoreDetails =
    getScoreLabel(exaScore);

  const advancing =
    safeNumber(
      breadth?.advancing,
      0,
    );

  const totalStocks =
    safeNumber(
      breadth?.totalStocks,
      0,
    );

  const advancingPercent =
    safeNumber(
      breadth?.advancingPercent,
      0,
    );

  const alertCount =
    Array.isArray(alerts)
      ? alerts.length
      : 0;

  const niftyPositive =
    safeNumber(
      nifty?.changePercent,
      0,
    ) >= 0;

  const vixPositive =
    safeNumber(
      indiaVix?.changePercent,
      0,
    ) <= 0;

  return (
    <section className="exa-dashboard-stats">
      <article className="exa-stat-card market">
        <div className="exa-stat-card-top">
          <span className="exa-stat-label">
            Market Status
          </span>

          <span className="exa-stat-icon">
            <Activity size={17} />
          </span>
        </div>

        <small>NIFTY 50</small>

        <strong>
          {loading
            ? "..."
            : formatNumber(
                nifty?.value,
              )}
        </strong>

        <div className="exa-stat-card-bottom">
          <span
            className={
              niftyPositive
                ? "positive"
                : "negative"
            }
          >
            {formatPercent(
              nifty?.changePercent,
            )}
          </span>

          <MiniSparkline
            values={nifty?.trend}
            positive={niftyPositive}
          />
        </div>

        <span
          className={
            marketStatus?.isOpen
              ? "exa-stat-status open"
              : "exa-stat-status closed"
          }
        >
          {marketStatus?.label ||
            "Status unavailable"}
        </span>
      </article>

      <article className="exa-stat-card score">
        <div className="exa-stat-card-top">
          <span className="exa-stat-label">
            Litses Market Score
          </span>

          <span className="exa-stat-icon">
            <Gauge size={17} />
          </span>
        </div>

        <div className="exa-score-card-content">
          <div>
            <strong>
              {loading
                ? "..."
                : exaScore}
              <small>/100</small>
            </strong>

            <span
              className={
                scoreDetails.className
              }
            >
              {scoreDetails.label}
            </span>
          </div>

          <div
            className="exa-mini-score-ring"
            style={{
              background: `conic-gradient(
                var(--exa-positive)
                ${exaScore}%,
                var(--exa-border)
                ${exaScore}% 100%
              )`,
            }}
          >
            <span />
          </div>
        </div>
      </article>

      <article className="exa-stat-card breadth">
        <div className="exa-stat-card-top">
          <span className="exa-stat-label">
            Advancing Stocks
          </span>

          <span className="exa-stat-icon">
            <TrendingUp size={17} />
          </span>
        </div>

        <small>
          Tracked NSE universe
        </small>

        <strong>
          {loading
            ? "..."
            : `${advancing}/${totalStocks}`}
        </strong>

        <div className="exa-stat-progress">
          <span
            style={{
              width: `${Math.min(
                100,
                advancingPercent,
              )}%`,
            }}
          />
        </div>

        <span className="positive">
          {advancingPercent.toFixed(1)}%
          advancing
        </span>
      </article>

      <article className="exa-stat-card volatility">
        <div className="exa-stat-card-top">
          <span className="exa-stat-label">
            India VIX
          </span>

          <span className="exa-stat-icon">
            <ShieldAlert size={17} />
          </span>
        </div>

        <small>
          Market volatility
        </small>

        <strong>
          {loading
            ? "..."
            : formatNumber(
                indiaVix?.value,
              )}
        </strong>

        <div className="exa-stat-card-bottom">
          <span
            className={
              vixPositive
                ? "positive"
                : "negative"
            }
          >
            {formatPercent(
              indiaVix?.changePercent,
            )}
          </span>

          <MiniSparkline
            values={indiaVix?.trend}
            positive={vixPositive}
          />
        </div>
      </article>

      <article className="exa-stat-card alerts">
        <div className="exa-stat-card-top">
          <span className="exa-stat-label">
            Live Alerts
          </span>

          <span className="exa-stat-icon">
            <BellRing size={17} />
          </span>
        </div>

        <small>
          Research notifications
        </small>

        <strong>
          {loading
            ? "..."
            : alertCount}
        </strong>

        <div className="exa-alert-stat-copy">
          <span>
            Generated from live market
            activity
          </span>

          <span className="exa-alert-pulse" />
        </div>
      </article>
    </section>
  );
}
