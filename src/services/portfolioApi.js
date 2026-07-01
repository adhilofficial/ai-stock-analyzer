const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "",
).replace(/\/+$/, "");

const MAX_SYMBOLS_PER_REQUEST = 20;

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function cleanSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

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

function splitIntoChunks(items, chunkSize) {
  const chunks = [];

  for (
    let index = 0;
    index < items.length;
    index += chunkSize
  ) {
    chunks.push(
      items.slice(index, index + chunkSize),
    );
  }

  return chunks;
}

async function readJsonResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      "The portfolio quote service returned a non-JSON response.",
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(
      "The portfolio quote service returned invalid JSON.",
    );
  }
}

function normalizeQuote(quote) {
  return {
    symbol: cleanSymbol(quote?.symbol),
    name:
      String(
        quote?.name ||
        quote?.symbol ||
        "Unknown company",
      ).trim(),
    price: safeNumber(quote?.price),
    change: safeNumber(quote?.change),
    changePercent: safeNumber(
      quote?.changePercent,
    ),
    previousClose: safeNumber(
      quote?.previousClose,
    ),
    dayHigh: safeNumber(quote?.dayHigh),
    dayLow: safeNumber(quote?.dayLow),
    volume: safeNumber(quote?.volume),
    marketCap: safeNumber(quote?.marketCap),
    currency:
      String(quote?.currency || "INR").trim(),
    exchange:
      String(quote?.exchange || "NSE").trim(),
    marketState:
      String(
        quote?.marketState || "UNKNOWN",
      ).trim().toUpperCase(),
    lastUpdated:
      quote?.lastUpdated || null,
  };
}

async function fetchQuoteBatch({
  symbols,
  refresh,
  signal,
}) {
  const parameters = new URLSearchParams({
    symbols: symbols.join(","),
  });

  if (refresh) {
    parameters.set("refresh", "1");
  }

  const response = await fetch(
    buildApiUrl(
      `/api/watchlist-quotes?${parameters.toString()}`,
    ),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const data = await readJsonResponse(response);

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.error ||
      `Unable to load portfolio quotes. Server returned ${response.status}.`,
    );
  }

  return {
    quotes: Array.isArray(data?.quotes)
      ? data.quotes
          .map(normalizeQuote)
          .filter((quote) => quote.symbol)
      : [],
    unavailableSymbols: Array.isArray(
      data?.unavailableSymbols,
    )
      ? data.unavailableSymbols.map(cleanSymbol)
      : [],
    fetchedAt:
      data?.fetchedAt ||
      new Date().toISOString(),
    cached: Boolean(data?.cached),
    partial: Boolean(data?.partial),
    warning: String(data?.warning || "").trim(),
  };
}

export async function getPortfolioQuotes({
  symbols = [],
  refresh = false,
  signal,
} = {}) {
  const cleanedSymbols = [
    ...new Set(
      (Array.isArray(symbols) ? symbols : [])
        .map(cleanSymbol)
        .filter(Boolean),
    ),
  ];

  if (cleanedSymbols.length === 0) {
    return {
      success: true,
      quotes: [],
      unavailableSymbols: [],
      fetchedAt: null,
      source: "Market data",
      cached: false,
      partial: false,
      warning: "",
    };
  }

  const chunks = splitIntoChunks(
    cleanedSymbols,
    MAX_SYMBOLS_PER_REQUEST,
  );

  const results = await Promise.allSettled(
    chunks.map((chunk) =>
      fetchQuoteBatch({
        symbols: chunk,
        refresh,
        signal,
      }),
    ),
  );

  const quotes = [];
  const unavailableSymbols = new Set();
  const warnings = [];
  let fetchedAt = null;
  let cachedBatchCount = 0;
  let successfulBatchCount = 0;

  results.forEach((result, index) => {
    const chunk = chunks[index];

    if (result.status === "rejected") {
      if (result.reason?.name === "AbortError") {
        throw result.reason;
      }

      chunk.forEach((symbol) =>
        unavailableSymbols.add(symbol),
      );

      warnings.push(
        result.reason instanceof Error
          ? result.reason.message
          : "A quote batch could not be refreshed.",
      );
      return;
    }

    successfulBatchCount += 1;

    if (result.value.cached) {
      cachedBatchCount += 1;
    }

    result.value.quotes.forEach((quote) =>
      quotes.push(quote),
    );

    result.value.unavailableSymbols.forEach(
      (symbol) => unavailableSymbols.add(symbol),
    );

    if (result.value.warning) {
      warnings.push(result.value.warning);
    }

    if (
      !fetchedAt ||
      new Date(result.value.fetchedAt).getTime() >
        new Date(fetchedAt).getTime()
    ) {
      fetchedAt = result.value.fetchedAt;
    }
  });

  const receivedSymbols = new Set(
    quotes.map((quote) => quote.symbol),
  );

  cleanedSymbols.forEach((symbol) => {
    if (!receivedSymbols.has(symbol)) {
      unavailableSymbols.add(symbol);
    }
  });

  if (
    successfulBatchCount === 0 &&
    quotes.length === 0
  ) {
    throw new Error(
      warnings[0] ||
      "Portfolio market data is temporarily unavailable.",
    );
  }

  const unavailable = [
    ...unavailableSymbols,
  ];

  return {
    success: true,
    quotes,
    unavailableSymbols: unavailable,
    fetchedAt:
      fetchedAt || new Date().toISOString(),
    source: "Market data",
    cached:
      successfulBatchCount > 0 &&
      cachedBatchCount === successfulBatchCount,
    partial:
      unavailable.length > 0 ||
      successfulBatchCount < chunks.length,
    warning:
      unavailable.length > 0
        ? `${unavailable.length} holding quote${
            unavailable.length === 1 ? "" : "s"
          } could not be refreshed.`
        : warnings[0] || "",
  };
}
