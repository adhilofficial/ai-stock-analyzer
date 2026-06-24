function safeNumber(
value,
fallback = 0,
) {
const number = Number(value);

return Number.isFinite(number)
? number
: fallback;
}

function formatCount(value) {
return new Intl.NumberFormat(
"en-IN",
).format(
safeNumber(value),
);
}

function formatPercent(value) {
return `${safeNumber(value).toFixed(0)}%`;
}

export default function MarketBreadth({
data,
}) {
const advancing = Math.max(
0,
safeNumber(data?.advancing),
);

const declining = Math.max(
0,
safeNumber(data?.declining),
);

const unchanged = Math.max(
0,
safeNumber(data?.unchanged),
);

const directionalTotal =
advancing + declining;

const totalStocks =
advancing +
declining +
unchanged;

const advancingPercent =
directionalTotal > 0
? (advancing /
directionalTotal) *
100
: 50;

const decliningPercent =
100 - advancingPercent;

return ( <article className="exa-dashboard-card exa-breadth-card"> <div className="exa-card-heading"> <div> <p className="exa-card-eyebrow">
MARKET PARTICIPATION </p>

      <h2>Market Breadth</h2>
    </div>

    <span className="exa-breadth-total">
      {formatCount(totalStocks)} stocks
    </span>
  </div>

  <div className="exa-breadth-main">
    <div
      className="exa-breadth-donut"
      style={{
        background: `conic-gradient(
          #22c55e 0%,
          #22c55e ${advancingPercent}%,
          #ef4444 ${advancingPercent}%,
          #ef4444 100%
        )`,
      }}
    >
      <div className="exa-breadth-donut-inner">
        <strong>
          {safeNumber(
            data?.advanceDeclineRatio,
          ).toFixed(2)}
        </strong>

        <span>A/D Ratio</span>
      </div>
    </div>

    <div className="exa-breadth-legend">
      <div className="exa-breadth-stat advancing">
        <div>
          <span className="exa-breadth-color" />

          <span>Advancing</span>
        </div>

        <strong>
          {formatCount(advancing)}
        </strong>

        <small>
          {formatPercent(
            advancingPercent,
          )}
        </small>
      </div>

      <div className="exa-breadth-stat declining">
        <div>
          <span className="exa-breadth-color" />

          <span>Declining</span>
        </div>

        <strong>
          {formatCount(declining)}
        </strong>

        <small>
          {formatPercent(
            decliningPercent,
          )}
        </small>
      </div>

      <div className="exa-breadth-unchanged">
        <span>Unchanged</span>

        <strong>
          {formatCount(unchanged)}
        </strong>
      </div>
    </div>
  </div>

  <div className="exa-breadth-metrics">
    <div className="exa-breadth-metric">
      <span>
        Stocks above 50 DMA
      </span>

      <strong className="positive">
        {formatPercent(
          data?.above50DMA,
        )}
      </strong>
    </div>

    <div className="exa-breadth-metric">
      <span>52-week highs</span>

      <strong className="positive">
        {formatCount(
          data?.week52Highs,
        )}
      </strong>
    </div>

    <div className="exa-breadth-metric">
      <span>52-week lows</span>

      <strong className="negative">
        {formatCount(
          data?.week52Lows,
        )}
      </strong>
    </div>
  </div>

  <p className="exa-breadth-scope">
    {data?.scope ||
      "Market breadth data"}
  </p>
</article>


);
}
