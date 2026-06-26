import { readFileSync } from "node:fs";

import yahooFinance from "./_lib/yahooFinance.js";

import withRetry, {
  isRetryableError,
} from "./_lib/withRetry.js";

const MAX_RESULTS = 8;

const POPULAR_SYMBOLS = [
  "RELIANCE.NS",
  "HDFCBANK.NS",
  "INFY.NS",
  "TCS.NS",
  "TATAMOTORS.NS",
  "ICICIBANK.NS",
  "BHARTIARTL.NS",
  "SBIN.NS",
];

const SEARCH_CACHE_DURATION_MS =
  30 * 1000;

const PROFILE_CACHE_DURATION_MS =
  12 * 60 * 60 * 1000;

const searchCache =
  new Map();

const profileCache =
  new Map();

function loadStockMaster() {
  try {
    const fileUrl =
      new URL(
        "../data/indian-stock-master.json",
        import.meta.url,
      );

    const fileText =
      readFileSync(
        fileUrl,
        "utf8",
      );

    const data =
      JSON.parse(fileText);

    if (!Array.isArray(data)) {
      throw new Error(
        "Stock master must be an array.",
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Unable to load data/indian-stock-master.json:",
      error,
    );

    return [];
  }
}

const STOCK_MASTER =
  loadStockMaster();

const STOCK_BY_YAHOO_SYMBOL =
  new Map(
    STOCK_MASTER.map((stock) => [
      String(
        stock.yahooSymbol || "",
      ).toUpperCase(),
      stock,
    ]),
  );

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
  return String(value || "")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase();
}

function normalizeTicker(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(
      /\.(NS|BO)$/i,
      "",
    );
}

function numberOrNull(...values) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(number)
    ) {
      return number;
    }
  }

  return null;
}

function getDomain(website) {
  if (!website) {
    return "";
  }

  try {
    return new URL(
      website,
    ).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return "";
  }
}

function getMatchScore(
  stock,
  query,
) {
  const normalizedQuery =
    normalizeText(query);

  const name =
    normalizeText(
      stock.name,
    );

  const nseSymbol =
    normalizeText(
      stock.nseSymbol,
    );

  const bseSecurityId =
    normalizeText(
      stock.bseSecurityId,
    );

  const bseCode =
    normalizeText(
      stock.bseCode,
    );

  const words =
    name.split(
      /[\s&(),.-]+/,
    );

  if (
    nseSymbol.startsWith(
      normalizedQuery,
    ) ||
    bseSecurityId.startsWith(
      normalizedQuery,
    ) ||
    bseCode.startsWith(
      normalizedQuery,
    )
  ) {
    return 0;
  }

  if (
    name.startsWith(
      normalizedQuery,
    )
  ) {
    return 1;
  }

  if (
    words.some((word) =>
      word.startsWith(
        normalizedQuery,
      ),
    )
  ) {
    return 2;
  }

  if (
    nseSymbol.includes(
      normalizedQuery,
    ) ||
    bseSecurityId.includes(
      normalizedQuery,
    ) ||
    bseCode.includes(
      normalizedQuery,
    )
  ) {
    return 3;
  }

  if (
    name.includes(
      normalizedQuery,
    )
  ) {
    return 4;
  }

  return 99;
}

function searchLocalMaster(
  query,
) {
  return STOCK_MASTER
    .map((stock) => ({
      stock,
      score:
        getMatchScore(
          stock,
          query,
        ),
    }))
    .filter(
      ({ score }) =>
        score < 99,
    )
    .sort(
      (first, second) => {
        if (
          first.score !==
          second.score
        ) {
          return (
            first.score -
            second.score
          );
        }

        /*
         * Prefer dual-listed and NSE stocks
         * when match quality is equal.
         */
        const firstPriority =
          first.stock.nseSymbol
            ? 0
            : 1;

        const secondPriority =
          second.stock.nseSymbol
            ? 0
            : 1;

        if (
          firstPriority !==
          secondPriority
        ) {
          return (
            firstPriority -
            secondPriority
          );
        }

        return first.stock.name.localeCompare(
          second.stock.name,
          "en-IN",
        );
      },
    )
    .slice(0, MAX_RESULTS)
    .map(
      ({ stock }) =>
        stock,
    );
}

function getPopularStocks() {
  return POPULAR_SYMBOLS
    .map((symbol) =>
      STOCK_BY_YAHOO_SYMBOL.get(
        symbol,
      ),
    )
    .filter(Boolean)
    .slice(0, MAX_RESULTS);
}

function getCachedValue(
  cache,
  key,
  duration,
) {
  const cached =
    cache.get(key);

  if (!cached) {
    return null;
  }

  if (
    Date.now() -
      cached.createdAt >
    duration
  ) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedValue(
  cache,
  key,
  value,
) {
  if (
    !Array.isArray(value) ||
    value.length === 0
  ) {
    return;
  }

  cache.set(key, {
    value,
    createdAt: Date.now(),
  });
}

async function getCompanyProfile(
  stock,
) {
  const symbol =
    stock.yahooSymbol;

  const cached =
    getCachedValue(
      profileCache,
      symbol,
      PROFILE_CACHE_DURATION_MS,
    );

  if (cached) {
    return cached;
  }

  if (
    stock.website &&
    stock.logoDomain
  ) {
    const profile = {
      website:
        stock.website,
      logoDomain:
        stock.logoDomain,
    };

    profileCache.set(
      symbol,
      {
        value: profile,
        createdAt:
          Date.now(),
      },
    );

    return profile;
  }

  try {
    const result =
      await withRetry(
        () =>
          yahooFinance.quoteSummary(
            symbol,
            {
              modules: [
                "assetProfile",
              ],
            },
          ),
        {
          attempts: 1,
          delayMs: 400,
          label:
            `Profile ${symbol}`,
        },
      );

    const website =
      result?.assetProfile
        ?.website ||
      stock.website ||
      "";

    const profile = {
      website,
      logoDomain:
        stock.logoDomain ||
        getDomain(website),
    };

    profileCache.set(
      symbol,
      {
        value: profile,
        createdAt:
          Date.now(),
      },
    );

    return profile;
  } catch {
    return {
      website:
        stock.website ||
        "",
      logoDomain:
        stock.logoDomain ||
        "",
    };
  }
}

async function enrichCandidates(
  candidates,
) {
  if (
    !Array.isArray(
      candidates,
    ) ||
    candidates.length === 0
  ) {
    return [];
  }

  const symbols =
    candidates.map(
      (stock) =>
        stock.yahooSymbol,
    );

  let quoteMap =
    new Map();

  try {
    const quoteResult =
      await withRetry(
        () =>
          yahooFinance.quote(
            symbols,
          ),
        {
          attempts: 2,
          delayMs: 500,
          label:
            "Search suggestion prices",
        },
      );

    const quotes =
      Array.isArray(
        quoteResult,
      )
        ? quoteResult
        : quoteResult
          ? [quoteResult]
          : [];

    quoteMap =
      new Map(
        quotes
          .filter(
            (quote) =>
              quote?.symbol,
          )
          .map((quote) => [
            String(
              quote.symbol,
            ).toUpperCase(),
            quote,
          ]),
      );
  } catch (error) {
    console.warn(
      "Suggestion prices unavailable:",
      error instanceof Error
        ? error.message
        : error,
    );
  }

  const profiles =
    await Promise.all(
      candidates.map(
        (stock) =>
          getCompanyProfile(
            stock,
          ),
      ),
    );

  return candidates.map(
    (stock, index) => {
      const symbol =
        stock.yahooSymbol;

      const quote =
        quoteMap.get(
          String(
            symbol,
          ).toUpperCase(),
        ) || {};

      const profile =
        profiles[index] || {};

      const companyUrl =
        profile.website ||
        stock.website ||
        "";

      return {
        symbol,

        name:
          quote.longName ||
          quote.shortName ||
          stock.name,

        exchange:
          stock.exchange ||
          quote.fullExchangeName ||
          quote.exchange ||
          "",

        quoteType:
          "EQUITY",

        type:
          "Equity",

        price:
          numberOrNull(
            quote.regularMarketPrice,
          ),

        change:
          numberOrNull(
            quote.regularMarketChange,
          ),

        changePercent:
          numberOrNull(
            quote
              .regularMarketChangePercent,
          ),

        currency:
          quote.currency ||
          "INR",

        marketState:
          quote.marketState ||
          null,

        isin:
          stock.isin ||
          "",

        nseSymbol:
          stock.nseSymbol ||
          "",

        bseSecurityId:
          stock.bseSecurityId ||
          "",

        bseCode:
          stock.bseCode ||
          "",

        website:
          companyUrl,

        companyUrl,

        logoDomain:
          profile.logoDomain ||
          stock.logoDomain ||
          getDomain(
            companyUrl,
          ),

        nseUrl:
          stock.nseUrl ||
          "",

        bseUrl:
          stock.bseUrl ||
          "",
      };
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
    if (
      STOCK_MASTER.length === 0
    ) {
      return res.status(500).json({
        error: {
          code:
            "STOCK_MASTER_MISSING",
          message:
            "Run npm run build:stock-master before starting the app.",
        },
      });
    }

    const popular =
      String(
        getQueryValue(
          req,
          "popular",
        ) || "",
      ) === "1";

    const query =
      cleanText(
        getQueryValue(
          req,
          "q",
        ) ||
        getQueryValue(
          req,
          "query",
        ),
      );

    if (!popular && !query) {
      return res.status(400).json({
        error: {
          code:
            "SEARCH_QUERY_REQUIRED",
          message:
            "Please enter a company name or stock symbol.",
        },
      });
    }

    const cacheKey =
      popular
        ? "__popular__"
        : query.toLowerCase();

    const cached =
      getCachedValue(
        searchCache,
        cacheKey,
        SEARCH_CACHE_DURATION_MS,
      );

    if (cached) {
      return res
        .status(200)
        .json(cached);
    }

    const candidates =
      popular
        ? getPopularStocks()
        : searchLocalMaster(
            query,
          );

    const results =
      await enrichCandidates(
        candidates,
      );

    setCachedValue(
      searchCache,
      cacheKey,
      results,
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=15, stale-while-revalidate=30",
    );

    return res
      .status(200)
      .json(results);
  } catch (error) {
    console.error(
      "Stock search failed:",
      error,
    );

    const temporaryFailure =
      isRetryableError(error);

    return res
      .status(
        temporaryFailure
          ? 503
          : 500,
      )
      .json({
        error: {
          code:
            temporaryFailure
              ? "YAHOO_TEMPORARILY_UNAVAILABLE"
              : "STOCK_SEARCH_FAILED",

          message:
            temporaryFailure
              ? "Live suggestion prices are temporarily unavailable."
              : "Unable to search stocks.",
        },

        details:
          process.env.NODE_ENV !==
          "production"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      });
  }
}