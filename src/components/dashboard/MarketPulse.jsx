export default function MarketPulse({
  data,
}) {
  const score = Math.min(
    100,
    Math.max(
      0,
      Number(data?.score) || 0,
    ),
  );

  const factors = Array.isArray(
    data?.factors,
  )
    ? data.factors
    : [];

  return (
    <article className="exa-dashboard-card exa-pulse-card">
      <div className="exa-card-heading">
        <div>
          <p className="exa-card-eyebrow">
            EXA INTELLIGENCE
          </p>

          <h2>EXA Market Pulse</h2>
        </div>

        <button type="button">
          How it works
        </button>
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
            <strong>{score}</strong>
            <span>/100</span>
          </div>
        </div>

        <div className="exa-pulse-description">
          <h3
            className={
              data?.tone === "negative"
                ? "negative"
                : data?.tone === "neutral"
                  ? "neutral"
                  : "positive"
            }
          >
            {data?.label ||
              "Unavailable"}
          </h3>

          <p>
            {data?.description ||
              "Market Pulse data is currently unavailable."}
          </p>

          <div className="exa-pulse-change">
            <span>
              Change from previous:
            </span>

            <strong>
              {Number(
                data?.changeFromPrevious,
              ) >= 0
                ? "+"
                : ""}
              {data?.changeFromPrevious ??
                0}
            </strong>
          </div>
        </div>
      </div>

      <div className="exa-pulse-factors">
        {factors.map((factor) => (
          <div
            key={factor.name}
            className="exa-pulse-factor"
          >
            <span>{factor.name}</span>

            <strong>
              {factor.score}/100
            </strong>

            <small>
              {factor.label}
            </small>
          </div>
        ))}
      </div>

      <p className="exa-pulse-disclaimer">
        Educational market indicator—not
        investment advice.
      </p>
    </article>
  );
}