function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getClosingPrices(chart = []) {
  if (!Array.isArray(chart)) {
    return [];
  }

  return chart
    .map((item) =>
      toNumber(item?.close),
    )
    .filter(
      (value) =>
        value !== null,
    );
}

function getVolumes(chart = []) {
  if (!Array.isArray(chart)) {
    return [];
  }

  return chart
    .map((item) =>
      toNumber(item?.volume),
    )
    .filter(
      (value) =>
        value !== null,
    );
}

export function calculateSMA(
  values = [],
  period = 20,
) {
  if (
    !Array.isArray(values) ||
    values.length < period
  ) {
    return null;
  }

  const recentValues =
    values.slice(-period);

  const total =
    recentValues.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return total / period;
}

export function calculateEMA(
  values = [],
  period = 20,
) {
  if (
    !Array.isArray(values) ||
    values.length < period
  ) {
    return null;
  }

  const multiplier =
    2 / (period + 1);

  let ema =
    values
      .slice(0, period)
      .reduce(
        (sum, value) =>
          sum + value,
        0,
      ) / period;

  for (
    let index = period;
    index < values.length;
    index += 1
  ) {
    ema =
      values[index] *
        multiplier +
      ema *
        (1 - multiplier);
  }

  return ema;
}

export function calculateRSI(
  values = [],
  period = 14,
) {
  if (
    !Array.isArray(values) ||
    values.length <= period
  ) {
    return null;
  }

  const recentValues =
    values.slice(
      -(period + 1),
    );

  let gains = 0;
  let losses = 0;

  for (
    let index = 1;
    index < recentValues.length;
    index += 1
  ) {
    const difference =
      recentValues[index] -
      recentValues[index - 1];

    if (difference > 0) {
      gains += difference;
    } else {
      losses += Math.abs(
        difference,
      );
    }
  }

  const averageGain =
    gains / period;

  const averageLoss =
    losses / period;

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength =
    averageGain /
    averageLoss;

  return (
    100 -
    100 /
      (1 + relativeStrength)
  );
}

export function calculateMACD(
  values = [],
) {
  if (
    !Array.isArray(values) ||
    values.length < 26
  ) {
    return {
      macd: null,
      signal: null,
      histogram: null,
    };
  }

  const macdSeries = [];

  for (
    let index = 26;
    index <= values.length;
    index += 1
  ) {
    const selectedValues =
      values.slice(0, index);

    const ema12 =
      calculateEMA(
        selectedValues,
        12,
      );

    const ema26 =
      calculateEMA(
        selectedValues,
        26,
      );

    if (
      ema12 !== null &&
      ema26 !== null
    ) {
      macdSeries.push(
        ema12 - ema26,
      );
    }
  }

  const macd =
    macdSeries.length
      ? macdSeries[
          macdSeries.length - 1
        ]
      : null;

  const signal =
    macdSeries.length >= 9
      ? calculateEMA(
          macdSeries,
          9,
        )
      : null;

  return {
    macd,
    signal,

    histogram:
      macd !== null &&
      signal !== null
        ? macd - signal
        : null,
  };
}

export function calculateSupportResistance(
  chart = [],
  period = 20,
) {
  if (
    !Array.isArray(chart) ||
    chart.length === 0
  ) {
    return {
      support: null,
      resistance: null,
    };
  }

  const recentChart =
    chart.slice(-period);

  const lows =
    recentChart
      .map((item) =>
        toNumber(
          item?.low ??
            item?.close,
        ),
      )
      .filter(
        (value) =>
          value !== null,
      );

  const highs =
    recentChart
      .map((item) =>
        toNumber(
          item?.high ??
            item?.close,
        ),
      )
      .filter(
        (value) =>
          value !== null,
      );

  return {
    support:
      lows.length > 0
        ? Math.min(...lows)
        : null,

    resistance:
      highs.length > 0
        ? Math.max(...highs)
        : null,
  };
}

function getTrend({
  price,
  sma20,
  sma50,
}) {
  if (
    price === null ||
    sma20 === null
  ) {
    return "Unavailable";
  }

  if (
    sma50 !== null &&
    price > sma20 &&
    sma20 > sma50
  ) {
    return "Bullish";
  }

  if (
    sma50 !== null &&
    price < sma20 &&
    sma20 < sma50
  ) {
    return "Bearish";
  }

  return "Sideways";
}

function getRsiLabel(rsi) {
  if (rsi === null) {
    return "Unavailable";
  }

  if (rsi >= 70) {
    return "Overbought";
  }

  if (rsi <= 30) {
    return "Oversold";
  }

  if (rsi >= 55) {
    return "Positive";
  }

  if (rsi <= 45) {
    return "Weak";
  }

  return "Neutral";
}

function getMacdLabel({
  macd,
  signal,
  histogram,
}) {
  if (
    macd === null ||
    signal === null
  ) {
    return "Unavailable";
  }

  if (
    macd > signal &&
    histogram > 0
  ) {
    return "Bullish";
  }

  if (
    macd < signal &&
    histogram < 0
  ) {
    return "Bearish";
  }

  return "Neutral";
}

function calculateVolumeTrend(
  volumes = [],
) {
  if (volumes.length < 20) {
    return {
      currentVolume: null,
      averageVolume: null,
      label: "Unavailable",
    };
  }

  const currentVolume =
    volumes[
      volumes.length - 1
    ];

  const averageVolume =
    calculateSMA(
      volumes,
      20,
    );

  let label = "Normal";

  if (
    averageVolume &&
    currentVolume >
      averageVolume * 1.5
  ) {
    label =
      "High volume";
  } else if (
    averageVolume &&
    currentVolume <
      averageVolume * 0.7
  ) {
    label =
      "Low volume";
  }

  return {
    currentVolume,
    averageVolume,
    label,
  };
}

function calculateTechnicalScore({
  price,
  sma20,
  sma50,
  rsi,
  macd,
  signal,
  histogram,
}) {
  let score = 50;

  if (
    price !== null &&
    sma20 !== null
  ) {
    score +=
      price > sma20
        ? 10
        : -10;
  }

  if (
    sma20 !== null &&
    sma50 !== null
  ) {
    score +=
      sma20 > sma50
        ? 15
        : -15;
  }

  if (rsi !== null) {
    if (
      rsi >= 50 &&
      rsi <= 70
    ) {
      score += 10;
    } else if (
      rsi >= 30 &&
      rsi < 50
    ) {
      score -= 5;
    } else if (
      rsi > 70
    ) {
      score -= 5;
    } else if (
      rsi < 30
    ) {
      score -= 10;
    }
  }

  if (
    macd !== null &&
    signal !== null
  ) {
    score +=
      macd > signal
        ? 15
        : -15;
  }

  if (
    histogram !== null
  ) {
    score +=
      histogram > 0
        ? 5
        : -5;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(score),
    ),
  );
}

export function analyzeTechnicals(
  chart = [],
) {
  const closingPrices =
    getClosingPrices(chart);

  const volumes =
    getVolumes(chart);

  const price =
    closingPrices.length
      ? closingPrices[
          closingPrices.length - 1
        ]
      : null;

  const sma20 =
    calculateSMA(
      closingPrices,
      20,
    );

  const sma50 =
    calculateSMA(
      closingPrices,
      50,
    );

  const rsi =
    calculateRSI(
      closingPrices,
      14,
    );

  const macdResult =
    calculateMACD(
      closingPrices,
    );

  const levels =
    calculateSupportResistance(
      chart,
      20,
    );

  const volume =
    calculateVolumeTrend(
      volumes,
    );

  const trend =
    getTrend({
      price,
      sma20,
      sma50,
    });

  const rsiLabel =
    getRsiLabel(rsi);

  const macdLabel =
    getMacdLabel(
      macdResult,
    );

  const technicalScore =
    calculateTechnicalScore({
      price,
      sma20,
      sma50,
      rsi,
      ...macdResult,
    });

  return {
    price,
    sma20,
    sma50,
    rsi,
    rsiLabel,
    trend,

    macd:
      macdResult.macd,

    signal:
      macdResult.signal,

    histogram:
      macdResult.histogram,

    macdLabel,

    support:
      levels.support,

    resistance:
      levels.resistance,

    currentVolume:
      volume.currentVolume,

    averageVolume:
      volume.averageVolume,

    volumeLabel:
      volume.label,

    technicalScore,
  };
}