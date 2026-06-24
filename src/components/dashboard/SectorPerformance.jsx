function safeNumber(
value,
fallback = 0,
) {
const number = Number(value);

return Number.isFinite(number)
? number
: fallback;
}

function formatPercent(value) {
const number =
safeNumber(value);

return (
`${number >= 0 ? "+" : ""}` +
`${number.toFixed(2)}%`
);
}

function formatValue(value) {
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

function getSectorStyle(
changePercent,
) {
const change =
safeNumber(changePercent);

const strength = Math.min(
Math.abs(change) / 2,
1,
);

if (change >= 0) {
return {
background:
`rgba(34, 197, 94, ${
          0.1 + strength * 0.24
        })`,


  borderColor:
    `rgba(34, 197, 94, ${
      0.25 + strength * 0.5
    })`,
};


}

return {
background:
`rgba(239, 68, 68, ${
        0.1 + strength * 0.24
      })`,


borderColor:
  `rgba(239, 68, 68, ${
    0.25 + strength * 0.5
  })`,

};
}

export default function SectorPerformance({
sectors = [],
}) {
const positiveSectors =
sectors.filter(
(sector) =>
safeNumber(
sector?.changePercent,
) >= 0,
).length;

const negativeSectors =
sectors.length -
positiveSectors;

return ( <article className="exa-dashboard-card exa-sector-card"> <div className="exa-card-heading"> <div> <p className="exa-card-eyebrow">
SECTOR HEATMAP </p>


      <h2>Sector Performance</h2>
    </div>

    <div className="exa-sector-summary">
      <span className="positive">
        {positiveSectors} positive
      </span>

      <span className="negative">
        {negativeSectors} negative
      </span>
    </div>
  </div>

  {sectors.length === 0 ? (
    <div className="exa-sector-empty">
      Sector performance is
      currently unavailable.
    </div>
  ) : (
    <div className="exa-sector-grid">
      {sectors.map((sector) => {
        const changePercent =
          safeNumber(
            sector.changePercent,
          );

        const isPositive =
          changePercent >= 0;

        return (
          <div
            key={
              sector.symbol ||
              sector.name
            }
            className="exa-sector-tile"
            style={getSectorStyle(
              changePercent,
            )}
          >
            <div className="exa-sector-tile-heading">
              <strong>
                {sector.shortName ||
                  sector.name}
              </strong>

              <span>
                {isPositive
                  ? "↗"
                  : "↘"}
              </span>
            </div>

            <p>
              {sector.name}
            </p>

            <div className="exa-sector-tile-footer">
              <span>
                {formatValue(
                  sector.value,
                )}
              </span>

              <strong
                className={
                  isPositive
                    ? "positive"
                    : "negative"
                }
              >
                {formatPercent(
                  changePercent,
                )}
              </strong>
            </div>
          </div>
        );
      })}
    </div>
  )}

  <div className="exa-sector-legend">
    <span>
      <i className="strong-negative" />
      Below -1%
    </span>

    <span>
      <i className="negative" />
      -1% to 0%
    </span>

    <span>
      <i className="positive" />
      0% to +1%
    </span>

    <span>
      <i className="strong-positive" />
      Above +1%
    </span>
  </div>
</article>

);
}
