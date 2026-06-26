import yahooFinance from "./_lib/yahooFinance.js";

import withRetry, {
  isRetryableError,
} from "./_lib/withRetry.js";

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
    Date.now() -
      days * 24 * 60 * 60 * 1000,
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
      period1: daysAgo(14),
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
      period1: daysAgo(
        365 * 5 + 15,
      ),
      period2: now,
      interval: "1wk",
    },

    max: {
      period1: new Date(
        "1980-01-01T00:00:00.000Z",
      ),
      period2: now,
      interval: "1mo",
    },
  };

  return ranges[range] || ranges["1y"];
}

function getTradingDate(value) {
  try {
    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).format(date);
  } catch {
    return "";
  }
}

function getQueryValue(
  request,
  key,
) {
  const directValue =
    request.query?.[key];

  if (
    Array.isArray(directValue)
  ) {
    return directValue[0];
  }

  if (
    directValue !== undefined &&
    directValue !== null
  ) {
    return directValue;
  }

  try {
    const requestUrl = new URL(
      request.url,
      "http://localhost",
    );

    return requestUrl.searchParams.get(
      key,
    );
  } catch {
    return null;
  }
}

function unwrapValue(value) {
  if (
    value &&
    typeof value === "object" &&
    "raw" in value
  ) {
    return value.raw;
  }

  return value;
}

function numberOrNull(...values) {
  for (const value of values) {
    const unwrappedValue =
      unwrapValue(value);

    /*
     * Important:
     * Number(null) returns 0.
     * Null and empty values must be skipped.
     */
    if (
      unwrappedValue === null ||
      unwrappedValue === undefined ||
      unwrappedValue === ""
    ) {
      continue;
    }

    const number = Number(
      unwrappedValue,
    );

    if (
      Number.isFinite(number)
    ) {
      return number;
    }
  }

  return null;
}

function normalizeDate(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

async function fetchQuote(symbol) {
  return withRetry(
    () =>
      yahooFinance.quote(
        symbol,
      ),
    {
      attempts: 3,
      delayMs: 700,
      label: `Quote ${symbol}`,
    },
  );
}

async function fetchSummary(symbol) {
  return withRetry(
    () =>
      yahooFinance.quoteSummary(
        symbol,
        {
          modules: [
            "assetProfile",
            "financialData",
            "defaultKeyStatistics",
            "summaryDetail",
          ],
        },
      ),
    {
      attempts: 2,
      delayMs: 800,
      label:
        `Fundamentals ${symbol}`,
    },
  );
}

async function fetchChart(
  symbol,
  range,
) {
  return withRetry(
    () =>
      yahooFinance.chart(
        symbol,
        getChartOptions(range),
      ),
    {
      attempts: 2,
      delayMs: 800,
      label:
        `Chart ${symbol}`,
    },
  );
}

export default async function handler(
  req,
  res,
) {
  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      "GET",
    );

    return res.status(405).json({
      error: {
        code:
          "METHOD_NOT_ALLOWED",
        message:
          "Only GET requests are allowed.",
      },
    });
  }

  try {
    const symbol = String(
      getQueryValue(
        req,
        "symbol",
      ) || "",
    )
      .trim()
      .toUpperCase();

    const requestedRange =
      String(
        getQueryValue(
          req,
          "range",
        ) || "1y",
      ).toLowerCase();

    if (!symbol) {
      return res.status(400).json({
        error: {
          code:
            "SYMBOL_REQUIRED",
          message:
            "Stock symbol is required.",
        },
      });
    }

    if (
      !VALID_RANGES.has(
        requestedRange,
      )
    ) {
      return res.status(400).json({
        error: {
          code:
            "INVALID_RANGE",
          message:
            "Use one of these ranges: 1d, 1w, 1m, 1y, 5y or max.",
        },
      });
    }

    console.log(
      `Loading Yahoo Finance data for ${symbol}, range ${requestedRange}`,
    );

    /*
     * Quote is mandatory.
     */
    const quote =
      await fetchQuote(symbol);

    if (!quote?.symbol) {
      return res.status(404).json({
        error: {
          code:
            "STOCK_NOT_FOUND",
          message:
            "Yahoo Finance could not find this stock symbol.",
        },
      });
    }

    /*
     * Fundamentals and chart are optional.
     * A failure in either request must not
     * remove the current quote.
     */
    const [
      summaryResult,
      chartResult,
    ] =
      await Promise.allSettled([
        fetchSummary(symbol),
        fetchChart(
          symbol,
          requestedRange,
        ),
      ]);

    const summary =
      summaryResult.status ===
      "fulfilled"
        ? summaryResult.value || {}
        : {};

    const profile =
      summary.assetProfile || {};

    const financialData =
      summary.financialData || {};

    const keyStatistics =
      summary
        .defaultKeyStatistics ||
      {};

    const summaryDetail =
      summary.summaryDetail || {};

    if (
      summaryResult.status ===
      "rejected"
    ) {
      console.warn(
        "Yahoo fundamentals request failed:",
        summaryResult.reason,
      );
    }

    let chart = [];

    if (
      chartResult.status ===
      "fulfilled"
    ) {
      const returnedChart =
        chartResult.value;

      const rawQuotes =
        Array.isArray(
          returnedChart,
        )
          ? returnedChart
          : Array.isArray(
                returnedChart?.quotes,
              )
            ? returnedChart.quotes
            : [];

      chart = rawQuotes
        .filter((item) => {
          return (
            item?.date &&
            item?.close !== null &&
            item?.close !==
              undefined &&
            Number.isFinite(
              Number(item.close),
            )
          );
        })
        .map((item) => ({
          date:
            normalizeDate(
              item.date,
            ),

          open:
            numberOrNull(
              item.open,
            ),

          high:
            numberOrNull(
              item.high,
            ),

          low:
            numberOrNull(
              item.low,
            ),

          close:
            numberOrNull(
              item.close,
            ),

          volume:
            numberOrNull(
              item.volume,
            ),
        }));
    } else {
      console.warn(
        "Yahoo chart request failed:",
        chartResult.reason,
      );
    }

    /*
     * Yahoo can include multiple recent
     * sessions in the 1D result.
     */
    if (
      requestedRange === "1d" &&
      chart.length > 0
    ) {
      const latestDate =
        getTradingDate(
          chart[
            chart.length - 1
          ].date,
        );

      chart = chart.filter(
        (item) =>
          getTradingDate(
            item.date,
          ) === latestDate,
      );
    }

    const responseData = {
      success: true,

      symbol:
        quote.symbol,

      name:
        quote.longName ||
        quote.shortName ||
        quote.displayName ||
        quote.symbol,

      company:
        quote.longName ||
        quote.shortName ||
        quote.displayName ||
        quote.symbol,

      exchange:
        quote.fullExchangeName ||
        quote.exchange ||
        null,

      currency:
        quote.currency ||
        "INR",

      marketState:
        quote.marketState ||
        null,

      price:
        numberOrNull(
          quote.regularMarketPrice,
        ),

      previousClose:
        numberOrNull(
          quote
            .regularMarketPreviousClose,
        ),

      change:
        numberOrNull(
          quote
            .regularMarketChange,
        ),

      changeAbs:
        numberOrNull(
          quote
            .regularMarketChange,
        ),

      changePercent:
        numberOrNull(
          quote
            .regularMarketChangePercent,
        ),

      open:
        numberOrNull(
          quote
            .regularMarketOpen,
        ),

      dayHigh:
        numberOrNull(
          quote
            .regularMarketDayHigh,
        ),

      dayLow:
        numberOrNull(
          quote
            .regularMarketDayLow,
        ),

      marketCap:
        numberOrNull(
          quote.marketCap,
        ),

      peRatioTTM:
        numberOrNull(
          quote.trailingPE,
          summaryDetail.trailingPE,
        ),

      peRatio:
        numberOrNull(
          quote.trailingPE,
          summaryDetail.trailingPE,
        ),

      forwardPE:
        numberOrNull(
          quote.forwardPE,
          financialData.forwardPE,
          summaryDetail.forwardPE,
        ),

      fiftyTwoWeekLow:
        numberOrNull(
          quote.fiftyTwoWeekLow,
          summaryDetail
            .fiftyTwoWeekLow,
        ),

      fiftyTwoWeekHigh:
        numberOrNull(
          quote.fiftyTwoWeekHigh,
          summaryDetail
            .fiftyTwoWeekHigh,
        ),

      week52Low:
        numberOrNull(
          quote.fiftyTwoWeekLow,
          summaryDetail
            .fiftyTwoWeekLow,
        ),

      week52High:
        numberOrNull(
          quote.fiftyTwoWeekHigh,
          summaryDetail
            .fiftyTwoWeekHigh,
        ),

      volume:
        numberOrNull(
          quote
            .regularMarketVolume,
          quote.volume,
        ),

      averageVolume:
        numberOrNull(
          quote
            .averageDailyVolume3Month,
          summaryDetail
            .averageVolume,
        ),

      sector:
        profile.sector ||
        null,

      industry:
        profile.industry ||
        null,

      businessSummary:
        profile
          .longBusinessSummary ||
        null,

      website:
        profile.website ||
        null,

      employees:
        numberOrNull(
          profile
            .fullTimeEmployees,
        ),

      enterpriseValue:
        numberOrNull(
          keyStatistics
            .enterpriseValue,
          financialData
            .enterpriseValue,
        ),

      priceToBook:
        numberOrNull(
          keyStatistics
            .priceToBook,
        ),

      pegRatio:
        numberOrNull(
          keyStatistics.pegRatio,
          keyStatistics
            .trailingPegRatio,
        ),

      trailingEps:
        numberOrNull(
          keyStatistics
            .trailingEps,
          quote
            .epsTrailingTwelveMonths,
        ),

      forwardEps:
        numberOrNull(
          keyStatistics
            .forwardEps,
          quote.epsForward,
        ),

      totalRevenue:
        numberOrNull(
          financialData
            .totalRevenue,
        ),

      revenueGrowth:
        numberOrNull(
          financialData
            .revenueGrowth,
        ),

      earningsGrowth:
        numberOrNull(
          financialData
            .earningsGrowth,
        ),

      profitMargins:
        numberOrNull(
          financialData
            .profitMargins,
          keyStatistics
            .profitMargins,
        ),

      returnOnEquity:
        numberOrNull(
          financialData
            .returnOnEquity,
        ),

      totalCash:
        numberOrNull(
          financialData
            .totalCash,
        ),

      totalDebt:
        numberOrNull(
          financialData
            .totalDebt,
        ),

      debtToEquity:
        numberOrNull(
          financialData
            .debtToEquity,
        ),

      currentRatio:
        numberOrNull(
          financialData
            .currentRatio,
        ),

      freeCashflow:
        numberOrNull(
          financialData
            .freeCashflow,
        ),

      dividendYield:
        numberOrNull(
          summaryDetail
            .dividendYield,
        ),

      source:
        "Yahoo Finance via yahoo-finance2",

      lastUpdated:
        normalizeDate(
          quote
            .regularMarketTime,
        ),

      range:
        requestedRange,

      chart,
    };

    res.setHeader(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=60",
    );

    return res
      .status(200)
      .json(responseData);
  } catch (error) {
    console.error(
      "Yahoo Finance stock-data function failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : String(
            error ||
              "Unable to retrieve stock data.",
          );

    const normalizedMessage =
      message.toLowerCase();

    const isNotFound =
      normalizedMessage.includes(
        "not found",
      ) ||
      normalizedMessage.includes(
        "no fundamentals",
      ) ||
      normalizedMessage.includes(
        "no data found",
      );

    const temporaryFailure =
      isRetryableError(error);

    const statusCode =
      isNotFound
        ? 404
        : temporaryFailure
          ? 503
          : 500;

    return res
      .status(statusCode)
      .json({
        error: {
          code: isNotFound
            ? "STOCK_NOT_FOUND"
            : temporaryFailure
              ? "YAHOO_TEMPORARILY_UNAVAILABLE"
              : "STOCK_DATA_FAILED",

          message: isNotFound
            ? "The requested stock symbol was not found."
            : temporaryFailure
              ? "Yahoo Finance is temporarily unavailable. Please retry shortly."
              : "Unable to retrieve stock data.",
        },

        details:
          process.env.NODE_ENV !==
          "production"
            ? message
            : undefined,
      });
  }
}