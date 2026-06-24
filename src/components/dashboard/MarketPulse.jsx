import {
  useEffect,
  useMemo,
  useState,
} from "react";

const PREVIOUS_SCORE_KEY =
  "exa-market-pulse-score-v1";

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
        safeNumber(value, 0),
      ),
    ),
  );
}

function findNiftyIndex(indices) {
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

function findIndiaVix(indices) {
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

  /*
   * A lower VIX generally represents
   * calmer market conditions.
   */
  if (vix <= 12) {
    return 90;
  }

  if (vix <= 15) {
    return 80;
  }

  if (vix <= 18) {
    return 70;
  }

  if (vix <= 22) {
    return 58;
  }

  if (vix <= 25) {
    return 45;
  }

  if (vix <= 30) {
    return 30;
  }

  return 15;
}

function getPulseDetails(score) {
  if (score >= 71) {
    return {
      label: "Bullish",
      tone: "positive",
      description:
        "Live market breadth, momentum and participation are showing strong positive conditions.",
    };
  }

  if (score >= 56) {
    return {
      label:
        "Cautiously Bullish",
      tone: "positive",
      description:
        "Live market indicators are showing moderate positive strength, with supportive breadth and participation.",
    };
  }

  if (score >= 46) {
    return {
      label: "Neutral",
      tone: "neutral",
      description:
        "Live market conditions are balanced, with no clear bullish or bearish advantage.",
    };
  }

  if (score >= 31) {
    return {
      label: "Cautious",
      tone: "neutral",
      description:
        "Live market conditions are showing weaker participation and limited positive momentum.",
    };
  }

  return {
    label: "Bearish",
    tone: "negative",
    description:
      "Live breadth, momentum or volatility indicators are showing weak market conditions.",
  };
}

function getBreadthLabel(score) {
  if (score >= 70) {
    return "Strong";
  }

  if (score >= 55) {
    return "Healthy";
  }

  if (score >= 45) {
    return "Mixed";
  }

  return "Weak";
}

function getMomentumLabel(score) {
  if (score >= 70) {
    return "Strong";
  }

  if (score >= 55) {
    return "Positive";
  }

  if (score >= 45) {
    return "Neutral";
  }

  return "Negative";
}

function getVolatilityLabel(score) {
  if (score >= 75) {
    return "Low";
  }

  if (score >= 55) {
    return "Moderate";
  }

  if (score >= 35) {
    return "Elevated";
  }

  return "High";
}

function getParticipationLabel(
  score,
) {
  if (score >= 70) {
    return "Broad";
  }

  if (score >= 55) {
    return "Healthy";
  }

  if (score >= 45) {
    return "Moderate";
  }

  return "Narrow";
}

function calculateLivePulse({
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

  /*
   * Ratio score:
   * 1.0 A/D ratio is neutral.
   * Values above 1 improve the score.
   * Values below 1 reduce the score.
   */
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
      advancingPercent *
        0.65 +
        ratioScore *
          0.35,
    );

  const nifty =
    findNiftyIndex(indices);

  const niftyChangePercent =
    safeNumber(
      nifty?.changePercent,
      0,
    );

  /*
   * NIFTY daily movement is converted
   * into a 0–100 momentum score.
   *
   * 0% change = 50
   * +1% change ≈ 65
   * -1% change ≈ 35
   */
  const momentumScore =
    clampScore(
      50 +
        niftyChangePercent *
          15,
    );

  const indiaVix =
    findIndiaVix(indices);

  const volatilityScore =
    clampScore(
      calculateVolatilityScore(
        indiaVix?.value,
      ),
    );

  const validSectors =
    sectors.filter((sector) =>
      Number.isFinite(
        Number(
          sector?.changePercent,
        ),
      ),
    );

  const positiveSectorCount =
    validSectors.filter(
      (sector) =>
        Number(
          sector.changePercent,
        ) > 0,
    ).length;

  const positiveSectorPercent =
    validSectors.length > 0
      ? (
          positiveSectorCount /
          validSectors.length
        ) *
        100
      : 50;

  /*
   * Participation combines:
   * - Sector participation: 20% of total pulse
   * - Stocks above 50 DMA: 10% of total pulse
   *
   * Combined into one 30%-weighted factor.
   */
  const participationScore =
    clampScore(
      (
        positiveSectorPercent *
          2 +
        above50DMA
      ) /
        3,
    );

  /*
   * Final EXA Market Pulse weights:
   *
   * Breadth:      30%
   * Momentum:     25%
   * Volatility:   15%
   * Participation 30%
   *
   * Participation includes sector strength
   * and stocks trading above their 50 DMA.
   */
  const score =
    clampScore(
      breadthScore *
        0.3 +
        momentumScore *
          0.25 +
        volatilityScore *
          0.15 +
        participationScore *
          0.3,
    );

  const pulseDetails =
    getPulseDetails(score);

  return {
    score,
    ...pulseDetails,

    factors: [
      {
        name: "Breadth",
        score: breadthScore,
        label:
          getBreadthLabel(
            breadthScore,
          ),
      },
      {
        name: "Momentum",
        score: momentumScore,
        label:
          getMomentumLabel(
            momentumScore,
          ),
      },
      {
        name: "Volatility",
        score:
          volatilityScore,
        label:
          getVolatilityLabel(
            volatilityScore,
          ),
      },
      {
        name: "Participation",
        score:
          participationScore,
        label:
          getParticipationLabel(
            participationScore,
          ),
      },
    ],

    details: {
      niftyChangePercent,
      indiaVix:
        safeNumber(
          indiaVix?.value,
          null,
        ),
      positiveSectorCount,
      totalSectors:
        validSectors.length,
      above50DMA,
    },
  };
}

export default function MarketPulse({
  data,
  breadth,
  indices = [],
  sectors = [],
  loading = false,
  error = "",
}) {
  const [
    previousScore,
    setPreviousScore,
  ] = useState(null);

  const liveDataAvailable =
    safeNumber(
      breadth?.totalStocks,
      0,
    ) > 0 &&
    Array.isArray(indices) &&
    indices.length > 0 &&
    Array.isArray(sectors) &&
    sectors.length > 0;

  const livePulse =
    useMemo(() => {
      if (!liveDataAvailable) {
        return null;
      }

      return calculateLivePulse({
        breadth,
        indices,
        sectors,
      });
    }, [
      liveDataAvailable,
      breadth,
      indices,
      sectors,
    ]);

  const pulseData =
    livePulse || data || {};

  const score =
    clampScore(
      pulseData?.score,
    );

  const factors =
    Array.isArray(
      pulseData?.factors,
    )
      ? pulseData.factors
      : [];

  useEffect(() => {
    if (
      !liveDataAvailable ||
      typeof window ===
        "undefined"
    ) {
      return;
    }

    const storedScore =
      Number(
        window.localStorage.getItem(
          PREVIOUS_SCORE_KEY,
        ),
      );

    if (
      Number.isFinite(
        storedScore,
      )
    ) {
      setPreviousScore(
        storedScore,
      );
    }

    window.localStorage.setItem(
      PREVIOUS_SCORE_KEY,
      String(score),
    );
  }, [
    liveDataAvailable,
    score,
  ]);

  const scoreChange =
    previousScore === null
      ? null
      : score -
        previousScore;

  function getStatusText() {
    if (
      loading &&
      !liveDataAvailable
    ) {
      return "Calculating live market pulse...";
    }

    if (
      error &&
      !liveDataAvailable
    ) {
      return "Live calculation unavailable. Temporary fallback data is displayed.";
    }

    if (liveDataAvailable) {
      return "Calculated from live Yahoo Finance market data.";
    }

    return "Development-stage market indicator.";
  }

  return (
    <article className="exa-dashboard-card exa-pulse-card">
      <div className="exa-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            EXA INTELLIGENCE
          </p>

          <h2>
            EXA Market Pulse
          </h2>
        </div>

        <span
          className={
            liveDataAvailable
              ? "exa-market-data-badge live"
              : "exa-market-data-badge fallback"
          }
        >
          {loading
            ? "Calculating..."
            : liveDataAvailable
              ? "Live calculation"
              : "Fallback data"}
        </span>
      </div>

      <div className="exa-pulse-main">
        <div
          className="exa-pulse-ring"
          style={{
            background: `conic-gradient(
              #2563eb 0%,
              #38bdf8 ${score}%,
              #19253a ${score}%,
              #19253a 100%
            )`,
          }}
        >
          <div className="exa-pulse-ring-inner">
            <strong>
              {score}
            </strong>

            <span>/100</span>
          </div>
        </div>

        <div className="exa-pulse-description">
          <h3
            className={
              pulseData?.tone ===
              "negative"
                ? "negative"
                : pulseData?.tone ===
                    "neutral"
                  ? "neutral"
                  : "positive"
            }
          >
            {pulseData?.label ||
              "Unavailable"}
          </h3>

          <p>
            {pulseData?.description ||
              "Market Pulse data is currently unavailable."}
          </p>

          <div className="exa-pulse-change">
            {scoreChange === null ? (
              <>
                <span>
                  Current status:
                </span>

                <strong>
                  Live score
                </strong>
              </>
            ) : (
              <>
                <span>
                  Change from previous:
                </span>

                <strong>
                  {scoreChange >= 0
                    ? "+"
                    : ""}
                  {scoreChange}
                </strong>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="exa-pulse-factors">
        {factors.map(
          (factor) => (
            <div
              key={factor.name}
              className="exa-pulse-factor"
            >
              <span>
                {factor.name}
              </span>

              <strong>
                {clampScore(
                  factor.score,
                )}
                /100
              </strong>

              <small>
                {factor.label}
              </small>
            </div>
          ),
        )}
      </div>

      <p className="exa-pulse-disclaimer">
        {getStatusText()} Educational
        market indicator—not investment
        advice.
      </p>
    </article>
  );
}