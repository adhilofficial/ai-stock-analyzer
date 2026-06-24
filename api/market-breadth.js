import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

/*
 * Selected universe of liquid NSE companies.
 *
 * Important:
 * This represents breadth across this tracked universe,
 * not every listed NSE or BSE company.
 */
const BREADTH_SYMBOLS = [
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

const CACHE_DURATION_MS = 60 * 1000;

let cachedData = null;
let cachedAt = 0;

function safeNumber(value, fallback = null) {
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
      "Unknown company",

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

    fiftyDayAverage: safeNumber(
      quote?.fiftyDayAverage,
    ),

    fiftyTwoWeekHigh: safeNumber(
      quote?.fiftyTwoWeekHigh,
    ),

    fiftyTwoWeekLow: safeNumber(
      quote?.fiftyTwoWeekLow,
    ),

    volume: safeNumber(
      quote?.regularMarketVolume,
      0,
    ),

    marketState:
      quote?.marketState ||
      "UNKNOWN",
  };
}

function isUsableQuote(quote) {
  return (
    quote &&
    quote.symbol &&
    Number.isFinite(
      Number(quote.price),
    ) &&
    Number.isFinite(
      Number(quote.changePercent),
    )
  );
}

function calculateMarketBreadth(quotes) {
  const validQuotes =
    quotes.filter(isUsableQuote);

  let advancing = 0;
  let declining = 0;
  let unchanged = 0;

  let above50DMACount = 0;
  let below50DMACount = 0;
  let dmaCoverage = 0;

  let week52Highs = 0;
  let week52Lows = 0;
  let week52Coverage = 0;

  for (const quote of validQuotes) {
    const changePercent =
      Number(quote.changePercent);

    /*
     * Tiny changes around zero are treated
     * as unchanged to avoid floating-point noise.
     */
    if (
      Math.abs(changePercent) <
      0.005
    ) {
      unchanged += 1;
    } else if (
      changePercent > 0
    ) {
      advancing += 1;
    } else {
      declining += 1;
    }

    const price =
      Number(quote.price);

    const fiftyDayAverage =
      Number(
        quote.fiftyDayAverage,
      );

    if (
      Number.isFinite(price) &&
      Number.isFinite(
        fiftyDayAverage,
      ) &&
      fiftyDayAverage > 0
    ) {
      dmaCoverage += 1;

      if (
        price >=
        fiftyDayAverage
      ) {
        above50DMACount += 1;
      } else {
        below50DMACount += 1;
      }
    }

    const dayHigh =
      Number(quote.dayHigh);

    const dayLow =
      Number(quote.dayLow);

    const fiftyTwoWeekHigh =
      Number(
        quote.fiftyTwoWeekHigh,
      );

    const fiftyTwoWeekLow =
      Number(
        quote.fiftyTwoWeekLow,
      );

    if (
      Number.isFinite(
        fiftyTwoWeekHigh,
      ) ||
      Number.isFinite(
        fiftyTwoWeekLow,
      )
    ) {
      week52Coverage += 1;
    }

    /*
     * A small tolerance is used because Yahoo
     * values can contain decimal rounding.
     */
    if (
      Number.isFinite(dayHigh) &&
      Number.isFinite(
        fiftyTwoWeekHigh,
      ) &&
      fiftyTwoWeekHigh > 0 &&
      dayHigh >=
        fiftyTwoWeekHigh *
          0.9995
    ) {
      week52Highs += 1;
    }

    if (
      Number.isFinite(dayLow) &&
      Number.isFinite(
        fiftyTwoWeekLow,
      ) &&
      fiftyTwoWeekLow > 0 &&
      dayLow <=
        fiftyTwoWeekLow *
          1.0005
    ) {
      week52Lows += 1;
    }
  }

  const directionalTotal =
    advancing + declining;

  const advanceDeclineRatio =
    declining > 0
      ? advancing / declining
      : advancing > 0
        ? advancing
        : 0;

  const advancingPercent =
    directionalTotal > 0
      ? (advancing /
          directionalTotal) *
        100
      : 0;

  const decliningPercent =
    directionalTotal > 0
      ? (declining /
          directionalTotal) *
        100
      : 0;

  const above50DMA =
    dmaCoverage > 0
      ? (above50DMACount /
          dmaCoverage) *
        100
      : 0;

  return {
    advancing,
    declining,
    unchanged,

    advanceDeclineRatio:
      Number(
        advanceDeclineRatio.toFixed(
          2,
        ),
      ),

    advancingPercent:
      Number(
        advancingPercent.toFixed(
          1,
        ),
      ),

    decliningPercent:
      Number(
        decliningPercent.toFixed(
          1,
        ),
      ),

    above50DMA:
      Number(
        above50DMA.toFixed(1),
      ),

    above50DMACount,
    below50DMACount,
    dmaCoverage,

    week52Highs,
    week52Lows,
    week52Coverage,

    totalStocks:
      validQuotes.length,

    scope:
      `${validQuotes.length} liquid NSE stocks`,
  };
}

async function loadMarketBreadth() {
  const quoteResult =
    await yahooFinance.quote(
      BREADTH_SYMBOLS,
    );

  const quoteArray =
    Array.isArray(quoteResult)
      ? quoteResult
      : quoteResult
        ? [quoteResult]
        : [];

  const quotes = quoteArray
    .filter(
      (quote) =>
        quote?.symbol,
    )
    .map(normalizeQuote);

  const receivedSymbols =
    new Set(
      quotes.map(
        (quote) =>
          quote.symbol,
      ),
    );

  const unavailableSymbols =
    BREADTH_SYMBOLS.filter(
      (symbol) =>
        !receivedSymbols.has(
          symbol,
        ),
    );

  return {
    success: true,

    source:
      "Yahoo Finance via yahoo-finance2",

    universe:
      "Selected liquid NSE stocks",

    fetchedAt:
      new Date().toISOString(),

    breadth:
      calculateMarketBreadth(
        quotes,
      ),

    totalRequested:
      BREADTH_SYMBOLS.length,

    totalReceived:
      quotes.length,

    unavailableSymbols,
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
    const forceRefresh =
      String(
        request.query?.refresh ||
          "",
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
      await loadMarketBreadth();

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
      "Market breadth API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve live market breadth.",

        source:
          "Yahoo Finance via yahoo-finance2",

        fetchedAt:
          new Date().toISOString(),
      });
  }
}