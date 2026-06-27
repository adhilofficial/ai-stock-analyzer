import { readFileSync } from "node:fs";

const MAX_COMPARE_STOCKS = 5;

function loadSnapshot() {
  const fileUrl = new URL(
    "../data/screener-snapshot.json",
    import.meta.url,
  );

  const fileText = readFileSync(
    fileUrl,
    "utf8",
  );

  const snapshot = JSON.parse(fileText);

  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    !Array.isArray(snapshot.stocks)
  ) {
    throw new Error(
      "data/screener-snapshot.json has an invalid structure.",
    );
  }

  return snapshot;
}

function getQueryValue(request, key) {
  const value = request.query?.[key];

  return Array.isArray(value)
    ? value[0]
    : value;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeSymbol(value) {
  return cleanText(value).toUpperCase();
}

function parseRequestedSymbols(request) {
  const rawValue = cleanText(
    getQueryValue(request, "symbols"),
  );

  if (!rawValue) {
    return [];
  }

  const seen = new Set();

  return rawValue
    .split(",")
    .map(normalizeSymbol)
    .filter((symbol) => {
      if (!symbol || seen.has(symbol)) {
        return false;
      }

      seen.add(symbol);
      return true;
    });
}

function createStockLookup(stocks) {
  const lookup = new Map();

  stocks.forEach((stock) => {
    const symbol = normalizeSymbol(
      stock?.symbol ||
        stock?.yahooSymbol,
    );

    const nseSymbol = normalizeSymbol(
      stock?.nseSymbol,
    );

    if (symbol) {
      lookup.set(symbol, stock);
    }

    if (nseSymbol) {
      lookup.set(nseSymbol, stock);
      lookup.set(
        `${nseSymbol}.NS`,
        stock,
      );
    }
  });

  return lookup;
}

export default async function handler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "s-maxage=300, stale-while-revalidate=900",
  );

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
          "Only GET requests are allowed.",
        stocks: [],
      });
  }

  try {
    const requestedSymbols =
      parseRequestedSymbols(request);

    if (
      requestedSymbols.length < 2
    ) {
      return response
        .status(400)
        .json({
          success: false,
          error:
            "Select at least two stock symbols to compare.",
          stocks: [],
        });
    }

    if (
      requestedSymbols.length >
      MAX_COMPARE_STOCKS
    ) {
      return response
        .status(400)
        .json({
          success: false,
          error:
            `You can compare up to ${MAX_COMPARE_STOCKS} companies at one time.`,
          stocks: [],
        });
    }

    const snapshot =
      loadSnapshot();

    const stockLookup =
      createStockLookup(
        snapshot.stocks,
      );

    const stocks = [];
    const missingSymbols = [];

    requestedSymbols.forEach(
      (requestedSymbol) => {
        const stock =
          stockLookup.get(
            requestedSymbol,
          );

        if (stock) {
          stocks.push(stock);
        } else {
          missingSymbols.push(
            requestedSymbol,
          );
        }
      },
    );

    if (stocks.length < 2) {
      return response
        .status(404)
        .json({
          success: false,
          error:
            "At least two selected companies were not available in the current screener snapshot.",
          requestedSymbols,
          missingSymbols,
          stocks,
        });
    }

    return response
      .status(200)
      .json({
        success: true,
        maxStocks:
          MAX_COMPARE_STOCKS,
        requestedSymbols,
        foundCount:
          stocks.length,
        missingSymbols,
        generatedAt:
          snapshot.generatedAt ||
          null,
        fetchedAt:
          new Date().toISOString(),
        source:
          snapshot.source ||
          "Yahoo Finance",
        snapshotVersion:
          snapshot.version ??
          null,
        stocks,
      });
  } catch (error) {
    console.error(
      "Compare API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load stock comparison data.",
        stocks: [],
      });
  }
}