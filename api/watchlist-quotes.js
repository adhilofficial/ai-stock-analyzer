import yahooFinance from "./_lib/yahooFinance.js";

const CACHE_DURATION_MS = 30 * 1000;
const STALE_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
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
          /^[A-Z0-9.^&=_-]{1,30}$/.test(symbol),
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
  )
    .trim()
    .toUpperCase();

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
    marketState: String(
      quote?.marketState || "UNKNOWN",
    ).toUpperCase(),
    lastUpdated: normalizeTimestamp(
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
      STALE_CACHE_MAX_AGE_MS
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
        "Some quotes required an individual retry.",
    };
  }
}

function buildResponseData({
  symbols,
  rawQuotes,
  warning = "",
}) {
  const quoteMap = new Map();

  rawQuotes
    .filter((quote) => quote?.symbol)
    .map(normalizeQuote)
    .filter(
      (quote) =>
        quote.symbol &&
        quote.price !== null,
    )
    .forEach((quote) => {
      quoteMap.set(quote.symbol, quote);
    });

  const quotes = symbols
    .map((symbol) => quoteMap.get(symbol))
    .filter(Boolean);

  const receivedSymbols = new Set(
    quotes.map((quote) => quote.symbol),
  );

  const unavailableSymbols = symbols.filter(
    (symbol) =>
      !receivedSymbols.has(symbol),
  );

  const partial =
    unavailableSymbols.length > 0;

  const latestQuoteAt = quotes
    .map((quote) => quote.lastUpdated)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    success: true,
    source: "Market data",
    fetchedAt: new Date().toISOString(),
    latestQuoteAt,
    requestedSymbols: symbols,
    quotes,
    unavailableSymbols,
    partial,
    warning: partial
      ? `${unavailableSymbols.length} requested quote${
          unavailableSymbols.length === 1
            ? ""
            : "s"
        } could not be refreshed.`
      : warning,
  };
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
      stale: false,
    });
  }

  try {
    const result = await loadQuotes(symbols);

    const responseData = buildResponseData({
      symbols,
      rawQuotes: result.quotes,
      warning: result.warning,
    });

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
      stale: false,
    });
  } catch (error) {
    console.error(
      "Watchlist quote API error:",
      error,
    );

    const staleCacheAge = cachedEntry
      ? Date.now() - cachedEntry.savedAt
      : Number.POSITIVE_INFINITY;

    if (
      cachedEntry &&
      staleCacheAge <=
        STALE_CACHE_MAX_AGE_MS
    ) {
      response.setHeader(
        "Cache-Control",
        "no-store",
      );

      return response.status(200).json({
        ...cachedEntry.data,
        fetchedAt:
          cachedEntry.data.fetchedAt ||
          new Date(
            cachedEntry.savedAt,
          ).toISOString(),
        cached: true,
        stale: true,
        partial: true,
        warning:
          "The latest refresh failed. Previously cached watchlist values are being shown.",
      });
    }

    return response.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to retrieve market prices.",
      source: "Market data",
      fetchedAt: new Date().toISOString(),
    });
  }
}