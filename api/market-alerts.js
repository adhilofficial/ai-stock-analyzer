import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const STOCK_SYMBOLS = [
  "RELIANCE.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "SBIN.NS",
  "AXISBANK.NS",
  "KOTAKBANK.NS",
  "INDUSINDBK.NS",

  "INFY.NS",
  "TCS.NS",
  "HCLTECH.NS",
  "WIPRO.NS",
  "TECHM.NS",

  "BHARTIARTL.NS",
  "ITC.NS",
  "HINDUNILVR.NS",
  "ASIANPAINT.NS",
  "NESTLEIND.NS",
  "TITAN.NS",

  "MARUTI.NS",
  "M&M.NS",
  "BAJAJ-AUTO.NS",
  "EICHERMOT.NS",
  "HEROMOTOCO.NS",

  "SUNPHARMA.NS",
  "DRREDDY.NS",
  "CIPLA.NS",
  "DIVISLAB.NS",

  "LT.NS",
  "ADANIPORTS.NS",
  "POWERGRID.NS",
  "NTPC.NS",
  "ONGC.NS",
  "COALINDIA.NS",
  "BPCL.NS",

  "BAJFINANCE.NS",
  "BAJAJFINSV.NS",
  "HDFCLIFE.NS",
  "SBILIFE.NS",

  "TATASTEEL.NS",
  "JSWSTEEL.NS",
  "HINDALCO.NS",
  "ULTRACEMCO.NS",
  "GRASIM.NS",

  "ADANIENT.NS",
  "APOLLOHOSP.NS",
  "BEL.NS",
  "TRENT.NS",
];

const MARKET_SYMBOLS = [
  "^NSEI",
  "^INDIAVIX",
];

const SECTOR_SYMBOLS = [
  {
    symbol: "^NSEBANK",
    name: "NIFTY Bank",
  },
  {
    symbol: "^CNXIT",
    name: "NIFTY IT",
  },
  {
    symbol: "^CNXAUTO",
    name: "NIFTY Auto",
  },
  {
    symbol: "^CNXPHARMA",
    name: "NIFTY Pharma",
  },
  {
    symbol: "^CNXFMCG",
    name: "NIFTY FMCG",
  },
  {
    symbol: "^CNXMETAL",
    name: "NIFTY Metal",
  },
  {
    symbol: "^CNXENERGY",
    name: "NIFTY Energy",
  },
  {
    symbol: "^CNXREALTY",
    name: "NIFTY Realty",
  },
];

const CACHE_DURATION_MS =
  60 * 1000;

let cachedData = null;
let cachedAt = 0;

function safeNumber(
  value,
  fallback = null,
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

function formatPrice(value) {
  const number = safeNumber(
    value,
  );

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(number);
}

function formatTime(value) {
  const date =
    value instanceof Date
      ? value
      : value
        ? new Date(value)
        : new Date();

  if (
    Number.isNaN(date.getTime())
  ) {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        timeZone:
          "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    ).format(new Date());
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  ).format(date);
}

function normalizeQuote(quote) {
  return {
    symbol: String(
      quote?.symbol || "",
    ).toUpperCase(),

    name:
      quote?.shortName ||
      quote?.longName ||
      quote?.displayName ||
      quote?.symbol ||
      "Unknown security",

    price: safeNumber(
      quote?.regularMarketPrice,
    ),

    change: safeNumber(
      quote?.regularMarketChange,
      0,
    ),

    changePercent: safeNumber(
      quote?.regularMarketChangePercent,
      0,
    ),

    previousClose: safeNumber(
      quote?.regularMarketPreviousClose,
    ),

    dayHigh: safeNumber(
      quote?.regularMarketDayHigh,
    ),

    dayLow: safeNumber(
      quote?.regularMarketDayLow,
    ),

    volume: safeNumber(
      quote?.regularMarketVolume,
      0,
    ),

    averageVolume: safeNumber(
      quote?.averageDailyVolume3Month,
      0,
    ),

    fiftyDayAverage: safeNumber(
      quote?.fiftyDayAverage,
    ),

    fiftyTwoWeekHigh: safeNumber(
      quote?.fiftyTwoWeekHigh,
    ),

    fiftyTwoWeekLow: safeNumber(
      quote?.fiftyTwoWeekLow,
    ),

    marketState:
      quote?.marketState ||
      "UNKNOWN",

    marketTime:
      quote?.regularMarketTime ||
      new Date(),

    currency:
      quote?.currency ||
      "INR",
  };
}

function isUsableQuote(quote) {
  return (
    quote &&
    quote.symbol &&
    Number.isFinite(
      Number(quote.price),
    )
  );
}

function createAlert({
  id,
  type,
  title,
  message,
  symbol = "",
  time,
  severity = "information",
  priority = 0,
}) {
  return {
    id,
    type,
    title,
    message,
    symbol,
    time: formatTime(time),
    severity,
    priority,
  };
}

function createVolumeAlerts(
  stockQuotes,
) {
  return stockQuotes
    .filter((quote) => {
      const volume =
        safeNumber(
          quote.volume,
          0,
        );

      const averageVolume =
        safeNumber(
          quote.averageVolume,
          0,
        );

      if (
        volume <= 0 ||
        averageVolume <= 0
      ) {
        return false;
      }

      return (
        volume /
          averageVolume >=
        1.5
      );
    })
    .map((quote) => {
      const ratio =
        quote.volume /
        quote.averageVolume;

      return createAlert({
        id:
          `volume-${quote.symbol}`,

        type: "volume",

        title:
          "Volume Spike",

        message:
          `${quote.name} volume is ` +
          `${ratio.toFixed(1)}× its ` +
          "three-month daily average.",

        symbol:
          quote.symbol,

        time:
          quote.marketTime,

        severity:
          ratio >= 2.5
            ? "danger"
            : "warning",

        priority:
          70 +
          Math.min(
            ratio * 8,
            25,
          ),
      });
    });
}

function createPriceMoveAlerts(
  stockQuotes,
) {
  return stockQuotes
    .filter(
      (quote) =>
        Math.abs(
          safeNumber(
            quote.changePercent,
            0,
          ),
        ) >= 2.5,
    )
    .map((quote) => {
      const changePercent =
        safeNumber(
          quote.changePercent,
          0,
        );

      const direction =
        changePercent >= 0
          ? "up"
          : "down";

      return createAlert({
        id:
          `price-${quote.symbol}`,

        type: "momentum",

        title:
          changePercent >= 0
            ? "Momentum Improvement"
            : "Price Weakness",

        message:
          `${quote.name} is ${direction} ` +
          `${Math.abs(
            changePercent,
          ).toFixed(2)}% today at ` +
          `${formatPrice(
            quote.price,
          )}.`,

        symbol:
          quote.symbol,

        time:
          quote.marketTime,

        severity:
          Math.abs(
            changePercent,
          ) >= 4
            ? "danger"
            : "information",

        priority:
          65 +
          Math.min(
            Math.abs(
              changePercent,
            ) * 5,
            25,
          ),
      });
    });
}

function createWeek52Alerts(
  stockQuotes,
) {
  const alerts = [];

  for (const quote of stockQuotes) {
    const price =
      safeNumber(
        quote.price,
      );

    const weekHigh =
      safeNumber(
        quote.fiftyTwoWeekHigh,
      );

    const weekLow =
      safeNumber(
        quote.fiftyTwoWeekLow,
      );

    if (
      price === null ||
      price <= 0
    ) {
      continue;
    }

    if (
      weekHigh !== null &&
      weekHigh > 0
    ) {
      const distanceFromHigh =
        (
          (
            weekHigh -
            price
          ) /
          weekHigh
        ) *
        100;

      if (
        distanceFromHigh >= 0 &&
        distanceFromHigh <= 1
      ) {
        alerts.push(
          createAlert({
            id:
              `week-high-${quote.symbol}`,

            type:
              "52-week-high",

            title:
              "52-Week High Alert",

            message:
              `${quote.name} is trading ` +
              `${distanceFromHigh.toFixed(
                2,
              )}% below its 52-week high.`,

            symbol:
              quote.symbol,

            time:
              quote.marketTime,

            severity:
              "information",

            priority:
              78 -
              distanceFromHigh,
          }),
        );
      }
    }

    if (
      weekLow !== null &&
      weekLow > 0
    ) {
      const distanceFromLow =
        (
          (
            price -
            weekLow
          ) /
          weekLow
        ) *
        100;

      if (
        distanceFromLow >= 0 &&
        distanceFromLow <= 1
      ) {
        alerts.push(
          createAlert({
            id:
              `week-low-${quote.symbol}`,

            type:
              "52-week-low",

            title:
              "52-Week Low Alert",

            message:
              `${quote.name} is trading ` +
              `${distanceFromLow.toFixed(
                2,
              )}% above its 52-week low.`,

            symbol:
              quote.symbol,

            time:
              quote.marketTime,

            severity:
              "danger",

            priority:
              82 -
              distanceFromLow,
          }),
        );
      }
    }
  }

  return alerts;
}

function createSectorAlerts(
  sectorQuotes,
  sectorNameMap,
) {
  return sectorQuotes
    .filter(
      (quote) =>
        Math.abs(
          safeNumber(
            quote.changePercent,
            0,
          ),
        ) >= 1.25,
    )
    .map((quote) => {
      const changePercent =
        safeNumber(
          quote.changePercent,
          0,
        );

      const sectorName =
        sectorNameMap.get(
          quote.symbol,
        ) ||
        quote.name;

      const direction =
        changePercent >= 0
          ? "up"
          : "down";

      return createAlert({
        id:
          `sector-${quote.symbol}`,

        type:
          "sector-momentum",

        title:
          "Sector Momentum",

        message:
          `${sectorName} is ${direction} ` +
          `${Math.abs(
            changePercent,
          ).toFixed(2)}% today.`,

        symbol:
          quote.symbol,

        time:
          quote.marketTime,

        severity:
          Math.abs(
            changePercent,
          ) >= 2
            ? "warning"
            : "information",

        priority:
          60 +
          Math.min(
            Math.abs(
              changePercent,
            ) * 7,
            20,
          ),
      });
    });
}

function createVixAlerts(
  marketQuotes,
) {
  const indiaVix =
    marketQuotes.find(
      (quote) =>
        quote.symbol ===
        "^INDIAVIX",
    );

  if (!indiaVix) {
    return [];
  }

  const changePercent =
    safeNumber(
      indiaVix.changePercent,
      0,
    );

  if (
    Math.abs(changePercent) < 2
  ) {
    return [];
  }

  const direction =
    changePercent >= 0
      ? "increased"
      : "declined";

  return [
    createAlert({
      id: "india-vix",

      type: "volatility",

      title:
        "Volatility Alert",

      message:
        `India VIX has ${direction} ` +
        `${Math.abs(
          changePercent,
        ).toFixed(2)}% to ` +
        `${safeNumber(
          indiaVix.price,
          0,
        ).toFixed(2)}.`,

      symbol:
        indiaVix.symbol,

      time:
        indiaVix.marketTime,

      severity:
        changePercent >= 0
          ? "warning"
          : "information",

      priority:
        75 +
        Math.min(
          Math.abs(
            changePercent,
          ) * 3,
          20,
        ),
    }),
  ];
}

function createNiftyAlert(
  marketQuotes,
) {
  const nifty =
    marketQuotes.find(
      (quote) =>
        quote.symbol ===
        "^NSEI",
    );

  if (!nifty) {
    return [];
  }

  const changePercent =
    safeNumber(
      nifty.changePercent,
      0,
    );

  if (
    Math.abs(changePercent) <
    0.75
  ) {
    return [];
  }

  const direction =
    changePercent >= 0
      ? "gained"
      : "declined";

  return [
    createAlert({
      id:
        "nifty-momentum",

      type:
        "market-momentum",

      title:
        "Market Momentum",

      message:
        `NIFTY 50 has ${direction} ` +
        `${Math.abs(
          changePercent,
        ).toFixed(2)}% today.`,

      symbol:
        nifty.symbol,

      time:
        nifty.marketTime,

      severity:
        Math.abs(
          changePercent,
        ) >= 1.5
          ? "warning"
          : "information",

      priority:
        68 +
        Math.min(
          Math.abs(
            changePercent,
          ) * 8,
          18,
        ),
    }),
  ];
}

function createBreadthAlert(
  stockQuotes,
) {
  let advancing = 0;
  let declining = 0;
  let unchanged = 0;

  for (const quote of stockQuotes) {
    const changePercent =
      safeNumber(
        quote.changePercent,
        0,
      );

    if (
      Math.abs(
        changePercent,
      ) < 0.005
    ) {
      unchanged += 1;
    } else if (
      changePercent > 0
    ) {
      advancing += 1;
    } else {
      declining += 1;
    }
  }

  const total =
    advancing +
    declining +
    unchanged;

  if (total === 0) {
    return [];
  }

  const advancingPercent =
    advancing /
    total *
    100;

  if (
    advancingPercent >= 70
  ) {
    return [
      createAlert({
        id:
          "breadth-positive",

        type:
          "market-breadth",

        title:
          "Broad Market Strength",

        message:
          `${advancing} of ${total} tracked ` +
          `stocks are advancing ` +
          `(${advancingPercent.toFixed(
            0,
          )}%).`,

        severity:
          "information",

        priority:
          72,
      }),
    ];
  }

  if (
    advancingPercent <= 30
  ) {
    return [
      createAlert({
        id:
          "breadth-negative",

        type:
          "market-breadth",

        title:
          "Weak Market Breadth",

        message:
          `${declining} of ${total} tracked ` +
          "stocks are declining.",

        severity:
          "warning",

        priority:
          76,
      }),
    ];
  }

  return [];
}

function selectAlerts(
  candidates,
  limit = 6,
) {
  const sorted =
    [...candidates].sort(
      (first, second) =>
        second.priority -
        first.priority,
    );

  const selected = [];
  const usedSymbols =
    new Set();

  for (const alert of sorted) {
    const symbol =
      String(
        alert.symbol || "",
      );

    /*
     * Avoid showing several alerts
     * for the same company.
     */
    if (
      symbol &&
      usedSymbols.has(symbol)
    ) {
      continue;
    }

    selected.push(alert);

    if (symbol) {
      usedSymbols.add(symbol);
    }

    if (
      selected.length >= limit
    ) {
      break;
    }
  }

  return selected.map(
    ({
      priority,
      ...alert
    }) => alert,
  );
}

async function loadMarketAlerts() {
  const allSymbols = [
    ...new Set([
      ...STOCK_SYMBOLS,
      ...MARKET_SYMBOLS,
      ...SECTOR_SYMBOLS.map(
        (sector) =>
          sector.symbol,
      ),
    ]),
  ];

  const quoteResult =
    await yahooFinance.quote(
      allSymbols,
    );

  const quoteArray =
    Array.isArray(quoteResult)
      ? quoteResult
      : quoteResult
        ? [quoteResult]
        : [];

  const quotes =
    quoteArray
      .filter(
        (quote) =>
          quote?.symbol,
      )
      .map(
        normalizeQuote,
      )
      .filter(
        isUsableQuote,
      );

  const quoteMap =
    new Map(
      quotes.map((quote) => [
        quote.symbol,
        quote,
      ]),
    );

  const stockQuotes =
    STOCK_SYMBOLS
      .map((symbol) =>
        quoteMap.get(symbol),
      )
      .filter(Boolean);

  const marketQuotes =
    MARKET_SYMBOLS
      .map((symbol) =>
        quoteMap.get(symbol),
      )
      .filter(Boolean);

  const sectorNameMap =
    new Map(
      SECTOR_SYMBOLS.map(
        (sector) => [
          sector.symbol,
          sector.name,
        ],
      ),
    );

  const sectorQuotes =
    SECTOR_SYMBOLS
      .map((sector) =>
        quoteMap.get(
          sector.symbol,
        ),
      )
      .filter(Boolean);

  const candidates = [
    ...createVolumeAlerts(
      stockQuotes,
    ),

    ...createPriceMoveAlerts(
      stockQuotes,
    ),

    ...createWeek52Alerts(
      stockQuotes,
    ),

    ...createSectorAlerts(
      sectorQuotes,
      sectorNameMap,
    ),

    ...createVixAlerts(
      marketQuotes,
    ),

    ...createNiftyAlert(
      marketQuotes,
    ),

    ...createBreadthAlert(
      stockQuotes,
    ),
  ];

  const alerts =
    selectAlerts(
      candidates,
      6,
    );

  const unavailableSymbols =
    allSymbols.filter(
      (symbol) =>
        !quoteMap.has(symbol),
    );

  return {
    success: true,

    source:
      "Yahoo Finance via yahoo-finance2",

    universe:
      "Selected liquid NSE stocks, indices and sectors",

    fetchedAt:
      new Date().toISOString(),

    alerts,

    alertCount:
      alerts.length,

    candidateCount:
      candidates.length,

    summary: {
      stocksTracked:
        stockQuotes.length,

      sectorsTracked:
        sectorQuotes.length,

      marketIndicatorsTracked:
        marketQuotes.length,
    },

    unavailableSymbols,
  };
}

export default async function handler(
  request,
  response,
) {
  if (
    request.method !== "GET"
  ) {
    response.setHeader(
      "Allow",
      "GET",
    );

    return response
      .status(405)
      .json({
        success: false,
        error:
          "Method not allowed. Use GET.",
      });
  }

  try {
    const forceRefresh =
      String(
        request.query
          ?.refresh || "",
      ) === "1";

    const cacheIsValid =
      cachedData &&
      Date.now() - cachedAt <
        CACHE_DURATION_MS;

    if (
      !forceRefresh &&
      cacheIsValid
    ) {
      response.setHeader(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=60",
      );

      return response
        .status(200)
        .json({
          ...cachedData,
          cached: true,
        });
    }

    const result =
      await loadMarketAlerts();

    cachedData = result;
    cachedAt = Date.now();

    response.setHeader(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=60",
    );

    return response
      .status(200)
      .json({
        ...result,
        cached: false,
      });
  } catch (error) {
    console.error(
      "Market alerts API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to generate live market alerts.",

        source:
          "Yahoo Finance via yahoo-finance2",

        fetchedAt:
          new Date().toISOString(),
      });
  }
}