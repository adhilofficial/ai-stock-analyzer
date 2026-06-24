import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

/*
 * This is a selected universe of liquid NSE stocks.
 * Market movers will be calculated from these symbols.
 */
const LIQUID_NSE_SYMBOLS = [
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
  "LTIM.NS",

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
];

const CACHE_DURATION_MS = 30 * 1000;

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
  const symbol = String(
    quote?.symbol || "",
  ).toUpperCase();

  return {
    symbol,

    name:
      quote?.shortName ||
      quote?.longName ||
      quote?.displayName ||
      symbol,

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

    volume: safeNumber(
      quote?.regularMarketVolume,
      0,
    ),

    averageVolume: safeNumber(
      quote?.averageDailyVolume3Month,
      0,
    ),

    marketCap: safeNumber(
      quote?.marketCap,
    ),

    marketState:
      quote?.marketState ||
      "UNKNOWN",

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
    ) &&
    Number.isFinite(
      Number(quote.changePercent),
    )
  );
}

function createMovers(quotes) {
  const validQuotes =
    quotes.filter(isUsableQuote);

  const gainers = [...validQuotes]
    .filter(
      (quote) =>
        quote.changePercent > 0,
    )
    .sort(
      (first, second) =>
        second.changePercent -
        first.changePercent,
    )
    .slice(0, 5);

  const losers = [...validQuotes]
    .filter(
      (quote) =>
        quote.changePercent < 0,
    )
    .sort(
      (first, second) =>
        first.changePercent -
        second.changePercent,
    )
    .slice(0, 5);

  const active = [...validQuotes]
    .filter(
      (quote) =>
        Number(quote.volume) > 0,
    )
    .sort(
      (first, second) =>
        Number(second.volume) -
        Number(first.volume),
    )
    .slice(0, 5);

  return {
    gainers,
    losers,
    active,
  };
}

async function loadMarketMovers() {
  const quoteResult =
    await yahooFinance.quote(
      LIQUID_NSE_SYMBOLS,
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
    LIQUID_NSE_SYMBOLS.filter(
      (symbol) =>
        !receivedSymbols.has(symbol),
    );

  return {
    success: true,

    source:
      "Yahoo Finance via yahoo-finance2",

    universe:
      "Selected liquid NSE stocks",

    fetchedAt:
      new Date().toISOString(),

    movers:
      createMovers(quotes),

    totalQuotes:
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
        "public, max-age=15, stale-while-revalidate=30",
      );

      return response
        .status(200)
        .json({
          ...cachedData,
          cached: true,
        });
    }

    const result =
      await loadMarketMovers();

    cachedData = result;
    cachedAt = Date.now();

    response.setHeader(
      "Cache-Control",
      "public, max-age=15, stale-while-revalidate=30",
    );

    return response
      .status(200)
      .json({
        ...result,
        cached: false,
      });
  } catch (error) {
    console.error(
      "Market movers API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve live market movers.",

        fetchedAt:
          new Date().toISOString(),
      });
  }
}