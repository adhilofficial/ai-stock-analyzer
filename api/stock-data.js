import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const VALID_RANGES = new Set([
  "1d",
  "1w",
  "1m",
  "1y",
  "5y",
  "max",
]);

function daysAgo(days) {
  return new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  );
}

function getChartOptions(range = "1y") {
  const now = new Date();

  const ranges = {
    "1d": {
      period1: daysAgo(5),
      period2: now,
      interval: "5m",
    },

    "1w": {
      period1: daysAgo(10),
      period2: now,
      interval: "30m",
    },

    "1m": {
      period1: daysAgo(35),
      period2: now,
      interval: "1d",
    },

    "1y": {
      period1: daysAgo(370),
      period2: now,
      interval: "1d",
    },

    "5y": {
      period1: daysAgo(365 * 5 + 15),
      period2: now,
      interval: "1wk",
    },

    max: {
      period1: new Date("1980-01-01"),
      period2: now,
      interval: "1mo",
    },
  };

  return ranges[range] || ranges["1y"];
}

function getTradingDate(value) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getQueryValue(req, key) {
  const directValue = req.query?.[key];

  if (directValue !== undefined) {
    return directValue;
  }

  try {
    const requestUrl = new URL(
      req.url,
      "http://localhost",
    );

    return requestUrl.searchParams.get(key);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only GET requests are allowed.",
      },
    });
  }

  try {
    const symbol = String(
      getQueryValue(req, "symbol") || "",
    )
      .trim()
      .toUpperCase();

    const requestedRange = String(
      getQueryValue(req, "range") || "1y",
    ).toLowerCase();

    if (!symbol) {
      return res.status(400).json({
        error: {
          code: "SYMBOL_REQUIRED",
          message: "Stock symbol is required.",
        },
      });
    }

    if (!VALID_RANGES.has(requestedRange)) {
      return res.status(400).json({
        error: {
          code: "INVALID_RANGE",
          message:
            "Use one of these ranges: 1d, 1w, 1m, 1y, 5y or max.",
        },
      });
    }

    console.log(
      `Loading Yahoo Finance data for ${symbol}, range ${requestedRange}`,
    );

    /*
     * The quote is required.
     * If this fails, there is no usable stock result.
     */
    const quote = await yahooFinance.quote(symbol);

    if (!quote?.symbol) {
      return res.status(404).json({
        error: {
          code: "STOCK_NOT_FOUND",
          message:
            "Yahoo Finance could not find this stock symbol.",
        },
      });
    }

    /*
     * Profile and chart are optional.
     * Their failure should not hide the current quote.
     */
    const [profileResult, chartResult] =
      await Promise.allSettled([
        yahooFinance.quoteSummary(symbol, {
          modules: ["assetProfile"],
        }),

        yahooFinance.chart(
          symbol,
          getChartOptions(requestedRange),
        ),
      ]);

    const profile =
      profileResult.status === "fulfilled"
        ? profileResult.value?.assetProfile || {}
        : {};

    if (profileResult.status === "rejected") {
      console.error(
        "Yahoo profile request failed:",
        profileResult.reason,
      );
    }

    let chart = [];

    if (chartResult.status === "fulfilled") {
      const rawQuotes = Array.isArray(
        chartResult.value?.quotes,
      )
        ? chartResult.value.quotes
        : [];

      chart = rawQuotes
        .filter((item) => {
          return (
            item?.date &&
            item?.close !== null &&
            item?.close !== undefined &&
            Number.isFinite(Number(item.close))
          );
        })
        .map((item) => ({
          date: item.date,
          open: item.open ?? null,
          high: item.high ?? null,
          low: item.low ?? null,
          close: item.close ?? null,
          volume: item.volume ?? null,
        }));
    } else {
      console.error(
        "Yahoo chart request failed:",
        chartResult.reason,
      );
    }

    /*
     * For 1D, Yahoo may include multiple recent sessions.
     * Keep only the latest trading session.
     */
    if (
      requestedRange === "1d" &&
      chart.length > 0
    ) {
      const latestDate = getTradingDate(
        chart[chart.length - 1].date,
      );

      chart = chart.filter(
        (item) =>
          getTradingDate(item.date) === latestDate,
      );
    }

    /*
     * Return the stock object directly.
     *
     * Do not wrap this as:
     * { stockData: ... }
     * { data: ... }
     *
     * Analyze.jsx expects response.symbol directly.
     */
    return res.status(200).json({
      symbol: quote.symbol,

      name:
        quote.longName ||
        quote.shortName ||
        quote.symbol,

      exchange:
        quote.fullExchangeName ||
        quote.exchange ||
        null,

      currency: quote.currency || "INR",

      marketState:
        quote.marketState || null,

      price:
        quote.regularMarketPrice ?? null,

      previousClose:
        quote.regularMarketPreviousClose ?? null,

      change:
        quote.regularMarketChange ?? null,

      changePercent:
        quote.regularMarketChangePercent ?? null,

      open:
        quote.regularMarketOpen ?? null,

      dayHigh:
        quote.regularMarketDayHigh ?? null,

      dayLow:
        quote.regularMarketDayLow ?? null,

      marketCap:
        quote.marketCap ?? null,

      peRatioTTM:
        quote.trailingPE ?? null,

      forwardPE:
        quote.forwardPE ?? null,

      fiftyTwoWeekLow:
        quote.fiftyTwoWeekLow ?? null,

      fiftyTwoWeekHigh:
        quote.fiftyTwoWeekHigh ?? null,

      volume:
        quote.regularMarketVolume ??
        quote.volume ??
        null,

      averageVolume:
        quote.averageDailyVolume3Month ??
        null,

      sector:
        profile.sector || null,

      industry:
        profile.industry || null,

      businessSummary:
        profile.longBusinessSummary || null,

      website:
        profile.website || null,

      employees:
        profile.fullTimeEmployees ?? null,

      source: "Yahoo Finance",

      lastUpdated:
        quote.regularMarketTime ||
        new Date().toISOString(),

      range: requestedRange,

      chart,
    });
  } catch (error) {
    console.error(
      "Yahoo Finance stock-data function failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve stock data.";

    const isNotFound =
      message.toLowerCase().includes("not found") ||
      message.toLowerCase().includes("no fundamentals");

    return res
      .status(isNotFound ? 404 : 500)
      .json({
        error: {
          code: isNotFound
            ? "STOCK_NOT_FOUND"
            : "STOCK_DATA_FAILED",

          message: isNotFound
            ? "The requested stock symbol was not found."
            : message,
        },
      });
  }
}