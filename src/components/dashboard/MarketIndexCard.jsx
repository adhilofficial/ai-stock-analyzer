import {
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatChange(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}`;
}

export default function MarketIndexCard({
  index,
}) {
  const changePercent =
    Number(index?.changePercent) || 0;

  const isPositive =
    changePercent >= 0;

  const chartData = Array.isArray(
    index?.trend,
  )
    ? index.trend.map(
        (value, position) => ({
          position,
          value,
        }),
      )
    : [];

  return (
    <article className="exa-index-card">
      <div className="exa-index-card-header">
        <div>
          <span className="exa-index-flag">
            🇮🇳
          </span>

          <span className="exa-index-name">
            {index.symbol}
          </span>
        </div>

        <span className="exa-index-market">
          NSE
        </span>
      </div>

      <strong className="exa-index-value">
        {formatNumber(index.value)}
      </strong>

      <div
        className={
          isPositive
            ? "exa-index-change positive"
            : "exa-index-change negative"
        }
      >
        <span>
          {formatChange(index.change)}
        </span>

        <span>
          (
          {formatChange(
            index.changePercent,
          )}
          %)
        </span>
      </div>

      <div className="exa-index-chart">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
        >
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={
                isPositive
                  ? "#22c55e"
                  : "#ef4444"
              }
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}