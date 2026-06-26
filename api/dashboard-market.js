import yahooFinance from "./_lib/yahooFinance.js";

/*
 * Indexes displayed at the top of the dashboard.
 */
const INDEX_CONFIG = [
  {
    symbol: "NIFTY 50",
    ticker: "^NSEI",
  },
  {
    symbol: "SENSEX",
    ticker: "^BSESN",
  },
  {
    symbol: "BANK NIFTY",
    ticker: "^NSEBANK",
  },
  {
    symbol: "NIFTY IT",
    ticker: "^CNXIT",
  },
  {
    symbol: "INDIA VIX",
    ticker: "^INDIAVIX",
  },
];

/*
 * Sector indexes displayed in the heatmap.
 */
const SECTOR_CONFIG = [
  {
    name: "Banking",
    shortName: "Banking",
    symbol: "^NSEBANK",
  },
  {
    name: "Information Technology",
    shortName: "IT",
    symbol: "^CNXIT",
  },
  {
    name: "Energy",
    shortName: "Energy",
    symbol: "^CNXENERGY",
  },
  {
    name: "Automobile",
    shortName: "Auto",
    symbol: "^CNXAUTO",
  },
  {
    name: "Pharmaceuticals",
    shortName: "Pharma",
    symbol: "^CNXPHARMA",
  },
  {
    name: "FMCG",
    shortName: "FMCG",
    symbol: "^CNXFMCG",
  },
  {
    name: "Realty",
    shortName: "Realty",
    symbol: "^CNXREALTY",
  },
  {
    name: "Metal",
    shortName: "Metal",
    symbol: "^CNXMETAL",
  },
  {
    name: "Infrastructure",
    shortName: "Infra",
    symbol: "^CNXINFRA",
  },
  {
    name: "Consumer Durables",
    shortName: "Consumer",
    symbol: "^CNXCONSUM",
  },
  {
    name: "PSU Bank",
    shortName: "PSU Bank",
    symbol: "^CNXPSUBANK",
  },
  {
    name: "Media",
    shortName: "Media",
    symbol: "^CNXMEDIA",
  },
];

/*
 * Module-level cache.
 *
 * Vercel may reuse the same function instance for multiple
 * requests. This prevents unnecessary Yahoo Finance requests
 * when the dashboard is refreshed repeatedly.
 */
let cachedResponse = null;
let cachedAt = 0;

const CACHE_DURATION_MS = 60 * 1000;

function safeNumber(value, fallback = null) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getQuoteMap(quotes) {
  const quoteMap = new Map();

  if (!Array.isArray(quotes)) {
    return quoteMap;
  }

  quotes.forEach((quote) => {
    if (quote?.symbol) {
      quoteMap.set(
        String(quote.symbol).toUpperCase(),
        quote,
      );
    }
  });

  return quoteMap;
}

function getMarketStatus(quote) {
  const marketState = String(
    quote?.marketState || "",
  ).toUpperCase();

  const isOpen =
    marketState === "REGULAR" ||
    marketState === "PRE" ||
    marketState === "PREPRE";

  let label = "Markets Closed";

  if (marketState === "REGULAR") {
    label = "Markets Open";
  } else if (
    marketState === "PRE" ||
    marketState === "PREPRE"
  ) {
    label = "Pre-Market";
  } else if (
    marketState === "POST" ||
    marketState === "POSTPOST"
  ) {
    label = "Post-Market";
  }

  return {
    isOpen,
    label,
    marketState:
      marketState || "UNKNOWN",
    lastUpdated: new Intl.DateTimeFormat(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    ).format(new Date()),
  };
}

function createIndexResult(
  config,
  quote,
  trend,
) {
  return {
    symbol: config.symbol,
    ticker: config.ticker,

    value: safeNumber(
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

    marketState:
      quote?.marketState || "UNKNOWN",

    currency:
      quote?.currency || "INR",

    trend: Array.isArray(trend)
      ? trend
      : [],
  };
}

function createSectorResult(
  config,
  quote,
) {
  return {
    name: config.name,
    shortName: config.shortName,
    symbol: config.symbol,

    value: safeNumber(
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

    marketState:
      quote?.marketState || "UNKNOWN",
  };
}

async function getIndexTrend(symbol) {
  try {
    const fiveDaysAgo = new Date(
      Date.now() -
        5 * 24 * 60 * 60 * 1000,
    );

    const chartResult =
      await yahooFinance.chart(
        symbol,
        {
          period1: fiveDaysAgo,
          interval: "30m",
        },
      );

    const quotes = Array.isArray(
      chartResult?.quotes,
    )
      ? chartResult.quotes
      : [];

    return quotes
      .map((item) =>
        safeNumber(item?.close),
      )
      .filter(
        (value) =>
          value !== null,
      )
      .slice(-40);
  } catch (error) {
    console.error(
      `Unable to fetch chart for ${symbol}:`,
      error,
    );

    return [];
  }
}

async function loadDashboardMarketData() {
  const allSymbols = [
    ...new Set([
      ...INDEX_CONFIG.map(
        (item) => item.ticker,
      ),

      ...SECTOR_CONFIG.map(
        (item) => item.symbol,
      ),
    ]),
  ];

  /*
   * Fetch all current prices in one Yahoo Finance request.
   */
  const quotes =
    await yahooFinance.quote(
      allSymbols,
    );

  const quoteMap =
    getQuoteMap(quotes);

  /*
   * Only the five main index cards need mini-chart data.
   */
  const trendResults =
    await Promise.all(
      INDEX_CONFIG.map(
        (index) =>
          getIndexTrend(index.ticker),
      ),
    );

  const unavailableSymbols = [];

  const indices =
    INDEX_CONFIG.map(
      (config, index) => {
        const quote =
          quoteMap.get(
            config.ticker.toUpperCase(),
          );

        if (!quote) {
          unavailableSymbols.push(
            config.ticker,
          );

          return null;
        }

        return createIndexResult(
          config,
          quote,
          trendResults[index],
        );
      },
    ).filter(Boolean);

  const sectors =
    SECTOR_CONFIG.map(
      (config) => {
        const quote =
          quoteMap.get(
            config.symbol.toUpperCase(),
          );

        if (!quote) {
          unavailableSymbols.push(
            config.symbol,
          );

          return null;
        }

        return createSectorResult(
          config,
          quote,
        );
      },
    ).filter(Boolean);

  const primaryMarketQuote =
    quoteMap.get("^NSEI") ||
    quoteMap.get("^BSESN") ||
    quotes?.[0];

  return {
    success: true,

    source:
      "Yahoo Finance via yahoo-finance2",

    fetchedAt:
      new Date().toISOString(),

    marketStatus:
      getMarketStatus(
        primaryMarketQuote,
      ),

    indices,
    sectors,

    unavailableSymbols: [
      ...new Set(
        unavailableSymbols,
      ),
    ],
  };
}

export default async function handler(
  request,
  response,
) {
  if (request.method !== "GET") {
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
    const now = Date.now();

    const forceRefresh =
      String(
        request.query?.refresh || "",
      ) === "1";

    if (
      !forceRefresh &&
      cachedResponse &&
      now - cachedAt <
        CACHE_DURATION_MS
    ) {
      response.setHeader(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=60",
      );

      return response
        .status(200)
        .json({
          ...cachedResponse,
          cached: true,
        });
    }

    const dashboardData =
      await loadDashboardMarketData();

    cachedResponse =
      dashboardData;

    cachedAt = now;

    response.setHeader(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=60",
    );

    return response
      .status(200)
      .json({
        ...dashboardData,
        cached: false,
      });
  } catch (error) {
    console.error(
      "Dashboard market API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve dashboard market data.",

        source:
          "Yahoo Finance via yahoo-finance2",

        fetchedAt:
          new Date().toISOString(),
      });
  }
}