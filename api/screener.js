import {
  readFileSync,
} from "node:fs";

/*
|--------------------------------------------------------------------------
| Screener configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_COMPARE_STOCKS = 5;

const ALLOWED_SORT_FIELDS =
  new Set([
    "universeRank",
    "name",
    "symbol",
    "price",
    "changePercent",
    "marketCap",
    "peRatio",
    "forwardPE",
    "priceToBook",
    "revenueGrowthPercent",
    "earningsGrowthPercent",
    "returnOnEquityPercent",
    "profitMarginsPercent",
    "debtToEquity",
    "currentRatio",
    "dividendYield",
    "rsi",
    "sma20",
    "sma50",
    "distanceFrom52WeekHigh",
    "volume",
    "averageVolume",
    "sector",
    "industry",
    "trend",
  ]);

const DEFAULT_SORT = {
  field: "marketCap",
  direction: "desc",
};

/*
|--------------------------------------------------------------------------
| Load full-universe snapshot
|--------------------------------------------------------------------------
*/

function loadSnapshot() {
  const fileUrl = new URL(
    "../data/screener-snapshot.json",
    import.meta.url,
  );

  const fileText =
    readFileSync(
      fileUrl,
      "utf8",
    );

  const snapshot =
    JSON.parse(fileText);

  if (
    !snapshot ||
    typeof snapshot !==
      "object" ||
    !Array.isArray(
      snapshot.stocks,
    )
  ) {
    throw new Error(
      "data/screener-snapshot.json has an invalid structure.",
    );
  }

  return snapshot;
}

/*
|--------------------------------------------------------------------------
| Query helpers
|--------------------------------------------------------------------------
*/

function getQueryValue(
  request,
  key,
) {
  const value =
    request.query?.[key];

  return Array.isArray(value)
    ? value[0]
    : value;
}

function cleanText(value) {
  return String(
    value ?? "",
  ).trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase();
}
function normalizeSymbol(value) {
  return cleanText(value)
    .toUpperCase();
}

function parseRequestedSymbols(
  request,
) {
  const rawValue =
    cleanText(
      getQueryValue(
        request,
        "symbols",
      ),
    );

  if (!rawValue) {
    return [];
  }

  const seen = new Set();

  return rawValue
    .split(",")
    .map(normalizeSymbol)
    .filter((symbol) => {
      if (
        !symbol ||
        seen.has(symbol)
      ) {
        return false;
      }

      seen.add(symbol);

      return true;
    });
}

function createStockLookup(stocks) {
  const lookup = new Map();

  stocks.forEach((stock) => {
    const symbol =
      normalizeSymbol(
        stock?.symbol ||
          stock?.yahooSymbol,
      );

    const nseSymbol =
      normalizeSymbol(
        stock?.nseSymbol,
      );

    if (symbol) {
      lookup.set(
        symbol,
        stock,
      );
    }

    if (nseSymbol) {
      lookup.set(
        nseSymbol,
        stock,
      );

      lookup.set(
        `${nseSymbol}.NS`,
        stock,
      );
    }
  });

  return lookup;
}

function safeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function clampInteger(
  value,
  minimum,
  maximum,
  fallback,
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return Math.min(
    Math.max(
      Math.trunc(number),
      minimum,
    ),
    maximum,
  );
}

/*
|--------------------------------------------------------------------------
| Sort parsing
|--------------------------------------------------------------------------
|
| Supported formats:
|
| sort=marketCap-desc
|
| or:
|
| sortBy=marketCap
| sortOrder=desc
|
*/

function parseSort(request) {
  const combinedSort =
    cleanText(
      getQueryValue(
        request,
        "sort",
      ),
    );

  let field =
    cleanText(
      getQueryValue(
        request,
        "sortBy",
      ),
    );

  let direction =
    cleanText(
      getQueryValue(
        request,
        "sortOrder",
      ),
    ).toLowerCase();

  if (combinedSort) {
    const separatorIndex =
      combinedSort.lastIndexOf(
        "-",
      );

    if (
      separatorIndex > 0
    ) {
      field =
        combinedSort.slice(
          0,
          separatorIndex,
        );

      direction =
        combinedSort
          .slice(
            separatorIndex + 1,
          )
          .toLowerCase();
    } else {
      field =
        combinedSort;
    }
  }

  if (
    !ALLOWED_SORT_FIELDS.has(
      field,
    )
  ) {
    field =
      DEFAULT_SORT.field;
  }

  if (
    direction !== "asc" &&
    direction !== "desc"
  ) {
    direction =
      DEFAULT_SORT.direction;
  }

  return {
    field,
    direction,

    value:
      `${field}-${direction}`,
  };
}

/*
|--------------------------------------------------------------------------
| Filter parsing
|--------------------------------------------------------------------------
*/

function parseFilters(request) {
  return {
    /*
     * Both q and search are supported.
     */
    query:
      cleanText(
        getQueryValue(
          request,
          "q",
        ) ??
          getQueryValue(
            request,
            "search",
          ),
      ),

    sector:
      cleanText(
        getQueryValue(
          request,
          "sector",
        ),
      ),

    trend:
      cleanText(
        getQueryValue(
          request,
          "trend",
        ),
      ),

    minPrice:
      safeNumber(
        getQueryValue(
          request,
          "minPrice",
        ),
      ),

    maxPrice:
      safeNumber(
        getQueryValue(
          request,
          "maxPrice",
        ),
      ),

    minPe:
      safeNumber(
        getQueryValue(
          request,
          "minPe",
        ),
      ),

    maxPe:
      safeNumber(
        getQueryValue(
          request,
          "maxPe",
        ),
      ),

    minRevenueGrowth:
      safeNumber(
        getQueryValue(
          request,
          "minRevenueGrowth",
        ),
      ),

    minRoe:
      safeNumber(
        getQueryValue(
          request,
          "minRoe",
        ),
      ),

    minProfitMargin:
      safeNumber(
        getQueryValue(
          request,
          "minProfitMargin",
        ),
      ),

    maxDebtToEquity:
      safeNumber(
        getQueryValue(
          request,
          "maxDebtToEquity",
        ),
      ),

    minRsi:
      safeNumber(
        getQueryValue(
          request,
          "minRsi",
        ),
      ),

    maxRsi:
      safeNumber(
        getQueryValue(
          request,
          "maxRsi",
        ),
      ),

    maxDistanceFromHigh:
      safeNumber(
        getQueryValue(
          request,
          "maxDistanceFromHigh",
        ),
      ),
  };
}

/*
|--------------------------------------------------------------------------
| Numeric filter helpers
|--------------------------------------------------------------------------
*/

function matchesMinimum(
  value,
  minimum,
) {
  if (minimum === null) {
    return true;
  }

  const number =
    safeNumber(value);

  return (
    number !== null &&
    number >= minimum
  );
}

function matchesMaximum(
  value,
  maximum,
) {
  if (maximum === null) {
    return true;
  }

  const number =
    safeNumber(value);

  return (
    number !== null &&
    number <= maximum
  );
}

/*
|--------------------------------------------------------------------------
| Apply all filters to one stock
|--------------------------------------------------------------------------
*/

function stockMatchesFilters(
  stock,
  filters,
) {
  const normalizedQuery =
    normalizeText(
      filters.query,
    );

  /*
   * Search the complete stock record.
   */
  if (normalizedQuery) {
    const searchableText = [
      stock?.name,
      stock?.symbol,
      stock?.nseSymbol,
      stock?.bseCode,
      stock?.isin,
      stock?.sector,
      stock?.industry,
    ]
      .map(normalizeText)
      .join(" ");

    if (
      !searchableText.includes(
        normalizedQuery,
      )
    ) {
      return false;
    }
  }

  /*
   * Sector filter
   */
  if (
    filters.sector &&
    normalizeText(
      filters.sector,
    ) !== "all" &&
    normalizeText(
      stock?.sector,
    ) !==
      normalizeText(
        filters.sector,
      )
  ) {
    return false;
  }

  /*
   * Trend filter
   */
  if (
    filters.trend &&
    normalizeText(
      filters.trend,
    ) !== "all" &&
    normalizeText(
      stock?.trend,
    ) !==
      normalizeText(
        filters.trend,
      )
  ) {
    return false;
  }

  /*
   * Price range
   */
  if (
    !matchesMinimum(
      stock?.price,
      filters.minPrice,
    ) ||
    !matchesMaximum(
      stock?.price,
      filters.maxPrice,
    )
  ) {
    return false;
  }

  /*
   * P/E range
   */
  if (
    !matchesMinimum(
      stock?.peRatio,
      filters.minPe,
    ) ||
    !matchesMaximum(
      stock?.peRatio,
      filters.maxPe,
    )
  ) {
    return false;
  }

  /*
   * Revenue growth
   */
  if (
    !matchesMinimum(
      stock
        ?.revenueGrowthPercent,
      filters.minRevenueGrowth,
    )
  ) {
    return false;
  }

  /*
   * Return on equity
   */
  if (
    !matchesMinimum(
      stock
        ?.returnOnEquityPercent,
      filters.minRoe,
    )
  ) {
    return false;
  }

  /*
   * Profit margin
   */
  if (
    !matchesMinimum(
      stock
        ?.profitMarginsPercent,
      filters.minProfitMargin,
    )
  ) {
    return false;
  }

  /*
   * Debt-to-equity
   */
  if (
    !matchesMaximum(
      stock?.debtToEquity,
      filters.maxDebtToEquity,
    )
  ) {
    return false;
  }

  /*
   * RSI range
   */
  if (
    !matchesMinimum(
      stock?.rsi,
      filters.minRsi,
    ) ||
    !matchesMaximum(
      stock?.rsi,
      filters.maxRsi,
    )
  ) {
    return false;
  }

  /*
   * Distance from 52-week high
   */
  if (
    !matchesMaximum(
      stock
        ?.distanceFrom52WeekHigh,
      filters
        .maxDistanceFromHigh,
    )
  ) {
    return false;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| Sorting
|--------------------------------------------------------------------------
*/

function comparePrimitiveValues(
  firstValue,
  secondValue,
  direction,
) {
  const firstNumber =
    safeNumber(firstValue);

  const secondNumber =
    safeNumber(secondValue);

  const firstIsMissing =
    firstValue === null ||
    firstValue === undefined ||
    firstValue === "";

  const secondIsMissing =
    secondValue === null ||
    secondValue === undefined ||
    secondValue === "";

  /*
   * Keep missing values at the bottom.
   */
  if (
    firstIsMissing &&
    secondIsMissing
  ) {
    return 0;
  }

  if (firstIsMissing) {
    return 1;
  }

  if (secondIsMissing) {
    return -1;
  }

  /*
   * Numeric comparison
   */
  if (
    firstNumber !== null &&
    secondNumber !== null
  ) {
    return direction === "asc"
      ? firstNumber -
          secondNumber
      : secondNumber -
          firstNumber;
  }

  /*
   * Text comparison
   */
  const comparison =
    String(firstValue)
      .localeCompare(
        String(secondValue),
        "en-IN",
        {
          sensitivity:
            "base",

          numeric: true,
        },
      );

  return direction === "asc"
    ? comparison
    : -comparison;
}

function sortStocks(
  stocks,
  sort,
) {
  return [...stocks].sort(
    (first, second) => {
      const result =
        comparePrimitiveValues(
          first?.[sort.field],
          second?.[sort.field],
          sort.direction,
        );

      if (result !== 0) {
        return result;
      }

      /*
       * Use original universe ranking
       * when two values are equal.
       */
      return comparePrimitiveValues(
        first?.universeRank,
        second?.universeRank,
        "asc",
      );
    },
  );
}

/*
|--------------------------------------------------------------------------
| Response summaries
|--------------------------------------------------------------------------
*/

function createTrendSummary(
  stocks,
) {
  return stocks.reduce(
    (
      summary,
      stock,
    ) => {
      const trend =
        cleanText(
          stock?.trend,
        ) ||
        "Unavailable";

      summary[trend] =
        (
          summary[trend] ||
          0
        ) + 1;

      return summary;
    },
    {},
  );
}

function createFilterSummary(
  filters,
) {
  return Object.fromEntries(
    Object.entries(
      filters,
    ).filter(
      ([, value]) =>
        value !== null &&
        value !== "" &&
        normalizeText(
          value,
        ) !== "all",
    ),
  );
}

/*
|--------------------------------------------------------------------------
| API handler
|--------------------------------------------------------------------------
*/

export default async function handler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "s-maxage=300, stale-while-revalidate=900",
  );

  if (
    request.method !== "GET"
  ) {
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
    /*
     * Read the complete generated snapshot.
     */
    const snapshot =
      loadSnapshot();

    const allStocks =
      snapshot.stocks;

    /*
    |-----------------------------------------------------------------------
    | Phase 9C historical market trends request
    |-----------------------------------------------------------------------
    |
    | Example:
    | /api/screener?mode=market-pulse
    |
    | This reuses the existing Screener serverless function, so Phase 9B
    | does not create another Vercel function.
    |
    */

    const mode =
      normalizeText(
        getQueryValue(
          request,
          "mode",
        ),
      );

    if (
      mode ===
      "market-pulse"
    ) {
      const history =
        Array.isArray(
          snapshot
            ?.marketPulseHistory,
        )
          ? snapshot
              .marketPulseHistory
          : snapshot
              ?.marketPulse
            ? [
                snapshot
                  .marketPulse,
              ]
            : [];

      return response
        .status(200)
        .json({
          success: true,

          generatedAt:
            snapshot.generatedAt ||
            null,

          fetchedAt:
            new Date()
              .toISOString(),

          source:
            snapshot.source ||
            "Yahoo Finance",

          snapshotVersion:
            snapshot.version ??
            null,

          cached: true,
          snapshot: true,

          marketPulse:
            snapshot.marketPulse ||
            history[
              history.length - 1
            ] ||
            null,

          marketPulseHistory:
            history,

          historyCount:
            history.length,

          historyStartDate:
            history[0]?.date ||
            null,

          historyEndDate:
            history[
              history.length - 1
            ]?.date ||
            null,
        });
    }

      /*
|--------------------------------------------------------------------------
| Multi-stock comparison request
|--------------------------------------------------------------------------
|
| Example:
| /api/screener?symbols=RELIANCE.NS,TCS.NS
|
*/

const requestedSymbols =
  parseRequestedSymbols(
    request,
  );

if (
  requestedSymbols.length > 0
) {
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

  const stockLookup =
    createStockLookup(
      allStocks,
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

      comparison: true,

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
        new Date()
          .toISOString(),

      source:
        snapshot.source ||
        "Yahoo Finance",

      snapshotVersion:
        snapshot.version ??
        null,

      stocks,
    });
}

    const page =
      clampInteger(
        getQueryValue(
          request,
          "page",
        ),
        1,
        100000,
        1,
      );

    const limit =
      clampInteger(
        getQueryValue(
          request,
          "limit",
        ),
        1,
        MAX_PAGE_SIZE,
        DEFAULT_PAGE_SIZE,
      );

    const filters =
      parseFilters(request);

    const sort =
      parseSort(request);

    /*
     * Apply filters to the complete
     * screener universe.
     */
    const matchingStocks =
      allStocks.filter(
        (stock) =>
          stockMatchesFilters(
            stock,
            filters,
          ),
      );

    /*
     * Sort before pagination.
     */
    const sortedStocks =
      sortStocks(
        matchingStocks,
        sort,
      );

    const matchingCount =
      sortedStocks.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          matchingCount /
            limit,
        ),
      );

    /*
     * Prevent a page beyond the
     * available result range.
     */
    const safePage =
      Math.min(
        page,
        totalPages,
      );

    const startIndex =
      (
        safePage - 1
      ) * limit;

    /*
     * Pagination happens only after
     * search, filtering and sorting.
     */
    const stocks =
      sortedStocks.slice(
        startIndex,
        startIndex + limit,
      );

    /*
     * Return every available sector
     * so the frontend sector selector
     * stays complete.
     */
    const sectors =
      Array.isArray(
        snapshot.sectors,
      )
        ? snapshot.sectors
        : [
            ...new Set(
              allStocks
                .map(
                  (stock) =>
                    cleanText(
                      stock
                        ?.sector,
                    ),
                )
                .filter(
                  (sector) =>
                    sector &&
                    sector !==
                      "Not available",
                ),
            ),
          ].sort(
            (
              first,
              second,
            ) =>
              first.localeCompare(
                second,
                "en-IN",
              ),
          );

    return response
      .status(200)
      .json({
        success: true,

        /*
         * Pagination information
         */
        page: safePage,

        requestedPage:
          page,

        limit,

        totalPages,

        /*
         * Complete universe count
         */
        totalStocks:
          allStocks.length,

        /*
         * Count after applying filters
         */
        matchingStocks:
          matchingCount,

        returnedStocks:
          stocks.length,

        /*
         * Filter options and summaries
         */
        sectors,

        trendSummary:
          createTrendSummary(
            matchingStocks,
          ),

        filters:
          createFilterSummary(
            filters,
          ),

        sort:
          sort.value,

        /*
         * Snapshot information
         */
        generatedAt:
          snapshot.generatedAt ||
          null,

        fetchedAt:
          new Date()
            .toISOString(),

        source:
          snapshot.source ||
          "Yahoo Finance",

        snapshotVersion:
          snapshot.version ??
          null,

        cached: true,
        snapshot: true,

        /*
         * Final paginated rows
         */
        stocks,
      });
  } catch (error) {
    console.error(
      "Screener API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load screener data.",

        stocks: [],
      });
  }
}