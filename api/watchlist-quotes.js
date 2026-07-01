import yahooFinance from "./_lib/yahooFinance.js";

const CACHE_DURATION_MS = 30 * 1000;
const MAX_SYMBOLS = 20;

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
  ].slice(0, MAX_SYMBOLS);
}

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
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
    ),
    changePercent: safeNumber(
      quote?.regularMarketChangePercent,
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
      String(
        quote?.marketState || "UNKNOWN",
      ).toUpperCase(),
    lastUpdated:
      normalizeTimestamp(
        quote?.regularMarketTime,
      ),
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

async function loadQuotes(symbols) {
  try {
    const quoteResult =
      await yahooFinance.quote(symbols);

    return {
      quotes: Array.isArray(quoteResult)
        ? quoteResult
        : quoteResult
          ? [quoteResult]
          : [],
      warning: "",
    };
  } catch (bulkError) {
    const results = await Promise.allSettled(
      symbols.map((symbol) =>
        yahooFinance.quote(symbol),
      ),
    );

    const quotes = results
      .filter(
        (result) =>
          result.status === "fulfilled" &&
          result.value,
      )
      .flatMap((result) =>
        Array.isArray(result.value)
          ? result.value
          : [result.value],
      );

    if (quotes.length === 0) {
      throw bulkError;
    }

    return {
      quotes,
      warning:
        "Some quotes could not be refreshed in the combined request.",
    };
  }
}

export default async function handler(
  request,
  response,
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      error: "Method not allowed. Use GET.",
    });
  }

  const symbols = parseSymbols(
    request.query?.symbols,
  );

  if (symbols.length === 0) {
    return response.status(400).json({
      success: false,
      error:
        "Add at least one valid stock symbol using the symbols query parameter.",
    });
  }

  const forceRefresh =
    String(request.query?.refresh || "") === "1";

  const cacheKey = symbols
    .slice()
    .sort()
    .join(",");

  const cachedEntry =
    responseCache.get(cacheKey);

  if (
    !forceRefresh &&
    cachedEntry &&
    Date.now() - cachedEntry.savedAt <
      CACHE_DURATION_MS
  ) {
    response.setHeader(
      "Cache-Control",
      "public, max-age=15, stale-while-revalidate=30",
    );

    return response.status(200).json({
      ...cachedEntry.data,
      cached: true,
    });
  }

  try {
    const result = await loadQuotes(symbols);

    const quotes = result.quotes
      .filter((quote) => quote?.symbol)
      .map(normalizeQuote);

    const receivedSymbols = new Set(
      quotes.map((quote) => quote.symbol),
    );

    const unavailableSymbols =
      symbols.filter(
        (symbol) =>
          !receivedSymbols.has(symbol),
      );

    const fetchedAt =
      new Date().toISOString();

    const responseData = {
      success: true,
      source: "Market data",
      fetchedAt,
      requestedSymbols: symbols,
      quotes,
      unavailableSymbols,
      partial:
        unavailableSymbols.length > 0,
      warning:
        unavailableSymbols.length > 0
          ? `${unavailableSymbols.length} requested quote${
              unavailableSymbols.length === 1 ? "" : "s"
            } were unavailable.`
          : result.warning,
    };

    cleanExpiredCache();

    responseCache.set(cacheKey, {
      savedAt: Date.now(),
      data: responseData,
    });

    response.setHeader(
      "Cache-Control",
      "public, max-age=15, stale-while-revalidate=30",
    );

    return response.status(200).json({
      ...responseData,
      cached: false,
    });
  } catch (error) {
    console.error(
      "Watchlist quote API error:",
      error,
    );

    return response.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to retrieve market prices.",
      source: "Market data",
      fetchedAt:
        new Date().toISOString(),
    });
  }
}
