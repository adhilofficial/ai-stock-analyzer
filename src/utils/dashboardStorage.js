export const WATCHLIST_STORAGE_KEY =
  "exa-watchlist-v1";

export const RECENT_ANALYSES_STORAGE_KEY =
  "exa-recent-analyses-v1";

export const WATCHLIST_UPDATED_EVENT =
  "exa:watchlist-updated";

export const RECENT_ANALYSES_UPDATED_EVENT =
  "exa:recent-analyses-updated";

export const MAX_WATCHLIST_ITEMS = 20;

const DEFAULT_WATCHLIST_SYMBOLS = [
  "RELIANCE.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "TATAMOTORS.NS",
  "ASIANPAINT.NS",
];

const MAX_RECENT_ANALYSES = 10;
const WATCHLIST_SYMBOL_PATTERN =
  /^[A-Z0-9.^&=_-]{1,30}$/;

function hasBrowserStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !==
      "undefined"
  );
}

export function normalizeWatchlistSymbol(value) {
  const candidate =
    value && typeof value === "object"
      ? value.symbol
      : value;

  const normalizedSymbol = String(
    candidate || "",
  )
    .trim()
    .toUpperCase();

  return WATCHLIST_SYMBOL_PATTERN.test(
    normalizedSymbol,
  )
    ? normalizedSymbol
    : "";
}

function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function cleanWatchlistSymbols(symbols) {
  return [
    ...new Set(
      (Array.isArray(symbols)
        ? symbols
        : []
      )
        .map(normalizeWatchlistSymbol)
        .filter(Boolean),
    ),
  ].slice(0, MAX_WATCHLIST_ITEMS);
}

function createCustomEvent(eventName) {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !==
      "function"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(eventName),
  );
}

function readStorageValue(key) {
  if (!hasBrowserStorage()) {
    return null;
  }

  try {
    const storedValue =
      window.localStorage.getItem(key);

    if (storedValue === null) {
      return null;
    }

    return JSON.parse(storedValue);
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error,
    );

    return null;
  }
}

function writeStorageValue(
  key,
  value,
  eventName,
) {
  if (!hasBrowserStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(value),
    );

    createCustomEvent(eventName);
    return true;
  } catch (error) {
    console.error(
      `Unable to save ${key}:`,
      error,
    );

    return false;
  }
}

export function getSavedWatchlistSymbols() {
  const storedValue = readStorageValue(
    WATCHLIST_STORAGE_KEY,
  );

  /*
   * Return defaults only when no watchlist has
   * ever been saved. An intentionally empty
   * array remains empty after a page reload.
   */
  if (storedValue === null) {
    return [...DEFAULT_WATCHLIST_SYMBOLS];
  }

  if (!Array.isArray(storedValue)) {
    return [...DEFAULT_WATCHLIST_SYMBOLS];
  }

  const cleanedSymbols =
    cleanWatchlistSymbols(storedValue);

  /* Repair malformed or duplicate storage data. */
  if (
    JSON.stringify(cleanedSymbols) !==
    JSON.stringify(storedValue)
  ) {
    writeStorageValue(
      WATCHLIST_STORAGE_KEY,
      cleanedSymbols,
      WATCHLIST_UPDATED_EVENT,
    );
  }

  return cleanedSymbols;
}

export function saveWatchlistSymbols(
  symbols,
) {
  const cleanedSymbols =
    cleanWatchlistSymbols(symbols);

  writeStorageValue(
    WATCHLIST_STORAGE_KEY,
    cleanedSymbols,
    WATCHLIST_UPDATED_EVENT,
  );

  return cleanedSymbols;
}

export function addWatchlistSymbol(symbol) {
  const normalizedSymbol =
    normalizeWatchlistSymbol(symbol);

  const currentSymbols =
    getSavedWatchlistSymbols();

  if (
    !normalizedSymbol ||
    currentSymbols.includes(
      normalizedSymbol,
    ) ||
    currentSymbols.length >=
      MAX_WATCHLIST_ITEMS
  ) {
    return currentSymbols;
  }

  return saveWatchlistSymbols([
    normalizedSymbol,
    ...currentSymbols,
  ]);
}

export function removeWatchlistSymbol(
  symbol,
) {
  const normalizedSymbol =
    normalizeWatchlistSymbol(symbol);

  if (!normalizedSymbol) {
    return getSavedWatchlistSymbols();
  }

  return saveWatchlistSymbols(
    getSavedWatchlistSymbols().filter(
      (savedSymbol) =>
        savedSymbol !== normalizedSymbol,
    ),
  );
}

export function resetWatchlist() {
  return saveWatchlistSymbols(
    DEFAULT_WATCHLIST_SYMBOLS,
  );
}

export function getRecentAnalyses() {
  const storedValue =
    readStorageValue(
      RECENT_ANALYSES_STORAGE_KEY,
    );

  if (!Array.isArray(storedValue)) {
    return [];
  }

  return storedValue
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.symbol,
    )
    .sort((first, second) => {
      const firstDate =
        new Date(
          first.analyzedAt,
        ).getTime();

      const secondDate =
        new Date(
          second.analyzedAt,
        ).getTime();

      return secondDate - firstDate;
    })
    .slice(0, MAX_RECENT_ANALYSES);
}

export function saveRecentAnalysis({
  stockData,
  analysis,
}) {
  if (
    !stockData?.symbol ||
    !analysis
  ) {
    return getRecentAnalyses();
  }

  const finalAnalysis =
    analysis?.result ||
    analysis?.analysis ||
    analysis?.data ||
    analysis;

  const symbol =
    normalizeSymbol(
      stockData.symbol,
    );

  const confidenceScore =
    Number(
      finalAnalysis
        ?.confidenceScore ??
        finalAnalysis?.strength ??
        finalAnalysis?.score,
    );

  const newItem = {
    symbol,

    company:
      stockData.name ||
      stockData.company ||
      finalAnalysis.company ||
      symbol,

    price:
      Number.isFinite(
        Number(stockData.price),
      )
        ? Number(stockData.price)
        : null,

    signal:
      finalAnalysis.signal ||
      "WATCH",

    score:
      Number.isFinite(
        confidenceScore,
      )
        ? Math.round(
            confidenceScore,
          )
        : null,

    riskLevel:
      finalAnalysis.riskLevel ||
      "Moderate",

    summary:
      typeof finalAnalysis.summary ===
      "string"
        ? finalAnalysis.summary
        : "",

    analyzedAt:
      new Date().toISOString(),
  };

  const previousItems =
    getRecentAnalyses();

  const withoutDuplicate =
    previousItems.filter(
      (item) =>
        normalizeSymbol(
          item.symbol,
        ) !== symbol,
    );

  const updatedItems = [
    newItem,
    ...withoutDuplicate,
  ].slice(0, MAX_RECENT_ANALYSES);

  writeStorageValue(
    RECENT_ANALYSES_STORAGE_KEY,
    updatedItems,
    RECENT_ANALYSES_UPDATED_EVENT,
  );

  return updatedItems;
}

export function clearRecentAnalyses() {
  writeStorageValue(
    RECENT_ANALYSES_STORAGE_KEY,
    [],
    RECENT_ANALYSES_UPDATED_EVENT,
  );

  return [];
}