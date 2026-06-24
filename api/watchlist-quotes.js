import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const CACHE_DURATION_MS = 30 * 1000;

const responseCache = new Map();

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

function parseSymbols(value) {
  const rawValue = Array.isArray(value)
    ? value.join(",")
    : String(value || "");

  return [
    ...new Set(
      rawValue
        .split(",")
        .map((symbol) =>
          String(symbol || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean)
        .filter((symbol) =>
          /^[A-Z0-9.^&=_-]+$/.test(symbol),
        ),
    ),
  ].slice(0, 20);
}

function normalizeQuote(quote) {
  const symbol = String(
    quote?.symbol || "",
  ).toUpperCase();

  return {
    symbol,

    name:
      quote?.longName ||
      quote?.shortName ||
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

    dayHigh: safeNumber(
      quote?.regularMarketDayHigh,
    ),

    dayLow: safeNumber(
      quote?.regularMarketDayLow,
    ),

    volume: safeNumber(
      quote?.regularMarketVolume,
    ),

    marketCap: safeNumber(
      quote?.marketCap,
    ),

    currency:
      quote?.currency || "INR",

    exchange:
      quote?.fullExchangeName ||
      quote?.exchange ||
      "NSE",

    marketState:
      quote?.marketState ||
      "UNKNOWN",
  };
}

function cleanExpiredCache() {
  const now = Date.now();

  for (const [
    cacheKey,
    cacheEntry,
  ] of responseCache.entries()) {
    if (
      now - cacheEntry.savedAt >
      CACHE_DURATION_MS * 5
    ) {
      responseCache.delete(cacheKey);
    }
  }
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

  const symbols = parseSymbols(
    request.query?.symbols,
  );

  if (symbols.length === 0) {
    return response
      .status(400)
      .json({
        success: false,
        error:
          "Add at least one valid stock symbol using the symbols query parameter.",
      });
  }

  const forceRefresh =
    String(
      request.query?.refresh || "",
    ) === "1";

  const cacheKey = symbols
    .slice()
    .sort()
    .join(",");

  const cachedEntry =
    responseCache.get(cacheKey);

  if (
    !forceRefresh &&
    cachedEntry &&
    Date.now() -
      cachedEntry.savedAt <
      CACHE_DURATION_MS
  ) {
    response.setHeader(
      "Cache-Control",
      "public, max-age=15, stale-while-revalidate=30",
    );

    return response
      .status(200)
      .json({
        ...cachedEntry.data,
        cached: true,
      });
  }

  try {
    const quoteResult =
      await yahooFinance.quote(
        symbols,
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
      symbols.filter(
        (symbol) =>
          !receivedSymbols.has(symbol),
      );

    const responseData = {
      success: true,

      source:
        "Yahoo Finance via yahoo-finance2",

      fetchedAt:
        new Date().toISOString(),

      requestedSymbols:
        symbols,

      quotes,

      unavailableSymbols,
    };

    cleanExpiredCache();

    responseCache.set(
      cacheKey,
      {
        savedAt: Date.now(),
        data: responseData,
      },
    );

    response.setHeader(
      "Cache-Control",
      "public, max-age=15, stale-while-revalidate=30",
    );

    return response
      .status(200)
      .json({
        ...responseData,
        cached: false,
      });
  } catch (error) {
    console.error(
      "Watchlist quote API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve live watchlist prices.",

        source:
          "Yahoo Finance via yahoo-finance2",

        fetchedAt:
          new Date().toISOString(),
      });
  }
}